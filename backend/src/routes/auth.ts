import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { createOrUpdateUser, getUserProfile } from '../controllers/auth'

const router = express.Router()

// Public routes
router.post('/webhook', createOrUpdateUser) // Clerk webhook

// Protected routes
router.use(authenticateToken)

router.get('/profile', getUserProfile)

export default router
