import json

from app.services.syllabus_analyzer import client


def generate_lesson(
    course_name: str,
    course_level: str,
    topic: str,
) -> dict:
    prompt = f"""
You are an expert AI teacher for Learnova AI.

Teach the following topic to a student in a clear, detailed,
beginner-friendly way.

Course:
{course_name}

Course Level:
{course_level}

Topic:
{topic}

Create a complete learning lesson.

The lesson should contain:

1. Introduction
2. Simple Definition
3. Detailed Explanation
4. How It Works
5. Real-World Examples
6. Important Concepts
7. Practical Example
8. Advantages
9. Limitations
10. Common Mistakes
11. Exam/Interview Points
12. Quick Revision
13. Practice Questions

Rules:
- Explain concepts clearly.
- Use simple language.
- Use examples wherever useful.
- Do not assume advanced knowledge.
- Stay focused on the requested topic.
- Do not discuss unrelated topics.
- Return ONLY valid JSON.

Required JSON format:

{{
  "topic": "{topic}",
  "introduction": "...",
  "definition": "...",
  "detailed_explanation": "...",
  "how_it_works": [
    {{
      "title": "...",
      "description": "..."
    }}
  ],
  "real_world_examples": [
    {{
      "example": "...",
      "explanation": "..."
    }}
  ],
  "important_concepts": [
    {{
      "title": "...",
      "description": "..."
    }}
  ],
  "practical_example": "...",
  "advantages": [
    "..."
  ],
  "limitations": [
    "..."
  ],
  "common_mistakes": [
    "..."
  ],
  "exam_interview_points": [
    "..."
  ],
  "quick_revision": [
    "..."
  ],
  "practice_questions": [
    "..."
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

    except json.JSONDecodeError as error:
        raise ValueError(
            f"AI returned invalid lesson JSON: {error}"
        )