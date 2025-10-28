import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateTimeWindow } from '../middleware/validateTimeWindow';
import {
  validateSessionAccess,
  getSessionStatus,
  completeSession,
  recordHeartbeat,
  getCandidateSessions
} from '../controllers/session';

const router = Router();

// Public/Semi-public routes - session token based access
// Add time window validation to prevent early/late access
router.get('/:sessionToken/validate', optionalAuth, validateTimeWindow, validateSessionAccess);
router.get('/:sessionToken/status', getSessionStatus);

// Protected routes - require authentication
router.post('/:sessionToken/heartbeat', authenticateToken, recordHeartbeat);
router.post('/:sessionToken/complete', authenticateToken, completeSession);
router.get('/my-sessions', authenticateToken, getCandidateSessions);

export default router;
