import { useState } from 'react';
import AIInterviewSystemV2 from '../components/AIInterviewSystemV2';
import { CheckCircle } from 'lucide-react';

export default function InterviewTest() {
  const [showInterview, setShowInterview] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewResult, setInterviewResult] = useState<any>(null);

  // Test configuration
  const [candidateName, setCandidateName] = useState('John Doe');
  const [position, setPosition] = useState('Senior Software Engineer');
  const [interviewType, setInterviewType] = useState<'Video Only' | 'Voice Only' | 'Both'>('Both');
  const [skillCategory, setSkillCategory] = useState<'technical' | 'non-technical'>('technical');
  const [experienceLevel, setExperienceLevel] = useState<'fresher' | 'mid-level' | 'senior'>('senior');
  const [hasCodingRound, setHasCodingRound] = useState(true); // Technical round required

  const handleInterviewComplete = (result: any) => {
    console.log('✅ Interview completed:', result);
    setInterviewResult(result);
    setInterviewComplete(true);
    setShowInterview(false);
  };

  const handleInterviewError = (error: string) => {
    console.error('❌ Interview error:', error);
    alert(`Interview Error: ${error}`);
  };

  const resetTest = () => {
    setShowInterview(false);
    setInterviewComplete(false);
    setInterviewResult(null);
  };

  if (showInterview) {
    return (
      <AIInterviewSystemV2
        interviewId="test-interview-123"
        candidateName={candidateName}
        position={position}
        resumeUrl="https://example.com/resume.pdf"
        skillCategory={skillCategory}
        experienceLevel={experienceLevel}
        interviewType={interviewType}
        hasCodingRound={hasCodingRound}
        onComplete={handleInterviewComplete}
        onError={handleInterviewError}
      />
    );
  }

  if (interviewComplete && interviewResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Completed!</h2>
              <p className="text-gray-600">Thank you for completing the interview</p>
            </div>

            <div className="space-y-6">
              {/* Interview Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-4">Interview Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Candidate</p>
                    <p className="font-medium text-blue-900">{candidateName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Position</p>
                    <p className="font-medium text-blue-900">{position}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Duration</p>
                    <p className="font-medium text-blue-900">
                      {Math.floor(interviewResult.duration / 60000)}m {Math.floor((interviewResult.duration % 60000) / 1000)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Questions Answered</p>
                    <p className="font-medium text-blue-900">{interviewResult.responses.length}</p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Your Responses</h3>
                <div className="space-y-4">
                  {interviewResult.responses.map((response: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Q{index + 1}: {response.question}
                      </p>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded">
                        {response.answer || '(Recorded response)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Answered at: {Math.floor(response.timestamp / 1000)}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center space-x-4 pt-6">
                <button
                  onClick={resetTest}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Start New Test
                </button>
                <button
                  onClick={() => console.log('Interview data:', interviewResult)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Console Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Interview System Test</h1>
            <p className="text-gray-600">Configure and test the AI interview system</p>
          </div>

          <div className="space-y-6">
            {/* Candidate Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter candidate name"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter position"
              />
            </div>

            {/* Skill Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSkillCategory('technical')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    skillCategory === 'technical'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setSkillCategory('non-technical')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    skillCategory === 'non-technical'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Non-Technical
                </button>
              </div>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setExperienceLevel('fresher')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    experienceLevel === 'fresher'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Fresher
                </button>
                <button
                  onClick={() => setExperienceLevel('mid-level')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    experienceLevel === 'mid-level'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Mid-Level
                </button>
                <button
                  onClick={() => setExperienceLevel('senior')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    experienceLevel === 'senior'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Senior
                </button>
              </div>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setInterviewType('Video Only')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    interviewType === 'Video Only'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Video Only
                </button>
                <button
                  onClick={() => setInterviewType('Voice Only')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    interviewType === 'Voice Only'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Voice Only
                </button>
                <button
                  onClick={() => setInterviewType('Both')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    interviewType === 'Both'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>

            {/* Technical Round Required - Only show for Technical category */}
            {skillCategory === 'technical' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Round Required
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setHasCodingRound(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      hasCodingRound
                        ? 'border-green-500 bg-green-50 text-green-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Yes (Code Editor)
                  </button>
                  <button
                    onClick={() => setHasCodingRound(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                      !hasCodingRound
                        ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    No (Questions Only)
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {hasCodingRound 
                    ? '✅ Code editor will be shown for technical problems' 
                    : '📝 Only behavioral and technical questions will be asked'}
                </p>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🎯 Real AI Interview Features:</h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>✅ <strong>AI Voice Conversation</strong> - AIRA speaks questions & listens to answers</li>
                <li>✅ <strong>Resume-Based Questions</strong> - Questions generated from your profile</li>
                <li>✅ <strong>Follow-up Questions</strong> - AI adapts based on your responses</li>
                <li>✅ <strong>Code Editor</strong> - Live coding for technical interviews</li>
                <li>✅ <strong>Video Recording</strong> - Camera + screen capture</li>
                <li>✅ <strong>Speech Recognition</strong> - Speak naturally, no typing</li>
                <li>✅ <strong>Real-time Transcript</strong> - See conversation history</li>
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setShowInterview(true)}
              disabled={!candidateName.trim() || !position.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Interview Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
