import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import { User } from '../models/User'

export const createOrUpdateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, email_addresses, first_name, last_name, image_url } = req.body.data

    if (!id || !email_addresses?.[0]?.email_address) {
      res.status(400).json({
        success: false,
        error: 'Missing required user data'
      })
      return
    }

    const email = email_addresses[0].email_address

    // Check if user exists
    let user = await User.findOne({ clerkId: id })

    if (user) {
      // Update existing user
      user.email = email
      user.firstName = first_name || user.firstName
      user.lastName = last_name || user.lastName
      user.profileImage = image_url || user.profileImage
      await user.save()
    } else {
      // Create new user
      user = new User({
        clerkId: id,
        email,
        firstName: first_name || '',
        lastName: last_name || '',
        profileImage: image_url,
        role: 'candidate' // Default role
      })
      await user.save()
    }

    res.status(200).json({
      success: true,
      message: 'User created/updated successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Error creating/updating user:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findOne({ clerkId: req.auth?.userId })

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        resumeUrl: user.resumeUrl
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
