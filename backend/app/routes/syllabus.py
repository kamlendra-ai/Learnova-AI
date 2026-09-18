import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Syllabus, Topic, User
from app.services.ai_provider import (
    AIAuthenticationError,
    AIError,
    AIModelNotFoundError,
    AIRateLimitError,
    AIServiceUnavailableError,
    get_ai_provider,
)
from app.services.document_parser import extract_text
from app.services.lesson_generator import generate_lesson
from app.services.quiz_generator import generate_quiz
from app.services.study_planner import generate_study_plan
from app.services.syllabus_analyzer import analyze_syllabus

logger = logging.getLogger("learnova.routes.syllabus")

router = APIRouter(
    prefix="/api/syllabus",
    tags=["Syllabus"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


# =========================
# Request Models
# =========================

class StudyPlanRequest(BaseModel):
    course_name: str
    course_level: str = "Beginner"
    units: list
    days: int = 30


class LessonRequest(BaseModel):
    course_name: str
    course_level: str = "Beginner"
    topic: str


class QuizRequest(BaseModel):
    course_name: str
    course_level: str = "Beginner"
    topics: list[str]


def _map_ai_error_to_http(error: Exception) -> HTTPException:
    """Map internal AI errors to structured HTTP exceptions without leaking secrets."""
    if isinstance(error, AIRateLimitError):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI request rate limit reached. Please wait a moment and try again.",
        )
    if isinstance(error, AIServiceUnavailableError):
        return HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is temporarily overloaded or unavailable. Please retry in a few seconds.",
        )
    if isinstance(error, AIModelNotFoundError):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configured AI model is unavailable for this account.",
        )
    if isinstance(error, AIAuthenticationError):
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service authentication error. Please contact administrator.",
        )
    if isinstance(error, ValueError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"AI operation failed: {str(error)}",
    )


# =========================
# AI System Status
# =========================

@router.get("/ai-status")
def get_ai_status():
    """
    Exposes active AI provider, active models, hardware target, and privacy state
    for frontend status badges and Qualcomm Snapdragon compliance reporting.
    """
    try:
        provider = get_ai_provider()
        provider_status = provider.get_status()
        from app.services.local_ai import LocalAIProvider
        local_info = LocalAIProvider().get_status()

        return {
            "status": "online",
            "active_provider": provider_status.get("provider", "cloud"),
            "cloud": provider_status if provider_status.get("provider") == "cloud" else None,
            "local": local_info,
            "snapdragon_target": {
                "npu": "Qualcomm Hexagon NPU (45 TOPS)",
                "runtime": "ONNX Runtime GenAI with Qualcomm QNN Execution Provider",
                "recommended_models": ["Llama-3.2-1B-Instruct (INT4)", "Llama-3.2-3B-Instruct (INT4)"],
                "host_environment": "AMD Ryzen 7 5700U (Development / Cloud Emulation)",
            },
        }
    except Exception as err:
        logger.error("Failed to retrieve AI status: %s", str(err))
        return {
            "status": "degraded",
            "error": str(err),
        }


# =========================
# Upload Syllabus
# =========================

@router.post("/upload")
async def upload_syllabus(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported.",
        )

    file_content = await file.read()

    if not file_content:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must be less than 10 MB.",
        )

    safe_filename = Path(file.filename).name

    # Create user-specific upload directory
    user_upload_dir = UPLOAD_DIR / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_upload_dir / safe_filename
    file_path.write_bytes(file_content)

    # Extract text
    try:
        extracted_text = extract_text(str(file_path))
    except Exception as error:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse syllabus file: {str(error)}",
        )

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=400,
            detail="No readable text found in document. Please verify the file contains extractable text.",
        )

    # AI Analysis with error mapping
    try:
        analysis = analyze_syllabus(extracted_text)
    except Exception as error:
        logger.error("Syllabus analysis failed for user %s: %s", current_user.id, str(error))
        raise _map_ai_error_to_http(error)

    course_name = analysis.get("course_name") or Path(file.filename).stem
    course_level = analysis.get("course_level") or "Beginner"

    # Check duplicate syllabus
    existing_syllabus = (
        db.query(Syllabus)
        .filter(
            Syllabus.user_id == current_user.id,
            Syllabus.filename == safe_filename,
        )
        .first()
    )

    if existing_syllabus:
        existing_syllabus.course_name = course_name
        existing_syllabus.course_level = course_level
        existing_syllabus.analysis_json = json.dumps(analysis, ensure_ascii=False)
        existing_syllabus.updated_at = datetime.utcnow()

        # Update topics
        db.query(Topic).filter(Topic.syllabus_id == existing_syllabus.id).delete()
        saved_topics = _save_topics(db, existing_syllabus.id, analysis.get("units", []))

        db.commit()
        db.refresh(existing_syllabus)

        return {
            "message": "Syllabus updated successfully.",
            "filename": safe_filename,
            "status": "updated",
            "syllabus_id": existing_syllabus.id,
            "topics_saved": len(saved_topics),
            "analysis": analysis,
        }

    # Save new syllabus
    syllabus = Syllabus(
        user_id=current_user.id,
        course_name=course_name,
        course_level=course_level,
        filename=safe_filename,
        analysis_json=json.dumps(analysis, ensure_ascii=False),
    )

    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    saved_topics = _save_topics(db, syllabus.id, analysis.get("units", []))
    db.commit()

    return {
        "message": "Syllabus analyzed and saved successfully.",
        "filename": safe_filename,
        "status": "saved",
        "syllabus_id": syllabus.id,
        "topics_saved": len(saved_topics),
        "analysis": analysis,
    }


def _save_topics(db: Session, syllabus_id: int, units: list) -> list:
    saved = []
    for unit_data in units:
        if not isinstance(unit_data, dict):
            continue
        unit_number = str(unit_data.get("unit", ""))
        topics = unit_data.get("topics", [])
        difficulty = unit_data.get("difficulty")
        important = bool(unit_data.get("important", False))

        for topic_title in topics:
            if not isinstance(topic_title, str) or not topic_title.strip():
                continue
            topic = Topic(
                syllabus_id=syllabus_id,
                unit=unit_number,
                title=topic_title.strip(),
                difficulty=difficulty,
                important=important,
            )
            db.add(topic)
            saved.append(topic_title.strip())
    return saved


# =========================
# My Syllabi
# =========================

@router.get("/my-syllabi")
def get_my_syllabi(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    syllabi = (
        db.query(Syllabus)
        .filter(Syllabus.user_id == current_user.id)
        .order_by(Syllabus.updated_at.desc())
        .all()
    )

    result = []
    for syllabus in syllabi:
        total_topics = (
            db.query(Topic).filter(Topic.syllabus_id == syllabus.id).count()
        )
        result.append(
            {
                "id": syllabus.id,
                "course_name": syllabus.course_name,
                "course_level": syllabus.course_level,
                "filename": syllabus.filename,
                "total_topics": total_topics,
                "created_at": syllabus.created_at,
                "updated_at": syllabus.updated_at,
            }
        )

    return {
        "status": "success",
        "total_syllabi": len(result),
        "syllabi": result,
    }


# =========================
# Single Syllabus
# =========================

@router.get("/{syllabus_id}")
def get_syllabus(
    syllabus_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    syllabus = (
        db.query(Syllabus)
        .filter(
            Syllabus.id == syllabus_id,
            Syllabus.user_id == current_user.id,
        )
        .first()
    )

    if not syllabus:
        raise HTTPException(
            status_code=404,
            detail="Syllabus not found.",
        )

    topics = (
        db.query(Topic)
        .filter(Topic.syllabus_id == syllabus.id)
        .order_by(Topic.id)
        .all()
    )

    try:
        analysis = json.loads(syllabus.analysis_json) if syllabus.analysis_json else {}
    except json.JSONDecodeError:
        analysis = {}

    return {
        "id": syllabus.id,
        "course_name": syllabus.course_name,
        "course_level": syllabus.course_level,
        "filename": syllabus.filename,
        "analysis": analysis,
        "topics": [
            {
                "id": topic.id,
                "unit": topic.unit,
                "title": topic.title,
                "difficulty": topic.difficulty,
                "important": topic.important,
            }
            for topic in topics
        ],
    }


# =========================
# Study Plan
# =========================

@router.post("/study-plan")
async def create_study_plan(
    request: StudyPlanRequest,
):
    if request.days < 1 or request.days > 365:
        raise HTTPException(
            status_code=400,
            detail="Study plan duration must be between 1 and 365 days.",
        )

    if not request.units:
        raise HTTPException(
            status_code=400,
            detail="At least one syllabus unit is required.",
        )

    try:
        plan = generate_study_plan(
            course_name=request.course_name,
            course_level=request.course_level,
            units=request.units,
            days=request.days,
        )
    except Exception as error:
        logger.error("Study plan generation failed: %s", str(error))
        raise _map_ai_error_to_http(error)

    return {
        "message": "Study plan generated successfully.",
        "status": "generated",
        "study_plan": plan,
    }


# =========================
# Lesson
# =========================

@router.post("/lesson")
async def create_lesson(
    request: LessonRequest,
):
    if not request.course_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Course name is required.",
        )

    if not request.topic.strip():
        raise HTTPException(
            status_code=400,
            detail="Topic is required.",
        )

    try:
        lesson = generate_lesson(
            course_name=request.course_name,
            course_level=request.course_level,
            topic=request.topic,
        )
    except Exception as error:
        logger.error("Lesson generation failed: %s", str(error))
        raise _map_ai_error_to_http(error)

    return {
        "message": "Lesson generated successfully.",
        "status": "generated",
        "lesson": lesson,
    }


# =========================
# Quiz
# =========================

@router.post("/quiz")
async def create_quiz(
    request: QuizRequest,
):
    if not request.course_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Course name is required.",
        )

    if not request.topics:
        raise HTTPException(
            status_code=400,
            detail="At least one topic is required.",
        )

    clean_topics = [
        topic.strip() for topic in request.topics if topic.strip()
    ]

    if not clean_topics:
        raise HTTPException(
            status_code=400,
            detail="Valid topics are required.",
        )

    try:
        quiz = generate_quiz(
            course_name=request.course_name,
            course_level=request.course_level,
            topics=clean_topics,
        )
    except Exception as error:
        logger.error("Quiz generation failed: %s", str(error))
        raise _map_ai_error_to_http(error)

    return {
        "message": "Quiz generated successfully.",
        "status": "generated",
        "quiz": quiz,
    }