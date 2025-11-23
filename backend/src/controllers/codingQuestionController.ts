import { Request, Response } from 'express';
import CodingQuestionBankService from '../services/codingQuestionBank';
import { CodingQuestion } from '../models/QuestionBank';

/**
 * Controller for managing coding questions in interviews
 */

/**
 * Get a coding question for interview
 * POST /api/coding/question
 */
export async function getCodingQuestion(req: Request, res: Response): Promise<void> {
  try {
    const {
      experienceLevel = 'fresher',
      domain = ['general'],
      difficulty,
      subcategory,
      excludeQuestionIds = [],
      timeLimit = 30
    } = req.body;

    console.log(`🔍 Fetching coding question for ${experienceLevel} level in ${domain.join(', ')} domain(s)`);

    const question = await CodingQuestionBankService.selectQuestion({
      experienceLevel,
      domain,
      difficulty,
      subcategory,
      excludeQuestionIds,
      timeLimit
    });

    if (!question) {
      res.status(404).json({
        success: false,
        error: 'No suitable coding question found for the given criteria'
      });
      return;
    }

    // Return question without revealing hidden test cases or solutions
    const publicQuestion = {
      id: question.id,
      title: question.title,
      difficulty: question.difficulty,
      subcategory: question.subcategory,
      problemStatement: question.problemStatement,
      description: question.description,
      examples: question.examples,
      constraints: question.constraints,
      codeTemplate: question.codeTemplate,
      evaluationCriteria: question.evaluationCriteria,
      timeComplexity: question.timeComplexity,
      spaceComplexity: question.spaceComplexity,
      hints: question.hints?.slice(0, 2), // Only provide first 2 hints initially
      estimatedTime: question.estimatedTime,
      tags: question.tags
    };

    res.json({
      success: true,
      question: publicQuestion,
      aiPrompt: question.aiPrompt
    });

  } catch (error: any) {
    console.error('❌ Error fetching coding question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coding question',
      message: error.message
    });
  }
}

/**
 * Submit coding solution for evaluation
 * POST /api/coding/submit
 */
export async function submitCodingSolution(req: Request, res: Response): Promise<void> {
  try {
    const {
      questionId,
      code,
      language,
      timeSpent,
      interviewId
    } = req.body;

    if (!questionId || !code || !language) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: questionId, code, language'
      });
      return;
    }

    console.log(`📝 Evaluating ${language} solution for question ${questionId}`);

    const question = await CodingQuestion.findOne({ id: questionId });
    if (!question) {
      res.status(404).json({
        success: false,
        error: 'Question not found'
      });
      return;
    }

    // Basic code evaluation (in production, integrate with code execution engine)
    const evaluation = await evaluateCode(question, code, language);
    
    // Update question analytics
    await CodingQuestionBankService.updateQuestionAnalytics(
      questionId,
      timeSpent || 0,
      evaluation.passed
    );

    res.json({
      success: true,
      evaluation: {
        passed: evaluation.passed,
        score: evaluation.score,
        testCasesPassed: evaluation.testCasesPassed,
        totalTestCases: evaluation.totalTestCases,
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions,
        timeSpent: timeSpent
      }
    });

  } catch (error: any) {
    console.error('❌ Error submitting coding solution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate coding solution',
      message: error.message
    });
  }
}

/**
 * Get all coding questions (for admin/HR)
 * GET /api/coding/questions
 */
export async function getAllCodingQuestions(req: Request, res: Response): Promise<void> {
  try {
    const { 
      page = 1, 
      limit = 20, 
      difficulty, 
      subcategory, 
      experienceLevel,
      domain
    } = req.query;

    const filter: any = {};
    if (difficulty) filter.difficulty = difficulty;
    if (subcategory) filter.subcategory = subcategory;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (domain) filter.domain = { $in: Array.isArray(domain) ? domain : [domain] };

    const skip = (Number(page) - 1) * Number(limit);

    const [questions, total] = await Promise.all([
      CodingQuestion.find(filter)
        .select('-expectedSolution -testCases') // Hide solutions from admin view
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      CodingQuestion.countDocuments(filter)
    ]);

    res.json({
      success: true,
      questions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching coding questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coding questions',
      message: error.message
    });
  }
}

/**
 * Initialize question bank
 * POST /api/coding/init
 */
export async function initializeQuestionBank(req: Request, res: Response): Promise<void> {
  try {
    await CodingQuestionBankService.initializeQuestionBank();
    
    const count = await CodingQuestion.countDocuments();
    
    res.json({
      success: true,
      message: 'Question bank initialized successfully',
      totalQuestions: count
    });

  } catch (error: any) {
    console.error('❌ Error initializing question bank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize question bank',
      message: error.message
    });
  }
}

/**
 * Get question statistics
 * GET /api/coding/stats
 */
export async function getCodingQuestionStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await CodingQuestion.aggregate([
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          averageSuccessRate: { $avg: '$successRate' },
          totalUsage: { $sum: '$usageCount' },
          difficultyBreakdown: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          },
          subcategoryBreakdown: {
            $push: {
              subcategory: '$subcategory',
              count: 1
            }
          }
        }
      }
    ]);

    const difficultyStats = await CodingQuestion.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          avgSuccessRate: { $avg: '$successRate' },
          avgUsage: { $avg: '$usageCount' }
        }
      }
    ]);

    const subcategoryStats = await CodingQuestion.aggregate([
      {
        $group: {
          _id: '$subcategory',
          count: { $sum: 1 },
          avgSuccessRate: { $avg: '$successRate' },
          avgUsage: { $avg: '$usageCount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        overview: stats[0] || {
          totalQuestions: 0,
          averageSuccessRate: 0,
          totalUsage: 0
        },
        byDifficulty: difficultyStats,
        bySubcategory: subcategoryStats
      }
    });

  } catch (error: any) {
    console.error('❌ Error fetching coding question stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question statistics',
      message: error.message
    });
  }
}

/**
 * Basic code evaluation function
 * In production, this should integrate with a secure code execution service
 */
async function evaluateCode(question: any, code: string, language: string): Promise<{
  passed: boolean;
  score: number;
  testCasesPassed: number;
  totalTestCases: number;
  feedback: string[];
  suggestions: string[];
}> {
  // This is a simplified evaluation - in production, use secure sandboxed execution
  const publicTestCases = question.testCases.filter((tc: any) => !tc.isHidden);
  const allTestCases = question.testCases;
  
  // Basic code analysis
  let score = 0;
  let testCasesPassed = 0;
  const feedback: string[] = [];
  const suggestions: string[] = [];
  
  // Check if code contains basic required elements
  const hasMainLogic = code.trim().length > 50; // Basic length check
  const hasReturnStatement = code.includes('return');
  const hasProperStructure = code.includes('function') || code.includes('def') || code.includes('public');
  
  if (hasMainLogic) {
    score += 20;
    testCasesPassed += Math.floor(allTestCases.length * 0.3);
    feedback.push('✅ Code has substantial implementation');
  } else {
    feedback.push('❌ Code appears incomplete or too minimal');
    suggestions.push('Add more implementation details to solve the problem');
  }
  
  if (hasReturnStatement) {
    score += 20;
    testCasesPassed += Math.floor(allTestCases.length * 0.2);
    feedback.push('✅ Code includes return statement');
  } else {
    feedback.push('❌ Missing return statement');
    suggestions.push('Make sure your function returns the expected result');
  }
  
  if (hasProperStructure) {
    score += 20;
    testCasesPassed += Math.floor(allTestCases.length * 0.2);
    feedback.push('✅ Code has proper function structure');
  } else {
    feedback.push('❌ Code structure needs improvement');
    suggestions.push('Follow the provided function signature template');
  }
  
  // Check for common good practices
  if (code.includes('//') || code.includes('#')) {
    score += 10;
    feedback.push('✅ Code includes comments - good practice!');
  }
  
  if (!code.includes('console.log') && !code.includes('print(')) {
    score += 10;
    feedback.push('✅ Clean code without debug statements');
  } else {
    suggestions.push('Remove console.log/print statements from production code');
  }
  
  // Algorithm-specific checks
  if (question.id === 'easy_001' && code.toLowerCase().includes('map')) {
    score += 20;
    testCasesPassed += Math.floor(allTestCases.length * 0.3);
    feedback.push('✅ Using efficient data structure (Map/HashMap)');
  }
  
  if (question.id === 'medium_001' && code.toLowerCase().includes('stack')) {
    score += 20;
    testCasesPassed += Math.floor(allTestCases.length * 0.3);
    feedback.push('✅ Using appropriate data structure (Stack)');
  }
  
  const passed = score >= 60 && testCasesPassed >= Math.floor(allTestCases.length * 0.6);
  
  return {
    passed,
    score: Math.min(score, 100),
    testCasesPassed: Math.min(testCasesPassed, allTestCases.length),
    totalTestCases: allTestCases.length,
    feedback,
    suggestions
  };
}

/**
 * Execute code with test cases - LeetCode style
 */
export async function executeCodeChallenge(req: Request, res: Response): Promise<void> {
  try {
    const {
      code,
      language,
      questionId,
      functionName,
      testCases
    } = req.body;

    if (!code || !language || !functionName || !testCases) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: code, language, functionName, testCases'
      });
      return;
    }

    console.log(`🚀 Executing code challenge for question ${questionId}`);
    console.log(`Language: ${language}, Function: ${functionName}`);

    // Import the code execution service
    const { executeCodeWithTestCases } = await import('../services/codeExecutionService');
    
    console.log(`📝 Executing ${language} code for function: ${functionName}`);
    console.log(`🧪 Test cases provided: ${testCases.length}`);

    // Execute code with test cases
    const result = await executeCodeWithTestCases({
      code,
      language: language as 'javascript' | 'python' | 'java',
      functionName,
      testCases,
      timeLimit: 5000, // 5 seconds
      memoryLimit: 128 // 128 MB
    });

    // Log execution results
    console.log(`✅ Code execution completed:`);
    console.log(`   Tests Passed: ${result.passedTests}/${result.totalTests}`);
    console.log(`   Execution Time: ${result.overallExecutionTime}ms`);
    console.log(`   Copy-Paste Detected: ${result.suspiciousActivity?.possibleCopyPaste || false}`);
    console.log(`   AI Assistance Detected: ${result.suspiciousActivity?.aiAssistanceDetected || false}`);

    res.json({
      success: true,
      data: {
        executionResult: result,
        allTestsPassed: result.allTestsPassed,
        passedTests: result.passedTests,
        totalTests: result.totalTests,
        failedTests: result.failedTests,
        testResults: result.testResults.map(tr => ({
          passed: tr.passed,
          description: tr.testCase.description,
          input: tr.testCase.hidden ? 'Hidden' : tr.testCase.input,
          expectedOutput: tr.testCase.hidden ? 'Hidden' : tr.testCase.expectedOutput,
          actualOutput: tr.testCase.hidden ? 'Hidden' : tr.actualOutput,
          executionTime: tr.result.executionTime,
          error: tr.result.error
        })),
        codeQuality: result.codeQuality,
        suspiciousActivity: result.suspiciousActivity,
        overallExecutionTime: result.overallExecutionTime
      }
    });

  } catch (error: any) {
    console.error('❌ Code execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Code execution failed',
      message: error.message
    });
  }
}

/**
 * AI Interviewer Integration for Coding Challenges
 */
export async function getAIInterviewerFeedback(req: Request, res: Response): Promise<void> {
  try {
    const {
      candidateName,
      position,
      skillLevel,
      currentPhase,
      problemId,
      codeSubmission
    } = req.body;

    if (!candidateName || !position || !currentPhase) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: candidateName, position, currentPhase'
      });
      return;
    }

    console.log(`🤖 AI Interviewer request: ${currentPhase} phase for ${candidateName}`);

    // Import the interview coding service
    const { getAIInterviewerResponse, analyzeCodingBehavior } = await import('../services/interviewCodingService');

    // Get AI interviewer response
    const interviewerResponse = await getAIInterviewerResponse({
      candidateName,
      position,
      skillLevel: skillLevel || 'mid',
      currentPhase,
      problemId,
      codeSubmission
    });

    // Analyze coding behavior if submission provided
    let behaviorAnalysis = null;
    if (codeSubmission?.behaviorAnalysis) {
      behaviorAnalysis = analyzeCodingBehavior({
        keystrokes: codeSubmission.behaviorAnalysis.keystrokes || 0,
        pasteCount: codeSubmission.behaviorAnalysis.pasteCount || 0,
        timeSpent: codeSubmission.behaviorAnalysis.timeSpent || 0,
        codeLength: codeSubmission.code?.length || 0
      });
    }

    console.log(`✅ AI Interviewer response generated`);
    console.log(`   Message: ${interviewerResponse.message.substring(0, 100)}...`);
    console.log(`   Next Action: ${interviewerResponse.nextAction}`);
    console.log(`   Audio: ${interviewerResponse.audioBase64 ? 'Generated' : 'Not available'}`);

    res.json({
      success: true,
      data: {
        interviewer: interviewerResponse,
        behaviorAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ AI Interviewer feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI interviewer feedback',
      message: error.message
    });
  }
}

/**
 * Real-time coding session monitoring
 */
export async function updateCodingSession(req: Request, res: Response): Promise<void> {
  try {
    const {
      sessionId,
      candidateId,
      currentCode,
      keystrokes,
      pasteEvents,
      timeSpent,
      testResults
    } = req.body;

    console.log(`📊 Updating coding session ${sessionId}`);

    // Here you would typically update a database record
    // For now, we'll return session statistics
    
    const sessionStats = {
      sessionId,
      candidateId,
      lastUpdated: new Date().toISOString(),
      codeLength: currentCode?.length || 0,
      keystrokes: keystrokes || 0,
      pasteEvents: pasteEvents || 0,
      timeSpent: timeSpent || 0,
      testsRun: testResults?.length || 0,
      testsPassed: testResults?.filter((t: any) => t.passed).length || 0,
      productivity: {
        charsPerMinute: timeSpent > 0 ? (currentCode?.length || 0) / (timeSpent / 60000) : 0,
        keystrokesPerMinute: timeSpent > 0 ? (keystrokes || 0) / (timeSpent / 60000) : 0
      }
    };

    res.json({
      success: true,
      data: sessionStats
    });

  } catch (error: any) {
    console.error('❌ Coding session update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coding session',
      message: error.message
    });
  }
}

export default {
  getCodingQuestion,
  submitCodingSolution,
  executeCodeChallenge,
  getAIInterviewerFeedback,
  updateCodingSession,
  getAllCodingQuestions,
  initializeQuestionBank,
  getCodingQuestionStats
};