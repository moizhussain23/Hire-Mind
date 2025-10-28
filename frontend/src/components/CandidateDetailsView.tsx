import React from 'react';
import { X, Mail, Briefcase, Calendar, Award, TrendingUp, MessageSquare, CheckCircle, AlertCircle, Code, FileText, Clock, Target } from 'lucide-react';
import { generateCandidatePDF } from '../utils/pdfGenerator';

interface CandidateDetailsViewProps {
  candidate: {
    id: string;
    name: string;
    email: string;
    position: string;
    interviewDate: string;
    invitedDate?: string;
    status: 'completed' | 'in-progress' | 'scheduled';
    score: number;
    interviewType: 'voice' | 'video' | 'both';
    experienceLevel: 'fresher' | 'mid' | 'senior';
    confidenceScore?: number;
    technicalDepth?: number;
    communication?: number;
    isSelected?: boolean;
    resumeUrl?: string | null;
  };
  onClose: () => void;
}

const CandidateDetailsView: React.FC<CandidateDetailsViewProps> = ({ candidate, onClose }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-teal-500';
    if (score >= 60) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
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

  // Mock data for demonstration - in real app, this would come from API
  const mockTranscript = [
    { question: "Tell me about your experience with React?", answer: "I have been working with React for over 3 years..." },
    { question: "How do you handle state management?", answer: "I prefer using Redux for complex applications..." },
  ];

  const mockCodingResults = {
    problemsSolved: 3,
    totalProblems: 5,
    languages: ['JavaScript', 'Python'],
    timeSpent: '45 minutes',
    codeQuality: 85
  };

  const mockAIFeedback = {
    strengths: [
      'Strong understanding of React fundamentals',
      'Good problem-solving approach',
      'Clear communication skills',
      'Confident in technical discussions'
    ],
    improvements: [
      'Could improve knowledge of advanced React patterns',
      'More practice with algorithm optimization needed'
    ],
    overallFeedback: 'The candidate demonstrates solid technical skills and good communication. They show promise for the role and would benefit from mentorship in advanced topics.'
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 z-50 overflow-y-auto">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="min-h-screen w-full relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 shadow-lg sticky top-0 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl font-bold text-white">
                  {candidate.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{candidate.name}</h1>
                  {candidate.isSelected && (
                    <span className="inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-semibold rounded-lg bg-green-500 text-white border-2 border-green-300">
                      <CheckCircle className="h-4 w-4" />
                      <span>Selected</span>
                    </span>
                  )}
                </div>
                <p className="text-indigo-100 text-lg">{candidate.position}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {candidate.resumeUrl && (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all font-semibold backdrop-blur-sm"
                >
                  <FileText className="h-5 w-5" />
                  <span>View Resume</span>
                </a>
              )}
              {candidate.status === 'completed' && (
                <>
                  <button
                    onClick={() => generateCandidatePDF(candidate)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all font-semibold backdrop-blur-sm"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => alert('Share feature coming soon!')}
                    className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all font-semibold backdrop-blur-sm"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-lg transition-all hover:scale-105"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Email</span>
              </div>
              <p className="text-gray-900 font-semibold truncate">{candidate.email}</p>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Invited On</span>
              </div>
              <p className="text-gray-900 font-semibold">{candidate.invitedDate || 'N/A'}</p>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Interview Date</span>
              </div>
              <p className="text-gray-900 font-semibold">{candidate.interviewDate}</p>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Experience</span>
              </div>
              <p className="text-gray-900 font-semibold capitalize">{candidate.experienceLevel}</p>
            </div>

            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-2">
                <MessageSquare className="h-5 w-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Status</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(candidate.status)}`}>
                {candidate.status === 'completed' && <CheckCircle className="h-4 w-4 mr-1" />}
                {candidate.status === 'in-progress' && <AlertCircle className="h-4 w-4 mr-1" />}
                <span className="capitalize">{candidate.status.replace('-', ' ')}</span>
              </span>
            </div>
          </div>

          {candidate.status === 'completed' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Score & AI Analysis */}
              <div className="lg:col-span-1 space-y-6">
                {/* Overall Score */}
                <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Award className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Overall Score</h3>
                  </div>
                  
                  <div className="flex items-center justify-center mb-6">
                    <div className={`relative w-48 h-48 rounded-full bg-gradient-to-br ${getScoreGradient(candidate.score)} p-1 shadow-2xl`}>
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-6xl font-bold ${getScoreColor(candidate.score)}`}>
                            {candidate.score}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">out of 100</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Badge */}
                  <div className={`rounded-xl p-4 border-2 ${
                    candidate.score >= 80 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : candidate.score >= 60 
                      ? 'bg-amber-50 border-amber-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <p className={`text-sm font-semibold text-center ${
                      candidate.score >= 80 
                        ? 'text-emerald-700' 
                        : candidate.score >= 60 
                        ? 'text-amber-700' 
                        : 'text-red-700'
                    }`}>
                      {candidate.score >= 80 
                        ? '✅ Highly Recommended'
                        : candidate.score >= 60 
                        ? '⚠️ Consider for Review'
                        : '❌ Not Recommended'}
                    </p>
                  </div>
                </div>

                {/* AI Metrics */}
                <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <TrendingUp className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI Metrics</h3>
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
                            className={`h-3 rounded-full transition-all bg-gradient-to-r ${getScoreGradient(candidate.confidenceScore)}`}
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
                            className={`h-3 rounded-full transition-all bg-gradient-to-r ${getScoreGradient(candidate.technicalDepth)}`}
                            style={{ width: `${candidate.technicalDepth}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {candidate.communication !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Communication</span>
                          <span className={`text-sm font-bold ${getScoreColor(candidate.communication)}`}>
                            {candidate.communication}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all bg-gradient-to-r ${getScoreGradient(candidate.communication)}`}
                            style={{ width: `${candidate.communication}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coding Results */}
                <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Code className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Coding Assessment</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Problems Solved</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {mockCodingResults.problemsSolved}/{mockCodingResults.totalProblems}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Code Quality</span>
                      <span className={`text-lg font-bold ${getScoreColor(mockCodingResults.codeQuality)}`}>
                        {mockCodingResults.codeQuality}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Time Spent</span>
                      <span className="text-lg font-bold text-gray-900">{mockCodingResults.timeSpent}</span>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Languages Used</span>
                      <div className="flex flex-wrap gap-2">
                        {mockCodingResults.languages.map((lang, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Detailed Analysis */}
              <div className="lg:col-span-2 space-y-6">
                {/* AI Feedback */}
                <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <Target className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">AI Analysis & Feedback</h3>
                  </div>

                  {/* Strengths */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-emerald-700 mb-3 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {mockAIFeedback.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-gray-700">
                          <span className="text-emerald-500 mt-1">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-amber-700 mb-3 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {mockAIFeedback.improvements.map((improvement, idx) => (
                        <li key={idx} className="flex items-start space-x-2 text-gray-700">
                          <span className="text-amber-500 mt-1">→</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Overall Feedback */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-200">
                    <h4 className="text-lg font-semibold text-indigo-900 mb-2">Overall Assessment</h4>
                    <p className="text-gray-700 leading-relaxed">{mockAIFeedback.overallFeedback}</p>
                  </div>
                </div>

                {/* Interview Transcript */}
                <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <FileText className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-xl font-bold text-gray-900">Interview Transcript</h3>
                  </div>

                  <div className="space-y-4">
                    {mockTranscript.map((item, idx) => (
                      <div key={idx} className="border-l-4 border-indigo-500 pl-4 py-2">
                        <p className="font-semibold text-indigo-900 mb-2">Q: {item.question}</p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">A: {item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Not Completed State */
            <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-lg p-12 text-center">
              <AlertCircle className="h-20 w-20 text-blue-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Interview Not Completed</h3>
              <p className="text-lg text-gray-600 mb-6">
                {candidate.status === 'scheduled' 
                  ? 'This candidate has not started the interview yet. Detailed results will be available once they complete the interview.'
                  : 'This interview is currently in progress. Check back later for the complete analysis.'}
              </p>
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">Status: {candidate.status.replace('-', ' ').toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CandidateDetailsView;
