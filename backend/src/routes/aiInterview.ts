import express from 'express';
import {
  generateQuestion,
  scoreInterviewEndpoint,
  respondToAnswer,
  validateAnswer,
  healthCheck
} from '../controllers/aiInterview';

const router = express.Router();

// Health check (no auth required)
router.get('/health', healthCheck);

// Interview endpoints (no auth required - used during active interview)
// TODO: Add interview token validation instead of user auth
router.post('/question', generateQuestion);
router.post('/validate-answer', validateAnswer);
router.post('/respond', respondToAnswer);
router.post('/score', scoreInterviewEndpoint);

export default router;
