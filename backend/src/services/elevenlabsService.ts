import axios from 'axios';

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Voice IDs (ElevenLabs pre-made voices)
const VOICE_IDS = {
  RACHEL: '21m00Tcm4TlvDq8ikWAM', // Female, professional
  DOMI: 'AZnzlk1XvdvUeBnXmlld',   // Female, friendly
  BELLA: 'EXAVITQu4vr4xnSDxMaL',  // Female, soft
  ANTONI: 'ErXwobaYiN019PkySvjV', // Male, professional
  ELLI: 'MF3mGyEYCl7XYWbV9V6O',   // Female, young
  JOSH: 'TxGEqnHWrfWFTfGW9XjX',   // Male, deep
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // Male, crisp
  ADAM: 'pNInz6obpgDQGcFmaJgB',   // Male, deep
  SAM: 'yoZ06aMxZJJ28mfd3POQ'     // Male, dynamic
};

interface TTSOptions {
  text: string;
  voiceId?: string;
  stability?: number;
  similarityBoost?: number;
  modelId?: string;
}

/**
 * Generate speech using ElevenLabs API (FREE - No credit card required)
 * Free tier: 10,000 characters/month
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  try {
    const {
      text,
      voiceId = VOICE_IDS.RACHEL, // Default: Professional female voice
      stability = 0.5,
      similarityBoost = 0.75,
      modelId = 'eleven_monolingual_v1'
    } = options;

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    const response = await axios.post(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        text,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    const audioBuffer = Buffer.from(response.data);
    return audioBuffer;

  } catch (error: any) {
    console.error('[TTS] ElevenLabs error:', error.message);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

/**
 * Voice presets for different interview scenarios
 */
export const VoicePresets = {
  // AIRA - Professional female interviewer (Rachel)
  AIRA_PROFESSIONAL: {
    voiceId: VOICE_IDS.RACHEL,
    stability: 0.5,
    similarityBoost: 0.75
  },
  
  // AIRA - Friendly and warm (Domi)
  AIRA_FRIENDLY: {
    voiceId: VOICE_IDS.DOMI,
    stability: 0.6,
    similarityBoost: 0.8
  },
  
  // AIRA - Soft and gentle (Bella)
  AIRA_SOFT: {
    voiceId: VOICE_IDS.BELLA,
    stability: 0.7,
    similarityBoost: 0.7
  },
  
  // Alternative male voice
  MALE_PROFESSIONAL: {
    voiceId: VOICE_IDS.ANTONI,
    stability: 0.5,
    similarityBoost: 0.75
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
 * Get available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<any[]> {
  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    return response.data.voices || [];
  } catch (error: any) {
    // Silently fail
    return [];
  }
}

/**
 * Get user subscription info (check remaining characters)
 */
export async function getSubscriptionInfo(): Promise<{
  characterCount: number;
  characterLimit: number;
  canExtendCharacterLimit: boolean;
}> {
  try {
    const response = await axios.get(`${ELEVENLABS_API_URL}/user/subscription`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    return {
      characterCount: response.data.character_count,
      characterLimit: response.data.character_limit,
      canExtendCharacterLimit: response.data.can_extend_character_limit
    };
  } catch (error: any) {
    // Silently fail
    return {
      characterCount: 0,
      characterLimit: 10000,
      canExtendCharacterLimit: false
    };
  }
}

/**
 * Estimate if text will fit within quota
 */
export async function checkQuota(textLength: number): Promise<{
  withinQuota: boolean;
  remaining: number;
  percentUsed: number;
}> {
  try {
    const info = await getSubscriptionInfo();
    const remaining = info.characterLimit - info.characterCount;
    const percentUsed = (info.characterCount / info.characterLimit) * 100;
    
    return {
      withinQuota: remaining >= textLength,
      remaining,
      percentUsed: Math.round(percentUsed)
    };
  } catch (error) {
    return {
      withinQuota: true,
      remaining: 10000,
      percentUsed: 0
    };
  }
}

/**
 * Batch generate speech for multiple texts
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

export default {
  generateSpeech,
  generateSpeechWithPreset,
  batchGenerateSpeech,
  getAvailableVoices,
  getSubscriptionInfo,
  checkQuota,
  VoicePresets,
  VOICE_IDS
};
