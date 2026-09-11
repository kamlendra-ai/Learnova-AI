from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import (
    User,
    Syllabus,
    Topic,
    TopicProgress,
    QuizResult,
    StudySession,
)

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    syllabi = (
        db.query(Syllabus)
        .filter(Syllabus.user_id == current_user.id)
        .order_by(Syllabus.updated_at.desc())
        .all()
    )

    syllabus_ids = [syllabus.id for syllabus in syllabi]

    topics = []

    if syllabus_ids:
        topics = (
            db.query(Topic)
            .filter(Topic.syllabus_id.in_(syllabus_ids))
            .all()
        )

    total_topics = len(topics)
    topic_ids = [topic.id for topic in topics]

    progress_records = []

    if topic_ids:
        progress_records = (
            db.query(TopicProgress)
            .filter(
                TopicProgress.user_id == current_user.id,
                TopicProgress.topic_id.in_(topic_ids),
            )
            .all()
        )

    progress_by_topic = {
        progress.topic_id: progress
        for progress in progress_records
    }

    completed_topics = sum(
        1
        for topic in topics
        if (
            topic.id in progress_by_topic
            and progress_by_topic[topic.id].completed
        )
    )

    progress_percentage = (
        round((completed_topics / total_topics) * 100, 1)
        if total_topics > 0
        else 0
    )

    subjects = {}

    syllabus_by_id = {
        syllabus.id: syllabus
        for syllabus in syllabi
    }

    for topic in topics:
        syllabus = syllabus_by_id.get(topic.syllabus_id)

        if not syllabus:
            continue

        subject_name = syllabus.course_name

        if subject_name not in subjects:
            subjects[subject_name] = {
                "subject": subject_name,
                "total_topics": 0,
                "completed_topics": 0,
                "progress_percentage": 0,
                "study_seconds": 0,
                "study_hours": 0,
            }

        subjects[subject_name]["total_topics"] += 1

        progress = progress_by_topic.get(topic.id)

        if progress:
            if progress.completed:
                subjects[subject_name]["completed_topics"] += 1

            subjects[subject_name]["study_seconds"] += (
                progress.study_seconds or 0
            )

    for subject in subjects.values():
        total = subject["total_topics"]
        completed = subject["completed_topics"]

        subject["progress_percentage"] = (
            round((completed / total) * 100, 1)
            if total > 0
            else 0
        )

        subject["study_hours"] = round(
            subject["study_seconds"] / 3600,
            1,
        )

    quiz_results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == current_user.id)
        .all()
    )

    tests_completed = len(quiz_results)

    average_score = (
        round(
            sum(result.score for result in quiz_results)
            / tests_completed,
            1,
        )
        if tests_completed > 0
        else 0
    )

    study_sessions = (
        db.query(StudySession)
        .filter(StudySession.user_id == current_user.id)
        .all()
    )

    session_study_seconds = sum(
        session.duration_seconds or 0
        for session in study_sessions
    )

    topic_study_seconds = sum(
        progress.study_seconds or 0
        for progress in progress_records
    )

    total_study_seconds = (
        session_study_seconds
        + topic_study_seconds
    )

    total_study_hours = round(
        total_study_seconds / 3600,
        1,
    )

    syllabus_data = []

    for syllabus in syllabi:

        syllabus_topics = [
            topic
            for topic in topics
            if topic.syllabus_id == syllabus.id
        ]

        syllabus_total = len(syllabus_topics)

        syllabus_completed = sum(
            1
            for topic in syllabus_topics
            if (
                topic.id in progress_by_topic
                and progress_by_topic[topic.id].completed
            )
        )

        syllabus_percentage = (
            round(
                (syllabus_completed / syllabus_total) * 100,
                1,
            )
            if syllabus_total > 0
            else 0
        )

        syllabus_data.append(
            {
                "id": syllabus.id,
                "course_name": syllabus.course_name,
                "course_level": syllabus.course_level,
                "filename": syllabus.filename,
                "total_topics": syllabus_total,
                "completed_topics": syllabus_completed,
                "progress_percentage": syllabus_percentage,
                "created_at": syllabus.created_at,
                "updated_at": syllabus.updated_at,
            }
        )

    return {
        "status": "success",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
        },
        "topics": {
            "completed": completed_topics,
            "total": total_topics,
            "percentage": progress_percentage,
        },
        "tests": {
            "completed": tests_completed,
            "average_score": average_score,
        },
        "study": {
            "total_seconds": total_study_seconds,
            "total_hours": total_study_hours,
        },
        "subjects": list(subjects.values()),
        "syllabi": syllabus_data,
    }