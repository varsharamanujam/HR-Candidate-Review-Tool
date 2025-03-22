"""
Script to run the FastAPI server for the HR Candidate Review Tool.
"""
import uvicorn

if __name__ == "__main__":
    """
    Run the FastAPI application with uvicorn.
    
    This script starts the backend API server with the following configuration:
    - host: 0.0.0.0 (accessible from any network interface)
    - port: 8000 (default FastAPI port)
    - reload: True (automatically reload on code changes, useful for development)
    """
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 