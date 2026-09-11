import json

from app.services.syllabus_analyzer import client


def generate_study_plan(
    course_name: str,
    course_level: str,
    units: list,
    days: int = 30,
) -> dict:
    syllabus_data = {
        "course_name": course_name,
        "course_level": course_level,
        "units": units,
    }

    prompt = f"""
You are an expert AI study planner.

Create a practical {days}-day study plan for the following course.

Course:
{json.dumps(syllabus_data, indent=2)}

Requirements:
- Cover all important units and topics.
- Start with easier concepts before harder concepts.
- Give each day a clear focus.
- Include revision days.
- Include practice/test recommendations.
- Keep the workload realistic for a student.
- Do not generate quizzes or questions yet.
- Keep each day's plan concise.

Return ONLY valid JSON.

Required JSON format:

{{
  "course_name": "{course_name}",
  "duration_days": {days},
  "daily_plan": [
    {{
      "day": 1,
      "focus": "Topic or unit",
      "topics": ["topic 1", "topic 2"],
      "estimated_hours": 2,
      "activity": "Learn",
      "priority": "High"
    }}
  ]
}}
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0.2,
        },
    )

    raw_output = response.text.strip()

    if raw_output.startswith("```json"):
        raw_output = raw_output[7:]

    if raw_output.startswith("```"):
        raw_output = raw_output[3:]

    if raw_output.endswith("```"):
        raw_output = raw_output[:-3]

    raw_output = raw_output.strip()

    try:
        return json.loads(raw_output)

    except json.JSONDecodeError:
        return {
            "course_name": course_name,
            "duration_days": days,
            "daily_plan": [],
            "raw_response": raw_output,
        }