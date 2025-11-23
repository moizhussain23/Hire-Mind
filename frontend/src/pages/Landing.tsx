import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  FileCheck,
  Phone,
  Upload,
  Camera,
  FileText,
  Shield,
  Star,
  MessageCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Zap,
  Play,
  Pause,
} from "lucide-react";
import ShaderBackground from "../components/shader-background";
import FluidCursor from "../components/ui/FluidCursor";

const Landing = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioData, setAudioData] = useState<number[]>([35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38]);

  const handleTryAIInterviews = () => {
    navigate('/interview-test');
  };

  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('landingScrollPosition');
    if (savedScrollPosition) {
      window.scrollTo(0, parseInt(savedScrollPosition));
      sessionStorage.removeItem('landingScrollPosition');
    }
    
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      // Save scroll position before unmounting
      sessionStorage.setItem('landingScrollPosition', window.scrollY.toString());
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        // Reset to minimal flat waveform
        setAudioData([35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38]);
      } else {
        audioRef.current.play();
        startAudioVisualization();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const startAudioVisualization = () => {
    const interval = setInterval(() => {
      if (!audioRef.current || audioRef.current.paused) {
        clearInterval(interval);
        return;
      }
      
      // Generate dramatic waveform data with high variation
      const newData = Array.from({ length: 20 }, () => {
        // Mix of very tall and shorter bars for dramatic effect
        const random = Math.random();
        if (random > 0.7) {
          return Math.random() * 30 + 70; // Tall bars (70-100%)
        } else if (random > 0.4) {
          return Math.random() * 35 + 45; // Medium bars (45-80%)
        } else {
          return Math.random() * 30 + 20; // Short bars (20-50%)
        }
      });
      setAudioData(newData);
    }, 80); // Faster updates for more dynamic feel
  };
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        setAudioData([35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38, 35, 40, 35, 38]);
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#070f2b]">
      {/* Shader Background Effect */}
      <ShaderBackground />
      
      {/* Fluid Particle Cursor Effect */}
      <FluidCursor />
      
      {/* Animated gradient background */}
      <div
        className="fixed inset-0 -z-5 transition-transform duration-1000"
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

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-8 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div className="text-left space-y-8">
                <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-white/90 text-sm font-medium">
                    Meet AI Interviewer
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
                  Hire Beyond
                  <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                    The Resume
                  </span>
                </h1>
                <p className="text-2xl md:text-3xl text-white font-semibold leading-relaxed max-w-2xl mb-2">
                  AI that interviews like{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold">
                    you would.
                  </span>
                </p>
                <p className="text-xl text-white/80 leading-relaxed max-w-2xl">
                  AI, finally done right for interviews. From instant setup to
                  real-time, voice-led interviews — our AI interviews like a
                  human, probing the right skills, responding in the moment, and
                  delivering insights that drive better hires.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleTryAIInterviews}
                    className="group px-8 py-4 bg-white hover:bg-gray-100 text-purple-700 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-white/20 hover:scale-105"
                  >
                    Try AI Interviews
                    <Zap className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/30 text-white rounded-xl font-bold text-lg transition-all duration-300">
                    Watch a Demo
                  </button>
                </div>
              </div>

              {/* Right content - Interview card */}
              <div className="relative">
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-105">
                  {/* AIRA badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">AIRA</div>
                        <div className="text-white/60 text-sm">
                          AI Interviewer
                        </div>
                      </div>
                    </div>

                    {/* Voice Play Button */}
                    <button
                      onClick={toggleAudio}
                      className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300"
                      aria-label={isPlaying ? "Pause audio" : "Play audio"}
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-white" />
                      ) : (
                        <Play className="w-6 h-6 text-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Hidden audio element */}
                  <audio ref={audioRef} src="/AIRA-VOICE.mp3" />

                  {/* Waveform animation */}
                  {/* Waveform animation */}
<div className="flex items-center space-x-1 mb-6 h-16">
  {audioData.map((height, i) => (
    <div
      key={i}
      className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full transition-all duration-100"
      style={{
        height: `${height}%`,
        animation: isPlaying ? 'none' : `pulse ${0.5 + (i % 3) * 0.2}s ease-in-out infinite`,
        animationDelay: `${i * 0.05}s`,
      }}
    />
  ))}
</div>

                  {/* Candidate info */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src="/avatar1.png"
                        alt="Moiz Hussain"
                        className="w-24 h-24 rounded-xl object-cover shadow-lg"
                      />
                      <div>
                        <div className="text-white font-bold text-lg">
                          MOIZ HUSSAIN
                        </div>
                        <div className="text-white/60 text-sm">
                          Full Stack developer
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 font-semibold text-sm">
                        94% Skills matched
                      </span>
                    </div>
                  </div>

                  {/* Floating badge */}
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-green-400 to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold shadow-2xl">
                    5x Faster
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse"></div>
                <div
                  className="absolute -bottom-4 -right-4 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-black/20 backdrop-blur-md border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                {
                  value: "↑ 60%",
                  label: "L1 to L2 Conversion",
                  color: "from-blue-400 to-cyan-400",
                },
                {
                  value: "↑ 74%",
                  label: "Candidate Completion",
                  color: "from-green-400 to-emerald-400",
                },
                {
                  value: "↑ 1 hr",
                  label: "Setup To Feedback",
                  color: "from-purple-400 to-pink-400",
                },
                {
                  value: "↑ 3-layer",
                  label: "Cheating Detection",
                  color: "from-orange-400 to-red-400",
                },
              ].map((stat, idx) => (
                <div key={idx} className="text-center group cursor-pointer">
                  <div
                    className={`text-4xl md:text-5xl font-extrabold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-white/70 text-sm md:text-base font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 ">
                How AIRA Elevates the
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent pb-3">
                  Interviewing Experience
                </span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto mb-8 ">
                AIRA evaluates candidates 24/7 across any skill—with advanced
                proctoring, delivering instant, insightful reports.
              </p>
              <p className="text-xl md:text-3xl lg:text-4xl font-bold text-white/90 max-w-5xl mx-auto">
                Confidence Measured || Skills Assessed ||{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  Talent Discovered.
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: <Clock className="w-8 h-8" />,
                  title: "24/7 Interviews",
                  desc: "Evaluate candidates anytime, across any tech, coding, non-tech, and niche skill sets.",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  icon: <FileText className="w-8 h-8" />,
                  title: "Instant Reports",
                  desc: "Receive verdict, video recording, skill ratings, proctoring findings within minutes after each interview.",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  icon: <Shield className="w-8 h-8" />,
                  title: "Advanced Proctoring",
                  desc: "Built-in fraud detection using keystroke tracking, statistical analysis & contextual information.",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: "Customizable",
                  desc: "Uses JD, CV, and your inputs to run custom interviews—tailored to roles and candidates.",
                  gradient: "from-orange-500 to-red-500",
                },
                {
                  icon: <MessageCircle className="w-8 h-8" />,
                  title: "Real Interview Simulation",
                  desc: "Dynamic, natural conversations—covering role-relevant scenarios and follow-ups.",
                  gradient: "from-pink-500 to-rose-500",
                },
                {
                  icon: <CheckCircle className="w-8 h-8" />,
                  title: "Unbiased Evaluation",
                  desc: "Every candidate gets a fair, structured consistent experience—free from human subjectivity.",
                  gradient: "from-indigo-500 to-purple-500",
                },
              ].map((feature, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <div className="text-white">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {feature.desc}
                  </p>

                  {/* Hover effect line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Get Started with AI Interviews Today!
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              Book a quick demo with our team, try sample interviews tailored to
              your roles, and go live when you're confident. No pressure—just a
              seamless start to smarter hiring.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button 
                onClick={handleTryAIInterviews}
                className="group px-10 py-5 bg-white hover:bg-gray-100 text-purple-700 rounded-xl font-bold text-lg transition-all duration-300 shadow-2xl hover:scale-105"
              >
                Try AI Interviews
                <Zap className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-10 py-5 bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white/30 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105">
                Watch a Demo
              </button>
            </div>
          </div>
        </section>
        {/* How It Works Section */}
        <section className="py-24 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="text-white/90 text-sm font-medium">
                  Step by Step
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                How AIRA Conducts
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent pt-2">
                  Interviews — Step by Step
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  number: "01",
                  icon: <Upload className="w-8 h-8" />,
                  title: "Interview Setup",
                  desc: "Easily upload the job description and candidate CVs on the platform—no manual effort needed.",
                  gradient: "from-blue-500 to-cyan-500",
                },
                {
                  number: "02",
                  icon: <Phone className="w-8 h-8" />,
                  title: "Send the Invite",
                  desc: "Trigger interview invites automatically via email, or WhatsApp. No chasing or scheduling hassles.",
                  gradient: "from-green-500 to-emerald-500",
                },
                {
                  number: "03",
                  icon: <Users className="w-8 h-8" />,
                  title: "Let AIRA Take Over",
                  desc: "AIRA conducts the interview over a video call—asking adaptive, voice-based questions in real-time while engaging candidates naturally.",
                  gradient: "from-purple-500 to-pink-500",
                },
                {
                  number: "04",
                  icon: <FileCheck className="w-8 h-8" />,
                  title: "Get Actionable Insights",
                  desc: "Receive a structured report within minutes—complete with verdict, skill ratings, video recording, and proctoring analysis.",
                  gradient: "from-orange-500 to-red-500",
                },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                >
                  {/* Number Badge */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <span className="text-white font-bold text-lg">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <div className="text-white">{step.icon}</div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/70 leading-relaxed text-sm">
                    {step.desc}
                  </p>

                  {/* Hover effect line */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-2xl`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who Should Use It Section */}
        <section className="py-24 bg-black/20 backdrop-blur-md border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="text-white/90 text-sm font-medium">
                  Who Should Use It?
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                10 or 10,000 Hires—
                <span className="block bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent pt-2">
                  Interviewing Never Slows Down With AIRA
                </span>
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
                AIRA supports high-volume screening, tech hiring, campus
                interviews, and leadership evaluations. Built for Talent
                Acquisition teams, Delivery Heads, and hiring managers who need
                faster decisions without sacrificing quality.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Personas Covered */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm mr-3"></span>
                  Personas Covered
                </h3>
                <ul className="space-y-3">
                  {[
                    "Startups",
                    "GCCs",
                    "IT Services",
                    "HR leaders",
                    "Tech recruiters",
                    "Recruitment & Staffing firms",
                  ].map((persona, idx) => (
                    <li key={idx} className="flex items-center text-white/80">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                      {persona}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Personas Which Can Hire */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <span className="w-2 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm mr-3"></span>
                  Personas Which Can Hire
                </h3>
                <ul className="space-y-3">
                  {[
                    "Sales, Operations, Accounts",
                    "Software Engineers",
                    "Marketing",
                    "AI/ML Engineers",
                    "Data Scientists",
                  ].map((role, idx) => (
                    <li key={idx} className="flex items-center text-white/80">
                      <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                      {role}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
                <span className="text-white/90 text-sm font-medium">FAQ</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                Our Strengths in Today's
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent pt-2">
                  Competitive Landscape
                </span>
              </h2>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                We excel in this market through our expertise, customer focus,
                and reliable results — making us a trusted choice in the
                industry.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question:
                    "What types of roles and candidates can AIRA be used for?",
                  answer:
                    "AIRA is designed to be highly versatile, it can be used to interview for any combination of job descriptions and resumes. From technical roles to non-technical positions, AIRA adapts to your hiring needs.",
                },
                {
                  question:
                    "What kind of questions can the AI Interviewer ask?",
                  answer:
                    "AIRA can ask conceptual questions (e.g., 'Explain this concept'), behavioral questions (e.g., 'Tell me about a time you did X'), and problem-solving questions including case studies, quantitative analysis, brainstorming questions, and product design questions.",
                },
                {
                  question:
                    "How does AIRA ensure fair and unbiased evaluations?",
                  answer:
                    "AIRA uses structured evaluation criteria based on the job requirements and candidate qualifications. Every candidate receives the same level of assessment rigor, eliminating human biases and ensuring consistent, objective evaluations.",
                },
                {
                  question: "Can AIRA integrate with our existing ATS?",
                  answer:
                    "Yes, AIRA can integrate with popular Applicant Tracking Systems (ATS) to streamline your hiring workflow. Our team will work with you to ensure smooth integration with your existing tools and processes.",
                },
                {
                  question: "What languages does AIRA support?",
                  answer:
                    "AIRA currently supports multiple languages including English, Spanish, French, German, and more. We're continuously adding support for additional languages to serve global hiring needs.",
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="text-lg font-semibold text-white pr-8">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-white/60 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === idx ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === idx ? "max-h-96" : "max-h-0"
                    }`}
                  >
                    <div className="px-6 pb-5 text-white/70 leading-relaxed">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scaleY(0.5);
          }
          50% {
            transform: scaleY(1);
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
