import logging
from typing import Any, Dict

from app.services.ai_provider import AIError, get_ai_provider
from app.services.json_parser import (
    clean_and_extract_json,
    validate_syllabus_schema,
)

logger = logging.getLogger("learnova.syllabus_analyzer")

MAX_SYLLABUS_CHARS = 100_000


def analyze_syllabus(text: str) -> Dict[str, Any]:
    """
    Analyze extracted syllabus text using the centralized AI provider
    and return validated course structure, units, topics, and importance rankings.
    """
    if not text or not text.strip():
        raise ValueError("Syllabus text is empty. Please provide readable text.")

    cleaned_text = text.strip()
    if len(cleaned_text) > MAX_SYLLABUS_CHARS:
        logger.warning(
            "Syllabus length (%d chars) exceeds limit. Truncating to %d chars.",
            len(cleaned_text),
            MAX_SYLLABUS_CHARS,
        )
        cleaned_text = cleaned_text[:MAX_SYLLABUS_CHARS]

    prompt = f"""
You are an expert educational curriculum and syllabus analyzer for Learnova AI.

Analyze the following syllabus text thoroughly and return ONLY valid JSON conforming exactly to the required schema.

Required JSON schema:
{{
  "course_name": "Official or inferred course title",
  "course_level": "Beginner/Intermediate/Advanced",
  "units": [
    {{
      "unit": 1,
      "title": "Unit or Chapter Title",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "difficulty": "Easy/Medium/Hard",
      "important": true
    }}
  ],
  "important_topics": ["High priority topic 1", "High priority topic 2"]
}}

Rules:
- Extract all coherent units and topics found in the text.
- If unit numbers are not stated, number them sequentially (1, 2, 3...).
- Keep topic names concise and self-contained.
- Mark foundational or core topics as important: true.
- Do NOT output conversational prose, introductions, or markdown explanations.
- Output ONLY the JSON object.

Syllabus Content:
{cleaned_text}
"""

    provider = get_ai_provider()

    try:
        raw_output, metadata = provider.generate_text(
            prompt=prompt,
            temperature=0.1,
            system_instruction="You are an expert educational syllabus parser. You output only valid JSON.",
        )
        logger.info(
            "Syllabus analyzed with model '%s' (fallback: %s)",
            metadata.get("model"),
            metadata.get("is_fallback"),
        )
    except AIError as err:
        logger.error("AI generation failed during syllabus analysis: %s", str(err))
        raise ValueError(f"AI analysis failed: {str(err)}") from err

    try:
        parsed = clean_and_extract_json(raw_output)
        return validate_syllabus_schema(parsed)
    except Exception as err:
        logger.warning("Failed to parse or validate syllabus JSON: %s", str(err))
        # Provide a structured fallback preserving partial course info
        return {
            "course_name": "Extracted Course",
            "course_level": "Intermediate",
            "units": [
                {
                    "unit": 1,
                    "title": "General Curriculum",
                    "topics": ["Syllabus Overview"],
                    "difficulty": "Medium",
                    "important": True,
                }
            ],
            "important_topics": ["Syllabus Overview"],
            "raw_response": raw_output[:500],
        }