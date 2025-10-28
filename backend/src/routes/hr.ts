import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { 
  getCandidates, 
  getCandidateDetails, 
  downloadReport, 
  scheduleInterview, 
  updateInterviewStatus,
  createInterview,
  inviteCandidates,
  closeInterview,
  updateInterview,
  deleteInterview,
  updateDidYouGet
} from '../controllers/hr'

const router = express.Router()

// All routes require authentication
router.use(authenticateToken)

// HR Dashboard
router.get('/candidates', getCandidates)
router.get('/candidates/:candidateId', getCandidateDetails)
router.get('/interviews', getCandidates) // Alias for candidates

// Interview management
router.post('/interviews/create', createInterview)
router.post('/interviews/invite', inviteCandidates)
router.post('/interviews/schedule', scheduleInterview)
router.put('/interviews/:interviewId/status', updateInterviewStatus)
router.put('/interviews/:interviewId/close', closeInterview)
router.put('/interviews/:interviewId', updateInterview)
router.delete('/interviews/:interviewId', deleteInterview)
router.put('/interviews/:interviewId/did-you-get', updateDidYouGet)

// Reports
router.get('/reports/:interviewId/download', downloadReport)

export default router
