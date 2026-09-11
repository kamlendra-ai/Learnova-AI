from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    syllabi = relationship(
        "Syllabus",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    topic_progress = relationship(
        "TopicProgress",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    quiz_results = relationship(
        "QuizResult",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    study_sessions = relationship(
        "StudySession",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class Syllabus(Base):
    __tablename__ = "syllabi"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    course_name = Column(String(255), nullable=False)
    course_level = Column(String(100), nullable=True)
    filename = Column(String(255), nullable=True)

    analysis_json = Column(Text, nullable=True)
    study_plan_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="syllabi",
    )

    topics = relationship(
        "Topic",
        back_populates="syllabus",
        cascade="all, delete-orphan",
    )

    quiz_results = relationship(
        "QuizResult",
        back_populates="syllabus",
        cascade="all, delete-orphan",
    )


class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    syllabus_id = Column(
        Integer,
        ForeignKey("syllabi.id"),
        nullable=False,
        index=True,
    )

    unit = Column(String(100), nullable=True)
    title = Column(String(500), nullable=False)
    difficulty = Column(String(50), nullable=True)
    important = Column(Boolean, default=False, nullable=False)

    lesson_json = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    syllabus = relationship(
        "Syllabus",
        back_populates="topics",
    )

    progress = relationship(
        "TopicProgress",
        back_populates="topic",
        cascade="all, delete-orphan",
    )


class TopicProgress(Base):
    __tablename__ = "topic_progress"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    topic_id = Column(
        Integer,
        ForeignKey("topics.id"),
        nullable=False,
        index=True,
    )

    started = Column(Boolean, default=False, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)

    progress_percent = Column(
        Float,
        default=0.0,
        nullable=False,
    )

    study_seconds = Column(
        Integer,
        default=0,
        nullable=False,
    )

    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="topic_progress",
    )

    topic = relationship(
        "Topic",
        back_populates="progress",
    )


class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    syllabus_id = Column(
        Integer,
        ForeignKey("syllabi.id"),
        nullable=True,
        index=True,
    )

    topic = Column(String(500), nullable=True)

    score = Column(Float, nullable=False)
    total_questions = Column(Integer, nullable=False)
    correct_answers = Column(Integer, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="quiz_results",
    )

    syllabus = relationship(
        "Syllabus",
        back_populates="quiz_results",
    )


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    syllabus_id = Column(
        Integer,
        ForeignKey("syllabi.id"),
        nullable=True,
        index=True,
    )

    topic_id = Column(
        Integer,
        ForeignKey("topics.id"),
        nullable=True,
        index=True,
    )

    started_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    ended_at = Column(DateTime, nullable=True)

    duration_seconds = Column(
        Integer,
        default=0,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="study_sessions",
    )