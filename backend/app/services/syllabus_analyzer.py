import json
import os

from dotenv import load_dotenv
from google import genai


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

client = genai.Client(api_key=api_key)


def analyze_syllabus(text: str) -> dict:
    prompt = f"""
Return ONLY valid JSON for this syllabus.

Schema:
{{
  "course_name": "...",
  "course_level": "...",
  "units": [
    {{
      "unit": 1,
      "title": "...",
      "topics": ["...", "..."],
      "difficulty": "...",
      "important": true
    }}
  ],
  "important_topics": ["...", "..."]
}}

Rules:
- Use only information from the syllabus.
- Keep topics short.
- No explanations.
- No study plan.
- No quiz.
- No questions.
- JSON only.

SYLLABUS:
{text}
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0,
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
            "course_name": "Unknown",
            "course_level": "Unknown",
            "units": [],
            "important_topics": [],
            "raw_response": raw_output,
        }