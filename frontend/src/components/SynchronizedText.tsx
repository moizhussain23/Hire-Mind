/**
 * Synchronized Text Component
 * Displays text word-by-word synchronized with audio playback
 */

import { useEffect, useState, useRef } from 'react';
import { 
  parseTextToSegments, 
  getVisibleSegments,
  getCurrentSegment,
  formatTextWithEmphasis,
  TextSegment 
} from '../utils/textSynchronizer';

interface SynchronizedTextProps {
  text: string;
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onComplete?: () => void;
}

export default function SynchronizedText({ 
  text, 
  audioElement, 
  isPlaying,
  onComplete 
}: SynchronizedTextProps) {
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [visibleSegments, setVisibleSegments] = useState<TextSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<TextSegment | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Parse text when it changes
  useEffect(() => {
    if (!text || !audioElement) return;

    const audioDuration = audioElement.duration * 1000; // Convert to ms
    
    if (isNaN(audioDuration) || audioDuration === 0) {
      // Audio not loaded yet, show full text
      setVisibleSegments([]);
      return;
    }

    const parsedSegments = parseTextToSegments({
      text: formatTextWithEmphasis(text),
      audioDuration
    });

    setSegments(parsedSegments);
  }, [text, audioElement]);

  // Update visible segments during playback
  useEffect(() => {
    if (!isPlaying || !audioElement || segments.length === 0) {
      // Show all text if not playing
      setVisibleSegments(segments);
      setCurrentSegment(null);
      return;
    }

    const updateSegments = () => {
      const currentTime = audioElement.currentTime * 1000; // Convert to ms
      
      const visible = getVisibleSegments(segments, currentTime);
      const current = getCurrentSegment(segments, currentTime);
      
      setVisibleSegments(visible);
      setCurrentSegment(current);

      // Check if complete
      if (currentTime >= audioElement.duration * 1000 - 100) {
        if (onComplete) onComplete();
      }

      animationFrameRef.current = requestAnimationFrame(updateSegments);
    };

    animationFrameRef.current = requestAnimationFrame(updateSegments);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, audioElement, segments, onComplete]);

  // Render segments with emphasis
  const renderSegment = (segment: TextSegment, index: number) => {
    const isCurrent = currentSegment === segment;
    const isEmphasis = segment.emphasis && segment.emphasis !== 'none';

    let className = 'transition-all duration-200';
    
    if (isCurrent) {
      className += ' text-teal-600 font-semibold scale-105';
    } else if (isEmphasis) {
      if (segment.emphasis === 'strong') {
        className += ' font-bold text-slate-900';
      } else if (segment.emphasis === 'moderate') {
        className += ' font-semibold text-slate-800';
      }
    } else {
      className += ' text-slate-700';
    }

    if (segment.isPause) {
      return null; // Don't render pause markers
    }

    return (
      <span key={index} className={className}>
        {segment.text}
      </span>
    );
  };

  return (
    <div className="text-base leading-relaxed">
      {visibleSegments.length > 0 ? (
        visibleSegments.map((segment, index) => renderSegment(segment, index))
      ) : (
        <span className="text-slate-700">{formatTextWithEmphasis(text)}</span>
      )}
    </div>
  );
}
