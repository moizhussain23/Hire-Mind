/**
 * Thinking Indicator Component
 * Shows progressive, contextual thinking messages with progress bar
 */

import { useEffect, useState } from 'react';
import { 
  generateThinkingMessages, 
  getCurrentThinkingMessage,
  calculateThinkingProgress,
  getThinkingAnimation,
  ThinkingMessage 
} from '../utils/thinkingMessageGenerator';

interface ThinkingIndicatorProps {
  answerLength?: number;
  questionType?: 'technical' | 'behavioral' | 'opening';
  isFirstQuestion?: boolean;
  expectedDuration?: number; // ms
  onComplete?: () => void;
}

export default function ThinkingIndicator({
  answerLength = 100,
  questionType = 'behavioral',
  isFirstQuestion = false,
  expectedDuration = 3000,
  onComplete
}: ThinkingIndicatorProps) {
  const [currentMessage, setCurrentMessage] = useState<ThinkingMessage | null>(null);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState<ThinkingMessage[]>([]);

  useEffect(() => {
    // Generate messages on mount
    const generatedMessages = generateThinkingMessages({
      answerLength,
      questionType,
      isFirstQuestion
    });
    setMessages(generatedMessages);

    const startTime = Date.now();
    
    // Update every 100ms
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // Get current message
      const current = getCurrentThinkingMessage(generatedMessages, elapsed);
      setCurrentMessage(current);

      // Calculate progress
      const prog = calculateThinkingProgress(elapsed, expectedDuration);
      setProgress(prog);

      // Complete when done
      if (elapsed >= expectedDuration) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [answerLength, questionType, isFirstQuestion, expectedDuration, onComplete]);

  const animationType = getThinkingAnimation(progress);

  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-md">
        {/* Thinking dots and message */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex gap-1.5">
            <div 
              className={`w-2 h-2 bg-teal-500 rounded-full ${
                animationType === 'pulse' ? 'animate-pulse' : 
                animationType === 'bounce' ? 'animate-bounce' : 
                'animate-spin'
              }`}
            ></div>
            <div 
              className={`w-2 h-2 bg-teal-400 rounded-full ${
                animationType === 'pulse' ? 'animate-pulse' : 
                animationType === 'bounce' ? 'animate-bounce' : 
                'animate-spin'
              }`}
              style={{ animationDelay: '0.1s' }}
            ></div>
            <div 
              className={`w-2 h-2 bg-emerald-500 rounded-full ${
                animationType === 'pulse' ? 'animate-pulse' : 
                animationType === 'bounce' ? 'animate-bounce' : 
                'animate-spin'
              }`}
              style={{ animationDelay: '0.2s' }}
            ></div>
          </div>
          
          {/* Message with icon */}
          <div className="flex items-center gap-2">
            {currentMessage?.icon && (
              <span className="text-lg">{currentMessage.icon}</span>
            )}
            <span className="text-sm text-slate-700 font-medium">
              {currentMessage?.text || 'Thinking...'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress percentage (subtle) */}
        <div className="text-xs text-slate-400 mt-1 text-right">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
