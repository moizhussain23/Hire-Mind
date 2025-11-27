import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Play, Trophy, Dumbbell, User, Calendar, Clock, CheckCircle, XCircle, TrendingUp, Mail, Award } from 'lucide-react';

interface Invitation {
  id: string;
  company: string;
  position: string;
  type: string;
  deadline: string;
  status: string;
  token: string;
}

interface Interview {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
  status: string;
  score?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

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
  const [stats, setStats] = useState({
    totalInterviews: 0,
    pendingInvitations: 0,
    averageScore: 0,
    nextInterview: null as string | null
  });
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<Interview[]>([]);
  const [recentResults, setRecentResults] = useState<Interview[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/user/dashboard-stats', {
        method: 'GET',
        headers
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.warn('Failed to fetch stats, using defaults');
        setStats({
          totalInterviews: 0,
          pendingInvitations: 0,
          averageScore: 0,
          nextInterview: null
        });
      }

      // Fetch invitations  
      const invitationsResponse = await fetch('/api/user/invitations/pending', {
        method: 'GET',
        headers
      });

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setInvitations(invitationsData.invitations || []);
      } else {
        console.warn('Failed to fetch invitations');
        setInvitations([]);
      }

      // Fetch upcoming interviews
      const upcomingResponse = await fetch('/api/user/interviews/upcoming', {
        method: 'GET', 
        headers
      });

      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        setUpcomingInterviews(upcomingData.interviews || []);
      } else {
        console.warn('Failed to fetch upcoming interviews');
        setUpcomingInterviews([]);
      }

      // Fetch recent results
      const resultsResponse = await fetch('/api/user/interviews/results', {
        method: 'GET',
        headers
      });

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setRecentResults(resultsData.results || []);
      } else {
        console.warn('Failed to fetch interview results');
        setRecentResults([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Fallback to empty data instead of mock data
      setStats({
        totalInterviews: 0,
        pendingInvitations: 0,
        averageScore: 0,
        nextInterview: null
      });
      setInvitations([]);
      setUpcomingInterviews([]);
      setRecentResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleAcceptInvitation = (invitation: Invitation) => {
    // Redirect to the proper invitation acceptance page
    // This page has time slot selection, resume upload, and full invitation flow
    if (invitation.token) {
      window.location.href = `/invitation/accept/${invitation.token}`;
    } else {
      console.error('❌ Invitation token not found');
      alert('Cannot access invitation - missing token');
    }
  };

  const handleDeclineInvitation = async (id: string) => {
    try {
      const reason = prompt('Please provide a reason for declining (optional):');
      const headers = getAuthHeaders();

      const response = await fetch(`/api/invitation/${id}/decline-by-id`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason: reason || 'No reason provided' })
      });

      if (response.ok) {
        console.log('✅ Invitation declined successfully');
        // Refresh dashboard data to reflect changes
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to decline invitation:', errorData.error);
        alert('Failed to decline invitation: ' + errorData.error);
      }
    } catch (error) {
      console.error('❌ Error declining invitation:', error);
      alert('An error occurred while declining the invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section with Quick Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}, {user?.firstName || 'User'}!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Ready to start your AI-powered interview journey?
          </p>
          
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalInterviews}</div>
                  <div className="text-xs text-gray-600">Total Interviews</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.pendingInvitations}</div>
                  <div className="text-xs text-gray-600">Pending Invites</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.averageScore}%</div>
                  <div className="text-xs text-gray-600">Average Score</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stats.nextInterview || 'N/A'}</div>
                  <div className="text-xs text-gray-600">Next Interview</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/test-interview" className="group">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Demo Interview</h3>
              <p className="text-gray-600 text-sm">Try our AI-powered interview demo</p>
            </div>
          </Link>

          <Link to="/interview-results" className="group">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">View Results</h3>
              <p className="text-gray-600 text-sm">Check your interview evaluations</p>
            </div>
          </Link>

          <Link to="/practice-mode" className="group">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Practice Mode</h3>
              <p className="text-gray-600 text-sm">Practice with sample questions</p>
            </div>
          </Link>

          <Link to="/profile-settings" className="group">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Settings</h3>
              <p className="text-gray-600 text-sm">Update your profile & resume</p>
            </div>
          </Link>
        </div>

        {/* Interview Tips */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Interview Tips & Best Practices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Speak Clearly</p>
                <p className="text-sm text-gray-600">Ensure your microphone is working and speak at a normal pace.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-green-600">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Be Specific</p>
                <p className="text-sm text-gray-600">Provide concrete examples and detailed explanations.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-purple-600">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Stay Focused</p>
                <p className="text-sm text-gray-600">Minimize distractions and maintain eye contact with the camera.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-orange-600">4</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Ask Questions</p>
                <p className="text-sm text-gray-600">Don't hesitate to ask for clarification if you need it.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Pending Invitations */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Pending Invitations</h3>
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
                {invitations.length}
              </span>
            </div>
            
            {invitations.length > 0 ? (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div key={invitation.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-gray-900 font-semibold">{invitation.company}</h4>
                        <p className="text-gray-600 text-sm">{invitation.position}</p>
                        <p className="text-gray-500 text-xs mt-1">{invitation.type}</p>
                      </div>
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        Due: {new Date(invitation.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptInvitation(invitation)}
                        className="flex-1 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <CheckCircle className="w-4 h-4 inline mr-1" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        className="flex-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <XCircle className="w-4 h-4 inline mr-1" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending invitations</p>
              </div>
            )}
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Upcoming Interviews</h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                {upcomingInterviews.length}
              </span>
            </div>
            
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-gray-900 font-semibold">{interview.company}</h4>
                        <p className="text-gray-600 text-sm">{interview.position}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                        {interview.status}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(interview.date).toLocaleDateString()} at {interview.time}
                    </div>
                    <Link to={`/test-interview`}>
                      <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-all">
                        Join Interview
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming interviews</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Results & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Interview Results */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Recent Results</h3>
            </div>
            
            {recentResults.length > 0 ? (
              <div className="space-y-4">
                {recentResults.map((result) => (
                  <div key={result.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-gray-900 font-semibold">{result.company}</h4>
                        <p className="text-gray-600 text-sm">{result.position}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${result.score && result.score >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                          {result.score}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{new Date(result.date).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 rounded ${result.score && result.score >= 70 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {result.score && result.score >= 70 ? 'Passed' : 'Under Review'}
                      </span>
                    </div>
                    <button className="w-full bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium transition-all">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No results yet</p>
                <p className="text-gray-400 text-sm mt-1">Complete your first interview</p>
              </div>
            )}
          </div>

          {/* Performance Chart Placeholder */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Performance Trends</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Chart Coming Soon</p>
              <p className="text-gray-500 text-sm">Complete more interviews to see your performance trends</p>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Dashboard;