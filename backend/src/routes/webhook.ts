import express from 'express';
import { handleClerkWebhook } from '../controllers/webhook';

const router = express.Router();

// Clerk webhook endpoint (no auth middleware needed)
// Use express.json() instead of express.raw() for easier body parsing
router.post('/clerk', express.json(), handleClerkWebhook);

export default router;
