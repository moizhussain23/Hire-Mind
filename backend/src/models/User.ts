import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  clerkId: string
  email: string
  firstName: string
  lastName: string
  role: 'candidate' | 'hr' | 'admin'
  profileImage?: string
  resumeUrl?: string
  // HR-specific fields
  hrProfile?: {
    companyName?: string
    companySize?: string
    industry?: string
    website?: string
    phoneNumber?: string
    companyDescription?: string
    companyLogo?: string
    isOnboardingComplete?: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['candidate', 'hr', 'admin'],
    default: 'candidate'
  },
  profileImage: {
    type: String
  },
  resumeUrl: {
    type: String
  },
  hrProfile: {
    companyName: String,
    companySize: String,
    industry: String,
    website: String,
    phoneNumber: String,
    companyDescription: String,
    companyLogo: String,
    isOnboardingComplete: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
})

// Indexes
UserSchema.index({ role: 1 })

export const User = mongoose.model<IUser>('User', UserSchema)
