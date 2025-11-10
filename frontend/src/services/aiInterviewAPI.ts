import api from './api';

interface QuestionContext {
  candidateName: string;
  position: string;
  skillCategory: 'technical' | 'non-technical';
  experienceLevel: 'fresher' | 'mid-level' | 'senior';
  resumeData?: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
  };
  previousAnswers: string[];
  questionNumber: number;
  interviewPhase: 'behavioral' | 'technical';
}

interface QuestionResponse {
  questionText: string;
  audioBase64: string;
  audioFormat: string;
  questionNumber: number;
  interviewPhase: string;
}

interface ScoreResponse {
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  codeQuality: number;
  confidence: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  detailedFeedback: {
    technical: string;
    communication: string;
    problemSolving: string;
  };
}

/**
 * Generate AI interview question
 */
export async function generateInterviewQuestion(
  context: QuestionContext
): Promise<QuestionResponse> {
  try {
    const response = await api.post('/ai-interview/question', context);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error generating question:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate question');
  }
}

/**
 * Generate follow-up response to candidate's answer
 */
export async function respondToAnswer(
  candidateAnswer: string,
  context: QuestionContext
): Promise<QuestionResponse> {
  try {
    const response = await api.post('/ai-interview/respond', {
      candidateAnswer,
      context
    });
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error responding to answer:', error);
    throw new Error(error.response?.data?.error || 'Failed to generate response');
  }
}

/**
 * Score completed interview
 */
export async function scoreInterview(data: {
  interviewId: string;
  transcript: Array<{
    sender: 'ai' | 'candidate';
    text: string;
    timestamp: string;
  }>;
  codeSubmissions: Array<{
    code: string;
    language: string;
    timestamp: number;
  }>;
  position: string;
  skillCategory: string;
  problemSolved: boolean;
}): Promise<ScoreResponse> {
  try {
    const response = await api.post('/ai-interview/score', data);
    return response.data.data.score;
  } catch (error: any) {
    console.error('❌ Error scoring interview:', error);
    throw new Error(error.response?.data?.error || 'Failed to score interview');
  }
}

/**
 * Check AI services health
 */
export async function checkAIHealth(): Promise<{
  gemini: string;
  tts: string;
  timestamp: string;
}> {
  try {
    const response = await api.get('/ai-interview/health');
    return response.data.data;
  } catch (error: any) {
    console.error('❌ AI health check failed:', error);
    throw new Error('AI services unavailable');
  }
}

/**
 * Play audio from base64
 */
export function playAudioFromBase64(
  audioBase64: string,
  format: string = 'mp3'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Convert base64 to blob
      const binaryString = atob(audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: `audio/${format}` });
      
      // Create audio URL
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Upload and parse resume
 */
export async function uploadResume(file: File, isTest: boolean = false): Promise<{
  resumeUrl: string;
  parsed: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
    summary: string;
    contactInfo: {
      email?: string;
      phone?: string;
      linkedin?: string;
      github?: string;
    };
  };
}> {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    
    // Use test endpoint if it's for test page (no auth required)
    const endpoint = isTest ? '/resume/test/upload' : '/resume/upload';
    
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error uploading resume:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload resume');
  }
}

/**
 * Parse resume from URL
 */
export async function parseResumeFromUrl(resumeUrl: string): Promise<{
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  summary: string;
}> {
  try {
    const response = await api.post('/resume/parse', { resumeUrl });
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error parsing resume:', error);
    throw new Error(error.response?.data?.error || 'Failed to parse resume');
  }
}

/**
 * Calculate resume match score
 */
export async function calculateMatchScore(
  resumeSkills: string[],
  requiredSkills: string[]
): Promise<{
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}> {
  try {
    const response = await api.post('/resume/match-score', {
      resumeSkills,
      requiredSkills
    });
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error calculating match score:', error);
    throw new Error(error.response?.data?.error || 'Failed to calculate match score');
  }
}

export default {
  generateInterviewQuestion,
  respondToAnswer,
  scoreInterview,
  checkAIHealth,
  playAudioFromBase64,
  uploadResume,
  parseResumeFromUrl,
  calculateMatchScore
};
