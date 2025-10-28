import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '@clerk/backend'

export interface AuthRequest extends Request {
  auth?: {
    userId: string
    sessionId: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      })
      return
    }

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!
    })

    req.auth = {
      userId: payload.sub,
      sessionId: payload.sid
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    })
  }
}

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      // No token provided, continue without auth
      console.log('⚠️ No auth token provided, continuing without authentication')
      next()
      return
    }

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!
      })

      req.auth = {
        userId: payload.sub,
        sessionId: payload.sid
      }
      console.log('✅ Optional auth successful:', payload.sub)
    } catch (verifyError) {
      // Token invalid, but continue anyway
      console.log('⚠️ Invalid auth token, continuing without authentication')
    }

    next()
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    // Don't fail, just continue without auth
    next()
  }
}
