import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  getCandidateInvitations
} from '../controllers/invitation'

const router = Router()

// Public route - get invitation details by token (no auth required for acceptance page)
router.get('/:token', getInvitationByToken)

// Protected routes - require authentication
router.post('/:token/accept', authenticateToken, acceptInvitation)
router.post('/:token/decline', authenticateToken, declineInvitation)
router.get('/candidate/list', authenticateToken, getCandidateInvitations)

export default router
