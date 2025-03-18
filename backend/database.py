from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

DATABASE_URL = "sqlite:///./candidates.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Candidate Model
class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String)
    status = Column(String, default="Pending")  # "Pending", "Rejected", "Selected"
    applied_role = Column(String)
    experience = Column(String)
    application_date = Column(DateTime, default=datetime.datetime.utcnow)
    resume_url = Column(String)  # URL to resume file

def init_db():
    Base.metadata.create_all(bind=engine)
