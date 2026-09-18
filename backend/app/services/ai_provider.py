from abc import ABC, abstractmethod
import os
from typing import Any, Dict, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()


class AIError(Exception):
    """Base exception for all AI provider errors."""
    pass


class AIAuthenticationError(AIError):
    """Raised when API credentials or keys are invalid or missing."""
    pass


class AIModelNotFoundError(AIError):
    """Raised when the specified AI model does not exist or is unavailable (HTTP 404)."""
    pass


class AIRateLimitError(AIError):
    """Raised when rate limits or quotas are exceeded (HTTP 429)."""
    pass


class AIServiceUnavailableError(AIError):
    """Raised when the upstream service is temporarily overloaded or unavailable (HTTP 503)."""
    pass


class AIEmptyResponseError(AIError):
    """Raised when the AI model returns an empty or whitespace-only response."""
    pass


class BaseAIProvider(ABC):
    """Abstract base class for all Learnova AI generation providers."""

    @abstractmethod
    def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate text from prompt.

        Returns:
            Tuple[str, Dict[str, Any]]: (generated_text, provider_metadata)
        """
        pass

    @abstractmethod
    def get_status(self) -> Dict[str, Any]:
        """Return provider readiness and metadata."""
        pass


def get_ai_provider(provider_type: Optional[str] = None) -> BaseAIProvider:
    """
    Factory to retrieve the active AI provider.
    Defaults to environment variable AI_PROVIDER or 'cloud'.
    """
    selected_provider = (provider_type or os.getenv("AI_PROVIDER", "cloud")).lower().strip()

    if selected_provider == "local":
        from app.services.local_ai import LocalAIProvider
        return LocalAIProvider()

    from app.services.cloud_ai import CloudAIProvider
    return CloudAIProvider()
