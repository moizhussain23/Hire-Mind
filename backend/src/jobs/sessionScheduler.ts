import cron from 'node-cron';
import { Invitation } from '../models/Invitation';
import { createInterviewSession } from '../services/sessionGenerator';
import { sendJoinInterviewEmail } from '../services/email';

/**
 * Session Scheduler - Creates interview sessions 30 minutes before scheduled time
 * Runs every 5 minutes to check for upcoming interviews
 */
export const startSessionScheduler = () => {
  console.log('🕐 Session scheduler started - checking every 2 minutes');

  // Run every 2 minutes: */2 * * * *
  cron.schedule('*/2 * * * *', async () => {
    try {
      console.log('🔄 Checking for upcoming interviews...');

      const now = new Date();
      const twoMinutesFromNow = new Date(now.getTime() + 2 * 60000);
      const fortyMinutesFromNow = new Date(now.getTime() + 40 * 60000);

      // Find accepted invitations with interviews starting in 2-40 minutes
      // Wide window to catch any missed sessions (down to last 2 minutes)
      const upcomingInvitations = await Invitation.find({
        status: 'accepted',
        selectedTimeSlot: {
          $gte: twoMinutesFromNow,
          $lte: fortyMinutesFromNow
        }
      }).populate('interviewId');

      if (upcomingInvitations.length === 0) {
        console.log('✅ No upcoming interviews in the next 30 minutes');
        return;
      }

      console.log(`📋 Found ${upcomingInvitations.length} upcoming interview(s)`);

      for (const invitation of upcomingInvitations) {
        try {
          // Validate invitation data
          if (!invitation.selectedTimeSlot) {
            console.log(`⚠️  No time slot selected for ${invitation.candidateEmail}`);
            continue;
          }

          // Check if session already exists
          const { InterviewSession } = await import('../models/InterviewSession');
          const existingSession = await InterviewSession.findOne({
            invitationId: invitation._id,
            status: { $in: ['pending', 'active'] }
          });

          if (existingSession) {
            console.log(`⚠️  Session already exists for ${invitation.candidateEmail}`);
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

          console.log(`✅ Session created and email sent to ${invitation.candidateEmail}`);
        } catch (error: any) {
          console.error(`❌ Failed to create session for ${invitation.candidateEmail}:`, error.message);
        }
      }

      console.log('✅ Session scheduler completed');
    } catch (error) {
      console.error('❌ Error in session scheduler:', error);
    }
  });
};

/**
 * Cleanup scheduler - Removes old expired sessions
 * Runs daily at 2 AM
 */
export const startCleanupScheduler = () => {
  console.log('🧹 Cleanup scheduler started - runs daily at 2 AM');

  // Run daily at 2 AM: 0 2 * * *
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Running session cleanup...');

      const { cleanupExpiredSessions } = await import('../services/sessionGenerator');
      await cleanupExpiredSessions();

      console.log('✅ Session cleanup completed');
    } catch (error) {
      console.error('❌ Error in cleanup scheduler:', error);
    }
  });
};

/**
 * Heartbeat Watchdog - Auto-complete sessions with stale heartbeats
 * Runs every 1 minute
 */
export const startHeartbeatWatchdog = () => {
  console.log('💓 Heartbeat watchdog started - checking every 1 minute');

  // Run every 1 minute: */1 * * * *
  cron.schedule('*/1 * * * *', async () => {
    try {
      console.log('💓 Checking for stale heartbeats...');

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
        console.log('✅ All active sessions have fresh heartbeats');
        return;
      }

      console.log(`⚠️  Found ${staleSessions.length} session(s) with stale heartbeats`);

      for (const session of staleSessions) {
        try {
          const minutesSinceHeartbeat = session.lastHeartbeat 
            ? (now.getTime() - session.lastHeartbeat.getTime()) / 60000 
            : 0;
          
          // Mark session as completed due to heartbeat timeout
          await session.markAsCompleted('heartbeat_timeout');
          console.log(`💔 Auto-completed session (no heartbeat for ${Math.round(minutesSinceHeartbeat)} min): ${session.sessionToken.substring(0, 20)}...`);

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
              console.log(`✅ Interview updated: ${invitation.candidateEmail} marked as completed`);
            }
          }
        } catch (error) {
          console.error(`❌ Error auto-completing session ${session.sessionToken}:`, error);
        }
      }

      console.log('✅ Heartbeat watchdog check completed');
    } catch (error) {
      console.error('❌ Error in heartbeat watchdog:', error);
    }
  });
};

/**
 * Auto-complete sessions that are past their access window
 * Runs every 10 minutes
 */
export const startAutoCompleteScheduler = () => {
  console.log('🔄 Auto-complete scheduler started - checking every 10 minutes');

  // Run every 10 minutes: */10 * * * *
  cron.schedule('*/10 * * * *', async () => {
    try {
      console.log('🔄 Checking for sessions to auto-complete...');

      const { InterviewSession } = await import('../models/InterviewSession');
      const { Interview } = await import('../models/Interview');
      const now = new Date();

      // Find active sessions that are past their access window
      const sessionsToComplete = await InterviewSession.find({
        status: 'active',
        accessWindowEnd: { $lt: now }
      }).populate('invitationId');

      if (sessionsToComplete.length === 0) {
        console.log('✅ No sessions to auto-complete');
        return;
      }

      console.log(`📋 Found ${sessionsToComplete.length} session(s) to auto-complete`);

      for (const session of sessionsToComplete) {
        try {
          // Mark session as completed
          await session.markAsCompleted();
          console.log(`✅ Auto-completed session: ${session.sessionToken}`);

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
              console.log(`✅ Interview updated: ${invitation.candidateEmail} marked as completed`);
            }
          }
        } catch (error) {
          console.error(`❌ Error auto-completing session ${session.sessionToken}:`, error);
        }
      }

      console.log('✅ Auto-complete check completed');
    } catch (error) {
      console.error('❌ Error in auto-complete scheduler:', error);
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
  console.log('✅ All schedulers initialized');
};
