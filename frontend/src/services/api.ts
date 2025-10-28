import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Function to create authenticated API instance
export const createAuthenticatedAPI = (getToken: () => Promise<string | null>) => {
  const authenticatedAPI = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add auth token
  authenticatedAPI.interceptors.request.use(
    async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error getting token:', error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return authenticatedAPI;
};

// Request interceptor to add auth token (fallback)
api.interceptors.request.use(
  async (config) => {
    // Try to get token from Clerk if available
    const clerkToken = (window as any).__clerk_token;
    if (clerkToken) {
      config.headers.Authorization = `Bearer ${clerkToken}`;
    } else {
      // Fallback to localStorage
      const token = localStorage.getItem('clerk_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access - don't redirect automatically
      console.warn('Unauthorized API request:', error.response?.data)
      localStorage.removeItem('clerk_token')
      // Let the component handle the error instead of redirecting
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data)
}

// Interview API
export const interviewAPI = {
  startInterview: (data: { position: string }) => 
    api.post('/interview/start', data),
  
  endInterview: (interviewId: string) => 
    api.post(`/interview/end/${interviewId}`),
  
  getInterviewStatus: (interviewId: string) => 
    api.get(`/interview/status/${interviewId}`),
  
  processAudio: (data: { audioData: string; interviewId: string }) => 
    api.post('/interview/audio', data),
  
  getInterviewHistory: () => 
    api.get('/interview/history')
}

// HR API
export const hrAPI = {
  getCandidates: () => 
    api.get('/hr/candidates'),
  
  getCandidateDetails: (candidateId: string) => 
    api.get(`/hr/candidates/${candidateId}`),
  
  downloadReport: (interviewId: string) => 
    api.get(`/hr/reports/${interviewId}/download`),
  
  scheduleInterview: (data: { 
    candidateId: string; 
    position: string; 
    scheduledTime: string 
  }) => 
    api.post('/hr/interviews/schedule', data),
  
  updateInterviewStatus: (interviewId: string, status: string) => 
    api.put(`/hr/interviews/${interviewId}/status`, { status }),

  createInterview: (getToken: () => Promise<string | null>, data: {
    jobTitle: string;
    description: string;
    skillCategory: string;
    experienceLevel: string;
    interviewType: string;
    interviewCategory?: string;
    hasCodingRound?: boolean;
    allowedLanguages?: string[];
    codingInstructions?: string;
    technicalAssessmentType?: string;
    duration: number;
    questions: string[];
  }) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.post('/hr/interviews/create', data);
  },

  inviteCandidates: (getToken: () => Promise<string | null>, data: {
    interviewId: string;
    candidateEmails: string[];
    customMessage: string;
  }) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.post('/hr/interviews/invite', data);
  },

  closeInterview: (getToken: () => Promise<string | null>, interviewId: string, didYouGet?: boolean, selectedCandidates?: string[]) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.put(`/hr/interviews/${interviewId}/close`, { didYouGet, selectedCandidates });
  },

  deleteInterview: (getToken: () => Promise<string | null>, interviewId: string) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.delete(`/hr/interviews/${interviewId}`);
  },

  updateDidYouGet: (getToken: () => Promise<string | null>, interviewId: string, didYouGet: boolean) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.put(`/hr/interviews/${interviewId}/did-you-get`, { didYouGet });
  },

  updateInterview: (getToken: () => Promise<string | null>, interviewId: string, interviewData: {
    jobTitle: string;
    jobDescription: string;
    experienceLevel: string;
    interviewType: string;
    category: string;
    hasCodingRound?: boolean;
    codingLanguages?: string[];
  }) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.put(`/hr/interviews/${interviewId}`, interviewData);
  }
}

// HR Profile API
export const hrProfileAPI = {
  getProfile: (getToken: () => Promise<string | null>) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.get('/hr-profile/profile');
  },

  updateProfile: (getToken: () => Promise<string | null>, profileData: {
    companyName: string;
    companySize: string;
    industry: string;
    website?: string;
    phoneNumber: string;
    companyDescription?: string;
    companyLogo?: string;
  }) => {
    const authenticatedAPI = createAuthenticatedAPI(getToken);
    return authenticatedAPI.put('/hr-profile/profile', profileData);
  }
}

// Health check
export const healthAPI = {
  check: () => api.get('/health')
}

// Database initialization (removed - HR users should create their own data)
// export const initAPI = {
//   initializeDatabase: (getToken: () => Promise<string | null>) => {
//     const authenticatedAPI = createAuthenticatedAPI(getToken);
//     return authenticatedAPI.post('/init/init');
//   }
// }

export default api
