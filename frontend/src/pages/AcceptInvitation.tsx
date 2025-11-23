import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser, SignIn } from '@clerk/clerk-react'
import { CheckCircle, Clock, Building, Briefcase, Upload, AlertCircle } from 'lucide-react'
import axios from 'axios'
import IdentityVerification from '../components/IdentityVerification'

interface TimeSlot {
  date: Date
  formatted: string
}

interface InvitationData {
  id: string
  candidateEmail: string
  candidateName?: string
  timeSlots: Date[]
  expiresAt: Date
  status: string
}

interface InterviewData {
  id: string
  position: string
  description?: string
  skillCategory?: string
  experienceLevel?: string
  interviewType?: string
  requireResume?: boolean
}

interface CompanyData {
  name: string
  logo?: string
}

const AcceptInvitation = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isSignedIn, getToken } = useAuth()
  const { user } = useUser()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [interview, setInterview] = useState<InterviewData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [resumeUrl, setResumeUrl] = useState<string>('')
  const [idDocumentUrl, setIdDocumentUrl] = useState<string>('')
  const [candidateName, setCandidateName] = useState<string>('')
  const [resumeFile, setResumeFile] = useState<File | null>(null) // Store file, don't upload yet
  
  // Identity verification state
  const [showVerification, setShowVerification] = useState(false)
  const [verificationCompleted, setVerificationCompleted] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Fetch invitation details only if user is signed in
  useEffect(() => {
    // Don't fetch if user is not signed in - let the sign-in UI show first
    if (!user) {
      setLoading(false)
      return
    }

    const fetchInvitation = async () => {
      try {
        setLoading(true)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        // Remove trailing /api if it exists, then add /invitations
        const baseUrl = API_URL.replace(/\/api\/?$/, '')
        const url = `${baseUrl}/api/invitations/${token}`
        
        console.log('🔍 Fetching invitation from:', url)
        console.log('📝 Token:', token)
        console.log('🌐 API_URL:', API_URL)
        
        const response = await axios.get(url)
        console.log('✅ Response received:', response.data)

        if (response.data.success) {
          setInvitation(response.data.invitation)
          setInterview(response.data.interview)
          setCompany(response.data.company)
          
          // Leave name empty by default - candidate will fill it
        }
      } catch (err: any) {
        console.error('❌ Error fetching invitation:', err)
        console.error('❌ Error response:', err.response?.data)
        console.error('❌ Error status:', err.response?.status)
        setError(err.response?.data?.error || 'Failed to load invitation')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      console.log('🚀 Starting invitation fetch...')
      fetchInvitation()
    } else {
      console.log('⚠️ No token found in URL')
    }
  }, [token, user])

  // Handle resume upload
  const handleResumeUpload = async (file: File) => {
    try {
      setUploadingResume(true)
      setError(null)
      
      console.log('📤 Uploading file:', file.name, file.size, 'bytes')
      
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', 'ml_default')
      formData.append('folder', 'resumes')
      // Format: candidateName_timestamp_randomId
      const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 8)
      const uniqueFilename = `${sanitizedName}_resume_${timestamp}_${randomId}`
      formData.append('public_id', uniqueFilename)

      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
      console.log('☁️ Cloudinary cloud name:', cloudName)
      
      if (!cloudName) {
        throw new Error('Cloudinary configuration missing. Please contact support.')
      }

      const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
      console.log('🌐 Uploading to:', CLOUDINARY_URL)
      
      const response = await axios.post(CLOUDINARY_URL, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          console.log(`📊 Upload progress: ${percentCompleted}%`)
        }
      })
      
      console.log('✅ Upload successful:', response.data.secure_url)
      setResumeUrl(response.data.secure_url)
      return response.data.secure_url
    } catch (err: any) {
      console.error('❌ Error uploading resume:', err)
      console.error('❌ Error response:', err.response?.data)
      throw new Error(err.response?.data?.error?.message || 'Failed to upload resume')
    } finally {
      setUploadingResume(false)
    }
  }

  // Handle verification complete
  const handleVerificationComplete = async (verified: boolean, idUrl?: string) => {
    setIsVerified(verified)
    if (verified && idUrl) {
      setIdDocumentUrl(idUrl)
      setVerificationCompleted(true)
      setShowVerification(false)
      
      // Upload resume AFTER verification with verified name
      let finalResumeUrl = resumeUrl
      if (resumeFile && interview?.requireResume) {
        try {
          console.log('📤 Uploading resume after verification with name:', candidateName)
          finalResumeUrl = await handleResumeUpload(resumeFile)
        } catch (err: any) {
          setError('Failed to upload resume. Please try again.')
          return
        }
      }
      
      // Proceed with invitation acceptance
      submitAcceptance(idUrl, finalResumeUrl)
    }
  }

  // Handle form submission
  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTimeSlot) {
      setError('Please select a time slot')
      return
    }

    if (interview?.requireResume && !resumeFile && !resumeUrl) {
      setError('Please upload your resume')
      return
    }

    if (!candidateName.trim()) {
      setError('Please enter your name')
      return
    }

    // Show identity verification before accepting
    setShowVerification(true)
  }

  // Submit acceptance after verification
  const submitAcceptance = async (idUrl: string, finalResumeUrl?: string) => {

    try {
      setSubmitting(true)
      setError(null)

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const baseUrl = API_URL.replace(/\/api\/?$/, '')
      
      console.log('🔐 Getting auth token...')
      const authToken = await getToken()
      console.log('🔑 Auth token:', authToken ? 'Present' : 'Missing')
      
      if (!authToken) {
        throw new Error('Please sign in to accept the invitation')
      }

      console.log('📤 Accepting invitation...')
      const response = await axios.post(
        `${baseUrl}/api/invitations/${token}/accept`,
        {
          selectedTimeSlot,
          resumeUrl: finalResumeUrl || resumeUrl,
          idDocumentUrl: idUrl,
          candidateName: candidateName.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      )

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.response?.data?.error || 'Failed to accept invitation')
    } finally { 
      setSubmitting(false)
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!invitation) return ''
    const now = new Date().getTime()
    const expiry = new Date(invitation.expiresAt).getTime()
    const diff = expiry - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} day${days > 1 ? 's' : ''} remaining`
    }
    return `${hours}h ${minutes}m remaining`
  }

  // FIRST CHECK: If user is not signed in, show sign-in page immediately
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6 text-center">
            <AlertCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
            <p className="text-gray-600 mb-4">
              Please sign in to view and accept your interview invitation.
            </p>
            {interview && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Position:</strong> {interview.position}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Company:</strong> {company?.name || 'Company'}
                </p>
              </div>
            )}
          </div>
          <SignIn 
            redirectUrl={`/post-auth?returnUrl=${encodeURIComponent(`/invitation/accept/${token}`)}`}
            afterSignInUrl={`/post-auth?returnUrl=${encodeURIComponent(`/invitation/accept/${token}`)}`}
            afterSignUpUrl={`/post-auth?returnUrl=${encodeURIComponent(`/invitation/accept/${token}`)}`}
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg"
              }
            }}
          />
        </div>
      </div>
    )
  }

  // After sign-in, check loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  // Check for errors
  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
          <p className="text-gray-600 mb-4">
            Your interview has been scheduled successfully.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {company?.logo && (
                <img src={company.logo} alt={company.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Interview Invitation</h1>
                <p className="text-sm sm:text-base text-gray-600">{company?.name || 'Company'}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="flex items-center text-xs sm:text-sm text-orange-600">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {getTimeRemaining()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-semibold text-gray-900">{interview?.position}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {interview?.interviewType || 'Video'}
                </p>
              </div>
            </div>
          </div>

          {interview?.description && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{interview.description}</p>
            </div>
          )}
        </div>

        {/* Acceptance Form */}
        <form onSubmit={handleAccept} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Accept Invitation</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Full Name *
            </label>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Time Slot Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Interview Time *
            </label>
            <div className="space-y-3">
              {invitation?.timeSlots.map((slot, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTimeSlot === slot.toString()
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot.toString()}
                    checked={selectedTimeSlot === slot.toString()}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900">{formatDate(slot)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Resume Upload */}
          {interview?.requireResume && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Resume *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {resumeUrl ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm text-gray-700">Resume uploaded successfully</span>
                    </div>
                  </div>
                ) : resumeUrl ? (
                  <div className="flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <span>Resume uploaded successfully</span>
                  </div>
                ) : resumeFile ? (
                  <div className="flex items-center justify-center text-blue-600">
                    <CheckCircle className="w-6 h-6 mr-2" />
                    <div>
                      <span className="font-medium">{resumeFile.name}</span>
                      <p className="text-xs text-gray-500 mt-1">Will be uploaded after verification</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <label className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-700 font-medium">
                        Click to upload
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            console.log('📁 File selected:', file.name, '- Will upload after verification')
                            setResumeFile(file)
                            setError(null)
                          }
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Identity Verification Button */}
          {!verificationCompleted && (
            <button
              type="button"
              onClick={() => setShowVerification(true)}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-4 flex items-center justify-center gap-2"
            >
              Start Identity Verification
            </button>
          )}

          {/* Verification Status */}
          {verificationCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <div>
                <p className="text-green-800 font-semibold">Identity Verification Complete</p>
                <p className="text-green-600 text-sm">Resume uploaded successfully</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !selectedTimeSlot || !verificationCompleted || !resumeUrl}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Accepting...' : 'Accept Invitation & Schedule Interview'}
          </button>

          {/* Requirements Message */}
          {(!selectedTimeSlot || !verificationCompleted || !resumeUrl) && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-amber-800 font-medium mb-2">📋 Required to proceed:</p>
              <div className="space-y-1 text-xs text-amber-700">
                {!verificationCompleted && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 border border-amber-400 rounded mr-2"></span>
                    Click "Start Identity Verification" button above
                  </div>
                )}
                {!resumeUrl && verificationCompleted && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 border border-amber-400 rounded mr-2"></span>
                    Resume will be uploaded after verification
                  </div>
                )}
                {!selectedTimeSlot && (
                  <div className="flex items-center">
                    <span className="w-4 h-4 border border-amber-400 rounded mr-2"></span>
                    Select an available time slot
                  </div>
                )}
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 text-center mt-4">
            By accepting, you agree to attend the interview at the selected time.
          </p>
        </form>

        {/* Identity Verification Modal */}
        {showVerification && invitation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-bold text-gray-900">Identity Verification Required</h2>
                <button
                  onClick={() => setShowVerification(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <IdentityVerification
                invitationId={invitation.id}
                candidateName={candidateName}
                onVerificationComplete={handleVerificationComplete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AcceptInvitation
