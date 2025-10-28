import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { getHRProfile, updateHRProfile } from '../controllers/hrProfile'

const router = express.Router()

// Get HR profile
router.get('/profile', authenticateToken, getHRProfile)

// Update HR profile (onboarding)
router.put('/profile', authenticateToken, updateHRProfile)

export default router
