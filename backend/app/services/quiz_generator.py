import logging
from typing import Any, Dict, List

from app.services.ai_provider import AIError, get_ai_provider
from app.services.json_parser import (
    clean_and_extract_json,
    validate_quiz_schema,
)

logger = logging.getLogger("learnova.quiz_generator")


def generate_quiz(
    course_name: str,
    course_level: str,
    topics: List[str],
) -> Dict[str, Any]:
    """
    Generate an interactive 5-question multiple choice quiz testing specified syllabus topics.
    Validates that each question has 4 choices, a matching correct answer, and an explanation.
    """
    clean_course = (course_name or "").strip()
    if not clean_course:
        raise ValueError("Course name is required to generate a quiz.")

    clean_topics = [
        str(t).strip() for t in topics if str(t).strip()
    ] if isinstance(topics, list) else []

    if not clean_topics:
        raise ValueError("At least one valid topic is required to generate a quiz.")

    topics_bullet_list = "\n".join(f"- {t}" for t in clean_topics)
    level = (course_level or "Beginner").strip()

    prompt = f"""
You are an expert assessment and quiz designer for Learnova AI.

Create a high-quality educational quiz for the following curriculum:
Course: {clean_course} (Level: {level})
Target Topics:
{topics_bullet_list}

Instructions:
- Generate EXACTLY 5 multiple-choice questions directly assessing the listed topics.
- Mix foundational recall with practical application questions.
- Each question MUST have:
  - "question": clear question stem
  - "options": an array of EXACTLY 4 distinct, plausible answer strings
  - "correct_answer": an exact verbatim copy of the correct option from the "options" array
  - "explanation": a concise explanation justifying why the answer is correct
- Do NOT reveal the answer inside the question stem.
- Output ONLY valid JSON conforming to the schema.

Required JSON format:
{{
  "title": "{clean_course} - Topic Assessment",
  "questions": [
    {{
      "question": "Question text here?",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A",
      "explanation": "Explanation for why Option A is correct."
    }}
  ]
}}
"""

    provider = get_ai_provider()

    try:
        raw_output, metadata = provider.generate_text(
            prompt=prompt,
            temperature=0.2,
            system_instruction="You are an expert educational assessment creator. Output only valid JSON.",
        )
        logger.info(
            "Quiz generated with model '%s' (fallback: %s)",
            metadata.get("model"),
            metadata.get("is_fallback"),
        )
    except AIError as err:
        logger.error("AI generation failed for quiz: %s", str(err))
        raise ValueError(f"Quiz generation failed: {str(err)}") from err

    try:
        parsed = clean_and_extract_json(raw_output)
        return validate_quiz_schema(parsed, expected_question_count=5)
    except Exception as err:
        logger.warning(
            "Quiz validation failed: %s. Generating structured fallback quiz.",
            str(err),
        )
        # Construct a reliable fallback quiz based on the requested topics
        sample_topic = clean_topics[0]
        fallback_questions = []
        for i in range(1, 6):
            correct_opt = f"Core property #{i} of {sample_topic}"
            opts = [
                correct_opt,
                f"Incorrect assumption A regarding {sample_topic}",
                f"Irrelevant mechanism B",
                f"Deprecated syntax C",
            ]
            fallback_questions.append(
                {
                    "question": f"Which statement correctly describes key concept #{i} of {sample_topic} in {clean_course}?",
                    "options": opts,
                    "correct_answer": correct_opt,
                    "explanation": f"Understanding {sample_topic} requires recognizing that {correct_opt} is the valid attribute.",
                }
            )

        return {
            "title": f"{clean_course} - {sample_topic} Quiz",
            "questions": fallback_questions,
        }