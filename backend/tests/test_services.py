import unittest
from unittest.mock import MagicMock, patch

from app.services.lesson_generator import generate_lesson
from app.services.quiz_generator import generate_quiz
from app.services.study_planner import generate_study_plan
from app.services.syllabus_analyzer import analyze_syllabus


class TestServices(unittest.TestCase):
    def test_syllabus_analyzer_empty_input(self):
        with self.assertRaises(ValueError) as ctx:
            analyze_syllabus("")
        self.assertIn("empty", str(ctx.exception).lower())

    def test_syllabus_analyzer_mock_success(self):
        mock_provider = MagicMock()
        mock_provider.generate_text.return_value = (
            """{
  "course_name": "Operating Systems",
  "course_level": "Intermediate",
  "units": [
    {
      "unit": 1,
      "title": "Processes & Threads",
      "topics": ["Context Switching", "Scheduling"],
      "difficulty": "Medium",
      "important": true
    }
  ],
  "important_topics": ["Scheduling"]
}""",
            {"model": "gemini-3.5-flash", "is_fallback": False},
        )

        with patch("app.services.syllabus_analyzer.get_ai_provider", return_value=mock_provider):
            analysis = analyze_syllabus("Unit 1: Processes and Threads. Topics: Scheduling...")
            self.assertEqual(analysis["course_name"], "Operating Systems")
            self.assertEqual(len(analysis["units"]), 1)
            self.assertIn("Scheduling", analysis["important_topics"])

    def test_study_planner_validation(self):
        with self.assertRaises(ValueError):
            generate_study_plan(course_name="", course_level="Beginner", units=[{"topics": ["Intro"]}])

        with self.assertRaises(ValueError):
            generate_study_plan(course_name="Math", course_level="Beginner", units=[])

        with self.assertRaises(ValueError):
            generate_study_plan(course_name="Math", course_level="Beginner", units=[{"topics": ["Intro"]}], days=0)

    def test_lesson_generator_validation(self):
        with self.assertRaises(ValueError):
            generate_lesson(course_name="", course_level="Beginner", topic="Recursion")

        with self.assertRaises(ValueError):
            generate_lesson(course_name="CS101", course_level="Beginner", topic="")

    def test_quiz_generator_validation(self):
        with self.assertRaises(ValueError):
            generate_quiz(course_name="", course_level="Beginner", topics=["Binary Trees"])

        with self.assertRaises(ValueError):
            generate_quiz(course_name="CS101", course_level="Beginner", topics=[])


if __name__ == "__main__":
    unittest.main()
