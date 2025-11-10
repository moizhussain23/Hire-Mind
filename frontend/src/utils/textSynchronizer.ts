/**
 * Text Synchronizer
 * Synchronizes text display with audio playback for natural speech visualization
 */

export interface TextSegment {
  text: string;
  startTime: number; // ms from audio start
  duration: number; // ms
  isPause: boolean;
  emphasis?: 'none' | 'moderate' | 'strong';
}

export interface SyncConfig {
  text: string;
  audioDuration: number; // Total audio duration in ms
  wordsPerMinute?: number; // Average speaking rate
}

/**
 * Parse text and create synchronized segments
 */
export function parseTextToSegments(config: SyncConfig): TextSegment[] {
  const { text, audioDuration, wordsPerMinute = 150 } = config;
  
  const segments: TextSegment[] = [];
  let currentTime = 0;
  
  // Split text into words and punctuation
  const tokens = text.match(/[\w']+|[.,!?;:—…]/g) || [];
  
  // Calculate average time per word
  const words = tokens.filter(t => /[\w']+/.test(t));
  const avgTimePerWord = audioDuration / words.length;
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const isPunctuation = /[.,!?;:—…]/.test(token);
    
    if (isPunctuation) {
      // Add pause for punctuation
      const pauseDuration = getPauseDuration(token);
      segments.push({
        text: token,
        startTime: currentTime,
        duration: pauseDuration,
        isPause: true,
        emphasis: 'none'
      });
      currentTime += pauseDuration;
    } else {
      // Add word
      const emphasis = detectEmphasis(token, text);
      const wordDuration = avgTimePerWord * (emphasis === 'strong' ? 1.3 : 1.0);
      
      segments.push({
        text: token,
        startTime: currentTime,
        duration: wordDuration,
        isPause: false,
        emphasis
      });
      currentTime += wordDuration;
      
      // Add space
      if (i < tokens.length - 1 && !/[.,!?;:—…]/.test(tokens[i + 1])) {
        segments.push({
          text: ' ',
          startTime: currentTime,
          duration: 50,
          isPause: false,
          emphasis: 'none'
        });
        currentTime += 50;
      }
    }
  }
  
  return segments;
}

/**
 * Get pause duration for punctuation
 */
function getPauseDuration(punctuation: string): number {
  switch (punctuation) {
    case '.':
    case '!':
    case '?':
      return 600;
    case ',':
    case ';':
      return 300;
    case ':':
    case '—':
      return 400;
    case '…':
      return 800;
    default:
      return 200;
  }
}

/**
 * Detect emphasis in word
 */
function detectEmphasis(word: string, fullText: string): 'none' | 'moderate' | 'strong' {
  // Check if word is in ALL CAPS
  if (word === word.toUpperCase() && word.length > 1) {
    return 'strong';
  }
  
  // Check for emphasis markers in original text
  if (fullText.includes(`*${word}*`)) {
    return 'moderate';
  }
  
  if (fullText.includes(`**${word}**`)) {
    return 'strong';
  }
  
  // Common emphasis words
  const emphasisWords = ['really', 'very', 'absolutely', 'definitely', 'extremely', 'incredibly'];
  if (emphasisWords.includes(word.toLowerCase())) {
    return 'moderate';
  }
  
  return 'none';
}

/**
 * Get segments to display at current time
 */
export function getVisibleSegments(
  segments: TextSegment[],
  currentTime: number
): TextSegment[] {
  return segments.filter(seg => seg.startTime <= currentTime);
}

/**
 * Get currently speaking segment
 */
export function getCurrentSegment(
  segments: TextSegment[],
  currentTime: number
): TextSegment | null {
  return segments.find(
    seg => seg.startTime <= currentTime && seg.startTime + seg.duration > currentTime
  ) || null;
}

/**
 * Format text with emphasis styling
 */
export function formatTextWithEmphasis(text: string): string {
  // Remove markup and return clean text
  return text
    .replace(/\*\*(\w+)\*\*/g, '$1') // Remove **word**
    .replace(/\*(\w+)\*/g, '$1')     // Remove *word*
    .replace(/_(\w+)_/g, '$1')       // Remove _word_
    .replace(/\[(PAUSE|SHORT_PAUSE|LONG_PAUSE|BREATH)\]/g, '') // Remove pause markers
    .trim();
}

/**
 * Extract emphasis positions for styling
 */
export function extractEmphasisPositions(text: string): Array<{ word: string; position: number; level: 'moderate' | 'strong' }> {
  const positions: Array<{ word: string; position: number; level: 'moderate' | 'strong' }> = [];
  
  // Find **word** (strong emphasis)
  let match;
  const strongRegex = /\*\*(\w+)\*\*/g;
  while ((match = strongRegex.exec(text)) !== null) {
    positions.push({
      word: match[1],
      position: match.index,
      level: 'strong'
    });
  }
  
  // Find *word* (moderate emphasis)
  const moderateRegex = /\*(\w+)\*/g;
  while ((match = moderateRegex.exec(text)) !== null) {
    // Skip if already marked as strong
    if (!positions.find(p => p.word === match![1] && p.level === 'strong')) {
      positions.push({
        word: match[1],
        position: match.index,
        level: 'moderate'
      });
    }
  }
  
  return positions;
}

/**
 * Calculate word-by-word timing
 */
export function calculateWordTimings(
  text: string,
  totalDuration: number
): Array<{ word: string; startTime: number; duration: number }> {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgDuration = totalDuration / words.length;
  
  return words.map((word, index) => ({
    word,
    startTime: index * avgDuration,
    duration: avgDuration
  }));
}

export default {
  parseTextToSegments,
  getVisibleSegments,
  getCurrentSegment,
  formatTextWithEmphasis,
  extractEmphasisPositions,
  calculateWordTimings
};
