import { promises as fs } from 'fs';
import path from 'path';
import * as geminiTTSService from './geminiTTSService';
import * as elevenlabsService from './elevenlabsService';

console.log('🎵 TTS Service initialized (Gemini Native TTS primary, ElevenLabs fallback)');

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
 * Uses Gemini TTS (Google) as primary (FREE, 1M chars/month, uses same API key as Gemini)
 * Falls back to ElevenLabs if Gemini fails (FREE, 10K chars/month, no credit card)
 * Returns audio buffer that can be sent to frontend
 */
// Simple in-memory cache for TTS (max 50 entries)
const ttsCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 50;

function getCacheKey(text: string): string {
  return text.toLowerCase().trim().substring(0, 200); // Use first 200 chars as key
}

export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const startTime = Date.now();
  
  try {
    const { text } = options;
    const cacheKey = getCacheKey(text);

    // Check cache first
    if (ttsCache.has(cacheKey)) {
      console.log(`💾 TTS cache hit (${Date.now() - startTime}ms)`);
      return ttsCache.get(cacheKey)!;
    }

    console.log(`🎤 Generating speech (${text.length} chars)...`);

    let audioBuffer: Buffer | null = null;

    // Try Gemini Native TTS first (FREE, professional voice)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('🎵 Using Gemini TTS...');
        audioBuffer = await geminiTTSService.generateSpeech({
          text,
          voiceName: 'professional'
        });
        console.log(`✅ Gemini TTS: ${audioBuffer.length} bytes in ${Date.now() - startTime}ms`);
      } catch (error: any) {
        console.error(`❌ Gemini TTS failed (${Date.now() - startTime}ms), trying ElevenLabs...`);
      }
    }

    // Fall back to ElevenLabs if Gemini failed or not configured
    if (!audioBuffer && process.env.ELEVENLABS_API_KEY) {
      try {
        console.log('🎵 Using ElevenLabs TTS...');
        audioBuffer = await elevenlabsService.generateSpeechWithPreset(
          text,
          'AIRA_PROFESSIONAL'
        );
        console.log(`✅ ElevenLabs: ${audioBuffer.length} bytes in ${Date.now() - startTime}ms`);
      } catch (error: any) {
        console.error('❌ ElevenLabs error:', error.message);
      }
    }

    if (!audioBuffer) {
      throw new Error('No TTS service configured. Please set GEMINI_API_KEY or ELEVENLABS_API_KEY');
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
    console.error('❌ TTS error:', error);
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
    
    console.log(`✅ Audio saved to: ${outputPath}`);
    return outputPath;

  } catch (error: any) {
    console.error('❌ Error saving audio file:', error);
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
    console.error('❌ Error fetching voices:', error);
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
    console.log(`🎤 Batch generating speech for ${texts.length} texts`);
    
    const audioBuffers = await Promise.all(
      texts.map(text => generateSpeechWithPreset(text, preset))
    );
    
    console.log(`✅ Batch generation complete: ${audioBuffers.length} audio files`);
    return audioBuffers;

  } catch (error: any) {
    console.error('❌ Batch generation error:', error);
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
