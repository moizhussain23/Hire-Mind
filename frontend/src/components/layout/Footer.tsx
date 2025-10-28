import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="relative border-t border-white/10 py-12" style={{
      background: 'linear-gradient(to bottom, rgba(7, 15, 43, 0.95), rgba(7, 15, 43, 1))'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4 group cursor-pointer">
              <div className="flex items-baseline space-x-0.5 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 blur-xl group-hover:blur-2xl transition-all"></div>
                <div className="relative w-2.5 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm group-hover:h-12 transition-all shadow-lg shadow-blue-500/50"></div>
                <div className="relative w-2.5 h-12 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm shadow-lg shadow-purple-500/50"></div>
                <div className="relative w-2.5 h-8 bg-gradient-to-b from-blue-300 to-blue-500 rounded-sm group-hover:h-10 transition-all shadow-lg shadow-blue-400/50"></div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold text-blue-400 tracking-widest">HIRE</span>
                <span className="text-2xl font-bold text-white tracking-tight">Mind</span>
              </div>
            </div>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Revolutionizing the interview process with AI-powered interviews, 
              real-time evaluation, and comprehensive candidate insights that drive better hires.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white/60 hover:text-blue-400 text-sm transition-all hover:translate-x-1 inline-block">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/interview" className="text-white/60 hover:text-blue-400 text-sm transition-all hover:translate-x-1 inline-block">
                  Start Interview
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/contact" className="text-white/60 hover:text-blue-400 text-sm transition-all hover:translate-x-1 inline-block">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-white/60 hover:text-blue-400 text-sm transition-all hover:translate-x-1 inline-block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-white/60 hover:text-blue-400 text-sm transition-all hover:translate-x-1 inline-block">
                  Terms & Conditions
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2025 HireMind. All rights reserved.
            </p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex space-x-6">
                <a href="#" className="text-white/40 hover:text-blue-400 transition-colors transform hover:scale-110 duration-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-white/40 hover:text-blue-400 transition-colors transform hover:scale-110 duration-200">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;