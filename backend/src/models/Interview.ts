import mongoose, { Document, Schema } from 'mongoose'

export interface IInterview extends Document {
  candidateId?: string
  candidateEmail?: string // Store invited email to match with registered user
  invitedCandidates?: string[] // Array of invited candidate emails
  completedCandidates?: string[] // Array of candidate emails who completed the interview
  hrId?: string
  position: string
  description?: string
  skillCategory?: string
  experienceLevel?: 'fresher' | 'mid' | 'senior'
  interviewType?: 'voice' | 'video' | 'both'
  interviewCategory?: 'tech' | 'non-tech'
  hasCodingRound?: boolean
  allowedLanguages?: string[]
  codingInstructions?: string
  technicalAssessmentType?: string
  customQuestions?: string[]
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'closed'
  isClosed?: boolean
  closedAt?: Date
  didYouGet?: boolean
  selectedCandidates?: string[] // Array of selected/hired candidate emails
  totalCandidatesInvited?: number
  totalCandidatesCompleted?: number
  startTime?: Date
  endTime?: Date
  duration?: number // in minutes
  // Phase 1: Invitation System Fields
  timeSlots?: Date[] // 3 time options for candidates to choose from
  invitationExpiryHours?: number // Hours until invitation expires (default 48)
  interviewWindowMinutes?: number // Minutes window for joining (default 180 = 3 hours)
  requireResume?: boolean // Whether resume upload is required (default true)
  // Conversation Data (Enhanced)
  conversationHistory?: Array<{
    speaker: 'ai' | 'candidate'
    message: string
    timestamp: Date
    duration?: number // seconds
    audioUrl?: string
    questionId?: string
  }>
  
  // Full Transcript
  transcript?: string
  
  // Questions Asked (Detailed)
  questionsAsked?: Array<{
    questionId: string
    question: string
    category: string // 'technical', 'behavioral', 'coding', 'system_design'
    difficulty: 'easy' | 'medium' | 'hard'
    askedAt: Date
    answer?: {
      text: string
      audioUrl?: string
      duration?: number
      answeredAt?: Date
    }
    aiScore?: number // 0-100
    feedback?: string
  }>
  
  // Enhanced Evaluation
  evaluation?: {
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    overallScore?: number
    scores?: {
      technicalKnowledge?: number
      communicationSkills?: number
      problemSolving?: number
      confidence?: number
    }
    strengths?: string[]
    weaknesses?: string[]
    detailedFeedback?: string
    hiringRecommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no'
    evaluatedAt?: Date
    evaluatedBy?: string // 'ai' or userId
  }
  
  // Metadata
  metadata?: {
    actualDuration?: number // minutes
    questionsAsked?: number
    questionsAnswered?: number
    averageResponseTime?: number
    totalPauses?: number
    pauseDuration?: number
    technicalIssues?: number
  }
  codingAssessment?: {
    problemsSolved: number
    totalProblems: number
    codeQuality: number
    timeSpent: number
    languages: string[]
    submissions?: {
      problem: string
      solution: string
      passed: boolean
      score: number
    }[]
  }
  recordingUrl?: string
  reportUrl?: string
  createdAt: Date
  updatedAt: Date
}

const InterviewSchema = new Schema<IInterview>({
  candidateId: {
    type: String,
    ref: 'User'
  },
  candidateEmail: {
    type: String
  },
  invitedCandidates: {
    type: [String],
    default: []
  },
  completedCandidates: {
    type: [String],
    default: []
  },
  hrId: {
    type: String,
    ref: 'User'
  },
  position: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  skillCategory: {
    type: String
  },
  experienceLevel: {
    type: String,
    enum: ['fresher', 'mid', 'senior']
  },
  interviewType: {
    type: String,
    enum: ['voice', 'video', 'both']
  },
  interviewCategory: {
    type: String,
    enum: ['tech', 'non-tech'],
    default: 'tech'
  },
  hasCodingRound: {
    type: Boolean,
    default: false
  },
  allowedLanguages: [{
    type: String
  }],
  codingInstructions: {
    type: String
  },
  technicalAssessmentType: {
    type: String
  },
  customQuestions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'in-progress', 'completed', 'cancelled', 'closed'],
    default: 'draft'
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  closedAt: {
    type: Date
  },
  didYouGet: {
    type: Boolean
  },
  selectedCandidates: [{
    type: String
  }],
  totalCandidatesInvited: {
    type: Number,
    default: 0
  },
  totalCandidatesCompleted: {
    type: Number,
    default: 0
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  // Phase 1: Invitation System Fields
  timeSlots: [{
    type: Date
  }],
  invitationExpiryHours: {
    type: Number,
    default: 48
  },
  interviewWindowMinutes: {
    type: Number,
    default: 180 // 3 hours window
  },
  requireResume: {
    type: Boolean,
    default: true
  },
  
  // Conversation History
  conversationHistory: [{
    speaker: {
      type: String,
      enum: ['ai', 'candidate']
    },
    message: String,
    timestamp: Date,
    duration: Number,
    audioUrl: String,
    questionId: String
  }],
  
  // Full Transcript
  transcript: {
    type: String
  },
  
  // Questions Asked
  questionsAsked: [{
    questionId: String,
    question: String,
    category: String,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    askedAt: Date,
    answer: {
      text: String,
      audioUrl: String,
      duration: Number,
      answeredAt: Date
    },
    aiScore: Number,
    feedback: String
  }],
  
  // Enhanced Evaluation
  evaluation: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'failed'],
      default: 'pending'
    },
    overallScore: Number,
    scores: {
      technicalKnowledge: Number,
      communicationSkills: Number,
      problemSolving: Number,
      confidence: Number
    },
    strengths: [String],
    weaknesses: [String],
    detailedFeedback: String,
    hiringRecommendation: {
      type: String,
      enum: ['strong_yes', 'yes', 'maybe', 'no']
    },
    evaluatedAt: Date,
    evaluatedBy: String
  },
  
  // Metadata
  metadata: {
    actualDuration: Number,
    questionsAsked: Number,
    questionsAnswered: Number,
    averageResponseTime: Number,
    totalPauses: Number,
    pauseDuration: Number,
    technicalIssues: Number
  },
  
  codingAssessment: {
    problemsSolved: {
      type: Number,
      default: 0
    },
    totalProblems: {
      type: Number,
      default: 0
    },
    codeQuality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0
    },
    languages: [{
      type: String
    }],
    submissions: [{
      problem: String,
      solution: String,
      passed: Boolean,
      score: Number
    }]
  },
  recordingUrl: {
    type: String
  },
  reportUrl: {
    type: String
  }
}, {
  timestamps: true
})

// Indexes
InterviewSchema.index({ candidateId: 1 })
InterviewSchema.index({ hrId: 1 })
InterviewSchema.index({ status: 1 })
InterviewSchema.index({ createdAt: -1 })

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema)
