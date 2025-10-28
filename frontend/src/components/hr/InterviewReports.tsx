import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Interview } from '../../types';

interface InterviewReportsProps {
  interviews: Interview[];
  onViewReport: (interview: Interview) => void;
  onDownloadReport: (interview: Interview) => void;
}

const InterviewReports: React.FC<InterviewReportsProps> = ({
  interviews,
  onViewReport,
  onDownloadReport
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedInterviews = [...interviews].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'score':
        comparison = (a.evaluation?.overallScore || 0) - (b.evaluation?.overallScore || 0);
        break;
      case 'duration':
        comparison = (a.duration || 0) - (b.duration || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Interview Reports</h3>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="duration">Sort by Duration</option>
            </select>
            <Button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              variant="outline"
              size="sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{interviews.length}</div>
            <div className="text-sm text-blue-800">Total Interviews</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {interviews.filter(i => i.evaluation?.overallScore && i.evaluation.overallScore >= 70).length}
            </div>
            <div className="text-sm text-green-800">Passed (≥70)</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {interviews.filter(i => i.evaluation?.overallScore && i.evaluation.overallScore >= 50 && i.evaluation.overallScore < 70).length}
            </div>
            <div className="text-sm text-yellow-800">Average (50-69)</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {interviews.filter(i => i.evaluation?.overallScore && i.evaluation.overallScore < 50).length}
            </div>
            <div className="text-sm text-red-800">Below Average (<50)</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {sortedInterviews.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interview reports</h3>
            <p className="mt-1 text-sm text-gray-500">No interviews have been completed yet.</p>
          </div>
        ) : (
          sortedInterviews.map((interview) => (
            <div
              key={interview.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {interview.candidateName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {interview.candidateName || 'Unknown Candidate'}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(interview.createdAt)}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    {interview.evaluation?.overallScore && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(interview.evaluation.overallScore)}`}>
                        Score: {interview.evaluation.overallScore}/100
                      </span>
                    )}
                    {interview.duration && (
                      <span className="text-xs text-gray-500">
                        Duration: {formatDuration(interview.duration)}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      interview.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : interview.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {interview.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => onViewReport(interview)}
                  variant="outline"
                  size="sm"
                >
                  View Report
                </Button>
                <Button
                  onClick={() => onDownloadReport(interview)}
                  variant="outline"
                  size="sm"
                >
                  Download
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default InterviewReports;
