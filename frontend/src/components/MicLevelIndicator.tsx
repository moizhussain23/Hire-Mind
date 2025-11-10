/**
 * Microphone Level Indicator
 * Real-time audio level visualization with status messages
 */

import { useEffect, useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import AudioLevelDetector, { 
  getAudioLevelColor, 
  getAudioLevelStatus,
  getAudioLevelMessage 
} from '../utils/audioLevelDetector';

interface MicLevelIndicatorProps {
  stream: MediaStream | null;
  isActive?: boolean;
}

export default function MicLevelIndicator({ stream, isActive = true }: MicLevelIndicatorProps) {
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<'too-quiet' | 'good' | 'optimal' | 'loud' | 'too-loud'>('good');
  const [color, setColor] = useState('#22c55e');
  const [message, setMessage] = useState('Good volume');
  const detectorRef = useRef<AudioLevelDetector | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      // Clean up
      if (detectorRef.current) {
        detectorRef.current.stop();
        detectorRef.current = null;
      }
      setLevel(0);
      return;
    }

    // Start detection
    const detector = new AudioLevelDetector({
      smoothing: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      fftSize: 256
    });

    detector.start(stream, (newLevel) => {
      setLevel(newLevel);
      setStatus(getAudioLevelStatus(newLevel));
      setColor(getAudioLevelColor(newLevel));
      setMessage(getAudioLevelMessage(newLevel));
    });

    detectorRef.current = detector;

    return () => {
      detector.stop();
    };
  }, [stream, isActive]);

  if (!isActive) return null;

  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
      {/* Mic icon */}
      <Mic 
        className="w-4 h-4" 
        style={{ color }}
      />

      {/* Level bar */}
      <div className="flex-1 min-w-[120px]">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-slate-600">Mic Level</span>
          <span className="text-xs text-slate-400">{Math.round(level)}%</span>
        </div>
        
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-150 ease-out"
            style={{ 
              width: `${level}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
      </div>

      {/* Status message */}
      <div className="text-xs font-medium" style={{ color }}>
        {message}
      </div>

      {/* Visual indicator */}
      <div 
        className={`w-2 h-2 rounded-full ${
          status === 'optimal' ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: color }}
      ></div>
    </div>
  );
}
