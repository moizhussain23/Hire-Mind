import { InterviewSession } from '../models/InterviewSession';
import { Invitation } from '../models/Invitation';
import { Interview } from '../models/Interview';
import { generateSessionToken } from '../utils/sessionToken';

export interface CreateSessionParams {
  invitationId: string;
  interviewId: string;
  candidateEmail: string;
  scheduledStartTime: Date;
}

/**
 * Create a new interview session with time windows and security settings
 */
export const createInterviewSession = async ({
  invitationId,
  interviewId,
  candidateEmail,
  scheduledStartTime
}: CreateSessionParams) => {
  try {
    // Check if session already exists
    const existingSession = await InterviewSession.findOne({
      invitationId,
      status: { $in: ['pending', 'active'] }
    });

    if (existingSession) {
      console.log(`⚠️  Session already exists for invitation ${invitationId}`);
      return existingSession;
    }

    // Generate unique session token
    const sessionToken = generateSessionToken();

    // Get interview details for duration
    const interview = await Interview.findById(interviewId);
    const interviewDuration = interview?.duration || 45; // Default 45 minutes

    // Calculate time windows
    const scheduledEndTime = new Date(scheduledStartTime);
    scheduledEndTime.setMinutes(scheduledEndTime.getMinutes() + interviewDuration);

    // Access window: 15 minutes before to 15 minutes after start time
    const accessWindowStart = new Date(scheduledStartTime);
    accessWindowStart.setMinutes(accessWindowStart.getMinutes() - 15);

    const accessWindowEnd = new Date(scheduledStartTime);
    accessWindowEnd.setMinutes(accessWindowEnd.getMinutes() + 15);

    // Expiry: Keep session data for 24 hours after interview ends
    const expiresAt = new Date(scheduledEndTime);
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create session
    const session = await InterviewSession.create({
      interviewId,
      invitationId,
      candidateEmail,
      sessionToken,
      scheduledStartTime,
      scheduledEndTime,
      accessWindowStart,
      accessWindowEnd,
      status: 'pending',
      joinAttempts: 0,
      expiresAt
    });

    console.log(`✅ Session created: ${sessionToken} for ${candidateEmail}`);
    return session;
  } catch (error) {
    console.error('Error creating interview session:', error);
    throw error;
  }
};

/**
 * Get session by token
 */
export const getSessionByToken = async (sessionToken: string) => {
  return await InterviewSession.findOne({ sessionToken })
    .populate('interviewId')
    .populate('invitationId');
};

/**
 * Get all sessions for a candidate
 */
export const getCandidateSessions = async (candidateEmail: string) => {
  return await InterviewSession.find({ candidateEmail })
    .populate('interviewId')
    .populate('invitationId')
    .sort({ scheduledStartTime: -1 });
};

/**
 * Get all sessions for an interview
 */
export const getInterviewSessions = async (interviewId: string) => {
  return await InterviewSession.find({ interviewId })
    .populate('invitationId')
    .sort({ scheduledStartTime: -1 });
};

/**
 * Mark session as expired
 */
export const expireSession = async (sessionId: string) => {
  return await InterviewSession.findByIdAndUpdate(
    sessionId,
    { status: 'expired' },
    { new: true }
  );
};

/**
 * Cancel session
 */
export const cancelSession = async (sessionId: string) => {
  return await InterviewSession.findByIdAndUpdate(
    sessionId,
    { status: 'cancelled' },
    { new: true }
  );
};

/**
 * Get upcoming sessions (within next 30 minutes)
 */
export const getUpcomingSessions = async () => {
  const now = new Date();
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

  return await InterviewSession.find({
    scheduledStartTime: {
      $gte: now,
      $lte: thirtyMinutesFromNow
    },
    status: 'pending'
  })
    .populate('interviewId')
    .populate('invitationId');
};

/**
 * Clean up old expired sessions (manual cleanup, TTL index handles auto-deletion)
 */
export const cleanupExpiredSessions = async () => {
  const result = await InterviewSession.deleteMany({
    expiresAt: { $lt: new Date() },
    status: { $in: ['completed', 'expired', 'cancelled'] }
  });

  console.log(`🧹 Cleaned up ${result.deletedCount} expired sessions`);
  return result;
};
