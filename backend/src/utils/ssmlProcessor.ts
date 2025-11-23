/**
 * SSML-Like Markup Processor
 * Converts custom markup to TTS-friendly format with pauses and emphasis
 */

export interface SSMLConfig {
  text: string;
  pauses: Array<{ position: number; duration: number }>;
  emphasis: Array<{ word: string; level: 'strong' | 'moderate' | 'reduced' }>;
  rate: number; // Speech rate multiplier (0.5 = slow, 1.0 = normal, 1.5 = fast)
  pitch: number; // Pitch adjustment (-10 to +10)
}

/**
 * Parse custom markup and extract SSML-like instructions
 */
export function parseMarkup(text: string): SSMLConfig {
  const config: SSMLConfig = {
    text: text,
    pauses: [],
    emphasis: [],
    rate: 0.9, // Default slightly slower for clarity
    pitch: 0
  };
  
  // Extract and remove pause markers
  config.pauses = extractPauses(text);
  text = removePauseMarkers(text);
  
  // Extract and remove emphasis markers
  config.emphasis = extractEmphasis(text);
  text = removeEmphasisMarkers(text);
  
  // Extract rate adjustments
  const rateMatch = text.match(/<rate=([\d.]+)>/);
  if (rateMatch) {
    config.rate = parseFloat(rateMatch[1]);
    text = text.replace(/<rate=[\d.]+>/g, '');
  }
  
  // Extract pitch adjustments
  const pitchMatch = text.match(/<pitch=([+-]?\d+)>/);
  if (pitchMatch) {
    config.pitch = parseInt(pitchMatch[1]);
    text = text.replace(/<pitch=[+-]?\d+>/g, '');
  }
  
  config.text = text.trim();
  
  return config;
}

/**
 * Extract pause markers from text
 */
function extractPauses(text: string): Array<{ position: number; duration: number }> {
  const pauses: Array<{ position: number; duration: number }> = [];
  
  // Match pause markers: [PAUSE], [SHORT_PAUSE], [LONG_PAUSE], [BREATH]
  const pauseRegex = /\[(PAUSE|SHORT_PAUSE|LONG_PAUSE|BREATH)\]/g;
  let match;
  let position = 0;
  
  while ((match = pauseRegex.exec(text)) !== null) {
    const pauseType = match[1];
    const duration = getPauseDuration(pauseType);
    
    // Calculate position in clean text (without markers)
    const cleanPosition = match.index - (pauses.length * match[0].length);
    
    pauses.push({
      position: cleanPosition,
      duration
    });
  }
  
  // Also detect natural pauses from punctuation
  const punctuationPauses = detectPunctuationPauses(text);
  pauses.push(...punctuationPauses);
  
  return pauses.sort((a, b) => a.position - b.position);
}

/**
 * Get pause duration based on type
 */
function getPauseDuration(pauseType: string): number {
  switch (pauseType) {
    case 'SHORT_PAUSE':
      return 200; // 200ms
    case 'PAUSE':
      return 500; // 500ms
    case 'LONG_PAUSE':
      return 800; // 800ms
    case 'BREATH':
      return 300; // 300ms
    default:
      return 500;
  }
}

/**
 * Detect pauses from punctuation
 */
function detectPunctuationPauses(text: string): Array<{ position: number; duration: number }> {
  const pauses: Array<{ position: number; duration: number }> = [];
  
  // Find all punctuation marks
  const punctuationRegex = /[.!?,;:]/g;
  let match;
  
  while ((match = punctuationRegex.exec(text)) !== null) {
    const punctuation = match[0];
    const duration = getPunctuationDuration(punctuation);
    
    pauses.push({
      position: match.index + 1, // After the punctuation
      duration
    });
  }
  
  return pauses;
}

/**
 * Get pause duration for punctuation
 */
function getPunctuationDuration(punctuation: string): number {
  switch (punctuation) {
    case '.':
    case '!':
    case '?':
      return 600; // 600ms
    case ',':
    case ';':
      return 300; // 300ms
    case ':':
      return 400; // 400ms
    default:
      return 200;
  }
}

/**
 * Remove pause markers from text
 */
function removePauseMarkers(text: string): string {
  return text.replace(/\[(PAUSE|SHORT_PAUSE|LONG_PAUSE|BREATH)\]/g, '');
}

/**
 * Extract emphasis markers from text
 */
function extractEmphasis(text: string): Array<{ word: string; level: 'strong' | 'moderate' | 'reduced' }> {
  const emphasis: Array<{ word: string; level: 'strong' | 'moderate' | 'reduced' }> = [];
  
  // Match emphasis markers: *word* (moderate), **word** (strong), _word_ (reduced)
  
  // Strong emphasis: **word**
  const strongRegex = /\*\*(\w+)\*\*/g;
  let match: RegExpExecArray | null;
  while ((match = strongRegex.exec(text)) !== null) {
    emphasis.push({
      word: match[1],
      level: 'strong'
    });
  }
  
  // Moderate emphasis: *word*
  const moderateRegex = /\*(\w+)\*/g;
  let moderateMatch: RegExpExecArray | null;
  while ((moderateMatch = moderateRegex.exec(text)) !== null) {
    // Skip if already marked as strong
    if (!emphasis.find(e => e.word === moderateMatch![1] && e.level === 'strong')) {
      emphasis.push({
        word: moderateMatch[1],
        level: 'moderate'
      });
    }
  }
  
  // Reduced emphasis: _word_
  const reducedRegex = /_(\w+)_/g;
  let reducedMatch: RegExpExecArray | null;
  while ((reducedMatch = reducedRegex.exec(text)) !== null) {
    emphasis.push({
      word: reducedMatch[1],
      level: 'reduced'
    });
  }
  
  return emphasis;
}

/**
 * Remove emphasis markers from text
 */
function removeEmphasisMarkers(text: string): string {
  return text
    .replace(/\*\*(\w+)\*\*/g, '$1') // Remove **word**
    .replace(/\*(\w+)\*/g, '$1')     // Remove *word*
    .replace(/_(\w+)_/g, '$1');      // Remove _word_
}

/**
 * Convert text with pauses to time-stamped segments
 */
export function textToTimedSegments(config: SSMLConfig): Array<{ text: string; delay: number }> {
  const segments: Array<{ text: string; delay: number }> = [];
  const { text, pauses } = config;
  
  let currentPosition = 0;
  
  // Sort pauses by position
  const sortedPauses = [...pauses].sort((a, b) => a.position - b.position);
  
  for (const pause of sortedPauses) {
    // Add text segment before pause
    if (pause.position > currentPosition) {
      const segmentText = text.substring(currentPosition, pause.position);
      segments.push({
        text: segmentText,
        delay: 0
      });
    }
    
    // Add pause
    segments.push({
      text: '',
      delay: pause.duration
    });
    
    currentPosition = pause.position;
  }
  
  // Add remaining text
  if (currentPosition < text.length) {
    segments.push({
      text: text.substring(currentPosition),
      delay: 0
    });
  }
  
  return segments;
}

/**
 * Apply emphasis to TTS speed/pitch
 */
export function applyEmphasis(
  word: string,
  level: 'strong' | 'moderate' | 'reduced',
  baseSpeed: number = 0.9
): { speed: number; pitch: number } {
  switch (level) {
    case 'strong':
      return {
        speed: baseSpeed * 0.8, // Slower for emphasis
        pitch: 2 // Higher pitch
      };
    case 'moderate':
      return {
        speed: baseSpeed * 0.9,
        pitch: 1
      };
    case 'reduced':
      return {
        speed: baseSpeed * 1.1, // Faster, de-emphasized
        pitch: -1 // Lower pitch
      };
    default:
      return {
        speed: baseSpeed,
        pitch: 0
      };
  }
}

/**
 * Insert pauses into text for TTS
 */
export function insertPausesIntoText(text: string, pauses: Array<{ position: number; duration: number }>): string {
  let result = text;
  let offset = 0;
  
  // Sort pauses by position
  const sortedPauses = [...pauses].sort((a, b) => a.position - b.position);
  
  for (const pause of sortedPauses) {
    const pauseMarker = ` ... `; // Use ellipsis for pauses
    const insertPosition = pause.position + offset;
    
    result = result.slice(0, insertPosition) + pauseMarker + result.slice(insertPosition);
    offset += pauseMarker.length;
  }
  
  return result;
}

/**
 * Clean text for TTS (remove all markup)
 */
export function cleanTextForTTS(text: string): string {
  return text
    .replace(/\[(PAUSE|SHORT_PAUSE|LONG_PAUSE|BREATH)\]/g, ' ') // Remove markers completely - pauses should be handled by TTS system
    .replace(/\*\*(\w+)\*\*/g, '$1') // Remove **word**
    .replace(/\*(\w+)\*/g, '$1')     // Remove *word*
    .replace(/_(\w+)_/g, '$1')       // Remove _word_
    .replace(/<rate=[\d.]+>/g, '')   // Remove rate markers
    .replace(/<pitch=[+-]?\d+>/g, '') // Remove pitch markers
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .replace(/\.\.\./g, '.')         // Replace ellipsis with period for cleaner speech
    .trim();
}

/**
 * Add natural pauses to text based on content
 */
export function addNaturalPauses(text: string): string {
  // Don't add explicit pause markers - rely on natural speech patterns
  // TTS systems handle punctuation pauses automatically
  
  // Just ensure proper spacing after punctuation
  text = text.replace(/([.!?])\s*/g, '$1 ');
  text = text.replace(/,\s*/g, ', ');
  
  return text;
}

export default {
  parseMarkup,
  textToTimedSegments,
  applyEmphasis,
  insertPausesIntoText,
  cleanTextForTTS,
  addNaturalPauses
};
