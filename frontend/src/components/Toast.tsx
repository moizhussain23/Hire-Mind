import React from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  type?: 'success' | 'error' | 'info';
}

const Toast: React.FC<ToastProps> = ({ message, visible, type = 'success' }) => {
  if (!visible) return null;

  const bgColor = 
    type === 'success' ? 'bg-gray-800' : 
    type === 'error' ? 'bg-red-600' : 
    'bg-blue-600';

  const icon = type === 'success' ? <Check className="h-4 w-4 mr-2 text-green-400" /> : null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}>
        {icon}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;