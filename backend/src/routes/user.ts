import express from 'express'
import { syncUser } from '../controllers/user'

const router = express.Router()

// Public route - sync user data from Clerk
router.post('/sync', syncUser)

export default router
