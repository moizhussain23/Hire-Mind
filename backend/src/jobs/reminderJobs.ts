import cron from 'node-cron';
import { InterviewSession } from '../models/InterviewSession';
import { sendEmail } from '../services/email';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Run every 15 minutes to check for upcoming interviews
cron.schedule('*/15 * * * *', async () => {
  console.log('🔔 [Reminder Job] Checking for upcoming interviews...');
  
  try {
    const now = new Date();
    
    // Check for interviews starting in 30 minutes
    await send30MinuteReminders(now);
    
    // Check for interviews in 1 day
    await send1DayReminders(now);
    
    // Check for interviews in 2 days
    await send2DayReminders(now);
    
    console.log('✅ [Reminder Job] Check complete');
  } catch (error) {
    console.error('❌ [Reminder Job] Error:', error);
  }
});

// Send 30-minute reminder with active join link
async function send30MinuteReminders(now: Date) {
  const in30Minutes = new Date(now.getTime() + 30 * 60000);
  const in35Minutes = new Date(now.getTime() + 35 * 60000);
  
  const sessions = await InterviewSession.find({
    scheduledTime: {
      $gte: in30Minutes,
      $lt: in35Minutes
    },
    status: 'scheduled',
    reminderSent30Min: { $ne: true }
  }).populate('interviewId');
  
  console.log(`📧 Found ${sessions.length} interviews starting in 30 minutes`);
  
  for (const session of sessions) {
    try {
      // Skip if no scheduled time
      if (!session.scheduledTime) {
        console.log(`⚠️ Skipping session ${session.sessionToken} - no scheduled time`);
        continue;
      }
      
      const joinUrl = `${FRONTEND_URL}/interview/join/${session.sessionToken}`;
      const scheduledTime = new Date(session.scheduledTime);
      const timeString = scheduledTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      await sendEmail(
        session.candidateEmail,
        '🎯 Your Interview Starts in 30 Minutes - Join Now!',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; background: #4F46E5; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .tips { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎯 Interview Starting Soon!</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px;"><strong>Hi ${session.candidateName},</strong></p>
                
                <p style="font-size: 16px;">Your interview for <strong>${session.position}</strong> starts in <strong>30 minutes</strong>!</p>
                
                <p style="font-size: 16px;"><strong>Scheduled Time:</strong> ${timeString}</p>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 16px; color: #1e40af;">
                    ✅ <strong>Your interview link is now ACTIVE!</strong><br>
                    You can join anytime in the next 2.5 hours.
                  </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${joinUrl}" class="button" style="color: white;">
                    Join Interview Now →
                  </a>
                </div>
                
                <div class="tips">
                  <h3 style="margin-top: 0; color: #4F46E5;">📋 Quick Checklist:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>✅ Test your microphone and camera</li>
                    <li>✅ Find a quiet, well-lit place</li>
                    <li>✅ Have your resume ready for reference</li>
                    <li>✅ Close unnecessary browser tabs</li>
                    <li>✅ Keep a glass of water nearby</li>
                  </ul>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e;">
                    <strong>⚠️ Important:</strong> The interview link will expire 2 hours after the scheduled time.
                  </p>
                </div>
                
                <p style="font-size: 16px;">Good luck! You've got this! 💪</p>
                
                <div class="footer">
                  <p>Need help? Contact us at <a href="mailto:support@hiremind.com">support@hiremind.com</a></p>
                  <p style="color: #9ca3af; font-size: 12px;">Hire Mind - AI-Powered Interview Platform</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );
      
      // Mark as sent
      session.reminderSent30Min = true;
      await session.save();
      
      console.log(`✅ Sent 30-min reminder to ${session.candidateEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send 30-min reminder to ${session.candidateEmail}:`, error);
    }
  }
}

// Send 1-day reminder
async function send1DayReminders(now: Date) {
  const in1Day = new Date(now.getTime() + 24 * 60 * 60000);
  const in1DayPlus1Hour = new Date(in1Day.getTime() + 60 * 60000);
  
  const sessions = await InterviewSession.find({
    scheduledTime: {
      $gte: in1Day,
      $lt: in1DayPlus1Hour
    },
    status: 'scheduled',
    reminderSent1Day: { $ne: true }
  });
  
  console.log(`📧 Found ${sessions.length} interviews in 1 day`);
  
  for (const session of sessions) {
    try {
      // Skip if no scheduled time
      if (!session.scheduledTime) {
        console.log(`⚠️ Skipping session ${session.sessionToken} - no scheduled time`);
        continue;
      }
      
      const scheduledTime = new Date(session.scheduledTime);
      const timeString = scheduledTime.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      await sendEmail(
        session.candidateEmail,
        '⏰ Interview Tomorrow - Get Ready!',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .prep-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">⏰ Interview Tomorrow!</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px;"><strong>Hi ${session.candidateName},</strong></p>
                
                <p style="font-size: 16px;">Your interview for <strong>${session.position}</strong> is tomorrow!</p>
                
                <p style="font-size: 16px;"><strong>Scheduled Time:</strong> ${timeString}</p>
                
                <div class="prep-box">
                  <h3 style="margin-top: 0; color: #10b981;">🎯 Prepare Tonight:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Review the job description and requirements</li>
                    <li>Prepare examples from your past experience</li>
                    <li>Research the company and role</li>
                    <li>Test your internet connection</li>
                    <li>Ensure your camera and microphone work properly</li>
                    <li>Choose a quiet, professional environment</li>
                  </ul>
                </div>
                
                <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #1e40af;">
                    💡 <strong>Pro Tip:</strong> You'll receive the interview join link 30 minutes before the scheduled time.
                  </p>
                </div>
                
                <p style="font-size: 16px;">See you tomorrow! 🚀</p>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                  <p>Questions? Contact us at <a href="mailto:support@hiremind.com">support@hiremind.com</a></p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );
      
      session.reminderSent1Day = true;
      await session.save();
      
      console.log(`✅ Sent 1-day reminder to ${session.candidateEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send 1-day reminder to ${session.candidateEmail}:`, error);
    }
  }
}

// Send 2-day reminder
async function send2DayReminders(now: Date) {
  const in2Days = new Date(now.getTime() + 48 * 60 * 60000);
  const in2DaysPlus1Hour = new Date(in2Days.getTime() + 60 * 60000);
  
  const sessions = await InterviewSession.find({
    scheduledTime: {
      $gte: in2Days,
      $lt: in2DaysPlus1Hour
    },
    status: 'scheduled',
    reminderSent2Days: { $ne: true }
  });
  
  console.log(`📧 Found ${sessions.length} interviews in 2 days`);
  
  for (const session of sessions) {
    try {
      // Skip if no scheduled time
      if (!session.scheduledTime) {
        console.log(`⚠️ Skipping session ${session.sessionToken} - no scheduled time`);
        continue;
      }
      
      const scheduledTime = new Date(session.scheduledTime);
      const timeString = scheduledTime.toLocaleString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      await sendEmail(
        session.candidateEmail,
        '📅 Interview Reminder - 2 Days to Go',
        `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">📅 Interview Reminder</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px;"><strong>Hi ${session.candidateName},</strong></p>
                
                <p style="font-size: 16px;">This is a friendly reminder that your interview for <strong>${session.position}</strong> is scheduled in <strong>2 days</strong>.</p>
                
                <p style="font-size: 16px;"><strong>Date & Time:</strong> ${timeString}</p>
                
                <div style="background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #4F46E5;">📝 What to Expect:</h3>
                  <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>AI-powered interview with voice interaction</li>
                    <li>Questions based on your resume and experience</li>
                    <li>Duration: Approximately 30-45 minutes</li>
                    <li>You'll need a working camera and microphone</li>
                  </ul>
                </div>
                
                <p style="font-size: 16px;">You'll receive another reminder 1 day before, and the join link 30 minutes before the interview.</p>
                
                <p style="font-size: 16px;">Best of luck with your preparation! 💼</p>
                
                <div style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 30px;">
                  <p>Hire Mind - AI-Powered Interview Platform</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      );
      
      session.reminderSent2Days = true;
      await session.save();
      
      console.log(`✅ Sent 2-day reminder to ${session.candidateEmail}`);
    } catch (error) {
      console.error(`❌ Failed to send 2-day reminder to ${session.candidateEmail}:`, error);
    }
  }
}

console.log('✅ [Reminder Jobs] Initialized - Running every 15 minutes');

export default {};
