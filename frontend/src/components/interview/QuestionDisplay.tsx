import React from 'react';
import Card from '../ui/Card';

interface QuestionDisplayProps {
  currentQuestion: string;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion,
  questionNumber,
  totalQuestions,
  timeRemaining
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Question {questionNumber} of {totalQuestions}
          </div>
          {timeRemaining !== undefined && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              timeRemaining < 60 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      </div>

      <div className="prose max-w-none">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQuestion}
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Take your time to think about your answer. Speak clearly and provide specific examples when possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QuestionDisplay;
