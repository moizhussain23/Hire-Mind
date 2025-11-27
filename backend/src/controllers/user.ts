import { Response, Request } from 'express'
import { AuthRequest } from '../middleware/auth'
import { User } from '../models/User'
import { Invitation } from '../models/Invitation'
import { Interview } from '../models/Interview'
import { InterviewSession } from '../models/InterviewSession'

/**
 * Sync user data from Clerk to database
 * Creates or updates user record
 */
export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId, email, firstName, lastName } = req.body

    if (!clerkId || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: clerkId and email'
      })
      return
    }

    // Check if user exists
    let user = await User.findOne({ clerkId })

    if (user) {
      // Update existing user
      user.email = email
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
      await user.save()
      console.log(`✅ User updated: ${email}`)
    } else {
      // Create new user
      user = await User.create({
        clerkId,
        email,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        role: 'candidate' // Default role
      })
      console.log(`✅ User created: ${email}`)
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error syncing user:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to sync user data'
    })
  }
}

/**
 * Get candidate dashboard statistics
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get user email
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Get total interviews (accepted invitations)
    const totalInterviews = await Invitation.countDocuments({
      candidateEmail: user.email,
      status: 'accepted'
    })

    // Get pending invitations
    const pendingInvitations = await Invitation.countDocuments({
      candidateEmail: user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    })

    // Get completed interview sessions
    const completedSessions = await InterviewSession.find({
      candidateEmail: user.email,
      status: 'completed'
    })

    // Get corresponding interviews with scores
    const interviewsWithScores = await Promise.all(
      completedSessions.map(async (session) => {
        const interview = await Interview.findById(session.interviewId)
        return {
          session,
          interview,
          score: interview?.evaluation?.overallScore || 0
        }
      })
    )

    // Calculate average score from interviews that have scores
    let averageScore = 0
    const scoresArray = interviewsWithScores
      .filter(item => item.score > 0)
      .map(item => item.score)
    
    if (scoresArray.length > 0) {
      const totalScore = scoresArray.reduce((sum, score) => sum + score, 0)
      averageScore = Math.round(totalScore / scoresArray.length)
    }

    // Get next upcoming interview
    const nextInvitation = await Invitation.findOne({
      candidateEmail: user.email,
      status: 'accepted',
      selectedTimeSlot: { $gt: new Date() }
    }).sort({ selectedTimeSlot: 1 })

    let nextInterview = null
    if (nextInvitation?.selectedTimeSlot) {
      const timeDiff = nextInvitation.selectedTimeSlot.getTime() - new Date().getTime()
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) {
        nextInterview = 'Today'
      } else if (daysDiff === 1) {
        nextInterview = 'Tomorrow'
      } else if (daysDiff > 1) {
        nextInterview = `${daysDiff} days`
      }
    }

    res.status(200).json({
      totalInterviews,
      pendingInvitations,
      averageScore,
      nextInterview
    })
  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard statistics'
    })
  }
}

/**
 * Get pending invitations for candidate
 */
export const getPendingInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get user email
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Get pending invitations
    const invitations = await Invitation.find({
      candidateEmail: user.email,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 })

    // Get interview and company details for each invitation
    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const interview = await Interview.findById(invitation.interviewId)
        const hrUser = await User.findOne({ clerkId: interview?.hrId })

        return {
          id: invitation._id,
          company: hrUser?.hrProfile?.companyName || 'Company',
          position: interview?.position || 'Unknown Position',
          type: interview?.interviewType === 'video' ? 'Video Interview' : 
                interview?.interviewType === 'voice' ? 'Voice Interview' : 'Technical Interview',
          deadline: invitation.expiresAt.toISOString().split('T')[0],
          status: invitation.status,
          token: invitation.token
        }
      })
    )

    res.status(200).json({
      success: true,
      invitations: invitationsWithDetails
    })
  } catch (error) {
    console.error('Error getting pending invitations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get pending invitations'
    })
  }
}

/**
 * Get upcoming interviews for candidate
 */
export const getUpcomingInterviews = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get user email
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Get accepted invitations with future time slots
    const upcomingInvitations = await Invitation.find({
      candidateEmail: user.email,
      status: 'accepted',
      selectedTimeSlot: { $gt: new Date() }
    }).sort({ selectedTimeSlot: 1 })

    // Get interview details for each invitation
    const upcomingInterviews = await Promise.all(
      upcomingInvitations.map(async (invitation) => {
        const interview = await Interview.findById(invitation.interviewId)
        const hrUser = await User.findOne({ clerkId: interview?.hrId })

        const interviewDate = new Date(invitation.selectedTimeSlot!)
        
        return {
          id: invitation._id,
          company: hrUser?.hrProfile?.companyName || 'Company',
          position: interview?.position || 'Unknown Position',
          date: interviewDate.toISOString().split('T')[0],
          time: interviewDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          status: 'scheduled'
        }
      })
    )

    res.status(200).json({
      success: true,
      interviews: upcomingInterviews
    })
  } catch (error) {
    console.error('Error getting upcoming interviews:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get upcoming interviews'
    })
  }
}

/**
 * Get recent interview results for candidate
 */
export const getInterviewResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Get user email
    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    // Get completed interview sessions
    const completedSessions = await InterviewSession.find({
      candidateEmail: user.email,
      status: 'completed'
    }).sort({ updatedAt: -1 }).limit(10)

    // Get interview details for each session
    const results = await Promise.all(
      completedSessions.map(async (session) => {
        const invitation = await Invitation.findOne({ 
          candidateEmail: user.email,
          selectedTimeSlot: { $lte: session.updatedAt }
        }).sort({ selectedTimeSlot: -1 })
        
        const interview = invitation ? await Interview.findById(invitation.interviewId) : 
                         await Interview.findById(session.interviewId)
        const hrUser = interview ? await User.findOne({ clerkId: interview.hrId }) : null

        const sessionDate = session.updatedAt || session.createdAt
        
        return {
          id: session._id,
          company: hrUser?.hrProfile?.companyName || 'Company',
          position: interview?.position || session.position || 'Unknown Position',
          date: sessionDate.toISOString().split('T')[0],
          time: sessionDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          }),
          status: 'completed',
          score: interview?.evaluation?.overallScore || 0
        }
      })
    )

    res.status(200).json({
      success: true,
      results: results.filter(result => result.score > 0) // Only include results with scores
    })
  } catch (error) {
    console.error('Error getting interview results:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get interview results'
    })
  }
}
