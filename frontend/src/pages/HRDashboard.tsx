import { useState, useEffect, useMemo } from 'react'
import { Users, Clock, Eye, Download, Send, Video, CheckCircle, AlertCircle, PlayCircle, Plus, TrendingUp, FileText, Share2, Edit, XCircle, RefreshCw } from 'lucide-react'
import { useHRData } from '../hooks/useHRData'
import { useAuth } from '@clerk/clerk-react'
import { hrAPI } from '../services/api'
import CreateInterviewModal, { InterviewData } from '../components/CreateInterviewModal'
import EditInterviewModal, { EditInterviewData } from '../components/EditInterviewModal'
import InviteCandidatesModal from '../components/InviteCandidatesModal'
import InterviewDetails from '../components/InterviewDetails'
import CandidateDetailsView from '../components/CandidateDetailsView'
import Toast from '../components/Toast'
import { generateCandidatePDF } from '../utils/pdfGenerator'

interface Candidate {
  id: string
  name: string
  email: string
  position: string
  interviewDate: string
  invitedDate?: string
  status: 'completed' | 'in-progress' | 'scheduled' | 'missed' | 'invited' | 'declined' | 'expired'
  score: number
  interviewType: 'voice' | 'video' | 'both'
  experienceLevel: 'fresher' | 'mid' | 'senior'
  confidenceScore?: number
  technicalDepth?: number
  communication?: number
  isSelected?: boolean
  resumeUrl?: string | null
  // Enhanced interview data for comprehensive reports
  resumeData?: {
    skills: string[]
    experience: string[]
    education: string[]
    projects: string[]
    summary: string
    workExperience: Array<{
      company: string
      position: string
      duration: string
      description: string
    }>
    totalExperience: number
  }
  interviewTranscript?: string
  questionsAsked?: Array<{
    question: string
    answer: string
    score?: number
    feedback?: string
  }>
  codingChallenges?: Array<{
    problem: string
    solution: string
    testsPassed: number
    totalTests: number
    executionTime: number
  }>
  aiInsights?: {
    strengths: string[]
    weaknesses: string[]
    recommendation: string
    culturalFit: number
    technicalFit: number
  }
  interviewDuration?: number
  invitationToken?: string
}

interface Interview {
  id: string
  jobTitle: string
  description: string
  skillCategory: string
  experienceLevel: 'fresher' | 'mid' | 'senior'
  interviewType: 'voice' | 'video' | 'both'
  interviewCategory?: 'tech' | 'non-tech'
  hasCodingRound?: boolean
  allowedLanguages?: string[]
  codingInstructions?: string
  technicalAssessmentType?: string
  customQuestions?: string[]
  candidates: number
  createdDate: string
  status: 'active' | 'draft' | 'closed'
  isClosed?: boolean
  closedAt?: string
  didYouGet?: boolean
  totalCandidatesInvited?: number
  totalCandidatesCompleted?: number
  activeInterviews?: number
  completedInterviews?: number
}

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'interviews' | 'candidates'>('overview')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [editingInterview, setEditingInterview] = useState<any>(null)
  const [showInviteToast, setShowInviteToast] = useState(false)
  const [showShareToast, setShowShareToast] = useState(false)
  const [showDownloadToast, setShowDownloadToast] = useState(false)
  const [showCreateToast, setShowCreateToast] = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  
  // Get Clerk auth for token
  const { getToken } = useAuth()
  
  // Use real data from API
  const { 
    candidates, 
    interviews, 
    loading, 
    error, 
    refetch 
  } = useHRData()

  // Manual refresh only - no auto-refresh to avoid disrupting HR work
  const handleManualRefresh = () => {
    refetch()
  }
  
  // Function to fetch comprehensive interview data for PDF generation
  const fetchComprehensiveInterviewData = async (candidate: Candidate): Promise<Candidate> => {
    try {
      console.log('📊 Fetching comprehensive interview data for:', candidate.name);
      
      // If candidate has invitation token, fetch enhanced data
      if (candidate.invitationToken) {
        const response = await fetch('/api/ai-interview/comprehensive-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            invitationToken: candidate.invitationToken,
            candidateId: candidate.id 
          })
        });
        
        if (response.ok) {
          const enhancedData = await response.json();
          
          return {
            ...candidate,
            resumeData: enhancedData.resumeData,
            interviewTranscript: enhancedData.interviewTranscript,
            questionsAsked: enhancedData.questionsAsked,
            codingChallenges: enhancedData.codingChallenges,
            aiInsights: enhancedData.aiInsights,
            interviewDuration: enhancedData.interviewDuration
          };
        }
      }
      
      // Fallback: Try to fetch basic enhanced data
      const fallbackResponse = await fetch('/api/candidates/enhanced-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id })
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        return { ...candidate, ...fallbackData };
      }
      
    } catch (error) {
      console.warn('⚠️ Failed to fetch comprehensive data, using basic candidate info:', error);
    }
    
    return candidate; // Return original candidate if enhancement fails
  }
  
  // Enhanced PDF generation with comprehensive data
  const handleDownloadComprehensiveReport = async (candidate: Candidate) => {
    try {
      console.log('📄 Generating comprehensive interview report for:', candidate.name);
      
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      loadingToast.textContent = 'Generating comprehensive report...';
      document.body.appendChild(loadingToast);
      
      // Fetch comprehensive data
      const enhancedCandidate = await fetchComprehensiveInterviewData(candidate);
      
      // Generate PDF with enhanced data
      generateCandidatePDF(enhancedCandidate);
      
      // Remove loading toast
      document.body.removeChild(loadingToast);
      
      // Show success message
      setShowDownloadToast(true);
      setTimeout(() => setShowDownloadToast(false), 3000);
      
    } catch (error) {
      console.error('❌ Failed to generate comprehensive report:', error);
      
      // Fallback to basic PDF
      generateCandidatePDF(candidate);
    }
  }

  const handleCreateInterview = async (data: InterviewData) => {
    try {
      setIsCreating(true)
      await hrAPI.createInterview(getToken, data)
      // Refresh data after creating interview
      await refetch()
      setShowCreateModal(false)
      
      // Show success toast
      setShowCreateToast(true)
      setTimeout(() => setShowCreateToast(false), 3000)
    } catch (err: any) {
      console.error('Error creating interview:', err)
      
      // Show error toast
      setErrorMessage('Failed to create interview: ' + (err.response?.data?.error || err.message))
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditInterview = async (data: EditInterviewData) => {
    try {
      setIsUpdating(true)
      await hrAPI.updateInterview(getToken, editingInterview.id, data)
      // Refresh data after updating interview
      await refetch()
      setShowEditModal(false)
      setEditingInterview(null)
      
      // Show success toast
      setShowCreateToast(true)
      setTimeout(() => setShowCreateToast(false), 3000)
    } catch (err: any) {
      console.error('Error updating interview:', err)
      
      // Show error toast
      setErrorMessage('Failed to update interview: ' + (err.response?.data?.error || err.message))
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } finally {
      setIsUpdating(false)
    }
  }

  const openEditModal = (interview: any) => {
    setEditingInterview(interview)
    setShowEditModal(true)
  }

  const handleInviteCandidates = async (data: { interviewId: string; candidateEmails: string[]; customMessage?: string; timeSlots?: string[] }) => {
    try {
      setIsInviting(true)
      console.log('🚀 HRDashboard sending to API:', data)
      const response = await hrAPI.inviteCandidates(getToken, {
        interviewId: data.interviewId,
        candidateEmails: data.candidateEmails,
        customMessage: data.customMessage || '',
        timeSlots: data.timeSlots || []
      })
      setShowInviteModal(false)
      
      // Show success message with toast notification
      setShowInviteToast(true)
      setTimeout(() => setShowInviteToast(false), 3000)
      
      // Store links in console for reference
      const links = response.data.data.links
      console.log('Invitation links:', links)
      
      // Refresh data to update candidate counts
      refetch()
    } catch (err: any) {
      console.error('Error inviting candidates:', err)
      
      // Show error toast
      setErrorMessage('Failed to send invitations: ' + (err.response?.data?.error || err.message))
      setShowErrorToast(true)
      setTimeout(() => setShowErrorToast(false), 5000)
    } finally {
      setIsInviting(false)
    }
  }

  // State to track selected interview for invite modal
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null)
  
  // State to track selected interview for details view
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)

  useEffect(() => {
    const handleOpenCreateModal = () => {
      setShowCreateModal(true)
    }

    const handleOpenInviteModal = (event: Event) => {
      console.log('Invite Candidates button clicked')
      const customEvent = event as CustomEvent
      if (customEvent.detail && customEvent.detail.interviewId) {
        setSelectedInterviewId(customEvent.detail.interviewId)
      } else {
        setSelectedInterviewId(null)
      }
      setShowInviteModal(true)
    }
    
    const handleOpenInterviewDetails = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail && customEvent.detail.interview) {
        setActiveTab('interviews')
        setSelectedInterview(customEvent.detail.interview)
      }
    }

    window.addEventListener('openCreateInterviewModal', handleOpenCreateModal)
    window.addEventListener('openInviteCandidatesModal', handleOpenInviteModal as EventListener)
    window.addEventListener('openInterviewDetails', handleOpenInterviewDetails as EventListener)
    
    return () => {
      window.removeEventListener('openCreateInterviewModal', handleOpenCreateModal)
      window.removeEventListener('openInviteCandidatesModal', handleOpenInviteModal as EventListener)
      window.removeEventListener('openInterviewDetails', handleOpenInterviewDetails as EventListener)
    }
  }, [])

  // Update selected interview when data changes (after invite/refetch)
  useEffect(() => {
    if (selectedInterview) {
      const updatedInterview = interviews.find(i => i.id === selectedInterview.id)
      if (updatedInterview) {
        setSelectedInterview({
          id: updatedInterview.id,
          jobTitle: updatedInterview.position,
          description: updatedInterview.description || `Interview for ${updatedInterview.position}`,
          skillCategory: updatedInterview.skillCategory || 'General',
          experienceLevel: updatedInterview.experienceLevel || 'mid',
          interviewType: updatedInterview.interviewType || 'video',
          interviewCategory: updatedInterview.interviewCategory,
          hasCodingRound: updatedInterview.hasCodingRound,
          allowedLanguages: updatedInterview.allowedLanguages,
          codingInstructions: updatedInterview.codingInstructions,
          technicalAssessmentType: updatedInterview.technicalAssessmentType,
          customQuestions: updatedInterview.customQuestions,
          candidates: updatedInterview.invitedCandidates?.length || 0,
          createdDate: updatedInterview.createdDate,
          status: updatedInterview.isClosed ? 'closed' : ((updatedInterview.invitedCandidates?.length || 0) > 0 ? 'active' : 'draft'),
          isClosed: updatedInterview.isClosed,
          closedAt: updatedInterview.closedAt,
          didYouGet: updatedInterview.didYouGet,
          totalCandidatesInvited: updatedInterview.totalCandidatesInvited,
          totalCandidatesCompleted: updatedInterview.totalCandidatesCompleted,
          activeInterviews: updatedInterview.totalCandidatesInvited || 0,
          completedInterviews: updatedInterview.totalCandidatesCompleted || 0
        })
      }
    }
  }, [interviews, selectedInterview?.id])

  // Transform API data to match component interface
  const transformedInterviews: Interview[] = interviews.map(interview => {
    const candidateCount = interview.invitedCandidates?.length || 0;
    console.log(`📊 Interview "${interview.position}": ${candidateCount} candidates (from invitedCandidates array)`);
    console.log(`   Raw invitedCandidates:`, interview.invitedCandidates);
    
    return {
      id: interview.id,
      jobTitle: interview.position,
      description: interview.description || `Interview for ${interview.position}`,
      skillCategory: interview.skillCategory,
      experienceLevel: interview.experienceLevel,
      interviewType: interview.interviewType,
      interviewCategory: interview.interviewCategory,
      hasCodingRound: interview.hasCodingRound,
      allowedLanguages: interview.allowedLanguages,
      codingInstructions: interview.codingInstructions,
      technicalAssessmentType: interview.technicalAssessmentType,
      customQuestions: interview.customQuestions,
      candidates: candidateCount,
      createdDate: interview.createdDate,
      status: interview.isClosed ? 'closed' : ((interview.invitedCandidates?.length || 0) > 0 ? 'active' : 'draft'),
      isClosed: interview.isClosed,
      closedAt: interview.closedAt,
      didYouGet: interview.didYouGet,
      totalCandidatesInvited: interview.totalCandidatesInvited,
      totalCandidatesCompleted: interview.totalCandidatesCompleted,
      activeInterviews: interview.totalCandidatesInvited || 0,
      completedInterviews: interview.totalCandidatesCompleted || 0
    };
  }).sort((a, b) => {
    // Sort: Active interviews first, then closed interviews
    if (a.isClosed === b.isClosed) {
      // If both have same status, sort by creation date (newest first)
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    }
    // Active (not closed) interviews come first
    return a.isClosed ? 1 : -1
  })

  // Transform API candidates data - flatten invitedCandidates arrays
  const transformedCandidates: Candidate[] = candidates.flatMap(interview => {
    // If interview has invitedCandidates array, create a candidate entry for each
    if (interview.invitedCandidates && interview.invitedCandidates.length > 0) {
      return interview.invitedCandidates.map((invitedCandidate: any) => {
        // Use the candidate's individual status from the API
        const status = invitedCandidate.status || 'invited';
        const invitationStatus = invitedCandidate.invitationStatus || 'pending';
        
        // Determine display status text
        let displayStatus = status;
        if (invitationStatus === 'pending') {
          displayStatus = 'invited'; // Invitation sent, not accepted yet
        } else if (invitationStatus === 'accepted' && status === 'scheduled') {
          displayStatus = 'scheduled'; // Accepted and scheduled
        }
        
        return {
          id: `${interview.id}-${invitedCandidate.email}`,
          name: invitedCandidate.registered 
            ? `${invitedCandidate.firstName} ${invitedCandidate.lastName}`.trim()
            : invitedCandidate.email.split('@')[0],
          email: invitedCandidate.email,
          position: interview.position,
          invitedDate: interview.createdAt 
            ? new Date(interview.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Not available',
          interviewDate: invitedCandidate.selectedTimeSlot
            ? new Date(invitedCandidate.selectedTimeSlot).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : status === 'scheduled' 
            ? 'Scheduled'
            : interview.startTime 
            ? new Date(interview.startTime).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Not scheduled',
          status: displayStatus,
          score: invitedCandidate.score || 0,
          interviewType: interview.interviewType || 'video',
          experienceLevel: interview.experienceLevel || 'mid',
          confidenceScore: interview.evaluation?.confidence,
          technicalDepth: interview.evaluation?.technicalKnowledge,
          communication: interview.evaluation?.communicationSkills,
          isSelected: invitedCandidate.isSelected || false,
          resumeUrl: invitedCandidate.resumeUrl || null
        };
      })
    }
    
    // Fallback for old data structure (single candidate)
    if (interview.candidate) {
      const status = interview.status === 'completed' ? 'completed' : 
                    interview.status === 'in-progress' ? 'in-progress' : 'scheduled';
      const candidateEmail = interview.candidate.email;
      const isSelected = (interview as any).selectedCandidates?.includes(candidateEmail) || false;
      
      return [{
        id: interview.id,
        name: `${interview.candidate.firstName} ${interview.candidate.lastName}`,
        email: candidateEmail,
        position: interview.position,
        invitedDate: interview.createdAt 
          ? new Date(interview.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Not available',
        interviewDate: status === 'scheduled' 
          ? 'Not started yet'
          : interview.startTime 
          ? new Date(interview.startTime).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'Not available',
        status,
        score: interview.evaluation?.overallScore || 0,
        interviewType: interview.interviewType || 'video',
        experienceLevel: interview.experienceLevel || 'mid',
        confidenceScore: interview.evaluation?.confidence,
        technicalDepth: interview.evaluation?.technicalKnowledge,
        communication: interview.evaluation?.communicationSkills,
        isSelected: isSelected
      }]
    }
    
    return []
  })
  
  // Use useMemo to prevent re-sorting on every render
  const sortedCandidates = useMemo(() => {
    console.log('SORTING CANDIDATES...');
    console.log('BEFORE SORT:', transformedCandidates.map(c => ({ name: c.name, status: c.status })));
    
    // Create a NEW sorted array (don't mutate the original)
    const sorted = [...transformedCandidates].sort((a, b) => {
      // Sort by status: completed first, then in-progress, then scheduled
      if (a.status === 'completed' && b.status !== 'completed') return -1;
      if (a.status !== 'completed' && b.status === 'completed') return 1;
      if (a.status === 'in-progress' && b.status === 'scheduled') return -1;
      if (a.status === 'scheduled' && b.status === 'in-progress') return 1;
      return 0;
    });
    
    console.log('AFTER SORT:', sorted.map(c => ({ name: c.name, status: c.status })));
    return sorted;
  }, [transformedCandidates]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200'
      case 'in-progress':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'scheduled':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'missed':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'invited':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'declined':
        return 'bg-rose-100 text-rose-700 border-rose-200'
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3" />
      case 'in-progress':
        return <PlayCircle className="h-3 w-3" />
      case 'scheduled':
        return <CheckCircle className="h-3 w-3" />
      case 'missed':
        return <XCircle className="h-3 w-3" />
      case 'invited':
        return <Clock className="h-3 w-3" />
      case 'declined':
        return <XCircle className="h-3 w-3" />
      case 'expired':
        return <AlertCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading HR Dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state (only for non-auth errors)
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={refetch}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Tabs */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
  <div className="flex items-center justify-between mb-4">
    <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-lg p-2 inline-flex space-x-2">
    {[
      { id: 'overview', label: 'Overview', icon: TrendingUp },
      { id: 'interviews', label: 'Interviews', icon: FileText },
      { id: 'candidates', label: 'Candidates', icon: Users }
    ].map((tab) => (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id as any)}
        className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold transition-all ${
          activeTab === tab.id
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <tab.icon className="h-5 w-5" />
        <span>{tab.label}</span>
      </button>
    ))}
  </div>
  
  {/* Refresh Button */}
  <button
    onClick={handleManualRefresh}
    disabled={loading}
    className="flex items-center space-x-2 bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-lg px-4 py-2.5 text-gray-700 hover:bg-opacity-100 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    title="Refresh data"
  >
    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
    <span className="font-semibold">Refresh</span>
  </button>
  </div>
</div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
        <div className="px-4 sm:px-0">
          {/* Stats Cards */}
          {activeTab === 'overview' && (
            <>
              {/* Empty State */}
              {transformedCandidates.length === 0 && transformedInterviews.length === 0 && (
                <div className="text-center py-12 mb-8">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Your HR Dashboard</h3>
                  <p className="text-gray-600 mb-6">You haven't created any interviews yet. Start by creating your first interview to begin the AI-powered hiring process!</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Create Your First Interview</span>
                    </button>
                    <button 
                      onClick={() => {
                        console.log('Invite Candidates button clicked')
                        console.log('Available interviews:', transformedInterviews)
                        setShowInviteModal(true)
                      }}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Send className="h-5 w-5" />
                      <span>Invite Candidates</span>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[
                  { label: 'Total Candidates', value: transformedCandidates.length, icon: Users, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Completed', value: transformedCandidates.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
                  { label: 'In Progress', value: transformedCandidates.filter(c => c.status === 'in-progress').length, icon: PlayCircle, color: 'from-amber-500 to-orange-500' },
                  { label: 'Scheduled', value: transformedCandidates.filter(c => c.status === 'scheduled').length, icon: Clock, color: 'from-purple-500 to-pink-500' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 overflow-hidden group">
                    <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform`}>
                          <stat.icon className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Interviews */}
              <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden mb-8">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Active Interviews</h3>
                      <p className="text-indigo-100 text-sm mt-1">Manage your ongoing interview processes</p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {transformedInterviews.filter(interview => !interview.isClosed).length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📋</div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Active Interviews</h4>
                      <p className="text-gray-600 mb-4">Create a new interview to get started.</p>
                      <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Create Interview
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transformedInterviews.filter(interview => !interview.isClosed).map((interview) => (
                        <div key={interview.id} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{interview.jobTitle}</h4>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${interview.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                                {interview.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{interview.candidates} candidates</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Video className="h-4 w-4" />
                                <span className="capitalize">{interview.interviewType}</span>
                              </span>
                              <span>Created: {new Date(interview.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button 
                              className="p-3 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all group-hover:scale-110"
                              onClick={() => {
                                setActiveTab('interviews');
                                // Set the selected interview for details view
                                setSelectedInterview(interview);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-3 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all group-hover:scale-110"
                              onClick={() => {
                                // Download report functionality
                                alert('Download report feature coming soon!');
                              }}
                              title="Download Report"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-3 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-all group-hover:scale-110"
                              onClick={() => openEditModal(interview)}
                              title="Edit Interview"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-3 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all group-hover:scale-110"
                              onClick={() => {
                                setSelectedInterviewId(interview.id);
                                setShowInviteModal(true);
                              }}
                              title="Invite Candidates"
                            >
                              <Send className="h-5 w-5" />
                            </button>
                            <button 
                              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all group-hover:scale-110"
                              onClick={() => {
                                const interviewLink = `${window.location.origin}/interview/${interview.id}`;
                                navigator.clipboard.writeText(interviewLink);
                                setShowShareToast(true);
                                setTimeout(() => setShowShareToast(false), 3000);
                              }}
                              title="Share Interview Link"
                            >
                              <Share2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Candidates Table */}
          {(activeTab === 'candidates' || activeTab === 'overview') && (
            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Candidate Interviews</h3>
                <p className="text-indigo-100 text-sm mt-1">Track and review candidate performance</p>
              </div>
              <div className="overflow-x-auto">
                {transformedCandidates.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">👥</div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Candidates Yet</h4>
                    <p className="text-gray-600 mb-4">Create interviews and invite candidates to see them here.</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Create Interview
                    </button>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Candidate</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">AI Analysis</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sortedCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-indigo-50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-lg font-bold text-white">
                                  {candidate.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{candidate.name}</div>
                              <div className="text-sm text-gray-500">{candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{candidate.position}</div>
                          <div className="text-xs text-gray-500 capitalize">{candidate.experienceLevel} Level</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{candidate.interviewDate}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg border ${getStatusColor(candidate.status)}`}>
                              {getStatusIcon(candidate.status)}
                              <span className="capitalize">{candidate.status.replace('-', ' ')}</span>
                            </span>
                            {candidate.isSelected && (
                              <span className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 text-green-700 border border-green-300">
                                <CheckCircle className="h-3 w-3" />
                                <span>Selected</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {candidate.status === 'completed' ? (
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className={`text-2xl font-bold ${getScoreColor(candidate.score)}`}>
                                  {candidate.score}%
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {candidate.status === 'completed' ? (
                            <div className="space-y-2">
                              {/* Dynamic AI Insights */}
                              {candidate.aiInsights?.recommendation ? (
                                <div className="bg-gray-50 p-2 rounded text-xs">
                                  <div className="font-semibold text-gray-700 mb-1">AI Assessment:</div>
                                  <div className="text-gray-600 line-clamp-2">
                                    {candidate.aiInsights.recommendation.substring(0, 120)}...
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Overall Score</span>
                                    <span className="font-semibold text-gray-700">{candidate.score || 0}%</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Technical</span>
                                    <span className="font-semibold text-gray-700">{candidate.technicalDepth || 0}%</span>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-500">Communication</span>
                                    <span className="font-semibold text-gray-700">{candidate.communication || 0}%</span>
                                  </div>
                                </div>
                              )}
                              
                              {/* Key Strengths */}
                              {candidate.aiInsights?.strengths && candidate.aiInsights.strengths.length > 0 && (
                                <div className="bg-green-50 p-2 rounded">
                                  <div className="text-xs font-semibold text-green-700 mb-1">Key Strengths:</div>
                                  <div className="text-xs text-green-600">
                                    • {candidate.aiInsights.strengths[0].substring(0, 80)}...
                                  </div>
                                </div>
                              )}
                              
                              {/* Areas to Improve */}
                              {candidate.aiInsights?.weaknesses && candidate.aiInsights.weaknesses.length > 0 && (
                                <div className="bg-orange-50 p-2 rounded">
                                  <div className="text-xs font-semibold text-orange-700 mb-1">Areas to Improve:</div>
                                  <div className="text-xs text-orange-600">
                                    • {candidate.aiInsights.weaknesses[0].substring(0, 80)}...
                                  </div>
                                </div>
                              )}
                              
                              {/* Interview Stats */}
                              {candidate.questionsAsked && candidate.questionsAsked.length > 0 && (
                                <div className="flex items-center justify-between text-xs bg-blue-50 p-1 rounded">
                                  <span className="text-blue-600">{candidate.questionsAsked.length} Questions</span>
                                  <span className="text-blue-600">{candidate.interviewDuration || 'N/A'} min</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all hover:scale-110"
                              onClick={() => setSelectedCandidate(candidate)}
                              title="View Candidate Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {candidate.resumeUrl && (
                              <a 
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all hover:scale-110"
                                title="View Resume"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
                            {candidate.status === 'completed' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadComprehensiveReport(candidate);
                                }}
                                className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all hover:scale-110"
                                title="Download Comprehensive Interview Report"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            )}
                            {candidate.status !== 'completed' && (
                              <button 
                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find the interview associated with this candidate
                                  const interview = transformedInterviews.find(i => i.jobTitle === candidate.position);
                                  if (interview) {
                                    const interviewLink = `${window.location.origin}/interview/${interview.id}`;
                                    navigator.clipboard.writeText(interviewLink);
                                    setShowShareToast(true);
                                    setTimeout(() => setShowShareToast(false), 3000);
                                  }
                                }}
                                title="Copy Interview Link"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Interviews Tab */}
          {activeTab === 'interviews' && (
            <div>
              {transformedInterviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📋</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No Interviews Yet</h4>
                  <p className="text-gray-600 mb-4">Create your first interview to start the AI-powered hiring process.</p>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Interview
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {selectedInterview ? (
                    // Show only the selected interview
                    <div>
                      <div className="flex justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">Interview Details</h3>
                        <button 
                          onClick={() => setSelectedInterview(null)}
                          className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all text-sm"
                        >
                          Back to All Interviews
                        </button>
                      </div>
                      <InterviewDetails 
                        key={selectedInterview.id} 
                        interview={selectedInterview}
                        invitedCandidates={candidates.find(c => c.id === selectedInterview.id)?.invitedCandidates}
                        onCandidateClick={(candidateData) => {
                          // Find the full candidate data from sortedCandidates to get evaluation details
                          const fullCandidate = sortedCandidates.find(c => 
                            c.email === candidateData.email && c.position === candidateData.position
                          );
                          
                          if (fullCandidate) {
                            setSelectedCandidate(fullCandidate);
                          } else {
                            setSelectedCandidate(candidateData);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    // Show all interviews
                    transformedInterviews.map((interview) => (
                      <div key={interview.id} className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900">{interview.jobTitle}</h3>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                interview.isClosed 
                                  ? 'bg-gray-200 text-gray-700' 
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {interview.isClosed ? 'Closed' : 'Active'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{interview.candidates} candidates</span>
                              </span>
                              <span>Created: {new Date(interview.createdDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => setSelectedInterview(interview)}
                              className="px-4 py-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all flex items-center"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </button>
                            {!interview.isClosed && (
                              <button 
                                onClick={() => openEditModal(interview)}
                                className="px-4 py-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-all flex items-center"
                                title="Edit Interview"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </button>
                            )}
                            <button 
                              onClick={() => {
                                // Map interview status to PDF status
                                const mapStatus = (status: string): 'completed' | 'in-progress' | 'scheduled' => {
                                  if (status === 'closed') return 'completed';
                                  if (status === 'active') return 'in-progress';
                                  return 'scheduled';
                                };

                                // Download interview summary as PDF
                                // Get actual statistics from completed candidates for this interview
                                const interviewCandidates = transformedCandidates.filter(c => 
                                  c.position === interview.jobTitle && c.status === 'completed'
                                );
                                
                                const avgScore = interviewCandidates.length > 0 ? 
                                  Math.round(interviewCandidates.reduce((sum, c) => sum + (c.score || 0), 0) / interviewCandidates.length) : 0;
                                
                                const avgConfidence = interviewCandidates.length > 0 ? 
                                  Math.round(interviewCandidates.reduce((sum, c) => sum + (c.confidenceScore || 0), 0) / interviewCandidates.length) : 0;
                                
                                const avgTechnical = interviewCandidates.length > 0 ? 
                                  Math.round(interviewCandidates.reduce((sum, c) => sum + (c.technicalDepth || 0), 0) / interviewCandidates.length) : 0;
                                
                                const avgCommunication = interviewCandidates.length > 0 ? 
                                  Math.round(interviewCandidates.reduce((sum, c) => sum + (c.communication || 0), 0) / interviewCandidates.length) : 0;
                                
                                const totalQuestions = interviewCandidates.reduce((sum, c) => sum + (c.questionsAsked?.length || 0), 0);
                                const avgInterviewTime = interviewCandidates.length > 0 ? 
                                  Math.round(interviewCandidates.reduce((sum, c) => sum + (c.interviewDuration || 30), 0) / interviewCandidates.length) : 30;
                                
                                const interviewData = {
                                  name: `${interview.jobTitle} - Interview Summary`,
                                  email: `${interviewCandidates.length} candidates completed`,
                                  position: interview.jobTitle,
                                  interviewDate: new Date(interview.createdDate).toLocaleDateString(),
                                  invitedDate: new Date(interview.createdDate).toLocaleDateString(),
                                  status: mapStatus(interview.status),
                                  score: avgScore,
                                  interviewType: interview.interviewType,
                                  experienceLevel: interview.experienceLevel,
                                  confidenceScore: avgConfidence,
                                  technicalDepth: avgTechnical,
                                  communication: avgCommunication,
                                  // Add dynamic AI insights for the summary
                                  aiInsights: {
                                    strengths: [
                                      `${interviewCandidates.length} candidates completed interviews`,
                                      avgScore >= 70 ? 'Strong overall candidate performance' : 'Room for improvement in candidate selection',
                                      totalQuestions > 0 ? `Total of ${totalQuestions} questions asked across all interviews` : 'Interview process documented'
                                    ].filter(Boolean),
                                    weaknesses: [
                                      interviewCandidates.length < 3 ? 'Small sample size - consider more interviews' : null,
                                      avgScore < 50 ? 'Low average performance - review interview criteria' : null,
                                      avgTechnical < 60 ? 'Technical assessment needs improvement' : null
                                    ].filter(Boolean),
                                    recommendation: `Based on ${interviewCandidates.length} completed interviews for ${interview.jobTitle}, the average score is ${avgScore}%. ${
                                      avgScore >= 75 ? 'Excellent candidate quality - recommend continuing with current process.' :
                                      avgScore >= 60 ? 'Good candidate pool - minor adjustments may improve results.' :
                                      'Consider revising interview criteria or providing additional candidate preparation.'
                                    }`,
                                    culturalFit: avgScore,
                                    technicalFit: avgTechnical
                                  },
                                  questionsAsked: [{
                                    question: 'Interview Summary Statistics',
                                    answer: `Total interviews: ${interviewCandidates.length}, Average score: ${avgScore}%, Average duration: ${avgInterviewTime} minutes`,
                                    score: avgScore,
                                    feedback: `Performance analysis for ${interview.jobTitle} interview process.`
                                  }],
                                  interviewDuration: avgInterviewTime,
                                  resumeData: {
                                    summary: `Interview Summary for ${interview.jobTitle} - ${interviewCandidates.length} candidates evaluated`,
                                    skills: [`Interview Management`, `Candidate Assessment`, interview.skillCategory],
                                    experience: [`${interviewCandidates.length} candidate interviews`],
                                    education: [],
                                    projects: [`${interview.jobTitle} Hiring Process`],
                                    workExperience: [{
                                      company: 'Hire Mind',
                                      position: 'Interview Analysis',
                                      duration: `${Math.round((Date.now() - new Date(interview.createdDate).getTime()) / (1000 * 60 * 60 * 24))} days`,
                                      description: `Conducted ${interviewCandidates.length} interviews with ${avgScore}% average success rate`
                                    }],
                                    totalExperience: interviewCandidates.length
                                  }
                                };
                                handleDownloadComprehensiveReport(interviewData);
                              }}
                              className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all flex items-center"
                              title="Download Interview Summary"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </button>
                            {!interview.isClosed && (
                              <>
                                <button 
                                  onClick={() => {
                                    setSelectedInterviewId(interview.id);
                                    setShowInviteModal(true);
                                  }}
                                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all flex items-center"
                                  title="Invite Candidates"
                                >
                                  <Send className="h-4 w-4 mr-2" />
                                  Invite
                                </button>
                                <button 
                                  onClick={() => {
                                    const interviewLink = `${window.location.origin}/interview/${interview.id}`;
                                    navigator.clipboard.writeText(interviewLink);
                                    setShowShareToast(true);
                                    setTimeout(() => setShowShareToast(false), 3000);
                                  }}
                                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all flex items-center"
                                  title="Share Interview Link"
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Interview Modal */}
      <CreateInterviewModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateInterview}
        loading={isCreating}
      />

      {/* Edit Interview Modal */}
      <EditInterviewModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingInterview(null)
        }}
        onSubmit={handleEditInterview}
        loading={isUpdating}
        initialData={editingInterview ? {
          jobTitle: editingInterview.jobTitle || editingInterview.position,
          jobDescription: editingInterview.description || editingInterview.jobDescription || '',
          experienceLevel: editingInterview.experienceLevel || 'mid',
          interviewType: editingInterview.interviewType || 'both',
          category: editingInterview.category || editingInterview.interviewCategory || 'tech',
          hasCodingRound: editingInterview.hasCodingRound || false,
          codingLanguages: editingInterview.allowedLanguages || editingInterview.codingLanguages || []
        } : undefined}
      />

      {/* Invite Candidates Modal */}
      <InviteCandidatesModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false)
          setSelectedInterviewId(null)
        }}
        onSubmit={handleInviteCandidates}
        loading={isInviting}
        interviews={transformedInterviews.filter(interview => !interview.isClosed)}
        defaultInterviewId={selectedInterviewId}
      />

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
      
      {/* Toast Notifications */}
      <Toast 
        message="Interview created successfully! You can now invite candidates." 
        visible={showCreateToast} 
        type="success" 
      />
      <Toast 
        message="Invitations sent successfully!" 
        visible={showInviteToast} 
        type="success" 
      />
      <Toast 
        message="Interview link copied to clipboard!" 
        visible={showShareToast} 
        type="success" 
      />
      <Toast 
        message={errorMessage} 
        visible={showErrorToast} 
        type="error" 
      />
      <Toast 
        message="Comprehensive interview report downloaded successfully!" 
        visible={showDownloadToast} 
        type="success" 
      />

      {/* Candidate Details View */}
      {selectedCandidate && (
        <CandidateDetailsView
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  )
}

export default HRDashboard