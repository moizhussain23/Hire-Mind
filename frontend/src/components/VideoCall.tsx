import { useState, useRef, useEffect } from 'react'
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface VideoCallProps {
  isConnected: boolean
  onEndCall: () => void
}

const VideoCall = ({ isConnected, onEndCall }: VideoCallProps) => {
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAIResponding, setIsAIResponding] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [interviewTranscript, setInterviewTranscript] = useState<string[]>([])

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (isConnected) {
      startVideoCall()
      // Simulate AI starting the interview
      setTimeout(() => {
        setCurrentQuestion("Hello! Welcome to your interview. Can you please introduce yourself and tell me about your background?")
      }, 2000)
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isConnected])

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
        localStreamRef.current = stream
      }
    } catch (error) {
      console.error('Error accessing media devices:', error)
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOn(videoTrack.enabled)
      }
    }
  }

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
    }
    onEndCall()
  }

  const simulateAIResponse = () => {
    setIsAIResponding(true)
    // Simulate AI processing time
    setTimeout(() => {
      const responses = [
        "That's interesting. Can you tell me more about your experience with React?",
        "Great! What challenges have you faced in your previous projects?",
        "Excellent answer. How do you stay updated with the latest technologies?",
        "Thank you for that insight. What are your career goals for the next 5 years?",
        "Perfect! Do you have any questions for us about the role or company?"
      ]
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setCurrentQuestion(randomResponse)
      setIsAIResponding(false)
    }, 3000)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (AI Interviewer) */}
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">AI</span>
            </div>
            <h3 className="text-xl font-semibold">AI Interviewer</h3>
            {isAIResponding && (
              <div className="mt-4">
                <div className="animate-pulse text-sm">AI is thinking...</div>
              </div>
            )}
          </div>
        </div>

        {/* Local Video */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoOn && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-white" />
            </div>
          )}
        </div>

        {/* AI Question Display */}
        {currentQuestion && (
          <div className="absolute bottom-20 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold">AI</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm">{currentQuestion}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
            } text-white transition-colors`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              isVideoOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'
            } text-white transition-colors`}
          >
            {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </button>

          <button
            onClick={simulateAIResponse}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            Next Question
          </button>

          <button
            onClick={handleEndCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default VideoCall
