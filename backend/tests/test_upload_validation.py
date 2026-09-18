import io
import unittest
from fastapi.testclient import TestClient

from app.main import app
from app.auth import get_current_user
from app.models import User


class TestUploadAndRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Override get_current_user to return a valid authenticated test user
        app.dependency_overrides[get_current_user] = lambda: User(
            id=999,
            name="Test User",
            email="tester@learnova.ai",
            password_hash="fakehash",
        )
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_ai_status_route(self):
        res = self.client.get("/api/syllabus/ai-status")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "online")
        self.assertIn("snapdragon_target", data)

    def test_upload_unsupported_file_type(self):
        fake_file = io.BytesIO(b"Text content")
        res = self.client.post(
            "/api/syllabus/upload",
            files={"file": ("syllabus.txt", fake_file, "text/plain")},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("PDF and DOCX", res.json()["detail"])

    def test_upload_empty_file(self):
        empty_pdf = io.BytesIO(b"")
        res = self.client.post(
            "/api/syllabus/upload",
            files={"file": ("syllabus.pdf", empty_pdf, "application/pdf")},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("empty", res.json()["detail"].lower())

    def test_study_plan_invalid_days(self):
        res = self.client.post(
            "/api/syllabus/study-plan",
            json={"course_name": "Calculus", "course_level": "Beginner", "units": [{"unit": 1}], "days": 500},
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("between 1 and 365", res.json()["detail"])


if __name__ == "__main__":
    unittest.main()
