"""
Database configuration and model definitions for the HR Candidate Review Tool.

This module sets up the SQLAlchemy database connection and defines the data models
for candidates and job openings. It uses SQLite as the database backend.

Example:
    from database import SessionLocal, Candidate, JobOpening, init_db
    
    # Initialize database
    init_db()
    
    # Create a database session
    db = SessionLocal()
"""

from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "sqlite:///./candidates.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Candidate(Base):
    """
    SQLAlchemy model representing a job candidate in the system.

    This model stores all relevant information about a candidate including their
    personal details, application status, and interview progress.

    Attributes:
        id (int): Primary key for the candidate
        name (str): Full name of the candidate
        email (str): Unique email address of the candidate
        phone (str): Contact phone number
        status (str): Current application status ("Pending", "Rejected", "Selected")
        applied_role (str): Job role the candidate applied for
        experience (str): Years of relevant experience
        application_date (datetime): When the candidate applied
        resume_url (str): URL to the candidate's resume file
        rating (float): Candidate rating from 0 to 5
        stage (str): Current interview stage (e.g., "Screening", "HR Round")
        location (str): Candidate's location
        attachments (int): Number of documents attached to the application

    Example:
        candidate = Candidate(
            name="John Doe",
            email="john@example.com",
            phone="+1234567890",
            applied_role="Software Engineer",
            experience="5 years",
            status="Pending"
        )
        db.add(candidate)
        db.commit()
    """
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    status = Column(String, default="Pending")  # "Pending", "Rejected", "Selected"
    applied_role = Column(String)
    experience = Column(String)
    application_date = Column(DateTime, default=datetime.datetime.utcnow)
    urls = Column(String, nullable=True)  # JSON string storing various URLs (resume, cover letter, projects)
    rating = Column(Float, default=0.0)  # Star rating (0-5)
    stage = Column(String, default="Screening")  # Current interview stage
    location = Column(String, nullable=True)  # Candidate location
    attachments = Column(Integer, default=0)  # Number of attachments/files

def init_db():
    """
    Initialize the database by creating all defined tables.

    This function creates all tables defined in the SQLAlchemy models if they
    don't already exist. It should be called when the application starts.

    Example:
        from database import init_db
        
        # Create all database tables
        init_db()
    """
    Base.metadata.create_all(bind=engine)
