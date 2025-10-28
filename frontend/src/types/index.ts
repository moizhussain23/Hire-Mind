// Re-export shared types
export * from '../../../shared/types/user'
export * from '../../../shared/types/interview'
export * from '../../../shared/types/api'

// Frontend-specific types
export interface VideoCallState {
  isConnected: boolean
  isMuted: boolean
  isVideoOn: boolean
  connectionState: string
}

export interface InterviewState {
  id?: string
  position: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  startTime?: Date
  endTime?: Date
  currentQuestion?: string
  transcript: Array<{
    question: string
    answer: string
    timestamp: Date
  }>
  evaluation?: {
    overallScore: number
    contentQuality: number
    communicationSkills: number
    confidence: number
    technicalKnowledge: number
    feedback: string
    strengths: string[]
    areasForImprovement: string[]
  }
}

export interface AudioData {
  audioData: string
  interviewId: string
}

export interface ApiError {
  success: false
  error: string
  details?: any
}

export interface ApiSuccess<T = any> {
  success: true
  data: T
  message?: string
}
