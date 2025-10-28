import { useUser, useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

export const useAuthData = () => {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut } = useAuth()

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [signOut])

  const getUserData = useCallback(() => {
    if (!user) return null

    return {
      id: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt
    }
  }, [user])

  return {
    user,
    isLoaded,
    isSignedIn,
    userData: getUserData(),
    signOut: handleSignOut
  }
}
