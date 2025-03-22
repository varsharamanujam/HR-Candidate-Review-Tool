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
from typing import List, Optional, Dict, Union
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
    basic_info: Optional[str]
    skills: Optional[str]  # JSON string storing skills
    education: Optional[str]  # JSON string storing education details
    experience_details: Optional[str]  # JSON string storing detailed experience
    projects: Optional[str]  # JSON string storing project details
    svg_photo: Optional[str]  # Path to candidate's SVG photo

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
        basic_info (Optional[str]): Basic information about the candidate
        skills (Optional[str]): JSON string storing skills
        education (Optional[str]): JSON string storing education details
        experience_details (Optional[str]): JSON string storing detailed experience
        projects (Optional[str]): JSON string storing project details
        svg_photo (Optional[str]): Path to candidate's SVG photo
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
    role: Optional[str] = None,
    status: Optional[str] = None,
    stage: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = DEFAULT_SORT,
    month_year: Optional[str] = None,
) -> List[CandidateResponse]:
    """
    Filter and sort candidates based on various criteria.

    Args:
        db (Session): Database session
        role (Optional[str]): Filter by applied role
        status (Optional[str]): Filter by status (must be in STATUSES)
        stage (Optional[str]): Filter by stage (must be in STAGES)
        search (Optional[str]): Search in name, email, and role
        sort_by (str): Field to sort by (must be in SORT_FIELDS)
        month_year (Optional[str]): Filter by month and year (format: YYYY-MM)

    Returns:
        List[CandidateResponse]: List of filtered candidates

    Raises:
        HTTPException: If invalid status, stage, or sort field is provided
    """
    # Validate inputs
    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {STATUSES}")
    if stage and stage not in STAGES:
        raise HTTPException(status_code=400, detail=f"Invalid stage. Must be one of: {STAGES}")
    if sort_by not in SORT_FIELDS:
        raise HTTPException(status_code=400, detail=f"Invalid sort field. Must be one of: {SORT_FIELDS}")

    query = db.query(Candidate)
    
    # Apply filters
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
    
    # Handle month_year filter
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
    
    # Apply sorting
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
def generate_pdf(candidate_id: int, db: Session = Depends(get_db)) -> Response:
    """
    Generate a PDF document with candidate details.

    Args:
        candidate_id (int): ID of the candidate
        db (Session): Database session dependency

    Returns:
        Response: PDF file as a downloadable attachment

    Raises:
        HTTPException: If candidate is not found or PDF generation fails
    """
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")

        # Parse URLs from JSON string with error handling
        try:
            urls = json.loads(candidate.urls) if candidate.urls else {}
        except json.JSONDecodeError:
            urls = {}
            print(f"Warning: Invalid JSON in URLs for candidate {candidate_id}")

        # CSS styles for better PDF formatting
        css_styles = """
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1 {
                    color: #6E38E0;
                    border-bottom: 2px solid #6E38E0;
                    padding-bottom: 10px;
                    margin-bottom: 30px;
                }
                h2 {
                    color: #555;
                    margin-top: 25px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .info-item {
                    padding: 10px;
                    background: #f8f8f8;
                    border-radius: 5px;
                }
                .label {
                    font-weight: bold;
                    color: #666;
                    margin-bottom: 5px;
                }
                .value {
                    color: #333;
                }
                .status {
                    display: inline-block;
                    padding: 5px 10px;
                    border-radius: 15px;
                    background: #6E38E0;
                    color: white;
                }
                .attachments {
                    margin-top: 30px;
                    padding: 20px;
                    background: #f8f8f8;
                    border-radius: 5px;
                }
                a {
                    color: #6E38E0;
                    text-decoration: none;
                }
            </style>
        """

        # Create URL section HTML with better structure
        url_section = ""
        if urls:
            url_items = []
            for url_type, url in urls.items():
                safe_url = url.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                url_items.append(f"""
                    <div class="info-item">
                        <div class="label">{url_type.title()}</div>
                        <div class="value"><a href="{safe_url}">{safe_url}</a></div>
                    </div>
                """)
            if url_items:
                url_section = f"""
                    <div class="attachments">
                        <h2>Attachments</h2>
                        <div class="info-grid">
                            {"".join(url_items)}
                        </div>
                    </div>
                """

        # Parse additional JSON fields
        try:
            skills = json.loads(candidate.skills) if candidate.skills else []
            education = json.loads(candidate.education) if candidate.education else []
            experience_details = json.loads(candidate.experience_details) if candidate.experience_details else []
            projects = json.loads(candidate.projects) if candidate.projects else []
        except json.JSONDecodeError:
            skills, education, experience_details, projects = [], [], [], []

        # Create sections for additional details
        skills_section = ""
        if skills:
            skills_html = ", ".join(skills)
            skills_section = f"""
                <div class="section">
                    <h2>Skills</h2>
                    <div class="info-item">
                        <div class="value">{skills_html}</div>
                    </div>
                </div>
            """

        education_section = ""
        if education:
            edu_items = []
            for edu in education:
                edu_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{edu.get('degree', '')}</strong><br>
                            {edu.get('institution', '')}<br>
                            Year of Completion: {edu.get('year_of_completion', '')}
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

        experience_section = ""
        if experience_details:
            exp_items = []
            for exp in experience_details:
                exp_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{exp.get('company', '')}</strong><br>
                            Role: {exp.get('role', '')}<br>
                            Duration: {exp.get('duration', '')}<br>
                            <p>{exp.get('description', '')}</p>
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

        projects_section = ""
        if projects:
            proj_items = []
            for proj in projects:
                proj_items.append(f"""
                    <div class="info-item">
                        <div class="value">
                            <strong>{proj.get('name', '')}</strong><br>
                            <p>{proj.get('description', '')}</p>
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

        # Create PDF content with improved layout
        html_content = f"""
        <html>
            <head>
                <meta charset="UTF-8">
                {css_styles}
                <style>
                    .section {{
                        margin-top: 30px;
                        padding: 20px;
                        background: #f8f8f8;
                        border-radius: 5px;
                    }}
                </style>
            </head>
            <body>
                <h1>Candidate Details</h1>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="label">Name</div>
                        <div class="value">{candidate.name}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Email</div>
                        <div class="value">{candidate.email}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Phone</div>
                        <div class="value">{candidate.phone}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Applied Role</div>
                        <div class="value">{candidate.applied_role}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Experience</div>
                        <div class="value">{candidate.experience}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Status</div>
                        <div class="value"><span class="status">{candidate.status}</span></div>
                    </div>
                    <div class="info-item">
                        <div class="label">Current Stage</div>
                        <div class="value">{candidate.stage}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Rating</div>
                        <div class="value">{candidate.rating} / 5.0</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Location</div>
                        <div class="value">{candidate.location or "Not specified"}</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Application Date</div>
                        <div class="value">{candidate.application_date.strftime('%B %d, %Y')}</div>
                    </div>
                </div>
                <div class="section">
                    <h2>Basic Information</h2>
                    <div class="info-item">
                        <div class="value">{candidate.basic_info or "Not provided"}</div>
                    </div>
                </div>
                {skills_section}
                {education_section}
                {experience_section}
                {projects_section}
                {url_section}
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
    
    Args:
        query (str): The search keyword.
        db (Session): Database session dependency.

    Returns:
        List[CandidateResponse]: List of matching candidates.
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
    Seed the database with sample data for development purposes, including extended resume fields.
    """
    # Clear existing data
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
            attachments=1,
            basic_info="Enthusiastic growth marketer focused on user acquisition.",
            skills=json.dumps(["Growth Hacking", "A/B Testing", "Marketing Automation", "SEO"]),
            education=json.dumps([
                {"degree": "BBA in Marketing", "institution": "Stanford University", "year_of_completion": 2022}
            ]),
            experience_details=json.dumps([
                {"company": "StartUp Co.", "role": "Growth Specialist", "duration": "2022 - Present", "description": "Increased user sign-ups by 40% through targeted campaigns."}
            ]),
            projects=json.dumps([
                {"name": "Referral Program Launch", "description": "Implemented a referral system that drove a 25% increase in new users.", "link": "https://example.com/projects/referral-launch"}
            ]),
            svg_photo="backend/test_files/malaikabrown.svg"
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
            attachments=2,
            basic_info="Detail-oriented analyst with strong data visualization skills.",
            skills=json.dumps(["Excel Modeling", "Power BI", "Financial Forecasting", "Data Visualization"]),
            education=json.dumps([
                {"degree": "B.Com in Finance", "institution": "University of Mumbai", "year_of_completion": 2020}
            ]),
            experience_details=json.dumps([
                {"company": "Invest Corp", "role": "Junior Analyst", "duration": "2020 - 2022", "description": "Assisted in portfolio management."},
                {"company": "Market Insights Ltd", "role": "Financial Analyst", "duration": "2022 - Present", "description": "Developing financial models."}
            ]),
            projects=json.dumps([
                {"name": "Risk Analysis Dashboard", "description": "Created an interactive dashboard to track market risks.", "link": "https://example.com/projects/risk-dashboard"}
            ]),
            svg_photo="backend/test_files/simon.svg"
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
            attachments=3,
            basic_info="Passionate about leveraging data to drive strategic financial decisions.",
            skills=json.dumps(["Financial Modeling", "Risk Management", "SQL", "Tableau"]),
            education=json.dumps([
                {"degree": "MBA in Finance", "institution": "IIM Ahmedabad", "year_of_completion": 2019}
            ]),
            experience_details=json.dumps([
                {"company": "Global Finance Solutions", "role": "Finance Associate", "duration": "2019 - 2021", "description": "Handled forecasting for international transactions."},
                {"company": "Prestige Analytics", "role": "Senior Financial Analyst", "duration": "2021 - Present", "description": "Leading a team to analyze complex financial instruments."}
            ]),
            projects=json.dumps([
                {"name": "Investment Portfolio Optimization", "description": "Managed a portfolio of investments and optimized returns.", "link": "https://example.com/projects/investment-portfolio"}
            ]),
            svg_photo="backend/test_files/ashley.svg"
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
            attachments=2,
            basic_info="Expert in creating intuitive user experiences with a deep understanding of design systems.",
            skills=json.dumps(["Adobe XD", "Wireframing", "User Interviews", "Design Systems"]),
            education=json.dumps([
                {"degree": "B.Tech in Computer Science", "institution": "IIT Delhi", "year_of_completion": 2016}
            ]),
            experience_details=json.dumps([
                {"company": "Alpha Tech", "role": "UI/UX Designer", "duration": "2016 - 2019", "description": "Developed user flows and wireframes for SaaS platforms."},
                {"company": "Designify Inc", "role": "Sr. UX Designer", "duration": "2019 - Present", "description": "Mentored junior designers and led design sprints."}
            ]),
            projects=json.dumps([
                {"name": "E-Commerce Redesign", "description": "Led a complete revamp of an e-commerce site, improving conversions by 35%.", "link": "https://example.com/projects/ecommerce-redesign"}
            ]),
            svg_photo="backend/test_files/nishant.svg"
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
            attachments=1,
            basic_info="Ambitious marketer with experience in early-stage startups.",
            skills=json.dumps(["Content Marketing", "Email Campaigns", "Market Research"]),
            education=json.dumps([
                {"degree": "BA in Marketing", "institution": "Harvard University", "year_of_completion": 2021}
            ]),
            experience_details=json.dumps([
                {"company": "NewWave Startup", "role": "Growth Associate", "duration": "2021 - 2022", "description": "Focused on email and social media strategies."}
            ]),
            projects=json.dumps([
                {"name": "Social Media Influencer Campaign", "description": "Collaborated with influencers to boost brand visibility.", "link": "https://example.com/projects/social-influencer"}
            ]),
            svg_photo="backend/test_files/mark.svg"
        )
    ]
    
    for candidate in candidates:
        db.add(candidate)
        
    db.commit()
    return {"message": "Sample data created successfully"}
