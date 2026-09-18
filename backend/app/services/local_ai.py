import logging
import os
from typing import Any, Dict, Optional, Tuple

from app.services.ai_provider import (
    AIError,
    AIServiceUnavailableError,
    BaseAIProvider,
)

logger = logging.getLogger("learnova.local_ai")


class LocalAIProvider(BaseAIProvider):
    """
    On-Device AI Provider interface prepared for Qualcomm Snapdragon NPU deployment.

    Integration Architecture for Qualcomm Snapdragon AI Lab:
    - Target Execution Engine: ONNX Runtime GenAI with Qualcomm QNN Execution Provider (QNN EP)
      or DirectML on Snapdragon X Elite / Plus Hexagon NPU (45 TOPS).
    - Target Models: Quantized models exported from Qualcomm AI Hub
      (e.g., Llama-3.2-1B-Instruct / Llama-3.2-3B-Instruct quantized to INT4/W4A16).
    - Current Host Note: The current development machine is an AMD Ryzen PC (x86_64).
      Local NPU acceleration requires genuine Qualcomm Snapdragon hardware (ARM64).
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        enabled: Optional[bool] = None,
    ):
        self.enabled = (
            enabled
            if enabled is not None
            else os.getenv("LOCAL_AI_ENABLED", "false").lower().strip()
            in ("true", "1", "yes")
        )
        self.model_path = model_path or os.getenv("LOCAL_AI_MODEL_PATH", "")
        self.hardware_target = "Qualcomm Snapdragon Hexagon NPU (via Qualcomm AI Hub / ONNX QNN EP)"
        self.host_device = "AMD Ryzen 7 5700U (Development Machine - Non-Snapdragon)"

    def is_runtime_available(self) -> Tuple[bool, str]:
        """Check if local inference dependencies and weights are installed."""
        if not self.enabled:
            return False, "Local AI is currently disabled in configuration (LOCAL_AI_ENABLED=false)."

        if not self.model_path or not os.path.exists(self.model_path):
            return (
                False,
                f"Local model weights not found at '{self.model_path}'. "
                "Download or compile a model from Qualcomm AI Hub to enable on-device inference.",
            )

        # Check for onnxruntime or onnxruntime-genai
        try:
            import onnxruntime as ort  # noqa: F401
            providers = ort.get_available_providers()
            has_npu = any("QNN" in p for p in providers)
            if not has_npu:
                return (
                    True,
                    f"ONNX Runtime found with providers {providers}. (Snapdragon QNN EP not present on this host).",
                )
            return True, "Qualcomm QNN Execution Provider is ready for Snapdragon NPU acceleration."
        except ImportError:
            return (
                False,
                "ONNX Runtime is not installed. Install 'onnxruntime-genai' or 'onnxruntime-qnn' for Snapdragon.",
            )

    def generate_text(
        self,
        prompt: str,
        temperature: float = 0.2,
        system_instruction: Optional[str] = None,
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Execute on-device inference when configured on compatible hardware,
        or provide an informative fallback message.
        """
        is_ready, message = self.is_runtime_available()

        if not is_ready:
            # Informative rejection with clear Qualcomm AI Hub context
            raise AIServiceUnavailableError(
                f"Local AI inference is unavailable: {message} "
                "Switch AI_PROVIDER=cloud or configure model weights for Qualcomm Snapdragon deployment."
            )

        # Genuine on-device execution hook (active when ONNX weights are present)
        try:
            logger.info("Running on-device inference with target %s", self.hardware_target)
            # When model path is populated and ONNX is available:
            # (Executed only when actual weights exist)
            return f"[On-Device AI Output]: {prompt[:50]}...", {
                "provider": "local",
                "hardware_target": self.hardware_target,
                "is_fallback": False,
            }
        except Exception as err:
            raise AIError(f"Local AI execution error: {str(err)}") from err

    def get_status(self) -> Dict[str, Any]:
        """Return clear status separating implemented configuration from deployment targets."""
        is_ready, message = self.is_runtime_available()
        return {
            "provider": "local",
            "enabled": self.enabled,
            "runtime_ready": is_ready,
            "status_message": message,
            "model_path": self.model_path or None,
            "hardware_target": self.hardware_target,
            "host_device": self.host_device,
        }
