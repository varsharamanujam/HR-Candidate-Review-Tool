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
from sqlalchemy import func
from database import SessionLocal, Candidate, init_db
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import json
import io
import weasyprint

# Constants
STAGES = ["Screening", "Design Challenge", "Interview", "HR Round", "Hired", "Rejected"]
STATUSES = ["Pending", "In Process", "Selected", "Rejected", "Accepted"]
SORT_FIELDS = ["name", "application_date", "rating"]
DEFAULT_SORT = "application_date"
DEFAULT_STATUS = "Pending"
DEFAULT_STAGE = "Screening"
DEFAULT_RATING = 0.0

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

    Yields:
        Session: SQLAlchemy database session
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
    basic_info: Optional[str]
    skills: Optional[str]  
    education: Optional[str]
    experience_details: Optional[str] 
    projects: Optional[str]
    svg_photo: Optional[str]

    class Config:
        from_attributes = True

class CandidateCreate(BaseModel):
    """
    Pydantic model for creating a new candidate.
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
    basic_info: Optional[str] = None
    skills: Optional[str] = None
    education: Optional[str] = None
    experience_details: Optional[str] = None
    projects: Optional[str] = None
    svg_photo: Optional[str] = None

class CandidateUpdate(BaseModel):
    """
    Pydantic model for updating candidate information.
    """
    status: Optional[str] = None
    stage: Optional[str] = None
    rating: Optional[float] = None

@app.get("/candidates/", response_model=List[CandidateResponse])
def get_candidates(db: Session = Depends(get_db)):
    """
    Retrieve all candidates from the database.
    """
    return db.query(Candidate).all()

@app.get("/candidates/filter/")
def filter_candidates(
    db: Session = Depends(get_db),
    role: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = DEFAULT_SORT,
    month_year: Optional[str] = None,
) -> List[CandidateResponse]:
    """
    Filter and sort candidates based on various criteria.
    """
    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {STATUSES}")
    if stage and stage not in STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {STAGES}")
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid sort field. Must be one of: {SORT_FIELDS}")

    query = db.query(Candidate)
    
    if role:
        query = query.filter(Candidate.applied_role == role)
    if status:
        query = query.filter(Candidate.status == status)
    if stage:
        query = query.filter(Candidate.stage == stage)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Candidate.name.ilike(search_term) |
            Candidate.email.ilike(search_term) |
            Candidate.applied_role.ilike(search_term)
        )
    
    if month_year:
        try:
            year, month = map(int, month_year.split("-"))
            if not (1 <= month <= 12 and 1900 <= year <= 9999):
                raise ValueError("Invalid month or year")
                
            start_date = datetime(year, month, 1)
            if month == 12:
                end_date = datetime(year + 1, 1, 1)
            else:
                end_date = datetime(year, month + 1, 1)
                
            query = query.filter(
                Candidate.application_date >= start_date,
                Candidate.application_date < end_date
            )
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid month_year format. Must be YYYY-MM: {str(e)}"
            )
    
    query = query.order_by(
        {
            "name": Candidate.name,
            "application_date": Candidate.application_date.desc(),
            "rating": Candidate.rating.desc()
        }[sort_by]
    )
    
    return query.all()

@app.post("/candidates/import/")
def import_candidates(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import candidates from a JSON file.
    """
    contents = file.file.read()
    candidates_data = json.loads(contents.decode("utf-8"))

    for candidate_data in candidates_data:
        urls = {}
        if "resume_url" in candidate_data:
            urls["resume"] = candidate_data["resume_url"]
        if "cover_letter_url" in candidate_data:
            urls["cover_letter"] = candidate_data["cover_letter_url"]
        if "project_url" in candidate_data:
            urls["project"] = candidate_data["project_url"]
        
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
def generate_pdf(candidate_id: int, db: Session = Depends(get_db)) -> Response:
    """
    Generate a PDF document with candidate details.
    """
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        try:
            urls = json.loads(candidate.urls) if candidate.urls else {}
        except json.JSONDecodeError:
            urls = {}

        # Updated CSS for a modern, evenly spaced dark theme
        css_styles = """
            <style>
                body {
                    background: #151515;
                    color: #f0f0f0;
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    margin: 0;
                    padding: 40px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: #1E1E1E;
                    border-radius: 10px;
                    box-shadow: 0 0 20px rgba(0,0,0,0.5);
                    padding: 30px;
                }
                .profile-section {
                    text-align: center;
                    padding: 20px;
                    margin-bottom: 30px;
                }
                .profile-section img {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    object-fit: cover;
                    margin-bottom: 10px;
                }
                .profile-section h1 {
                    margin: 0;
                    font-size: 2rem;
                    margin-bottom: 5px;
                }
                .profile-section h2 {
                    margin: 0;
                    font-size: 1.2rem;
                    color: #aaa;
                }
                .contact-info {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    margin-top: 20px;
                }
                .contact-info div {
                    text-align: center;
                }
                .contact-info .label {
                    font-size: 0.8rem;
                    color: #bbb;
                    margin-bottom: 5px;
                }
                .contact-info .value {
                    font-size: 1rem;
                }
                .section {
                    background: #252525;
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .section h2 {
                    margin-top: 0;
                    font-size: 1.4rem;
                    border-bottom: 1px solid #444;
                    padding-bottom: 10px;
                    margin-bottom: 20px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }
                .info-item {
                    background: #2a2a2a;
                    border-radius: 5px;
                    padding: 15px;
                }
                .info-item .label {
                    font-weight: bold;
                    font-size: 0.9rem;
                    color: #aaa;
                    margin-bottom: 8px;
                }
                .info-item .value {
                    font-size: 1rem;
                    color: #f0f0f0;
                }
                a {
                    color: #6E38E0;
                    text-decoration: none;
                }
                .contact-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px; /* Adjust spacing between items as needed */
  margin-top: 20px;
}

.contact-item {
  text-align: center;
}

.contact-item .label {
  font-size: 0.9rem;
  color: #bbb;
  margin-bottom: 5px;
}

.contact-item .value {
  font-size: 1.1rem;
  font-weight: bold;
  color: #f0f0f0;
}

            </style>
        """
        # Skills Section
        skills_section = ""
        try:
            skills = json.loads(candidate.skills) if candidate.skills else []
        except json.JSONDecodeError:
            skills = []
        if skills:
            skills_section = f"""
                <div class="section">
                    <h2>Skills</h2>
                    <div class="value">{", ".join(skills)}</div>
                </div>
            """

        # Education Section
        education_section = ""
        try:
            education = json.loads(candidate.education) if candidate.education else []
        except json.JSONDecodeError:
            education = []
        if education:
            edu_items = []
            for edu in education:
                edu_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{edu.get('degree', '')}</strong><br>
                            {edu.get('institution', '')}<br>
                            Year: {edu.get('year_of_completion', '')}
                        </div>
                    </div>
                """)
            education_section = f"""
                <div class="section">
                    <h2>Education</h2>
                    <div class="info-grid">
                        {"".join(edu_items)}
                    </div>
                </div>
            """

        # Experience Section
        experience_section = ""
        try:
            experience_details = json.loads(candidate.experience_details) if candidate.experience_details else []
        except json.JSONDecodeError:
            experience_details = []
        if experience_details:
            exp_items = []
            for exp in experience_details:
                exp_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{exp.get('company', '')}</strong><br>
                            Role: {exp.get('role', '')}<br>
                            Duration: {exp.get('duration', '')}<br>
                            {exp.get('description', '')}
                        </div>
                    </div>
                """)
            experience_section = f"""
                <div class="section">
                    <h2>Experience Details</h2>
                    <div class="info-grid">
                        {"".join(exp_items)}
                    </div>
                </div>
            """

        # Projects Section
        projects_section = ""
        try:
            projects = json.loads(candidate.projects) if candidate.projects else []
        except json.JSONDecodeError:
            projects = []
        if projects:
            proj_items = []
            for proj in projects:
                proj_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{proj.get('name', '')}</strong><br>
                            {proj.get('description', '')}<br>
                            <a href="{proj.get('link', '#')}" target="_blank">Project Link</a>
                        </div>
                    </div>
                """)
            projects_section = f"""
                <div class="section">
                    <h2>Projects</h2>
                    <div class="info-grid">
                        {"".join(proj_items)}
                    </div>
                </div>
            """

        # URL/Attachments Section
        url_section = ""
        if urls:
            url_items = []
            for url_type, url in urls.items():
                safe_url = url.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                url_items.append(f"""
                    <div class="info-item">
                        <div class="label">{url_type.title()}</div>
                        <div class="value"><a href="{safe_url}" target="_blank">{safe_url}</a></div>
                    </div>
                """)
            url_section = f"""
                <div class="section">
                    <h2>Attachments</h2>
                    <div class="info-grid">
                        {"".join(url_items)}
                    </div>
                </div>
            """

        # Build the complete HTML content to mimic the drawer layout
        html_content = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                {css_styles}
            </head>
            <body>
                <div class="container">
                    <!-- Profile Section -->
                    <div class="profile-section">
                        <h1>{candidate.name}</h1>
                        <h2>{candidate.applied_role}</h2>
                        <div class="contact-info">
  <div class="contact-item">
    <div class="label">EMAIL</div>
    <div class="value">{candidate.email}</div>
  </div>
  <div class="contact-item">
    <div class="label">PHONE</div>
    <div class="value">{candidate.phone}</div>
  </div>
</div>

                    </div>
                    <!-- Application Details Section -->
                    <div class="section">
                        <h2>Application Details</h2>
                        <div class="info-grid">
                            <div class="info-item">
                                <div class="label">Status</div>
                                <div class="value">{candidate.status}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Stage</div>
                                <div class="value">{candidate.stage}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Rating</div>
                                <div class="value">{candidate.rating} / 5.0</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Application Date</div>
                                <div class="value">{candidate.application_date.strftime('%B %d, %Y')}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Location</div>
                                <div class="value">{candidate.location or "Not specified"}</div>
                            </div>
                            <div class="info-item">
                                <div class="label">Applied Role</div>
                                <div class="value">{candidate.applied_role}</div>
                            </div>
                        </div>
                    </div>
                    <!-- Basic Information Section -->
                    <div class="section">
                        <h2>Basic Information</h2>
                        <div class="value">{candidate.basic_info or "Not provided"}</div>
                    </div>
                    {skills_section}
                    {education_section}
                    {experience_section}
                    {projects_section}
                    {url_section}
                </div>
            </body>
        </html>
        """

        try:
            pdf = weasyprint.HTML(string=html_content).write_pdf()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Error generating PDF: {str(e)}"
            )

        return Response(
            content=pdf,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{candidate.name.replace(" ", "_")}_{candidate_id}.pdf"',
                "Content-Type": "application/pdf"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing request: {str(e)}"
        )

@app.get("/candidates/search/", response_model=List[CandidateResponse])
def search_candidates(query: str, db: Session = Depends(get_db)):
    """
    Search for candidates using a keyword across multiple candidate fields.
    """
    search_term = f"%{query}%"
    candidates = db.query(Candidate).filter(
        Candidate.name.ilike(search_term) |
        Candidate.email.ilike(search_term) |
        Candidate.applied_role.ilike(search_term) |
        Candidate.experience.ilike(search_term) |
        Candidate.phone.ilike(search_term) |
        Candidate.stage.ilike(search_term) |
        Candidate.status.ilike(search_term) |
        Candidate.location.ilike(search_term)
    ).all()
    return candidates

@app.get("/candidates/{candidate_id}/")
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific candidate by ID.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@app.post("/seed/")
def seed_data(db: Session = Depends(get_db)):
    """
    Seed the database with sample data for development purposes.
    """
    db.query(Candidate).delete()
    
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
            attachments=3,
            basic_info="A creative designer with a passion for user-centered design.",
            skills=json.dumps(["Figma", "Sketch", "Prototyping", "User Research", "Design Systems"]),
            education=json.dumps([
                {"degree": "B.Des in Interaction Design", "institution": "National Institute of Design", "year_of_completion": 2018}
            ]),
            experience_details=json.dumps([
                {"company": "ABC Design Studio", "role": "UX Designer", "duration": "2018 - 2020", "description": "Redesigned e-commerce platforms, increasing user satisfaction by 25%."},
                {"company": "XYZ Tech", "role": "Senior UX Designer", "duration": "2020 - Present", "description": "Leading a team to build intuitive SaaS products."}
            ]),
            projects=json.dumps([
                {"name": "Mobile Banking Redesign", "description": "Overhauled UI/UX for a major bank's mobile app, reducing drop-off rates by 30%.", "link": "https://example.com/projects/mobile-banking"}
            ])
        ),
    ]
    
    for candidate in candidates:
        db.add(candidate)
        
    db.commit()
    return {"message": "Sample data created successfully"}
