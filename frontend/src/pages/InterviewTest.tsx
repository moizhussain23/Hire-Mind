import { useState, useEffect } from 'react';
import AIInterviewSystemV2 from '../components/AIInterviewSystemV2';
import { CheckCircle, Upload, FileText, Loader, X } from 'lucide-react';
import { uploadResume } from '../services/aiInterviewAPI';

interface ParsedResume {
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  summary: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    linkedin?: string;
    github?: string;
  };
}

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

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Load resume data from localStorage on mount
  useEffect(() => {
    const storedResume = localStorage.getItem('testInterviewResume');
    if (storedResume) {
      try {
        const parsed = JSON.parse(storedResume);
        setResumeData(parsed);
        console.log('✅ Loaded resume from storage:', parsed);
      } catch (err) {
        console.error('Failed to parse stored resume:', err);
        localStorage.removeItem('testInterviewResume');
      }
    }
  }, []);

  // Handle resume file upload
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setResumeFile(file);
    setUploadError(null);
    setIsUploadingResume(true);

    try {
      console.log('📄 Uploading and parsing resume...');
      const result = await uploadResume(file, true); // Use test endpoint (no auth required)
      
      const parsedData: ParsedResume = {
        skills: result.parsed.skills,
        experience: result.parsed.experience,
        education: result.parsed.education,
        projects: result.parsed.projects,
        summary: result.parsed.summary,
        contactInfo: result.parsed.contactInfo
      };

      setResumeData(parsedData);
      
      // Store in localStorage for persistence
      localStorage.setItem('testInterviewResume', JSON.stringify(parsedData));
      console.log('✅ Resume parsed successfully:', parsedData);
    } catch (error: any) {
      console.error('❌ Resume upload error:', error);
      setUploadError(error.message || 'Failed to parse resume. Please try again.');
      setResumeFile(null);
    } finally {
      setIsUploadingResume(false);
    }
  };

  // Clear resume data
  const handleClearResume = () => {
    setResumeFile(null);
    setResumeData(null);
    setUploadError(null);
    localStorage.removeItem('testInterviewResume');
  };

  if (showInterview) {
    return (
      <AIInterviewSystemV2
        interviewId="test-interview-123"
        candidateName={candidateName}
        position={position}
        resumeUrl={resumeFile ? URL.createObjectURL(resumeFile) : "https://example.com/resume.pdf"}
        resumeData={resumeData}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-2">🎯 AI Interview Test</h1>
              <p className="text-blue-100">Configure your personalized interview experience</p>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-8">
            {/* Step 1: Basic Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <h2 className="text-xl font-bold text-blue-900">Basic Information</h2>
              </div>
              
              <div className="space-y-4">
                {/* Candidate Name */}
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    👤 Candidate Name *
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder=""
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-2">
                    💼 Position Applying For *
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Resume Upload */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <h2 className="text-xl font-bold text-purple-900">Resume Upload</h2>
                <span className="ml-auto text-xs bg-purple-200 text-purple-800 px-3 py-1 rounded-full font-semibold">
                  Optional
                </span>
              </div>
              
              {!resumeData ? (
                <div className="space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-3 border-dashed border-purple-300 rounded-xl cursor-pointer bg-white hover:bg-purple-50 transition-all hover:border-purple-400">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="mb-2 text-base text-gray-700">
                        <span className="font-bold text-purple-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">PDF only • Maximum 10MB</p>
                      <p className="text-xs text-purple-600 mt-2 font-semibold">
                        📄 Get personalized questions based on your resume!
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeUpload}
                      disabled={isUploadingResume}
                    />
                  </label>
                  {isUploadingResume && (
                    <div className="flex items-center justify-center gap-3 bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                      <Loader className="w-5 h-5 animate-spin text-purple-600" />
                      <span className="text-purple-700 font-semibold">Parsing your resume with AI...</span>
                    </div>
                  )}
                  {uploadError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                      <p className="text-red-700 font-semibold">❌ {uploadError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-green-900 text-lg">✅ Resume Loaded Successfully!</p>
                        <p className="text-sm text-green-700 mt-1 font-medium">
                          📄 {resumeFile?.name || 'Resume from storage'}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                            <p className="text-xs text-green-600 font-semibold">Skills</p>
                            <p className="text-lg font-bold text-green-900">{resumeData.skills.length}</p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                            <p className="text-xs text-green-600 font-semibold">Experience</p>
                            <p className="text-lg font-bold text-green-900">{resumeData.experience.length}</p>
                          </div>
                          <div className="bg-white rounded-lg px-3 py-2 border border-green-200">
                            <p className="text-xs text-green-600 font-semibold">Projects</p>
                            <p className="text-lg font-bold text-green-900">{resumeData.projects.length}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleClearResume}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                      title="Remove resume"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
              <div className={`mt-3 text-sm font-semibold rounded-lg p-3 ${
                resumeData 
                  ? 'bg-green-100 text-green-800 border border-green-300' 
                  : 'bg-purple-100 text-purple-800 border border-purple-300'
              }`}>
                {resumeData 
                  ? '✅ Questions will be personalized based on your resume!' 
                  : '💡 Upload a resume to get personalized interview questions'}
              </div>
            </div>

            {/* Step 3: Interview Configuration */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-6 border-2 border-pink-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-pink-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <h2 className="text-xl font-bold text-pink-900">Interview Configuration</h2>
              </div>

              <div className="space-y-6">
                {/* Skill Category */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-3">
                    🎯 Skill Category *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setSkillCategory('technical')}
                      className={`px-6 py-4 rounded-xl border-3 transition-all font-semibold ${
                        skillCategory === 'technical'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">💻</div>
                      Technical
                    </button>
                    <button
                      onClick={() => setSkillCategory('non-technical')}
                      className={`px-6 py-4 rounded-xl border-3 transition-all font-semibold ${
                        skillCategory === 'non-technical'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">👥</div>
                      Non-Technical
                    </button>
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-3">
                    📊 Experience Level *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setExperienceLevel('fresher')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        experienceLevel === 'fresher'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      Fresher
                    </button>
                    <button
                      onClick={() => setExperienceLevel('mid-level')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        experienceLevel === 'mid-level'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">🚀</div>
                      Mid-Level
                    </button>
                    <button
                      onClick={() => setExperienceLevel('senior')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        experienceLevel === 'senior'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">⭐</div>
                      Senior
                    </button>
                  </div>
                </div>

                {/* Interview Type */}
                <div>
                  <label className="block text-sm font-semibold text-pink-900 mb-3">
                    🎥 Interview Mode *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setInterviewType('Video Only')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        interviewType === 'Video Only'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">📹</div>
                      <div className="text-sm">Video Only</div>
                    </button>
                    <button
                      onClick={() => setInterviewType('Voice Only')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        interviewType === 'Voice Only'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">🎤</div>
                      <div className="text-sm">Voice Only</div>
                    </button>
                    <button
                      onClick={() => setInterviewType('Both')}
                      className={`px-4 py-4 rounded-xl border-3 transition-all font-semibold ${
                        interviewType === 'Both'
                          ? 'border-pink-500 bg-pink-600 text-white shadow-lg scale-105'
                          : 'border-pink-300 bg-white text-pink-700 hover:border-pink-400 hover:bg-pink-50'
                      }`}
                    >
                      <div className="text-2xl mb-1">🎬</div>
                      <div className="text-sm">Both</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Round Required - Only show for Technical category */}
            {skillCategory === 'technical' && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6 border-2 border-orange-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                    4
                  </div>
                  <h2 className="text-xl font-bold text-orange-900">Technical Round</h2>
                </div>
                
                <label className="block text-sm font-semibold text-orange-900 mb-3">
                  💻 Include Coding Challenge?
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setHasCodingRound(true)}
                    className={`px-6 py-5 rounded-xl border-3 transition-all font-semibold ${
                      hasCodingRound
                        ? 'border-orange-500 bg-orange-600 text-white shadow-lg scale-105'
                        : 'border-orange-300 bg-white text-orange-700 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">👨‍💻</div>
                    <div className="text-base mb-1">Yes</div>
                    <div className="text-xs opacity-90">Code Editor Included</div>
                  </button>
                  <button
                    onClick={() => setHasCodingRound(false)}
                    className={`px-6 py-5 rounded-xl border-3 transition-all font-semibold ${
                      !hasCodingRound
                        ? 'border-orange-500 bg-orange-600 text-white shadow-lg scale-105'
                        : 'border-orange-300 bg-white text-orange-700 hover:border-orange-400 hover:bg-orange-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">💬</div>
                    <div className="text-base mb-1">No</div>
                    <div className="text-xs opacity-90">Questions Only</div>
                  </button>
                </div>
                <div className={`mt-3 text-sm font-semibold rounded-lg p-3 ${
                  hasCodingRound 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}>
                  {hasCodingRound 
                    ? '✅ Code editor will be shown for technical problems' 
                    : '📝 Only behavioral and technical questions will be asked'}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-xl font-bold text-indigo-900">AI Interview Features</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎤</span>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">AI Voice Conversation</p>
                      <p className="text-xs text-indigo-600">AIRA speaks & listens naturally</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📄</span>
                    <div>
                      <p className="font-bold text-purple-900 text-sm">Resume-Based Questions</p>
                      <p className="text-xs text-purple-600">Personalized to your profile</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-pink-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <div>
                      <p className="font-bold text-pink-900 text-sm">Adaptive Follow-ups</p>
                      <p className="text-xs text-pink-600">AI adapts to your answers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">💻</span>
                    <div>
                      <p className="font-bold text-indigo-900 text-sm">Live Code Editor</p>
                      <p className="text-xs text-indigo-600">Real-time coding challenges</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📹</span>
                    <div>
                      <p className="font-bold text-purple-900 text-sm">Video Recording</p>
                      <p className="text-xs text-purple-600">Camera + screen capture</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-pink-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📝</span>
                    <div>
                      <p className="font-bold text-pink-900 text-sm">Live Transcription</p>
                      <p className="text-xs text-pink-600">Real-time conversation history</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={() => setShowInterview(true)}
              disabled={!candidateName.trim() || !position.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🚀</span>
                <span>Start Interview Test</span>
              </div>
            </button>
            
            <p className="text-center text-sm text-gray-500 -mt-2">
              * All fields marked with asterisk are required
            </p>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
