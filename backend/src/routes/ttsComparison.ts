import express from 'express';
import { compareTTS, testTTSProvider } from '../controllers/ttsComparison';

const router = express.Router();

/**
 * POST /api/tts-comparison/compare
 * Compare cloud TTS vs local TTS side-by-side
 * Body: { text: string }
 */
router.post('/compare', compareTTS);

/**
 * POST /api/tts-comparison/test
 * Test a specific TTS provider
 * Body: { text: string, provider: 'cloud' | 'local' }
 */
router.post('/test', testTTSProvider);

export default router;
