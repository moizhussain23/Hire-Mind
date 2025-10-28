import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { User } from '../models/User'

export const getHRProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const user = await User.findOne({ clerkId: userId })
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    if (user.role !== 'hr') {
      res.status(403).json({
        success: false,
        error: 'Only HR users can access this endpoint'
      })
      return
    }

    res.status(200).json({
      success: true,
      profile: user.hrProfile || {
        isOnboardingComplete: false
      }
    })
  } catch (error) {
    console.error('Error fetching HR profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch HR profile'
    })
  }
}

export const updateHRProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.auth?.userId
    const {
      companyName,
      companySize,
      industry,
      website,
      phoneNumber,
      companyDescription,
      companyLogo
    } = req.body

    console.log('Update HR Profile - User ID:', userId)
    console.log('Update HR Profile - Request body:', req.body)

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      })
      return
    }

    const user = await User.findOne({ clerkId: userId })
    
    console.log('Found user:', user ? `${user.email} (role: ${user.role})` : 'NOT FOUND')
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    if (user.role !== 'hr') {
      console.log('User role mismatch - Expected: hr, Got:', user.role)
      res.status(403).json({
        success: false,
        error: 'Only HR users can update HR profile. Current role: ' + user.role
      })
      return
    }

    // Update HR profile
    user.hrProfile = {
      companyName,
      companySize,
      industry,
      website,
      phoneNumber,
      companyDescription,
      companyLogo,
      isOnboardingComplete: true
    }

    await user.save()

    console.log('HR profile updated successfully for user:', user.email)

    res.status(200).json({
      success: true,
      message: 'HR profile updated successfully',
      profile: user.hrProfile
    })
  } catch (error) {
    console.error('Error updating HR profile:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update HR profile'
    })
  }
}
