import { GoogleGenAI } from '@google/genai';

interface TTSOptions {
  text: string;
  voiceName?: string;
  languageCode?: string;
  speakingRate?: number;
  pitch?: number;
}

/**
 * Create WAV header for raw PCM data from Gemini
 * Gemini returns 16-bit PCM at 24000 Hz, mono
 */
function createWavHeader(pcmDataLength: number): Buffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  
  const wavHeader = Buffer.alloc(44);
  
  // RIFF header
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmDataLength, 4);
  wavHeader.write('WAVE', 8);
  
  // fmt chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // PCM
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  
  // data chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmDataLength, 40);
  
  return wavHeader;
}

/**
 * Generate speech using Gemini Native TTS (@google/genai SDK)
 * Returns professional interviewer voice
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  try {
    const { text } = options;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log(`🎤 Generating speech with Gemini TTS: "${text.substring(0, 50)}..."`);

    // Initialize Gemini client
    const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Create professional interviewer prompt
    const prompt = `Say this in a warm, professional, and friendly interviewer tone: "${text}"`;

    // Generate audio
    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{
        parts: [{ text: prompt }]
      }],
      config: {
        responseModalities: ['AUDIO']
      }
    });

    // Extract audio data from response
    // Based on testing, the structure is: result.candidates[0].content.parts[0].inlineData.data
    const audioData = (result as any).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      console.error('Response structure:', JSON.stringify(result, null, 2));
      throw new Error('No audio data in Gemini response');
    }

    // Convert base64 to PCM buffer
    const pcmData = Buffer.from(audioData, 'base64');
    
    // Create WAV header and combine with PCM data
    const wavHeader = createWavHeader(pcmData.length);
    const wavBuffer = Buffer.concat([wavHeader, pcmData]);

    console.log(`✅ Gemini TTS speech generated: ${wavBuffer.length} bytes (24kHz, 16-bit, mono)`);
    return wavBuffer;

  } catch (error: any) {
    console.error('❌ Gemini TTS error:', error.message);
    throw new Error(`Gemini TTS failed: ${error.message}`);
  }
}

/**
 * Voice presets for different interview scenarios
 * Gemini Native TTS voices: Kore (female), Puck (male), Charon (neutral), Aoede (female)
 */
export const VoicePresets = {
  // AIRA - Professional female interviewer (Kore)
  AIRA_PROFESSIONAL: {
    voiceName: 'Kore',
    speakingRate: 0.95,
    pitch: 1.0
  },
  
  // AIRA - Friendly and warm (Aoede)
  AIRA_FRIENDLY: {
    voiceName: 'Aoede',
    speakingRate: 0.9,
    pitch: 1.2
  },
  
  // AIRA - Soft and gentle (Kore)
  AIRA_SOFT: {
    voiceName: 'Kore',
    speakingRate: 0.9,
    pitch: 1.1
  },
  
  // Alternative male voice (Puck)
  MALE_PROFESSIONAL: {
    voiceName: 'Puck',
    speakingRate: 0.95,
    pitch: 0.0
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
 * Google Cloud TTS pricing: $16 per 1 million characters (Neural2 voices)
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
  generateSpeechWithPreset,
  batchGenerateSpeech,
  estimateTTSCost,
  VoicePresets
};
