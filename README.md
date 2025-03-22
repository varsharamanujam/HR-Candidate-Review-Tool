# HR Candidate Review Tool

A modern web application for managing and reviewing job candidates, built with React and Python.

## Features

- Interactive candidate table with sorting and filtering
- Detailed candidate profiles with application stage tracking
- PDF generation for candidate details
- Responsive design for all devices

## Tech Stack

### Frontend
- React.js
- Chakra UI for components and styling
- Tailwind CSS for utility classes
- Vite for build tooling

### Backend
- Python
- FastAPI
- SQLite database

## Prerequisites

- Node.js (v16 or higher)
- Python 3.8 or higher
- pip (Python package installer)

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd HR-Candidate-Review-Tool
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
cd ..
```

## Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app
```
The backend will be available at http://localhost:8000

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```
The frontend will be available at http://localhost:5173

## Development Guidelines

### Frontend Structure

```
src/
  ├── components/     # React components
  ├── api/           # API integration
  ├── assets/        # Static assets
```

### Backend Structure

```
backend/
  ├── database.py    # Database models and connection
  ├── main.py       # FastAPI application and routes
  └── test_files/   # Test data and fixtures
```

## API Documentation

The backend API provides the following endpoints:

- `GET /candidates/` - List all candidates
- `GET /candidates/{id}` - Get candidate details
- `GET /candidates/{id}/pdf` - Generate candidate PDF
- `GET /candidates/filter` - Filter candidates by criteria
