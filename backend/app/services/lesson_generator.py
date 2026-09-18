import logging
from typing import Any, Dict

from app.services.ai_provider import AIError, get_ai_provider
from app.services.json_parser import (
    clean_and_extract_json,
    validate_lesson_schema,
)

logger = logging.getLogger("learnova.lesson_generator")


def generate_lesson(
    course_name: str,
    course_level: str,
    topic: str,
) -> Dict[str, Any]:
    """
    Generate an in-depth, structured learning lesson for a specific topic,
    covering conceptual definitions, practical examples, common mistakes, and exam review.
    """
    clean_course = (course_name or "").strip()
    clean_topic = (topic or "").strip()

    if not clean_course:
        raise ValueError("Course name is required to generate a lesson.")
    if not clean_topic:
        raise ValueError("Topic name is required to generate a lesson.")

    level = (course_level or "Beginner").strip()

    prompt = f"""
You are an expert interactive AI educator for Learnova AI.

Create a comprehensive, student-friendly lesson teaching the topic '{clean_topic}' for the course '{clean_course}' (Level: {level}).

Your output MUST be ONLY valid JSON adhering strictly to the schema below.

Required JSON format:
{{
  "topic": "{clean_topic}",
  "introduction": "An engaging, friendly opening explaining why this concept matters.",
  "definition": "A clear, concise, jargon-free formal definition.",
  "detailed_explanation": "Thorough breakdown explaining the inner principles, mechanics, and context.",
  "how_it_works": [
    {{
      "title": "Step 1 or Phase name",
      "description": "Clear explanation of how this step operates."
    }}
  ],
  "real_world_examples": [
    {{
      "example": "Scenario or industry application",
      "explanation": "How the concept directly solves this problem."
    }}
  ],
  "important_concepts": [
    {{
      "title": "Key term or sub-concept",
      "description": "Essential detail students must remember."
    }}
  ],
  "practical_example": "Concrete code snippet, calculation, or step-by-step walkthrough.",
  "advantages": [
    "Primary benefit or strength"
  ],
  "limitations": [
    "Known trade-off or constraint"
  ],
  "common_mistakes": [
    "Frequent pitfall students encounter and how to avoid it"
  ],
  "exam_interview_points": [
    "High-yield point often tested in university exams or technical interviews"
  ],
  "quick_revision": [
    "Bullet summary item for rapid 2-minute review"
  ],
  "practice_questions": [
    "Self-test question to verify understanding"
  ]
}}

Rules:
- Ensure all 13 sections are populated with high educational quality.
- Keep language approachable without sacrificing technical accuracy.
- Return ONLY the JSON object.
"""

    provider = get_ai_provider()

    try:
        raw_output, metadata = provider.generate_text(
            prompt=prompt,
            temperature=0.2,
            system_instruction="You are an expert educational writer. Output only valid JSON.",
        )
        logger.info(
            "Lesson for '%s' generated with model '%s' (fallback: %s)",
            clean_topic,
            metadata.get("model"),
            metadata.get("is_fallback"),
        )
    except AIError as err:
        logger.error("AI generation failed for lesson '%s': %s", clean_topic, str(err))
        raise ValueError(f"Lesson generation failed: {str(err)}") from err

    try:
        parsed = clean_and_extract_json(raw_output)
        return validate_lesson_schema(parsed, clean_topic)
    except Exception as err:
        logger.warning(
            "Lesson JSON parsing failed for '%s': %s. Returning structured fallback.",
            clean_topic,
            str(err),
        )
        return {
            "topic": clean_topic,
            "introduction": f"Welcome to the foundational study of {clean_topic} in {clean_course}.",
            "definition": f"{clean_topic} is a fundamental concept in {clean_course}.",
            "detailed_explanation": f"Understanding {clean_topic} enables students to build solid mastery in {clean_course}.",
            "how_it_works": [
                {
                    "title": "Fundamentals",
                    "description": f"Core principles governing {clean_topic}.",
                }
            ],
            "real_world_examples": [
                {
                    "example": "Standard Implementation",
                    "explanation": f"Applied use of {clean_topic} in modern practice.",
                }
            ],
            "important_concepts": [
                {
                    "title": "Core Theory",
                    "description": "Foundational premise required for exams and applications.",
                }
            ],
            "practical_example": f"Applied exercise demonstrating {clean_topic}.",
            "advantages": ["Improves problem solving", "Core foundational knowledge"],
            "limitations": ["Requires understanding of basics"],
            "common_mistakes": ["Confusing terminology", "Skipping step-by-step validation"],
            "exam_interview_points": [f"Frequently tested concept in {clean_course}"],
            "quick_revision": [f"Remember key principles of {clean_topic}"],
            "practice_questions": [f"Explain the purpose of {clean_topic} in your own words."],
        }