from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from database import SessionLocal, Candidate, init_db
from pydantic import BaseModel
import pandas as pd
import io
import weasyprint

app = FastAPI()

# Initialize the database
init_db()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Candidate Schema
class CandidateCreate(BaseModel):
    name: str
    email: str
    phone: str
    applied_role: str
    experience: str
    status: str = "Pending"
    resume_url: str = None

class CandidateUpdate(BaseModel):
    status: str

# **1. Fetch Candidate List**
@app.get("/candidates/")
def get_candidates(db: Session = Depends(get_db)):
    return db.query(Candidate).all()

#  **2. Filtering, Searching, and Sorting Candidates**
@app.get("/candidates/filter/")
def filter_candidates(
    db: Session = Depends(get_db),
    role: str = None,
    status: str = None,
    search: str = None,
    sort_by: str = "name"
):
    query = db.query(Candidate)
    
    if role:
        query = query.filter(Candidate.applied_role == role)
    if status:
        query = query.filter(Candidate.status == status)
    if search:
        query = query.filter(Candidate.name.contains(search) | Candidate.email.contains(search))

    # Sorting
    if sort_by == "name":
        query = query.order_by(Candidate.name)
    elif sort_by == "application_date":
        query = query.order_by(Candidate.application_date.desc())

    return query.all()

# **3. Import Candidate Data from CSV**
@app.post("/candidates/import/")
def import_candidates(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = file.file.read()
    df = pd.read_csv(io.StringIO(contents.decode("utf-8")))

    for _, row in df.iterrows():
        candidate = Candidate(
            name=row["name"],
            email=row["email"],
            phone=row["phone"],
            applied_role=row["applied_role"],
            experience=row["experience"],
            status=row.get("status", "Pending"),
            resume_url=row.get("resume_url", None),
        )
        db.add(candidate)
    db.commit()
    return {"message": "Candidates imported successfully"}

# **4. Update Candidate Status (Reject/Move to Next Step)**
@app.patch("/candidates/{candidate_id}/status/")
def update_status(candidate_id: int, update: CandidateUpdate, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate.status = update.status
    db.commit()
    db.refresh(candidate)
    return candidate

# **5. Generate PDF for Candidate Details**
@app.get("/candidates/{candidate_id}/pdf/")
def generate_pdf(candidate_id: int, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

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
            <p><strong>Application Date:</strong> {candidate.application_date.strftime('%Y-%m-%d')}</p>
        </body>
    </html>
    """
    
    pdf = weasyprint.HTML(string=html_content).write_pdf()
    return pdf
