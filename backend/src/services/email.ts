import nodemailer from 'nodemailer'

// Create transporter using Brevo (Sendinblue) SMTP
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_KEY
  }
})

// Generic email sending function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to,
      subject,
      html
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

export const sendInterviewResults = async (
  candidateEmail: string,
  candidateName: string,
  interviewData: any
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: 'Your Interview Results - AI Interview Platform',
      html: generateResultsEmailHTML(candidateName, interviewData)
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    throw error
  }
}

export const sendInterviewScheduled = async (
  candidateEmail: string,
  candidateName: string,
  interviewData: any
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: 'Interview Scheduled - AI Interview Platform',
      html: generateScheduledEmailHTML(candidateName, interviewData)
    }

    const result = await transporter.sendMail(mailOptions)
  
    return result
  } catch (error) {
    
    throw error
  }
}

// Phase 1: New invitation email with acceptance link
export const sendInvitationEmail = async (
  candidateEmail: string,
  invitationData: {
    position: string
    description?: string
    skillCategory?: string
    experienceLevel?: string
    interviewType?: string
    invitationLink: string
    timeSlots: Date[]
    expiresAt: Date
    hrName?: string
    companyName?: string
    customMessage?: string
  }
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: `Interview Invitation - ${invitationData.position} at ${invitationData.companyName || 'Hire Mind'}`,
      html: generateNewInvitationEmailHTML(candidateEmail, invitationData)
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    throw error
  }
}

// Phase 1: Invitation accepted confirmation
export const sendInvitationAcceptedEmail = async (
  candidateEmail: string,
  data: {
    candidateName: string
    position: string
    companyName: string
    selectedTimeSlot: Date
  }
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: `Invitation Accepted - ${data.position}`,
      html: generateAcceptanceConfirmationHTML(data)
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    throw error
  }
}

// Phase 1: Interview scheduled confirmation
export const sendInterviewScheduledEmail = async (
  candidateEmail: string,
  data: {
    candidateName: string
    position: string
    companyName: string
    interviewDate: Date
    interviewType: string
    hrName?: string
  }
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: `Interview Scheduled - ${data.position} at ${data.companyName}`,
      html: generateScheduledConfirmationHTML(data)
    }

    const result = await transporter.sendMail(mailOptions)
    return result
  } catch (error) {
    throw error
  }
}

// Legacy function - kept for backward compatibility
export const sendInterviewInvitation = async (
  candidateEmail: string,
  interviewData: {
    position: string
    description?: string
    skillCategory?: string
    experienceLevel?: string
    interviewType?: string
    interviewLink: string
    hrName?: string
    companyName?: string
    customMessage?: string
  }
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: `Interview Invitation - ${interviewData.position} at ${interviewData.companyName || 'Hire Mind'}`,
      html: generateInvitationEmailHTML(candidateEmail, interviewData)
    }

    const result = await transporter.sendMail(mailOptions)
  
    return result
  } catch (error) {
    throw error
  }
}

const generateResultsEmailHTML = (candidateName: string, interviewData: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Results</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .score { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Interview Results</h1>
        </div>
        <div class="content">
          <h2>Hello ${candidateName}!</h2>
          <p>Thank you for completing your interview for the <strong>${interviewData.position}</strong> position.</p>
          
          <h3>Your Results:</h3>
          <div class="score">
            <strong>Overall Score: ${interviewData.evaluation?.overallScore || 'N/A'}%</strong>
          </div>
          
          <h3>Detailed Scores:</h3>
          <ul>
            <li>Content Quality: ${interviewData.evaluation?.contentQuality || 'N/A'}%</li>
            <li>Communication Skills: ${interviewData.evaluation?.communicationSkills || 'N/A'}%</li>
            <li>Confidence: ${interviewData.evaluation?.confidence || 'N/A'}%</li>
            <li>Technical Knowledge: ${interviewData.evaluation?.technicalKnowledge || 'N/A'}%</li>
          </ul>
          
          <h3>Feedback:</h3>
          <p>${interviewData.evaluation?.feedback || 'No feedback available.'}</p>
          
          <h3>Strengths:</h3>
          <ul>
            ${interviewData.evaluation?.strengths?.map((strength: string) => `<li>${strength}</li>`).join('') || '<li>No strengths recorded</li>'}
          </ul>
          
          <h3>Areas for Improvement:</h3>
          <ul>
            ${interviewData.evaluation?.areasForImprovement?.map((area: string) => `<li>${area}</li>`).join('') || '<li>No areas for improvement recorded</li>'}
          </ul>
        </div>
        <div class="footer">
          <p>Thank you for using AI Interview Platform!</p>
        </div>
      </div>
    </body>
    </html>
  `
}

const generateScheduledEmailHTML = (candidateName: string, interviewData: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Scheduled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Interview Scheduled</h1>
        </div>
        <div class="content">
          <h2>Hello ${candidateName}!</h2>
          <p>Your interview for the <strong>${interviewData.position}</strong> position has been scheduled.</p>
          
          <h3>Interview Details:</h3>
          <ul>
            <li><strong>Position:</strong> ${interviewData.position}</li>
            <li><strong>Date & Time:</strong> ${new Date(interviewData.scheduledTime).toLocaleString()}</li>
            <li><strong>Type:</strong> AI-Powered Video Interview</li>
          </ul>
          
          <h3>What to Expect:</h3>
          <ul>
            <li>Video and audio interview with our AI interviewer</li>
            <li>Technical and behavioral questions</li>
            <li>Real-time evaluation and feedback</li>
            <li>Duration: Approximately 30-45 minutes</li>
          </ul>
          
          <h3>Preparation Tips:</h3>
          <ul>
            <li>Ensure good lighting and a quiet environment</li>
            <li>Test your camera and microphone beforehand</li>
            <li>Have your resume and portfolio ready for reference</li>
            <li>Prepare examples of your work and achievements</li>
          </ul>
          
          <p>Good luck with your interview!</p>
        </div>
        <div class="footer">
          <p>AI Interview Platform</p>
        </div>
      </div>
    </body>
    </html>
  `
}

const generateInvitationEmailHTML = (candidateEmail: string, interviewData: any) => {
  const candidateName = candidateEmail.split('@')[0]
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Invitation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
          font-size: 16px;
        }
        .content { 
          padding: 40px 30px; 
          background: white; 
        }
        .content h2 {
          color: #667eea;
          margin-top: 0;
          font-size: 24px;
        }
        .interview-details {
          background: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .interview-details h3 {
          margin-top: 0;
          color: #667eea;
          font-size: 18px;
        }
        .interview-details ul {
          list-style: none;
          padding: 0;
          margin: 10px 0;
        }
        .interview-details li {
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        .interview-details li:last-child {
          border-bottom: none;
        }
        .interview-details strong {
          color: #4b5563;
          display: inline-block;
          width: 140px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          transition: transform 0.2s;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }
        .info-box {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .info-box h4 {
          margin: 0 0 10px 0;
          color: #92400e;
          font-size: 16px;
        }
        .info-box ul {
          margin: 5px 0;
          padding-left: 20px;
        }
        .info-box li {
          margin: 5px 0;
          color: #78350f;
        }
        .custom-message {
          background: #e0f2fe;
          border-left: 4px solid #0284c7;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          font-style: italic;
          color: #0c4a6e;
        }
        .footer { 
          text-align: center; 
          padding: 30px 20px; 
          background: #f9fafb;
          color: #6b7280;
          font-size: 14px;
        }
        .footer a {
          color: #667eea;
          text-decoration: none;
        }
        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 30px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 You're Invited to Interview!</h1>
          <p>${interviewData.companyName || 'Hire Mind'}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${candidateName}! 👋</h2>
          <p>We're excited to invite you to interview for the <strong>${interviewData.position}</strong> position at ${interviewData.companyName || 'our company'}.</p>
          
          ${interviewData.customMessage ? `
            <div class="custom-message">
              <strong>Message from the hiring team:</strong><br>
              "${interviewData.customMessage}"
            </div>
          ` : ''}
          
          <div class="interview-details">
            <h3>📋 Interview Details</h3>
            <ul>
              <li><strong>Position:</strong> ${interviewData.position}</li>
              ${interviewData.skillCategory ? `<li><strong>Category:</strong> ${interviewData.skillCategory}</li>` : ''}
              ${interviewData.experienceLevel ? `<li><strong>Level:</strong> ${interviewData.experienceLevel.charAt(0).toUpperCase() + interviewData.experienceLevel.slice(1)}</li>` : ''}
              ${interviewData.interviewType ? `<li><strong>Type:</strong> ${interviewData.interviewType === 'both' ? 'Video & Voice' : interviewData.interviewType.charAt(0).toUpperCase() + interviewData.interviewType.slice(1)}</li>` : ''}
              <li><strong>Duration:</strong> 30-45 minutes</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${interviewData.interviewLink}" class="cta-button">
              🚀 Start Your Interview
            </a>
            <p style="margin-top: 10px; font-size: 14px; color: #6b7280;">
              Click the button above or copy this link:<br>
              <a href="${interviewData.interviewLink}" style="color: #667eea; word-break: break-all;">${interviewData.interviewLink}</a>
            </p>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-box">
            <h4>💡 What to Expect</h4>
            <ul>
              <li>AI-powered interview with intelligent questions</li>
              <li>Real-time conversation and follow-up questions</li>
              <li>Automated evaluation and detailed feedback</li>
              <li>Professional and comfortable interview experience</li>
            </ul>
          </div>
          
          <div class="info-box">
            <h4>✅ Preparation Tips</h4>
            <ul>
              <li>Ensure you have a stable internet connection</li>
              <li>Use a quiet, well-lit environment</li>
              <li>Test your camera and microphone before starting</li>
              <li>Have your resume and portfolio ready for reference</li>
              <li>Prepare examples of your work and achievements</li>
            </ul>
          </div>
          
          <div class="divider"></div>
          
          <p style="margin-top: 30px;">
            <strong>Need help?</strong> If you have any questions or technical issues, please don't hesitate to reach out to us.
          </p>
          
          <p style="margin-top: 20px; color: #6b7280;">
            We look forward to learning more about you and your experience!
          </p>
          
          <p style="margin-top: 20px;">
            Best regards,<br>
            <strong>${interviewData.hrName || 'The Hiring Team'}</strong><br>
            ${interviewData.companyName || 'Hire Mind'}
          </p>
        </div>
        
        <div class="footer">
          <p>
            This is an automated interview invitation from Hire Mind.<br>
            © ${new Date().getFullYear()} Hire Mind. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Phase 1: New invitation email HTML with "Accept Invitation" button
const generateNewInvitationEmailHTML = (candidateEmail: string, invitationData: any) => {
  const candidateName = candidateEmail.split('@')[0]
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Invitation</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px; 
        }
        .time-slots {
          background: #f8f9ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .time-slots h3 {
          margin-top: 0;
          color: #667eea;
        }
        .time-slot {
          padding: 10px;
          margin: 8px 0;
          background: white;
          border-radius: 5px;
          border: 1px solid #e5e7eb;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          padding: 16px 40px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .expiry-notice {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 5px;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 You're Invited to Interview!</h1>
          <p>${invitationData.companyName || 'Hire Mind'}</p>
        </div>
        
        <div class="content">
          <h2>Hello ${candidateName}! 👋</h2>
          <p>We're excited to invite you to interview for the <strong>${invitationData.position}</strong> position at ${invitationData.companyName || 'our company'}.</p>
          
          ${invitationData.customMessage ? `
            <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <strong>Message from the hiring team:</strong><br>
              "${invitationData.customMessage}"
            </div>
          ` : ''}
          
          <div class="time-slots">
            <h3>📅 Available Time Slots</h3>
            <p>Please choose one of the following time slots for your interview:</p>
            ${invitationData.timeSlots.map((slot: Date, index: number) => `
              <div class="time-slot">
                <strong>Option ${index + 1}:</strong> ${formatDate(slot)}
              </div>
            `).join('')}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationData.invitationLink}" class="cta-button">
              ✅ Accept Invitation & Choose Time
            </a>
          </div>
          
          <div class="expiry-notice">
            <strong>⏰ Important:</strong> This invitation expires on ${formatDate(invitationData.expiresAt)}. 
            Please respond before this date to secure your interview slot.
          </div>
          
          <p style="margin-top: 30px;">
            <strong>What to expect:</strong>
          </p>
          <ul>
            <li>Choose your preferred time slot</li>
            <li>Upload your resume</li>
            <li>Complete a brief profile</li>
            <li>Receive interview confirmation</li>
          </ul>
          
          <p style="margin-top: 20px;">
            Best regards,<br>
            <strong>${invitationData.hrName || 'The Hiring Team'}</strong><br>
            ${invitationData.companyName || 'Hire Mind'}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Phase 1: Acceptance confirmation email
const generateAcceptanceConfirmationHTML = (data: any) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invitation Accepted</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Invitation Accepted!</h1>
        </div>
        <div class="content">
          <h2>Thank you, ${data.candidateName}!</h2>
          <p>We've received your acceptance for the <strong>${data.position}</strong> position at ${data.companyName}.</p>
          
          <div class="success-box">
            <h3 style="margin-top: 0; color: #065f46;">Your Interview is Scheduled</h3>
            <p><strong>Date & Time:</strong> ${formatDate(data.selectedTimeSlot)}</p>
            <p><strong>Position:</strong> ${data.position}</p>
          </div>
          
          <p>You'll receive another email shortly with detailed interview instructions and preparation tips.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>${data.companyName}</strong>
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Phase 1: Interview scheduled confirmation
const generateScheduledConfirmationHTML = (data: any) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Interview Scheduled</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; text-align: center; }
        .content { padding: 40px 30px; }
        .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .prep-tips { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Interview Scheduled</h1>
        </div>
        <div class="content">
          <h2>Hello ${data.candidateName}!</h2>
          <p>Your interview for the <strong>${data.position}</strong> position at ${data.companyName} has been confirmed.</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e40af;">Interview Details</h3>
            <p><strong>Date & Time:</strong> ${formatDate(data.interviewDate)}</p>
            <p><strong>Position:</strong> ${data.position}</p>
            <p><strong>Type:</strong> ${data.interviewType === 'both' ? 'Video & Voice' : data.interviewType.charAt(0).toUpperCase() + data.interviewType.slice(1)}</p>
            <p><strong>Duration:</strong> 30-45 minutes</p>
          </div>
          
          <div class="prep-tips">
            <h4 style="margin-top: 0; color: #92400e;">📝 Preparation Tips</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
              <li>Ensure stable internet connection</li>
              <li>Test your camera and microphone</li>
              <li>Find a quiet, well-lit space</li>
              <li>Have your resume ready for reference</li>
              <li>Prepare examples of your work</li>
            </ul>
          </div>
          
          <p><strong>You'll receive a reminder email 30 minutes before your interview with the join link.</strong></p>
          
          <p style="margin-top: 30px;">
            Good luck!<br>
            <strong>${data.hrName || 'The Hiring Team'}</strong><br>
            ${data.companyName}
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Phase 2: Join Interview Email (sent 30 minutes before)
export const sendJoinInterviewEmail = async (candidateEmail: string, data: any) => {
  try {
    const formatDate = (date: Date) => {
      return new Date(date).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@hiremind.com',
      to: candidateEmail,
      subject: `🎯 Your Interview Starts in 30 Minutes - ${data.position}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Join Your Interview</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 650px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
            .header p { margin: 10px 0 0 0; font-size: 18px; opacity: 0.95; }
            .content { padding: 40px 30px; }
            .urgent-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 10px 20px; border-radius: 25px; font-weight: 700; font-size: 16px; margin-bottom: 25px; border: 2px solid #fbbf24; }
            .time-box { background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left: 5px solid #3b82f6; padding: 25px; margin: 25px 0; border-radius: 10px; }
            .time-box h3 { margin: 0 0 10px 0; color: #1e40af; font-size: 20px; }
            .time-box p { margin: 0; font-size: 18px; font-weight: 600; color: #1e3a8a; }
            .join-button-container { text-align: center; margin: 35px 0; }
            .join-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 45px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 20px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); transition: transform 0.2s; }
            .join-button:hover { transform: scale(1.05); }
            .info-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .info-box h4 { margin: 0 0 10px 0; color: #065f46; font-size: 16px; }
            .info-box ul { margin: 10px 0; padding-left: 20px; }
            .info-box li { margin: 8px 0; color: #064e3b; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .warning-box p { margin: 0; color: #92400e; font-weight: 600; }
            .link-box { background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
            .link-box a { color: #3b82f6; text-decoration: none; font-weight: 600; }
            .footer { background: #f8fafc; padding: 25px 30px; text-align: center; color: #64748b; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Your Interview is Starting Soon!</h1>
              <p>Get ready to join</p>
            </div>
            
            <div class="content">
              <div style="text-align: center;">
                <span class="urgent-badge">⏰ STARTS IN 30 MINUTES</span>
              </div>
              
              <h2 style="color: #1e293b; margin-bottom: 10px;">Hello ${data.candidateName}!</h2>
              <p style="font-size: 16px; color: #475569;">Your interview for the <strong>${data.position}</strong> position is about to begin.</p>
              
              <div class="time-box">
                <h3>📅 Interview Time</h3>
                <p>${formatDate(data.scheduledTime)}</p>
              </div>
              
              <div class="join-button-container">
                <a href="${data.joinUrl}" class="join-button">
                  🚀 Join Interview Now
                </a>
              </div>
              
              <div class="warning-box">
                <p>⏰ <strong>Access Window:</strong> You can join 15 minutes before or after the scheduled time.</p>
              </div>
              
              <div class="info-box">
                <h4>📝 Before You Join - Quick Checklist:</h4>
                <ul>
                  <li>✅ Test your camera and microphone</li>
                  <li>✅ Find a quiet, well-lit space</li>
                  <li>✅ Have your resume ready for reference</li>
                  <li>✅ Close unnecessary browser tabs</li>
                  <li>✅ Ensure stable internet connection</li>
                  <li>✅ Have a glass of water nearby</li>
                </ul>
              </div>
              
              <div class="info-box">
                <h4>🎯 Interview Details:</h4>
                <p style="margin: 5px 0;"><strong>Type:</strong> ${data.interviewType === 'video' ? '📹 Video Interview' : data.interviewType === 'voice' ? '🎤 Voice Interview' : '🎥 Video & Voice Interview'}</p>
                <p style="margin: 5px 0;"><strong>Duration:</strong> ${data.duration} minutes</p>
              </div>
              
              <div class="link-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #1e293b;">Your Interview Link:</p>
                <a href="${data.joinUrl}">${data.joinUrl}</a>
              </div>
              
              <p style="margin-top: 25px; color: #64748b; font-size: 14px; font-style: italic;">
                <strong>Note:</strong> This link is unique to you and expires after the interview. If you experience any issues, please contact HR immediately.
              </p>
              
              <p style="margin-top: 30px; font-size: 16px; color: #1e293b;">
                <strong>Good luck! 🍀</strong><br>
                We're excited to speak with you.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                <strong>Hire Mind</strong> - AI-Powered Interview Platform
              </p>
              <p style="margin: 15px 0 0 0; font-size: 12px;">
                This is an automated notification. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    }

    const result = await transporter.sendMail(mailOptions)
    console.log(`✅ Join interview email sent to ${candidateEmail}`)
    return result
  } catch (error) {
    console.error('Error sending join interview email:', error)
    throw error
  }
}
