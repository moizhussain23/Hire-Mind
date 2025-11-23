/**
 * Interview Coding Service - Integrates coding challenges with AI interview flow
 * Provides real-time feedback and AI interviewer interaction during coding
 */

import { generateInterviewQuestion } from './geminiService';
import { generateHumanLikeSpeech } from './enhancedTTSService';

export interface CodingInterviewContext {
  candidateName: string;
  position: string;
  skillLevel: string;
  currentPhase: 'problem_explanation' | 'coding' | 'code_review' | 'optimization';
  problemId: string;
  codeSubmission?: {
    code: string;
    testResults: any[];
    allTestsPassed: boolean;
    codeQuality: any;
    suspiciousActivity: any;
    behaviorAnalysis: any;
  };
}

export interface AIInterviewerResponse {
  message: string;
  audioBase64?: string;
  nextAction: 'continue_coding' | 'ask_question' | 'move_to_next' | 'end_interview';
  feedback?: {
    positive: string[];
    improvements: string[];
    suggestions: string[];
  };
  followUpQuestion?: string;
}

/**
 * AI Interviewer provides real-time feedback during coding challenge
 */
export async function getAIInterviewerResponse(
  context: CodingInterviewContext
): Promise<AIInterviewerResponse> {
  try {
    console.log(`\n🤖 AI INTERVIEWER - ${context.currentPhase.toUpperCase()}`);
    console.log(`Candidate: ${context.candidateName} | Position: ${context.position}`);

    let interviewerMessage = '';
    let nextAction: AIInterviewerResponse['nextAction'] = 'continue_coding';
    let feedback: any = null;
    let followUpQuestion: string | undefined;

    switch (context.currentPhase) {
      case 'problem_explanation':
        interviewerMessage = await generateProblemExplanation(context);
        nextAction = 'continue_coding';
        break;

      case 'coding':
        const response = await generateCodingFeedback(context);
        interviewerMessage = response.message;
        feedback = response.feedback;
        nextAction = response.nextAction;
        break;

      case 'code_review':
        const reviewResponse = await generateCodeReview(context);
        interviewerMessage = reviewResponse.message;
        feedback = reviewResponse.feedback;
        followUpQuestion = reviewResponse.followUpQuestion;
        nextAction = reviewResponse.nextAction;
        break;

      case 'optimization':
        interviewerMessage = await generateOptimizationDiscussion(context);
        nextAction = 'ask_question';
        break;

      default:
        interviewerMessage = "Let's continue with the coding challenge.";
    }

    // Generate audio for the interviewer response
    let audioBase64: string | undefined;
    try {
      const audioBuffer = await generateHumanLikeSpeech({
        text: interviewerMessage,
        emotionalContext: {
          questionType: 'technical',
          candidateEmotion: 'neutral'
        },
        addHumanization: true,
        addNaturalPauses: true,
        variableSpeed: false
      });
      
      audioBase64 = audioBuffer.toString('base64');
      console.log('✅ Audio generated for interviewer response');
    } catch (audioError) {
      console.warn('⚠️ Audio generation failed:', audioError);
    }

    const result: AIInterviewerResponse = {
      message: interviewerMessage,
      audioBase64,
      nextAction,
      feedback,
      followUpQuestion
    };

    console.log(`✅ AI Interviewer response generated: ${nextAction}`);
    return result;

  } catch (error) {
    console.error('❌ AI Interviewer response failed:', error);
    return {
      message: "I'm here to help you with the coding challenge. Please continue with your solution.",
      nextAction: 'continue_coding'
    };
  }
}

/**
 * Generate problem explanation for the candidate
 */
async function generateProblemExplanation(context: CodingInterviewContext): Promise<string> {
  const prompt = `You are an experienced technical interviewer conducting a coding interview for a ${context.position} position.

The candidate ${context.candidateName} is about to start working on a coding problem. Provide a warm, encouraging introduction to the coding challenge phase.

Guidelines:
- Be professional but friendly
- Explain that they can ask questions if they need clarification
- Mention that you'll be observing their problem-solving approach
- Encourage them to think out loud
- Keep it concise (2-3 sentences)

Respond as if speaking directly to the candidate:`;

  return await generateInterviewQuestion({
    candidateName: context.candidateName,
    position: context.position,
    skillCategory: 'technical',
    experienceLevel: context.skillLevel,
    customPrompt: prompt
  });
}

/**
 * Generate real-time feedback during coding
 */
async function generateCodingFeedback(context: CodingInterviewContext) {
  const codeSubmission = context.codeSubmission;
  
  if (!codeSubmission) {
    return {
      message: "I see you're working on the problem. Feel free to think out loud about your approach.",
      nextAction: 'continue_coding' as const,
      feedback: null
    };
  }

  const { testResults, codeQuality, suspiciousActivity, behaviorAnalysis } = codeSubmission;
  const passedTests = testResults.filter((test: any) => test.passed).length;
  const totalTests = testResults.length;

  let message = '';
  let feedback = {
    positive: [] as string[],
    improvements: [] as string[],
    suggestions: [] as string[]
  };
  let nextAction: AIInterviewerResponse['nextAction'] = 'continue_coding';

  if (passedTests === totalTests) {
    // All tests passed
    message = `Excellent! All ${totalTests} test cases are passing. `;
    feedback.positive.push('Correct solution implementation');
    feedback.positive.push(`Code execution completed in good time`);
    
    if (codeQuality) {
      if (codeQuality.complexity === 'low') {
        feedback.positive.push('Clean, readable code structure');
      }
      if (codeQuality.bestPractices.length > 0) {
        feedback.positive.push('Good coding practices used');
      }
    }
    
    message += "Now let's discuss your solution and see if we can explore any optimizations.";
    nextAction = 'ask_question';
    
  } else if (passedTests > 0) {
    // Some tests passed
    message = `Good progress! ${passedTests} out of ${totalTests} test cases are passing. `;
    feedback.positive.push('Partial solution working correctly');
    
    const failedTest = testResults.find((test: any) => !test.passed);
    if (failedTest) {
      message += `Consider reviewing the case where the input is ${JSON.stringify(failedTest.input)}. `;
      feedback.suggestions.push('Review edge cases and boundary conditions');
    }
    
    message += "You're on the right track - keep working on it.";
    
  } else {
    // No tests passed
    message = `I see you're still working through the logic. `;
    feedback.suggestions.push('Consider breaking down the problem step by step');
    feedback.suggestions.push('Think about the expected input and output format');
    
    if (testResults.some((test: any) => test.error)) {
      message += "There might be a syntax error or runtime issue to address first.";
      feedback.suggestions.push('Check for syntax errors and runtime exceptions');
    }
  }

  // Check for suspicious activity
  if (suspiciousActivity?.possibleCopyPaste || suspiciousActivity?.aiAssistanceDetected) {
    feedback.improvements.push('Ensure you\'re working through the problem independently');
  }

  if (behaviorAnalysis?.pasteCount > 3) {
    feedback.improvements.push('Try typing out solutions to better demonstrate your thought process');
  }

  return { message, nextAction, feedback };
}

/**
 * Generate comprehensive code review
 */
async function generateCodeReview(context: CodingInterviewContext) {
  const codeSubmission = context.codeSubmission;
  
  if (!codeSubmission) {
    return {
      message: "Let's review your solution once you've made some progress.",
      nextAction: 'continue_coding' as const,
      feedback: null,
      followUpQuestion: undefined
    };
  }

  const prompt = `As a senior technical interviewer, provide a detailed but concise code review for a ${context.position} candidate.

Code Quality Analysis:
- Complexity: ${codeSubmission.codeQuality?.complexity || 'unknown'}
- Readability: ${codeSubmission.codeQuality?.readability || 'unknown'}
- Best Practices: ${codeSubmission.codeQuality?.bestPractices?.join(', ') || 'none detected'}

Test Results:
- Passed: ${codeSubmission.testResults?.filter((t: any) => t.passed).length || 0}
- Total: ${codeSubmission.testResults?.length || 0}
- All Tests Passed: ${codeSubmission.allTestsPassed}

Guidelines:
- Highlight what they did well
- Suggest specific improvements
- Ask a thoughtful follow-up question about their approach
- Keep it encouraging but constructive
- Focus on problem-solving approach, not just correctness

Provide your response as a technical interviewer speaking to the candidate:`;

  const reviewMessage = await generateInterviewQuestion({
    candidateName: context.candidateName,
    position: context.position,
    skillCategory: 'technical',
    experienceLevel: context.skillLevel,
    customPrompt: prompt
  });

  const followUpQuestions = [
    "How would you optimize this solution for very large inputs?",
    "What's the time complexity of your approach?",
    "Are there any edge cases you considered while implementing this?",
    "Would you handle this differently if memory was a constraint?",
    "What alternative approaches did you consider?"
  ];

  const followUpQuestion = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)];

  return {
    message: reviewMessage,
    feedback: {
      positive: codeSubmission.allTestsPassed ? ['Solution works correctly'] : [],
      improvements: [],
      suggestions: ['Consider discussing time and space complexity']
    },
    followUpQuestion,
    nextAction: 'ask_question' as const
  };
}

/**
 * Generate optimization discussion
 */
async function generateOptimizationDiscussion(context: CodingInterviewContext): Promise<string> {
  const prompt = `As a technical interviewer, engage the candidate in a discussion about optimizing their coding solution.

Context:
- Candidate: ${context.candidateName}
- Position: ${context.position}
- Skill Level: ${context.skillLevel}

Guide the conversation toward:
- Time and space complexity analysis
- Alternative algorithmic approaches
- Trade-offs between different solutions
- Real-world considerations

Keep it conversational and encouraging. Ask open-ended questions that demonstrate their problem-solving depth.

Respond as the interviewer:`;

  return await generateInterviewQuestion({
    candidateName: context.candidateName,
    position: context.position,
    skillCategory: 'technical',
    experienceLevel: context.skillLevel,
    customPrompt: prompt
  });
}

/**
 * Monitor candidate behavior during coding
 */
export function analyzeCodingBehavior(behaviorData: {
  keystrokes: number;
  pasteCount: number;
  timeSpent: number;
  codeLength: number;
}): {
  typingSpeed: number;
  productivityScore: number;
  suspiciousActivity: boolean;
  insights: string[];
} {
  const { keystrokes, pasteCount, timeSpent, codeLength } = behaviorData;
  const timeInMinutes = timeSpent / (1000 * 60);
  
  // Calculate metrics
  const typingSpeed = timeInMinutes > 0 ? keystrokes / timeInMinutes : 0;
  const codePerMinute = timeInMinutes > 0 ? codeLength / timeInMinutes : 0;
  const productivityScore = Math.min(100, (codePerMinute * 2) + (typingSpeed * 0.5));
  
  // Detect suspicious activity
  const suspiciousActivity = pasteCount > 5 || typingSpeed > 300 || codeLength > keystrokes * 1.5;
  
  const insights: string[] = [];
  
  if (typingSpeed < 30) {
    insights.push('Careful, methodical approach to coding');
  } else if (typingSpeed > 150) {
    insights.push('Fast typing speed, good keyboard proficiency');
  }
  
  if (pasteCount === 0) {
    insights.push('All code written from scratch');
  } else if (pasteCount > 3) {
    insights.push('Multiple copy-paste operations detected');
  }
  
  if (productivityScore > 70) {
    insights.push('High coding productivity and efficiency');
  } else if (productivityScore < 30) {
    insights.push('Taking time to think through the problem');
  }
  
  return {
    typingSpeed: Math.round(typingSpeed),
    productivityScore: Math.round(productivityScore),
    suspiciousActivity,
    insights
  };
}

export default {
  getAIInterviewerResponse,
  analyzeCodingBehavior
};