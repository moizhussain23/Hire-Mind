/**
 * Real-Time Transcription Display
 * Shows candidate's words as they speak with live feedback
 */

import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';

interface RealTimeTranscriptionProps {
  isListening: boolean;
  transcript: string;
  interimTranscript?: string;
  confidence?: number;
}

export default function RealTimeTranscription({
  isListening,
  transcript,
  interimTranscript = '',
  confidence = 0
}: RealTimeTranscriptionProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // Combine final and interim transcripts
    const fullText = transcript + (interimTranscript ? ' ' + interimTranscript : '');
    setDisplayText(fullText);
  }, [transcript, interimTranscript]);

  if (!isListening && !displayText) return null;

  return (
    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="w-4 h-4 text-teal-600" />
            {isListening && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <span className="text-sm font-medium text-teal-900">
            {isListening ? 'Listening...' : 'Your Response'}
          </span>
        </div>

        {/* Confidence indicator */}
        {confidence > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-teal-600">
              {Math.round(confidence * 100)}% confidence
            </span>
            <div className="w-16 bg-teal-100 rounded-full h-1.5">
              <div 
                className="bg-teal-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${confidence * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Transcription text */}
      <div className="min-h-[60px] max-h-[200px] overflow-y-auto">
        {displayText ? (
          <p className="text-slate-700 leading-relaxed">
            {/* Final transcript */}
            <span className="text-slate-900">{transcript}</span>
            
            {/* Interim transcript (lighter) */}
            {interimTranscript && (
              <span className="text-slate-500 italic"> {interimTranscript}</span>
            )}

            {/* Blinking cursor when listening */}
            {isListening && (
              <span className="inline-block w-0.5 h-5 bg-teal-600 ml-1 animate-pulse"></span>
            )}
          </p>
        ) : (
          <p className="text-slate-400 italic">
            {isListening ? 'Start speaking...' : 'No transcription yet'}
          </p>
        )}
      </div>

      {/* Word count */}
      {displayText && (
        <div className="mt-3 pt-3 border-t border-teal-200 flex items-center justify-between">
          <span className="text-xs text-teal-600">
            {displayText.split(/\s+/).filter(w => w.length > 0).length} words
          </span>
          {isListening && (
            <span className="text-xs text-teal-600 animate-pulse">
              ● Recording
            </span>
          )}
        </div>
      )}
    </div>
  );
}
