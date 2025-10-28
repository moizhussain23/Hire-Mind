import { Request, Response } from 'express';
import { InterviewSession } from '../models/InterviewSession';
import { Invitation } from '../models/Invitation';
import { Interview } from '../models/Interview';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/auth';

/**
 * Validate session access and return interview details
 */
export const validateSessionAccess = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionToken } = req.params;
    const userId = req.auth?.userId;

    console.log(`🔍 Validating session: ${sessionToken}`);

    // Find session
    const session = await InterviewSession.findOne({ sessionToken })
      .populate('interviewId')
      .populate('invitationId');

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found. Please check your invitation email for the correct link.'
      });
      return;
    }

    // Increment join attempts
    await session.incrementJoinAttempts();

    // Check if session is already expired or completed
    if (session.status === 'expired') {
      res.status(403).json({
        success: false,
        error: 'This session has expired. Please contact HR for assistance.',
        code: 'SESSION_EXPIRED'
      });
      return;
    }

    if (session.status === 'completed') {
      res.status(403).json({
        success: false,
        error: 'This interview has already been completed.',
        code: 'SESSION_COMPLETED'
      });
      return;
    }

    if (session.status === 'cancelled') {
      res.status(403).json({
        success: false,
        error: 'This interview has been cancelled. Please contact HR.',
        code: 'SESSION_CANCELLED'
      });
      return;
    }

    // Check time window
    const now = new Date();

    // Too early
    if (now < session.accessWindowStart) {
      const minutesUntil = Math.floor(
        (session.accessWindowStart.getTime() - now.getTime()) / 60000
      );
      res.status(403).json({
        success: false,
        error: `Interview not yet available. You can join in ${minutesUntil} minutes.`,
        code: 'TOO_EARLY',
        availableAt: session.accessWindowStart,
        minutesUntil
      });
      return;
    }

    // Too late
    if (now > session.accessWindowEnd) {
      res.status(403).json({
        success: false,
        error: 'The interview window has closed. Please contact HR if you need to reschedule.',
        code: 'TOO_LATE',
        closedAt: session.accessWindowEnd
      });
      return;
    }

    // Verify candidate authorization
    if (userId) {
      const user = await User.findOne({ clerkId: userId });
      const invitation = session.invitationId as any;

      if (user?.email !== invitation?.candidateEmail) {
        res.status(403).json({
          success: false,
          error: 'You are not authorized to join this interview.',
          code: 'UNAUTHORIZED'
        });
        return;
      }
    }

    // Check if session was already used (prevent reusing the link)
    if (session.status === 'active' && session.actualStartTime) {
      res.status(403).json({
        success: false,
        error: 'This interview link has already been used. You cannot rejoin using this link.',
        code: 'LINK_ALREADY_USED',
        message: 'The interview session is already active. Please continue from your existing session or contact HR if you need assistance.'
      });
      return;
    }

    // Update session status to active if pending (first time joining)
    if (session.status === 'pending') {
      await session.markAsActive(req.ip, req.headers['user-agent']);
      console.log(`✅ Session activated: ${sessionToken}`);
    }

    // Get interview details
    const interview = session.interviewId as any;

    res.status(200).json({
      success: true,
      message: 'Session validated successfully',
      session: {
        sessionToken: session.sessionToken,
        scheduledStartTime: session.scheduledStartTime,
        scheduledEndTime: session.scheduledEndTime,
        status: session.status,
        accessWindowStart: session.accessWindowStart,
        accessWindowEnd: session.accessWindowEnd
      },
      interview: {
        id: interview._id,
        position: interview.position,
        interviewType: interview.interviewType,
        duration: interview.duration,
        category: interview.category,
        experienceLevel: interview.experienceLevel,
        customQuestions: interview.customQuestions || []
      }
    });
  } catch (error: any) {
    console.error('Error validating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate session. Please try again.',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Get session status (for polling/checking availability)
 */
export const getSessionStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionToken } = req.params;

    const session = await InterviewSession.findOne({ sessionToken });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    const now = new Date();
    const canJoin = session.isAccessible();
    const minutesUntilStart = Math.floor(
      (session.scheduledStartTime.getTime() - now.getTime()) / 60000
    );

    res.status(200).json({
      success: true,
      status: session.status,
      canJoin,
      scheduledStartTime: session.scheduledStartTime,
      accessWindowStart: session.accessWindowStart,
      accessWindowEnd: session.accessWindowEnd,
      minutesUntilStart: minutesUntilStart > 0 ? minutesUntilStart : 0
    });
  } catch (error) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session status'
    });
  }
};

/**
 * Complete a session (called when interview ends/candidate leaves)
 */
export const completeSession = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionToken } = req.params;
    const { reason = 'manual_end' } = req.body;

    const session = await InterviewSession.findOne({ sessionToken })
      .populate('invitationId')
      .populate('interviewId');

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Mark session as completed with reason
    await session.markAsCompleted(reason);
    console.log(`✅ Session completed: ${sessionToken} (${reason})`);

    // Update interview to add candidate to completedCandidates
    const interview = await Interview.findById(session.interviewId);
    const invitation = session.invitationId as any;

    if (interview && invitation) {
      // Add to completed candidates if not already there
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

    res.status(200).json({
      success: true,
      message: 'Session completed successfully'
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session'
    });
  }
};

/**
 * Record heartbeat - candidate is still active in interview
 */
export const recordHeartbeat = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { sessionToken } = req.params;

    const session = await InterviewSession.findOne({ sessionToken });

    if (!session) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
      return;
    }

    // Only record heartbeat for active sessions
    if (session.status !== 'active') {
      res.status(400).json({
        success: false,
        error: 'Session is not active'
      });
      return;
    }

    // Record the heartbeat
    await session.recordHeartbeat();

    res.status(200).json({
      success: true,
      message: 'Heartbeat recorded',
      lastHeartbeat: session.lastHeartbeat,
      heartbeatCount: session.heartbeatCount
    });
  } catch (error) {
    console.error('Error recording heartbeat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record heartbeat'
    });
  }
};

/**
 * Get candidate's sessions
 */
export const getCandidateSessions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const sessions = await InterviewSession.find({ candidateEmail: user.email })
      .populate('interviewId')
      .populate('invitationId')
      .sort({ scheduledStartTime: -1 });

    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Error getting candidate sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
};
