import mongoose, { Document, Schema } from 'mongoose'

export interface IInvitation extends Document {
  interviewId: string
  candidateEmail: string
  candidateName?: string
  token: string // Unique invitation token
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  timeSlots: Date[] // 3 time options provided by HR
  selectedTimeSlot?: Date // Chosen by candidate
  resumeUrl?: string // Uploaded during acceptance
  
  // Identity Verification (Fraud Prevention)
  identityVerification?: {
    // ID Document
    idDocument?: {
      type: 'passport' | 'drivers_license' | 'national_id' | 'other'
      documentNumber?: string
      documentPhotoUrl?: string
      extractedName?: string
      extractedPhotoUrl?: string
      uploadedAt?: Date
    }
    
    // Live Photo
    livePhoto?: {
      photoUrl?: string
      capturedAt?: Date
      livenessScore?: number // 0-100
    }
    
    // Face Matching
    faceMatch?: {
      score?: number // 0-100
      threshold: number // Default 85
      passed?: boolean
      verifiedAt?: Date
      provider?: string // 'aws' | 'azure' | 'face-api'
    }
    
    // Status
    status: 'pending' | 'verified' | 'failed' | 'expired'
    
    // Attempts
    attempts?: Array<{
      attemptedAt: Date
      matchScore?: number
      passed: boolean
      reason?: string
    }>
  }
  
  expiresAt: Date // 48 hours from creation
  sentAt: Date
  acceptedAt?: Date
  declinedAt?: Date
  createdAt: Date
  updatedAt: Date
  // Custom methods
  isExpired(): boolean
  isValid(): boolean
}

const InvitationSchema = new Schema<IInvitation>({
  interviewId: {
    type: String,
    ref: 'Interview',
    required: true,
    index: true
  },
  candidateEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  candidateName: {
    type: String,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'expired'],
    default: 'pending',
    index: true
  },
  timeSlots: [{
    type: Date,
    required: true
  }],
  selectedTimeSlot: {
    type: Date
  },
  resumeUrl: {
    type: String
  },
  
  // Identity Verification
  identityVerification: {
    idDocument: {
      type: {
        type: String,
        enum: ['passport', 'drivers_license', 'national_id', 'other']
      },
      documentNumber: String,
      documentPhotoUrl: String,
      extractedName: String,
      extractedPhotoUrl: String,
      uploadedAt: Date
    },
    livePhoto: {
      photoUrl: String,
      capturedAt: Date,
      livenessScore: Number
    },
    faceMatch: {
      score: Number,
      threshold: {
        type: Number,
        default: 85
      },
      passed: Boolean,
      verifiedAt: Date,
      provider: String
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'failed', 'expired'],
      default: 'pending'
    },
    attempts: [{
      attemptedAt: Date,
      matchScore: Number,
      passed: Boolean,
      reason: String
    }]
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: {
    type: Date
  },
  declinedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
InvitationSchema.index({ interviewId: 1, candidateEmail: 1 })
InvitationSchema.index({ token: 1, status: 1 })
InvitationSchema.index({ expiresAt: 1, status: 1 })

// Method to check if invitation is expired
InvitationSchema.methods.isExpired = function(): boolean {
  return new Date() > this.expiresAt && this.status === 'pending'
}

// Method to check if invitation is valid
InvitationSchema.methods.isValid = function(): boolean {
  return this.status === 'pending' && new Date() <= this.expiresAt
}

export const Invitation = mongoose.model<IInvitation>('Invitation', InvitationSchema)
