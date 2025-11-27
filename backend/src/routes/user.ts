import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { 
  syncUser, 
  getDashboardStats, 
  getPendingInvitations, 
  getUpcomingInterviews, 
  getInterviewResults 
} from '../controllers/user'

const router = express.Router()

// Public route - sync user data from Clerk
router.post('/sync', syncUser)

// Protected routes - require authentication
router.get('/dashboard-stats', authenticateToken, getDashboardStats)
router.get('/invitations/pending', authenticateToken, getPendingInvitations)
router.get('/interviews/upcoming', authenticateToken, getUpcomingInterviews)
router.get('/interviews/results', authenticateToken, getInterviewResults)

export default router
