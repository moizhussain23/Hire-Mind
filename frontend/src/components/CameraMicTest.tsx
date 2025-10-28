import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, CheckCircle, XCircle, Loader } from 'lucide-react';

interface CameraMicTestProps {
  onTestComplete: (stream: MediaStream) => void;
  candidateName: string;
  position: string;
  interviewMode: 'video-voice' | 'audio-only' | 'video-only';
}

export default function CameraMicTest({ onTestComplete, candidateName, position, interviewMode }: CameraMicTestProps) {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [micStatus, setMicStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize media devices
  useEffect(() => {
    initializeMedia();
    // Note: We don't stop tracks on unmount because we pass them to the interview
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Re-initialize when mode changes
  useEffect(() => {
    if (mediaStream) {
      // Stop existing tracks
      mediaStream.getTracks().forEach(track => track.stop());
    }
    initializeMedia();
  }, [interviewMode]);

  const initializeMedia = async () => {
    try {
      // Determine what to request based on interview mode
      const needsVideo = interviewMode === 'video-voice' || interviewMode === 'video-only';
      const needsAudio = interviewMode === 'video-voice' || interviewMode === 'audio-only';
      
      console.log('🎬 Interview Mode:', interviewMode);
      console.log('📹 Needs Video:', needsVideo);
      console.log('🎤 Needs Audio:', needsAudio);
      
      const constraints: MediaStreamConstraints = {
        audio: needsAudio,
        video: needsVideo ? { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setMediaStream(stream);
      
      if (videoRef.current && needsVideo) {
        videoRef.current.srcObject = stream;
      }

      // Check camera (only if needed)
      if (needsVideo) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0 && videoTracks[0].enabled) {
          setCameraStatus('success');
          setIsCameraEnabled(true);
        } else {
          setCameraStatus('error');
        }
      } else {
        setCameraStatus('success'); // Not needed, mark as success
        setIsCameraEnabled(false);
      }

      // Check microphone (only if needed)
      if (needsAudio) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          setMicStatus('success');
          setIsMicEnabled(true);
          setupAudioAnalyser(stream);
        } else {
          setMicStatus('error');
        }
      } else {
        setMicStatus('success'); // Not needed, mark as success
        setIsMicEnabled(false);
      }
    } catch (err: any) {
      console.error('Media error:', err);
      setCameraStatus('error');
      setMicStatus('error');
      alert('Failed to access camera/microphone. Please allow permissions and try again.');
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    microphone.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    
    monitorAudioLevel();
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkLevel = () => {
      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(Math.min(100, (average / 128) * 100));
        animationFrameRef.current = requestAnimationFrame(checkLevel);
      }
    };
    
    checkLevel();
  };

  const testMicrophone = () => {
    setIsTestingAudio(true);
    setTimeout(() => {
      setIsTestingAudio(false);
      if (audioLevel > 5) {
        setMicStatus('success');
      } else {
        alert('No audio detected. Please speak into your microphone.');
      }
    }, 3000);
  };

  const toggleCamera = () => {
    if (mediaStream) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicEnabled(audioTrack.enabled);
      }
    }
  };

  // Check if can proceed based on interview mode
  const canProceed = (() => {
    if (interviewMode === 'video-voice') {
      return cameraStatus === 'success' && micStatus === 'success';
    } else if (interviewMode === 'audio-only') {
      return micStatus === 'success';
    } else if (interviewMode === 'video-only') {
      return cameraStatus === 'success';
    }
    return false;
  })();

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '95vh' }}>
        {/* Header - Compact */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3">
          <h1 className="text-xl font-bold text-white mb-1">Setup Check</h1>
          <p className="text-blue-100 text-sm">Verify your camera and microphone</p>
        </div>

        {/* Content - Compact */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 80px)' }}>
          <div className={`grid gap-4 ${
            interviewMode === 'video-voice' ? 'md:grid-cols-2' : 'md:grid-cols-1'
          }`}>
            {/* Video Preview - Only show for video-voice and video-only */}
            {(interviewMode === 'video-voice' || interviewMode === 'video-only') && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-600" />
                Camera Test
              </h3>
              <div className="relative bg-black rounded-xl overflow-hidden shadow-lg" style={{ aspectRatio: '16/9' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!isCameraEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Camera is off</p>
                    </div>
                  </div>
                )}
                
                {/* Camera Status Badge */}
                <div className="absolute top-3 right-3 z-10">
                  {cameraStatus === 'success' && (
                    <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Camera OK
                    </div>
                  )}
                  {cameraStatus === 'error' && (
                    <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <XCircle className="w-3.5 h-3.5" />
                      Camera Error
                    </div>
                  )}
                  {cameraStatus === 'testing' && (
                    <div className="bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Testing...
                    </div>
                  )}
                </div>

                {/* Camera Toggle */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                  <button
                    onClick={toggleCamera}
                    className={`p-3 rounded-full transition-all shadow-lg ${
                      isCameraEnabled 
                        ? 'bg-gray-800/80 hover:bg-gray-700' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {isCameraEnabled ? (
                      <Video className="w-5 h-5 text-white" />
                    ) : (
                      <VideoOff className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            )}

            {/* Microphone Test - Only show for video-voice and audio-only */}
            {(interviewMode === 'video-voice' || interviewMode === 'audio-only') && (
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-600" />
                Microphone Test
              </h3>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-lg">
                {/* Mic Status */}
                <div className="mb-4">
                  {micStatus === 'success' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-green-800 font-semibold text-sm">Microphone OK</p>
                      </div>
                    </div>
                  )}
                  {micStatus === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="text-red-800 font-semibold text-sm">Microphone Error</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audio Level Meter */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Audio Level</span>
                    <button
                      onClick={toggleMic}
                      className={`p-2 rounded-lg transition-all ${
                        isMicEnabled 
                          ? 'bg-gray-200 hover:bg-gray-300' 
                          : 'bg-red-100 hover:bg-red-200'
                      }`}
                    >
                      {isMicEnabled ? (
                        <Mic className="w-4 h-4 text-gray-700" />
                      ) : (
                        <MicOff className="w-4 h-4 text-red-600" />
                      )}
                    </button>
                  </div>
                  
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-100 rounded-full"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isTestingAudio ? 'Listening...' : 'Speak to test'}
                  </p>
                </div>

                {/* Test Button */}
                <button
                  onClick={testMicrophone}
                  disabled={isTestingAudio || !isMicEnabled}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  {isTestingAudio ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      Test Microphone
                    </>
                  )}
                </button>
              </div>
            </div>
            )}
          </div>

          {/* Interview Info */}
          <div className="mt-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">Interview Details</h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600 text-xs">Candidate:</span>
                <span className="ml-2 font-semibold text-gray-800">{candidateName}</span>
              </div>
              <div>
                <span className="text-gray-600 text-xs">Position:</span>
                <span className="ml-2 font-semibold text-gray-800">{position}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={initializeMedia}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 rounded-lg font-semibold transition-colors text-sm"
            >
              Retry Setup
            </button>
            <button
              onClick={() => {
                if (mediaStream && canProceed) {
                  // Stop audio context before passing stream
                  if (audioContextRef.current) {
                    audioContextRef.current.close();
                  }
                  if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                  }
                  onTestComplete(mediaStream);
                }
              }}
              disabled={!canProceed}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-2.5 rounded-lg font-semibold transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2 text-sm"
            >
              {canProceed ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Join Interview
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Fix Issues to Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
