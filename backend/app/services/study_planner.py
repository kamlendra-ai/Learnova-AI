import json
import logging
from typing import Any, Dict, List

from app.services.ai_provider import AIError, get_ai_provider
from app.services.json_parser import (
    clean_and_extract_json,
    validate_study_plan_schema,
)

logger = logging.getLogger("learnova.study_planner")


def generate_study_plan(
    course_name: str,
    course_level: str,
    units: List[Any],
    days: int = 30,
) -> Dict[str, Any]:
    """
    Generate a day-by-day structured study plan covering syllabus units,
    integrating conceptual learning, practice problems, and periodic revision.
    """
    clean_course = (course_name or "").strip()
    if not clean_course:
        raise ValueError("Course name is required to generate a study plan.")

    if not units or not isinstance(units, list):
        raise ValueError("At least one syllabus unit is required to generate a study plan.")

    if days < 1 or days > 365:
        raise ValueError("Study plan duration must be between 1 and 365 days.")

    syllabus_summary = {
        "course_name": clean_course,
        "course_level": (course_level or "Beginner").strip(),
        "units": units,
    }

    prompt = f"""
You are an expert academic tutor and curriculum planner for Learnova AI.

Create a realistic, pedagogically sound {days}-day study plan for the course detailed below.

Course Curriculum:
{json.dumps(syllabus_summary, indent=2)}

Requirements:
- Plan exactly {days} day(s) if duration <= 30 days, or strategically pace milestones across {days} days.
- Ensure every major unit and topic is scheduled.
- Sequence easier, foundational concepts before advanced topics.
- Schedule periodic revision days (e.g. every 5-7 days) and practice/assessment days.
- Give each day a concrete focus, specific topics, realistic estimated hours (1-4 hours), and priority.
- Do NOT output conversational commentary or unformatted markdown.
- Return ONLY valid JSON matching the following schema.

Required JSON format:
{{
  "course_name": "{clean_course}",
  "duration_days": {days},
  "daily_plan": [
    {{
      "day": 1,
      "focus": "Clear summary of daily objective",
      "topics": ["Specific topic 1", "Specific topic 2"],
      "estimated_hours": 2.0,
      "activity": "Learn / Practice / Revision / Assessment",
      "priority": "High / Medium / Low"
    }}
  ]
}}
"""

    provider = get_ai_provider()

    try:
        raw_output, metadata = provider.generate_text(
            prompt=prompt,
            temperature=0.2,
            system_instruction="You are an expert academic curriculum scheduler. Return only valid JSON matching the schema.",
        )
        logger.info(
            "Study plan generated with model '%s' (fallback: %s)",
            metadata.get("model"),
            metadata.get("is_fallback"),
        )
    except AIError as err:
        logger.error("AI generation failed during study plan generation: %s", str(err))
        raise ValueError(f"Study plan generation failed: {str(err)}") from err

    try:
        parsed = clean_and_extract_json(raw_output)
        return validate_study_plan_schema(parsed, clean_course, days)
    except Exception as err:
        logger.warning("Failed to validate study plan JSON: %s. Generating fallback plan.", str(err))
        # Provide a structured algorithmic fallback plan based on the syllabus units
        fallback_daily = []
        all_topics = []
        for u in units:
            if isinstance(u, dict):
                for t in u.get("topics", []):
                    all_topics.append(str(t).strip())

        if not all_topics:
            all_topics = [f"Unit {i+1} Core Concepts" for i in range(len(units))]

        days_count = min(days, max(len(all_topics), 5))
        for d in range(1, days_count + 1):
            topic_idx = (d - 1) % len(all_topics)
            is_rev = d % 5 == 0
            fallback_daily.append(
                {
                    "day": d,
                    "focus": f"Review & Practice" if is_rev else f"Master {all_topics[topic_idx]}",
                    "topics": [all_topics[topic_idx]] if not is_rev else ["Cumulative Revision"],
                    "estimated_hours": 2.0,
                    "activity": "Revision" if is_rev else "Learn",
                    "priority": "High" if is_rev else "Medium",
                }
            )

        return {
            "course_name": clean_course,
            "duration_days": days,
            "daily_plan": fallback_daily,
        }