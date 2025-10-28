import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { User } from '../../types';

interface CandidateListProps {
  candidates: User[];
  onViewCandidate: (candidate: User) => void;
  onScheduleInterview: (candidate: User) => void;
}

const CandidateList: React.FC<CandidateListProps> = ({
  candidates,
  onViewCandidate,
  onScheduleInterview
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'interviewed' | 'evaluated'>('all');

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'pending' && !candidate.lastInterviewDate) ||
                         (filterStatus === 'interviewed' && candidate.lastInterviewDate && !candidate.evaluationScore) ||
                         (filterStatus === 'evaluated' && candidate.evaluationScore);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (candidate: User) => {
    if (candidate.evaluationScore) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Evaluated
        </span>
      );
    }
    if (candidate.lastInterviewDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Interviewed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Pending
      </span>
    );
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidates</h3>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="interviewed">Interviewed</option>
            <option value="evaluated">Evaluated</option>
          </select>
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No candidates have been added yet.'
              }
            </p>
          </div>
        ) : (
          filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {candidate.firstName} {candidate.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{candidate.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusBadge(candidate)}
                    {candidate.evaluationScore && (
                      <span className={`text-sm font-medium ${getScoreColor(candidate.evaluationScore)}`}>
                        Score: {candidate.evaluationScore}/100
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => onViewCandidate(candidate)}
                  variant="outline"
                  size="sm"
                >
                  View Details
                </Button>
                {!candidate.lastInterviewDate && (
                  <Button
                    onClick={() => onScheduleInterview(candidate)}
                    size="sm"
                  >
                    Schedule Interview
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default CandidateList;
