import Groq from 'groq-sdk'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

// Initialize AI clients
const groq = process.env.GROQ_API_KEY ? new Groq({
  apiKey: process.env.GROQ_API_KEY
}) : null

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null

// Speech-to-Text using OpenAI Whisper
export const processSTT = async (audioData: string): Promise<string> => {
  try {
    // In a real implementation, you would:
    // 1. Convert base64 audio data to buffer
    // 2. Send to OpenAI Whisper API
    // 3. Return transcribed text
    
    // For now, return a mock response
    console.log('Processing STT for audio data...')
    return "This is a mock transcription of the candidate's response."
  } catch (error) {
    console.error('STT Error:', error)
    throw new Error('Failed to process speech-to-text')
  }
}

// Generate AI Interviewer Response
export const generateAIResponse = async (
  candidateAnswer: string, 
  position: string, 
  isInitial: boolean = false
): Promise<string> => {
  try {
    let prompt: string

    if (isInitial) {
      prompt = `You are an AI interviewer conducting an interview for a ${position} position. 
      Start the interview with a warm welcome and ask the candidate to introduce themselves. 
      Keep the question professional but friendly.`
    } else {
      prompt = `You are an AI interviewer conducting an interview for a ${position} position.
      The candidate just answered: "${candidateAnswer}"
      
      Based on their answer, ask a relevant follow-up question that:
      1. Goes deeper into their experience
      2. Tests their technical knowledge
      3. Assesses their problem-solving skills
      4. Is appropriate for a ${position} role
      
      Keep the question concise and professional.`
    }

    // Check if Groq API key is available
    if (!groq || !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Using fallback questions - Groq API key not configured')
      const fallbackQuestions = [
        "That's interesting. Can you tell me more about your experience?",
        "How did you handle challenges in your previous role?",
        "What technologies are you most comfortable working with?",
        "Can you describe a project you're particularly proud of?",
        "How do you stay updated with industry trends?"
      ]
      return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional AI interviewer. Ask relevant, insightful questions that help assess candidates' qualifications for the role. Keep responses concise and professional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 150
    })

    return completion.choices[0]?.message?.content || "Could you please elaborate on that?"
  } catch (error) {
    console.error('AI Response Error:', error)
    // Fallback questions
    const fallbackQuestions = [
      "That's interesting. Can you tell me more about your experience?",
      "How did you handle challenges in your previous role?",
      "What technologies are you most comfortable working with?",
      "Can you describe a project you're particularly proud of?",
      "How do you stay updated with industry trends?"
    ]
    return fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]
  }
}

// Text-to-Speech - Enhanced Implementation with fallbacks
export const generateTTS = async (text: string): Promise<string> => {
  try {
    console.log('🎤 TTS requested for text:', text.substring(0, 50) + '...')
    
    // Try to use the enhanced TTS service first (Kokoro, Gemini TTS, etc.)
    try {
      const { generateHumanLikeSpeech } = await import('./enhancedTTSService');
      const audioBuffer = await generateHumanLikeSpeech({
        text,
        emotionalContext: {
          questionType: 'behavioral',
          candidateEmotion: 'neutral'
        },
        addHumanization: true,
        addNaturalPauses: true,
        variableSpeed: false
      });
      
      // Save buffer to temp file and return path
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const audioPath = path.join(tempDir, `tts_${Date.now()}.mp3`);
      fs.writeFileSync(audioPath, audioBuffer);
      console.log('✅ TTS generated successfully using enhanced service');
      return audioPath;
      
    } catch (enhancedError) {
      console.warn('⚠️ Enhanced TTS failed, trying Gemini TTS fallback:', enhancedError);
      
      // Fallback to Gemini TTS if available
      try {
        const { generateSpeechWithPreset } = await import('./ttsService');
        const audioBuffer = await generateSpeechWithPreset(text, 'AIRA_PROFESSIONAL');
        
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const audioPath = path.join(tempDir, `tts_fallback_${Date.now()}.mp3`);
        fs.writeFileSync(audioPath, audioBuffer);
        console.log('✅ TTS generated using Gemini TTS fallback');
        return audioPath;
        
      } catch (geminiError) {
        console.warn('⚠️ Gemini TTS also failed, using mock response:', geminiError);
        
        // Final fallback - create a mock file for development
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const mockAudioPath = path.join(tempDir, `mock_audio_${Date.now()}.mp3`);
        fs.writeFileSync(mockAudioPath, 'Mock TTS data for: ' + text.substring(0, 100));
        console.log('⚠️ Using mock TTS file for development');
        return mockAudioPath;
      }
    }
  } catch (error) {
    console.error('❌ TTS Error:', error);
    throw new Error('Failed to generate text-to-speech')
  }
}

// Evaluate Interview Performance
export const evaluateInterview = async (transcript: any[]): Promise<any> => {
  try {
    // Check if Groq API key is available
    if (!groq || !process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      console.log('Using fallback evaluation - Groq API key not configured')
      return {
        overallScore: 75,
        contentQuality: 80,
        communicationSkills: 70,
        confidence: 75,
        technicalKnowledge: 80,
        strengths: [
          "Good communication skills",
          "Relevant experience",
          "Professional demeanor"
        ],
        areasForImprovement: [
          "Could provide more specific examples",
          "Technical depth could be improved",
          "More confidence in responses"
        ],
        feedback: "The candidate showed good potential with room for improvement in technical depth and confidence."
      }
    }

    const fullTranscript = transcript
      .map(entry => `Q: ${entry.question}\nA: ${entry.answer}`)
      .join('\n\n')

    const evaluationPrompt = `Evaluate this interview transcript and provide scores (0-100) for:
    1. Content Quality (relevance, accuracy, depth)
    2. Communication Skills (clarity, fluency, structure)
    3. Confidence (pace, assertiveness, hesitation)
    4. Technical Knowledge (based on the role)
    
    Also provide:
    - Overall score (0-100)
    - 3 key strengths
    - 3 areas for improvement
    - General feedback
    
    Transcript:
    ${fullTranscript}
    
    Respond in JSON format with the following structure:
    {
      "overallScore": number,
      "contentQuality": number,
      "communicationSkills": number,
      "confidence": number,
      "technicalKnowledge": number,
      "strengths": [string, string, string],
      "areasForImprovement": [string, string, string],
      "feedback": string
    }`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert HR interviewer. Evaluate candidates objectively and provide constructive feedback."
        },
        {
          role: "user",
          content: evaluationPrompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content || '{}'
    
    try {
      return JSON.parse(response)
    } catch (parseError) {
      // Fallback evaluation if JSON parsing fails
      return {
        overallScore: 75,
        contentQuality: 80,
        communicationSkills: 70,
        confidence: 75,
        technicalKnowledge: 80,
        strengths: [
          "Good communication skills",
          "Relevant experience",
          "Professional demeanor"
        ],
        areasForImprovement: [
          "Could provide more specific examples",
          "Technical depth could be improved",
          "More confidence in responses"
        ],
        feedback: "The candidate showed good potential with room for improvement in technical depth and confidence."
      }
    }
  } catch (error) {
    console.error('Evaluation Error:', error)
    // Return default evaluation
    return {
      overallScore: 70,
      contentQuality: 70,
      communicationSkills: 70,
      confidence: 70,
      technicalKnowledge: 70,
      strengths: ["Participated actively in interview"],
      areasForImprovement: ["Could improve technical responses"],
      feedback: "Interview completed successfully."
    }
  }
}
