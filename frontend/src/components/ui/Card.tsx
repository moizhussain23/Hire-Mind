import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${hover ? 'hover:shadow-lg transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
