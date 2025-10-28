import express from 'express';
import { testFullInterview } from '../controllers/testInterviewController';

const router = express.Router();

/**
 * Test complete interview flow
 * POST /api/test-interview
 */
router.post('/', testFullInterview);

export default router;
