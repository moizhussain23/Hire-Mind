import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, MessageSquare, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface InterviewSystemProps {
  interviewId: string;
  candidateName: string;
  position: string;
  interviewType: 'video' | 'voice' | 'both';
  onComplete: (interviewData: InterviewResult) => void;
  onError?: (error: string) => void;
}

interface InterviewResult {
  interviewId: string;
  duration: number;
  responses: Array<{
    question: string;
    answer: string;
    timestamp: number;
  }>;
  recordingUrl?: string;
  score?: number;
}

interface Question {
  id: string;
  text: string;
  category: string;
}

export default function InterviewSystem({
  interviewId,
  candidateName,
  position,
  interviewType,
  onComplete,
  onError
}: InterviewSystemProps) {
  // Interview state
  const [isStarted, setIsStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{ question: string; answer: string; timestamp: number }>>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Media state
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Sample questions (in real app, fetch from backend)
  const questions: Question[] = [
    { id: '1', text: 'Tell me about yourself and your background.', category: 'Introduction' },
    { id: '2', text: `Why are you interested in the ${position} position?`, category: 'Motivation' },
    { id: '3', text: 'What are your key strengths that make you suitable for this role?', category: 'Skills' },
    { id: '4', text: 'Describe a challenging project you worked on and how you handled it.', category: 'Experience' },
    { id: '5', text: 'Where do you see yourself in 5 years?', category: 'Career Goals' }
  ];

  const currentQuestion = questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted && !isRecording) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, isRecording, startTime]);

  // Initialize media devices
  const initializeMedia = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: interviewType === 'video' || interviewType === 'both' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      setIsMicEnabled(true);
      
      if (constraints.video && videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsVideoEnabled(true);
      }

      setMediaError(null);
      return stream;
    } catch (err: any) {
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Camera/Microphone access denied. Please allow access to continue.'
        : 'Failed to access camera/microphone. Please check your device settings.';
      setMediaError(errorMsg);
      if (onError) onError(errorMsg);
      throw err;
    }
  };

  // Start interview
  const handleStartInterview = async () => {
    try {
      await initializeMedia();
      setIsStarted(true);
      setStartTime(Date.now());
      console.log('✅ Interview started');
    } catch (err) {
      console.error('❌ Failed to start interview:', err);
    }
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // Start recording answer
  const startRecording = async () => {
    if (!mediaStream) return;

    try {
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9' || 'video/webm'
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      console.log('🔴 Recording started');
    } catch (err) {
      console.error('❌ Failed to start recording:', err);
      setMediaError('Failed to start recording. Please try again.');
    }
  };

  // Stop recording answer
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('⏹️ Recording stopped');
    }
  };

  // Submit answer and move to next question
  const handleSubmitAnswer = () => {
    if (!currentAnswer.trim() && !isRecording) {
      setMediaError('Please provide an answer before submitting.');
      return;
    }

    // Save response
    const response = {
      question: currentQuestion.text,
      answer: currentAnswer.trim(),
      timestamp: Date.now() - startTime
    };

    setResponses([...responses, response]);
    setCurrentAnswer('');
    setMediaError(null);

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      completeInterview();
    }
  };

  // Complete interview
  const completeInterview = () => {
    // Stop all media tracks
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    const duration = Date.now() - startTime;
    
    const interviewData: InterviewResult = {
      interviewId,
      duration,
      responses: [...responses, {
        question: currentQuestion.text,
        answer: currentAnswer.trim(),
        timestamp: Date.now() - startTime
      }]
    };

    console.log('✅ Interview completed:', interviewData);
    onComplete(interviewData);
  };

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaStream]);

  if (!isStarted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Interview</h2>
            <p className="text-gray-600">Position: {position}</p>
            <p className="text-gray-600">Candidate: {candidateName}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Before you begin:</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>You will be asked {questions.length} questions</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>You can type or record your answers</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Take your time to answer each question thoughtfully</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Your responses will be analyzed by our AI system</span>
              </li>
            </ul>
          </div>

          {mediaError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{mediaError}</p>
            </div>
          )}

          <button
            onClick={handleStartInterview}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">AI Interview in Progress</h2>
              <p className="text-blue-100">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Video/Audio Preview */}
          {(interviewType === 'video' || interviewType === 'both') && (
            <div className="mb-6">
              <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                    <VideoOff className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Media Controls */}
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={toggleMicrophone}
                  className={`p-4 rounded-full transition-colors ${
                    isMicEnabled 
                      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                {(interviewType === 'video' || interviewType === 'both') && (
                  <button
                    onClick={toggleVideo}
                    className={`p-4 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6">
            <div className="flex items-start">
              <MessageSquare className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-600 font-semibold mb-1">{currentQuestion.category}</p>
                <p className="text-lg text-gray-900 font-medium">{currentQuestion.text}</p>
              </div>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {currentAnswer.length} characters
            </p>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-red-800 font-medium">Recording in progress...</span>
            </div>
          )}

          {mediaError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{mediaError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Progress: {responses.length} / {questions.length} answered
            </div>
            <div className="flex space-x-3">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleSubmitAnswer}
                disabled={!currentAnswer.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Interview'}
                <Send className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
