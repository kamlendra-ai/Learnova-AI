import os
import unittest
from unittest.mock import MagicMock, patch

from app.services.ai_provider import (
    AIAuthenticationError,
    AIEmptyResponseError,
    AIError,
    AIModelNotFoundError,
    AIRateLimitError,
    AIServiceUnavailableError,
)
from app.services.cloud_ai import CloudAIProvider
from app.services.local_ai import LocalAIProvider
from google.genai import errors


class TestAIProvider(unittest.TestCase):
    def test_cloud_provider_missing_key(self):
        provider = CloudAIProvider(api_key=None)
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            provider.api_key = ""
            with self.assertRaises(AIAuthenticationError):
                provider._get_client()

    def test_cloud_provider_disabled_privacy(self):
        provider = CloudAIProvider(api_key="fake-key-test")
        with patch.dict(os.environ, {"ALLOW_CLOUD_PROCESSING": "false"}):
            with self.assertRaises(AIError) as ctx:
                provider.generate_text("Hello")
            self.assertIn("disabled", str(ctx.exception).lower())

    def test_cloud_provider_empty_response(self):
        provider = CloudAIProvider(api_key="fake-key", max_retries=1)
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "   "
        mock_client.models.generate_content.return_value = mock_response

        with patch.object(provider, "_get_client", return_value=mock_client):
            with self.assertRaises(AIEmptyResponseError):
                provider._execute_with_retries("gemini-3.5-flash", "test prompt")

    def test_cloud_provider_503_retry_and_success(self):
        provider = CloudAIProvider(
            api_key="fake-key",
            max_retries=3,
            initial_backoff=0.01,
            backoff_multiplier=1.5,
        )
        mock_client = MagicMock()

        # First call raises 503, second call succeeds
        err_503 = errors.APIError(503, {"error": {"code": 503, "message": "Overloaded"}})
        success_resp = MagicMock()
        success_resp.text = "Success after retry"

        mock_client.models.generate_content.side_effect = [err_503, success_resp]

        with patch.object(provider, "_get_client", return_value=mock_client):
            text = provider._execute_with_retries("gemini-3.5-flash", "test prompt")
            self.assertEqual(text, "Success after retry")
            self.assertEqual(mock_client.models.generate_content.call_count, 2)

    def test_cloud_provider_404_immediate_fallback(self):
        provider = CloudAIProvider(
            api_key="fake-key",
            primary_model="unavailable-model",
            fallback_model="gemini-3.5-flash-lite",
            max_retries=1,
            initial_backoff=0.01,
        )
        mock_client = MagicMock()

        err_404 = errors.APIError(404, {"error": {"code": 404, "message": "Model not found"}})
        fallback_resp = MagicMock()
        fallback_resp.text = "Fallback output"

        # Primary call raises 404; fallback call succeeds
        mock_client.models.generate_content.side_effect = [err_404, fallback_resp]

        with patch.object(provider, "_get_client", return_value=mock_client):
            text, meta = provider.generate_text("test prompt")
            self.assertEqual(text, "Fallback output")
            self.assertTrue(meta["is_fallback"])
            self.assertEqual(meta["model"], "gemini-3.5-flash-lite")

    def test_local_ai_status_and_disabled(self):
        local_provider = LocalAIProvider(enabled=False)
        status = local_provider.get_status()
        self.assertFalse(status["enabled"])
        self.assertFalse(status["runtime_ready"])
        self.assertIn("Snapdragon", status["hardware_target"])
        self.assertIn("AMD", status["host_device"])

        with self.assertRaises(AIServiceUnavailableError) as ctx:
            local_provider.generate_text("test")
        self.assertIn("Local AI is currently disabled", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
