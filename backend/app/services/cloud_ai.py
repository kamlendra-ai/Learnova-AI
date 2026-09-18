import logging
import os
import time
from typing import Any, Dict, Optional, Tuple

from dotenv import load_dotenv
from google import genai
from google.genai import errors

from app.services.ai_provider import (
    AIAuthenticationError,
    AIEmptyResponseError,
    AIError,
    AIModelNotFoundError,
    AIRateLimitError,
    AIServiceUnavailableError,
    BaseAIProvider,
)

load_dotenv()

logger = logging.getLogger("learnova.cloud_ai")


class CloudAIProvider(BaseAIProvider):
    """
    Robust Google Gemini Cloud AI provider implementing:
    - Lazy client initialization
    - Exponential backoff retry for transient 503/429 errors
    - Automatic fallback to secondary model on 404 or repeated 503
    - Disabling AFC to prevent warnings
    - Safe error reporting without key leakage
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        primary_model: Optional[str] = None,
        fallback_model: Optional[str] = None,
        max_retries: int = 3,
        initial_backoff: float = 1.0,
        backoff_multiplier: float = 2.0,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.primary_model = (
            primary_model or os.getenv("CLOUD_AI_MODEL", "gemini-3.5-flash")
        ).strip()
        self.fallback_model = (
            fallback_model
            or os.getenv("CLOUD_AI_FALLBACK_MODEL", "gemini-3.5-flash-lite")
        ).strip()
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.backoff_multiplier = backoff_multiplier
        self._client: Optional[genai.Client] = None

    def _get_client(self) -> genai.Client:
        """Lazily initialize and validate the Gemini API client."""
        if not self.api_key:
            raise AIAuthenticationError(
                "GEMINI_API_KEY is not configured in environment variables."
            )
        if self._client is None:
            self._client = genai.Client(api_key=self.api_key)
        return self._client

    def _is_cloud_allowed(self) -> bool:
        """Check user privacy toggle for cloud processing."""
        allowed = os.getenv("ALLOW_CLOUD_PROCESSING", "true").lower().strip()
        return allowed in ("true", "1", "yes")

    def _execute_with_retries(
        self,
        model_name: str,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None,
    ) -> str:
        """
        Execute generation against a specific model with exponential backoff retries.
        """
        client = self._get_client()

        # Build config: disable AFC to eliminate automatic function calling warning
        config: Dict[str, Any] = {
            "temperature": temperature,
            "automatic_function_calling": {"disable": True},
        }
        if system_instruction:
            config["system_instruction"] = system_instruction

        last_error: Optional[Exception] = None

        for attempt in range(1, self.max_retries + 1):
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config,
                )

                if not response or not response.text or not response.text.strip():
                    raise AIEmptyResponseError(
                        f"Model '{model_name}' returned an empty response."
                    )

                return response.text.strip()

            except errors.APIError as err:
                last_error = err
                code = getattr(err, "code", None)

                # 404: Model not found -> Fail immediately to trigger fallback
                if code == 404:
                    raise AIModelNotFoundError(
                        f"Model '{model_name}' is not found or unavailable (404)."
                    ) from err

                # 401/403: Authentication issues -> Never retry
                if code in (401, 403):
                    raise AIAuthenticationError(
                        "Authentication failed for Gemini API. Please check your GEMINI_API_KEY."
                    ) from err

                # 429: Rate limit or 503/5xx: Service overloaded -> Retry with backoff
                if code == 429 or (code and 500 <= code < 600):
                    if attempt < self.max_retries:
                        delay = self.initial_backoff * (
                            self.backoff_multiplier ** (attempt - 1)
                        )
                        logger.warning(
                            "Gemini API returned status %s on model '%s'. "
                            "Retrying in %.1fs (attempt %d/%d)...",
                            code,
                            model_name,
                            delay,
                            attempt,
                            self.max_retries,
                        )
                        time.sleep(delay)
                        continue
                    else:
                        if code == 429:
                            raise AIRateLimitError(
                                f"Gemini API rate limit exceeded on model '{model_name}' (429)."
                            ) from err
                        raise AIServiceUnavailableError(
                            f"Gemini API service temporarily unavailable on model '{model_name}' ({code})."
                        ) from err

                # Other client errors (e.g. 400 bad request)
                raise AIError(f"Gemini API error ({code}): {err.message or err}") from err

            except AIEmptyResponseError:
                raise

            except Exception as err:
                last_error = err
                # Network or connection issues
                if attempt < self.max_retries:
                    delay = self.initial_backoff * (
                        self.backoff_multiplier ** (attempt - 1)
                    )
                    logger.warning(
                        "Network/transient error calling model '%s': %s. "
                        "Retrying in %.1fs (attempt %d/%d)...",
                        model_name,
                        str(err),
                        delay,
                        attempt,
                        self.max_retries,
                    )
                    time.sleep(delay)
                    continue
                raise AIServiceUnavailableError(
                    f"Connection to Gemini API failed after {self.max_retries} attempts: {str(err)}"
                ) from err

        if last_error:
            raise AIError(f"Generation failed: {str(last_error)}") from last_error
        raise AIError("Generation failed with unknown error.")

    def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate text using the primary model, automatically falling back
        to the fallback model if primary fails with 404, 429, or 503.
        """
        if not self._is_cloud_allowed():
            raise AIError(
                "Cloud AI processing is disabled by configuration (ALLOW_CLOUD_PROCESSING=false)."
            )

        metadata: Dict[str, Any] = {
            "provider": "cloud",
            "model": self.primary_model,
            "is_fallback": False,
        }

        try:
            text = self._execute_with_retries(
                model_name=self.primary_model,
                prompt=prompt,
                temperature=temperature,
                system_instruction=system_instruction,
            )
            return text, metadata

        except (AIModelNotFoundError, AIServiceUnavailableError, AIRateLimitError) as primary_err:
            # If fallback model is different, attempt fallback
            if (
                self.fallback_model
                and self.fallback_model != self.primary_model
            ):
                logger.warning(
                    "Primary model '%s' failed (%s). Attempting fallback model '%s'...",
                    self.primary_model,
                    str(primary_err),
                    self.fallback_model,
                )
                try:
                    text = self._execute_with_retries(
                        model_name=self.fallback_model,
                        prompt=prompt,
                        temperature=temperature,
                        system_instruction=system_instruction,
                    )
                    metadata["model"] = self.fallback_model
                    metadata["is_fallback"] = True
                    metadata["fallback_reason"] = str(primary_err)
                    return text, metadata
                except Exception as fallback_err:
                    logger.error(
                        "Fallback model '%s' also failed: %s",
                        self.fallback_model,
                        str(fallback_err),
                    )
                    raise fallback_err from primary_err

            raise primary_err

    def get_status(self) -> Dict[str, Any]:
        """Return cloud provider configuration status without exposing secrets."""
        has_key = bool(self.api_key and len(self.api_key) > 5)
        return {
            "provider": "cloud",
            "configured": has_key,
            "primary_model": self.primary_model,
            "fallback_model": self.fallback_model,
            "cloud_allowed": self._is_cloud_allowed(),
        }


# Global instance for legacy convenience
_cloud_provider_instance: Optional[CloudAIProvider] = None


def get_cloud_ai_provider() -> CloudAIProvider:
    global _cloud_provider_instance
    if _cloud_provider_instance is None:
        _cloud_provider_instance = CloudAIProvider()
    return _cloud_provider_instance


def generate_cloud_response(
    prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.2,
    system_instruction: Optional[str] = None,
) -> str:
    """
    Backwards-compatible convenience function for legacy callers.
    """
    provider = get_cloud_ai_provider()
    if model:
        # If a specific model was requested by legacy caller
        text = provider._execute_with_retries(
            model_name=model,
            prompt=prompt,
            temperature=temperature,
            system_instruction=system_instruction,
        )
        return text

    text, _ = provider.generate_text(
        prompt=prompt,
        temperature=temperature,
        system_instruction=system_instruction,
    )
    return text