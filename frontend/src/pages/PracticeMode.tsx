import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Play, Clock, Code, MessageSquare, ArrowLeft, Target, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PracticeCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  duration: string;
  questions: number;
  color: string;
}

const PracticeMode: React.FC = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const practiceCategories: PracticeCategory[] = [
    {
      id: 'behavioral',
      title: 'Behavioral Questions',
      description: 'Practice common behavioral interview questions using the STAR method',
      icon: <MessageSquare className="w-6 h-6" />,
      duration: '15-20 min',
      questions: 8,
      color: 'from-blue-50 to-blue-100 border-blue-200'
    },
    {
      id: 'technical',
      title: 'Technical Interview',
      description: 'Practice technical questions and problem-solving scenarios',
      icon: <Code className="w-6 h-6" />,
      duration: '20-30 min',
      questions: 5,
      color: 'from-green-50 to-green-100 border-green-200'
    },
    {
      id: 'coding',
      title: 'Coding Challenge',
      description: 'Solve coding problems and practice algorithms',
      icon: <Target className="w-6 h-6" />,
      duration: '30-45 min',
      questions: 3,
      color: 'from-purple-50 to-purple-100 border-purple-200'
    }
  ];

  const practiceFeatures = [
    {
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: 'Timed Practice',
      description: 'Practice with realistic time constraints'
    },
    {
      icon: <Lightbulb className="w-5 h-5 text-green-600" />,
      title: 'AI Feedback',
      description: 'Get instant feedback on your responses'
    },
    {
      icon: <Target className="w-5 h-5 text-purple-600" />,
      title: 'No Pressure',
      description: 'Practice without affecting your real interview scores'
    }
  ];

  const startPracticeSession = (category: PracticeCategory) => {
    // For now, redirect to test-interview with practice mode
    // In the future, this could be a dedicated practice page
    window.location.href = `/test-interview?mode=practice&category=${category.id}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Practice Mode
          </h1>
          <p className="text-lg text-gray-600">
            Sharpen your interview skills with our AI-powered practice sessions
          </p>
        </div>

        {/* Practice Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {practiceFeatures.map((feature, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Practice Categories */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Practice Session</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {practiceCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-gradient-to-br ${category.color} rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {category.icon}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full">
                    {category.duration}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{category.questions} questions</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startPracticeSession(category);
                    }}
                    className="bg-white hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1 shadow-sm"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Practice Tips</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Start with Behavioral</h4>
                  <p className="text-sm text-gray-600">Build confidence with common interview questions before moving to technical topics.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Practice Regularly</h4>
                  <p className="text-sm text-gray-600">Consistent practice helps you become more comfortable with the interview format.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Review Feedback</h4>
                  <p className="text-sm text-gray-600">Pay attention to AI feedback to improve your responses and communication skills.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">4</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Simulate Real Conditions</h4>
                  <p className="text-sm text-gray-600">Practice in a quiet environment with good lighting and stable internet connection.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMode;