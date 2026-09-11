import json

from app.services.syllabus_analyzer import client


def generate_quiz(
    course_name: str,
    course_level: str,
    topics: list[str],
) -> dict:
    topics_text = "\n".join(
        f"- {topic}" for topic in topics
    )

    prompt = f"""
You are an expert educational quiz creator for Learnova AI.

Create a quiz for a student based ONLY on the topics provided below.

Course:
{course_name}

Course Level:
{course_level}

Topics:
{topics_text}

Create exactly 5 multiple-choice questions.

Each question must have:
- question
- options: exactly 4 options
- correct_answer: the exact correct option text
- explanation

Rules:
- Questions must be clear and student-friendly.
- Mix easy, medium, and slightly challenging questions.
- Do not create information unrelated to the topics.
- Only one option must be correct.
- Do not reveal the answer inside the question.
- Return ONLY valid JSON.

Required JSON format:

{{
  "title": "Day Quiz",
  "questions": [
    {{
      "question": "...",
      "options": [
        "...",
        "...",
        "...",
        "..."
      ],
      "correct_answer": "...",
      "explanation": "..."
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
        quiz = json.loads(raw_output)
    except json.JSONDecodeError as error:
        raise ValueError(
            f"AI returned invalid quiz JSON: {error}"
        )

    if not isinstance(quiz, dict):
        raise ValueError("Invalid quiz response.")

    questions = quiz.get("questions", [])

    if not isinstance(questions, list):
        raise ValueError("Invalid quiz questions.")

    if len(questions) != 5:
        raise ValueError(
            "AI must generate exactly 5 questions."
        )

    for question in questions:
        if not isinstance(question, dict):
            raise ValueError("Invalid question format.")

        options = question.get("options", [])

        if not isinstance(options, list) or len(options) != 4:
            raise ValueError(
                "Each question must have exactly 4 options."
            )

        if question.get("correct_answer") not in options:
            raise ValueError(
                "Correct answer must match one of the options."
            )

    return quiz