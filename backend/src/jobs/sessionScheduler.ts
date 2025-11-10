import cron from 'node-cron';
import { Invitation } from '../models/Invitation';
import { createInterviewSession } from '../services/sessionGenerator';
import { sendJoinInterviewEmail } from '../services/email';

/**
 * Session Scheduler - Creates interview sessions 30 minutes before scheduled time
 * Runs every 5 minutes to check for upcoming interviews
 */
export const startSessionScheduler = () => {
  // Run every 2 minutes: */2 * * * *
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000);
      const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60000);

      // Find accepted invitations with interviews starting in 2-40 minutes
      const upcomingInvitations = await Invitation.find({
        status: 'accepted',
        selectedTimeSlot: {
          $gte: twoMinutesFromNow,
          $lte: fortyMinutesFromNow
        }
      }).populate('interviewId');

      if (upcomingInvitations.length === 0) {
        return;
      }

      for (const invitation of upcomingInvitations) {
        try {
          if (!invitation.selectedTimeSlot) {
            continue;
          }

          // Check if session already exists
          const { InterviewSession } = await import('../models/InterviewSession');
          const existingSession = await InterviewSession.findOne({
            invitationId: invitation._id,
            status: { $in: ['pending', 'active'] }
          });

          if (existingSession) {
            continue;
          }

          // Create session
          const session = await createInterviewSession({
            invitationId: (invitation._id as any).toString(),
            interviewId: (invitation.interviewId as any)._id?.toString() || invitation.interviewId.toString(),
            candidateEmail: invitation.candidateEmail,
            scheduledStartTime: new Date(invitation.selectedTimeSlot)
          });

          // Get interview details
          const interview = invitation.interviewId as any;

          // Send "Join Interview" email
          await sendJoinInterviewEmail(invitation.candidateEmail, {
            candidateName: invitation.candidateName || invitation.candidateEmail.split('@')[0],
            position: interview.position,
            sessionToken: session.sessionToken,
            scheduledTime: invitation.selectedTimeSlot,
            joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/join/${session.sessionToken}`,
            interviewType: interview.interviewType,
            duration: interview.duration || 45
          });

          console.log(`[Scheduler] Session created: ${invitation.candidateEmail}`);
        } catch (error: any) {
          console.error(`[Scheduler] Failed to create session for ${invitation.candidateEmail}:`, error.message);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Error:', error);
    }
  });
};

/**
 * Cleanup scheduler - Removes old expired sessions
 * Runs daily at 2 AM
 */
export const startCleanupScheduler = () => {
  // Run daily at 2 AM: 0 2 * * *
  cron.schedule('0 2 * * *', async () => {
    try {
      const { cleanupExpiredSessions } = await import('../services/sessionGenerator');
      await cleanupExpiredSessions();
    } catch (error) {
      console.error('[Cleanup] Error:', error);
    }
  });
};

/**
 * Heartbeat Watchdog - Auto-complete sessions with stale heartbeats
 * Runs every 1 minute
 */
export const startHeartbeatWatchdog = () => {
  // Run every 1 minute: */1 * * * *
  cron.schedule('*/1 * * * *', async () => {
    try {
      const { InterviewSession } = await import('../models/InterviewSession');
      const { Interview } = await import('../models/Interview');
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60000);

      // Find active sessions with stale heartbeats (no heartbeat in last 2 minutes)
      const staleSessions = await InterviewSession.find({
        status: 'active',
        lastHeartbeat: { $lt: twoMinutesAgo, $ne: null }
      }).populate('invitationId');

      if (staleSessions.length === 0) {
        return;
      }

      for (const session of staleSessions) {
        try {
          // Mark session as completed due to heartbeat timeout
          await session.markAsCompleted('heartbeat_timeout');

          // Update interview to add candidate to completedCandidates
          const interview = await Interview.findById(session.interviewId);
          const invitation = session.invitationId as any;

          if (interview && invitation) {
            if (!interview.completedCandidates) {
              interview.completedCandidates = [];
            }
            
            if (!interview.completedCandidates.includes(invitation.candidateEmail)) {
              interview.completedCandidates.push(invitation.candidateEmail);
              interview.totalCandidatesCompleted = interview.completedCandidates.length;
              await interview.save();
            }
          }
        } catch (error) {
          console.error(`[Watchdog] Error auto-completing session:`, error);
        }
      }
    } catch (error) {
      console.error('[Watchdog] Error:', error);
    }
  });
};

/**
 * Auto-complete sessions that are past their access window
 * Runs every 10 minutes
 */
export const startAutoCompleteScheduler = () => {
  // Run every 10 minutes: */10 * * * *
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { InterviewSession } = await import('../models/InterviewSession');
      const { Interview } = await import('../models/Interview');
      const now = new Date();

      // Find active sessions that are past their access window
      const sessionsToComplete = await InterviewSession.find({
        status: 'active',
        accessWindowEnd: { $lt: now }
      }).populate('invitationId');

      if (sessionsToComplete.length === 0) {
        return;
      }

      for (const session of sessionsToComplete) {
        try {
          // Mark session as completed
          await session.markAsCompleted();

          // Update interview to add candidate to completedCandidates
          const interview = await Interview.findById(session.interviewId);
          const invitation = session.invitationId as any;

          if (interview && invitation) {
            if (!interview.completedCandidates) {
              interview.completedCandidates = [];
            }
            
            if (!interview.completedCandidates.includes(invitation.candidateEmail)) {
              interview.completedCandidates.push(invitation.candidateEmail);
              interview.totalCandidatesCompleted = interview.completedCandidates.length;
              await interview.save();
            }
          }
        } catch (error) {
          console.error(`[AutoComplete] Error:`, error);
        }
      }
    } catch (error) {
      console.error('[AutoComplete] Error:', error);
    }
  });
};

/**
 * Initialize all schedulers
 */
export const initializeSchedulers = () => {
  startSessionScheduler();
  startHeartbeatWatchdog();
  startAutoCompleteScheduler();
  startCleanupScheduler();
};
