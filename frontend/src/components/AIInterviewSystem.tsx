import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Code, Send, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface AIInterviewSystemProps {
  interviewId: string;
  candidateName: string;
  position: string;
  resumeUrl: string;
  skillCategory: string;
  experienceLevel: 'fresher' | 'mid' | 'senior';
  interviewType: 'video' | 'voice' | 'both';
  onComplete: (result: InterviewResult) => void;
  onError?: (error: string) => void;
}

interface InterviewResult {
  interviewId: string;
  duration: number;
  transcript: ConversationTurn[];
  score?: number;
  recordingUrl?: string;
}

interface ConversationTurn {
  speaker: 'ai' | 'candidate';
  text: string;
  timestamp: number;
  audioUrl?: string;
}

export default function AIInterviewSystem({
  interviewId,
  candidateName,
  position,
  resumeUrl,
  skillCategory,
  experienceLevel,
  interviewType,
  onComplete,
  onError
}: AIInterviewSystemProps) {
  // Interview state
  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversation, setConversation] = useState<ConversationTurn[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Media state
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // Technical interview state
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [code, setCode] = useState('// Write your code here\n');
  const [language, setLanguage] = useState('javascript');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, startTime]);

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
      
      if (constraints.video && videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMediaError(null);
      return stream;
    } catch (err: any) {
      const errorMsg = 'Failed to access camera/microphone. Please check permissions.';
      setMediaError(errorMsg);
      if (onError) onError(errorMsg);
      throw err;
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setMediaError('Speech recognition not supported in this browser. Please use Chrome.');
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleCandidateResponse(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'no-speech') {
        setMediaError('No speech detected. Please try again.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  // AI speaks using text-to-speech
  const speakText = (text: string) => {
    return new Promise<void>((resolve) => {
      if (!synthRef.current || !isSpeakerEnabled) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Try to use a female voice for AIRA
      const voices = synthRef.current.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Google US English')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => {
        setIsAISpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsAISpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  // Generate AI question based on context
  const generateAIQuestion = async (context: string = '') => {
    setIsProcessing(true);
    
    try {
      // In production, call your backend API
      // For now, simulate AI question generation
      
      let question = '';
      
      if (questionCount === 0) {
        // Opening question
        question = `Hello ${candidateName}, I'm AIRA, your AI interviewer. Thank you for joining us today. Let's start with a simple question. Can you tell me about yourself and your experience related to ${position}?`;
      } else if (questionCount === 1) {
        // Follow-up based on position
        if (skillCategory === 'technical') {
          question = `That's interesting. Now, let's dive into some technical aspects. Can you explain your experience with the technologies mentioned in your resume?`;
        } else {
          question = `Great! Now, can you describe a challenging project you worked on and how you handled it?`;
        }
      } else if (questionCount === 2 && skillCategory === 'technical') {
        // Technical coding question
        setShowCodeEditor(true);
        question = `Perfect. Now I'd like to see your coding skills. I'm opening a code editor for you. Can you write a function to reverse a string? Please explain your approach as you code.`;
      } else {
        // Follow-up questions based on previous answer
        question = `Thank you for that answer. ${context ? `Based on what you mentioned about ${context}, ` : ''}Can you elaborate more on your problem-solving approach?`;
      }

      setCurrentQuestion(question);
      
      // Add to conversation
      const turn: ConversationTurn = {
        speaker: 'ai',
        text: question,
        timestamp: Date.now() - startTime
      };
      setConversation(prev => [...prev, turn]);

      // AI speaks the question
      await speakText(question);
      
      // Start listening for answer
      startListening();
      
    } catch (err) {
      console.error('Error generating question:', err);
      setMediaError('Failed to generate question. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start listening to candidate
  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition();
    }

    if (recognitionRef.current && isMicEnabled) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMediaError(null);
      } catch (err) {
        console.error('Failed to start listening:', err);
      }
    }
  };

  // Handle candidate response
  const handleCandidateResponse = async (transcript: string) => {
    setIsListening(false);

    // Add to conversation
    const turn: ConversationTurn = {
      speaker: 'candidate',
      text: transcript,
      timestamp: Date.now() - startTime
    };
    setConversation(prev => [...prev, turn]);

    // Increment question count
    setQuestionCount(prev => prev + 1);

    // Generate follow-up question
    if (questionCount < 5) {
      // Extract key topics from response for follow-up
      const keywords = transcript.toLowerCase();
      let context = '';
      
      if (keywords.includes('project')) context = 'the project';
      else if (keywords.includes('team')) context = 'teamwork';
      else if (keywords.includes('challenge')) context = 'challenges';
      
      setTimeout(() => generateAIQuestion(context), 2000);
    } else {
      // End interview
      completeInterview();
    }
  };

  // Manual submit (for when speech recognition fails)
  const handleManualSubmit = (text: string) => {
    if (text.trim()) {
      handleCandidateResponse(text);
    }
  };

  // Start interview
  const handleStartInterview = async () => {
    try {
      await initializeMedia();
      setIsStarted(true);
      setStartTime(Date.now());
      
      // Wait for voices to load
      if (synthRef.current) {
        synthRef.current.getVoices();
      }
      
      // Start with first question after 2 seconds
      setTimeout(() => generateAIQuestion(), 2000);
      
    } catch (err) {
      console.error('Failed to start interview:', err);
    }
  };

  // Complete interview
  const completeInterview = async () => {
    // Stop all media
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Final message
    const finalMessage = `Thank you ${candidateName} for completing the interview. Your responses have been recorded and will be analyzed. You'll receive the results within 24 hours. Have a great day!`;
    await speakText(finalMessage);

    const result: InterviewResult = {
      interviewId,
      duration: Date.now() - startTime,
      transcript: conversation
    };

    onComplete(result);
  };

  // Toggle controls
  const toggleMicrophone = () => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleVideo = () => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    if (synthRef.current && isAISpeaking) {
      synthRef.current.cancel();
      setIsAISpeaking(false);
    }
  };

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [mediaStream]);

  // Pre-interview screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8">
          {/* AIRA Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <span className="text-4xl font-bold text-white">AI</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AIRA Interview</h2>
            <p className="text-gray-600">AI-Powered Interview Assistant</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Interview Details:</h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>Candidate:</strong> {candidateName}</p>
              <p><strong>Position:</strong> {position}</p>
              <p><strong>Level:</strong> {experienceLevel}</p>
              <p><strong>Category:</strong> {skillCategory}</p>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-purple-900 mb-3">How it works:</h3>
            <ul className="space-y-2 text-purple-800">
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>AIRA will ask you questions based on your resume and position</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>Answer using your voice - speak naturally like a real interview</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>AIRA will generate follow-up questions based on your answers</span>
              </li>
              {skillCategory === 'technical' && (
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <span>You may be asked to write code in our live editor</span>
                </li>
              )}
              <li className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>The interview will last approximately 20-30 minutes</span>
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg text-lg"
          >
            Start Interview with AIRA
          </button>
        </div>
      </div>
    );
  }

  // Interview screen
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-blue-600">AI</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">AIRA Interview</h2>
              <p className="text-sm text-blue-100">Question {questionCount + 1}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Video + Controls */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              {/* Candidate Video */}
              <div className="relative bg-gray-900" style={{ paddingBottom: '133%' }}>
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
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                    <p className="text-white text-sm font-medium">{candidateName}</p>
                  </div>
                </div>
              </div>

              {/* Media Controls */}
              <div className="p-4 bg-gray-800 flex justify-center space-x-3">
                <button
                  onClick={toggleMicrophone}
                  className={`p-3 rounded-full transition-colors ${
                    isMicEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title={isMicEnabled ? 'Mute' : 'Unmute'}
                >
                  {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                {(interviewType === 'video' || interviewType === 'both') && (
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoEnabled 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
                  >
                    {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                )}
                
                <button
                  onClick={toggleSpeaker}
                  className={`p-3 rounded-full transition-colors ${
                    isSpeakerEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                  title={isSpeakerEnabled ? 'Mute AIRA' : 'Unmute AIRA'}
                >
                  {isSpeakerEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="mt-4 space-y-2">
              {isAISpeaking && (
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
                  <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
                  <span className="font-medium">AIRA is speaking...</span>
                </div>
              )}
              
              {isListening && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2"></div>
                  <span className="font-medium">Listening to your answer...</span>
                </div>
              )}
              
              {isProcessing && (
                <div className="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  <span className="font-medium">Processing...</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Conversation + Code Editor */}
          <div className="lg:col-span-2">
            {!showCodeEditor ? (
              /* Conversation View */
              <div className="bg-gray-800 rounded-lg p-6 h-[calc(100vh-200px)] flex flex-col">
                <h3 className="text-white text-lg font-semibold mb-4">Interview Conversation</h3>
                
                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {conversation.map((turn, index) => (
                    <div
                      key={index}
                      className={`flex ${turn.speaker === 'ai' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          turn.speaker === 'ai'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-white'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {turn.speaker === 'ai' ? (
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-blue-600">AI</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-white">You</span>
                            </div>
                          )}
                          <span className="text-xs opacity-75">
                            {Math.floor(turn.timestamp / 1000)}s
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{turn.text}</p>
                      </div>
                    </div>
                  ))}
                  
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-blue-600 text-white rounded-lg p-4">
                        <Loader className="w-5 h-5 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Question Display */}
                {currentQuestion && (
                  <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
                    <p className="text-blue-100 text-sm font-medium mb-1">Current Question:</p>
                    <p className="text-white">{currentQuestion}</p>
                  </div>
                )}

                {/* Manual Input (fallback) */}
                {!isListening && !isAISpeaking && !isProcessing && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Type your answer if voice isn't working..."
                      className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleManualSubmit((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <button
                      onClick={startListening}
                      disabled={!isMicEnabled}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Code Editor View */
              <div className="bg-gray-800 rounded-lg overflow-hidden h-[calc(100vh-200px)] flex flex-col">
                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Code className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">Code Editor</span>
                  </div>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                  </select>
                </div>
                
                <div className="flex-1">
                  <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
                
                <div className="bg-gray-900 px-4 py-3 border-t border-gray-700">
                  <button
                    onClick={() => {
                      // Submit code and continue
                      handleManualSubmit(`I've written the code: ${code}`);
                      setShowCodeEditor(false);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Submit Code & Continue
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
