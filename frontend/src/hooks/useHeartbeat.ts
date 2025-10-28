import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface UseHeartbeatOptions {
  sessionToken: string | null;
  isActive: boolean;
  intervalMs?: number;
}

/**
 * Custom hook to send heartbeat pings while interview is active
 * Sends a ping every 30 seconds to let backend know candidate is still connected
 */
export const useHeartbeat = ({ 
  sessionToken, 
  isActive, 
  intervalMs = 30000 // 30 seconds default
}: UseHeartbeatOptions) => {
  const { getToken } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatCountRef = useRef(0);

  const sendHeartbeat = async () => {
    if (!sessionToken || !isActive) return;

    try {
      const token = await getToken();
      const response = await axios.post(
        `${API_URL}/sessions/${sessionToken}/heartbeat`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        heartbeatCountRef.current += 1;
        console.log(`💓 Heartbeat sent (${heartbeatCountRef.current})`);
      }
    } catch (error: any) {
      console.error('❌ Heartbeat failed:', error.response?.data?.error || error.message);
      
      // If session is not active anymore, stop sending heartbeats
      if (error.response?.status === 400) {
        console.log('⚠️  Session no longer active, stopping heartbeats');
        stopHeartbeat();
      }
    }
  };

  const startHeartbeat = () => {
    if (intervalRef.current) return; // Already started

    console.log(`💓 Starting heartbeat (every ${intervalMs / 1000}s)`);
    
    // Send first heartbeat immediately
    sendHeartbeat();
    
    // Then send every intervalMs
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);
  };

  const stopHeartbeat = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('💔 Heartbeat stopped');
    }
  };

  useEffect(() => {
    if (isActive && sessionToken) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    // Cleanup on unmount
    return () => {
      stopHeartbeat();
    };
  }, [isActive, sessionToken, intervalMs]);

  return {
    heartbeatCount: heartbeatCountRef.current,
    sendHeartbeat,
    startHeartbeat,
    stopHeartbeat
  };
};
