import { promises as fs } from 'fs';
import path from 'path';
import * as kokoroTTSService from './kokoroTTSService';
import * as geminiTTSService from './geminiTTSService';
import * as elevenlabsService from './elevenlabsService';

interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
  volumeGainDb?: number;
}

/**
 * Generate speech audio from text
 * Priority:
 * 1. Kokoro TTS (Local, FREE, unlimited, high quality)
 * 2. Gemini TTS (Cloud, FREE, 1M chars/month)
 * 3. ElevenLabs (Cloud, FREE, 10K chars/month)
 * Returns audio buffer that can be sent to frontend
 */
// Simple in-memory cache for TTS (max 50 entries)
const ttsCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 50;

// ⚡ Pre-generate common phrases for instant playback
const COMMON_PHRASES = [
  "I see.",
  "That's interesting.",
  "Tell me more about that.",
  "Great answer!",
  "Excellent!",
  "I understand.",
  "Could you elaborate?",
  "Thank you for sharing that.",
  "Let's move forward.",
  "That makes sense."
];

function getCacheKey(text: string): string {
  return text.toLowerCase().trim().substring(0, 200); // Use first 200 chars as key
}

// Pre-warm cache with common phrases (wait for Kokoro to be ready)
async function prewarmCache() {
  // Wait for Kokoro server to be ready (up to 90 seconds - can take 40-70s to initialize)
  let kokoroReady = false;
  for (let i = 0; i < 90; i++) {
    try {
      kokoroReady = await kokoroTTSService.checkKokoroAvailable();
      if (kokoroReady) {
        console.log('[TTS] Kokoro ready, starting cache pre-warming');
        break;
      }
    } catch (err) {
      // Ignore
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Only pre-warm if Kokoro is ready (or wait for it)
  if (!kokoroReady) {
    console.log('[TTS] Kokoro not available, skipping cache pre-warming');
    return;
  }

  try {
    const total = COMMON_PHRASES.length;
    console.log(`[TTS] Pre-warming cache: ${total} phrases`);
    
    for (let i = 0; i < total; i++) {
      const phrase = COMMON_PHRASES[i];
      const progress = Math.round(((i + 1) / total) * 100);
      
      try {
        await generateSpeech({ text: phrase });
        console.log(`[TTS] Cache pre-warming: ${progress}% (${i + 1}/${total})`);
      } catch (err) {
        console.log(`[TTS] Cache pre-warming: ${progress}% (${i + 1}/${total}) - failed`);
      }
    }
    
    console.log('[TTS] Cache pre-warming complete');
    console.log('');
    console.log('[System] Ready to use');
    console.log('');
  } catch (err) {
    console.log('[TTS] Cache pre-warming failed');
    console.log('');
    console.log('[System] Ready to use (cache pre-warming skipped)');
    console.log('');
  }
}

// Start pre-warming in background after a delay (wait for Kokoro to initialize)
// Kokoro server takes ~40 seconds to start, so wait 45 seconds before checking
setTimeout(() => prewarmCache(), 45000);

export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  try {
    const { text } = options;
    const cacheKey = getCacheKey(text);

    // Check cache first
    if (ttsCache.has(cacheKey)) {
      return ttsCache.get(cacheKey)!;
    }

    let audioBuffer: Buffer | null = null;
    let ttsProvider = 'unknown';

    // Try Kokoro TTS first (Local, FREE, unlimited, high quality)
    // Wait a bit if Kokoro server is still initializing
    try {
      const kokoroAvailable = await kokoroTTSService.checkKokoroAvailable();
      if (kokoroAvailable) {
        audioBuffer = await kokoroTTSService.generateKokoroSpeech({
          text,
          voice: 'af_aoede',
          speed: 1.0
        });
        ttsProvider = 'Kokoro';
      } else {
        // Kokoro server might still be starting - wait a bit and check again
        // This prevents falling back to other providers too quickly
        await new Promise(resolve => setTimeout(resolve, 1000));
        const kokoroAvailableRetry = await kokoroTTSService.checkKokoroAvailable();
        if (kokoroAvailableRetry) {
          audioBuffer = await kokoroTTSService.generateKokoroSpeech({
            text,
            voice: 'af_aoede',
            speed: 1.0
          });
          ttsProvider = 'Kokoro';
        }
      }
    } catch (error: any) {
      // Silently try next provider only if Kokoro truly fails
    }

    // Fall back to Gemini if Kokoro failed
    if (!audioBuffer && process.env.GEMINI_API_KEY) {
      try {
        audioBuffer = await geminiTTSService.generateSpeech({
          text,
          voiceName: 'professional'
        });
        ttsProvider = 'Gemini';
      } catch (error: any) {
        // Silently try next provider
      }
    }

    // Fall back to ElevenLabs if both Kokoro and Gemini failed
    if (!audioBuffer && process.env.ELEVENLABS_API_KEY) {
      try {
        audioBuffer = await elevenlabsService.generateSpeechWithPreset(
          text,
          'AIRA_PROFESSIONAL'
        );
        ttsProvider = 'ElevenLabs';
      } catch (error: any) {
        // Log only final failure
      }
    }

    if (!audioBuffer) {
      throw new Error('All TTS services failed. Please check Kokoro installation or set GEMINI_API_KEY/ELEVENLABS_API_KEY');
    }

    // Cache the result
    if (ttsCache.size >= MAX_CACHE_SIZE) {
      // Remove oldest entry
      const firstKey = ttsCache.keys().next().value;
      if (firstKey) {
        ttsCache.delete(firstKey);
      }
    }
    ttsCache.set(cacheKey, audioBuffer);

    return audioBuffer;

  } catch (error: any) {
    console.error('[TTS] Failed to generate speech:', error.message);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

/**
 * Generate speech and save to file (for testing/debugging)
 */
export async function generateSpeechToFile(
  text: string,
  outputPath: string
): Promise<string> {
  try {
    const audioBuffer = await generateSpeech({ text });
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write audio file
    await fs.writeFile(outputPath, audioBuffer);
    
    return outputPath;

  } catch (error: any) {
    console.error('[TTS] Error saving audio file:', error.message);
    throw error;
  }
}

/**
 * Get list of available voices
 */
export async function getAvailableVoices(languageCode: string = 'en-US'): Promise<any[]> {
  try {
    // Try ElevenLabs
    if (process.env.ELEVENLABS_API_KEY) {
      return await elevenlabsService.getAvailableVoices();
    }
    
    return [];
  } catch (error: any) {
    return [];
  }
}

/**
 * Voice presets for different interview scenarios
 */
export const VoicePresets = {
  // AIRA - Professional female interviewer
  AIRA_PROFESSIONAL: {
    voiceName: 'en-US-Neural2-F',
    speakingRate: 0.95,
    pitch: 1.0,
    volumeGainDb: 0.0
  },
  
  // AIRA - Friendly and warm
  AIRA_FRIENDLY: {
    voiceName: 'en-US-Neural2-F',
    speakingRate: 0.9,
    pitch: 1.2,
    volumeGainDb: 2.0
  },
  
  // AIRA - Formal and serious
  AIRA_FORMAL: {
    voiceName: 'en-US-Neural2-F',
    speakingRate: 0.85,
    pitch: 0.9,
    volumeGainDb: 0.0
  },
  
  // Alternative voices
  MALE_PROFESSIONAL: {
    voiceName: 'en-US-Neural2-D',
    speakingRate: 0.95,
    pitch: 0.0,
    volumeGainDb: 0.0
  }
};

/**
 * Generate speech with preset voice
 */
export async function generateSpeechWithPreset(
  text: string,
  preset: keyof typeof VoicePresets = 'AIRA_PROFESSIONAL'
): Promise<Buffer> {
  const voiceConfig = VoicePresets[preset];
  return generateSpeech({
    text,
    ...voiceConfig
  });
}

/**
 * Batch generate speech for multiple texts
 * Useful for pre-generating common questions
 */
export async function batchGenerateSpeech(
  texts: string[],
  preset: keyof typeof VoicePresets = 'AIRA_PROFESSIONAL'
): Promise<Buffer[]> {
  try {
    const audioBuffers = await Promise.all(
      texts.map(text => generateSpeechWithPreset(text, preset))
    );
    return audioBuffers;

  } catch (error: any) {
    console.error('[TTS] Batch generation error:', error.message);
    throw error;
  }
}

/**
 * Estimate cost for TTS usage
 * Google Cloud TTS pricing: $16 per 1 million characters (WavNet/Neural2)
 * Free tier: 1 million characters per month
 */
export function estimateTTSCost(characterCount: number): {
  characters: number;
  cost: number;
  withinFreeTier: boolean;
} {
  const FREE_TIER_LIMIT = 1_000_000; // 1 million characters
  const COST_PER_MILLION = 16; // $16 per million characters
  
  const withinFreeTier = characterCount <= FREE_TIER_LIMIT;
  const cost = withinFreeTier ? 0 : ((characterCount - FREE_TIER_LIMIT) / 1_000_000) * COST_PER_MILLION;
  
  return {
    characters: characterCount,
    cost: Math.round(cost * 100) / 100, // Round to 2 decimals
    withinFreeTier
  };
}

export default {
  generateSpeech,
  generateSpeechToFile,
  generateSpeechWithPreset,
  batchGenerateSpeech,
  getAvailableVoices,
  estimateTTSCost,
  VoicePresets
};
