import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Interview } from '../models/Interview'
import { User } from '../models/User'
import { processSTT, generateAIResponse, generateTTS, evaluateInterview } from '../services/ai'

export const startInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { position } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Find user
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Create new interview
    const interview = new Interview({
      candidateId: (user._id as any).toString(),
      position: position || 'General Position',
      status: 'in-progress',
      startTime: new Date(),
      transcript: []
    })

    await interview.save()

    // Generate initial AI question
    const initialQuestion = await generateAIResponse('', position || 'General Position', true)

    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        position: interview.position,
        status: interview.status,
        startTime: interview.startTime,
        currentQuestion: initialQuestion
      }
    })
  } catch (error) {
    console.error('Error starting interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to start interview'
    })
  }
}

export const endInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const interview = await Interview.findById(interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Update interview status
    interview.status = 'completed'
    interview.endTime = new Date()
    interview.duration = Math.floor((interview.endTime.getTime() - interview.startTime!.getTime()) / 60000)

    // Generate evaluation (will be done by AI service later)
    // const evaluation = await evaluateInterview(interview.transcript)
    // interview.evaluation = evaluation
    
    // For now, set evaluation status to pending
    if (!interview.evaluation) {
      interview.evaluation = {
        status: 'pending'
      };
    }

    await interview.save()

    res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        status: interview.status,
        endTime: interview.endTime,
        duration: interview.duration,
        evaluation: interview.evaluation
      }
    })
  } catch (error) {
    console.error('Error ending interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to end interview'
    })
  }
}

export const getInterviewStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const interview = await Interview.findById(interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        position: interview.position,
        status: interview.status,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.duration,
        transcript: interview.transcript,
        evaluation: interview.evaluation
      }
    })
  } catch (error) {
    console.error('Error fetching interview status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview status'
    })
  }
}

export const processAudioData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { audioData, interviewId } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Convert audio to text using STT
    const transcript = await processSTT(audioData)

    // Find interview and update transcript
    const interview = await Interview.findById(interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Add to conversation history
    if (!interview.conversationHistory) {
      interview.conversationHistory = [];
    }
    
    interview.conversationHistory.push({
      speaker: 'candidate',
      message: transcript,
      timestamp: new Date()
    });

    // Generate AI response
    const aiResponse = await generateAIResponse(transcript, interview.position, false)
    
    // Generate TTS for AI response
    const audioResponse = await generateTTS(aiResponse)

    // Add AI response to conversation history
    interview.conversationHistory.push({
      speaker: 'ai',
      message: aiResponse,
      timestamp: new Date()
    });

    await interview.save()

    res.status(200).json({
      success: true,
      transcript,
      aiResponse,
      audioResponse
    })
  } catch (error) {
    console.error('Error processing audio data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to process audio data'
    })
  }
}

export const getInterviewHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    const interviews = await Interview.find({ candidateId: (user._id as any).toString() })
      .sort({ createdAt: -1 })
      .limit(10)

    res.status(200).json({
      success: true,
      interviews: interviews.map(interview => ({
        id: interview._id,
        position: interview.position,
        status: interview.status,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.duration,
        evaluation: interview.evaluation
      }))
    })
  } catch (error) {
    console.error('Error fetching interview history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview history'
    })
  }
}

// Link candidate to interview when they access it
export const linkCandidateToInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Find user
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Find interview
    const interview = await Interview.findById(interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Check if user's email is in the invited candidates list
    const invitedCandidates = interview.invitedCandidates || []
    const isInvited = invitedCandidates.some(email => email.toLowerCase() === user.email.toLowerCase())
    
    if (!isInvited) {
      res.status(403).json({
        success: false,
        error: 'This interview is not assigned to you. Please check your invitation email.'
      })
      return
    }

    // Link candidate to interview (will be overwritten by each candidate, but that's okay)
    interview.candidateId = user.clerkId
    interview.candidateEmail = user.email
    await interview.save()
    console.log(`✅ Linked candidate ${user.email} to interview ${interviewId}`)

    res.status(200).json({
      success: true,
      message: 'Candidate linked to interview successfully',
      interview: {
        id: interview._id,
        position: interview.position,
        status: interview.status,
        candidateId: interview.candidateId
      }
    })
  } catch (error) {
    console.error('Error linking candidate to interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to link candidate to interview'
    })
  }
}
