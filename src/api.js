/**
 * @fileoverview API client for the HR Candidate Review Tool
 * Provides functions for interacting with the backend API and handles fallback to mock data when needed.
 *
 * @module api
 */

import axios from "axios";

// Constants
const API_BASE_URL = "http://127.0.0.1:8000";
const ENDPOINTS = {
  CANDIDATES: '/candidates',
  FILTER: '/candidates/filter',
  STATUS: (id) => `/candidates/${id}/status`,
  PDF: (id) => `/candidates/${id}/pdf`,
  IMPORT: '/candidates/import',
  SORT: '/candidates/sort'
};

const SORT_FIELDS = {
  NAME: 'name',
  RATING: 'rating',
  STAGE: 'stage',
  APPLIED_ROLE: 'applied_role',
  APPLICATION_DATE: 'application_date',
  ATTACHMENTS: 'attachments'
};

/**
 * Axios instance configured with base URL and default headers
 * @type {import('axios').AxiosInstance}
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * @typedef {Object} Candidate
 * @property {number} id - Unique identifier
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} phone - Phone number
 * @property {string} applied_role - Position applied for
 * @property {string} stage - Current application stage
 * @property {string} status - Application status
 * @property {number} rating - Candidate rating
 * @property {string} application_date - Application submission date
 * @property {number} attachments - Number of attached documents
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string} [role] - Filter by applied role
 * @property {string} [status] - Filter by status
 * @property {string} [stage] - Filter by stage
 * @property {string} [search] - Search term for name/email/role
 * @property {string} [sort_by] - Field to sort by
 */

/**
 * Handles API errors and provides meaningful error messages
 * @param {Error} error - The error object from axios
 * @throws {Error} Formatted error message
 */
const handleError = (error) => {
  if (error.response) {
    console.error("Server Error:", error.response.data);
    throw new Error(error.response.data.detail || "Server error occurred");
  } else if (error.request) {
    console.error("Network Error:", error.request);
    throw new Error("Network error occurred");
  } else {
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
};

/**
 * Fetches all candidates from the API
 * @returns {Promise<Candidate[]>} Array of candidates
 */
export const fetchCandidates = async () => {
  try {
    const response = await api.get(ENDPOINTS.CANDIDATES);
    return response.data;
  } catch (error) {
    console.error("Falling back to mock data:", error);
    return mockCandidates;
  }
};

/**
 * Fetches filtered candidates based on provided criteria
 * @param {FilterOptions} filters - Filter criteria
 * @returns {Promise<Candidate[]>} Filtered array of candidates
 */
export const filterCandidates = async (filters) => {
  try {
    const response = await api.get(ENDPOINTS.FILTER, { params: filters });
    return response.data;
  } catch (error) {
    console.error("Falling back to client-side filtering:", error);
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
    
    if (filters.sort_by === SORT_FIELDS.NAME) {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (filters.sort_by === SORT_FIELDS.APPLICATION_DATE) {
      filtered.sort((a, b) => new Date(b.application_date) - new Date(a.application_date));
    }
    
    return filtered;
  }
};

/**
 * @typedef {Object} StatusUpdate
 * @property {string} status - New status
 * @property {string} [stage] - New stage (optional)
 */

/**
 * Updates a candidate's status and stage
 * @param {number} candidateId - ID of the candidate to update
 * @param {StatusUpdate} updateData - New status and stage data
 * @returns {Promise<Candidate>} Updated candidate data
 */
export const updateCandidateStatus = async (candidateId, updateData) => {
  try {
    const response = await api.patch(ENDPOINTS.STATUS(candidateId), updateData);
    return response.data;
  } catch (error) {
    console.warn("Mock update (no backend connection):", error);
    const candidate = mockCandidates.find(c => c.id === candidateId);
    if (!candidate) {
      throw new Error("Candidate not found");
    }
    
    const updatedCandidate = {
      ...candidate,
      status: updateData.status,
      stage: updateData.stage || candidate.stage
    };
    
    const idx = mockCandidates.findIndex(c => c.id === candidateId);
    if (idx >= 0) {
      mockCandidates[idx] = updatedCandidate;
    }
    
    return updatedCandidate;
  }
};

/**
 * Generates a PDF with candidate details
 * @param {number} candidateId - ID of the candidate
 * @returns {Promise<Blob>} PDF file as a blob
 */
export const generateCandidatePDF = async (candidateId) => {
  try {
    const response = await api.get(ENDPOINTS.PDF(candidateId), {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.warn("PDF generation would happen on backend:", error);
    throw new Error("PDF generation requires backend connection");
  }
};

/**
 * Imports candidates from a JSON file
 * @param {File} file - JSON file containing candidate data
 * @returns {Promise<Candidate[]>} Array of imported candidates
 */
export const importCandidates = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(ENDPOINTS.IMPORT, formData, {
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

/**
 * @typedef {Object} JobOpening
 * @property {number} id - Opening ID
 * @property {string} title - Job title
 * @property {string} department - Department
 * @property {string} location - Job location
 */

/**

/**
 * Fetches a single candidate by ID
 * @param {number} candidateId - ID of the candidate
 * @returns {Promise<Candidate>} Candidate data
 */
export const getCandidate = async (candidateId) => {
  try {
    const response = await api.get(`${ENDPOINTS.CANDIDATES}/${candidateId}`);
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

/**
 * Sorts an array of candidates
 * @param {Candidate[]} candidates - Array of candidates to sort
 * @param {string} sortField - Field to sort by
 * @param {'asc'|'desc'} sortDirection - Sort direction
 * @returns {Promise<Candidate[]>} Sorted array of candidates
 */
export const sortCandidates = async (candidates, sortField, sortDirection) => {
  try {
    const response = await api.post(ENDPOINTS.SORT, {
      candidates,
      sort_field: sortField,
      sort_direction: sortDirection
    });
    return response.data;
  } catch (error) {
    console.warn("Falling back to client-side sorting:", error);
    
    const sorted = [...candidates].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case SORT_FIELDS.NAME:
          comparison = a.name.localeCompare(b.name);
          break;
        case SORT_FIELDS.RATING:
          comparison = a.rating - b.rating;
          break;
        case SORT_FIELDS.STAGE:
          comparison = a.stage.localeCompare(b.stage);
          break;
        case SORT_FIELDS.APPLIED_ROLE:
          comparison = a.applied_role.localeCompare(b.applied_role);
          break;
        case SORT_FIELDS.APPLICATION_DATE:
          comparison = new Date(a.application_date) - new Date(b.application_date);
          break;
        case SORT_FIELDS.ATTACHMENTS:
          comparison = a.attachments - b.attachments;
          break;
        default:
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }
};

export const searchCandidates = async (query) => {
  try {
    const response = await api.get('/candidates/search/', { params: { query } });
    return response.data;
  } catch (error) {
    console.error("Error searching candidates:", error);
    throw error;
  }
};