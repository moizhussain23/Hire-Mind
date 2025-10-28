import React from 'react';
import Button from '../../components/ui/Button';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg rotate-12" />
              <div className="absolute inset-0 w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-lg -rotate-12 opacity-70" />
            </div>
            <span className="text-xl md:text-2xl font-bold text-gray-900 italic">AI Interview</span>
          </div>

          <Button className="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
            Try AI Now
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;


