import { Request, Response, NextFunction } from 'express';
import { InterviewSession } from '../models/InterviewSession';

export const validateTimeWindow = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionToken } = req.params;

    // Find the session
    const session = await InterviewSession.findOne({ sessionToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Check if session is already completed
    if (session.status === 'completed') {
      return res.status(403).json({
        success: false,
        error: 'This interview has already been completed',
        code: 'ALREADY_COMPLETED'
      });
    }

    // Check if session is cancelled
    if (session.status === 'cancelled') {
      return res.status(403).json({
        success: false,
        error: 'This interview has been cancelled',
        code: 'CANCELLED'
      });
    }

    // Get scheduled time
    const scheduledTime = session.scheduledTime;
    
    if (!scheduledTime) {
      // If no scheduled time, allow access (for backward compatibility)
      return next();
    }

    const now = new Date();
    const scheduled = new Date(scheduledTime);

    // Calculate time windows
    // Link becomes active 30 minutes before scheduled time
    const windowStart = new Date(scheduled.getTime() - 30 * 60000);
    // Link expires 2 hours after scheduled time
    const windowEnd = new Date(scheduled.getTime() + 120 * 60000);

    // Check if too early
    if (now < windowStart) {
      const minutesUntil = Math.ceil((windowStart.getTime() - now.getTime()) / 60000);
      const hoursUntil = Math.floor(minutesUntil / 60);
      const remainingMinutes = minutesUntil % 60;

      let timeMessage = '';
      if (hoursUntil > 0) {
        timeMessage = `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      } else {
        timeMessage = `${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
      }

      return res.status(403).json({
        success: false,
        error: `Interview link is not active yet. You can join in ${timeMessage}.`,
        code: 'TOO_EARLY',
        scheduledTime: scheduled,
        availableAt: windowStart,
        minutesUntil,
        currentTime: now
      });
    }

    // Check if too late (expired)
    if (now > windowEnd) {
      return res.status(403).json({
        success: false,
        error: 'Interview link has expired. The interview window was 30 minutes before to 2 hours after the scheduled time.',
        code: 'TOO_LATE',
        scheduledTime: scheduled,
        expiredAt: windowEnd,
        currentTime: now
      });
    }

    // Within valid time window - allow access
    // Attach session to request for use in controller
    (req as any).interviewSession = session;
    return next();

  } catch (error) {
    console.error('Time window validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate interview time window',
      code: 'VALIDATION_ERROR'
    });
  }
};

// Optional: Middleware to check if link was already used
export const validateLinkUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionToken } = req.params;
    const session = await InterviewSession.findOne({ sessionToken });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Interview session not found',
        code: 'SESSION_NOT_FOUND'
      });
    }

    // Check if link was already used (session started)
    if (session.status === 'in-progress' || session.status === 'completed') {
      return res.status(403).json({
        success: false,
        error: 'This interview link has already been used. Each link can only be used once.',
        code: 'LINK_ALREADY_USED'
      });
    }

    return next();
  } catch (error) {
    console.error('Link usage validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to validate link usage',
      code: 'VALIDATION_ERROR'
    });
  }
};
