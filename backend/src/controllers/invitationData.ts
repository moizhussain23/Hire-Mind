import { Request, Response } from 'express';

export const getInvitationData = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is required'
      });
    }

    console.log('🔍 Loading invitation data for token:', token);

    // Import models
    const { Invitation } = require('../models/Invitation');
    const { Interview } = require('../models/Interview');
    const { InterviewSession } = require('../models/InterviewSession');

    let invitation = null;
    
    // First try to find invitation by token (original invitation token)
    invitation = await Invitation.findOne({ token }).lean();
    
    // If not found, try to find by session token
    if (!invitation) {
      console.log('🔍 Token not found as invitation token, checking session token...');
      const session = await InterviewSession.findOne({ sessionToken: token }).lean();
      
      if (session) {
        console.log('✅ Found session, loading invitation from session.invitationId');
        invitation = await Invitation.findById(session.invitationId).lean();
      }
    }
    
    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired invitation/session token'
      });
    }

    console.log('✅ Found invitation:', invitation.candidateEmail);

    // Find the associated interview
    const interview = await Interview.findById(invitation.interviewId).lean();
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Associated interview not found'
      });
    }

    console.log('✅ Found interview:', interview.jobTitle);

    // Prepare the data for the frontend
    const responseData = {
      invitation: {
        id: invitation._id,
        candidateName: invitation.candidateName || '',
        candidateEmail: invitation.candidateEmail,
        status: invitation.status,
        selectedTimeSlot: invitation.selectedTimeSlot,
        resumeUrl: invitation.resumeUrl || null,
        resumeData: invitation.resumeData || null, // This might not exist yet
        createdAt: invitation.createdAt,
        acceptedAt: invitation.acceptedAt
      },
      interview: {
        id: interview._id,
        jobTitle: interview.jobTitle || interview.skillCategory || 'Software Engineer', // Fallback to skillCategory
        description: interview.description || '',
        skillCategory: interview.skillCategory || 'technical',
        experienceLevel: interview.experienceLevel || 'mid-level',
        interviewType: interview.interviewType || 'both',
        duration: interview.duration || 45,
        questions: interview.questions || [],
        hrId: interview.hrId,
        createdAt: interview.createdAt
      }
    };

    console.log('📊 Prepared invitation data response');

    return res.json({
      success: true,
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ Error fetching invitation data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load invitation data'
    });
  }
};

export default {
  getInvitationData
};