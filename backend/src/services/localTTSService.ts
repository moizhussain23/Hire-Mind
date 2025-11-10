import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

interface LocalTTSOptions {
  text: string;
  model?: string;
  speaker?: string;
  speed?: number;
}

/**
 * Generate speech using local Coqui TTS
 * Requires: pip install TTS
 * 
 * Best models for natural speech:
 * - tts_models/en/ljspeech/vits (fast, good quality)
 * - tts_models/en/vctk/vits (multiple speakers)
 * - tts_models/en/jenny/jenny (very natural female voice)
 */
export async function generateLocalSpeech(options: LocalTTSOptions): Promise<Buffer> {
  const startTime = Date.now();
  const { text, model = 'tts_models/en/ljspeech/vits', speed = 1.0 } = options;

  try {
    // Create temp output file
    const outputFile = path.join(__dirname, '../../temp', `tts_${Date.now()}.wav`);
    
    // Ensure temp directory exists
    await fs.mkdir(path.dirname(outputFile), { recursive: true });

    // Escape text for shell command
    const escapedText = text.replace(/"/g, '\\"').replace(/'/g, "\\'");

    // Generate speech using Coqui TTS Python CLI
    const command = `python -c "from TTS.api import TTS; tts = TTS('${model}', progress_bar=False, gpu=False); tts.tts_to_file(text='${escapedText}', file_path='${outputFile}')"`;

    await execAsync(command, { timeout: 30000 }); // 30 second timeout

    // Read the generated audio file
    const audioBuffer = await fs.readFile(outputFile);

    // Clean up temp file
    await fs.unlink(outputFile).catch(() => {});

    return audioBuffer;
  } catch (error: any) {
    console.error('[TTS] Local TTS generation failed:', error.message);
    throw new Error(`Local TTS failed: ${error.message}`);
  }
}

/**
 * Check if Coqui TTS is installed
 */
export async function checkLocalTTSAvailable(): Promise<boolean> {
  try {
    await execAsync('python -c "import TTS"', { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * List available local TTS models
 */
export async function listLocalModels(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('python -c "from TTS.api import TTS; print(TTS().list_models())"', { timeout: 10000 });
    return stdout.split('\n').filter(line => line.trim());
  } catch (error) {
    console.error('Failed to list models:', error);
    return [];
  }
}

/**
 * Generate speech with enhanced naturalness
 * Adds pauses, intonation, and natural pacing
 */
export async function generateNaturalSpeech(text: string): Promise<Buffer> {
  // Add SSML-like pauses for natural speech
  const enhancedText = text
    .replace(/\./g, '.<break time="300ms"/>') // Pause after sentences
    .replace(/,/g, ',<break time="200ms"/>') // Pause after commas
    .replace(/\?/g, '?<break time="400ms"/>') // Longer pause after questions
    .replace(/!/g, '!<break time="300ms"/>'); // Pause after exclamations

  return generateLocalSpeech({
    text: enhancedText,
    model: 'tts_models/en/ljspeech/vits',
    speed: 0.95 // Slightly slower for more natural feel
  });
}
