import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import AIInterviewSystemV2 from '../components/AIInterviewSystemV2';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  summary: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
}

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const [showInterview, setShowInterview] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any>(null);
  
  // Loading states
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  
  // Get invitation token from URL params or location state
  const invitationToken = new URLSearchParams(location.search).get('token') || 
                         location.state?.invitationToken ||
                         location.state?.sessionToken;

  // Interview configuration loaded from invitation
  const [candidateName, setCandidateName] = useState('');
  const [position, setPosition] = useState('');
  const [interviewType, setInterviewType] = useState<'Video Only' | 'Voice Only' | 'Both'>('Both');
  const [skillCategory, setSkillCategory] = useState<'technical' | 'non-technical'>('technical');
  const [experienceLevel, setExperienceLevel] = useState<'fresher' | 'mid-level' | 'senior'>('mid-level');
  const [hasCodingRound, setHasCodingRound] = useState(true);

  // Resume data loaded from invitation
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);

  // Start heartbeat when interview is active
  const { heartbeatCount } = useHeartbeat({
    sessionToken: invitationToken,
    isActive: showInterview,
    intervalMs: 30000 // Send heartbeat every 30 seconds
  });

  // Load invitation data from MongoDB
  const loadInvitationData = async () => {
    if (!invitationToken) {
      setLoadingError('No invitation token provided. Please use the link from your invitation email.');
      setIsLoadingInvitation(false);
      return;
    }

    try {
      console.log('🔍 Loading invitation data for token:', invitationToken);
      
      const response = await fetch('/api/invitation/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: invitationToken })
      });

      if (!response.ok) {
        throw new Error('Failed to load invitation data');
      }

      const invitationData = await response.json();
      
      if (!invitationData.success) {
        throw new Error(invitationData.error || 'Invalid invitation token');
      }

      const { invitation, interview } = invitationData.data;
      
      // Set interview configuration from invitation
      setCandidateName(invitation.candidateName || '');
      setPosition(interview.jobTitle || '');
      setInterviewType(interview.interviewType || 'Both');
      setSkillCategory(interview.skillCategory || 'technical');
      setExperienceLevel(interview.experienceLevel || 'mid-level');
      setHasCodingRound(interview.skillCategory === 'technical');
      
      // Set resume data if available
      if (invitation.resumeData) {
        setResumeData(invitation.resumeData);
        console.log('✅ Resume data loaded from invitation:', invitation.resumeData);
      }
      
      if (invitation.resumeUrl) {
        setResumeUrl(invitation.resumeUrl);
        console.log('📄 Resume URL loaded:', invitation.resumeUrl);
      }

      console.log('✅ Invitation data loaded successfully');
      
      // Automatically start interview after loading data
      setTimeout(() => {
        setShowInterview(true);
      }, 1500); // Small delay to show loading completion
      
    } catch (error: any) {
      console.error('❌ Failed to load invitation data:', error);
      setLoadingError(error.message || 'Failed to load invitation data');
    } finally {
      setIsLoadingInvitation(false);
    }
  };

  const completeSession = async (reason = 'manual_end') => {
    if (!invitationToken) return;
    
    try {
      const token = await getToken();
      await axios.post(
        `${API_URL}/sessions/${invitationToken}/complete`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log(`✅ Session marked as completed (${reason})`);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const handleInterviewComplete = async (result: any) => {
    console.log('✅ Interview completed:', result);
    setInterviewResult(result);
    setInterviewComplete(true);
    setShowInterview(false);
    await completeSession('completed');
  };

  const handleInterviewError = (error: string) => {
    console.error('❌ Interview error:', error);
    alert(`Interview Error: ${error}`);
  };

  // Load invitation data on component mount
  useEffect(() => {
    loadInvitationData();
  }, [invitationToken]);

  // Handle page unload/close (when user closes tab or browser)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showInterview && invitationToken) {
        // Mark session as completed
        completeSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [showInterview, invitationToken]);

  // Show loading screen while loading invitation data
  if (isLoadingInvitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Interview...</h2>
          <p className="text-gray-600 mb-4">Setting up your personalized interview experience</p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-4">Loading resume data and interview configuration...</p>
        </div>
      </div>
    );
  }

  // Show error screen if loading failed
  if (loadingError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Interview</h2>
          <p className="text-gray-600 mb-6">{loadingError}</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoadingError(null);
                setIsLoadingInvitation(true);
                loadInvitationData();
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview component with auto-loaded data
  if (showInterview) {
    return (
      <AIInterviewSystemV2
        interviewId={`interview-${invitationToken}`}
        candidateName={candidateName}
        position={position}
        resumeUrl={resumeUrl || ''}
        resumeData={resumeData}
        skillCategory={skillCategory}
        experienceLevel={experienceLevel}
        interviewType={interviewType}
        hasCodingRound={hasCodingRound}
        invitationToken={invitationToken}
        onComplete={handleInterviewComplete}
        onError={handleInterviewError}
      />
    );
  }


  if (interviewComplete && interviewResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h2>
              <p className="text-gray-600">Thank you for completing the interview</p>
            </div>

            <div className="space-y-6">
              {/* Interview Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Interview Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Candidate</p>
                    <p className="font-medium text-blue-900">{candidateName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Position</p>
                    <p className="font-medium text-blue-900">{position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Duration</p>
                    <p className="font-medium text-blue-900">
                      {Math.floor(interviewResult.duration / 60000)}m {Math.floor((interviewResult.duration % 60000) / 1000)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Questions Answered</p>
                    <p className="font-medium text-blue-900">{interviewResult.responses.length}</p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Your Responses</h3>
                <div className="space-y-4">
                  {interviewResult.responses.map((response: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Q{index + 1}: {response.question}
                      </p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">
                        {response.answer || '(Recorded response)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Answered at: {Math.floor(response.timestamp / 1000)}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 pt-6">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => console.log('Interview data:', interviewResult)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Console Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default waiting screen - interview will auto-start
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Interview Starting Soon!</h2>
        <p className="text-gray-600 mb-6">
          Your interview will begin automatically with camera and microphone setup.
        </p>
        
        {/* Interview Info Summary */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Candidate:</span>
              <span className="font-semibold text-gray-900">{candidateName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Position:</span>
              <span className="font-semibold text-gray-900">{position}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Type:</span>
              <span className="font-semibold text-gray-900">{interviewType}</span>
            </div>
            {resumeData && (
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-sm text-green-600">Resume:</span>
                <span className="font-semibold text-green-700">✅ Loaded</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        <p className="text-xs text-gray-400 mt-4">
          Please wait while we prepare your personalized interview experience...
        </p>
      </div>
    </div>
  );
}

export default Interview
