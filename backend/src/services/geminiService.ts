import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Primary model: gemini-2.0-flash (faster, newer)
const primaryModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash',
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  }
});

// Fallback model: gemini-1.5-flash (more stable)
const fallbackModel = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 2048,
  }
});

// Use primary model by default
let model = primaryModel;

interface QuestionContext {
  candidateName: string;
  position: string;
  skillCategory: 'technical' | 'non-technical';
  experienceLevel: 'fresher' | 'mid' | 'senior';
  resumeData?: {
    skills: string[];
    experience: string[];
    education: string[];
    projects: string[];
  };
  previousAnswers: string[];
  questionNumber: number;
  interviewPhase: 'behavioral' | 'technical';
}

interface ScoringContext {
  transcript: Array<{
    sender: 'ai' | 'candidate';
    text: string;
    timestamp: string;
  }>;
  codeSubmissions: Array<{
    code: string;
    language: string;
    timestamp: number;
  }>;
  position: string;
  skillCategory: string;
  problemSolved: boolean;
}

interface InterviewScore {
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  codeQuality: number;
  confidence: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
  detailedFeedback: {
    technical: string;
    communication: string;
    problemSolving: string;
  };
}

/**
 * Generate personalized interview question using Gemini Pro
 */
export async function generateInterviewQuestion(
  context: QuestionContext
): Promise<string> {
  try {
    const { 
      candidateName, 
      position, 
      skillCategory, 
      experienceLevel,
      resumeData,
      previousAnswers,
      questionNumber,
      interviewPhase
    } = context;

    // Build context-aware prompt
    let prompt = '';

    if (questionNumber === 0) {
      // Opening question
      prompt = `You are AIRA, a friendly and professional AI interviewer conducting a ${skillCategory} interview for the position of ${position}.

This is your first question. Greet the candidate warmly and ask them to introduce themselves.

Candidate name: ${candidateName}
Experience level: ${experienceLevel}

Generate a natural, conversational opening question that:
1. Welcomes the candidate
2. Asks them to introduce themselves
3. Relates to their background and the ${position} role
4. Is warm and professional

Generate ONLY the question, no additional text:`;
    } else if (interviewPhase === 'behavioral') {
      // Behavioral questions - make them VERY specific to resume
      const lastAnswer = previousAnswers[previousAnswers.length - 1] || '';
      const skills = resumeData?.skills?.slice(0, 5).join(', ') || 'general skills';
      const experience = resumeData?.experience?.[0] || 'their experience';
      const projects = resumeData?.projects?.[0] || 'their projects';
      
      prompt = `You are AIRA, an AI interviewer conducting a behavioral interview for ${position}.

CANDIDATE PROFILE:
- Name: ${candidateName}
- Position Applied: ${position}
- Experience Level: ${experienceLevel}
- Top Skills: ${skills}
- Recent Experience: ${experience}
- Notable Project: ${projects}
- Previous Answer: "${lastAnswer.substring(0, 200)}"

IMPORTANT: Generate a SPECIFIC, PERSONALIZED question that:
1. References SPECIFIC skills, companies, or projects from their resume
2. Asks about REAL challenges they faced (mention specific technologies)
3. Is completely DIFFERENT from previous questions
4. Sounds like a human interviewer who READ their resume
5. Uses phrases like "I noticed you worked with...", "Tell me about your experience with...", "In your role at..."

Examples of GOOD questions:
- "I see you led a team at TechCorp building microservices. What was the biggest architectural challenge you faced?"
- "You mentioned working with React and Node.js for 7 years. Can you walk me through how you'd design a real-time notification system?"
- "I noticed your e-commerce project handled 1M+ users. How did you approach scalability?"

Generate ONLY the question, no additional text. Make it SPECIFIC to their resume:`;
    } else {
      // Technical phase - specific to their skills
      const skills = resumeData?.skills?.slice(0, 5).join(', ') || 'general skills';
      const lastAnswer = previousAnswers[previousAnswers.length - 1] || '';
      
      prompt = `You are AIRA, an AI interviewer in the TECHNICAL phase for ${position}.

CANDIDATE PROFILE:
- Name: ${candidateName}
- Position Applied: ${position}
- Experience Level: ${experienceLevel}
- Technical Skills: ${skills}
- Previous Answer: "${lastAnswer.substring(0, 200)}"

IMPORTANT: Generate a SPECIFIC TECHNICAL question that:
1. References their ACTUAL skills (${skills})
2. Asks about system design, architecture, or problem-solving
3. Is appropriate for ${experienceLevel} level
4. Tests deep understanding, not just syntax
5. Relates to real-world scenarios they'd face in ${position}

Examples of GOOD technical questions:
- "How would you design a caching strategy for a high-traffic API using Redis?"
- "Walk me through how you'd optimize database queries in a MongoDB application with millions of records"
- "If you had to build a real-time chat system with React and Node.js, what architecture would you choose?"
- "How would you handle authentication and authorization in a microservices architecture?"

Generate ONLY the question, no additional text. Make it SPECIFIC to their skills:`;
    }

    // Try primary model first
    let result;
    try {
      result = await primaryModel.generateContent(prompt);
    } catch (primaryError: any) {
      // If primary fails with 503 (overloaded), try fallback model
      if (primaryError.status === 503) {
        console.warn('⚠️ Primary model overloaded, trying fallback model...');
        result = await fallbackModel.generateContent(prompt);
      } else {
        throw primaryError;
      }
    }

    const response = await result.response;
    const questionText = response.text().trim();

    console.log('✅ Gemini generated question:', questionText);
    return questionText;

  } catch (error: any) {
    console.error('❌ Gemini question generation error:', error);
    
    // Fallback to basic question if both models fail
    console.warn('⚠️ Using fallback question due to API error');
    return getFallbackQuestion(context);
  }
}

/**
 * Score interview using Gemini Pro AI analysis
 */
export async function scoreInterview(
  context: ScoringContext
): Promise<InterviewScore> {
  try {
    const { transcript, codeSubmissions, position, skillCategory, problemSolved } = context;

    // Build transcript text
    const transcriptText = transcript
      .map(msg => `${msg.sender === 'ai' ? 'AIRA' : 'Candidate'}: ${msg.text}`)
      .join('\n');

    // Build code submissions text
    const codeText = codeSubmissions.length > 0
      ? codeSubmissions.map((sub, idx) => 
          `Submission ${idx + 1} (${sub.language}):\n${sub.code}`
        ).join('\n\n')
      : 'No code submitted';

    const prompt = `You are an expert technical interviewer analyzing a ${skillCategory} interview for the position of ${position}.

INTERVIEW TRANSCRIPT:
${transcriptText}

CODE SUBMISSIONS:
${codeText}

PROBLEM SOLVED: ${problemSolved ? 'Yes' : 'No'}

Analyze this interview comprehensively and provide scores (0-100) for:

1. **Technical Skills**: Knowledge, problem-solving, coding ability
2. **Communication**: Clarity, articulation, explanation quality
3. **Problem Solving**: Approach, logic, analytical thinking
4. **Code Quality**: Clean code, best practices, efficiency (if applicable)
5. **Confidence**: Self-assurance, composure, professionalism

Provide your analysis in this EXACT JSON format (no markdown, just JSON):
{
  "technicalSkills": <number 0-100>,
  "communication": <number 0-100>,
  "problemSolving": <number 0-100>,
  "codeQuality": <number 0-100>,
  "confidence": <number 0-100>,
  "overallScore": <number 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "summary": "2-3 sentence overall summary",
  "detailedFeedback": {
    "technical": "Detailed technical assessment",
    "communication": "Detailed communication assessment",
    "problemSolving": "Detailed problem-solving assessment"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response (remove markdown code blocks if present)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const score: InterviewScore = JSON.parse(responseText);

    console.log('✅ Gemini scored interview:', score.overallScore);
    return score;

  } catch (error: any) {
    console.error('❌ Gemini scoring error:', error);
    
    // Return fallback score
    return getFallbackScore(context);
  }
}

/**
 * Evaluate answer quality and determine next action
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  context: {
    position: string;
    questionNumber: number;
    previousQuestions: string[];
  }
): Promise<{
  quality: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  feedback: string;
  needsFollowUp: boolean;
  followUpType: 'clarification' | 'deeper' | 'next-topic' | 'none';
  suggestedFollowUp?: string;
}> {
  try {
    const prompt = `You are AIRA, an expert AI interviewer evaluating a candidate's answer.

QUESTION ASKED: "${question}"
CANDIDATE'S ANSWER: "${answer}"
POSITION: ${context.position}
QUESTION NUMBER: ${context.questionNumber}

PREVIOUS QUESTIONS (to avoid repetition):
${context.previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Evaluate this answer and determine the best next action. Consider:
1. Answer quality (completeness, depth, relevance)
2. Whether a follow-up is needed (clarification, deeper dive, or move on)
3. Avoid asking similar questions to what was already asked
4. Keep the conversation natural and flowing

Respond in this EXACT JSON format (no markdown):
{
  "quality": "excellent|good|average|poor",
  "score": <number 0-100>,
  "feedback": "Brief internal feedback about the answer",
  "needsFollowUp": <boolean>,
  "followUpType": "clarification|deeper|next-topic|none",
  "suggestedFollowUp": "The follow-up question (only if needsFollowUp is true, otherwise null)"
}

RULES:
- If answer is vague/incomplete → followUpType: "clarification"
- If answer is good but can go deeper → followUpType: "deeper"
- If answer is complete → followUpType: "next-topic"
- If answer is excellent and complete → followUpType: "none", move to next question
- NEVER repeat similar questions
- Keep follow-ups SHORT and SPECIFIC`;

    // Try primary model first
    let result;
    try {
      result = await primaryModel.generateContent(prompt);
    } catch (primaryError: any) {
      // If primary fails with 503 (overloaded), try fallback model
      if (primaryError.status === 503) {
        console.warn('⚠️ Primary model overloaded for evaluation, trying fallback...');
        result = await fallbackModel.generateContent(prompt);
      } else {
        throw primaryError;
      }
    }

    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const evaluation = JSON.parse(responseText);
    console.log(`✅ Answer evaluated: ${evaluation.quality} (${evaluation.score}/100)`);
    
    return evaluation;

  } catch (error: any) {
    console.error('❌ Answer evaluation error:', error);
    
    // Fallback evaluation
    console.warn('⚠️ Using fallback evaluation due to API error');
    return {
      quality: 'average',
      score: 70,
      feedback: 'Answer received',
      needsFollowUp: false,
      followUpType: 'next-topic',
      suggestedFollowUp: undefined
    };
  }
}

/**
 * Analyze resume and extract key information
 */
export async function analyzeResume(resumeText: string): Promise<{
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  summary: string;
}> {
  try {
    const prompt = `Analyze this resume and extract key information.

RESUME:
${resumeText}

Extract and return in this EXACT JSON format (no markdown):
{
  "skills": ["skill1", "skill2", ...],
  "experience": ["experience1", "experience2", ...],
  "education": ["education1", "education2", ...],
  "projects": ["project1", "project2", ...],
  "summary": "Brief 2-3 sentence summary of candidate"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text().trim();

    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    const analysis = JSON.parse(responseText);
    console.log('✅ Resume analyzed successfully');
    
    return analysis;

  } catch (error: any) {
    console.error('❌ Resume analysis error:', error);
    
    // Return empty structure
    return {
      skills: [],
      experience: [],
      education: [],
      projects: [],
      summary: 'Unable to analyze resume'
    };
  }
}

/**
 * Fallback question if Gemini API fails
 */
function getFallbackQuestion(context: QuestionContext): string {
  const { candidateName, questionNumber, interviewPhase } = context;

  if (questionNumber === 0) {
    return `Hello ${candidateName}! I'm AIRA, your AI interviewer. Let's start with some questions about you. Can you please introduce yourself and tell me about your background?`;
  }

  if (interviewPhase === 'behavioral') {
    const questions = [
      `Great! Now, can you tell me about a challenging project you worked on and how you handled it?`,
      `Excellent! What are your strengths and how do they relate to this position?`,
      `Can you describe a situation where you had to work in a team? What was your role?`,
    ];
    return questions[Math.min(questionNumber - 1, questions.length - 1)];
  }

  return `Can you explain your approach to solving this problem?`;
}

/**
 * Fallback score if Gemini API fails
 */
function getFallbackScore(context: ScoringContext): InterviewScore {
  const { transcript, problemSolved } = context;
  
  // Basic scoring based on transcript length and problem solved
  const candidateMessages = transcript.filter(m => m.sender === 'candidate');
  const avgLength = candidateMessages.reduce((sum, m) => sum + m.text.length, 0) / candidateMessages.length;
  
  const baseScore = problemSolved ? 75 : 60;
  const communicationBonus = avgLength > 100 ? 10 : 0;
  
  return {
    technicalSkills: baseScore,
    communication: baseScore + communicationBonus,
    problemSolving: problemSolved ? 80 : 55,
    codeQuality: problemSolved ? 75 : 50,
    confidence: baseScore + 5,
    overallScore: baseScore + (communicationBonus / 2),
    strengths: [
      'Completed the interview',
      'Engaged with questions',
      'Demonstrated interest'
    ],
    improvements: [
      'Could provide more detailed answers',
      'Practice technical problem-solving',
      'Improve code quality'
    ],
    summary: 'The candidate completed the interview and demonstrated basic competency.',
    detailedFeedback: {
      technical: 'Basic technical understanding demonstrated.',
      communication: 'Communication was adequate.',
      problemSolving: problemSolved ? 'Successfully solved the problem.' : 'Struggled with problem-solving.'
    }
  };
}

// Export model separately (functions are already exported at declaration)
export { model };
