import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-react';
import Layout from './components/layout/Layout';
import ProtectedHRRoute from './components/ProtectedHRRoute';
import ProtectedIntervieweeRoute from './components/ProtectedIntervieweeRoute';
import PostAuth from './pages/PostAuth';
import RoleSelection from './pages/RoleSelection';
import Landing from './pages/Landing';
import Login from './pages/Login';
import SignUpPage from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Interview from './pages/Interview';
import HRDashboard from './pages/HRDashboard';
import HROnboarding from './pages/HROnboarding';
import HRSettings from './pages/HRSettings';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import AcceptInvitation from './pages/AcceptInvitation'; // Phase 1: Invitation acceptance
import JoinInterview from './pages/JoinInterview'; // Phase 2: Join interview session
import TestVerification from './pages/TestVerification'; // Test face verification
import TestVerificationDeepFace from './pages/TestVerificationDeepFace'; // Test DeepFace verification
import InterviewTest from './pages/InterviewTest';
import CodingChallengeTest from './pages/CodingChallengeTest'; // Test interview system
import { AuthProvider } from './contexts/AuthContext';

// Get the Clerk publishable key from environment variables
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <Router>
        <Routes>
          {/* Test Routes - Public routes for testing (NO AUTH REQUIRED) */}
          <Route path="/test-verification" element={<TestVerification />} />
          <Route path="/test-verification-deepface" element={<TestVerificationDeepFace />} />
          <Route path="/test-interview" element={<InterviewTest />} />
          <Route path="/interview-test" element={<InterviewTest />} />
          <Route path="/coding-test" element={<CodingChallengeTest />} />
          
          {/* All other routes wrapped in ClerkLoaded */}
          <Route path="/*" element={
            <ClerkLoaded>
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Layout><Landing /></Layout>} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/sign-up" element={<SignUpPage />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/post-auth" element={<PostAuth />} />
                  <Route path="/select-role" element={<Layout><RoleSelection /></Layout>} />
                  <Route path="/contact" element={<Layout><Contact /></Layout>} />
                  <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
                  <Route path="/terms" element={<Layout><Terms /></Layout>} />
              
              {/* Phase 1: Invitation Acceptance - Public route (requires Clerk auth) */}
              <Route path="/invitation/accept/:token" element={<AcceptInvitation />} />
              
              {/* Phase 2: Join Interview Session - Semi-public route (requires Clerk auth) */}
              <Route path="/interview/join/:sessionToken" element={<JoinInterview />} />
              
              {/* Protected Routes - Interviewee */}
              <Route path="/dashboard" element={<ProtectedIntervieweeRoute><Layout><Dashboard /></Layout></ProtectedIntervieweeRoute>} />
              
              {/* Interview Routes - Full screen without Layout */}
              <Route path="/interview" element={<ProtectedIntervieweeRoute><Interview /></ProtectedIntervieweeRoute>} />
              <Route path="/interview/:interviewId" element={<ProtectedIntervieweeRoute><Interview /></ProtectedIntervieweeRoute>} />
              <Route path="/hr/onboarding" element={<HROnboarding />} />
              <Route path="/hr/settings" element={<ProtectedHRRoute><HRSettings /></ProtectedHRRoute>} />
              <Route path="/hr" element={<ProtectedHRRoute><Layout><HRDashboard /></Layout></ProtectedHRRoute>} />
              <Route path="/hr-dashboard" element={<ProtectedHRRoute><Layout><HRDashboard /></Layout></ProtectedHRRoute>} />
              
                  {/* Catch all route */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AuthProvider>
            </ClerkLoaded>
          } />
        </Routes>
      </Router>
    </ClerkProvider>
  );
}

export default App;