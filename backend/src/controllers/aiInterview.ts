import { Request, Response } from 'express';
import { generateInterviewQuestion, scoreInterview, evaluateAnswer, model } from '../services/geminiService';
import { generateSpeechWithPreset } from '../services/ttsService';
import { generateHumanLikeSpeech, generateFollowUpQuestion, generateOpeningGreeting } from '../services/enhancedTTSService';
import { calculateThinkingDelay, sleep, getThinkingMessage } from '../utils/responseDelayManager';

/**
 * Generate next interview question
 * POST /api/ai-interview/question
 */
export async function generateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const {
      candidateName,
      position,
      skillCategory,
      experienceLevel,
      resumeData,
      previousAnswers = [],
      previousQuestions = [],
      questionNumber = 0,
      interviewPhase = 'behavioral'
    } = req.body;

    // Validate required fields
    if (!candidateName || !position || !skillCategory || !experienceLevel) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateName, position, skillCategory, experienceLevel'
      });
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 Generating question #${questionNumber} for ${candidateName}`);

    // Generate question using Gemini
    const questionText = await generateInterviewQuestion({
      candidateName,
      position,
      skillCategory,
      experienceLevel,
      resumeData,
      previousAnswers,
      previousQuestions, // Pass previous questions to prevent repetition
      questionNumber,
      interviewPhase
    });

    // Generate speech with human-like qualities
    let audioBuffer: Buffer;
    if (questionNumber === 0) {
      // Opening greeting with warmth
      audioBuffer = await generateOpeningGreeting(candidateName, position);
    } else {
      // Regular question with natural flow
      audioBuffer = await generateHumanLikeSpeech({
        text: questionText,
        emotionalContext: {
          questionType: interviewPhase as 'technical' | 'behavioral',
          candidateEmotion: 'neutral'
        },
        previousContext: previousAnswers[previousAnswers.length - 1],
        addHumanization: true,
        addNaturalPauses: true,
        variableSpeed: true
      });
    }

    // Convert buffer to base64 for easy transmission
    const audioBase64 = audioBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        questionText,
        audioBase64,
        audioFormat: 'mp3',
        questionNumber,
        interviewPhase
      }
    });

  } catch (error: any) {
    console.error('❌ Error generating question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate question',
      message: error.message
    });
  }
}

/**
 * Score completed interview
 * POST /api/ai-interview/score
 */
export async function scoreInterviewEndpoint(req: Request, res: Response): Promise<void> {
  try {
    const {
      interviewId,
      transcript,
      codeSubmissions = [],
      position,
      skillCategory,
      problemSolved = false
    } = req.body;

    // Validate required fields
    if (!interviewId || !transcript || !position || !skillCategory) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: interviewId, transcript, position, skillCategory'
      });
      return;
    }

    console.log(`📊 Scoring interview ${interviewId}`);

    // Score interview using Gemini
    const score = await scoreInterview({
      transcript,
      codeSubmissions,
      position,
      skillCategory,
      problemSolved
    });

    res.json({
      success: true,
      data: {
        interviewId,
        score
      }
    });

  } catch (error: any) {
    console.error('❌ Error scoring interview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to score interview',
      message: error.message
    });
  }
}

/**
 * Get AI response to candidate's answer (for follow-up)
 * POST /api/ai-interview/respond
 */
export async function respondToAnswer(req: Request, res: Response): Promise<void> {
  try {
    const {
      candidateAnswer,
      context
    } = req.body;

    if (!candidateAnswer || !context) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateAnswer, context'
      });
      return;
    }

    // Add candidate's answer to previous answers
    const previousAnswers = [...(context.previousAnswers || []), candidateAnswer];

    // Generate follow-up question
    const questionText = await generateInterviewQuestion({
      ...context,
      previousAnswers,
      questionNumber: context.questionNumber + 1
    });

    // Generate speech
    const audioBuffer = await generateSpeechWithPreset(questionText, 'AIRA_PROFESSIONAL');
    const audioBase64 = audioBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        questionText,
        audioBase64,
        audioFormat: 'mp3'
      }
    });

  } catch (error: any) {
    console.error('❌ Error responding to answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      message: error.message
    });
  }
}

/**
 * Validate candidate's answer quality and get smart follow-up
 * POST /api/ai-interview/validate-answer
 */
export async function validateAnswer(req: Request, res: Response): Promise<void> {
  try {
    const { 
      question, 
      answer, 
      position, 
      questionNumber,
      previousQuestions = []
    } = req.body;

    console.log('🔍 Evaluating answer:', { 
      question: question?.substring(0, 50), 
      answer: answer?.substring(0, 50),
      questionNumber 
    });

    if (!question || !answer || !position) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: question, answer, position'
      });
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Evaluating answer #${questionNumber} for ${position}`);

    // Calculate realistic thinking delay
    const thinkingDelay = calculateThinkingDelay({
      answerLength: answer.length,
      answerQuality: undefined, // Will be determined after evaluation
      questionType: 'behavioral',
      complexity: 'medium'
    });

    console.log(`⏱️ Adding ${Math.round(thinkingDelay / 1000)}s thinking delay for realism...`);

    // Add realistic delay (AIRA is "thinking")
    await sleep(thinkingDelay);

    // Evaluate answer using smart AI evaluation
    const evaluation = await evaluateAnswer(question, answer, {
      position,
      questionNumber,
      previousQuestions
    });

    console.log('📊 Answer evaluation:', evaluation);
    console.log(`   Quality: ${evaluation.quality} (${evaluation.score}/100)`);
    console.log(`   Needs Follow-up: ${evaluation.needsFollowUp ? 'Yes' : 'No'}`);
    if (evaluation.suggestedFollowUp) {
      console.log(`   Follow-up: ${evaluation.suggestedFollowUp.substring(0, 80)}...`);
    }

    // Use professional AI-generated response
    let aiResponseText = '';
    
    // Priority 1: Use the professional response from AI evaluation
    if (evaluation.professionalResponse) {
      aiResponseText = evaluation.professionalResponse;
    } 
    // Priority 2: Use suggested follow-up if available
    else if (evaluation.suggestedFollowUp) {
      aiResponseText = `${evaluation.acknowledgment || 'I see.'} ${evaluation.suggestedFollowUp}`;
    } 
    // Priority 4: Fallback based on quality score
    else {
      if (evaluation.score >= 90) {
        aiResponseText = "Excellent! That's exactly the kind of insight I was looking for. Let's move forward.";
      } else if (evaluation.score >= 75) {
        aiResponseText = "Great answer! I appreciate the detail you provided. Let's continue.";
      } else if (evaluation.score >= 60) {
        aiResponseText = "Good. Thank you for sharing that perspective.";
      } else if (evaluation.score >= 40) {
        aiResponseText = "I see. Could you elaborate a bit more on that?";
      } else {
        aiResponseText = "I understand. Let's explore this from a different angle.";
      }
    }

    // Generate human-like speech with emotional intelligence
    console.log('🎤 Generating human-like response with emotional tone...');
    const audioBuffer = await generateHumanLikeSpeech({
      text: aiResponseText,
      emotionalContext: {
        answerQuality: evaluation.quality as 'excellent' | 'good' | 'average' | 'poor',
        questionType: 'behavioral',
        candidateEmotion: evaluation.score < 50 ? 'nervous' : 'confident'
      },
      previousContext: answer.substring(0, 150),
      addHumanization: true,
      addNaturalPauses: true,
      variableSpeed: true
    });

    const followUpAudio = audioBuffer.toString('base64');

    res.json({
      success: true,
      data: {
        quality: evaluation.quality,
        qualityScore: evaluation.score,
        feedback: evaluation.feedback,
        needsFollowUp: evaluation.needsFollowUp,
        followUpType: evaluation.followUpType,
        suggestedFollowUp: evaluation.suggestedFollowUp,
        acknowledgment: evaluation.acknowledgment,
        professionalResponse: evaluation.professionalResponse,
        aiResponseText,
        followUpAudio,
        // Legacy fields for compatibility
        isComplete: evaluation.quality === 'excellent' || evaluation.quality === 'good',
        responsePhrase: getResponsePhrase(evaluation.quality)
      }
    });

  } catch (error: any) {
    console.error('❌ Error evaluating answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate answer',
      message: error.message
    });
  }
}

/**
 * Get appropriate response phrase based on answer quality
 */
function getResponsePhrase(quality: string): string {
  const phrases = {
    excellent: ['Excellent insight!', 'That\'s a great answer!', 'Very well explained!'],
    good: ['Good answer!', 'That makes sense!', 'I appreciate that perspective!'],
    average: ['I see.', 'Okay, interesting.', 'That\'s one approach.'],
    poor: ['I understand.', 'Okay.', 'Let me ask you something else.']
  };
  
  const options = phrases[quality as keyof typeof phrases] || phrases.average;
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Health check for AI services
 * GET /api/ai-interview/health
 */
export async function healthCheck(req: Request, res: Response) {
  try {
    // Test Gemini
    const testQuestion = await generateInterviewQuestion({
      candidateName: 'Test',
      position: 'Test Position',
      skillCategory: 'technical',
      experienceLevel: 'mid',
      previousAnswers: [],
      questionNumber: 0,
      interviewPhase: 'behavioral'
    });

    // Test TTS
    const testAudio = await generateSpeechWithPreset('Test', 'AIRA_PROFESSIONAL');

    res.json({
      success: true,
      data: {
        gemini: testQuestion ? 'OK' : 'FAIL',
        tts: testAudio.length > 0 ? 'OK' : 'FAIL',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'AI services health check failed',
      message: error.message
    });
  }
}

export default {
  generateQuestion,
  scoreInterviewEndpoint,
  respondToAnswer,
  validateAnswer,
  healthCheck
};
