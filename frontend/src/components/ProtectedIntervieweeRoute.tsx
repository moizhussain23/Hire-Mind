import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { hrProfileAPI } from '../services/api';

interface ProtectedIntervieweeRouteProps {
  children: React.ReactNode;
}

const ProtectedIntervieweeRoute: React.FC<ProtectedIntervieweeRouteProps> = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isHR, setIsHR] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!isLoaded || !isSignedIn) {
        setIsChecking(false);
        return;
      }

      try {
        // Check if user has HR profile
        const response = await hrProfileAPI.getProfile(getToken);
        if (response.data.profile) {
          // User is an HR, not an interviewee
          setIsHR(true);
        } else {
          // User is an interviewee
          setIsHR(false);
        }
      } catch (error) {
        // If API call fails (404 or error), user is not an HR
        console.log('User is not an HR (expected for interviewees)');
        setIsHR(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserRole();
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

  // If user is an HR, redirect to HR dashboard
  if (isHR) {
    return <Navigate to="/hr-dashboard" replace />;
  }

  // Render children if user is an interviewee (not HR)
  return <>{children}</>;
};

export default ProtectedIntervieweeRoute;
