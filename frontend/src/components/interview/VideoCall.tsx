import React, { useRef, useEffect, useState } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface VideoCallProps {
  onInterviewStart: () => void;
  onInterviewEnd: () => void;
  isInterviewActive: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({
  onInterviewStart,
  onInterviewEnd,
  isInterviewActive
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { 
    localStream, 
    remoteStream, 
    isConnected, 
    startCall, 
    endCall, 
    toggleMute, 
    toggleVideo 
  } = useWebRTC();

  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleStartCall = async () => {
    setIsConnecting(true);
    try {
      await startCall();
      onInterviewStart();
    } catch (error) {
      console.error('Failed to start call:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEndCall = () => {
    endCall();
    onInterviewEnd();
  };

  const handleToggleMute = () => {
    toggleMute();
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoOn(!isVideoOn);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        {/* Video Container */}
        <div className="relative bg-gray-900 aspect-video">
          {/* Local Video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute top-4 right-4 w-32 h-24 object-cover rounded-lg border-2 border-white shadow-lg"
          />
          
          {/* Remote Video Placeholder */}
          <div className="flex items-center justify-center h-full">
            {isConnected ? (
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-lg font-medium">Connected to AI Interviewer</p>
                <p className="text-sm text-gray-300">The interview is ready to begin</p>
              </div>
            ) : (
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </div>
                <p className="text-lg font-medium">AI Interview Ready</p>
                <p className="text-sm text-gray-300">Click start to begin your interview</p>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="absolute top-4 left-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isConnected ? 'Connected' : 'Ready'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-center space-x-4">
            {!isInterviewActive ? (
              <Button
                onClick={handleStartCall}
                loading={isConnecting}
                size="lg"
                className="px-8"
              >
                {isConnecting ? 'Connecting...' : 'Start Interview'}
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleToggleMute}
                  variant={isMuted ? 'danger' : 'outline'}
                  size="lg"
                >
                  {isMuted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.293 13H3a1 1 0 01-1-1V8a1 1 0 011-1h2.293l3.09-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.293 13H3a1 1 0 01-1-1V8a1 1 0 011-1h2.293l3.09-3.793a1 1 0 011.617.793z" clipRule="evenodd" />
                    </svg>
                  )}
                </Button>

                <Button
                  onClick={handleToggleVideo}
                  variant={isVideoOn ? 'outline' : 'danger'}
                  size="lg"
                >
                  {isVideoOn ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </Button>

                <Button
                  onClick={handleEndCall}
                  variant="danger"
                  size="lg"
                >
                  End Interview
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default VideoCall;
