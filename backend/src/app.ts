// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env') })

// Initialize Sentry for error tracking (optional)
// Uncomment when you install @sentry/node
// import * as Sentry from '@sentry/node'
// if (process.env.SENTRY_DSN) {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     environment: process.env.NODE_ENV || 'development',
//     tracesSampleRate: 1.0,
//   })
//   console.log('🔍 Sentry error tracking enabled')
// }

// Now import everything else
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import routes
import authRoutes from './routes/auth'
import interviewRoutes from './routes/interview'
import hrRoutes from './routes/hr'
import hrProfileRoutes from './routes/hrProfile'
import initRoutes from './routes/init'
import webhookRoutes from './routes/webhook'
import invitationRoutes from './routes/invitation' // Phase 1: Invitation system
import userRoutes from './routes/user' // User sync routes
import sessionRoutes from './routes/session' // Phase 2: Session management
import verificationRoutes from './routes/verification' // Phase 0: Identity verification
import aiInterviewRoutes from './routes/aiInterview' // AI Interview (Gemini + TTS)
import ttsRoutes from './routes/tts' // TTS (Text-to-Speech) service
import resumeRoutes from './routes/resume' // Resume parsing
import testInterviewRoutes from './routes/testInterview' // Test interview endpoint

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { connectDB } from './utils/database'

// Import jobs (cron jobs for reminders)
import './jobs/reminderJobs'

const app = express()

// Sentry middleware (uncomment when Sentry is installed)
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.Handlers.requestHandler())
//   app.use(Sentry.Handlers.tracingHandler())
// }

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}))
// Disable HTTP request logging (too verbose)
// app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(limiter)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Routes
app.use('/api/webhooks', webhookRoutes) // Webhooks should be before other routes
app.use('/api/auth', authRoutes)
app.use('/api/interview', interviewRoutes)
app.use('/api/hr', hrRoutes)
app.use('/api/hr-profile', hrProfileRoutes)
app.use('/api/init', initRoutes)
app.use('/api/invitations', invitationRoutes) // Phase 1: Invitation system
app.use('/api/users', userRoutes) // User sync routes
app.use('/api/sessions', sessionRoutes) // Phase 2: Session management
app.use('/api/verification', verificationRoutes) // Phase 0: Identity verification
app.use('/api/ai-interview', aiInterviewRoutes) // AI Interview (Gemini + TTS)
app.use('/api/tts', ttsRoutes) // TTS (Text-to-Speech) service
app.use('/api/resume', resumeRoutes) // Resume parsing
app.use('/api/test-interview', testInterviewRoutes) // Test interview endpoint

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-interview', (interviewId) => {
    socket.join(interviewId)
    console.log(`User ${socket.id} joined interview ${interviewId}`)
  })

  socket.on('audio-data', (data) => {
    // Broadcast audio data to other participants
    socket.to(data.interviewId).emit('audio-data', data)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Sentry error handler (uncomment when Sentry is installed)
// if (process.env.SENTRY_DSN) {
//   app.use(Sentry.Handlers.errorHandler())
// }

// Error handling middleware
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  })
})

// Connect to database and start server
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    
    // Initialize schedulers for Phase 2
    const { initializeSchedulers } = await import('./jobs/sessionScheduler')
    initializeSchedulers()
    
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export { io }
