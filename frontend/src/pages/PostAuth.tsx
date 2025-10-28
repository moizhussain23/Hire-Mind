import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

const PostAuth: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Sync user data with backend
    const syncUserData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        await axios.post(`${API_URL}/users/sync`, {
          clerkId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName
        });
        console.log('✅ User data synced with backend');
      } catch (error) {
        console.error('Error syncing user data:', error);
        // Don't block the flow if sync fails
      }
    };

    syncUserData();

    // Check if there's a return URL (e.g., from invitation)
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      navigate(returnUrl, { replace: true });
      return;
    }

    const role = (user.unsafeMetadata?.role as string) || (user.publicMetadata?.role as string) || '';
    if (!role) {
      navigate('/select-role', { replace: true });
      return;
    }

    if (role === 'hr') {
      navigate('/hr', { replace: true });
      return;
    }

    navigate('/dashboard', { replace: true });
  }, [isLoaded, user, navigate, searchParams]);

  return null;
};

export default PostAuth;


