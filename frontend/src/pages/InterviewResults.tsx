import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Calendar, Clock, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface InterviewResult {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
  status: string;
  score?: number;
}

const InterviewResults: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<InterviewResult[]>([]);

  // Helper function to get authenticated headers
  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || 
                 localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  useEffect(() => {
    fetchInterviewResults();
  }, []);

  const fetchInterviewResults = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      const response = await fetch('/api/user/interviews/results', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.warn('Failed to fetch interview results');
        setResults([]);
      }
    } catch (error) {
      console.error('Error fetching interview results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageScore = () => {
    if (results.length === 0) return 0;
    const scoresSum = results.reduce((sum, result) => sum + (result.score || 0), 0);
    return Math.round(scoresSum / results.length);
  };

  const getPerformanceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (score?: number) => {
    if (!score) return 'No Score';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your interview results...</p>
        </div>
      </div>
    );
  }

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
            Interview Results
          </h1>
          <p className="text-lg text-gray-600">
            View your interview history and performance analytics
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                <div className="text-sm text-gray-600">Total Interviews</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{calculateAverageScore()}%</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {results.filter(r => (r.score || 0) >= 70).length}
                </div>
                <div className="text-sm text-gray-600">Passed Interviews</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Results List */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Interview History</h2>
          
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{result.company}</h3>
                      <p className="text-gray-600">{result.position}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold ${getPerformanceColor(result.score)}`}>
                        {result.score || 0}%
                      </div>
                      <div className={`text-sm font-medium ${getPerformanceColor(result.score)}`}>
                        {getPerformanceLabel(result.score)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(result.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {result.time}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        (result.score || 0) >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {result.status}
                      </span>
                      <button className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Interview Results Yet</h3>
              <p className="text-gray-500 mb-6">Complete your first interview to see results here.</p>
              <Link to="/test-interview">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all">
                  Try Demo Interview
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;