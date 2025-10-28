import { Request, Response } from 'express';
import { generateSpeechWithPreset } from '../services/ttsService';

/**
 * Generate speech audio from text
 * POST /api/tts/generate
 */
export async function generateSpeech(req: Request, res: Response): Promise<void> {
  try {
    const { text, preset = 'AIRA_PROFESSIONAL' } = req.body;

    if (!text) {
      res.status(400).json({
        success: false,
        error: 'Missing required field: text'
      });
      return;
    }

    console.log(`🎤 Generating speech for: "${text.substring(0, 50)}..."`);

    // Generate speech audio using Google TTS
    const audioBuffer = await generateSpeechWithPreset(text, preset);

    // Convert buffer to base64 for easy transmission
    const audioBase64 = audioBuffer.toString('base64');

    res.json({
      success: true,
      audioBase64,
      audioFormat: 'mp3',
      size: audioBuffer.length
    });

  } catch (error: any) {
    console.error('❌ Error generating speech:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech',
      message: error.message
    });
  }
}

/**
 * Health check for TTS service
 * GET /api/tts/health
 */
export async function healthCheck(req: Request, res: Response) {
  try {
    // Test TTS with short text
    const testAudio = await generateSpeechWithPreset('Test', 'AIRA_PROFESSIONAL');

    res.json({
      success: true,
      data: {
        tts: testAudio.length > 0 ? 'OK' : 'FAIL',
        audioSize: testAudio.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'TTS service health check failed',
      message: error.message
    });
  }
}

export default {
  generateSpeech,
  healthCheck
};
