import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

// Fetch all candidates from the FastAPI backend
export const fetchCandidates = async () => {
  const response = await axios.get(`${API_BASE_URL}/candidates/`);
  return response.data;
};

// Fetch job openings from the backend
export const fetchOpenings = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/openings/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching openings:", error);
    return []; // Return empty array if error occurs
  }
};