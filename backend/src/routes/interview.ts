import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { 
  startInterview, 
  endInterview, 
  getInterviewStatus,
  processAudioData,
  getInterviewHistory,
  linkCandidateToInterview
} from '../controllers/interview'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// Interview management
router.post('/start', startInterview)
router.post('/end/:interviewId', endInterview)
router.get('/status/:interviewId', getInterviewStatus)
router.get('/history', getInterviewHistory)
router.post('/link/:interviewId', linkCandidateToInterview) // Link candidate when they access interview

// Real-time audio processing
router.post('/audio', processAudioData)

export default router
