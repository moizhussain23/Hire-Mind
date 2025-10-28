import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  isProcessing?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isProcessing = false
}) => {
  if (!isOpen) return null;

  const getColors = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          button: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          button: 'bg-orange-600 hover:bg-orange-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-fade-in-up">
        {/* Header */}
        <div className={`${colors.bg} ${colors.border} border-b-2 px-6 py-4 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`h-6 w-6 ${colors.icon}`} />
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="p-1 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing}
            className={`flex-1 px-4 py-3 ${colors.button} text-white rounded-lg transition-all font-medium disabled:opacity-50`}
          >
            {isProcessing ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
