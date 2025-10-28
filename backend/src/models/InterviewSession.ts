import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewSession extends Document {
  // References
  interviewId: mongoose.Types.ObjectId;
  invitationId: mongoose.Types.ObjectId;
  candidateEmail: string;
  candidateName?: string;
  position?: string;
  
  // Session Token
  sessionToken: string;
  
  // Time Management
  scheduledTime?: Date; // Main scheduled time
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  // Access Window
  accessWindowStart: Date;
  accessWindowEnd: Date;
  
  // Email Reminders
  reminderSent2Days?: boolean;
  reminderSent1Day?: boolean;
  reminderSent30Min?: boolean;
  
  // Status
  status: 'pending' | 'scheduled' | 'active' | 'in-progress' | 'completed' | 'expired' | 'cancelled';
  
  // Security
  ipAddress?: string;
  userAgent?: string;
  joinAttempts: number;
  lastJoinAttempt?: Date;
  
  // Heartbeat tracking
  lastHeartbeat?: Date;
  heartbeatCount: number;
  completionReason?: 'manual_end' | 'heartbeat_timeout' | 'auto_complete' | 'expired';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  
  // Methods
  isAccessible(): boolean;
  markAsActive(ipAddress?: string, userAgent?: string): Promise<IInterviewSession>;
  markAsCompleted(reason?: string): Promise<IInterviewSession>;
  incrementJoinAttempts(): Promise<IInterviewSession>;
  recordHeartbeat(): Promise<IInterviewSession>;
  isHeartbeatStale(timeoutMinutes?: number): boolean;
}

const InterviewSessionSchema = new Schema<IInterviewSession>(
  {
    // References
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true
    },
    invitationId: {
      type: Schema.Types.ObjectId,
      ref: 'Invitation',
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
      type: String
    },
    position: {
      type: String
    },
    
    // Session Token
    sessionToken: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    
    // Time Management
    scheduledTime: {
      type: Date
    },
    scheduledStartTime: {
      type: Date,
      required: true
    },
    scheduledEndTime: {
      type: Date,
      required: true
    },
    actualStartTime: {
      type: Date
    },
    actualEndTime: {
      type: Date
    },
    
    // Access Window
    accessWindowStart: {
      type: Date,
      required: true
    },
    accessWindowEnd: {
      type: Date,
      required: true
    },
    
    // Email Reminders
    reminderSent2Days: {
      type: Boolean,
      default: false
    },
    reminderSent1Day: {
      type: Boolean,
      default: false
    },
    reminderSent30Min: {
      type: Boolean,
      default: false
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'scheduled', 'active', 'in-progress', 'completed', 'expired', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    
    // Security
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    joinAttempts: {
      type: Number,
      default: 0
    },
    lastJoinAttempt: {
      type: Date
    },
    
    // Heartbeat tracking
    lastHeartbeat: {
      type: Date
    },
    heartbeatCount: {
      type: Number,
      default: 0
    },
    completionReason: {
      type: String,
      enum: ['manual_end', 'heartbeat_timeout', 'auto_complete', 'expired'],
      default: null
    },
    
    // Auto-expiry
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// TTL Index - Auto-delete expired sessions
InterviewSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes for common queries
InterviewSessionSchema.index({ candidateEmail: 1, status: 1 });
InterviewSessionSchema.index({ interviewId: 1, status: 1 });
InterviewSessionSchema.index({ scheduledStartTime: 1, status: 1 });

// Methods
InterviewSessionSchema.methods.isAccessible = function(): boolean {
  const now = new Date();
  return (
    this.status === 'pending' &&
    now >= this.accessWindowStart &&
    now <= this.accessWindowEnd
  );
};

InterviewSessionSchema.methods.markAsActive = function(ipAddress?: string, userAgent?: string) {
  this.status = 'active';
  this.actualStartTime = new Date();
  this.ipAddress = ipAddress;
  this.userAgent = userAgent;
  return this.save();
};

InterviewSessionSchema.methods.markAsCompleted = function(reason = 'manual_end') {
  this.status = 'completed';
  this.actualEndTime = new Date();
  this.completionReason = reason;
  return this.save();
};

InterviewSessionSchema.methods.incrementJoinAttempts = function() {
  this.joinAttempts += 1;
  this.lastJoinAttempt = new Date();
  return this.save();
};

InterviewSessionSchema.methods.recordHeartbeat = function() {
  this.lastHeartbeat = new Date();
  this.heartbeatCount = (this.heartbeatCount || 0) + 1;
  return this.save();
};

InterviewSessionSchema.methods.isHeartbeatStale = function(timeoutMinutes = 2): boolean {
  if (!this.lastHeartbeat) return false;
  const now = new Date();
  const diffMinutes = (now.getTime() - this.lastHeartbeat.getTime()) / 60000;
  return diffMinutes > timeoutMinutes;
};

export const InterviewSession = mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);
