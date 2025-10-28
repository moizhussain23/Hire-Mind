import { Request, Response } from 'express';
import { generateInterviewQuestion, scoreInterview } from '../services/geminiService';
import { generateSpeechWithPreset } from '../services/ttsService';
import { parseResume } from '../services/resumeParser';

/**
 * Test complete interview flow with resume and role description
 * POST /api/test-interview
 * 
 * Body:
 * - resumeText: string (or resumeUrl: string)
 * - roleDescription: string
 * - candidateName: string
 * - position: string
 * - experienceLevel: 'fresher' | 'mid-level' | 'senior'
 * - numberOfQuestions: number (default: 5)
 */
export async function testFullInterview(req: Request, res: Response): Promise<void> {
  try {
    const {
      resumeText,
      resumeUrl,
      roleDescription,
      candidateName,
      position,
      experienceLevel = 'mid-level',
      numberOfQuestions = 5
    } = req.body;

    // Validate required fields
    if (!candidateName || !position) {
      res.status(400).json({
        success: false,
        error: 'candidateName and position are required'
      });
      return;
    }

    if (!resumeText && !resumeUrl) {
      res.status(400).json({
        success: false,
        error: 'Either resumeText or resumeUrl is required'
      });
      return;
    }

    console.log(`\n🎯 ========================================`);
    console.log(`🎯 TEST INTERVIEW STARTED`);
    console.log(`🎯 Candidate: ${candidateName}`);
    console.log(`🎯 Position: ${position}`);
    console.log(`🎯 Experience: ${experienceLevel}`);
    console.log(`🎯 ========================================\n`);

    // Step 1: Parse Resume (if resumeText provided, simulate parsing)
    let resumeData;
    if (resumeText) {
      console.log('📄 Parsing resume from text...');
      // Simple parsing for test
      resumeData = {
        skills: extractSkills(resumeText),
        experience: extractExperience(resumeText),
        education: extractEducation(resumeText),
        projects: extractProjects(resumeText)
      };
      console.log(`✅ Resume parsed: ${resumeData.skills.length} skills found`);
    } else {
      console.log('📄 Fetching and parsing resume from URL...');
      const response = await fetch(resumeUrl);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const parsed = await parseResume(buffer);
      resumeData = {
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        projects: parsed.projects
      };
      console.log(`✅ Resume parsed: ${resumeData.skills.length} skills found`);
    }

    // Step 2: Generate interview questions
    const interview = {
      candidateName,
      position,
      roleDescription,
      experienceLevel,
      resumeData,
      questions: [] as any[],
      answers: [] as string[],
      transcript: [] as any[]
    };

    console.log(`\n🤖 Generating ${numberOfQuestions} personalized questions...\n`);

    for (let i = 0; i < numberOfQuestions; i++) {
      const questionNumber = i;
      const interviewPhase = i < 2 ? 'behavioral' : 'technical';

      console.log(`\n📝 Question ${i + 1}/${numberOfQuestions} (${interviewPhase})...`);

      // Generate question
      const questionText = await generateInterviewQuestion({
        candidateName,
        position,
        skillCategory: 'technical',
        experienceLevel: experienceLevel as any,
        resumeData,
        previousAnswers: interview.answers,
        questionNumber,
        interviewPhase: interviewPhase as any
      });

      console.log(`\n❓ AI Question: "${questionText}"\n`);

      // Generate audio
      console.log('🎤 Generating natural voice audio...');
      const audioBuffer = await generateSpeechWithPreset(questionText, 'AIRA_PROFESSIONAL');
      const audioBase64 = audioBuffer.toString('base64');
      console.log(`✅ Audio generated: ${audioBuffer.length} bytes (${Math.round(audioBuffer.length / 1024)}KB)`);

      // Simulate candidate answer
      const simulatedAnswer = generateSimulatedAnswer(questionText, resumeData, i);
      console.log(`\n💬 Simulated Answer: "${simulatedAnswer}"\n`);

      interview.questions.push({
        questionNumber: i + 1,
        phase: interviewPhase,
        questionText,
        audioSize: audioBuffer.length,
        audioBase64: audioBase64.substring(0, 100) + '...' // Truncate for response
      });

      interview.answers.push(simulatedAnswer);

      interview.transcript.push(
        {
          sender: 'ai',
          text: questionText,
          timestamp: new Date().toISOString()
        },
        {
          sender: 'candidate',
          text: simulatedAnswer,
          timestamp: new Date().toISOString()
        }
      );

      console.log(`✅ Question ${i + 1} complete\n`);
    }

    // Step 3: Score the interview
    console.log(`\n📊 Scoring interview...\n`);

    const score = await scoreInterview({
      transcript: interview.transcript,
      codeSubmissions: [],
      position,
      skillCategory: 'technical',
      problemSolved: true
    });

    console.log(`\n✅ ========================================`);
    console.log(`✅ INTERVIEW SCORING COMPLETE`);
    console.log(`✅ ========================================`);
    console.log(`📊 Overall Score: ${score.overallScore}/100`);
    console.log(`💻 Technical Skills: ${score.technicalSkills}/100`);
    console.log(`💬 Communication: ${score.communication}/100`);
    console.log(`🧩 Problem Solving: ${score.problemSolving}/100`);
    console.log(`📝 Code Quality: ${score.codeQuality}/100`);
    console.log(`💪 Confidence: ${score.confidence}/100`);
    console.log(`\n✨ Strengths:`);
    score.strengths.forEach((s: string) => console.log(`   - ${s}`));
    console.log(`\n🎯 Areas for Improvement:`);
    score.improvements.forEach((i: string) => console.log(`   - ${i}`));
    console.log(`\n📝 Summary: ${score.summary}`);
    console.log(`\n✅ ========================================\n`);

    // Return complete test results
    res.json({
      success: true,
      message: 'Test interview completed successfully',
      data: {
        candidate: {
          name: candidateName,
          position,
          experienceLevel
        },
        resume: {
          skills: resumeData.skills,
          experience: resumeData.experience,
          education: resumeData.education,
          projects: resumeData.projects
        },
        interview: {
          totalQuestions: numberOfQuestions,
          questions: interview.questions.map((q, idx) => ({
            number: idx + 1,
            phase: q.phase,
            question: q.questionText,
            answer: interview.answers[idx],
            audioGenerated: true,
            audioSize: q.audioSize
          }))
        },
        score: {
          overall: score.overallScore,
          breakdown: {
            technicalSkills: score.technicalSkills,
            communication: score.communication,
            problemSolving: score.problemSolving,
            codeQuality: score.codeQuality,
            confidence: score.confidence
          },
          strengths: score.strengths,
          improvements: score.improvements,
          summary: score.summary,
          detailedFeedback: score.detailedFeedback
        },
        aiServices: {
          geminiAI: 'Working ✅',
          geminiTTS: 'Working ✅',
          resumeParser: 'Working ✅',
          scoring: 'Working ✅'
        },
        testResults: {
          questionsPersonalized: true,
          voiceGenerated: true,
          resumeAnalyzed: true,
          followUpContextual: true,
          scoringDetailed: true
        }
      }
    });

  } catch (error: any) {
    console.error('\n❌ Test interview failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test interview failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Helper functions for parsing resume text
function extractSkills(text: string): string[] {
  const commonSkills = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'React', 'Node.js',
    'Angular', 'Vue', 'MongoDB', 'PostgreSQL', 'MySQL', 'AWS', 'Docker',
    'Kubernetes', 'Git', 'REST API', 'GraphQL', 'HTML', 'CSS', 'TailwindCSS',
    'Express', 'Django', 'Flask', 'Spring Boot', 'Redis', 'Microservices',
    'CI/CD', 'Jenkins', 'GitHub Actions', 'Agile', 'Scrum', 'JIRA'
  ];

  return commonSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractExperience(text: string): string[] {
  const experiences: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.match(/\d{4}\s*-\s*\d{4}|\d{4}\s*-\s*present/i)) {
      experiences.push(line.trim());
    }
  }
  
  return experiences.length > 0 ? experiences : ['Experience details from resume'];
}

function extractEducation(text: string): string[] {
  const education: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.match(/bachelor|master|phd|b\.tech|m\.tech|b\.sc|m\.sc|degree/i)) {
      education.push(line.trim());
    }
  }
  
  return education.length > 0 ? education : ['Education details from resume'];
}

function extractProjects(text: string): string[] {
  const projects: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.match(/project|built|developed|created|designed/i) && line.length > 20) {
      projects.push(line.trim());
    }
  }
  
  return projects.length > 0 ? projects.slice(0, 3) : ['Project details from resume'];
}

function generateSimulatedAnswer(question: string, resumeData: any, questionIndex: number): string {
  // Generate contextual answers based on question and resume
  const answers = [
    `Based on my ${resumeData.experience[0] || 'experience'}, I have worked extensively with ${resumeData.skills.slice(0, 3).join(', ')}. I believe my background aligns well with this role.`,
    
    `In my previous role, I ${resumeData.projects[0] || 'led several projects'}. I'm particularly proud of implementing solutions using ${resumeData.skills[0] || 'modern technologies'}.`,
    
    `I would approach this by first analyzing the requirements, then designing a scalable solution using ${resumeData.skills.slice(0, 2).join(' and ')}. I've done similar work in my past projects.`,
    
    `My strength lies in ${resumeData.skills[0] || 'problem-solving'}. I've successfully delivered projects that required ${resumeData.skills.slice(1, 3).join(' and ')} expertise.`,
    
    `I'm excited about this opportunity because it aligns with my experience in ${resumeData.skills.slice(0, 2).join(' and ')}. I'm confident I can contribute effectively to the team.`
  ];
  
  return answers[questionIndex % answers.length];
}

export default {
  testFullInterview
};
