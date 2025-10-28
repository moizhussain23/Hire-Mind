import React from 'react';
import { X, User, Mail, Briefcase, Calendar, Award, TrendingUp, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface CandidateDetailsModalProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    interviewDate: string;
    status: 'completed' | 'in-progress' | 'scheduled';
    score: number;
    interviewType: 'voice' | 'video' | 'both';
    experienceLevel: 'fresher' | 'mid' | 'senior';
    confidenceScore?: number;
    technicalDepth?: number;
    communication?: number;
  };
  onClose: () => void;
}

const CandidateDetailsModal: React.FC<CandidateDetailsModalProps> = ({ candidate, onClose }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 60) return 'bg-amber-100';
    return 'bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 z-50 overflow-y-auto">
      <div className="min-h-screen w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
              <p className="text-indigo-100 text-sm">{candidate.position}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </div>
              <p className="text-gray-900 font-semibold">{candidate.email}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Interview Date</span>
              </div>
              <p className="text-gray-900 font-semibold">
                {candidate.interviewDate || 'Not scheduled'}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm font-medium">Experience Level</span>
              </div>
              <p className="text-gray-900 font-semibold capitalize">{candidate.experienceLevel}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 text-gray-600 mb-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(candidate.status)}`}>
                {candidate.status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                {candidate.status === 'in-progress' && <AlertCircle className="h-4 w-4 mr-1" />}
                <span className="capitalize">{candidate.status.replace('-', ' ')}</span>
              </span>
            </div>
          </div>

          {/* Overall Score */}
          {candidate.status === 'completed' && (
            <>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Award className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Overall Performance</h3>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className={`relative w-40 h-40 rounded-full ${getScoreBgColor(candidate.score)} flex items-center justify-center`}>
                    <div className="text-center">
                      <div className={`text-5xl font-bold ${getScoreColor(candidate.score)}`}>
                        {candidate.score}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">out of 100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {(candidate.confidenceScore || candidate.technicalDepth || candidate.communication) && (
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI Analysis</h3>
                  </div>

                  <div className="space-y-4">
                    {candidate.confidenceScore !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Confidence</span>
                          <span className={`text-sm font-bold ${getScoreColor(candidate.confidenceScore)}`}>
                            {candidate.confidenceScore}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              candidate.confidenceScore >= 80 ? 'bg-emerald-500' :
                              candidate.confidenceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${candidate.confidenceScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {candidate.technicalDepth !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Technical Knowledge</span>
                          <span className={`text-sm font-bold ${getScoreColor(candidate.technicalDepth)}`}>
                            {candidate.technicalDepth}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              candidate.technicalDepth >= 80 ? 'bg-emerald-500' :
                              candidate.technicalDepth >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${candidate.technicalDepth}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {candidate.communication !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Communication Skills</span>
                          <span className={`text-sm font-bold ${getScoreColor(candidate.communication)}`}>
                            {candidate.communication}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              candidate.communication >= 80 ? 'bg-emerald-500' :
                              candidate.communication >= 60 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${candidate.communication}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className={`rounded-2xl p-6 border-2 ${
                candidate.score >= 80 
                  ? 'bg-emerald-50 border-emerald-200' 
                  : candidate.score >= 60 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Recommendation</h3>
                <p className={`text-sm ${
                  candidate.score >= 80 
                    ? 'text-emerald-700' 
                    : candidate.score >= 60 
                    ? 'text-amber-700' 
                    : 'text-red-700'
                }`}>
                  {candidate.score >= 80 
                    ? '✅ Strong candidate - Highly recommended for next round'
                    : candidate.score >= 60 
                    ? '⚠️ Moderate candidate - Consider for further evaluation'
                    : '❌ Weak performance - May not be suitable for this role'}
                </p>
              </div>
            </>
          )}

          {/* Not Completed Yet */}
          {candidate.status !== 'completed' && (
            <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 text-center">
              <AlertCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Interview Not Completed</h3>
              <p className="text-sm text-gray-600">
                {candidate.status === 'scheduled' 
                  ? 'This candidate has not started the interview yet.'
                  : 'This interview is currently in progress.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
          {candidate.status === 'completed' && (
            <button
              onClick={() => alert('Download report feature coming soon!')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
            >
              Download Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetailsModal;
