/**
 * Kokoro TTS Service - Uses persistent HTTP server for fast generation
 * 
 * Strategy:
 * - Python HTTP server (kokoro_server.py) runs continuously
 * - Kokoro pipeline initialized once at startup (takes ~20 seconds)
 * - All audio requests use HTTP API (milliseconds instead of seconds)
 * - Server started automatically when backend starts
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const KOKORO_SERVER_URL = process.env.KOKORO_SERVER_URL || 'http://localhost:8765';
const SERVER_STARTUP_TIMEOUT = 60000; // 60 seconds for Kokoro to initialize

interface KokoroOptions {
  text: string;
  voice?: 'af_aoede' | 'af_kore';
  speed?: number;
}

/**
 * Get backend root directory
 */
function getBackendDir(): string {
  let currentDir = __dirname;
  
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return path.resolve(__dirname, '../..');
}

const BACKEND_DIR = getBackendDir();
const VOICES_DIR = path.join(BACKEND_DIR, 'voices');

/**
 * Check if Kokoro TTS server is ready
 */
export async function checkKokoroAvailable(): Promise<boolean> {
  try {
    // Check if voices directory exists
    if (!fs.existsSync(VOICES_DIR)) {
      return false;
    }

    const voices = fs.readdirSync(VOICES_DIR);
    const hasVoices = voices.some(f => f.endsWith('.pt') && (f.includes('af_aoede') || f.includes('af_kore')));
    
    if (!hasVoices) {
      return false;
    }

    // Check if server is running and ready
    try {
      const response = await axios.get(`${KOKORO_SERVER_URL}/health`, {
        timeout: 5000
      });
      
      return response.data.kokoro_initialized === true;
    } catch (error: any) {
      // Server might not be started yet - that's okay
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return false;
      }
      throw error;
    }
  } catch (error: any) {
    return false;
  }
}

/**
 * Generate speech using Kokoro TTS via HTTP API
 * This is FAST because Kokoro is already initialized in the server
 */
export async function generateKokoroSpeech(options: KokoroOptions): Promise<Buffer> {
  const { text, voice = 'af_aoede', speed = 1.0 } = options;

  try {
    const startTime = Date.now();

    // Make HTTP request to Kokoro server
    const response = await axios.post(
      `${KOKORO_SERVER_URL}/generate`,
      {
        text,
        voice,
        speed
      },
      {
        responseType: 'arraybuffer', // Get binary audio data
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const audioBuffer = Buffer.from(response.data);
    return audioBuffer;

  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      const errorMsg = error.response.data?.error || error.response.statusText;
      throw new Error(`Kokoro TTS server error: ${errorMsg}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Kokoro TTS server is not running. Please ensure the server is started.');
    } else {
      throw new Error(`Kokoro TTS request failed: ${error.message}`);
    }
  }
}

/**
 * List available voices from Kokoro server
 */
export async function listKokoroVoices(): Promise<string[]> {
  try {
    const response = await axios.get(`${KOKORO_SERVER_URL}/voices`, {
      timeout: 5000
    });
    
    return response.data.voices || [];
  } catch (error: any) {
    // Fallback to local file system if server unavailable
    if (!fs.existsSync(VOICES_DIR)) {
      return [];
    }

    const files = fs.readdirSync(VOICES_DIR);
    return files
      .filter(file => file.endsWith('.pt'))
      .map(file => file.replace('.pt', ''));
  }
}
