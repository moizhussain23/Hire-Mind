import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, Play, Loader, Volume2, Copy } from 'lucide-react';
import Editor from '@monaco-editor/react';
import CameraMicTest from './CameraMicTest';

interface AIInterviewSystemV2Props {
  interviewId: string;
  candidateName: string;
  position: string;
  resumeUrl: string;
  skillCategory: 'technical' | 'non-technical';
  experienceLevel: 'fresher' | 'mid-level' | 'senior';
  interviewType: 'Video Only' | 'Voice Only' | 'Both';
  hasCodingRound?: boolean; // Technical round required (code editor)
  // Time management props
  scheduledStartTime?: Date | string; // When interview is scheduled to start
  duration?: number; // Interview duration in minutes
  timeWindowMinutes?: number; // Minutes window for joining (default 180 = 3 hours)
  onComplete: (result: InterviewResult) => void;
  onError?: (error: string) => void;
}

interface InterviewResult {
  interviewId: string;
  duration: number;
  transcript: Message[];
  codeSubmissions: CodeSubmission[];
  score?: number;
}

interface Message {
  id: string;
  sender: 'ai' | 'candidate';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}

interface CodeSubmission {
  code: string;
  language: string;
  timestamp: number;
}

export default function AIInterviewSystemV2({
  interviewId,
  candidateName,
  position,
  resumeUrl,
  skillCategory,
  experienceLevel,
  interviewType,
  hasCodingRound = true, // Default to true for backward compatibility
  scheduledStartTime,
  duration = 30, // Default 30 minutes
  timeWindowMinutes = 180, // Default 3 hours window
  onComplete,
  onError
}: AIInterviewSystemV2Props) {
  // Test page state
  const [showTestPage, setShowTestPage] = useState(true);
  const [testMediaStream, setTestMediaStream] = useState<MediaStream | null>(null);
  
  // Interview state
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  
  // Interview phase state
  const [interviewPhase, setInterviewPhase] = useState<'behavioral' | 'technical'>('behavioral');
  const [behavioralQuestionsAsked, setBehavioralQuestionsAsked] = useState(0);
  
  // Time management state
  const [timeRemaining, setTimeRemaining] = useState<number>(duration * 60 * 1000); // Convert to milliseconds
  const [isTimeWarningShown, setIsTimeWarningShown] = useState(false);
  const [timeValidationError, setTimeValidationError] = useState<string | null>(null);
  
  // Map interviewType to interviewMode
  const interviewMode: 'video-voice' | 'audio-only' | 'video-only' = (() => {
    if (!interviewType) {
      return 'video-voice';
    }
    
    if (interviewType === 'Both') return 'video-voice';
    if (interviewType === 'Voice Only') return 'audio-only';
    if (interviewType === 'Video Only') return 'video-only';
    
    return 'video-voice';
  })();

  // Code editor state
  const [code, setCode] = useState('# Write your solution here\n\ndef solution():\n    pass\n');
  const [language, setLanguage] = useState('python');
  const [isRunning, setIsRunning] = useState(false);

  // Media state
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled] = useState(true);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  // Bulletproof audio system states
  const [listeningState, setListeningState] = useState<'idle' | 'listening' | 'processing' | 'failed' | 'recovering'>('idle');
  const [audioRetryCount, setAudioRetryCount] = useState(0);
  const [lastListenAttempt, setLastListenAttempt] = useState(0);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const [isReadyForUser, setIsReadyForUser] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Audio system refs
  const finalTranscriptRef = useRef('');
  const voiceCommandDetectionRef = useRef(false);
  const pauseAudioRef = useRef<HTMLAudioElement | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [messages]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStarted) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStarted, startTime]);

  // Re-attach video stream when phase changes
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      console.log('≡ƒöä Video stream re-attached after phase change');
    }
  }, [interviewPhase, mediaStream]);

  // Initialize media - only called after test page
  const initializeMedia = async (existingStream?: MediaStream) => {
    try {
      let stream = existingStream;
      
      if (!stream) {
        console.log('≡ƒÄÑ Requesting camera and microphone access...');
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        });
      }
      
      console.log('Γ£à Media stream obtained');
      setMediaStream(stream);
      
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        console.log('Γ£à Video srcObject set to video element');
      }
    } catch (err: any) {
      console.error('Γ¥î Media error:', err);
      const errorMessage = err.name === 'NotAllowedError' 
        ? 'Camera/microphone access denied. Please allow permissions and refresh.'
        : `Failed to access camera/microphone: ${err.message}`;
      if (onError) onError(errorMessage);
      alert(errorMessage);
    }
  };

  // Speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interimTranscript += transcriptPart;
        }
      }
      
      // Store final transcript in ref for onend handler to use
      if (finalTranscript.trim()) {
        finalTranscriptRef.current = finalTranscript.trim();
        console.log('📝 Final transcript captured:', finalTranscript);
        
        // Check for voice commands
        const command = detectVoiceCommands(finalTranscript);
        if (command) {
          console.log('🎙️ Voice command detected:', command);
          voiceCommandDetectionRef.current = true;
          // Handle commands here if needed
        }
        
        // Reset retry count on successful transcription
        setAudioRetryCount(0);
        setListeningState('processing');
      }
      
      // Show interim results for better UX
      if (interimTranscript.trim()) {
        console.log('🔄 Interim transcript:', interimTranscript);
        // Could display interim text to user here for better UX
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      console.log('🔊 Speech recognition ended');
      setIsListening(false);
      setListeningState('idle');
      
      // Check if we have any transcript
      const transcript = finalTranscriptRef.current.trim();
      
      if (transcript && transcript.length > 0) {
        console.log('✅ Valid transcript received:', transcript);
        handleCandidateResponse(transcript);
        finalTranscriptRef.current = '';
        setAudioRetryCount(0); // Reset retry count on success
      } else if (isListening && !isPaused && !isAISpeaking) {
        // No transcript but was actively listening - this is the "cannot hear" issue
        console.log('⚠️ No transcript received, attempting recovery...');
        const retryMessage: Message = {
          id: Date.now().toString(),
          text: `I didn't catch that. Could you please repeat your answer? (Attempt ${audioRetryCount + 1}/5)`,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: false
        };
        setMessages(prev => [...prev, retryMessage]);
        
        // Use bulletproof restart
        restartListening();
      }
    };

    return recognition;
  };

  // Time Management Functions
  
  // Validate if interview can start within time window
  const validateTimeWindow = (): { allowed: boolean; message?: string } => {
    if (!scheduledStartTime) {
      // No scheduled time, allow interview
      return { allowed: true };
    }

    const now = new Date();
    const scheduledStart = new Date(scheduledStartTime);
    const canJoinFrom = new Date(scheduledStart.getTime() - 30 * 60000); // 30 min before
    const mustStartBy = new Date(scheduledStart.getTime() + timeWindowMinutes * 60000); // timeWindowMinutes after

    console.log('ΓÅ░ Time Window Validation:');
    console.log('  Now:', now.toLocaleTimeString());
    console.log('  Scheduled:', scheduledStart.toLocaleTimeString());
    console.log('  Can join from:', canJoinFrom.toLocaleTimeString());
    console.log('  Must start by:', mustStartBy.toLocaleTimeString());

    if (now < canJoinFrom) {
      const minutesUntil = Math.floor((canJoinFrom.getTime() - now.getTime()) / 60000);
      return {
        allowed: false,
        message: `Interview starts in ${minutesUntil} minutes. You can join 30 minutes before the scheduled time.`
      };
    }

    if (now > mustStartBy) {
      const hoursLate = Math.floor((now.getTime() - mustStartBy.getTime()) / 3600000);
      return {
        allowed: false,
        message: `Interview time window has expired ${hoursLate > 0 ? `${hoursLate} hour(s) ago` : ''}. Please contact HR to reschedule.`
      };
    }

    return { allowed: true };
  };

  // Calculate time remaining in interview
  const calculateTimeRemaining = (): number => {
    if (!isStarted || startTime === 0) return duration * 60 * 1000;
    
    const elapsed = Date.now() - startTime;
    const remaining = (duration * 60 * 1000) - elapsed;
    return Math.max(0, remaining);
  };

  // Format time for display
  const formatTimeRemaining = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // AI speaks
  const speakText = async (text: string) => {
    return new Promise<void>((resolve) => {
      // Skip voice in video-only mode (no audio)
      if (interviewMode === 'video-only' || !synthRef.current || !isSpeakerEnabled) {
        resolve();
        return;
      }

      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1;

      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Female') ||
        v.name.includes('Samantha')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsAISpeaking(true);
      utterance.onend = () => {
        setIsAISpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  // Generate AI question using backend API
  const generateAIQuestion = async () => {
    setIsProcessing(true);

    try {
      console.log('≡ƒñû Calling backend API for AI-generated question...');
      
      // Collect previous answers for context
      const previousAnswers = messages
        .filter(m => m.sender === 'candidate')
        .map(m => m.text);

      // Call backend API to generate question
      const response = await fetch('/api/ai-interview/question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          candidateName,
          position,
          skillCategory,
          experienceLevel,
          resumeData: null, // TODO: Add resume data when available
          previousAnswers,
          questionNumber: questionCount,
          interviewPhase
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate question');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate question');
      }

      const { questionText, audioBase64 } = data.data;

      console.log('Γ£à Received AI-generated question:', questionText);

      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: questionText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isVoice: true
      };

      setMessages(prev => [...prev, aiMessage]);
      setCurrentQuestion(questionText);

      // Play audio from backend (base64 encoded)
      // Note: playAudioFromBase64 will automatically start listening when done
      if (audioBase64) {
        await playAudioFromBase64(audioBase64);
      } else {
        await speakText(questionText);
        // Only start listening if using fallback TTS
        setTimeout(() => startListening(), 500);
      }

      // Update question counts
      if (interviewPhase === 'behavioral') {
        setBehavioralQuestionsAsked(prev => prev + 1);
        
        // Switch to technical phase after 3 behavioral questions
        if (behavioralQuestionsAsked >= 2 && skillCategory === 'technical') {
          setTimeout(() => {
            setInterviewPhase('technical');
            const transitionMsg: Message = {
              id: Date.now().toString(),
              sender: 'ai',
              text: `Perfect! Now let's move to the technical part of the interview. I'll give you a coding problem to solve.`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              isVoice: true
            };
            setMessages(prev => [...prev, transitionMsg]);
            speakWithBackendAudio(transitionMsg.text);
          }, 3000);
        }
      }

    } catch (err) {
      console.error('Γ¥î Error generating question:', err);
      // Fallback to basic question if API fails
      const fallbackQuestion = `Can you tell me more about your experience with ${position}?`;
      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: fallbackQuestion,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isVoice: true
      };
      setMessages(prev => [...prev, aiMessage]);
      setCurrentQuestion(fallbackQuestion);
      await speakWithBackendAudio(fallbackQuestion);
      setTimeout(() => startListening(), 500);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio from base64 string
  const playAudioFromBase64 = async (base64Audio: string) => {
    try {
      setIsAISpeaking(true);
      console.log('≡ƒöè AI started speaking...');
      
      const audioBlob = base64ToBlob(base64Audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsAISpeaking(false);
          console.log('Γ£à AI finished speaking');
          
          // Automatically start listening after AI finishes speaking
          setTimeout(() => {
            console.log('≡ƒÄñ Auto-starting listening after AI speech...');
            startListening();
          }, 500);
          
          resolve();
        };
        audio.onerror = (err) => {
          setIsAISpeaking(false);
          reject(err);
        };
        audio.play().catch(err => {
          console.error('Failed to play audio:', err);
          setIsAISpeaking(false);
          reject(err);
        });
      });
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsAISpeaking(false);
      throw err;
    }
  };

  // Convert base64 to blob
  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Generate and play audio from backend (ALWAYS use this instead of browser TTS)
  const speakWithBackendAudio = async (text: string): Promise<void> => {
    try {
      console.log('≡ƒÄñ Generating audio from backend for:', text.substring(0, 50));
      
      // Call backend to generate audio
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      
      if (data.success && data.audioBase64) {
        await playAudioFromBase64(data.audioBase64);
      } else {
        // Fallback to browser TTS only if backend fails
        console.warn('ΓÜá∩╕Å Backend audio failed, using browser TTS as fallback');
        await speakText(text);
      }
    } catch (err) {
      console.error('Γ¥î Error generating backend audio:', err);
      // Fallback to browser TTS
      await speakText(text);
    }
  };

  // Start listening
  const startListening = () => {
    // Skip voice recognition in video-only mode (no audio)
    if (interviewMode === 'video-only') {
      console.log('≡ƒô╣ Video-only mode - skipping voice recognition');
      return;
    }
    
    if (!recognitionRef.current) {
      recognitionRef.current = initializeSpeechRecognition();
    }

    if (recognitionRef.current && isMicEnabled) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        console.log('≡ƒÄñ Started listening - REC indicator should show');
      } catch (err) {
        console.error('Failed to start listening:', err);
      }
    } else {
      console.log('ΓÜá∩╕Å Cannot start listening - mic disabled or recognition not ready');
    }
  };

  // Bulletproof audio restart system
  const restartListening = () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastListenAttempt;
    
    // Prevent rapid retry loops
    if (timeSinceLastAttempt < 1000) {
      console.log('🔄 Preventing rapid retry, waiting...');
      setTimeout(() => restartListening(), 1000);
      return;
    }
    
    // Increment retry count and update timing
    setAudioRetryCount(prev => prev + 1);
    setLastListenAttempt(now);
    setListeningState('recovering');
    
    console.log(`🔧 Bulletproof restart attempt ${audioRetryCount + 1}/5`);
    
    // After 3 failed attempts, try different approach
    if (audioRetryCount >= 3) {
      console.log('⚠️ Multiple audio failures, implementing fallback strategies');
      
      // Strategy 1: Offer text fallback after 3 attempts
      if (audioRetryCount === 3) {
        setShowTextFallback(true);
        const fallbackMessage: Message = {
          id: Date.now().toString(),
          text: "I'm having trouble hearing you consistently. I've enabled a text input option as a backup. You can either keep trying voice or type your response below.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: false
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
      
      // Strategy 2: After 5 attempts, force text mode temporarily
      if (audioRetryCount >= 5) {
        console.log('🛑 Forcing text mode temporarily due to persistent audio issues');
        setListeningState('failed');
        
        const forceTextMessage: Message = {
          id: Date.now().toString(),
          text: "I'm switching to text mode temporarily to ensure we can continue the interview smoothly. Please type your response below, and we'll try voice again for the next question.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: false
        };
        setMessages(prev => [...prev, forceTextMessage]);
        setShowTextFallback(true);
        
        // Reset retry count for next question
        setTimeout(() => {
          setAudioRetryCount(0);
          setListeningState('idle');
        }, 2000);
        return;
      }
    }
    
    // Try advanced recovery strategies
    setTimeout(async () => {
      try {
        // Strategy: Re-initialize speech recognition with fresh instance
        console.log('🎤 Creating fresh speech recognition instance...');
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {
            console.log('Previous recognition cleanup completed');
          }
        }
        
        // Clear all refs and states
        finalTranscriptRef.current = '';
        voiceCommandDetectionRef.current = false;
        setIsListening(false);
        
        // Initialize completely fresh recognition
        const newRecognition = initializeSpeechRecognition();
        if (newRecognition) {
          recognitionRef.current = newRecognition;
          console.log('✅ Fresh speech recognition created');
          
          // Try to start listening with the new instance
          setTimeout(() => {
            startListening();
          }, 500);
        } else {
          throw new Error('Speech recognition not available');
        }
        
      } catch (error) {
        console.error('❌ Advanced recovery failed:', error);
        
        // Last resort: Force text input
        setListeningState('failed');
        setShowTextFallback(true);
        
        const finalFallbackMessage: Message = {
          id: Date.now().toString(),
          text: "I'm having persistent audio issues on your device. Please use the text input below to continue with your response. We'll try to restore voice functionality for the next question.",
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: false
        };
        setMessages(prev => [...prev, finalFallbackMessage]);
      }
    }, 1500); // Give some breathing room between attempts
  };

  // Helper function to detect voice commands
  const detectVoiceCommands = (text: string): string | null => {
    const lowerText = text.toLowerCase().trim();
    
    // Stop recording commands
    if (lowerText.includes('stop recording') || lowerText.includes('that\'s it') || 
        lowerText.includes('i\'m done') || lowerText.includes('submit') ||
        lowerText.includes('end recording')) {
      return 'stop';
    }
    
    // Skip question commands  
    if (lowerText.includes('skip this') || lowerText.includes('next question') ||
        lowerText.includes('skip question') || lowerText.includes('pass')) {
      return 'skip';
    }
    
    // Repeat question commands
    if (lowerText.includes('repeat') || lowerText.includes('say again') ||
        lowerText.includes('what was the question')) {
      return 'repeat';
    }
    
    // Pause commands
    if (lowerText.includes('pause') || lowerText.includes('wait') ||
        lowerText.includes('hold on')) {
      return 'pause';
    }
    
    return null;
  };

  // Handle candidate response with AI validation
  const handleCandidateResponse = async (text: string) => {
    setIsListening(false);
    setIsProcessing(true);

    const candidateMessage: Message = {
      id: Date.now().toString(),
      sender: 'candidate',
      text,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isVoice: interviewMode !== 'video-only'
    };

    console.log('≡ƒÆ¼ Candidate message added:', candidateMessage);
    setMessages(prev => [...prev, candidateMessage]);

    try {
      // Validate answer quality using backend API
      console.log('≡ƒöì Validating answer quality...', {
        question: currentQuestion,
        answer: text.substring(0, 50),
        questionNumber: questionCount
      });
      
      // Get previous questions from messages
      const previousQuestions = messages
        .filter(m => m.sender === 'ai')
        .map(m => m.text);
      
      const validation = await fetch('/api/ai-interview/validate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: currentQuestion,
          answer: text,
          position: position,
          questionNumber: questionCount,
          previousQuestions: previousQuestions
        })
      });

      if (!validation.ok) {
        throw new Error('Failed to validate answer');
      }

      const validationData = await validation.json();
      const analysis = validationData.data;

      console.log('≡ƒôè Answer evaluation:', {
        quality: analysis.quality,
        score: analysis.qualityScore,
        followUpType: analysis.followUpType
      });

      // Use the AI-generated professional response
      const aiResponseText = analysis.aiResponseText || analysis.professionalResponse || 
        analysis.suggestedFollowUp || analysis.responsePhrase || 
        "Thank you. Let's continue.";

      // Add AI response to messages
      const aiResponse: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isVoice: true
      };

      setMessages(prev => [...prev, aiResponse]);
      
      // Use pre-generated audio if available, otherwise generate on-the-fly
      if (analysis.followUpAudio) {
        console.log('≡ƒÄ╡ Using pre-generated audio from backend');
        await playAudioFromBase64(analysis.followUpAudio);
      } else {
        await speakWithBackendAudio(aiResponseText);
      }
      
      // Note: playAudioFromBase64 will auto-start listening after audio ends

      // Decide next action based on evaluation
      if (analysis.needsFollowUp && analysis.followUpType !== 'next-topic') {
        // Ask follow-up, don't increment question count
        console.log(`≡ƒöä Follow-up needed (${analysis.followUpType})`);
        // Listening will start automatically after AI speaks
      } else {
        // Move to next question
        console.log('Γ£à Answer complete, moving to next question');
        setQuestionCount(prev => prev + 1);
        
        if (questionCount + 1 < 5) {
          setTimeout(() => generateAIQuestion(), 2000);
        } else {
          completeInterview();
        }
      }

    } catch (err) {
      console.error('Γ¥î Error validating answer:', err);
      // Fallback: just move to next question
      setQuestionCount(prev => prev + 1);
      
      if (questionCount + 1 < 5) {
        setTimeout(() => generateAIQuestion(), 2000);
      } else {
        completeInterview();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Run code
  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      alert('Code executed! (In production, this would run on backend)');
    }, 1500);
  };

  // Start interview with time validation
  const handleStartInterview = async () => {
    // Validate time window
    const validation = validateTimeWindow();
    
    if (!validation.allowed) {
      console.error('ΓÅ░ Time window validation failed:', validation.message);
      setTimeValidationError(validation.message || 'Interview cannot start at this time');
      if (onError) {
        onError(validation.message || 'Interview cannot start at this time');
      }
      return;
    }

    console.log('Γ£à Time window validation passed');
    setTimeValidationError(null);
    setIsStarted(true);
    setStartTime(Date.now());
    
    setTimeout(async () => {
      await initializeMedia();
    }, 100);
    
    setTimeout(() => generateAIQuestion(), 1500);
  };

  // Complete interview
  const completeInterview = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (testMediaStream) {
      testMediaStream.getTracks().forEach(track => track.stop());
    }
    if (synthRef.current) synthRef.current.cancel();

    const result: InterviewResult = {
      interviewId,
      duration: Date.now() - startTime,
      transcript: messages,
      codeSubmissions: [{ code, language, timestamp: Date.now() }]
    };

    onComplete(result);
  };

  // Format time
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Time management - update time remaining and auto-end
  useEffect(() => {
    if (!isStarted || startTime === 0) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning at 5 minutes remaining
      if (remaining <= 5 * 60 * 1000 && remaining > 4 * 60 * 1000 && !isTimeWarningShown) {
        setIsTimeWarningShown(true);
        console.warn('ΓÅ░ 5 minutes remaining!');
        
        const warningMsg: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: 'Just a heads up - we have about 5 minutes left in the interview.',
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: true
        };
        setMessages(prev => [...prev, warningMsg]);
        speakWithBackendAudio(warningMsg.text);
      }

      // Auto-end interview when time runs out
      if (remaining <= 0) {
        console.log('ΓÅ░ Time expired - ending interview');
        clearInterval(interval);
        
        const endMsg: Message = {
          id: Date.now().toString(),
          sender: 'ai',
          text: "Time's up! Thank you for completing the interview. Your responses have been recorded.",
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          isVoice: true
        };
        setMessages(prev => [...prev, endMsg]);
        speakWithBackendAudio(endMsg.text).then(() => {
          setTimeout(() => completeInterview(), 2000);
        });
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isStarted, startTime, isTimeWarningShown]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
      if (recognitionRef.current) recognitionRef.current.stop();
      if (synthRef.current) synthRef.current.cancel();
    };
  }, [mediaStream]);

  // Show test page FIRST (mode is already selected from parent)
  if (showTestPage) {
    return (
      <CameraMicTest
        candidateName={candidateName}
        position={position}
        interviewMode={interviewMode}
        onTestComplete={(stream: MediaStream) => {
          console.log('Γ£à Test complete, received stream:', stream, 'Mode:', interviewMode);
          setTestMediaStream(stream);
          setShowTestPage(false);
          
          // Set media states based on mode
          if (interviewMode === 'audio-only') {
            setIsVideoEnabled(false);
          } else if (interviewMode === 'video-only') {
            setIsMicEnabled(false);
          }
          
          // Initialize interview with time validation
          setTimeout(async () => {
            // Validate time window before starting
            const validation = validateTimeWindow();
            
            if (!validation.allowed) {
              console.error('ΓÅ░ Time window validation failed:', validation.message);
              setTimeValidationError(validation.message || 'Interview cannot start at this time');
              if (onError) {
                onError(validation.message || 'Interview cannot start at this time');
              }
              return;
            }

            console.log('Γ£à Time window validation passed');
            setTimeValidationError(null);
            setIsStarted(true);
            setStartTime(Date.now());
            await initializeMedia(stream);
            setTimeout(() => generateAIQuestion(), 1500);
          }, 100);
        }}
      />
    );
  }

  // Main interview screen
  return (
    <div className="fixed inset-0 flex flex-col bg-white z-50">
      {/* Header */}
      {/* Main Header Container */}
<div className="bg-slate-900 border-b border-slate-700/50 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-lg">
  
  {/* Left Section - Branding */}
  <div className="flex items-center gap-3">
    <div className="relative group">
      {/* Hire Mind Logo */}
      <div className="flex items-baseline space-x-0.5 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-lg group-hover:blur-xl transition-all"></div>
        <div className="relative w-1.5 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm group-hover:h-7 transition-all shadow-md shadow-blue-500/50"></div>
        <div className="relative w-1.5 h-7 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm shadow-md shadow-purple-500/50"></div>
        <div className="relative w-1.5 h-5 bg-gradient-to-b from-blue-300 to-blue-500 rounded-sm group-hover:h-6 transition-all shadow-md shadow-blue-400/50"></div>
      </div>
      <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900 animate-pulse"></div>
    </div>
    
    <div className="border-l border-slate-700/50 pl-3">
      <div className="flex items-baseline space-x-1">
        <span className="text-[10px] font-bold text-blue-400 tracking-wider">HIRE</span>
        <span className="text-sm font-bold text-white tracking-tight">Mind</span>
      </div>
      <p className="text-[10px] text-slate-400 mt-0.5">AIRA Interview</p>
    </div>
  </div>

  {/* Center Section - Position */}
  <div className="flex-1 flex justify-center px-4">
    <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 px-5 py-2 rounded-lg backdrop-blur-sm shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
        <p className="text-white text-sm font-semibold tracking-wide">{position}</p>
      </div>
    </div>
  </div>

  {/* Right Section - Timer & Actions */}
  <div className="flex items-center gap-3">
    {/* Timer Component - Compact */}
    <div className="relative px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md bg-slate-800/60 border border-slate-600/30 shadow-lg shadow-slate-900/40 overflow-hidden group transition-all duration-300 hover:border-cyan-400/50 hover:shadow-cyan-500/20">
  
  {/* Animated Glow Line */}
  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 animate-pulse"></div>
  
  {/* Icon Wrapper */}
  <div className="relative z-10">
    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-inner shadow-cyan-500/20 ring-1 ring-cyan-400/20">
      <svg
        className="w-3.5 h-3.5 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="10" />
        <path strokeLinecap="round" d="M12 6v6l4 2" />
      </svg>
    </div>
  </div>

  {/* Timer Text */}
  <div className="relative z-10 flex flex-col">
    <span className={`font-mono text-sm font-semibold tracking-tight ${
      timeRemaining <= 5 * 60 * 1000 ? 'text-red-400 animate-pulse' : 'text-cyan-300'
    }`}>
      {formatTimeRemaining(timeRemaining)}
    </span>
    <span className="text-[9px] text-slate-400 -mt-0.5">remaining</span>
  </div>
</div>
    {/* End Interview Button */}
    <button 
      onClick={completeInterview}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
    >
      End Interview
    </button>
  </div>
</div>

      {/* Main Content - Different layouts based on interview phase and coding round */}
      {interviewPhase === 'technical' && skillCategory === 'technical' && hasCodingRound ? (
        /* TECHNICAL INTERVIEW LAYOUT - 3 columns (Code Editor) */
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Code Editor */}
          <div className="w-1/2 flex flex-col bg-[#1e1e1e] border-r border-gray-300 overflow-hidden">
            {/* Editor Header */}
            <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <span className="text-gray-300 text-sm font-medium">Code Editor</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-[#3c3c3c] text-gray-300 text-sm px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                title="Run (Ctrl/Cmd + Enter)"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded flex items-center space-x-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run</span>
                  </>
                )}
              </button>
            </div>

            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={(editor, monaco) => {
                  try {
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => handleRunCode());
                  } catch {}
                }}
                theme="vs-dark"
                loading={
                  <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
                    <div className="text-gray-400 flex flex-col items-center gap-3">
                      <Loader className="w-8 h-8 animate-spin" />
                      <span className="text-sm">Loading editor...</span>
                    </div>
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                }}
              />
            </div>
          </div>

          {/* Middle: Problem Statement */}
        <div className="w-1/4 flex flex-col bg-gradient-to-r from-purple-50 to-blue-50 border-l border-r border-gray-300">
          <div className="flex-1 overflow-y-auto p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-1 h-6 bg-purple-600 rounded-full mr-3"></span>
              Palindrome Checker (Two Part)
            </h3>
            
            <div className="text-gray-700 text-sm space-y-4 leading-relaxed">
                <div className="bg-white/80 p-4 rounded-lg border-l-4 border-purple-500 shadow-sm">
                  <p className="text-gray-800">A palindrome is a word or phrase that reads the same backward as forward, ignoring spaces, non-alphanumeric characters, and case.</p>
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs font-semibold text-purple-700">Examples:</span>
                    <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">"madam"</code>
                    <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-mono">"racecar"</code>
                  </div>
                </div>
                
                {/* Part 1 */}
                <details className="bg-white/90 rounded-lg border border-purple-200 shadow-md" open>
                  <summary className="cursor-pointer p-4 font-bold text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
                      Part 1: Palindrome Checker
                    </span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    <p className="text-gray-700">Write a function that checks if a given string is a palindrome. Return the answer as a boolean.</p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 relative">
                      <button
                        onClick={() => navigator.clipboard.writeText('is_palindrome("madam")')}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 rounded px-2 py-1 text-xs flex items-center space-x-1 shadow-sm"
                        title="Copy example"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Example:</p>
                      <code className="block bg-gray-800 text-green-400 px-3 py-2 rounded text-xs font-mono">
                        is_palindrome(<span className="text-yellow-300">"madam"</span>) ΓåÆ <span className="text-blue-300">True</span>
                      </code>
                    </div>
                  </div>
                </details>
                
                {/* Part 2 */}
                <details className="bg-white/90 rounded-lg border border-purple-200 shadow-md" open>
                  <summary className="cursor-pointer p-4 font-bold text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-between">
                    <span className="flex items-center">
                      <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
                      Part 2: Palindrome Checker with Removal
                    </span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </summary>
                  <div className="p-4 pt-0 space-y-2">
                    <p className="text-gray-700">Write a function that checks if a given string can be made into a palindrome by removing at most one character. Return the answer as a boolean.</p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 relative">
                      <button
                        onClick={() => navigator.clipboard.writeText('can_be_palindrome("race a car")\ncan_be_palindrome("racecar")')}
                        className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 border border-gray-200 rounded px-2 py-1 text-xs flex items-center space-x-1 shadow-sm"
                        title="Copy examples"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                      <p className="text-xs font-semibold text-gray-600 mb-2">Example:</p>
                      <code className="block bg-gray-800 text-green-400 px-3 py-2 rounded text-xs font-mono">
                        can_be_palindrome(<span className="text-yellow-300">"race a car"</span>) ΓåÆ <span className="text-blue-300">False</span><br/>
                        can_be_palindrome(<span className="text-yellow-300">"racecar"</span>) ΓåÆ <span className="text-blue-300">True</span>
                      </code>
                    </div>
                  </div>
                </details>
            </div>
          </div>
        </div>

        {/* Right: Camera + AIRA + Chat (25%) */}
        <div className="w-1/4 flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          {/* Top: Camera + AIRA in Same Row (Sticky) */}
          <div className="shrink-0 sticky top-0 z-10 p-3 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex gap-2">
              {/* Your Video Feed - Compact */}
              <div className="relative bg-black rounded-lg overflow-hidden shadow-md" style={{ width: '110px', height: '82px', flexShrink: 0 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <VideoOff className="w-12 h-12 text-gray-500" />
                  </div>
                )}
                
                {/* Recording Indicator - Always REC during interview */}
                <div className={`absolute top-1 left-1 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center shadow-lg z-50 ${
                  isListening ? 'bg-red-600 animate-pulse' : 'bg-red-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    isListening ? 'bg-white animate-pulse' : 'bg-white'
                  }`}></div>
                  REC
                </div>
                
                {/* Controls - Compact */}
                <div className="absolute bottom-1 left-0 right-0 flex justify-center space-x-1">
                  <button
                    onClick={() => {
                      if (mediaStream) {
                        mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
                        setIsMicEnabled(!isMicEnabled);
                      }
                    }}
                    className={`p-1.5 rounded-full transition-all shadow-md ${isMicEnabled ? 'bg-gray-800/80 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                    title={isMicEnabled ? 'Mute' : 'Unmute'}
                  >
                    {isMicEnabled ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-white" />}
                  </button>
                  <button
                    onClick={() => {
                      if (mediaStream) {
                        mediaStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
                        setIsVideoEnabled(!isVideoEnabled);
                      }
                    }}
                    className={`p-1.5 rounded-full transition-all shadow-md ${isVideoEnabled ? 'bg-gray-800/80 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                    title={isVideoEnabled ? 'Camera Off' : 'Camera On'}
                  >
                    {isVideoEnabled ? <Video className="w-3 h-3 text-white" /> : <VideoOff className="w-3 h-3 text-white" />}
                  </button>
                </div>
                
                {/* Recording indicator */}
                {isListening && (
                  <div className="absolute top-0.5 left-0.5 bg-red-600 text-white px-1 py-0.5 rounded text-[10px] font-bold flex items-center shadow-md">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse mr-0.5"></div>
                    REC
                  </div>
                )}
              </div>
              
{/* AIRA Avatar - Premium Elegant Design */}
<div className="flex-1 relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl overflow-hidden shadow-xl p-3 border border-slate-600/20">
  {/* Sophisticated Ambient Glow */}
  <div className="absolute inset-0 opacity-20">
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent animate-pulse"></div>
  </div>
  
  <div className="relative flex items-center gap-3.5">
    {/* Premium Avatar with Multi-Layer Effects */}
    <div className="relative group">
      {/* Outer Glow Container */}
      <div className={`w-12 h-12 bg-gradient-to-br from-white via-slate-50 to-slate-100 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 ease-out ${
        isAISpeaking 
          ? 'ring-[3px] ring-emerald-400/50 ring-offset-[3px] ring-offset-slate-700/40 scale-110 shadow-emerald-500/40' 
          : 'shadow-slate-900/60 hover:scale-105 hover:shadow-emerald-400/20'
      }`}>
        {/* Inner Avatar Circle */}
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
          <svg className="w-5.5 h-5.5 text-white drop-shadow-lg relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
      </div>
      
      {/* Animated Pulse Rings when Speaking */}
      {isAISpeaking && (
        <>
          <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/70 animate-ping"></div>
          <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 animate-pulse" style={{ animationDuration: '2s' }}></div>
        </>
      )}
      
      {/* Subtle Breathing Effect when Idle */}
      {!isAISpeaking && !isListening && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-400/5 to-teal-400/5 animate-pulse" style={{ animationDuration: '3s' }}></div>
      )}
    </div>
    
    {/* Status Information Section */}
    <div className="flex-1 min-w-0">
      {/* Header with Live Badge */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-white font-semibold text-base tracking-tight">AIRA</h3>
        {isAISpeaking && (
          <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-[9px] font-bold uppercase tracking-wider shadow-sm">
            Live
          </span>
        )}
      </div>
      
      {/* Dynamic Status Indicators */}
      <div className="flex items-center gap-2">
        {/* Speaking State */}
        {isAISpeaking && (
          <>
            <div className="flex items-end space-x-0.5 bg-slate-800/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-700/50">
              <div className="w-0.5 h-2.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
              <div className="w-0.5 h-4 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-0.5 h-3 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" style={{ animationDelay: '0.3s' }}></div>
              <div className="w-0.5 h-4 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" style={{ animationDelay: '0.45s' }}></div>
              <div className="w-0.5 h-2.5 bg-gradient-to-t from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" style={{ animationDelay: '0.6s' }}></div>
            </div>
            <span className="text-emerald-300 text-xs font-medium tracking-wide">Speaking...</span>
          </>
        )}
        
        {/* Listening State */}
        {isListening && !isAISpeaking && (
          <>
            <div className="relative flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/60"></div>
              <div className="absolute inset-0 w-2 h-2 bg-emerald-400/40 rounded-full animate-ping"></div>
            </div>
            <span className="text-emerald-300 text-xs font-medium tracking-wide">Listening...</span>
          </>
        )}
        
        {/* Idle State */}
        {!isAISpeaking && !isListening && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full shadow-sm"></div>
            <span className="text-slate-400 text-xs font-light tracking-wide">Ready to assist</span>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
            </div>
          </div>

          {/* Bottom: Chat Messages - Modern Theme */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-slate-50/50 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ scrollBehavior: 'smooth' }}>
  {messages.map((msg, index) => (
    <div
      key={msg.id}
      className={`flex ${msg.sender === 'candidate' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-500`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Message Bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${
          msg.sender === 'ai'
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-slate-800 border border-emerald-200/50 rounded-tl-sm'
            : 'bg-white text-slate-800 border border-slate-200 hover:border-slate-300 rounded-tr-sm'
        }`}
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`font-semibold text-[10px] uppercase tracking-widest ${
            msg.sender === 'ai' ? 'text-emerald-700' : 'text-slate-600'
          }`}>
            {msg.sender === 'ai' ? 'AIRA' : 'YOU'}
          </span>
          <span className="text-[9px] text-slate-400">
            {msg.timestamp}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-700">
          {msg.text}
        </p>
      </div>
    </div>
  ))}
  
  {/* AI Speaking Indicator - Only show in voice modes */}
  {isAISpeaking && interviewMode !== 'video-only' && (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-3 bg-emerald-600 rounded-full animate-pulse"></div>
          <div className="w-1 h-4 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-3.5 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          <div className="w-1 h-4 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
        </div>
        <span className="text-sm font-medium text-emerald-700">Speaking...</span>
      </div>
    </div>
  )}
  
  {/* AI Thinking Indicator */}
  {isProcessing && (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5 shadow-sm">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <span className="text-sm text-slate-700 font-medium">Thinking...</span>
      </div>
    </div>
  )}
  
  <div ref={messagesEndRef} />
</div>

            {/* Text Input Area - For Video-Only Mode */}
            {interviewMode === 'video-only' && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your response here..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleCandidateResponse(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleCandidateResponse(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {/* Voice Status Indicator - For Voice Modes */}
            {interviewMode !== 'video-only' && (
              <div className="border-t border-gray-200 p-3 bg-white">
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  {isListening && (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-full shadow-md animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                      <Mic className="w-3.5 h-3.5 text-white" />
                      <span className="text-white font-semibold text-xs">Listening...</span>
                    </div>
                  )}
                  {isAISpeaking && (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-500 px-3 py-2 rounded-full shadow-md">
                      <Volume2 className="w-3.5 h-3.5 text-white animate-pulse" />
                      <span className="text-white font-semibold text-xs">Speaking...</span>
                    </div>
                  )}
                  {!isListening && !isAISpeaking && !isProcessing && (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-2 rounded-full shadow-md">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      <span className="text-white font-semibold text-xs">Ready to talk</span>
                    </div>
                  )}
                  <p className="text-center text-[10px] text-gray-400 mt-1">
                    ≡ƒÆ¼ Voice conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      ) : (
        /* NON-TECHNICAL INTERVIEW LAYOUT - 50/50 split */
        <div className="flex-1 flex overflow-hidden bg-white">
          {/* Left: Video + AIRA (50%) */}
          <div className="w-1/2 flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 border-r border-gray-300">
            {/* Video Section */}
            <div className="flex-1 flex flex-col p-6">
              {/* Your Video Feed - Large */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl mb-4" style={{ height: '60%' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <VideoOff className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400">Camera is off</p>
                    </div>
                  </div>
                )}
                
                {/* Recording Indicator - Always REC during interview */}
                <div className={`absolute top-3 left-3 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-lg z-50 ${
                  isListening ? 'bg-red-600 animate-pulse' : 'bg-red-500'
                }`}>
                  <div className={`w-2 h-2 rounded-full mr-1.5 ${
                    isListening ? 'bg-white animate-pulse' : 'bg-white'
                  }`}></div>
                  REC
                </div>
                
                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-3">
                  <button
                    onClick={() => {
                      if (mediaStream) {
                        mediaStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
                        setIsMicEnabled(!isMicEnabled);
                      }
                    }}
                    className={`p-4 rounded-full transition-all shadow-lg ${isMicEnabled ? 'bg-gray-800/80 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {isMicEnabled ? <Mic className="w-6 h-6 text-white" /> : <MicOff className="w-6 h-6 text-white" />}
                  </button>
                  <button
                    onClick={() => {
                      if (mediaStream) {
                        mediaStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
                        setIsVideoEnabled(!isVideoEnabled);
                      }
                    }}
                    className={`p-4 rounded-full transition-all shadow-lg ${isVideoEnabled ? 'bg-gray-800/80 hover:bg-gray-700' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6 text-white" /> : <VideoOff className="w-6 h-6 text-white" />}
                  </button>
                </div>
              </div>

              {/* AIRA Avatar - Large Card */}
              <div className="relative bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 rounded-2xl overflow-hidden shadow-xl p-6" style={{ height: '35%' }}>
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
                </div>
                
                <div className="relative flex items-center gap-4 h-full">
                  <div className="relative">
                    <div className={`w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
                      isAISpeaking ? 'ring-4 ring-blue-400/40 ring-offset-4 ring-offset-slate-600/50 scale-110' : ''
                    }`}>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-600 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      </div>
                    </div>
                    {isAISpeaking && (
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400/60 animate-ping"></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-white font-bold text-3xl mb-2">AIRA</h2>
                    <div className="flex items-center gap-2">
                      {isAISpeaking && (
                        <>
                          <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-4 bg-blue-300/90 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-6 bg-blue-300/90 rounded-full animate-pulse" style={{ animationDelay: '0.15s' }}></div>
                            <div className="w-1.5 h-5 bg-blue-300/90 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                            <div className="w-1.5 h-6 bg-blue-300/90 rounded-full animate-pulse" style={{ animationDelay: '0.45s' }}></div>
                          </div>
                          <span className="text-white text-lg font-medium">Speaking...</span>
                        </>
                      )}
                      {isListening && !isAISpeaking && (
                        <>
                          <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-white text-lg font-medium">Listening...</span>
                        </>
                      )}
                      {!isAISpeaking && !isListening && (
                        <span className="text-slate-300 text-lg">AI Interview Assistant</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Chat + Questions (50%) */}
          <div className="w-1/2 flex flex-col bg-white">
            {/* Current Question */}
            <div className="shrink-0 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Current Question</h3>
              <div className="bg-white/80 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
                <p className="text-gray-800 text-base leading-relaxed">
                  {currentQuestion || 'Please introduce yourself and tell me about your background, experience, and what makes you a good fit for this position.'}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gradient-to-br from-gray-50 via-white to-slate-50/50">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'candidate' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`max-w-[85%] group flex items-start gap-3 ${msg.sender === 'candidate' ? 'flex-row-reverse' : ''}`}>
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                      msg.sender === 'ai' ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-slate-400 to-slate-500'
                    }`}>
                      {msg.sender === 'ai' ? (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className={`rounded-2xl px-5 py-4 shadow-sm ${
                        msg.sender === 'ai'
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-tl-sm'
                          : 'bg-white border border-slate-200 rounded-tr-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`font-semibold text-xs uppercase tracking-widest ${
                            msg.sender === 'ai' ? 'text-emerald-700' : 'text-slate-600'
                          }`}>
                            {msg.sender === 'ai' ? 'AIRA' : 'YOU'}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>
                        <p className="text-base leading-relaxed text-slate-700">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isAISpeaking && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                      <Volume2 className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-4 bg-emerald-600 rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-5 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-1.5 h-4.5 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        <div className="w-1.5 h-5 bg-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                      </div>
                      <span className="text-base font-medium text-emerald-700">Speaking...</span>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
                      <Loader className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-3">
                      <div className="flex space-x-2">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"></div>
                        <div className="w-2.5 h-2.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-base text-slate-700 font-medium">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Text Input or Status Indicator */}
            <div className="border-t border-gray-200 p-4 bg-white">
              {interviewMode === 'video-only' ? (
                /* Text Input for Video-Only Mode */
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Type your response here..."
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleCandidateResponse(e.currentTarget.value.trim());
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleCandidateResponse(input.value.trim());
                        input.value = '';
                      }
                    }}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                  >
                    Send
                  </button>
                </div>
              ) : (
                /* Voice Status Indicator */
                <div className="flex flex-col items-center justify-center space-y-2">
                  {isListening && (
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 rounded-full shadow-lg animate-pulse">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                      <Mic className="w-5 h-5 text-white" />
                      <span className="text-white font-semibold text-sm">Listening...</span>
                    </div>
                  )}
                  {isAISpeaking && (
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-purple-600 to-purple-500 px-5 py-3 rounded-full shadow-lg">
                      <Volume2 className="w-5 h-5 text-white animate-pulse" />
                      <span className="text-white font-semibold text-sm">Speaking...</span>
                    </div>
                  )}
                  {!isListening && !isAISpeaking && !isProcessing && (
                    <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-3 rounded-full shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span className="text-white font-semibold text-sm">Ready to talk</span>
                    </div>
                  )}
                  <p className="text-center text-xs text-gray-500 mt-2">
                    ≡ƒÆ¼ Voice conversation - Speak naturally
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Powered by footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-2 text-center">
        <p className="text-gray-400 text-xs">Powered by <span className="text-purple-400 font-semibold">Hire Mind</span></p>
      </div>
    </div>
  );
}            
