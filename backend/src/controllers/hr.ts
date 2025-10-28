import { Request, Response } from 'express'
import { Interview } from '../models/Interview'
import { User } from '../models/User'
import { Invitation } from '../models/Invitation'
import { InterviewSession } from '../models/InterviewSession'
import { AuthRequest } from '../middleware/auth'
import { sendInterviewInvitation } from '../services/email'

export const getCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get interviews for the current HR user only
    const interviews = await Interview.find({ hrId: userId })
      .sort({ createdAt: -1 })

    // console.log('Total interviews found:', interviews.length)

    // Fetch all invitations for these interviews (SINGLE SOURCE OF TRUTH)
    const interviewIds = interviews.map(i => i._id)
    const invitations = await Invitation.find({ interviewId: { $in: interviewIds } })
    
    console.log(`📊 Found ${interviews.length} interviews and ${invitations.length} invitations`)
    
    // Get all invited candidate emails from invitations
    const allInvitedEmails = new Set<string>()
    invitations.forEach(invitation => {
      allInvitedEmails.add(invitation.candidateEmail)
    })

    // Fetch user details for invited candidates
    const candidateUsers = await User.find({ email: { $in: Array.from(allInvitedEmails) } })
      .select('clerkId firstName lastName email');
    
    const candidateMapByEmail = new Map(
      candidateUsers.map(u => [u.email, u])
    );
    
    // Create a map of email -> invitation for quick lookup
    const invitationMap = new Map(
      invitations.map(inv => [inv.candidateEmail, inv])
    )

    // Fetch all sessions for these invitations
    const invitationIds = invitations.map(inv => inv._id)
    const sessions = await InterviewSession.find({ invitationId: { $in: invitationIds } })
    
    // Create a map of invitationId -> session for quick lookup
    const sessionMap = new Map(
      sessions.map(sess => [sess.invitationId.toString(), sess])
    )

    const candidates = interviews.map(interview => {
      // Get invited candidates for this interview from Invitations (not from interview.invitedCandidates)
      const interviewInvitations = invitations.filter(inv => 
        inv.interviewId?.toString() === (interview._id as any).toString()
      )
      
      console.log(`   Interview "${interview.position}": ${interviewInvitations.length} invitations`)
      
      const invitedCandidates = interviewInvitations.map(inv => {
        const email = inv.candidateEmail
        const user = candidateMapByEmail.get(email)
        const session = inv ? sessionMap.get((inv._id as any).toString()) : null
        
        // Check if this candidate has completed the interview using completedCandidates array
        const hasCompleted = interview.completedCandidates?.includes(email) || false
        // Check if this candidate was selected/hired
        const isSelected = interview.selectedCandidates?.includes(email) || false
        
        // Determine status based on session, invitation and interview state
        let status = 'invited' // Default: invitation sent but not accepted
        
        if (inv?.status === 'declined') {
          status = 'declined'
        } else if (inv?.status === 'expired' || (inv && inv.isExpired())) {
          status = 'expired'
        } else if (inv?.status === 'accepted') {
          // Check session status for more accurate state
          if (session) {
            const now = new Date()
            if (session.status === 'completed' || hasCompleted) {
              status = 'completed'
            } else if (session.status === 'active') {
              status = 'in-progress'
            } else if (session.status === 'pending') {
              // Check if interview time has passed
              if (now > session.accessWindowEnd) {
                status = 'missed' // Didn't join within access window
              } else {
                status = 'scheduled'
              }
            } else {
              status = 'scheduled'
            }
          } else {
            // No session created yet, but invitation accepted
            if (inv.selectedTimeSlot) {
              const now = new Date()
              const interviewTime = new Date(inv.selectedTimeSlot)
              const accessWindowEnd = new Date(interviewTime.getTime() + 15 * 60000)
              
              if (now > accessWindowEnd) {
                status = 'missed' // Interview time passed, no session
              } else {
                status = 'scheduled'
              }
            } else {
              status = 'scheduled'
            }
          }
        }
        
        return {
          email,
          firstName: user?.firstName || email.split('@')[0],
          lastName: user?.lastName || '',
          clerkId: user?.clerkId || null,
          registered: !!user,
          status,
          invitationStatus: inv?.status || 'pending',
          acceptedAt: inv?.acceptedAt,
          selectedTimeSlot: inv?.selectedTimeSlot,
          resumeUrl: inv?.resumeUrl,
          score: hasCompleted ? interview.evaluation?.overallScore : undefined,
          isSelected: isSelected
        }
      })
      
      
      return {
        id: interview._id,
        candidateId: interview.candidateId,
        invitedCandidates, // Array of invited candidates
        position: interview.position,
        description: interview.description,
        skillCategory: interview.skillCategory,
        experienceLevel: interview.experienceLevel,
        interviewType: interview.interviewType,
        interviewCategory: interview.interviewCategory,
        hasCodingRound: interview.hasCodingRound,
        allowedLanguages: interview.allowedLanguages,
        codingInstructions: interview.codingInstructions,
        technicalAssessmentType: interview.technicalAssessmentType,
        customQuestions: interview.customQuestions,
        status: interview.status,
        isClosed: interview.isClosed,
        closedAt: interview.closedAt,
        didYouGet: interview.didYouGet,
        selectedCandidates: interview.selectedCandidates,
        totalCandidatesInvited: interview.totalCandidatesInvited,
        totalCandidatesCompleted: interview.totalCandidatesCompleted,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.duration,
        evaluation: interview.evaluation,
        createdAt: interview.createdAt
      }
    })

    res.status(200).json({
      success: true,
      candidates
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates'
    })
  }
}

export const getCandidateDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { candidateId } = req.params
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get candidate details
    const candidate = await User.findById(candidateId)
    if (!candidate) {
      res.status(404).json({
        success: false,
        error: 'Candidate not found'
      })
      return
    }

    // Get candidate's interviews for the current HR user only
    const interviews = await Interview.find({ candidateId, hrId: userId })
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate._id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        role: candidate.role,
        profileImage: candidate.profileImage,
        resumeUrl: candidate.resumeUrl
      },
      interviews: interviews.map(interview => ({
        id: interview._id,
        position: interview.position,
        status: interview.status,
        startTime: interview.startTime,
        endTime: interview.endTime,
        duration: interview.duration,
        transcript: interview.transcript,
        evaluation: interview.evaluation,
        recordingUrl: interview.recordingUrl,
        reportUrl: interview.reportUrl
      }))
    })
  } catch (error) {
    console.error('Error fetching candidate details:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidate details'
    })
  }
}

export const downloadReport = async (req: AuthRequest, res: Response): Promise<void> => {
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
      .populate('candidateId', 'firstName lastName email')

    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Generate report data
    const reportData = {
      candidate: interview.candidateId,
      position: interview.position,
      interviewDate: interview.startTime,
      duration: interview.duration,
      transcript: interview.transcript,
      evaluation: interview.evaluation
    }

    // In a real implementation, you would generate a PDF here
    // For now, return the data as JSON
    res.status(200).json({
      success: true,
      report: reportData
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to download report'
    })
  }
}

export const scheduleInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { candidateId, position, scheduledTime } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Create scheduled interview
    const interview = new Interview({
      candidateId,
      hrId: userId,
      position,
      status: 'scheduled',
      startTime: new Date(scheduledTime)
    })

    await interview.save()

    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        candidateId: interview.candidateId,
        position: interview.position,
        status: interview.status,
        startTime: interview.startTime
      }
    })
  } catch (error) {
    console.error('Error scheduling interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to schedule interview'
    })
  }
}

export const updateInterviewStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const { status } = req.body
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

    interview.status = status
    await interview.save()

    res.status(200).json({
      success: true,
      interview: {
        id: interview._id,
        status: interview.status
      }
    })
  } catch (error) {
    console.error('Error updating interview status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update interview status'
    })
  }
}

export const createInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      jobTitle, 
      description, 
      skillCategory, 
      experienceLevel, 
      interviewType, 
      duration, 
      questions,
      interviewCategory,
      hasCodingRound,
      allowedLanguages,
      codingInstructions,
      technicalAssessmentType
    } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Create new interview template (without candidate yet)
    const interview = new Interview({
      hrId: userId,
      position: jobTitle,
      description: description,
      skillCategory: skillCategory,
      experienceLevel: experienceLevel,
      interviewType: interviewType,
      interviewCategory: interviewCategory || 'tech',
      hasCodingRound: hasCodingRound || false,
      allowedLanguages: allowedLanguages || [],
      codingInstructions: codingInstructions,
      technicalAssessmentType: technicalAssessmentType,
      duration: duration,
      customQuestions: questions || [],
      status: 'draft', // Draft until candidate is assigned
      isClosed: false,
      totalCandidatesInvited: 0,
      totalCandidatesCompleted: 0,
      createdAt: new Date()
    })

    await interview.save()

    res.status(201).json({
      success: true,
      interview: {
        id: interview._id,
        jobTitle: interview.position,
        description: interview.description,
        skillCategory: interview.skillCategory,
        experienceLevel: interview.experienceLevel,
        interviewType: interview.interviewType,
        interviewCategory: interview.interviewCategory,
        hasCodingRound: interview.hasCodingRound,
        allowedLanguages: interview.allowedLanguages,
        codingInstructions: interview.codingInstructions,
        technicalAssessmentType: interview.technicalAssessmentType,
        duration: interview.duration,
        status: interview.status,
        createdAt: interview.createdAt
      }
    })
  } catch (error) {
    console.error('Error creating interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create interview'
    })
  }
}

export const inviteCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId, candidateEmails, customMessage, timeSlots } = req.body
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Validate time slots
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Please provide at least one time slot for candidates to choose from'
      })
      return
    }

    // Find the interview
    const interview = await Interview.findById(interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Verify the interview belongs to the current HR user
    if (interview.hrId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only invite candidates to your own interviews'
      })
      return
    }

    // Update interview with time slots
    interview.timeSlots = timeSlots.map((slot: string) => new Date(slot))
    
    // Add invited candidates to the array (avoid duplicates)
    const existingInvited = interview.invitedCandidates || []
    const newCandidates = candidateEmails.filter((email: string) => !existingInvited.includes(email))
    interview.invitedCandidates = [...existingInvited, ...newCandidates]

    // Update interview status to scheduled
    interview.status = 'scheduled'
    interview.totalCandidatesInvited = interview.invitedCandidates.length
    await interview.save()

    // Get HR user details for email
    const hrUser = await User.findOne({ clerkId: userId })
    const hrName = hrUser ? `${hrUser.firstName} ${hrUser.lastName}` : undefined
    const companyName = hrUser?.hrProfile?.companyName

    // Import Invitation model and generateInvitationToken
    const { Invitation } = await import('../models/Invitation')
    const { generateInvitationToken } = await import('./invitation')

    // Base URL for invitation links
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const invitationExpiryHours = interview.invitationExpiryHours || 48

    // Create invitations and send emails
    const invitationResults = []
    const emailResults = []

    for (const email of candidateEmails) {
      try {
        // Generate unique token
        const token = generateInvitationToken()
        
        // Calculate expiry date
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + invitationExpiryHours)

        // Create invitation record
        const invitation = new Invitation({
          interviewId: interview._id,
          candidateEmail: email.toLowerCase().trim(),
          token,
          status: 'pending',
          timeSlots: interview.timeSlots,
          expiresAt,
          sentAt: new Date()
        })

        await invitation.save()
        console.log(`✅ Invitation record created for ${email} with token: ${token}`)

        // Generate invitation acceptance link
        const invitationLink = `${baseUrl}/invitation/accept/${token}`
        console.log(`🔗 Invitation link: ${invitationLink}`)

        invitationResults.push({
          email,
          token,
          invitationLink,
          expiresAt
        })

        // Send invitation email
        const { sendInvitationEmail } = await import('../services/email')
        
        await sendInvitationEmail(email, {
          position: interview.position,
          description: interview.description,
          skillCategory: interview.skillCategory,
          experienceLevel: interview.experienceLevel,
          interviewType: interview.interviewType,
          invitationLink,
          timeSlots: interview.timeSlots,
          expiresAt,
          hrName,
          companyName,
          customMessage
        })

        emailResults.push({ email, status: 'sent' })
        console.log(`✅ Invitation sent to ${email}`)
      } catch (error) {
        console.error(`❌ Failed to send invitation to ${email}:`, error)
        emailResults.push({ email, status: 'failed', error: String(error) })
      }
    }

    res.status(200).json({
      success: true,
      message: 'Invitations sent successfully',
      data: {
        interviewId,
        candidateCount: candidateEmails.length,
        invitations: invitationResults,
        emailResults
      }
    })
  } catch (error) {
    console.error('Error inviting candidates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send invitations'
    })
  }
}

export const closeInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const { didYouGet, selectedCandidates } = req.body
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

    // Verify the interview belongs to the current HR user
    if (interview.hrId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only close your own interviews'
      })
      return
    }

    // Check if already closed
    if (interview.isClosed) {
      res.status(400).json({
        success: false,
        error: 'Interview is already closed'
      })
      return
    }

    interview.isClosed = true
    interview.status = 'closed'
    interview.closedAt = new Date()
    if (didYouGet !== undefined) {
      interview.didYouGet = didYouGet
    }
    if (selectedCandidates && Array.isArray(selectedCandidates)) {
      interview.selectedCandidates = selectedCandidates
    }

    await interview.save()

    res.status(200).json({
      success: true,
      message: 'Interview closed successfully',
      interview: {
        id: interview._id,
        isClosed: interview.isClosed,
        closedAt: interview.closedAt,
        didYouGet: interview.didYouGet,
        selectedCandidates: interview.selectedCandidates
      }
    })
  } catch (error) {
    console.error('Error closing interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to close interview'
    })
  }
}

export const updateInterview = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const userId = req.auth?.userId
    const {
      jobTitle,
      jobDescription,
      experienceLevel,
      interviewType,
      category,
      hasCodingRound,
      codingLanguages
    } = req.body

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

    // Verify the interview belongs to the current HR user
    if (interview.hrId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own interviews'
      })
      return
    }

    // Update interview fields
    interview.position = jobTitle
    interview.description = jobDescription
    interview.experienceLevel = experienceLevel
    interview.interviewType = interviewType
    interview.interviewCategory = category
    
    if (category === 'tech') {
      interview.hasCodingRound = hasCodingRound
      interview.allowedLanguages = hasCodingRound ? codingLanguages : []
    } else {
      interview.hasCodingRound = false
      interview.allowedLanguages = []
    }

    await interview.save()

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      interview
    })
  } catch (error) {
    console.error('Error updating interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update interview'
    })
  }
}

export const deleteInterview = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Verify the interview belongs to the current HR user
    if (interview.hrId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only delete your own interviews'
      })
      return
    }

    await Interview.findByIdAndDelete(interviewId)

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting interview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete interview'
    })
  }
}

export const updateDidYouGet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { interviewId } = req.params
    const { didYouGet } = req.body
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

    // Verify the interview belongs to the current HR user
    if (interview.hrId !== userId) {
      res.status(403).json({
        success: false,
        error: 'You can only update your own interviews'
      })
      return
    }

    // Check if interview is closed
    if (!interview.isClosed) {
      res.status(400).json({
        success: false,
        error: 'Can only set "Did You Get" status for closed interviews'
      })
      return
    }

    interview.didYouGet = didYouGet
    await interview.save()

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      interview: {
        id: interview._id,
        didYouGet: interview.didYouGet
      }
    })
  } catch (error) {
    console.error('Error updating did you get status:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update status'
    })
  }
}
