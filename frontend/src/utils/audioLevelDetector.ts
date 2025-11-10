/**
 * Audio Level Detector
 * Real-time audio level detection and visualization
 */

export interface AudioLevelConfig {
  smoothing?: number; // 0-1, higher = smoother
  minDecibels?: number;
  maxDecibels?: number;
  fftSize?: number;
}

export class AudioLevelDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrame: number | null = null;
  private onLevelChange: ((level: number) => void) | null = null;
  
  constructor(private config: AudioLevelConfig = {}) {
    this.config = {
      smoothing: 0.8,
      minDecibels: -90,
      maxDecibels: -10,
      fftSize: 256,
      ...config
    };
  }
  
  /**
   * Start detecting audio levels from media stream
   */
  async start(stream: MediaStream, onLevelChange: (level: number) => void): Promise<void> {
    this.onLevelChange = onLevelChange;
    
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create analyser
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.smoothingTimeConstant = this.config.smoothing!;
    this.analyser.minDecibels = this.config.minDecibels!;
    this.analyser.maxDecibels = this.config.maxDecibels!;
    this.analyser.fftSize = this.config.fftSize!;
    
    // Create source from stream
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
    
    // Create data array
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    // Start monitoring
    this.monitor();
  }
  
  /**
   * Monitor audio levels
   */
  private monitor(): void {
    if (!this.analyser || !this.dataArray) return;
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array);
    
    // Calculate average level
    const sum = Array.from(this.dataArray).reduce((acc, val) => acc + val, 0);
    const average = sum / this.dataArray.length;
    
    // Normalize to 0-100
    const level = Math.min(100, (average / 255) * 100);
    
    // Call callback
    if (this.onLevelChange) {
      this.onLevelChange(level);
    }
    
    // Continue monitoring
    this.animationFrame = requestAnimationFrame(() => this.monitor());
  }
  
  /**
   * Stop detecting
   */
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
    this.onLevelChange = null;
  }
  
  /**
   * Get current audio level (0-100)
   */
  getCurrentLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array);
    const sum = Array.from(this.dataArray).reduce((acc, val) => acc + val, 0);
    const average = sum / this.dataArray.length;
    
    return Math.min(100, (average / 255) * 100);
  }
  
  /**
   * Get frequency data for visualization
   */
  getFrequencyData(): Uint8Array | null {
    if (!this.analyser || !this.dataArray) return null;
    
    this.analyser.getByteFrequencyData(this.dataArray as Uint8Array);
    return this.dataArray;
  }
}

/**
 * Get audio level color based on level
 */
export function getAudioLevelColor(level: number): string {
  if (level < 20) return '#94a3b8'; // slate-400 (too quiet)
  if (level < 40) return '#22c55e'; // green-500 (good)
  if (level < 70) return '#3b82f6'; // blue-500 (optimal)
  if (level < 85) return '#f59e0b'; // amber-500 (loud)
  return '#ef4444'; // red-500 (too loud)
}

/**
 * Get audio level status
 */
export function getAudioLevelStatus(level: number): 'too-quiet' | 'good' | 'optimal' | 'loud' | 'too-loud' {
  if (level < 20) return 'too-quiet';
  if (level < 40) return 'good';
  if (level < 70) return 'optimal';
  if (level < 85) return 'loud';
  return 'too-loud';
}

/**
 * Get audio level message
 */
export function getAudioLevelMessage(level: number): string {
  const status = getAudioLevelStatus(level);
  
  const messages = {
    'too-quiet': 'Speak louder',
    'good': 'Good volume',
    'optimal': 'Perfect!',
    'loud': 'A bit loud',
    'too-loud': 'Too loud!'
  };
  
  return messages[status];
}

export default AudioLevelDetector;
