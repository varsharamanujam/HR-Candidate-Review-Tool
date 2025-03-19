# HR Candidate Review Tool

A comprehensive application for managing job candidates throughout the hiring process. This tool helps HR teams track applicants, review their profiles, and manage their progress through different interview stages.

## Features

- View all candidates in a centralized dashboard
- Filter and search candidates by role, status, and other criteria
- Filter candidates by application date (month and year)
- Sort candidates by any field (name, email, experience, etc.)
- Import candidate data from CSV or JSON files
- Update candidate status as they progress through the hiring process
- Generate PDF reports for candidate profiles

## Backend API Endpoints

The application provides the following REST API endpoints:

### Candidates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidates/` | Fetch a paginated list of all candidates |
| GET | `/candidates/{candidate_id}` | Get a candidate by ID |
| POST | `/candidates/` | Create a new candidate |
| PATCH | `/candidates/{candidate_id}/status/` | Update candidate status |
| DELETE | `/candidates/{candidate_id}` | Delete a candidate |
| GET | `/candidates/filter/` | Filter, search, and sort candidates based on various criteria |
| POST | `/candidates/import/` | Import candidates from a CSV file |
| POST | `/candidates/import-json/` | Import candidates from a JSON file |
| GET | `/candidates/{candidate_id}/pdf/` | Generate a PDF with the candidate's details |

### Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/candidates/roles/` | Get a list of all available roles for filtering |
| GET | `/candidates/statuses/` | Get a list of all available statuses for filtering |
| GET | `/candidates/application-months/` | Get a list of available application months for date filtering |

## API Usage Examples

### Date Filtering

You can filter candidates by their application date using the following query parameters:

```
# Get candidates who applied in March 2023
GET /candidates/filter/?month=3&year=2023

# Get all candidates from 2023, sorted by application date
GET /candidates/filter/?year=2023&sort_by=application_date&sort_order=desc
```

### Sorting by Any Field

You can sort candidates by any field in the database:

```
# Sort by experience (ascending)
GET /candidates/filter/?sort_by=experience&sort_order=asc

# Sort by application date (newest first)
GET /candidates/filter/?sort_by=application_date&sort_order=desc

# Sort by name (A-Z) with role filtering
GET /candidates/filter/?role=Software%20Engineer&sort_by=name&sort_order=asc

# Filter by status and sort by email
GET /candidates/filter/?status=Selected&sort_by=email&sort_order=asc
```

### Importing JSON Data

Example JSON format for candidate import:

```json
[
    {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "123-456-7890",
        "applied_role": "Software Engineer",
        "experience": "5 years",
        "status": "Pending",
        "resume_url": "https://example.com/resume/john.pdf"
    },
    {
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "987-654-3210",
        "applied_role": "UX Designer",
        "experience": "3 years"
    }
]
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python run.py
   ```

The API will be available at `http://localhost:8000`. 
API documentation is available at `http://localhost:8000/docs`.

### Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy
- **Database**: SQLite (for development)
