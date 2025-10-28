import React from 'react';
import Card from '../ui/Card';

interface EvaluationData {
  overallScore: number;
  communication: number;
  technical: number;
  confidence: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

interface EvaluationProps {
  evaluation: EvaluationData;
  isLoading?: boolean;
}

const Evaluation: React.FC<EvaluationProps> = ({ evaluation, isLoading = false }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Overall Score</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-2xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
            {evaluation.overallScore}/100
          </div>
          <p className="text-lg text-gray-600 mt-2">{getScoreLabel(evaluation.overallScore)}</p>
        </div>
      </Card>

      {/* Detailed Scores */}
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Evaluation</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Communication</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getScoreColor(evaluation.communication)}`}>
              {evaluation.communication}/100
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Technical Skills</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getScoreColor(evaluation.technical)}`}>
              {evaluation.technical}/100
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Confidence</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold ${getScoreColor(evaluation.confidence)}`}>
              {evaluation.confidence}/100
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback */}
      <Card>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Feedback</h4>
        <p className="text-gray-700 leading-relaxed">{evaluation.feedback}</p>
      </Card>

      {/* Strengths and Improvements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h4 className="text-lg font-semibold text-green-700 mb-4">Strengths</h4>
          <ul className="space-y-2">
            {evaluation.strengths.map((strength, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h4 className="text-lg font-semibold text-orange-700 mb-4">Areas for Improvement</h4>
          <ul className="space-y-2">
            {evaluation.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Evaluation;
