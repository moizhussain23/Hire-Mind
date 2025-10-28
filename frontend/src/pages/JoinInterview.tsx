import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const JoinInterview: React.FC = () => {
  const { sessionToken } = useParams<{ sessionToken: string }>();
  const navigate = useNavigate();
  const { getToken, isSignedIn } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [availableAt, setAvailableAt] = useState<Date | null>(null);
  const [minutesUntil, setMinutesUntil] = useState<number>(0);

  useEffect(() => {
    if (!isSignedIn) {
      // Redirect to sign in with return URL
      navigate(`/sign-in?redirect_url=/interview/join/${sessionToken}`);
      return;
    }

    validateSession();
  }, [sessionToken, isSignedIn]);

  const validateSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      const response = await axios.get(
        `${API_URL}/sessions/${sessionToken}/validate`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSessionData(response.data);
        // Redirect to actual interview page
        navigate(`/interview/${response.data.interview.id}`, {
          state: { 
            sessionToken,
            sessionData: response.data 
          }
        });
      }
    } catch (err: any) {
      console.error('Session validation error:', err);
      const errorData = err.response?.data;
      setError(errorData?.error || 'Failed to validate session. Please try again.');
      setErrorCode(errorData?.code);
      
      if (errorData?.availableAt) {
        setAvailableAt(new Date(errorData.availableAt));
      }
      
      if (errorData?.minutesUntil) {
        setMinutesUntil(errorData.minutesUntil);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
          <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Validating Your Session</h2>
          <p className="text-gray-600">Please wait while we verify your interview access...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
          <div className="text-center mb-8">
            {errorCode === 'TOO_EARLY' ? (
              <Clock className="h-20 w-20 text-amber-500 mx-auto mb-6" />
            ) : (
              <AlertCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
            )}
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {errorCode === 'TOO_EARLY' 
                ? 'Interview Not Yet Available' 
                : errorCode === 'LINK_ALREADY_USED'
                ? 'Link Already Used'
                : 'Unable to Join Interview'}
            </h2>
            
            <p className="text-lg text-gray-700 mb-6">{error}</p>
            
            {errorCode === 'TOO_EARLY' && minutesUntil > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                <p className="text-amber-900 font-semibold text-xl mb-2">
                  ⏰ You can join in {minutesUntil} minutes
                </p>
                <p className="text-amber-700 text-sm">
                  The interview link will become active 15 minutes before the scheduled time.
                </p>
              </div>
            )}
            
            {errorCode === 'TOO_LATE' && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <p className="text-red-900 font-semibold mb-2">
                  The interview window has closed.
                </p>
                <p className="text-red-700 text-sm">
                  Please contact HR if you need to reschedule or if you believe this is an error.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              Go to Dashboard
            </button>
            
            {errorCode === 'TOO_EARLY' && (
              <button
                onClick={validateSession}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Check Again
              </button>
            )}
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact support at{' '}
              <a href="mailto:support@hiremind.com" className="text-indigo-600 hover:underline">
                support@hiremind.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null; // Will redirect if successful
};

export default JoinInterview;
