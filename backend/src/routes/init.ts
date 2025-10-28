import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { initializeDatabase } from '../controllers/init'

const router = express.Router()

// Initialize database with sample data
router.post('/init', authenticateToken, initializeDatabase)

export default router

