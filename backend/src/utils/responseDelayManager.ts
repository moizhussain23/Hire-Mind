/**
 * Response Delay Manager
 * Adds realistic thinking/processing delays to make AIRA feel human
 */

interface DelayConfig {
  minDelay: number;
  maxDelay: number;
  complexity?: 'simple' | 'medium' | 'complex';
}

/**
 * Calculate realistic delay based on answer complexity
 */
export function calculateThinkingDelay(context: {
  answerLength?: number;
  answerQuality?: string;
  questionType?: string;
  complexity?: 'simple' | 'medium' | 'complex';
}): number {
  const { answerLength = 100, answerQuality, questionType, complexity } = context;
  
  let baseDelay = 2000; // 2 seconds base
  
  // Adjust based on answer length (longer answers = more processing time)
  if (answerLength > 200) {
    baseDelay += 1000; // +1 second for long answers
  } else if (answerLength > 500) {
    baseDelay += 2000; // +2 seconds for very long answers
  }
  
  // Adjust based on answer quality (complex answers need more thinking)
  if (answerQuality === 'excellent' || answerQuality === 'complex') {
    baseDelay += 1000; // +1 second for complex answers
  }
  
  // Adjust based on question type
  if (questionType === 'technical') {
    baseDelay += 500; // +0.5 seconds for technical questions
  }
  
  // Adjust based on complexity
  if (complexity === 'complex') {
    baseDelay += 1500;
  } else if (complexity === 'medium') {
    baseDelay += 500;
  }
  
  // Add random variation (±500ms) for naturalness
  const variation = Math.random() * 1000 - 500;
  const finalDelay = baseDelay + variation;
  
  // Cap between 1.5s and 5s
  return Math.max(1500, Math.min(5000, finalDelay));
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add realistic delay with progress updates
 */
export async function addRealisticDelay(
  delayMs: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  const steps = 10;
  const stepDelay = delayMs / steps;
  
  for (let i = 0; i <= steps; i++) {
    await sleep(stepDelay);
    if (onProgress) {
      onProgress((i / steps) * 100);
    }
  }
}

/**
 * Get thinking message based on delay length
 */
export function getThinkingMessage(delayMs: number): string {
  if (delayMs < 2000) {
    return 'Processing...';
  } else if (delayMs < 3500) {
    return 'Thinking...';
  } else {
    return 'Analyzing your response...';
  }
}

/**
 * Simulate typing delay (for text responses)
 */
export function calculateTypingDelay(textLength: number): number {
  // Average typing speed: 40-60 WPM = ~200-300 chars/min = ~3-5 chars/sec
  const charsPerSecond = 4; // Conservative estimate
  const baseDelay = (textLength / charsPerSecond) * 1000;
  
  // Add random variation
  const variation = Math.random() * 500;
  
  // Cap between 500ms and 3s
  return Math.max(500, Math.min(3000, baseDelay + variation));
}

/**
 * Add pause between sentences (for natural speech)
 */
export function getSentencePauseDelay(): number {
  // Natural pause between sentences: 300-800ms
  return 300 + Math.random() * 500;
}

/**
 * Add pause after punctuation
 */
export function getPunctuationPauseDelay(punctuation: string): number {
  switch (punctuation) {
    case '.':
    case '!':
    case '?':
      return 500 + Math.random() * 300; // 500-800ms
    case ',':
    case ';':
      return 200 + Math.random() * 200; // 200-400ms
    case ':':
      return 300 + Math.random() * 200; // 300-500ms
    default:
      return 100; // 100ms default
  }
}

/**
 * Calculate total speech duration with pauses
 */
export function calculateSpeechDuration(text: string, baseSpeed: number = 0.9): number {
  // Average speech rate: 150 words per minute = 2.5 words/sec
  const words = text.split(/\s+/).length;
  const baseDuration = (words / 2.5) * 1000; // in milliseconds
  
  // Adjust for speed
  const adjustedDuration = baseDuration / baseSpeed;
  
  // Add pauses for punctuation
  const punctuationCount = (text.match(/[.!?,;:]/g) || []).length;
  const pauseDuration = punctuationCount * 400; // Average 400ms per punctuation
  
  return adjustedDuration + pauseDuration;
}

/**
 * Delay configuration presets
 */
export const DELAY_PRESETS = {
  // Quick acknowledgment (e.g., "I see", "Okay")
  ACKNOWLEDGMENT: {
    minDelay: 800,
    maxDelay: 1500,
    complexity: 'simple' as const
  },
  
  // Normal response (e.g., follow-up question)
  NORMAL: {
    minDelay: 2000,
    maxDelay: 3500,
    complexity: 'medium' as const
  },
  
  // Complex evaluation (e.g., analyzing technical answer)
  COMPLEX: {
    minDelay: 3000,
    maxDelay: 5000,
    complexity: 'complex' as const
  },
  
  // Opening greeting (quick, welcoming)
  GREETING: {
    minDelay: 1000,
    maxDelay: 2000,
    complexity: 'simple' as const
  }
};

/**
 * Get delay based on preset
 */
export function getDelayFromPreset(preset: keyof typeof DELAY_PRESETS): number {
  const config = DELAY_PRESETS[preset];
  const range = config.maxDelay - config.minDelay;
  return config.minDelay + Math.random() * range;
}

export default {
  calculateThinkingDelay,
  sleep,
  addRealisticDelay,
  getThinkingMessage,
  calculateTypingDelay,
  getSentencePauseDelay,
  getPunctuationPauseDelay,
  calculateSpeechDuration,
  getDelayFromPreset,
  DELAY_PRESETS
};
