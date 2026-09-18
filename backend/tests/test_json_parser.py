import unittest

from app.services.json_parser import (
    JSONParseError,
    SchemaValidationError,
    clean_and_extract_json,
    validate_lesson_schema,
    validate_quiz_schema,
    validate_study_plan_schema,
    validate_syllabus_schema,
)


class TestJsonParser(unittest.TestCase):
    def test_clean_and_extract_json_fences(self):
        sample = """Here is the extracted syllabus:
```json
{
  "course_name": "Machine Learning",
  "course_level": "Advanced",
  "units": [],
  "important_topics": ["Neural Networks"]
}
```
Hope this helps!"""
        result = clean_and_extract_json(sample)
        self.assertEqual(result["course_name"], "Machine Learning")
        self.assertEqual(result["course_level"], "Advanced")

    def test_clean_and_extract_trailing_comma(self):
        sample = '{"course_name": "Operating Systems", "units": [],}'
        result = clean_and_extract_json(sample)
        self.assertEqual(result["course_name"], "Operating Systems")

    def test_clean_and_extract_invalid_json(self):
        with self.assertRaises(JSONParseError):
            clean_and_extract_json("This is purely plain text with no braces at all.")

    def test_clean_and_extract_empty_input(self):
        with self.assertRaises(JSONParseError):
            clean_and_extract_json("")

    def test_validate_syllabus_schema_valid(self):
        raw_data = {
            "course_name": "Data Structures",
            "course_level": "Intermediate",
            "units": [
                {
                    "unit": 1,
                    "title": "Trees & Graphs",
                    "topics": ["Binary Search Trees", "Dijkstra"],
                    "difficulty": "Hard",
                    "important": True,
                }
            ],
            "important_topics": ["Dijkstra"],
        }
        validated = validate_syllabus_schema(raw_data)
        self.assertEqual(validated["course_name"], "Data Structures")
        self.assertEqual(len(validated["units"]), 1)
        self.assertEqual(validated["units"][0]["difficulty"], "Hard")
        self.assertIn("Dijkstra", validated["important_topics"])

    def test_validate_syllabus_schema_invalid(self):
        with self.assertRaises(SchemaValidationError):
            validate_syllabus_schema(["not", "a", "dict"])

    def test_validate_study_plan_schema_valid(self):
        raw_plan = {
            "course_name": "Python 101",
            "duration_days": 10,
            "daily_plan": [
                {
                    "day": 1,
                    "focus": "Variables and Data Types",
                    "topics": ["integers", "strings"],
                    "estimated_hours": 1.5,
                    "activity": "Learn",
                    "priority": "High",
                }
            ],
        }
        validated = validate_study_plan_schema(raw_plan, "Python 101", 10)
        self.assertEqual(validated["duration_days"], 10)
        self.assertEqual(len(validated["daily_plan"]), 1)
        self.assertEqual(validated["daily_plan"][0]["estimated_hours"], 1.5)

    def test_validate_study_plan_schema_empty_days(self):
        with self.assertRaises(SchemaValidationError):
            validate_study_plan_schema({"daily_plan": []}, "Test", 5)

    def test_validate_lesson_schema(self):
        raw_lesson = {
            "topic": "Recursion",
            "introduction": "Recursion is a method of solving problems...",
            "definition": "A function that calls itself.",
            "detailed_explanation": "Base cases and recursive steps...",
            "how_it_works": [{"title": "Call Stack", "description": "Frames are pushed"}],
            "real_world_examples": [{"example": "Russian dolls", "explanation": "Nesting"}],
            "important_concepts": [{"title": "Base Case", "description": "Prevents infinite loops"}],
            "practical_example": "def fact(n): return 1 if n<=1 else n*fact(n-1)",
            "advantages": ["Elegant code"],
            "limitations": ["Stack overflow risk"],
            "common_mistakes": ["Missing base case"],
            "exam_interview_points": ["Space complexity of call stack"],
            "quick_revision": ["Base case + recursive case"],
            "practice_questions": ["Implement fibonacci recursively"],
        }
        validated = validate_lesson_schema(raw_lesson, "Recursion")
        self.assertEqual(validated["topic"], "Recursion")
        self.assertEqual(len(validated["how_it_works"]), 1)
        self.assertEqual(len(validated["advantages"]), 1)

    def test_validate_quiz_schema_valid(self):
        raw_quiz = {
            "title": "Algorithms Quiz",
            "questions": [
                {
                    "question": f"Question {i}?",
                    "options": ["A", "B", "C", "D"],
                    "correct_answer": "B",
                    "explanation": f"Explanation {i}",
                }
                for i in range(1, 6)
            ],
        }
        validated = validate_quiz_schema(raw_quiz, expected_question_count=5)
        self.assertEqual(len(validated["questions"]), 5)
        self.assertEqual(validated["questions"][0]["correct_answer"], "B")

    def test_validate_quiz_schema_mismatched_answer(self):
        raw_quiz = {
            "title": "Faulty Quiz",
            "questions": [
                {
                    "question": "What is 2 + 2?",
                    "options": ["1", "2", "3", "4"],
                    "correct_answer": "5",  # Not in options
                    "explanation": "Math",
                }
            ],
        }
        with self.assertRaises(SchemaValidationError):
            validate_quiz_schema(raw_quiz, expected_question_count=1)


if __name__ == "__main__":
    unittest.main()
