/**
 * Enhanced TTS Service with Human-like Speech
 * Integrates text humanization, SSML processing, and natural pauses
 */

import { humanizeText, detectEmotionalTone, addConversationalCallback } from '../utils/textHumanizer';
import { parseMarkup, cleanTextForTTS, addNaturalPauses } from '../utils/ssmlProcessor';
import { generateSpeechWithPreset } from './ttsService';

interface EnhancedTTSOptions {
  text: string;
  emotionalContext?: {
    answerQuality?: 'excellent' | 'good' | 'average' | 'poor';
    questionType?: 'technical' | 'behavioral' | 'opening' | 'closing';
    candidateEmotion?: 'confident' | 'nervous' | 'neutral';
  };
  previousContext?: string;
  addHumanization?: boolean;
  addNaturalPauses?: boolean;
  variableSpeed?: boolean;
}

/**
 * Generate speech with human-like qualities
 */
export async function generateHumanLikeSpeech(options: EnhancedTTSOptions): Promise<Buffer> {
  const {
    text,
    emotionalContext = {},
    previousContext,
    addHumanization = true,
    addNaturalPauses: shouldAddPauses = true,
    variableSpeed = true
  } = options;

  let processedText = text;

  // Step 1: Detect emotional tone
  const emotionalTone = detectEmotionalTone({
    answerQuality: emotionalContext.answerQuality,
    questionType: emotionalContext.questionType,
    candidateEmotion: emotionalContext.candidateEmotion
  });

  console.log(`🎭 Emotional tone detected: ${emotionalTone}`);

  // Step 2: Add conversational callbacks if context available
  if (previousContext && Math.random() < 0.3) {
    processedText = addConversationalCallback(processedText, previousContext);
  }

  // Step 3: Humanize text (add fillers, pauses, emphasis) - only if enabled
  if (addHumanization) {
    processedText = humanizeText(processedText, {
      addThinkingPauses: true,
      addFillers: true,
      addBreaths: false, // Disable breath markers
      addEmphasis: false, // Disable emphasis to keep text clean
      emotionalTone
    });
    console.log(`✨ Text humanized: "${processedText.substring(0, 80)}..."`);
  } else {
    console.log(`📝 Text kept original: "${processedText.substring(0, 80)}..."`);
  }

  // Step 4: Add natural pauses - only if enabled and humanization is on
  if (shouldAddPauses && addHumanization) {
    processedText = addNaturalPauses(processedText);
  }

  // Step 5: Parse SSML-like markup
  const ssmlConfig = parseMarkup(processedText);
  
  // Step 6: Clean text for TTS
  const cleanText = cleanTextForTTS(processedText);
  
  console.log(`🎤 Generating TTS: "${cleanText.substring(0, 80)}..."`);

  // Step 7: Determine speech speed based on emotional tone and content
  let speed = 0.9; // Default
  if (variableSpeed) {
    speed = getSpeedForTone(emotionalTone, emotionalContext.questionType);
  }

  // Step 8: Generate audio with appropriate speed
  const audioBuffer = await generateSpeechWithPreset(cleanText, 'AIRA_PROFESSIONAL');

  return audioBuffer;
}

/**
 * Get appropriate speech speed based on emotional tone
 */
function getSpeedForTone(
  tone: 'excited' | 'thoughtful' | 'concerned' | 'supportive' | 'neutral',
  questionType?: string
): number {
  // Base speeds for different tones
  const speeds = {
    excited: 1.0,      // Faster, energetic
    thoughtful: 0.8,   // Slower, deliberate
    concerned: 0.85,   // Slightly slower, careful
    supportive: 0.9,   // Normal, warm
    neutral: 0.9       // Standard pace
  };

  let speed = speeds[tone];

  // Adjust for question type
  if (questionType === 'technical') {
    speed *= 0.9; // Slower for technical content
  } else if (questionType === 'opening') {
    speed *= 0.95; // Slightly slower for opening
  }

  return speed;
}

/**
 * Generate acknowledgment with natural delay
 * Used for quick responses like "I see", "Okay", etc.
 */
export async function generateQuickAcknowledgment(
  acknowledgment: string,
  tone: 'positive' | 'neutral' | 'supportive' = 'neutral'
): Promise<Buffer> {
  // Add natural filler
  const fillers = {
    positive: ['Great!', 'Excellent!', 'Nice!'],
    neutral: ['I see.', 'Okay.', 'Alright.'],
    supportive: ['I understand.', 'That makes sense.', 'I hear you.']
  };

  const filler = fillers[tone][Math.floor(Math.random() * fillers[tone].length)];
  const text = `${filler} ${acknowledgment}`;

  return generateHumanLikeSpeech({
    text,
    emotionalContext: {
      answerQuality: tone === 'positive' ? 'excellent' : 'average'
    },
    addHumanization: true,
    addNaturalPauses: true,
    variableSpeed: true
  });
}

/**
 * Generate follow-up question with natural flow
 */
export async function generateFollowUpQuestion(
  question: string,
  context: {
    previousAnswer?: string;
    answerQuality?: 'excellent' | 'good' | 'average' | 'poor';
    questionType?: 'technical' | 'behavioral';
  }
): Promise<Buffer> {
  return generateHumanLikeSpeech({
    text: question,
    emotionalContext: {
      answerQuality: context.answerQuality,
      questionType: context.questionType
    },
    previousContext: context.previousAnswer,
    addHumanization: true,
    addNaturalPauses: true,
    variableSpeed: true
  });
}

/**
 * Generate opening greeting with warmth
 */
export async function generateOpeningGreeting(
  candidateName: string,
  position: string
): Promise<Buffer> {
  const greetings = [
    `Hi ${candidateName}! It's so great to meet you. [PAUSE] I'm AIRA, and I'll be conducting your interview today for the ${position} position. [BREATH] Let's have a great conversation! [PAUSE] To start, tell me a bit about yourself and your background.`,
    `Hello ${candidateName}! [PAUSE] Welcome! I'm AIRA, your AI interviewer. [BREATH] I'm really looking forward to learning about your experience for the ${position} role. [PAUSE] Why don't you start by introducing yourself?`,
    `Hey ${candidateName}! [PAUSE] Thanks for joining me today. I'm AIRA. [BREATH] We'll be discussing your background and experience for the ${position} position. [PAUSE] Let's begin - tell me about yourself!`
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];

  return generateHumanLikeSpeech({
    text: greeting,
    emotionalContext: {
      questionType: 'opening',
      candidateEmotion: 'neutral'
    },
    addHumanization: true,
    addNaturalPauses: true,
    variableSpeed: true
  });
}

/**
 * Generate response based on answer quality
 */
export async function generateQualityBasedResponse(
  quality: 'excellent' | 'good' | 'average' | 'poor',
  followUpText?: string
): Promise<{ acknowledgment: Buffer; followUp?: Buffer }> {
  const acknowledgments = {
    excellent: [
      'Wow! That\'s *really* impressive!',
      'Excellent! I love that approach!',
      'That\'s fantastic! Great insight!',
      'Amazing! That shows real depth!'
    ],
    good: [
      'Great answer! I appreciate that.',
      'Nice! That makes a lot of sense.',
      'Good! I like how you explained that.',
      'That\'s a solid approach!'
    ],
    average: [
      'I see. That\'s interesting.',
      'Okay, I understand.',
      'Alright, that makes sense.',
      'I hear you.'
    ],
    poor: [
      'Hmm... I see what you mean.',
      'Okay... Let me ask this differently.',
      'I understand. No worries.',
      'That\'s okay. Let\'s try another angle.'
    ]
  };

  const ack = acknowledgments[quality][Math.floor(Math.random() * acknowledgments[quality].length)];
  
  const acknowledgmentBuffer = await generateHumanLikeSpeech({
    text: ack,
    emotionalContext: {
      answerQuality: quality
    },
    addHumanization: true,
    addNaturalPauses: true
  });

  let followUpBuffer;
  if (followUpText) {
    followUpBuffer = await generateFollowUpQuestion(followUpText, {
      answerQuality: quality
    });
  }

  return {
    acknowledgment: acknowledgmentBuffer,
    followUp: followUpBuffer
  };
}

export default {
  generateHumanLikeSpeech,
  generateQuickAcknowledgment,
  generateFollowUpQuestion,
  generateOpeningGreeting,
  generateQualityBasedResponse
};
