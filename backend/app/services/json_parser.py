import json
import re
from typing import Any, Dict, List, Optional


class JSONParseError(ValueError):
    """Raised when text cannot be parsed into valid JSON."""
    pass


class SchemaValidationError(ValueError):
    """Raised when JSON does not conform to the expected schema."""
    pass


def clean_and_extract_json(raw_text: str) -> Any:
    """
    Safely extract and parse JSON from model output.
    Handles:
    - Markdown code fences (```json ... ``` or ``` ... ```)
    - Surrounding conversational commentary
    - Trailing commas before closing brackets
    """
    if not raw_text or not raw_text.strip():
        raise JSONParseError("AI returned an empty response; cannot parse JSON.")

    cleaned = raw_text.strip()

    # Match code block fences
    fence_pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
    fence_match = re.search(fence_pattern, cleaned, re.IGNORECASE)
    if fence_match:
        cleaned = fence_match.group(1).strip()

    # Try standard json.loads first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Find the outer JSON boundaries ({ ... } or [ ... ])
    first_brace = cleaned.find("{")
    first_bracket = cleaned.find("[")

    start_idx = -1
    is_object = True

    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
        start_idx = first_brace
        end_idx = cleaned.rfind("}")
        is_object = True
    elif first_bracket != -1:
        start_idx = first_bracket
        end_idx = cleaned.rfind("]")
        is_object = False
    else:
        raise JSONParseError("No JSON object or array found in model response.")

    if start_idx == -1 or end_idx == -1 or end_idx <= start_idx:
        raise JSONParseError("Malformed JSON boundaries in model response.")

    extracted = cleaned[start_idx : end_idx + 1]

    # Attempt parsing the extracted substring
    try:
        return json.loads(extracted)
    except json.JSONDecodeError:
        pass

    # Attempt minor repair: remove trailing commas before } or ]
    repaired = re.sub(r",\s*([\]}])", r"\1", extracted)
    try:
        return json.loads(repaired)
    except json.JSONDecodeError as err:
        raise JSONParseError(
            f"Failed to parse model output as valid JSON: {str(err)}"
        ) from err


def validate_syllabus_schema(data: Any, fallback_course_name: str = "Extracted Course") -> Dict[str, Any]:
    """
    Validate syllabus analysis JSON schema:
    - course_name: str
    - course_level: str
    - units: list of {unit, title, topics, difficulty, important}
    - important_topics: list of str
    """
    if not isinstance(data, dict):
        raise SchemaValidationError("Syllabus analysis response must be a JSON object.")

    course_name = str(data.get("course_name") or fallback_course_name).strip()
    course_level = str(data.get("course_level") or "Beginner").strip()

    raw_units = data.get("units")
    if not isinstance(raw_units, list):
        raw_units = []

    validated_units: List[Dict[str, Any]] = []
    for idx, unit_item in enumerate(raw_units, start=1):
        if not isinstance(unit_item, dict):
            continue

        unit_num = unit_item.get("unit", idx)
        title = str(unit_item.get("title") or f"Unit {idx}").strip()
        raw_topics = unit_item.get("topics", [])
        if not isinstance(raw_topics, list):
            raw_topics = []

        clean_topics = [
            str(t).strip() for t in raw_topics if str(t).strip()
        ]

        difficulty = str(unit_item.get("difficulty") or "Medium").capitalize()
        if difficulty not in ("Easy", "Medium", "Hard"):
            difficulty = "Medium"

        important = bool(unit_item.get("important", False))

        if clean_topics or title:
            validated_units.append(
                {
                    "unit": unit_num,
                    "title": title,
                    "topics": clean_topics,
                    "difficulty": difficulty,
                    "important": important,
                }
            )

    raw_important = data.get("important_topics", [])
    if not isinstance(raw_important, list):
        raw_important = []
    important_topics = [str(t).strip() for t in raw_important if str(t).strip()]

    # If no important_topics provided but units have important topics, synthesize list
    if not important_topics and validated_units:
        for u in validated_units:
            if u["important"]:
                important_topics.extend(u["topics"][:3])
            elif not important_topics:
                important_topics.extend(u["topics"][:2])

    return {
        "course_name": course_name,
        "course_level": course_level,
        "units": validated_units,
        "important_topics": list(dict.fromkeys(important_topics)),
    }


def validate_study_plan_schema(data: Any, default_course_name: str, duration_days: int) -> Dict[str, Any]:
    """
    Validate study plan JSON schema:
    - course_name: str
    - duration_days: int
    - daily_plan: list of {day, focus, topics, estimated_hours, activity, priority}
    """
    if not isinstance(data, dict):
        raise SchemaValidationError("Study plan response must be a JSON object.")

    course_name = str(data.get("course_name") or default_course_name).strip()
    plan_days = int(data.get("duration_days") or duration_days)

    raw_plan = data.get("daily_plan")
    if not isinstance(raw_plan, list) or not raw_plan:
        raise SchemaValidationError("Study plan must contain a non-empty 'daily_plan' array.")

    validated_days: List[Dict[str, Any]] = []
    for idx, day_item in enumerate(raw_plan, start=1):
        if not isinstance(day_item, dict):
            continue

        day_num = int(day_item.get("day") or idx)
        focus = str(day_item.get("focus") or f"Session {idx}").strip()
        raw_topics = day_item.get("topics", [])
        if not isinstance(raw_topics, list):
            raw_topics = []
        topics = [str(t).strip() for t in raw_topics if str(t).strip()]

        try:
            est_hours = float(day_item.get("estimated_hours", 2.0))
        except (ValueError, TypeError):
            est_hours = 2.0

        activity = str(day_item.get("activity") or "Learn & Practice").strip()
        priority = str(day_item.get("priority") or "Medium").capitalize()
        if priority not in ("High", "Medium", "Low"):
            priority = "Medium"

        validated_days.append(
            {
                "day": day_num,
                "focus": focus,
                "topics": topics,
                "estimated_hours": est_hours,
                "activity": activity,
                "priority": priority,
            }
        )

    if not validated_days:
        raise SchemaValidationError("Study plan contains no valid daily items.")

    return {
        "course_name": course_name,
        "duration_days": plan_days,
        "daily_plan": validated_days,
    }


def validate_lesson_schema(data: Any, topic: str) -> Dict[str, Any]:
    """
    Validate educational lesson schema with all required instructional components.
    """
    if not isinstance(data, dict):
        raise SchemaValidationError("Lesson response must be a JSON object.")

    topic_title = str(data.get("topic") or topic).strip()
    intro = str(data.get("introduction") or f"Introduction to {topic_title}").strip()
    definition = str(data.get("definition") or f"Core definition of {topic_title}").strip()
    explanation = str(
        data.get("detailed_explanation")
        or f"Detailed explanation for understanding {topic_title} in depth."
    ).strip()

    # Step-by-step how_it_works
    raw_how = data.get("how_it_works", [])
    how_it_works = []
    if isinstance(raw_how, list):
        for item in raw_how:
            if isinstance(item, dict) and item.get("title"):
                how_it_works.append(
                    {
                        "title": str(item["title"]).strip(),
                        "description": str(item.get("description", "")).strip(),
                    }
                )

    # Real world examples
    raw_examples = data.get("real_world_examples", [])
    real_world_examples = []
    if isinstance(raw_examples, list):
        for item in raw_examples:
            if isinstance(item, dict) and item.get("example"):
                real_world_examples.append(
                    {
                        "example": str(item["example"]).strip(),
                        "explanation": str(item.get("explanation", "")).strip(),
                    }
                )

    # Important concepts
    raw_concepts = data.get("important_concepts", [])
    important_concepts = []
    if isinstance(raw_concepts, list):
        for item in raw_concepts:
            if isinstance(item, dict) and item.get("title"):
                important_concepts.append(
                    {
                        "title": str(item["title"]).strip(),
                        "description": str(item.get("description", "")).strip(),
                    }
                )

    def extract_string_list(key: str) -> List[str]:
        val = data.get(key, [])
        if isinstance(val, list):
            return [str(item).strip() for item in val if str(item).strip()]
        return []

    return {
        "topic": topic_title,
        "introduction": intro,
        "definition": definition,
        "detailed_explanation": explanation,
        "how_it_works": how_it_works,
        "real_world_examples": real_world_examples,
        "important_concepts": important_concepts,
        "practical_example": str(data.get("practical_example") or "").strip(),
        "advantages": extract_string_list("advantages"),
        "limitations": extract_string_list("limitations"),
        "common_mistakes": extract_string_list("common_mistakes"),
        "exam_interview_points": extract_string_list("exam_interview_points"),
        "quick_revision": extract_string_list("quick_revision"),
        "practice_questions": extract_string_list("practice_questions"),
    }


def validate_quiz_schema(data: Any, expected_question_count: int = 5) -> Dict[str, Any]:
    """
    Validate quiz JSON schema:
    - title: str
    - questions: list of exactly expected_question_count
    - each question: question (str), options (4 strings), correct_answer (matching one of options), explanation (str)
    """
    if not isinstance(data, dict):
        raise SchemaValidationError("Quiz response must be a JSON object.")

    title = str(data.get("title") or "Topic Quiz").strip()
    raw_questions = data.get("questions")

    if not isinstance(raw_questions, list):
        raise SchemaValidationError("Quiz response must contain a 'questions' array.")

    validated_questions = []

    for idx, q_item in enumerate(raw_questions, start=1):
        if not isinstance(q_item, dict):
            raise SchemaValidationError(f"Question #{idx} is not a valid object.")

        question_text = str(q_item.get("question") or "").strip()
        if not question_text:
            raise SchemaValidationError(f"Question #{idx} has an empty question text.")

        raw_options = q_item.get("options")
        if not isinstance(raw_options, list) or len(raw_options) != 4:
            raise SchemaValidationError(
                f"Question #{idx} must have exactly 4 options. Found: {len(raw_options) if isinstance(raw_options, list) else 0}."
            )

        clean_options = [str(opt).strip() for opt in raw_options]
        if any(not opt for opt in clean_options):
            raise SchemaValidationError(f"Question #{idx} contains empty options.")

        correct = str(q_item.get("correct_answer") or "").strip()
        if correct not in clean_options:
            # Check for case-insensitive match or index indicator like "Option A"
            match_found = False
            for opt in clean_options:
                if opt.lower() == correct.lower():
                    correct = opt
                    match_found = True
                    break

            if not match_found:
                raise SchemaValidationError(
                    f"Question #{idx} correct_answer ('{correct}') does not match any of the 4 options."
                )

        explanation = str(q_item.get("explanation") or f"The correct answer is: {correct}").strip()

        validated_questions.append(
            {
                "question": question_text,
                "options": clean_options,
                "correct_answer": correct,
                "explanation": explanation,
            }
        )

    if len(validated_questions) != expected_question_count:
        raise SchemaValidationError(
            f"Quiz must contain exactly {expected_question_count} questions. Generated: {len(validated_questions)}."
        )

    return {
        "title": title,
        "questions": validated_questions,
    }
