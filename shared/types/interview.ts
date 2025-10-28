export interface Interview {
  id: string
  candidateId: string
  hrId?: string
  position: string
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  startTime?: Date
  endTime?: Date
  duration?: number // in minutes
  transcript: TranscriptEntry[]
  evaluation?: Evaluation
  recordingUrl?: string
  reportUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface TranscriptEntry {
  question: string
  answer: string
  timestamp: Date
}

export interface Evaluation {
  overallScore: number
  contentQuality: number
  communicationSkills: number
  confidence: number
  technicalKnowledge: number
  feedback: string
  strengths: string[]
  areasForImprovement: string[]
}

export interface StartInterviewRequest {
  position: string
}

export interface StartInterviewResponse {
  interviewId: string
  position: string
  status: string
  startTime: Date
  currentQuestion: string
}

export interface AudioDataRequest {
  audioData: string
  interviewId: string
}

export interface AudioDataResponse {
  transcript: string
  aiResponse: string
  audioResponse: string
}
