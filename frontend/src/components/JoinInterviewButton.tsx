import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface JoinInterviewButtonProps {
  sessionToken?: string;
  interviewDate: string;
  status: string;
  candidateEmail?: string;
}

const JoinInterviewButton: React.FC<JoinInterviewButtonProps> = ({
  sessionToken,
  interviewDate,
  status,
  candidateEmail
}) => {
  const navigate = useNavigate();
  const [canJoin, setCanJoin] = useState(false);
  const [buttonText, setButtonText] = useState('Check Availability');
  const [minutesUntil, setMinutesUntil] = useState<number>(0);

  useEffect(() => {
    checkAvailability();
    // Check every minute
    const interval = setInterval(checkAvailability, 60000);
    return () => clearInterval(interval);
  }, [interviewDate, sessionToken]);

  const checkAvailability = () => {
    const now = new Date();
    const interviewTime = new Date(interviewDate);
    const minutesDiff = Math.floor((interviewTime.getTime() - now.getTime()) / 60000);
    
    setMinutesUntil(minutesDiff);

    // Can join 15 minutes before to 15 minutes after
    if (minutesDiff > 15) {
      setCanJoin(false);
      if (minutesDiff < 60) {
        setButtonText(`Starts in ${minutesDiff} min`);
      } else {
        const hours = Math.floor(minutesDiff / 60);
        setButtonText(`Starts in ${hours}h ${minutesDiff % 60}m`);
      }
    } else if (minutesDiff >= -15) {
      setCanJoin(true);
      setButtonText('Join Now');
    } else {
      setCanJoin(false);
      setButtonText('Window Closed');
    }
  };

  const handleJoin = () => {
    if (sessionToken) {
      navigate(`/interview/join/${sessionToken}`);
    } else {
      // Session not created yet
      alert('Interview session not ready. You will receive an email 30 minutes before the interview with the join link.');
    }
  };

  // Don't show button if interview is completed
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
        <CheckCircle className="h-4 w-4" />
        <span>Completed</span>
      </span>
    );
  }

  // Don't show if not scheduled
  if (status !== 'scheduled') {
    return null;
  }

  return (
    <button
      onClick={handleJoin}
      disabled={!canJoin}
      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-all ${
        canJoin
          ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-lg'
          : 'bg-gray-200 text-gray-600 cursor-not-allowed'
      }`}
      title={canJoin ? 'Click to join interview' : 'Interview not yet available'}
    >
      {canJoin ? (
        <>
          <Video className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>{buttonText}</span>
        </>
      )}
    </button>
  );
};

export default JoinInterviewButton;
