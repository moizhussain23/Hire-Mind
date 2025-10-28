import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (clerkLoaded) {
      if (clerkUser) {
        // Transform Clerk user to our User type
        const transformedUser: User = {
          id: clerkUser.id,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          role: (clerkUser.unsafeMetadata?.role as string) || (clerkUser.publicMetadata?.role as string) || 'candidate',
          profileImage: clerkUser.imageUrl || '',
          createdAt: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
          lastLoginAt: clerkUser.lastSignInAt?.toISOString() || new Date().toISOString(),
          isActive: true
        };
        setUser(transformedUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    }
  }, [clerkUser, clerkLoaded]);

  const signOut = async () => {
    try {
      await clerkSignOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
    user,
    isLoading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
