import React, { useState } from 'react';
import { Download, Send, CheckCircle, XCircle, Share2, X, Code, Trash2, Eye } from 'lucide-react';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';
import CloseInterviewModal from './CloseInterviewModal';
import { useAuth } from '@clerk/clerk-react';
import { hrAPI } from '../services/api';

interface InterviewDetailsProps {
  interview: {
    id: string;
    jobTitle: string;
    description: string;
    skillCategory: string;
    experienceLevel: 'fresher' | 'mid' | 'senior';
    interviewType: 'voice' | 'video' | 'both';
    interviewCategory?: 'tech' | 'non-tech';
    hasCodingRound?: boolean;
    allowedLanguages?: string[];
    codingInstructions?: string;
    technicalAssessmentType?: string;
    customQuestions?: string[];
    status: 'active' | 'draft' | 'closed';
    isClosed?: boolean;
    closedAt?: string;
    createdDate: string;
    didYouGet?: boolean;
    totalCandidatesInvited?: number;
    totalCandidatesCompleted?: number;
    activeInterviews?: number;
    completedInterviews?: number;
  };
  invitedCandidates?: Array<{
    email: string;
    firstName: string;
    lastName: string;
    registered: boolean;
    status?: 'completed' | 'in-progress' | 'scheduled';
    score?: number;
    isSelected?: boolean;
  }>;
  onCandidateClick?: (candidate: any) => void;
}

// Custom event to open invite modal with specific interview
const openInviteModalWithInterview = (interviewId: string) => {
  const event = new CustomEvent('openInviteCandidatesModal', { 
    detail: { interviewId } 
  });
  window.dispatchEvent(event);
};

const InterviewDetails: React.FC<InterviewDetailsProps> = ({ interview, invitedCandidates, onCandidateClick }) => {
  const { getToken } = useAuth();
  const [showShareToast, setShowShareToast] = useState(false);
  const [showCloseToast, setShowCloseToast] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDidYouGetModal, setShowDidYouGetModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [didYouGetValue, setDidYouGetValue] = useState<boolean | undefined>(interview.didYouGet);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCloseInterview = async (selectedCandidates: string[]) => {
    try {
      setIsProcessing(true);
      await hrAPI.closeInterview(getToken, interview.id, undefined, selectedCandidates);
      setShowCloseModal(false);
      setShowCloseToast(true);
      setTimeout(() => setShowCloseToast(false), 3000);
      // Refresh page to update data
      window.location.reload();
    } catch (error) {
      console.error('Error closing interview:', error);
      setErrorMessage('Failed to close interview');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteInterview = async () => {
    setShowDeleteConfirm(false);
    
    try {
      setIsProcessing(true);
      await hrAPI.deleteInterview(getToken, interview.id);
      setShowDeleteToast(true);
      setTimeout(() => setShowDeleteToast(false), 3000);
      // Refresh page to update data
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error('Error deleting interview:', error);
      setErrorMessage('Failed to delete interview: ' + (error.response?.data?.error || error.message));
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDidYouGet = async (value: boolean) => {
    try {
      setIsProcessing(true);
      await hrAPI.updateDidYouGet(getToken, interview.id, value);
      setDidYouGetValue(value);
      setShowDidYouGetModal(false);
      // Refresh page to update data
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error updating did you get status:', error);
      setErrorMessage('Failed to update status: ' + (error.response?.data?.error || error.message));
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 5000);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">{interview.jobTitle}</h3>
                {interview.interviewCategory && (
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    interview.interviewCategory === 'tech' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-purple-500 text-white'
                  }`}>
                    {interview.interviewCategory === 'tech' ? '💻 Tech' : '🎯 Non-Tech'}
                  </span>
                )}
              </div>
              <p className="text-indigo-100 text-sm mt-1">{interview.skillCategory} - {interview.experienceLevel}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              interview.isClosed 
                ? 'bg-gray-200 text-gray-700' 
                : interview.status === 'active' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-yellow-100 text-yellow-700'
            }`}>
              {interview.isClosed ? 'Closed' : interview.status}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Description</h4>
          <p className="text-gray-600">{interview.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Interview Type</h5>
            <p className="text-gray-900 capitalize">{interview.interviewType}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Created On</h5>
            <p className="text-gray-900">{new Date(interview.createdDate).toLocaleDateString()}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Candidates Invited</h5>
            <p className="text-gray-900">{invitedCandidates?.length || 0}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Completed</h5>
            <p className="text-gray-900">{interview.totalCandidatesCompleted || 0} / {invitedCandidates?.length || 0}</p>
          </div>
        </div>

        {/* Invited Candidates List */}
        {invitedCandidates && invitedCandidates.length > 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg mb-6 border-2 border-indigo-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Invited Candidates ({invitedCandidates.length})</h4>
            <div className="space-y-3">
              {invitedCandidates
                .sort((a, b) => {
                  // Sort: completed first, then in-progress, then scheduled
                  const statusOrder: Record<string, number> = { 'completed': 0, 'in-progress': 1, 'scheduled': 2 };
                  return (statusOrder[a.status || 'scheduled'] || 3) - (statusOrder[b.status || 'scheduled'] || 3);
                })
                .map((candidate, index) => (
                <div 
                  key={index} 
                  className="bg-white p-4 rounded-lg flex items-center justify-between hover:shadow-md transition-all cursor-pointer hover:bg-indigo-50"
                  onClick={() => {
                    if (onCandidateClick) {
                      // Transform candidate data to match CandidateDetailsView props
                      const candidateData = {
                        id: `${interview.id}-${candidate.email}`,
                        name: candidate.registered ? `${candidate.firstName} ${candidate.lastName}` : candidate.email.split('@')[0],
                        email: candidate.email,
                        position: interview.jobTitle,
                        interviewDate: candidate.status === 'scheduled' ? 'Not started yet' : interview.createdDate,
                        invitedDate: interview.createdDate,
                        status: candidate.status,
                        score: candidate.score || 0,
                        interviewType: interview.interviewType,
                        experienceLevel: interview.experienceLevel,
                        confidenceScore: candidate.score || 0,
                        technicalDepth: candidate.score || 0,
                        communication: candidate.score || 0,
                        isSelected: candidate.isSelected || false
                      };
                      onCandidateClick(candidateData);
                    }
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {candidate.registered ? `${candidate.firstName[0]}${candidate.lastName[0]}` : candidate.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {candidate.registered ? `${candidate.firstName} ${candidate.lastName}` : candidate.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-gray-500">{candidate.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {candidate.status === 'completed' && candidate.score !== undefined && (
                      <div className="text-right mr-3">
                        <p className="text-sm text-gray-500">Score</p>
                        <p className={`text-lg font-bold ${
                          candidate.score >= 80 ? 'text-emerald-600' :
                          candidate.score >= 60 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {candidate.score}%
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        candidate.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        candidate.status === 'in-progress' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {candidate.status === 'completed' ? '✓ Completed' :
                         candidate.status === 'in-progress' ? '⏳ In Progress' :
                         candidate.registered ? '📧 Invited' : '⏳ Not Registered'}
                      </span>
                      {candidate.isSelected && (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-300">
                          <CheckCircle className="h-3 w-3" />
                          <span>Selected</span>
                        </span>
                      )}
                    </div>
                    <Eye className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tech Interview Specific Details */}
        {interview.interviewCategory === 'tech' && interview.hasCodingRound && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border-2 border-blue-200">
            <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
              <Code className="h-5 w-5 mr-2" />
              Coding Round Details
            </h4>
            <div className="space-y-3">
              {interview.allowedLanguages && interview.allowedLanguages.length > 0 && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Allowed Languages:</h5>
                  <div className="flex flex-wrap gap-2">
                    {interview.allowedLanguages.map(lang => (
                      <span key={lang} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm font-medium border border-blue-300">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {interview.technicalAssessmentType && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Assessment Type:</h5>
                  <p className="text-gray-900">{interview.technicalAssessmentType}</p>
                </div>
              )}
              {interview.codingInstructions && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-1">Instructions:</h5>
                  <p className="text-gray-600 text-sm">{interview.codingInstructions}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Custom Questions */}
        {interview.customQuestions && interview.customQuestions.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Custom Questions</h4>
            <ol className="list-decimal list-inside space-y-2">
              {interview.customQuestions.map((question, index) => (
                <li key={index} className="text-gray-700">{question}</li>
              ))}
            </ol>
          </div>
        )}
        
        {/* Did You Get Status - Only for Closed Interviews */}
        {interview.isClosed && (
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-5 rounded-lg mb-6 border-2 border-emerald-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Position Status</h4>
            {didYouGetValue !== undefined ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {didYouGetValue ? (
                    <div className="flex items-center text-emerald-600">
                      <CheckCircle className="h-6 w-6 mr-2" />
                      <span className="font-medium">Yes, position filled successfully!</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600">
                      <XCircle className="h-6 w-6 mr-2" />
                      <span className="font-medium">No, still looking for candidates</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowDidYouGetModal(true)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-sm font-medium border border-gray-300"
                >
                  Update Status
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Did you fill this position?</span>
                <button
                  onClick={() => setShowDidYouGetModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium"
                >
                  Set Status
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {!interview.isClosed && (
              <>
                <button 
                  onClick={() => setShowCloseModal(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-all flex items-center disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Interview
                </button>
              </>
            )}
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all flex items-center disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button className="px-3 sm:px-4 py-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all flex items-center text-sm">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </button>
            {!interview.isClosed && (
              <>
                <button 
                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-all flex items-center"
                  onClick={() => openInviteModalWithInterview(interview.id)}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Invite Candidates
                </button>
                <button 
                  className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all flex items-center"
                  onClick={() => {
                    const interviewLink = `${window.location.origin}/interview/${interview.id}`;
                    navigator.clipboard.writeText(interviewLink);
                    setShowShareToast(true);
                    setTimeout(() => setShowShareToast(false), 3000);
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Did You Get Modal */}
      {showDidYouGetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Update Position Status</h3>
            <p className="text-gray-600 mb-6">Did you successfully fill this position?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleUpdateDidYouGet(true)}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium disabled:opacity-50"
              >
                ✓ Yes, Position Filled
              </button>
              <button
                onClick={() => handleUpdateDidYouGet(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-medium disabled:opacity-50"
              >
                ✗ No, Still Looking
              </button>
            </div>
            <button
              onClick={() => setShowDidYouGetModal(false)}
              disabled={isProcessing}
              className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Close Interview Modal */}
      <CloseInterviewModal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        onSubmit={handleCloseInterview}
        loading={isProcessing}
        candidates={(invitedCandidates || []).map(c => ({
          email: c.email,
          name: `${c.firstName} ${c.lastName}`,
          score: c.score,
          status: c.status || 'scheduled'
        }))}
        interviewTitle={interview.jobTitle}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Interview"
        message="Are you sure you want to DELETE this interview? This action cannot be undone! All interview data, candidate responses, and evaluations will be permanently removed."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        onConfirm={handleDeleteInterview}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
        isProcessing={isProcessing}
      />

      {/* Toast Notifications */}
      <Toast 
        message="Interview link copied to clipboard!" 
        visible={showShareToast} 
        type="success" 
      />
      <Toast 
        message="Interview closed successfully!" 
        visible={showCloseToast} 
        type="success" 
      />
      <Toast 
        message="Interview deleted successfully!" 
        visible={showDeleteToast} 
        type="success" 
      />
      <Toast 
        message={errorMessage} 
        visible={showErrorToast} 
        type="error" 
      />
    </div>
  );
};

export default InterviewDetails;