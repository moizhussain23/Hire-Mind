/**
 * Thinking Message Generator
 * Generates contextual, progressive thinking messages during AI processing
 */

export interface ThinkingContext {
  answerLength?: number;
  questionType?: 'technical' | 'behavioral' | 'opening';
  elapsedTime?: number; // Time since thinking started (ms)
  isFirstQuestion?: boolean;
}

export interface ThinkingMessage {
  text: string;
  icon?: string;
  showAfter: number; // Show after X milliseconds
  priority: 'low' | 'medium' | 'high';
}

/**
 * Generate progressive thinking messages based on context
 */
export function generateThinkingMessages(context: ThinkingContext): ThinkingMessage[] {
  const { answerLength = 100, questionType = 'behavioral', isFirstQuestion = false } = context;
  
  const messages: ThinkingMessage[] = [];
  
  // Phase 1: Initial processing (0-1000ms)
  if (isFirstQuestion) {
    messages.push({
      text: 'Getting to know you...',
      icon: '👋',
      showAfter: 0,
      priority: 'high'
    });
  } else {
    messages.push({
      text: 'Processing your answer...',
      icon: '🎯',
      showAfter: 0,
      priority: 'high'
    });
  }
  
  // Phase 2: Analysis (1000-2500ms)
  if (answerLength > 200) {
    messages.push({
      text: 'Analyzing your detailed response...',
      icon: '🔍',
      showAfter: 1000,
      priority: 'medium'
    });
  } else {
    messages.push({
      text: 'Understanding your perspective...',
      icon: '💭',
      showAfter: 1000,
      priority: 'medium'
    });
  }
  
  // Phase 3: Preparation (2500-4000ms)
  if (questionType === 'technical') {
    messages.push({
      text: 'Preparing technical follow-up...',
      icon: '⚙️',
      showAfter: 2500,
      priority: 'low'
    });
  } else {
    messages.push({
      text: 'Formulating next question...',
      icon: '✨',
      showAfter: 2500,
      priority: 'low'
    });
  }
  
  // Phase 4: Final (4000ms+)
  messages.push({
    text: 'Almost ready...',
    icon: '⏳',
    showAfter: 4000,
    priority: 'low'
  });
  
  return messages;
}

/**
 * Get current thinking message based on elapsed time
 */
export function getCurrentThinkingMessage(
  messages: ThinkingMessage[],
  elapsedTime: number
): ThinkingMessage | null {
  // Find the most recent message that should be shown
  const applicableMessages = messages.filter(m => m.showAfter <= elapsedTime);
  
  if (applicableMessages.length === 0) return null;
  
  // Return the last applicable message
  return applicableMessages[applicableMessages.length - 1];
}

/**
 * Calculate thinking progress (0-100)
 */
export function calculateThinkingProgress(
  elapsedTime: number,
  expectedDuration: number = 3000
): number {
  const progress = (elapsedTime / expectedDuration) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Get thinking animation variant based on progress
 */
export function getThinkingAnimation(progress: number): 'pulse' | 'bounce' | 'spin' {
  if (progress < 30) return 'pulse';
  if (progress < 70) return 'bounce';
  return 'spin';
}

/**
 * Generate contextual thinking message for specific scenarios
 */
export function getContextualThinkingMessage(scenario: string): string {
  const messages: Record<string, string[]> = {
    'excellent-answer': [
      'Wow, processing that impressive response...',
      'Analyzing your excellent insights...',
      'That was great! Let me think about the next question...'
    ],
    'poor-answer': [
      'Understanding your response...',
      'Thinking about how to help you...',
      'Considering a different approach...'
    ],
    'technical-deep': [
      'Evaluating your technical explanation...',
      'Processing the technical details...',
      'Analyzing your implementation approach...'
    ],
    'behavioral-story': [
      'Reflecting on your experience...',
      'Understanding the situation you described...',
      'Thinking about your approach...'
    ],
    'opening': [
      'Nice to meet you! Getting ready...',
      'Preparing your personalized interview...',
      'Setting up the conversation...'
    ]
  };
  
  const options = messages[scenario] || messages['excellent-answer'];
  return options[Math.floor(Math.random() * options.length)];
}

export default {
  generateThinkingMessages,
  getCurrentThinkingMessage,
  calculateThinkingProgress,
  getThinkingAnimation,
  getContextualThinkingMessage
};
