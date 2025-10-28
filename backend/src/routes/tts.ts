import express from 'express';
import { generateSpeech, healthCheck } from '../controllers/tts';

const router = express.Router();

// Health check (no auth required)
router.get('/health', healthCheck);

// Generate speech from text (no auth required for now - used during interview)
router.post('/generate', generateSpeech);

export default router;
