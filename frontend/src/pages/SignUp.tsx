import React, { useState, useEffect } from 'react';
import { Zap, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SignUp } from '@clerk/clerk-react';

const SignUpPage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-[100svh] w-full relative overflow-hidden bg-[#070f2b] pb-[calc(env(safe-area-inset-bottom)+96px)]">
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 z-0 transition-transform duration-1000"
        style={{
          backgroundImage: `
            radial-gradient(at 78% 58%, #070f2b 0%, transparent 60%),
            radial-gradient(at 29% 63%, #1b1a55 0%, transparent 50%),
            radial-gradient(at 63% 16%, #535c91 0%, transparent 40%),
            radial-gradient(at 78% 24%, #9290c3 0%, transparent 30%)
          `,
          transform: `translateY(${scrollY * 0.3}px)`,
        }}
      />

      {/* Overlay pattern */}
      <div
        className="fixed inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Floating particles */}
      <div className="fixed inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Branding & Info */}
          <div className="text-left space-y-8 hidden lg:block">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">
                Join HIRE MIND
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Get Started with
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                HIRE MIND
              </span>
            </h1>

            <p className="text-xl text-white/80 leading-relaxed max-w-lg">
              Join thousands of professionals transforming the interview experience.
              Sign up to start your journey with smarter, faster, and fairer interviews.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              {[
                {
                  icon: <Zap className="w-5 h-5" />,
                  text: "24/7 AI Interviewing",
                  color: "from-blue-400 to-cyan-400",
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  text: "Advanced Security & Proctoring",
                  color: "from-purple-400 to-pink-400",
                },
                {
                  icon: <CheckCircle className="w-5 h-5" />,
                  text: "Instant Reports & Insights",
                  color: "from-green-400 to-emerald-400",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 group cursor-pointer"
                >
                  <div
                    className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <span className="text-white/90 font-medium">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Decorative elements */}
            <div className="relative pt-8">
              <div className="absolute -left-4 top-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
              <div
                className="absolute -right-4 bottom-0 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>

          {/* Right side - SignUp Card */}
          <div className="relative">
            {/* Glowing effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-3xl blur-3xl"></div>

            <div
              className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 sm:p-8 md:p-10 shadow-2xl transition-all duration-500 overflow-hidden"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                transform: isHovered ? "scale(1.02)" : "scale(1)",
              }}
            >
              {/* Logo/Badge */}
              <div className="flex items-center justify-center mb-6">
                <Link to="/" className="flex items-center space-x-3 group">
                  {/* Larger, more prominent bars with glow effect */}
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

              <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-2">
                Sign Up
              </h2>
              <p className="text-white/70 text-center mb-8">
                Create your account and start hiring smarter
              </p>

              {/* SignUp Form */}
<SignUp
  appearance={{
    baseTheme: 'dark',
    variables: {
      colorPrimary: '#a855f7',
      colorText: '#ffffff',
      colorTextSecondary: 'rgba(255,255,255,0.9)',
      colorBackground: 'transparent',
      colorInputBackground: 'rgba(83, 81, 81, 0.12)',
      colorInputText: '#ffffff',
      colorInputBorder: 'rgba(255,255,255,0.35)'
    },
    elements: {
      rootBox: "w-full max-w-md mx-auto px-4 box-border",
      card: "w-full bg-gray-900/80 backdrop-blur-md shadow-xl border border-white/30 rounded-2xl p-8",
      headerTitle: "hidden",
      headerSubtitle: "hidden",
      socialButtonsBlockButton:
        "bg-white/10 border border-white/30 text-white hover:bg-white/20 h-11 rounded-xl w-full justify-start px-4 overflow-visible",
      socialButtonsBlockButtonText: "text-white text-base",
      socialButtonsBlock: "gap-3 mb-2",
      dividerRow: "my-3",
      dividerLine: "bg-white/20",
      alternativeMethodsBlockButton:
        "bg-white/10 border border-white/30 text-white hover:bg-white/20 h-11 text-sm rounded-xl",
      alternativeMethodsBlockButtonText: "text-white",
      alternativeMethodsBlockButtonIcon: "text-white",
      dividerText: "text-lg text-white/90 font-bold",
      formButtonPrimary:
        "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 w-full h-11 text-sm font-semibold rounded-xl shadow-lg shadow-purple-500/20 focus:outline-none",
      formButtonPrimaryContainer: "mt-3",
      formFieldInput:
        "bg-white/10 border border-white/30 text-white placeholder-white/80 focus:bg-white/10 focus:border-purple-400 h-11 text-sm rounded-xl",
      formFieldLabel: "text-white text-sm font-semibold",
      formFieldLabelRequired: "text-white/90",
      formFieldLabelOptional: "hidden",
      formFieldOptionalText: "hidden",
      formFieldHintText: "hidden",
      formFieldHintText__firstName: "hidden",
      formFieldHintText__lastName: "hidden",
      formFieldHintText__username: "hidden",
      // Hide per-field optional badges
      formFieldLabelOptional__firstName: "hidden",
      formFieldLabelOptional__lastName: "hidden",
      formFieldLabelOptional__username: "hidden",
      formFieldOptionalText__firstName: "hidden",
      formFieldOptionalText__lastName: "hidden",
      formFieldOptionalText__username: "hidden",
      formField: "mb-3",
      identityPreviewText: "text-white text-sm",
      formFieldInputShowPasswordButton:
        "text-white/70 hover:text-white",
      signInWithPasswordsTab: "text-white/70",
      formResendCodeLink: "text-purple-300 hover:text-purple-100 text-sm underline",
      otpCodeFieldInput: "bg-white/10 border-white/30 text-white text-center h-11 rounded-xl",
      otpCodeFieldLabel: "text-white/90",
      backLink: "text-purple-400 hover:text-purple-300 text-sm",
      footerActionText: "text-white/80 text-base font-semibold",
      footerAction: "flex justify-center w-full",
    },
  }}
  afterSignUpUrl="/onboarding"
  signInUrl="/login"
/>

              {/* Trust badge */}
              <div className="mt-6 flex items-center justify-center space-x-2 text-white/50 text-xs">
                <Shield className="w-4 h-4" />
                <span>Secured with 256-bit encryption</span>
              </div>
            </div>

            {/* Floating badges */}
            <div className="hidden sm:block absolute -top-6 -right-6 bg-gradient-to-br from-green-400 to-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-2xl animate-bounce">
              🚀 New
            </div>
            <div
              className="hidden sm:block absolute -bottom-6 -left-6 bg-gradient-to-br from-blue-400 to-cyan-500 text-white px-4 py-2 rounded-xl font-bold shadow-2xl"
              style={{
                animation: "bounce 2s infinite",
                animationDelay: "0.5s",
              }}
            >
              ✨ Start Free
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
};

export default SignUpPage;