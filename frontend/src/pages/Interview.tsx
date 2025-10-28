import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Mic, MicOff, Video, VideoOff, Phone, PhoneOff } from 'lucide-react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import AIInterviewSystemV2 from '../components/AIInterviewSystemV2'
import { useHeartbeat } from '../hooks/useHeartbeat'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Interview = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { getToken } = useAuth()
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  
  // Get session data from navigation state
  const sessionToken = location.state?.sessionToken
  const sessionData = location.state?.sessionData

  // Start heartbeat when interview is active
  const { heartbeatCount } = useHeartbeat({
    sessionToken,
    isActive: isInterviewStarted,
    intervalMs: 30000 // Send heartbeat every 30 seconds
  })

  const handleStartInterview = () => {
    setIsInterviewStarted(true)
    setIsConnected(true)
  }

  const completeSession = async (reason = 'manual_end') => {
    if (!sessionToken) return
    
    try {
      const token = await getToken()
      await axios.post(
        `${API_URL}/sessions/${sessionToken}/complete`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log(`✅ Session marked as completed (${reason})`)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const handleEndInterview = async () => {
    // Mark session as completed
    await completeSession()
    
    setIsInterviewStarted(false)
    setIsConnected(false)
    navigate('/dashboard')
  }

  // Handle page unload/close (when user closes tab or browser)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isInterviewStarted && sessionToken) {
        // Mark session as completed
        completeSession()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isInterviewStarted, sessionToken])

  if (isInterviewStarted) {
    return (
      <AIInterviewSystemV2
        interviewId={sessionData?.interview?.id || 'unknown'}
        candidateName={sessionData?.candidateName || 'Candidate'}
        position={sessionData?.position || 'Position'}
        resumeUrl={sessionData?.resumeUrl || ''}
        skillCategory={sessionData?.skillCategory || 'technical'}
        experienceLevel={sessionData?.experienceLevel || 'mid'}
        onComplete={async (result) => {
          console.log('Interview completed:', result);
          await completeSession('completed');
          navigate('/dashboard');
        }}
        onError={(error) => {
          console.error('Interview error:', error);
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Interview Setup</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready for Your Interview?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Make sure your camera and microphone are working properly before starting.
          </p>

          {/* Device Controls */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Device Settings</h3>
            
            <div className="flex justify-center space-x-8 mb-8">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-4 rounded-full ${
                    isVideoOn ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}
                >
                  {isVideoOn ? <Video className="h-8 w-8" /> : <VideoOff className="h-8 w-8" />}
                </button>
                <span className="mt-2 text-sm text-gray-600">
                  {isVideoOn ? 'Camera On' : 'Camera Off'}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full ${
                    isMuted ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                </button>
                <span className="mt-2 text-sm text-gray-600">
                  {isMuted ? 'Muted' : 'Unmuted'}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-500">
              <p>• Ensure good lighting for your camera</p>
              <p>• Test your microphone in a quiet environment</p>
              <p>• Close unnecessary applications for better performance</p>
            </div>
          </div>

          {/* Start Interview Button */}
          <button
            onClick={handleStartInterview}
            className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center mx-auto"
          >
            <Phone className="h-6 w-6 mr-2" />
            Start Interview
          </button>
        </div>
      </main>
    </div>
  )
}

export default Interview
