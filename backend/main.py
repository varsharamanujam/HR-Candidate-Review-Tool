"""
FastAPI application for HR Candidate Review Tool.

This module implements the REST API endpoints for managing candidates.
It provides functionality for creating, reading, updating, and filtering candidates,
as well as generating candidate PDFs.

Example:
    To run the application:
    ```
    uvicorn main:app --reload
    ```
"""

from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal, Candidate, init_db
from pydantic import BaseModel
from typing import List, Optional
import json
import io
import weasyprint
from datetime import datetime, timedelta
from sqlalchemy import func

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the database
init_db()

def get_db():
    """
    Dependency to get database session.

    Creates a new database session for each request and ensures it's closed
    after the request is completed.

    Yields:
        Session: SQLAlchemy database session

    Example:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            return db.query(Model).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CandidateResponse(BaseModel):
    """
    Pydantic model for candidate response data.
    """
    id: int
    name: str
    email: str
    phone: str
    applied_role: str
    experience: str
    status: str
    urls: Optional[str]  # JSON string containing various URLs
    rating: float
    stage: str
    location: Optional[str]
    attachments: int
    application_date: datetime

    class Config:
        from_attributes = True

class CandidateCreate(BaseModel):
    """
    Pydantic model for creating a new candidate.

    Attributes:
        name (str): Full name of the candidate
        email (str): Email address
        phone (str): Contact phone number
        applied_role (str): Position applied for
        experience (str): Years of experience
        status (str): Application status, defaults to "Pending"
        resume_url (Optional[str]): URL to resume file
        rating (float): Candidate rating, defaults to 0.0
        stage (str): Interview stage, defaults to "Screening"
        location (Optional[str]): Candidate's location
        attachments (int): Number of attachments
    """
    name: str
    email: str
    phone: str
    applied_role: str
    experience: str
    status: str = "Pending"
    resume_url: Optional[str] = None
    rating: float = 0.0
    stage: str = "Screening"
    location: Optional[str] = None
    attachments: int = 0

class CandidateUpdate(BaseModel):
    """
    Pydantic model for updating candidate information.

    Attributes:
        status (Optional[str]): New application status
        stage (Optional[str]): New interview stage
        rating (Optional[float]): Updated rating
    """
    status: Optional[str] = None
    stage: Optional[str] = None
    rating: Optional[float] = None

@app.get("/candidates/", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    """
    Retrieve all candidates from the database.

    Args:
        db (Session): Database session dependency

    Returns:
        List[CandidateResponse]: List of all candidates

    Example:
        response = await client.get("/candidates/")
        candidates = response.json()
    """
    return db.query(Candidate).all()

@app.get("/candidates/filter/")
def filter_candidates(
    db: Session = Depends(get_db),
    role: str = None,
    status: str = None,
    stage: str = None,
    search: str = None,
    sort_by: str = "name",
    month_year: str = None,
):
    query = db.query(Candidate)
    
    if role:
        query = query.filter(Candidate.applied_role == role)
    if status:
        query = query.filter(Candidate.status == status)
    if stage:
        query = query.filter(Candidate.stage == stage)
    if search:
        query = query.filter(
            Candidate.name.contains(search) | 
            Candidate.email.contains(search) |
            Candidate.applied_role.contains(search)
        )
    
    # Handle month_year filter
    if month_year:
        try:
            year, month = map(int, month_year.split("-"))
            # Create a datetime range for the month
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
            query = query.filter(Candidate.application_date >= start_date,
                                 Candidate.application_date < end_date)
        except Exception as e:
            print("Error processing month_year:", e)
    
    # Sorting logic
    if sort_by == "name":
        query = query.order_by(Candidate.name)
    elif sort_by == "application_date":
        query = query.order_by(Candidate.application_date.desc())
    elif sort_by == "rating":
        query = query.order_by(Candidate.rating.desc())
    
    return query.all()

@app.post("/candidates/import/")
def import_candidates(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import candidates from a JSON file.

    Args:
        file (UploadFile): JSON file containing candidate data
        db (Session): Database session dependency

    Returns:
        dict: Success message

    Example:
        files = {'file': ('candidates.json', open('candidates.json', 'rb'))}
        response = await client.post("/candidates/import/", files=files)
    """
    contents = file.file.read()
    candidates_data = json.loads(contents.decode("utf-8"))

    for candidate_data in candidates_data:
        # Collect all URLs from the candidate data
        urls = {}
        if "resume_url" in candidate_data:
            urls["resume"] = candidate_data["resume_url"]
        if "cover_letter_url" in candidate_data:
            urls["cover_letter"] = candidate_data["cover_letter_url"]
        if "project_url" in candidate_data:
            urls["project"] = candidate_data["project_url"]
        
        # Count number of URLs as attachments
        num_attachments = len(urls)
        
        candidate = Candidate(
            name=candidate_data["name"],
            email=candidate_data["email"],
            phone=candidate_data["phone"],
            applied_role=candidate_data["applied_role"],
            experience=candidate_data["experience"],
            status=candidate_data.get("status", "Pending"),
            urls=json.dumps(urls) if urls else None,
            rating=float(candidate_data.get("rating", 0.0)),
            stage=candidate_data.get("stage", "Screening"),
            location=candidate_data.get("location", None),
            attachments=num_attachments,
        )
        db.add(candidate)
    db.commit()
    return {"message": "Candidates imported successfully"}

@app.patch("/candidates/{candidate_id}/status/")
def update_status(candidate_id: int, update: CandidateUpdate, db: Session = Depends(get_db)):
    """
    Update candidate status, stage, or rating.

    Args:
        candidate_id (int): ID of the candidate to update
        update (CandidateUpdate): Update data
        db (Session): Database session dependency

    Returns:
        Candidate: Updated candidate information

    Raises:
        HTTPException: If candidate is not found

    Example:
        data = {"status": "Selected", "stage": "Hired"}
        response = await client.patch("/candidates/1/status/", json=data)
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if update.status:
        candidate.status = update.status
    if update.stage:
        candidate.stage = update.stage
    if update.rating is not None:
        candidate.rating = update.rating
        
    db.commit()
    db.refresh(candidate)
    return candidate

@app.get("/candidates/{candidate_id}/pdf/")
def generate_pdf(candidate_id: int, db: Session = Depends(get_db)):
    """
    Generate a PDF document with candidate details.

    Args:
        candidate_id (int): ID of the candidate
        db (Session): Database session dependency

    Returns:
        Response: PDF file as a downloadable attachment

    Raises:
        HTTPException: If candidate is not found

    Example:
        response = await client.get("/candidates/1/pdf/")
        # Response will be a downloadable PDF file
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Parse URLs from JSON string
    urls = json.loads(candidate.urls) if candidate.urls else {}
    
    # Create URL section HTML
    url_section = ""
    if urls:
        url_section = "<h2>Attachments</h2>"
        if "resume" in urls:
            url_section += f'<p><strong>Resume:</strong> <a href="{urls["resume"]}">{urls["resume"]}</a></p>'
        if "cover_letter" in urls:
            url_section += f'<p><strong>Cover Letter:</strong> <a href="{urls["cover_letter"]}">{urls["cover_letter"]}</a></p>'
        if "project" in urls:
            url_section += f'<p><strong>Project:</strong> <a href="{urls["project"]}">{urls["project"]}</a></p>'
    
    # Create PDF content
    html_content = f"""
    <html>
        <body>
            <h1>Candidate Details</h1>
            <p><strong>Name:</strong> {candidate.name}</p>
            <p><strong>Email:</strong> {candidate.email}</p>
            <p><strong>Phone:</strong> {candidate.phone}</p>
            <p><strong>Applied Role:</strong> {candidate.applied_role}</p>
            <p><strong>Experience:</strong> {candidate.experience}</p>
            <p><strong>Status:</strong> {candidate.status}</p>
            <p><strong>Current Stage:</strong> {candidate.stage}</p>
            <p><strong>Rating:</strong> {candidate.rating} / 5.0</p>
            <p><strong>Location:</strong> {candidate.location or "Not specified"}</p>
            <p><strong>Application Date:</strong> {candidate.application_date.strftime('%Y-%m-%d')}</p>
            {url_section}
        </body>
    </html>
    """
    
    pdf = weasyprint.HTML(string=html_content).write_pdf()
    
    return Response(
        content=pdf, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=candidate_{candidate_id}.pdf"}
    )

@app.get("/candidates/{candidate_id}/")
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific candidate by ID.

    Args:
        candidate_id (int): ID of the candidate to retrieve
        db (Session): Database session dependency

    Returns:
        Candidate: Candidate information

    Raises:
        HTTPException: If candidate is not found

    Example:
        response = await client.get("/candidates/1/")
        candidate = response.json()
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@app.post("/seed/")
def seed_data(db: Session = Depends(get_db)):
    """
    Seed the database with sample data for development purposes.

    Args:
        db (Session): Database session dependency

    Returns:
        dict: Success message

    Example:
        response = await client.post("/seed/")
    """
    # Clear existing data
    db.query(Candidate).delete()
        
    # Sample candidates
    candidates = [
        Candidate(
            name="Charlie Kristen",
            email="charlie.k@example.com",
            phone="+1234567890",
            applied_role="Sr. UX Designer",
            experience="5 years",
            status="In Process",
            stage="Design Challenge",
            rating=4.0,
            location="Bengaluru",
            application_date=datetime.now() - timedelta(days=10),
            urls=json.dumps({
                "resume": "https://example.com/resume/charlie.pdf",
                "cover_letter": "https://example.com/cover/charlie.pdf",
                "project": "https://example.com/portfolio/charlie"
            }),
            attachments=3
        ),
        Candidate(
            name="Malaika Brown",
            email="malaika.b@example.com",
            phone="+9876543210",
            applied_role="Growth Manager",
            experience="3 years",
            status="In Process",
            stage="Screening",
            rating=3.5,
            location="Remote",
            application_date=datetime.now() - timedelta(days=20),
            urls=json.dumps({
                "resume": "https://example.com/resume/malaika.pdf"
            }),
            attachments=1
        ),
        Candidate(
            name="Simon Minter",
            email="simon.m@example.com",
            phone="+1122334455",
            applied_role="Financial Analyst",
            experience="4 years",
            status="In Process",
            stage="Design Challenge",
            rating=2.8,
            location="Mumbai",
            application_date=datetime.now() - timedelta(days=80),
            urls=json.dumps({
                "resume": "https://example.com/resume/simon.pdf",
                "project": "https://example.com/projects/simon"
            }),
            attachments=2
        ),
        Candidate(
            name="Ashley Brooke",
            email="ashley.b@example.com",
            phone="+5566778899",
            applied_role="Financial Analyst",
            experience="6 years",
            status="In Process",
            stage="HR Round",
            rating=4.5,
            location="Mumbai",
            application_date=datetime.now() - timedelta(days=15),
            urls=json.dumps({
                "resume": "https://example.com/resume/ashley.pdf",
                "cover_letter": "https://example.com/cover/ashley.pdf",
                "project": "https://example.com/portfolio/ashley"
            }),
            attachments=3
        ),
        Candidate(
            name="Nishant Talwar",
            email="nishant.t@example.com",
            phone="+1098765432",
            applied_role="Sr. UX Designer",
            experience="7 years",
            status="In Process",
            stage="Round 2 Interview",
            rating=5.0,
            location="Bengaluru",
            application_date=datetime.now() - timedelta(days=100),
            urls=json.dumps({
                "resume": "https://example.com/resume/nishant.pdf",
                "project": "https://example.com/portfolio/nishant"
            }),
            attachments=2
        ),
        Candidate(
            name="Mark Jacobs",
            email="mark.j@example.com",
            phone="+2233445566",
            applied_role="Growth Manager",
            experience="2 years",
            status="Rejected",
            stage="Rejected",
            rating=2.0,
            location="Remote",
            application_date=datetime.now() - timedelta(days=25),
            urls=json.dumps({
                "resume": "https://example.com/resume/mark.pdf"
            }),
            attachments=1
        )
    ]
    
    for candidate in candidates:
        db.add(candidate)
        
    db.commit()
    return {"message": "Sample data created successfully"}
