import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { hrProfileAPI } from '../services/api';

interface ProtectedHRRouteProps {
  children: React.ReactNode;
}

const ProtectedHRRoute: React.FC<ProtectedHRRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!isLoaded || !isSignedIn) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await hrProfileAPI.getProfile(getToken);
        const profile = response.data.profile;
        setIsOnboardingComplete(profile?.isOnboardingComplete || false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setIsOnboardingComplete(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [isLoaded, isSignedIn, getToken]);

  // Show loading state while checking
  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070f2b] via-[#1a1f3a] to-[#070f2b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not signed in
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not complete
  if (!isOnboardingComplete) {
    return <Navigate to="/hr/onboarding" replace />;
  }

  // Render children if onboarding is complete
  return <>{children}</>;
};

export default ProtectedHRRoute;
