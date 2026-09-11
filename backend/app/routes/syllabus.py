import json
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Syllabus, Topic, User
from app.services.document_parser import extract_text
from app.services.syllabus_analyzer import analyze_syllabus
from app.services.study_planner import generate_study_plan
from app.services.lesson_generator import generate_lesson
from app.services.quiz_generator import generate_quiz


router = APIRouter(
    prefix="/api/syllabus",
    tags=["Syllabus"],
)


UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024


# =========================
# Request Models
# =========================

class StudyPlanRequest(BaseModel):
    course_name: str
    course_level: str
    units: list
    days: int = 30


class LessonRequest(BaseModel):
    course_name: str
    course_level: str
    topic: str


class QuizRequest(BaseModel):
    course_name: str
    course_level: str
    topics: list[str]


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

    # =========================
    # Extract text
    # =========================

    try:
        extracted_text = extract_text(str(file_path))
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not extract text: {error}",
        )

    if not extracted_text:
        raise HTTPException(
            status_code=400,
            detail="No readable text was found in the uploaded file.",
        )

    # =========================
    # AI Analysis
    # =========================

    try:
        analysis = analyze_syllabus(extracted_text)
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {error}",
        )

    # =========================
    # Course information
    # =========================

    course_name = analysis.get(
        "course_name",
        Path(file.filename).stem,
    )

    course_level = analysis.get(
        "course_level",
        None,
    )

    # =========================
    # Check duplicate syllabus
    # =========================

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
        existing_syllabus.analysis_json = json.dumps(
            analysis,
            ensure_ascii=False,
        )
        existing_syllabus.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(existing_syllabus)

        return {
            "message": "Syllabus updated successfully.",
            "filename": safe_filename,
            "status": "updated",
            "syllabus_id": existing_syllabus.id,
            "analysis": analysis,
        }

    # =========================
    # Save syllabus
    # =========================

    syllabus = Syllabus(
        user_id=current_user.id,
        course_name=course_name,
        course_level=course_level,
        filename=safe_filename,
        analysis_json=json.dumps(
            analysis,
            ensure_ascii=False,
        ),
    )

    db.add(syllabus)
    db.commit()
    db.refresh(syllabus)

    # =========================
    # Save topics
    # =========================

    units = analysis.get("units", [])

    saved_topics = []

    for unit_data in units:

        unit_number = unit_data.get(
            "unit",
            "",
        )

        topics = unit_data.get(
            "topics",
            [],
        )

        difficulty = unit_data.get(
            "difficulty",
            None,
        )

        important = bool(
            unit_data.get(
                "important",
                False,
            )
        )

        for topic_title in topics:

            if not isinstance(topic_title, str):
                continue

            topic_title = topic_title.strip()

            if not topic_title:
                continue

            topic = Topic(
                syllabus_id=syllabus.id,
                unit=str(unit_number),
                title=topic_title,
                difficulty=difficulty,
                important=important,
            )

            db.add(topic)
            saved_topics.append(topic_title)

    db.commit()

    return {
        "message": "Syllabus analyzed and saved successfully.",
        "filename": safe_filename,
        "status": "saved",
        "syllabus_id": syllabus.id,
        "topics_saved": len(saved_topics),
        "analysis": analysis,
    }


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
        .filter(
            Syllabus.user_id == current_user.id
        )
        .order_by(
            Syllabus.updated_at.desc()
        )
        .all()
    )

    result = []

    for syllabus in syllabi:

        total_topics = (
            db.query(Topic)
            .filter(
                Topic.syllabus_id == syllabus.id
            )
            .count()
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
        .filter(
            Topic.syllabus_id == syllabus.id
        )
        .order_by(Topic.id)
        .all()
    )

    try:
        analysis = json.loads(
            syllabus.analysis_json
        ) if syllabus.analysis_json else {}
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
        raise HTTPException(
            status_code=500,
            detail=f"Study plan generation failed: {error}",
        )

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
        raise HTTPException(
            status_code=500,
            detail=f"Lesson generation failed: {error}",
        )

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
        topic.strip()
        for topic in request.topics
        if topic.strip()
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
        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {error}",
        )

    return {
        "message": "Quiz generated successfully.",
        "status": "generated",
        "quiz": quiz,
    }