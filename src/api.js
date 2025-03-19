import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Error handler
const handleError = (error, defaultValue = null) => {
  if (error.response) {
    // Server responded with error status
    console.error("Server Error:", error.response.data);
    throw new Error(error.response.data.detail || "Server error occurred");
  } else if (error.request) {
    // Request made but no response
    console.error("Network Error:", error.request);
    throw new Error("Network error occurred");
  } else {
    // Other errors
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};

// Fetch all candidates
export const fetchCandidates = async () => {
  try {
    // Try to fetch from backend
    const response = await api.get("/candidates/");
    return response.data;
  } catch (error) {
    console.error("Falling back to mock data:", error);
    // Return mock data if the backend request fails
    return mockCandidates;
  }
};

// Fetch filtered candidates
export const filterCandidates = async (filters) => {
  try {
    const response = await api.get("/candidates/filter/", { params: filters });
    return response.data;
  } catch (error) {
    console.error("Falling back to client-side filtering:", error);
    // Client-side filtering with mock data
    let filtered = [...mockCandidates];
    
    if (filters.role) {
      filtered = filtered.filter(c => c.applied_role === filters.role);
    }
    
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    
    if (filters.stage) {
      filtered = filtered.filter(c => c.stage === filters.stage);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm) || 
        c.email.toLowerCase().includes(searchTerm) ||
        c.applied_role.toLowerCase().includes(searchTerm)
      );
    }
    
    if (filters.sort_by === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sort_by === "application_date") {
      filtered.sort((a, b) => new Date(b.application_date) - new Date(a.application_date));
    }
    
    return filtered;
  }
};

// Update candidate status
export const updateCandidateStatus = async (candidateId, updateData) => {
  try {
    const response = await api.patch(`/candidates/${candidateId}/status/`, updateData);
    return response.data;
  } catch (error) {
    console.warn("Mock update (no backend connection):", error);
    // Return a mock updated candidate
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updatedCandidate = { 
      ...candidate, 
      status: updateData.status,
      stage: updateData.stage || candidate.stage
    };
    
    // Update the mock data
    const idx = mockCandidates.findIndex(c => c.id === candidateId);
    if (idx >= 0) {
      mockCandidates[idx] = updatedCandidate;
    }
    
    return updatedCandidate;
  }
};

// Generate candidate PDF
export const generateCandidatePDF = async (candidateId) => {
  try {
    const response = await api.get(`/candidates/${candidateId}/pdf/`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.warn("PDF generation would happen on backend:", error);
    // Mock PDF generation (in real app this would happen on backend)
    throw new Error("PDF generation requires backend connection");
  }
};

// Import candidates from JSON
export const importCandidates = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/candidates/import/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.warn("Import requires backend connection:", error);
    throw new Error("Import requires backend connection");
  }
};

// Fetch job openings
export const fetchOpenings = async () => {
  try {
    const response = await api.get("/openings/");
    return response.data;
  } catch (error) {
    console.error("Falling back to mock openings data:", error);
    return mockOpenings;
  }
};

// Get single candidate
export const getCandidate = async (candidateId) => {
  try {
    const response = await api.get(`/candidates/${candidateId}/`);
    return response.data;
  } catch (error) {
    console.warn("Falling back to mock candidate data:", error);
    const candidate = mockCandidates.find(c => c.id === parseInt(candidateId, 10));
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    return candidate;
  }
};

// Sort candidates
export const sortCandidates = async (candidates, sortField, sortDirection) => {
  try {
    const response = await api.post("/candidates/sort/", {
      candidates,
      sort_field: sortField,
      sort_direction: sortDirection
    });
    return response.data;
  } catch (error) {
    console.warn("Falling back to client-side sorting:", error);
    
    // Client-side sorting fallback
    const sorted = [...candidates].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "rating") {
        comparison = a.rating - b.rating;
      } else if (sortField === "stage") {
        comparison = a.stage.localeCompare(b.stage);
      } else if (sortField === "applied_role") {
        comparison = a.applied_role.localeCompare(b.applied_role);
      } else if (sortField === "application_date") {
        comparison = new Date(a.application_date) - new Date(b.application_date);
      } else if (sortField === "attachments") {
        comparison = a.attachments - b.attachments;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return sorted;
  }
};