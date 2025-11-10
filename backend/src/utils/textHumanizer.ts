/**
 * Text Humanizer Utility
 * Transforms robotic AI text into natural, human-like speech patterns
 */

interface HumanizeOptions {
  addThinkingPauses?: boolean;
  addFillers?: boolean;
  addBreaths?: boolean;
  addEmphasis?: boolean;
  emotionalTone?: 'excited' | 'thoughtful' | 'concerned' | 'supportive' | 'neutral';
}

// Natural conversational fillers
const FILLERS = {
  thinking: ['Hmm...', 'Let me think...', 'Well...', 'So...', 'Ah...', 'You know...'],
  acknowledgment: ['I see.', 'Mmm...', 'Ah, okay.', 'Right.', 'Got it.'],
  transition: ['So...', 'Well...', 'Now...', 'Alright...', 'Okay...'],
  curiosity: ['Interesting...', 'Fascinating...', 'I\'m curious...', 'Tell me...'],
  empathy: ['I understand.', 'That makes sense.', 'I hear you.', 'I get that.']
};

// Emotional markers for different tones
const EMOTIONAL_MARKERS = {
  excited: {
    prefix: ['Wow!', 'That\'s amazing!', 'Fantastic!', 'Excellent!'],
    emphasis: ['really', 'absolutely', 'definitely', 'truly']
  },
  thoughtful: {
    prefix: ['Hmm...', 'Let me think about that...', 'Interesting...'],
    emphasis: ['perhaps', 'possibly', 'maybe', 'I wonder']
  },
  concerned: {
    prefix: ['I see...', 'Hmm...', 'Okay...'],
    emphasis: ['important', 'critical', 'key', 'essential']
  },
  supportive: {
    prefix: ['That\'s okay.', 'No worries.', 'Take your time.', 'Don\'t worry.'],
    emphasis: ['absolutely', 'definitely', 'certainly', 'sure']
  },
  neutral: {
    prefix: ['I see.', 'Okay.', 'Alright.'],
    emphasis: []
  }
};

/**
 * Add natural pauses to text
 */
function addNaturalPauses(text: string): string {
  // Add pauses after punctuation
  text = text.replace(/\.\s+/g, '... ');
  text = text.replace(/!\s+/g, '! ');
  text = text.replace(/\?\s+/g, '? ');
  
  // Add pauses after commas (shorter)
  text = text.replace(/,\s+/g, ', ');
  
  // Add thinking pauses before questions
  if (text.includes('?')) {
    text = text.replace(/([A-Z][^.!?]*\?)/g, '... $1');
  }
  
  return text;
}

/**
 * Add conversational fillers
 */
function addConversationalFillers(text: string, tone: string = 'neutral'): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  if (sentences.length === 0) return text;
  
  // Add filler to first sentence (30% chance)
  if (Math.random() < 0.3) {
    const filler = getRandomItem(FILLERS.thinking);
    sentences[0] = `${filler} ${sentences[0]}`;
  }
  
  // Add transition fillers between sentences (20% chance)
  for (let i = 1; i < sentences.length; i++) {
    if (Math.random() < 0.2) {
      const filler = getRandomItem(FILLERS.transition);
      sentences[i] = `${filler} ${sentences[i]}`;
    }
  }
  
  return sentences.join(' ');
}

/**
 * Add breath markers
 */
function addBreathMarkers(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Add breath after every 2-3 sentences
  const result: string[] = [];
  for (let i = 0; i < sentences.length; i++) {
    result.push(sentences[i]);
    if ((i + 1) % 2 === 0 && i < sentences.length - 1) {
      result.push('[BREATH]');
    }
  }
  
  return result.join(' ');
}

/**
 * Add emphasis to key words
 */
function addEmphasis(text: string, emotionalTone: string = 'neutral'): string {
  const markers = EMOTIONAL_MARKERS[emotionalTone as keyof typeof EMOTIONAL_MARKERS] || EMOTIONAL_MARKERS.neutral;
  
  // Add emphasis markers to key words
  markers.emphasis.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    text = text.replace(regex, `*${word}*`);
  });
  
  return text;
}

/**
 * Add emotional prefix based on tone
 */
function addEmotionalPrefix(text: string, tone: string): string {
  const markers = EMOTIONAL_MARKERS[tone as keyof typeof EMOTIONAL_MARKERS];
  if (!markers || markers.prefix.length === 0) return text;
  
  // 40% chance to add emotional prefix
  if (Math.random() < 0.4) {
    const prefix = getRandomItem(markers.prefix);
    return `${prefix} ${text}`;
  }
  
  return text;
}

/**
 * Detect if text is a question
 */
function isQuestion(text: string): boolean {
  return text.trim().endsWith('?') || 
         text.toLowerCase().startsWith('can you') ||
         text.toLowerCase().startsWith('could you') ||
         text.toLowerCase().startsWith('would you') ||
         text.toLowerCase().startsWith('tell me') ||
         text.toLowerCase().startsWith('how') ||
         text.toLowerCase().startsWith('what') ||
         text.toLowerCase().startsWith('why') ||
         text.toLowerCase().startsWith('when') ||
         text.toLowerCase().startsWith('where');
}

/**
 * Add thinking pause before questions
 */
function addThinkingPause(text: string): string {
  if (isQuestion(text)) {
    const thinkingMarkers = ['Hmm...', 'Let me ask you...', 'So...', 'Well...'];
    const marker = getRandomItem(thinkingMarkers);
    return `${marker} ${text}`;
  }
  return text;
}

/**
 * Get random item from array
 */
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Main humanize function
 */
export function humanizeText(text: string, options: HumanizeOptions = {}): string {
  const {
    addThinkingPauses = true,
    addFillers = true,
    addBreaths = true,
    addEmphasis: shouldAddEmphasis = true,
    emotionalTone = 'neutral'
  } = options;
  
  let humanizedText = text;
  
  // 1. Add emotional prefix
  humanizedText = addEmotionalPrefix(humanizedText, emotionalTone);
  
  // 2. Add thinking pauses before questions
  if (addThinkingPauses) {
    humanizedText = addThinkingPause(humanizedText);
  }
  
  // 3. Add conversational fillers
  if (addFillers) {
    humanizedText = addConversationalFillers(humanizedText, emotionalTone);
  }
  
  // 4. Add natural pauses
  humanizedText = addNaturalPauses(humanizedText);
  
  // 5. Add emphasis
  if (shouldAddEmphasis) {
    humanizedText = addEmphasis(humanizedText, emotionalTone);
  }
  
  // 6. Add breath markers
  if (addBreaths) {
    humanizedText = addBreathMarkers(humanizedText);
  }
  
  return humanizedText;
}

/**
 * Determine emotional tone based on context
 */
export function detectEmotionalTone(context: {
  answerQuality?: string;
  questionType?: string;
  candidateEmotion?: string;
}): 'excited' | 'thoughtful' | 'concerned' | 'supportive' | 'neutral' {
  const { answerQuality, questionType, candidateEmotion } = context;
  
  // Excited for excellent answers
  if (answerQuality === 'excellent' || answerQuality === 'great') {
    return 'excited';
  }
  
  // Supportive for poor answers or nervous candidates
  if (answerQuality === 'poor' || candidateEmotion === 'nervous') {
    return 'supportive';
  }
  
  // Thoughtful for technical questions
  if (questionType === 'technical') {
    return 'thoughtful';
  }
  
  // Concerned for critical questions
  if (questionType === 'critical') {
    return 'concerned';
  }
  
  return 'neutral';
}

/**
 * Add conversational callbacks (reference previous answers)
 */
export function addConversationalCallback(text: string, previousContext?: string): string {
  if (!previousContext || Math.random() > 0.3) return text;
  
  const callbacks = [
    `Building on what you mentioned earlier... ${text}`,
    `You said something interesting about that... ${text}`,
    `Going back to what you shared... ${text}`,
    `Earlier you mentioned... ${text}`,
    `That reminds me of what you said... ${text}`
  ];
  
  return getRandomItem(callbacks);
}

export default {
  humanizeText,
  detectEmotionalTone,
  addConversationalCallback
};
