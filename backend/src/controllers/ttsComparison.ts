import { Request, Response } from 'express';
import { generateSpeechWithPreset } from '../services/ttsService';
import { generateLocalSpeech, checkLocalTTSAvailable } from '../services/localTTSService';

/**
 * Compare cloud TTS vs local TTS
 * Returns both audio files for side-by-side testing
 */
export async function compareTTS(req: Request, res: Response): Promise<void> {
  try {
    const { text } = req.body;

    if (!text) {
      res.status(400).json({
        success: false,
        error: 'Text is required'
      });
      return;
    }

    console.log(`🎤 Comparing TTS for: "${text.substring(0, 50)}..."`);

    const results: any = {
      success: true,
      text,
      providers: {}
    };

    // Generate cloud TTS (Gemini/ElevenLabs)
    try {
      const cloudStart = Date.now();
      const cloudAudio = await generateSpeechWithPreset(text, 'AIRA_PROFESSIONAL');
      const cloudDuration = Date.now() - cloudStart;

      results.providers.cloud = {
        available: true,
        audio: cloudAudio.toString('base64'),
        duration: cloudDuration,
        size: cloudAudio.length,
        provider: 'Gemini/ElevenLabs'
      };

      console.log(`✅ Cloud TTS: ${cloudDuration}ms, ${cloudAudio.length} bytes`);
    } catch (error: any) {
      results.providers.cloud = {
        available: false,
        error: error.message
      };
      console.error('❌ Cloud TTS failed:', error.message);
    }

    // Generate local TTS (Coqui)
    const localAvailable = await checkLocalTTSAvailable();
    
    if (localAvailable) {
      try {
        const localStart = Date.now();
        const localAudio = await generateLocalSpeech({ text });
        const localDuration = Date.now() - localStart;

        results.providers.local = {
          available: true,
          audio: localAudio.toString('base64'),
          duration: localDuration,
          size: localAudio.length,
          provider: 'Coqui TTS (Local)'
        };

        console.log(`✅ Local TTS: ${localDuration}ms, ${localAudio.length} bytes`);
      } catch (error: any) {
        results.providers.local = {
          available: false,
          error: error.message
        };
        console.error('❌ Local TTS failed:', error.message);
      }
    } else {
      results.providers.local = {
        available: false,
        error: 'Coqui TTS not installed. Run: pip install TTS'
      };
    }

    res.json(results);

  } catch (error: any) {
    console.error('❌ TTS comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'TTS comparison failed',
      message: error.message
    });
  }
}

/**
 * Test a specific TTS provider
 */
export async function testTTSProvider(req: Request, res: Response): Promise<void> {
  try {
    const { text, provider } = req.body;

    if (!text || !provider) {
      res.status(400).json({
        success: false,
        error: 'Text and provider are required'
      });
      return;
    }

    let audioBuffer: Buffer;
    const startTime = Date.now();

    if (provider === 'cloud') {
      audioBuffer = await generateSpeechWithPreset(text, 'AIRA_PROFESSIONAL');
    } else if (provider === 'local') {
      audioBuffer = await generateLocalSpeech({ text });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid provider. Use "cloud" or "local"'
      });
      return;
    }

    const duration = Date.now() - startTime;

    res.json({
      success: true,
      provider,
      audio: audioBuffer.toString('base64'),
      duration,
      size: audioBuffer.length
    });

  } catch (error: any) {
    console.error(`❌ ${req.body.provider} TTS error:`, error);
    res.status(500).json({
      success: false,
      error: 'TTS generation failed',
      message: error.message
    });
  }
}
