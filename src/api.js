import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Mock data for development
const mockCandidates = [
  {
    id: 1,
    name: "Charlie Kristen",
    email: "charlie@example.com",
    phone: "555-123-4567",
    rating: 4.0,
    stage: "Design Challenge",
    applied_role: "Sr. UX Designer",
    application_date: "2023-02-12",
    attachments: 3,
    status: "In Process",
    experience: "3+ years"
  },
  {
    id: 2,
    name: "Malaika Brown",
    email: "malaika@example.com",
    phone: "555-345-6789",
    rating: 3.5,
    stage: "Screening",
    applied_role: "Growth Manager",
    application_date: "2023-02-18",
    attachments: 1,
    status: "In Process",
    experience: "2+ years"
  },
  {
    id: 3,
    name: "Simon Minter",
    email: "simon@example.com",
    phone: "555-678-9012",
    rating: 2.8,
    stage: "Design Challenge",
    applied_role: "Financial Analyst",
    application_date: "2023-01-04",
    attachments: 2,
    status: "In Process",
    experience: "4+ years"
  },
  {
    id: 4,
    name: "Ashley Brooke",
    email: "ashley@example.com",
    phone: "555-789-0123",
    rating: 4.5,
    stage: "HR Round",
    applied_role: "Financial Analyst",
    application_date: "2023-03-05",
    attachments: 3,
    status: "In Process",
    experience: "5+ years"
  },
  {
    id: 5,
    name: "Nishant Talwar",
    email: "nishant@example.com",
    phone: "555-890-1234",
    rating: 5.0,
    stage: "Round 2 Interview",
    applied_role: "Sr. UX Designer",
    application_date: "2022-12-24",
    attachments: 2,
    status: "In Process",
    experience: "3+ years"
  },
  {
    id: 6,
    name: "Mark Jacobs",
    email: "mark@example.com",
    phone: "555-901-2345",
    rating: 2.0,
    stage: "Rejected",
    applied_role: "Growth Manager",
    application_date: "2023-02-13",
    attachments: 1,
    status: "Rejected",
    experience: "1+ years"
  }
];

const mockOpenings = [
  {
    id: 1, 
    title: "Sr. UX Designer", 
    location: "Bengaluru", 
    experience: "3 years exp.", 
    applications: 45, 
    newApps: 25, 
    postedDays: 2, 
    color: "#29C5EE",
    icon: "🎨"
  },
  {
    id: 2, 
    title: "Growth Manager", 
    location: "Remote", 
    experience: "2+ years exp.", 
    applications: 38, 
    newApps: 10, 
    postedDays: 5, 
    color: "#CF1A2C",
    icon: "🚀"
  },
  {
    id: 3, 
    title: "Financial Analyst", 
    location: "Mumbai", 
    experience: "5+ years exp.", 
    applications: 25, 
    newApps: 25, 
    postedDays: 10, 
    color: "#EAB04D",
    icon: "🪙"
  },
  {
    id: 4, 
    title: "Senior Developer", 
    location: "New Delhi", 
    experience: "4+ years exp.", 
    applications: 105, 
    newApps: 20, 
    postedDays: 3, 
    color: "#4DD1A5",
    icon: "💻"
  }
];

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