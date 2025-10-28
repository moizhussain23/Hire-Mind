import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { User } from '../models/User'
import { Interview } from '../models/Interview'

export const initializeDatabase = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    // Check if data already exists
    const existingUsers = await User.countDocuments()
    const existingInterviews = await Interview.countDocuments()

    if (existingUsers > 0 || existingInterviews > 0) {
      res.status(200).json({
        success: true,
        message: 'Database already has data',
        data: {
          users: existingUsers,
          interviews: existingInterviews
        }
      })
      return
    }

    // Create sample users
    const sampleUsers = [
      {
        clerkId: 'user_2sample_hr_001',
        email: 'hr@hiremind.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'hr' as const,
        profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
      },
      {
        clerkId: 'user_2sample_candidate_001',
        email: 'john.doe@email.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'candidate' as const,
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        resumeUrl: 'https://example.com/resumes/john-doe-resume.pdf'
      },
      {
        clerkId: 'user_2sample_candidate_002',
        email: 'jane.smith@email.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'candidate' as const,
        profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        resumeUrl: 'https://example.com/resumes/jane-smith-resume.pdf'
      },
      {
        clerkId: 'user_2sample_candidate_003',
        email: 'mike.johnson@email.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'candidate' as const,
        profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        resumeUrl: 'https://example.com/resumes/mike-johnson-resume.pdf'
      },
      {
        clerkId: 'user_2sample_candidate_004',
        email: 'sarah.williams@email.com',
        firstName: 'Sarah',
        lastName: 'Williams',
        role: 'candidate' as const,
        profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        resumeUrl: 'https://example.com/resumes/sarah-williams-resume.pdf'
      }
    ]

    const createdUsers = await User.insertMany(sampleUsers) as any[]

    // Create sample interviews
    const sampleInterviews = [
      {
        candidateId: createdUsers[1]._id.toString(), // John Doe
        hrId: userId, // Current logged-in HR user
        position: 'Senior Frontend Developer',
        status: 'completed' as const,
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T11:30:00Z'),
        duration: 90,
        transcript: [
          {
            question: 'Tell me about your experience with React.',
            answer: 'I have 5+ years of experience with React, including hooks, context, and state management with Redux.',
            timestamp: new Date('2024-01-15T10:05:00Z')
          },
          {
            question: 'How do you handle performance optimization in React applications?',
            answer: 'I use React.memo, useMemo, useCallback, and code splitting to optimize performance.',
            timestamp: new Date('2024-01-15T10:15:00Z')
          }
        ],
        evaluation: {
          overallScore: 85,
          contentQuality: 88,
          communicationSkills: 82,
          confidence: 85,
          technicalKnowledge: 90,
          feedback: 'Strong technical knowledge with good communication skills. Shows confidence in React development.',
          strengths: ['Strong React knowledge', 'Good problem-solving approach', 'Clear communication'],
          areasForImprovement: ['Could elaborate more on testing strategies', 'More examples of complex state management']
        },
        recordingUrl: 'https://example.com/recordings/interview-001.mp4',
        reportUrl: 'https://example.com/reports/interview-001.pdf'
      },
      {
        candidateId: createdUsers[2]._id.toString(), // Jane Smith
        hrId: userId, // Current logged-in HR user
        position: 'Data Scientist',
        status: 'completed' as const,
        startTime: new Date('2024-01-16T14:00:00Z'),
        endTime: new Date('2024-01-16T15:45:00Z'),
        duration: 105,
        transcript: [
          {
            question: 'Describe your experience with machine learning algorithms.',
            answer: 'I have extensive experience with supervised and unsupervised learning, including neural networks and ensemble methods.',
            timestamp: new Date('2024-01-16T14:05:00Z')
          },
          {
            question: 'How do you evaluate model performance?',
            answer: 'I use various metrics like accuracy, precision, recall, F1-score, and ROC curves depending on the problem type.',
            timestamp: new Date('2024-01-16T14:20:00Z')
          }
        ],
        evaluation: {
          overallScore: 92,
          contentQuality: 94,
          communicationSkills: 90,
          confidence: 95,
          technicalKnowledge: 96,
          feedback: 'Excellent technical knowledge and communication. Very confident in data science concepts.',
          strengths: ['Deep ML knowledge', 'Excellent communication', 'Strong analytical thinking'],
          areasForImprovement: ['Could discuss more about data preprocessing', 'More examples of real-world applications']
        },
        recordingUrl: 'https://example.com/recordings/interview-002.mp4',
        reportUrl: 'https://example.com/reports/interview-002.pdf'
      },
      {
        candidateId: createdUsers[3]._id.toString(), // Mike Johnson
        hrId: userId, // Current logged-in HR user
        position: 'Senior Frontend Developer',
        status: 'in-progress' as const,
        startTime: new Date('2024-01-17T09:00:00Z'),
        transcript: [
          {
            question: 'What is your experience with TypeScript?',
            answer: 'I have been using TypeScript for 3 years and find it very helpful for large-scale applications.',
            timestamp: new Date('2024-01-17T09:05:00Z')
          }
        ],
        evaluation: {
          overallScore: 0,
          contentQuality: 0,
          communicationSkills: 0,
          confidence: 0,
          technicalKnowledge: 0,
          feedback: '',
          strengths: [],
          areasForImprovement: []
        }
      },
      {
        candidateId: createdUsers[4]._id.toString(), // Sarah Williams
        hrId: userId, // Current logged-in HR user
        position: 'Data Scientist',
        status: 'scheduled' as const,
        startTime: new Date('2024-01-18T15:00:00Z')
      }
    ]

    const createdInterviews = await Interview.insertMany(sampleInterviews)

    res.status(201).json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        users: createdUsers.length,
        interviews: createdInterviews.length
      }
    })

  } catch (error) {
    console.error('Error initializing database:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database'
    })
  }
}

