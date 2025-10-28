import React, { useState } from 'react';
import { X, CheckCircle, UserCheck } from 'lucide-react';

interface Candidate {
  email: string;
  name: string;
  score?: number;
  status: string;
}

interface CloseInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedCandidates: string[]) => void;
  loading?: boolean;
  candidates: Candidate[];
  interviewTitle: string;
}

const CloseInterviewModal: React.FC<CloseInterviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  candidates,
  interviewTitle
}) => {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const handleToggleCandidate = (email: string) => {
    setSelectedCandidates(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedCandidates);
  };

  if (!isOpen) return null;

  // Only show completed candidates
  const completedCandidates = candidates.filter(c => c.status === 'completed');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Close Interview</h2>
            <p className="text-indigo-100 text-sm mt-1">{interviewTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <UserCheck className="h-5 w-5 mr-2 text-indigo-600" />
              Select Hired Candidates
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose the candidates you want to mark as selected/hired for this position.
            </p>
          </div>

          {completedCandidates.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-3">👥</div>
              <p className="text-gray-600">No completed candidates to select</p>
              <p className="text-sm text-gray-500 mt-2">You can still close the interview</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {completedCandidates.map((candidate) => (
                <div
                  key={candidate.email}
                  onClick={() => handleToggleCandidate(candidate.email)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCandidates.includes(candidate.email)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          selectedCandidates.includes(candidate.email)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedCandidates.includes(candidate.email) && (
                          <CheckCircle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        <p className="text-sm text-gray-500">{candidate.email}</p>
                      </div>
                    </div>
                    {candidate.score !== undefined && (
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${
                            candidate.score >= 80
                              ? 'text-green-600'
                              : candidate.score >= 60
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {candidate.score}%
                        </div>
                        <p className="text-xs text-gray-500">Score</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedCandidates.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                <strong>{selectedCandidates.length}</strong> candidate{selectedCandidates.length > 1 ? 's' : ''} selected for hiring
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Closing Interview...' : 'Close Interview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Closing the interview will prevent new candidates from joining and mark it as completed.
          </p>
        </form>
      </div>
    </div>
  );
};

export default CloseInterviewModal;
