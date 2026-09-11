from app.auth import router as auth_router
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models

from app.routes.syllabus import router as syllabus_router
from app.routes.dashboard import router as dashboard_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Learnova AI API",
    description="Backend API for the Learnova AI learning platform",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to Learnova AI API",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }


app.include_router(syllabus_router)
app.include_router(dashboard_router)
app.include_router(auth_router)