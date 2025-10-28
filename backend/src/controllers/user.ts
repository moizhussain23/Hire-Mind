import { Response, Request } from 'express'
import { User } from '../models/User'

/**
 * Sync user data from Clerk to database
 * Creates or updates user record
 */
export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId, email, firstName, lastName } = req.body

    if (!clerkId || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: clerkId and email'
      })
      return
    }

    // Check if user exists
    let user = await User.findOne({ clerkId })

    if (user) {
      // Update existing user
      user.email = email
      if (firstName) user.firstName = firstName
      if (lastName) user.lastName = lastName
      await user.save()
      console.log(`✅ User updated: ${email}`)
    } else {
      // Create new user
      user = await User.create({
        clerkId,
        email,
        firstName: firstName || email.split('@')[0],
        lastName: lastName || '',
        role: 'candidate' // Default role
      })
      console.log(`✅ User created: ${email}`)
    }

    res.status(200).json({
      success: true,
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
    console.error('Error syncing user:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to sync user data'
    })
  }
}
