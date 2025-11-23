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
      interviewPhase = 'behavioral',
      invitationToken // Add support for invitation token to fetch resume data
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

    // Ensure we don't repeat questions - use the highest count for progression
    const actualQuestionNumber = Math.max(questionNumber || 0, previousQuestions.length, previousAnswers.length);
    const actualInterviewPhase = actualQuestionNumber === 0 ? 'behavioral' : 
                                actualQuestionNumber < 3 ? 'behavioral' : 'technical';
    
    console.log(`📊 Question tracking: requestedNumber=${questionNumber}, previousQs=${previousQuestions.length}, previousAs=${previousAnswers.length}, actualNumber=${actualQuestionNumber}`);
    
    // Fetch parsed resume data if invitation token is provided
    let enhancedResumeData = resumeData;
    
    if (invitationToken && !resumeData) {
      try {
        console.log('🔍 Fetching parsed resume data from invitation...');
        
        const { Invitation } = require('../models/Invitation');
        const invitation = await Invitation.findOne({ token: invitationToken });
        
        if (invitation?.resumeData) {
          enhancedResumeData = invitation.resumeData;
          console.log(`✅ Found parsed resume data: ${enhancedResumeData.skills?.length || 0} skills, ${enhancedResumeData.experience?.length || 0} experiences`);
        } else if (invitation?.resumeUrl) {
          console.log('📄 Resume URL found but no parsed data, parsing now...');
          
          // Parse resume on-demand if not already parsed
          const { parseResume } = require('../services/resumeParser');
          const response = await fetch(invitation.resumeUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const parsedResume = await parseResume(buffer);
          
          enhancedResumeData = {
            skills: parsedResume.skills || [],
            experience: parsedResume.experience || [],
            education: parsedResume.education || [],
            projects: parsedResume.projects || [],
            summary: parsedResume.summary || '',
            workExperience: parsedResume.workExperience || [],
            totalExperience: parsedResume.totalExperience || 0,
          };
          
          // Save parsed data to invitation for future use
          invitation.resumeData = {
            ...enhancedResumeData,
            parsedAt: new Date()
          };
          await invitation.save();
          
          console.log('✅ Resume parsed and cached successfully');
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch/parse resume data:', error);
        // Continue with existing resumeData or empty if none
      }
    }
    
    console.log(`📋 Generating question #${actualQuestionNumber} (Phase: ${actualInterviewPhase})`);
    
    // Generate question using Gemini
    const questionText = await generateInterviewQuestion({
      candidateName,
      position,
      skillCategory,
      experienceLevel,
      resumeData: enhancedResumeData,
      previousAnswers,
      previousQuestions, // Pass previous questions to prevent repetition
      questionNumber: actualQuestionNumber,
      interviewPhase: actualInterviewPhase
    });

    // Generate speech with minimal humanization to preserve original text
    let audioBuffer: Buffer | null = null;
    let audioBase64: string | null = null;
    
    try {
      if (actualQuestionNumber === 0) {
        // Opening greeting with warmth - use simple professional TTS
        audioBuffer = await generateSpeechWithPreset(questionText, 'AIRA_PROFESSIONAL');
      } else {
        // Regular question with minimal processing to avoid text changes
        audioBuffer = await generateHumanLikeSpeech({
          text: questionText,
          emotionalContext: {
            questionType: actualInterviewPhase as 'technical' | 'behavioral',
            candidateEmotion: 'neutral'
          },
          previousContext: previousAnswers[previousAnswers.length - 1],
          addHumanization: false, // Disable humanization to preserve original text
          addNaturalPauses: false, // Disable to prevent text changes
          variableSpeed: false
        });
      }
      
      // Convert buffer to base64 for easy transmission
      audioBase64 = audioBuffer.toString('base64');
    } catch (ttsError: any) {
      console.warn(`⚠️ TTS failed for question #${actualQuestionNumber}: ${ttsError.message}`);
      console.log('📝 Continuing interview without audio...');
      // Continue without audio - frontend can handle text-only mode
    }

    res.json({
      success: true,
      data: {
        questionText,
        audioBase64,
        audioFormat: audioBase64 ? 'mp3' : null,
        questionNumber: actualQuestionNumber,
        interviewPhase: actualInterviewPhase,
        hasAudio: !!audioBase64
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
    let followUpAudio: string | null = null;
    
    try {
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

      followUpAudio = audioBuffer.toString('base64');
    } catch (ttsError: any) {
      console.warn(`⚠️ TTS failed for evaluation response: ${ttsError.message}`);
      console.log('📝 Continuing evaluation without audio...');
      // Continue without audio - frontend can handle text-only mode
    }

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

// Comprehensive Interview Report Endpoint
export const getComprehensiveInterviewReport = async (req: Request, res: Response) => {
  try {
    const { invitationToken, candidateId } = req.body;
    
    console.log('📊 Fetching comprehensive interview report...');
    
    // Import models
    const { Invitation } = require('../models/Invitation');
    const { InterviewSession } = require('../models/InterviewSession');
    
    let invitation = null;
    let sessions = [];
    
    // Get invitation data
    if (invitationToken) {
      invitation = await Invitation.findOne({ token: invitationToken }).lean();
    }
    
    // Get interview sessions
    if (candidateId) {
      sessions = await InterviewSession.find({ candidateId }).sort({ createdAt: 1 }).lean();
    } else if (invitation) {
      sessions = await InterviewSession.find({ 
        candidateEmail: invitation.candidateEmail 
      }).sort({ createdAt: 1 }).lean();
    }
    
    // Extract conversation data
    const questionsAsked: any[] = [];
    const codingChallenges: any[] = [];
    let totalDuration = 0;
    
    for (const session of sessions) {
      if (session.conversation && session.conversation.length > 0) {
        for (let i = 0; i < session.conversation.length; i += 2) {
          const question = session.conversation[i];
          const answer = session.conversation[i + 1];
          
          if (question && answer) {
            questionsAsked.push({
              question: question.text || question.message || 'Question not recorded',
              answer: answer.text || answer.message || 'Answer not recorded',
              timestamp: question.timestamp || new Date(),
              score: answer.score || null,
              feedback: answer.aiInsight || null
            });
          }
        }
      }
      
      // Extract coding challenges
      if (session.codingResults && session.codingResults.length > 0) {
        session.codingResults.forEach((result: any) => {
          codingChallenges.push({
            problem: result.problemStatement || 'Coding challenge',
            solution: result.code || '',
            testsPassed: result.testsPassed || 0,
            totalTests: result.totalTests || 0,
            executionTime: result.executionTime || 0,
            language: result.language || 'javascript'
          });
        });
      }
      
      if (session.duration) {
        totalDuration += session.duration;
      }
    }
    
    // Generate AI insights based on conversation
    const aiInsights = await generateAIInsights(questionsAsked, codingChallenges, invitation?.resumeData);
    
    // Compile comprehensive report
    const comprehensiveData = {
      resumeData: invitation?.resumeData || null,
      interviewTranscript: generateTranscript(questionsAsked),
      questionsAsked,
      codingChallenges,
      aiInsights,
      interviewDuration: Math.round(totalDuration / 60), // Convert to minutes
      interviewStats: {
        totalQuestions: questionsAsked.length,
        averageResponseLength: questionsAsked.reduce((acc: number, qa: any) => acc + (qa.answer?.length || 0), 0) / questionsAsked.length,
        technicalQuestions: questionsAsked.filter((qa: any) => qa.question.toLowerCase().includes('technical') || qa.question.toLowerCase().includes('code')).length,
        behavioralQuestions: questionsAsked.filter((qa: any) => !qa.question.toLowerCase().includes('technical') && !qa.question.toLowerCase().includes('code')).length
      }
    };
    
    console.log(`✅ Generated comprehensive report: ${questionsAsked.length} Q&As, ${codingChallenges.length} coding challenges`);
    
    res.json({
      success: true,
      data: comprehensiveData
    });
    
  } catch (error: any) {
    console.error('❌ Error generating comprehensive report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate comprehensive interview report'
    });
  }
};

// Generate AI insights from interview data
const generateAIInsights = async (questionsAsked: any[], codingChallenges: any[], resumeData: any) => {
  try {
    // Prepare context for AI analysis
    const interviewContext = {
      questionsAsked,
      codingChallenges,
      resumeData,
      totalQuestions: questionsAsked.length,
      technicalPerformance: codingChallenges.length > 0 ? 
        codingChallenges.reduce((acc: number, ch: any) => acc + (ch.testsPassed / ch.totalTests), 0) / codingChallenges.length * 100 : 0
    };
    
    // Generate insights using AI
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let recommendation = '';
    
    if (questionsAsked.length > 0) {
      // Analyze conversation quality
      const avgAnswerLength = questionsAsked.reduce((acc: number, qa: any) => acc + (qa.answer?.length || 0), 0) / questionsAsked.length;
      
      if (avgAnswerLength > 200) {
        strengths.push('Provides detailed and comprehensive responses');
      } else if (avgAnswerLength < 50) {
        weaknesses.push('Responses could be more detailed and elaborate');
      }
      
      // Analyze response quality
      const positiveWords = ['experience', 'skilled', 'accomplished', 'developed', 'implemented', 'managed', 'led'];
      const hasPositiveLanguage = questionsAsked.some((qa: any) => 
        positiveWords.some(word => qa.answer?.toLowerCase().includes(word))
      );
      
      if (hasPositiveLanguage) {
        strengths.push('Demonstrates relevant experience and accomplishments');
      }
    }
    
    if (codingChallenges.length > 0) {
      const avgSuccess = codingChallenges.reduce((acc: number, ch: any) => acc + (ch.testsPassed / ch.totalTests), 0) / codingChallenges.length;
      
      if (avgSuccess > 0.8) {
        strengths.push('Excellent problem-solving skills and coding abilities');
      } else if (avgSuccess > 0.5) {
        strengths.push('Good technical foundation with room for improvement');
      } else {
        weaknesses.push('Needs improvement in coding and algorithm implementation');
      }
      
      const avgExecutionTime = codingChallenges.reduce((acc: number, ch: any) => acc + ch.executionTime, 0) / codingChallenges.length;
      if (avgExecutionTime < 1000) {
        strengths.push('Efficient code implementation with good performance');
      }
    }
    
    // Generate recommendation
    if (strengths.length > weaknesses.length) {
      recommendation = 'Strong candidate with demonstrated skills and experience. Recommended for next interview round.';
    } else if (strengths.length === weaknesses.length) {
      recommendation = 'Balanced candidate with both strengths and areas for improvement. Consider role requirements carefully.';
    } else {
      recommendation = 'Candidate shows potential but requires additional development. Consider junior role or training program.';
    }
    
    return {
      strengths: strengths.length > 0 ? strengths : ['Completed interview process', 'Showed engagement during conversation'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Limited assessment data available'],
      recommendation,
      culturalFit: Math.min(85, Math.max(45, 60 + (strengths.length - weaknesses.length) * 10)),
      technicalFit: codingChallenges.length > 0 ? 
        Math.round(codingChallenges.reduce((acc: number, ch: any) => acc + (ch.testsPassed / ch.totalTests), 0) / codingChallenges.length * 100) : 
        65,
      overallRating: strengths.length > weaknesses.length ? 'Recommended' : strengths.length === weaknesses.length ? 'Consider' : 'Not Recommended'
    };
    
  } catch (error) {
    console.warn('⚠️ Failed to generate AI insights, using fallback');
    return {
      strengths: ['Completed interview successfully', 'Engaged in conversation'],
      weaknesses: ['Interview analysis pending'],
      recommendation: 'Further evaluation recommended based on available data.',
      culturalFit: 65,
      technicalFit: 65,
      overallRating: 'Pending detailed analysis'
    };
  }
};

// Generate interview transcript
const generateTranscript = (questionsAsked: any[]) => {
  let transcript = 'INTERVIEW TRANSCRIPT\n';
  transcript += '='.repeat(50) + '\n\n';
  
  questionsAsked.forEach((qa: any, index: number) => {
    transcript += `Q${index + 1}: ${qa.question}\n\n`;
    transcript += `A${index + 1}: ${qa.answer}\n\n`;
    if (qa.feedback) {
      transcript += `AI Feedback: ${qa.feedback}\n\n`;
    }
    transcript += '-'.repeat(30) + '\n\n';
  });
  
  return transcript;
};

export default {
  generateQuestion,
  scoreInterviewEndpoint,
  respondToAnswer,
  validateAnswer,
  healthCheck,
  getComprehensiveInterviewReport
};
