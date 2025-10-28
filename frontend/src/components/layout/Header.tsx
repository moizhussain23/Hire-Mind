import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserButton } from '@clerk/clerk-react';
import { Link, useLocation } from 'react-router-dom';
import { Plus, Send, Settings } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isHRPage = location.pathname === '/hr';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-gradient-to-r from-[#070f2b]/90 via-[#1a1f3a]/90 to-[#070f2b]/90 border-b border-white/10 shadow-lg">
      {/* Animated gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and HR Portal Info */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              {/* Logo with glow effect */}
              <div className="flex items-baseline space-x-1 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative w-2.5 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm group-hover:h-12 transition-all shadow-lg shadow-blue-500/50"></div>
                <div className="relative w-2.5 h-12 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm shadow-lg shadow-purple-500/50"></div>
                <div className="relative w-2.5 h-8 bg-gradient-to-b from-blue-300 to-blue-500 rounded-sm group-hover:h-10 transition-all shadow-lg shadow-blue-400/50"></div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-blue-400 tracking-widest">
                  HIRE
                </span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  Mind
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          {isAuthenticated && !isHRPage && (
            <nav className="hidden md:flex space-x-2">
              {user?.role === "hr" ? (
                <Link
                  to="/hr"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/hr")
                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 shadow-lg"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  HR Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive("/dashboard")
                        ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/interview"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive("/interview")
                        ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 shadow-lg"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Start Interview
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* HR Action Buttons - only show on HR page */}
            {isHRPage && (
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    // Dispatch custom event to trigger modal
                    window.dispatchEvent(new CustomEvent('openCreateInterviewModal'));
                  }}
                  className="group relative flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Plus className="h-3.5 w-3.5 relative z-10" />
                  <span className="hidden sm:inline relative z-10 text-sm">Create Interview</span>
                </button>
                
                <button 
                  onClick={() => {
                    // Dispatch custom event to trigger invite modal
                    window.dispatchEvent(new CustomEvent('openInviteCandidatesModal'));
                  }}
                  className="group relative flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-3 py-1.5 rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 overflow-hidden"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <Send className="h-3.5 w-3.5 relative z-10" />
                  <span className="hidden sm:inline relative z-10 text-sm">Invite Candidates</span>
                </button>
                
                <Link
                  to="/hr/settings"
                  className="group relative flex items-center space-x-1.5 bg-white/10 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-white/20 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  title="Company Settings"
                >
                  <Settings className="h-3.5 w-3.5 relative z-10" />
                  <span className="hidden sm:inline relative z-10 text-sm">Settings</span>
                </Link>
              </div>
            )}
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName || "User"}
                  </span>
                  <span className="text-xs text-white/60 capitalize">
                    {user?.role || "HR Manager"}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-md opacity-50"></div>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-white/20 hover:ring-white/40 transition-all",
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>


      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;