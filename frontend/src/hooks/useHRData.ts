import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createAuthenticatedAPI } from '../services/api';

export interface Candidate {
  id: string;
  candidateId: string;
  position: string;
  description?: string;
  skillCategory?: string;
  experienceLevel?: 'fresher' | 'mid' | 'senior';
  interviewType?: 'voice' | 'video' | 'both';
  interviewCategory?: 'tech' | 'non-tech';
  hasCodingRound?: boolean;
  allowedLanguages?: string[];
  codingInstructions?: string;
  technicalAssessmentType?: string;
  customQuestions?: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'closed';
  isClosed?: boolean;
  closedAt?: string;
  didYouGet?: boolean;
  totalCandidatesInvited?: number;
  totalCandidatesCompleted?: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdAt?: string;
  evaluation?: {
    overallScore: number;
    contentQuality: number;
    communicationSkills: number;
    confidence: number;
    technicalKnowledge: number;
    feedback: string;
    strengths: string[];
    areasForImprovement: string[];
  };
  candidate?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  invitedCandidates?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    clerkId: string | null;
    registered: boolean;
    status?: 'completed' | 'in-progress' | 'scheduled';
    score?: number;
    isSelected?: boolean;
  }>;
}

export interface Interview {
  id: string;
  position: string;
  description?: string;
  skillCategory?: string;
  experienceLevel?: 'fresher' | 'mid' | 'senior';
  interviewType?: 'voice' | 'video' | 'both';
  interviewCategory?: 'tech' | 'non-tech';
  hasCodingRound?: boolean;
  allowedLanguages?: string[];
  codingInstructions?: string;
  technicalAssessmentType?: string;
  customQuestions?: string[];
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'closed';
  isClosed?: boolean;
  closedAt?: string;
  didYouGet?: boolean;
  invitedCandidates?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    clerkId: string | null;
    registered: boolean;
    status?: 'completed' | 'in-progress' | 'scheduled';
    score?: number;
    isSelected?: boolean;
  }>;
  totalCandidatesInvited?: number;
  totalCandidatesCompleted?: number;
  candidates: number;
  createdDate: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export const useHRData = () => {
  const { getToken } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create authenticated API instance
      const authenticatedAPI = createAuthenticatedAPI(getToken);
      const response = await authenticatedAPI.get('/hr/candidates');
      const allData = response.data.candidates || [];
      
      console.log('All data from API:', allData);
      console.log('Total items:', allData.length);
      
      // No filtering - return all interviews (they contain invitedCandidates array)
      // The HRDashboard will handle flattening the invitedCandidates array
      console.log('Setting all interviews as candidates data');
      
      setCandidates(allData);
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
      
      // If it's a 401 error, don't set error state - let auth handle it
      if (err.response?.status === 401) {
        console.warn('Authentication required for HR data');
        setCandidates([]);
        setError(null);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch candidates');
        // Provide fallback empty data instead of throwing
        setCandidates([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create authenticated API instance
      const authenticatedAPI = createAuthenticatedAPI(getToken);
      const response = await authenticatedAPI.get('/hr/candidates'); // Using same endpoint for now
      const allData = response.data.candidates || [];
      
      // Filter to only show interview templates (without specific candidates)
      const templateInterviews = allData.filter((item: Candidate) => item.candidate === null || item.candidate === undefined);
      
      // Transform to interviews format
      const interviewsData = templateInterviews.map((candidate: Candidate) => ({
        id: candidate.id,
        position: candidate.position,
        description: candidate.description,
        skillCategory: candidate.skillCategory,
        experienceLevel: candidate.experienceLevel,
        interviewType: candidate.interviewType,
        interviewCategory: candidate.interviewCategory,
        hasCodingRound: candidate.hasCodingRound,
        allowedLanguages: candidate.allowedLanguages,
        codingInstructions: candidate.codingInstructions,
        technicalAssessmentType: candidate.technicalAssessmentType,
        customQuestions: candidate.customQuestions,
        status: candidate.status,
        isClosed: candidate.isClosed,
        closedAt: candidate.closedAt,
        didYouGet: candidate.didYouGet,
        invitedCandidates: candidate.invitedCandidates, // ✅ INCLUDE THIS!
        totalCandidatesInvited: candidate.totalCandidatesInvited,
        totalCandidatesCompleted: candidate.totalCandidatesCompleted,
        candidates: candidate.invitedCandidates?.length || 0, // ✅ USE ACTUAL COUNT
        createdDate: candidate.createdAt || candidate.startTime || new Date().toISOString(),
        startTime: candidate.startTime,
        endTime: candidate.endTime,
        duration: candidate.duration
      }));
      
      setInterviews(interviewsData);
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      
      // If it's a 401 error, don't set error state - let auth handle it
      if (err.response?.status === 401) {
        console.warn('Authentication required for interview data');
        setInterviews([]);
        setError(null);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch interviews');
        // Provide fallback empty data instead of throwing
        setInterviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const scheduleInterview = async (data: {
    candidateId: string;
    position: string;
    scheduledTime: string;
  }) => {
    try {
      const authenticatedAPI = createAuthenticatedAPI(getToken);
      const response = await authenticatedAPI.post('/hr/interviews/schedule', data);
      // Refresh data after scheduling
      await fetchCandidates();
      await fetchInterviews();
      return response.data;
    } catch (err: any) {
      console.error('Error scheduling interview:', err);
      throw new Error(err.response?.data?.error || 'Failed to schedule interview');
    }
  };

  const updateInterviewStatus = async (interviewId: string, status: string) => {
    try {
      const authenticatedAPI = createAuthenticatedAPI(getToken);
      const response = await authenticatedAPI.put(`/hr/interviews/${interviewId}/status`, { status });
      // Refresh data after update
      await fetchCandidates();
      await fetchInterviews();
      return response.data;
    } catch (err: any) {
      console.error('Error updating interview status:', err);
      throw new Error(err.response?.data?.error || 'Failed to update interview status');
    }
  };

  useEffect(() => {
    fetchCandidates();
    fetchInterviews();
  }, []);

  return {
    candidates,
    interviews,
    loading,
    error,
    fetchCandidates,
    fetchInterviews,
    scheduleInterview,
    updateInterviewStatus,
    refetch: () => {
      fetchCandidates();
      fetchInterviews();
    }
  };
};
