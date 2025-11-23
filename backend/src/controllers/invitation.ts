import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { Invitation } from '../models/Invitation'
import { Interview } from '../models/Interview'
import { User } from '../models/User'
import crypto from 'crypto'
import { sendInvitationEmail, sendInvitationAcceptedEmail, sendInterviewScheduledEmail } from '../services/email'

/**
 * Get invitation details by token (for acceptance page)
 */
export const getInvitationByToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    console.log('🔍 Looking for invitation with token:', token)

    const invitation = await Invitation.findOne({ token })
    console.log('📋 Invitation found:', invitation ? 'YES' : 'NO')
    
    if (!invitation) {
      console.log('❌ Invitation not found in database')
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
      return
    }

    // Check if expired
    if (invitation.isExpired()) {
      invitation.status = 'expired'
      await invitation.save()
      
      res.status(410).json({
        success: false,
        error: 'This invitation has expired'
      })
      return
    }

    // Check if already accepted/declined
    if (invitation.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: `This invitation has already been ${invitation.status}`
      })
      return
    }

    // Get interview details
    const interview = await Interview.findById(invitation.interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Get HR details
    const hrUser = await User.findOne({ clerkId: interview.hrId })

    res.status(200).json({
      success: true,
      invitation: {
        id: invitation._id,
        candidateEmail: invitation.candidateEmail,
        candidateName: invitation.candidateName,
        timeSlots: invitation.timeSlots,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      },
      interview: {
        id: interview._id,
        position: interview.position,
        description: interview.description,
        skillCategory: interview.skillCategory,
        experienceLevel: interview.experienceLevel,
        interviewType: interview.interviewType,
        requireResume: interview.requireResume
      },
      company: {
        name: hrUser?.hrProfile?.companyName || 'Company',
        logo: hrUser?.hrProfile?.companyLogo
      }
    })
  } catch (error) {
    console.error('Error getting invitation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get invitation details'
    })
  }
}

/**
 * Accept invitation (candidate accepts and schedules interview)
 */
export const acceptInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const { selectedTimeSlot, resumeUrl, candidateName } = req.body
    const userId = req.auth?.userId // Clerk user ID

    if (!selectedTimeSlot) {
      res.status(400).json({
        success: false,
        error: 'Please select a time slot'
      })
      return
    }

    // Find invitation
    const invitation = await Invitation.findOne({ token })
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
      return
    }

    // Validate invitation
    if (!invitation.isValid()) {
      res.status(400).json({
        success: false,
        error: invitation.isExpired() ? 'Invitation has expired' : `Invitation has been ${invitation.status}`
      })
      return
    }

    // Validate selected time slot
    const selectedDate = new Date(selectedTimeSlot)
    const isValidSlot = invitation.timeSlots.some(
      slot => new Date(slot).getTime() === selectedDate.getTime()
    )

    if (!isValidSlot) {
      res.status(400).json({
        success: false,
        error: 'Invalid time slot selected'
      })
      return
    }

    // Get interview
    const interview = await Interview.findById(invitation.interviewId)
    if (!interview) {
      res.status(404).json({
        success: false,
        error: 'Interview not found'
      })
      return
    }

    // Check if resume is required
    if (interview.requireResume && !resumeUrl) {
      res.status(400).json({
        success: false,
        error: 'Resume upload is required'
      })
      return
    }

    // Update invitation
    invitation.status = 'accepted'
    invitation.selectedTimeSlot = selectedDate
    invitation.resumeUrl = resumeUrl
    invitation.candidateName = candidateName || invitation.candidateName
    invitation.acceptedAt = new Date()
    
    // Parse resume data immediately for interview preparation
    if (resumeUrl) {
      try {
        console.log('🔍 Parsing resume for interview preparation...');
        
        // Import resume parser
        const { parseResumeFromUrl } = require('./resumeController');
        
        // Fetch and parse resume
        const response = await fetch(resumeUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const { parseResume } = require('../services/resumeParser');
        const parsedResume = await parseResume(buffer);
        
        // Store parsed resume data in invitation for quick access
        (invitation as any).resumeData = {
          skills: parsedResume.skills || [],
          experience: parsedResume.experience || [],
          education: parsedResume.education || [],
          projects: parsedResume.projects || [],
          summary: parsedResume.summary || '',
          workExperience: parsedResume.workExperience || [],
          totalExperience: parsedResume.totalExperience || 0,
          parsedAt: new Date()
        };
        
        console.log('✅ Resume data parsed and stored successfully');
        console.log(`📊 Found: ${parsedResume.skills?.length || 0} skills, ${parsedResume.experience?.length || 0} experiences`);
        
      } catch (resumeParseError) {
        console.warn('⚠️ Failed to parse resume during invitation acceptance:', resumeParseError);
        // Continue without parsed data - will parse later during interview if needed
      }
    }
    
    await invitation.save()

    // Update interview - add to accepted candidates and update counts
    if (!interview.invitedCandidates) interview.invitedCandidates = []
    if (!interview.completedCandidates) interview.completedCandidates = []
    
    // Add to invited candidates if not already there
    if (!interview.invitedCandidates.includes(invitation.candidateEmail)) {
      interview.invitedCandidates.push(invitation.candidateEmail)
    }
    
    // Update total candidates invited count
    interview.totalCandidatesInvited = interview.invitedCandidates.length
    
    // Update interview status to scheduled if it was draft
    if (interview.status === 'draft') {
      interview.status = 'scheduled'
    }
    
    await interview.save()
    console.log(`✅ Interview updated: ${interview.invitedCandidates.length} candidates invited`)

    // Update or create user record with candidate information
    if (userId) {
      const updateData: any = {
        email: invitation.candidateEmail,
        role: 'candidate'
      }
      
      // Use the candidate name from the form (which comes from Clerk user)
      if (candidateName) {
        const nameParts = candidateName.trim().split(' ')
        updateData.firstName = nameParts[0] || candidateName
        updateData.lastName = nameParts.slice(1).join(' ') || ''
      }
      
      if (resumeUrl) {
        updateData.resumeUrl = resumeUrl
      }
      
      // Update user record - this links the Clerk account with the invitation email
      const updatedUser = await User.findOneAndUpdate(
        { clerkId: userId },
        updateData,
        { upsert: false, new: true }
      )
      
      console.log(`✅ User record updated for ${invitation.candidateEmail}:`, updatedUser?.firstName, updatedUser?.lastName)
    }

    // Get HR details for email
    const hrUser = await User.findOne({ clerkId: interview.hrId })

    // Send confirmation emails
    try {
      // Email to candidate - acceptance confirmation
      await sendInvitationAcceptedEmail(invitation.candidateEmail, {
        candidateName: invitation.candidateName || invitation.candidateEmail.split('@')[0],
        position: interview.position,
        companyName: hrUser?.hrProfile?.companyName || 'the company',
        selectedTimeSlot: selectedDate
      })

      // Email to candidate - interview details
      await sendInterviewScheduledEmail(invitation.candidateEmail, {
        candidateName: invitation.candidateName || invitation.candidateEmail.split('@')[0],
        position: interview.position,
        companyName: hrUser?.hrProfile?.companyName || 'the company',
        interviewDate: selectedDate,
        interviewType: interview.interviewType || 'video',
        hrName: hrUser ? `${hrUser.firstName} ${hrUser.lastName}` : undefined
      })

      // Email to HR - notify about candidate acceptance
      if (hrUser?.email) {
        const { sendEmail } = await import('../services/email')
        const companyName = hrUser.hrProfile?.companyName || 'Your Company'
        const hrName = `${hrUser.firstName || ''} ${hrUser.lastName || ''}`.trim() || 'HR Team'
        
        await sendEmail(
          hrUser.email,
          `✅ Interview Accepted - ${invitation.candidateName || 'Candidate'} | ${interview.position}`,
          `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
                .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.95; }
                .content { padding: 40px 30px; }
                .success-badge { display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
                .candidate-card { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 10px; padding: 25px; margin: 25px 0; }
                .candidate-card h3 { margin: 0 0 15px 0; color: #1e293b; font-size: 20px; }
                .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
                .info-row:last-child { border-bottom: none; }
                .info-label { color: #64748b; font-weight: 500; }
                .info-value { color: #1e293b; font-weight: 600; text-align: right; }
                .resume-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; transition: background 0.3s; }
                .resume-button:hover { background: #2563eb; }
                .dashboard-button { display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 25px 0; font-size: 16px; transition: background 0.3s; }
                .dashboard-button:hover { background: #059669; }
                .stats-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 8px; }
                .footer { background: #f8fafc; padding: 25px 30px; text-align: center; color: #64748b; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Great News!</h1>
                  <p>A candidate has accepted your interview invitation</p>
                </div>
                
                <div class="content">
                  <span class="success-badge">✅ INTERVIEW ACCEPTED</span>
                  
                  <div class="candidate-card">
                    <h3>👤 ${invitation.candidateName || invitation.candidateEmail}</h3>
                    
                    <div class="info-row">
                      <span class="info-label">📧&nbsp;&nbsp;Email</span>
                      <span class="info-value">${invitation.candidateEmail}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">💼&nbsp;&nbsp;Position</span>
                      <span class="info-value">${interview.position}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">📅&nbsp;&nbsp;Scheduled Time</span>
                      <span class="info-value">${selectedDate.toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">🎯&nbsp;&nbsp;Interview Type</span>
                      <span class="info-value">${interview.interviewType === 'video' ? '📹 Video' : interview.interviewType === 'voice' ? '🎤 Voice' : '🎥 Video & Voice'}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="info-label">⏱️&nbsp;&nbsp;Duration</span>
                      <span class="info-value">${interview.duration || 45} minutes</span>
                    </div>
                  </div>
                  
                  ${resumeUrl ? `
                    <div style="text-align: center;">
                      <a href="${resumeUrl.replace('/upload/', '/upload/fl_attachment/')}" class="resume-button" target="_blank" rel="noopener noreferrer">📄 Download Candidate Resume</a>
                      <br>
                      <a href="${resumeUrl}" style="color: #3b82f6; font-size: 14px; text-decoration: none; margin-top: 10px; display: inline-block;" target="_blank" rel="noopener noreferrer">Or view in browser →</a>
                    </div>
                  ` : '<p style="color: #64748b; font-style: italic;">No resume uploaded</p>'}
                  
                  <div class="stats-box">
                    <strong>📊 Campaign Statistics</strong><br>
                    <p style="margin: 10px 0 0 0;">
                      Total candidates invited: <strong>${interview.totalCandidatesInvited || 1}</strong><br>
                      Position: <strong>${interview.position}</strong><br>
                      Status: <strong style="color: #10b981;">Active</strong>
                    </p>
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/hr" class="dashboard-button">
                      📊 View Full Dashboard
                    </a>
                  </div>
                  
                  <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    <strong>Next Steps:</strong><br>
                    • Review the candidate's resume<br>
                    • Prepare interview questions<br>
                    • Ensure your interview setup is ready<br>
                    • The candidate will receive a reminder 30 minutes before the interview
                  </p>
                </div>
                
                <div class="footer">
                  <p style="margin: 0;">
                    Best regards,<br>
                    <strong>${companyName}</strong> Hiring Team
                  </p>
                  <p style="margin: 15px 0 0 0; font-size: 12px;">
                    This is an automated notification from your interview management system.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `
        )
        console.log(`✅ Professional notification email sent to HR: ${hrUser.email}`)
      }
    } catch (emailError) {
      console.error('Error sending confirmation emails:', emailError)
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Invitation accepted successfully',
      data: {
        invitationId: invitation._id,
        interviewId: interview._id,
        selectedTimeSlot: selectedDate,
        status: 'accepted'
      }
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to accept invitation'
    })
  }
}

/**
 * Decline invitation
 */
export const declineInvitation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.params
    const { reason } = req.body

    const invitation = await Invitation.findOne({ token })
    if (!invitation) {
      res.status(404).json({
        success: false,
        error: 'Invitation not found'
      })
      return
    }

    if (!invitation.isValid()) {
      res.status(400).json({
        success: false,
        error: 'Invitation is no longer valid'
      })
      return
    }

    invitation.status = 'declined'
    invitation.declinedAt = new Date()
    await invitation.save()

    // Notify HR about declined invitation
    try {
      // Import email service for HR notification
      const { sendEmail } = await import('../services/email');
      
      // Get interview details to find HR email and position
      const Interview = await import('../models/Interview');
      const interview = await Interview.Interview.findById(invitation.interviewId);
      
      // Use a fallback email since hrEmail doesn't exist in the interview model
      const hrEmail = process.env.HR_EMAIL || 'hr@company.com';
      const position = interview?.position || 'Unknown Position';
      
      // Send notification to HR
      await sendEmail(
        hrEmail,
        `Interview Invitation Declined - ${invitation.candidateName}`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Interview Invitation Declined</h2>
            <p>An interview invitation has been declined by the candidate.</p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>Candidate Details:</h3>
              <p><strong>Name:</strong> ${invitation.candidateName || 'Unknown'}</p>
              <p><strong>Email:</strong> ${invitation.candidateEmail}</p>
              <p><strong>Position:</strong> ${position}</p>
              <p><strong>Interview ID:</strong> ${invitation.interviewId}</p>
              <p><strong>Declined At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4>Reason Provided:</h4>
              <p style="margin: 0;">${reason || 'No reason provided'}</p>
            </div>
            
            <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
              You can review this in your HR dashboard or consider reaching out to the candidate for future opportunities.
            </p>
          </div>
        `
      );
      
      console.log('✅ HR notification sent for declined invitation');
    } catch (emailError) {
      console.warn('⚠️ Failed to send HR notification email:', emailError);
      // Don't fail the decline process if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Invitation declined',
      data: {
        invitationId: invitation._id,
        status: 'declined'
      }
    })
  } catch (error) {
    console.error('Error declining invitation:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to decline invitation'
    })
  }
}

/**
 * Get all invitations for a candidate (by email)
 */
export const getCandidateInvitations = async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get all invitations for this email
    const invitations = await Invitation.find({ 
      candidateEmail: user.email,
      status: 'pending'
    }).sort({ createdAt: -1 })

    // Get interview details for each invitation
    const invitationsWithDetails = await Promise.all(
      invitations.map(async (invitation) => {
        const interview = await Interview.findById(invitation.interviewId)
        const hrUser = await User.findOne({ clerkId: interview?.hrId })

        return {
          id: invitation._id,
          token: invitation.token,
          candidateEmail: invitation.candidateEmail,
          timeSlots: invitation.timeSlots,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
          sentAt: invitation.sentAt,
          interview: {
            position: interview?.position,
            description: interview?.description,
            skillCategory: interview?.skillCategory,
            experienceLevel: interview?.experienceLevel,
            interviewType: interview?.interviewType
          },
          company: {
            name: hrUser?.hrProfile?.companyName || 'Company',
            logo: hrUser?.hrProfile?.companyLogo
          }
        }
      })
    )

    res.status(200).json({
      success: true,
      invitations: invitationsWithDetails
    })
  } catch (error) {
    console.error('Error getting candidate invitations:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get invitations'
    })
  }
}

/**
 * Generate unique invitation token
 */
export function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
