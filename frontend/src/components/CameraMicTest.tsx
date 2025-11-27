import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, CheckCircle, XCircle, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  // Initialize media devices
  useEffect(() => {
    initializeMedia();
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
      mediaStream.getTracks().forEach(track => track.stop());
    }
    initializeMedia();
  }, [interviewMode]);

  const initializeMedia = async () => {
    setErrorMsg(null);
    setCameraStatus('testing');
    setMicStatus('testing');

    try {
      const needsVideo = interviewMode === 'video-voice' || interviewMode === 'video-only';
      const needsAudio = interviewMode === 'video-voice' || interviewMode === 'audio-only';

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

      // Check camera
      if (needsVideo) {
        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0 && videoTracks[0].enabled) {
          setCameraStatus('success');
          setIsCameraEnabled(true);
        } else {
          setCameraStatus('error');
          setErrorMsg('Camera detected but not enabled.');
        }
      } else {
        setCameraStatus('success');
        setIsCameraEnabled(false);
      }

      // Check microphone
      if (needsAudio) {
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0 && audioTracks[0].enabled) {
          setMicStatus('success');
          setIsMicEnabled(true);
          setupAudioAnalyser(stream);
        } else {
          setMicStatus('error');
          setErrorMsg('Microphone detected but not enabled.');
        }
      } else {
        setMicStatus('success');
        setIsMicEnabled(false);
      }
    } catch (err: any) {
      console.error('Media error:', err);
      setCameraStatus('error');
      setMicStatus('error');

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Permission denied. Please allow camera/microphone access in your browser settings (click the lock icon in the address bar).');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No camera or microphone found. Please check your devices.');
      } else {
        setErrorMsg(`Failed to access devices: ${err.message}`);
      }
    }
  };

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 256;
      microphone.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      monitorAudioLevel();
    } catch (e) {
      console.error('Audio analyser setup failed', e);
    }
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
        // Don't alert, just show visual feedback
        // Ideally we'd show a toast, but for now we rely on the visual meter
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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 z-50">
      <div className="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '95vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 shrink-0">
          <h1 className="text-xl font-bold text-white mb-1">System Check</h1>
          <p className="text-blue-100 text-sm">Let's verify your equipment before we start</p>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 shrink-0">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Device Access Issue</h3>
                <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto grow">
          <div className={`grid gap-6 ${interviewMode === 'video-voice' ? 'md:grid-cols-2' : 'md:grid-cols-1'
            }`}>
            {/* Video Preview */}
            {(interviewMode === 'video-voice' || interviewMode === 'video-only') && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-600" />
                  Camera Preview
                </h3>
                <div className="relative bg-black rounded-xl overflow-hidden shadow-lg aspect-video group">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />

                  {!isCameraEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                      <div className="text-center">
                        <VideoOff className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">Camera is disabled</p>
                      </div>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {cameraStatus === 'success' ? (
                      <div className="bg-green-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Working
                      </div>
                    ) : (
                      <div className="bg-red-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        Check Camera
                      </div>
                    )}
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center">
                      <button
                        onClick={toggleCamera}
                        className={`p-2 rounded-full transition-colors ${isCameraEnabled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                      >
                        {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Test */}
            {(interviewMode === 'video-voice' || interviewMode === 'audio-only') && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-blue-600" />
                  Microphone Check
                </h3>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 h-full">
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      {micStatus === 'success' ? (
                        <span className="text-sm font-medium text-green-600 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Connected
                        </span>
                      ) : (
                        <span className="text-sm font-medium text-red-600 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4" /> Not Detected
                        </span>
                      )}
                    </div>

                    {/* Visualizer */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Input Level</span>
                        <span>{Math.round(audioLevel)}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-100 rounded-full ${audioLevel > 60 ? 'bg-red-500' : audioLevel > 30 ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                          style={{ width: `${audioLevel}%` }}
                        />
                      </div>
                    </div>

                    {/* Test Button */}
                    <button
                      onClick={testMicrophone}
                      disabled={isTestingAudio || !isMicEnabled}
                      className="w-full py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isTestingAudio ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" /> Testing...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" /> Test Audio
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex gap-3">
              <div className="shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {candidateName.charAt(0)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{candidateName}</h4>
                <p className="text-sm text-gray-600">{position} • {interviewMode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 flex gap-3">
          <button
            onClick={initializeMedia}
            className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => {
              if (mediaStream && canProceed) {
                if (audioContextRef.current) audioContextRef.current.close();
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                onTestComplete(mediaStream);
              }
            }}
            disabled={!canProceed}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            {canProceed ? 'Join Interview' : 'Check Devices to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
