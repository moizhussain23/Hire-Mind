import { Router } from 'express';
import codingQuestionController from '../controllers/codingQuestionController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * Coding Question Routes
 * All routes require authentication
 */

// Get a coding question for interview (no auth required for testing)
router.post('/question', codingQuestionController.getCodingQuestion);

// Submit coding solution for evaluation  
router.post('/submit', authenticateToken, codingQuestionController.submitCodingSolution);

// Execute code with test cases (LeetCode-style, no auth for testing)
router.post('/execute', codingQuestionController.executeCodeChallenge);

// AI Interviewer integration for coding challenges (no auth for testing)
router.post('/ai-feedback', codingQuestionController.getAIInterviewerFeedback);

// Real-time coding session monitoring
router.post('/session/update', authenticateToken, codingQuestionController.updateCodingSession);

// Get all coding questions (admin/HR)
router.get('/questions', authenticateToken, codingQuestionController.getAllCodingQuestions);

// Initialize question bank (no auth for testing)
router.post('/init', codingQuestionController.initializeQuestionBank);

// Get question statistics
router.get('/stats', authenticateToken, codingQuestionController.getCodingQuestionStats);

export default router;