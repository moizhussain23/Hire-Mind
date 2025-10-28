import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { hrProfileAPI } from '../services/api';
import { Building2, Users, Globe, Phone, FileText, Briefcase } from 'lucide-react';

const HROnboarding = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    website: '',
    phoneNumber: '',
    companyDescription: ''
  });

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Education',
    'Retail',
    'Manufacturing',
    'Consulting',
    'Real Estate',
    'Marketing',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log('Submitting HR profile:', formData);
      const response = await hrProfileAPI.updateProfile(getToken, formData);
      console.log('Profile update response:', response.data);
      
      // Redirect to HR Dashboard after successful onboarding
      console.log('Redirecting to /hr...');
      navigate('/hr', { replace: true });
      
      // Force reload to ensure ProtectedHRRoute re-checks
      window.location.href = '/hr';
    } catch (err: any) {
      console.error('Error updating profile:', err);
      console.error('Error response:', err.response);
      console.error('Error details:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error message:', err.message);
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070f2b] via-[#1a1f3a] to-[#070f2b] flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex items-baseline space-x-1">
              <div className="w-2.5 h-10 bg-gradient-to-b from-blue-400 to-blue-600 rounded-sm"></div>
              <div className="w-2.5 h-12 bg-gradient-to-b from-purple-400 to-purple-600 rounded-sm"></div>
              <div className="w-2.5 h-8 bg-gradient-to-b from-blue-300 to-blue-500 rounded-sm"></div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-blue-400 tracking-widest">HIRE</span>
              <span className="text-2xl font-bold text-white tracking-tight">Mind</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Hire Mind!</h1>
          <p className="text-white/60">Let's set up your company profile to get started</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Building2 className="inline h-4 w-4 mr-2" />
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your company name"
              />
            </div>

            {/* Company Size */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Users className="inline h-4 w-4 mr-2" />
                Company Size *
              </label>
              <select
                name="companySize"
                value={formData.companySize}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-gray-800">Select company size</option>
                {companySizes.map(size => (
                  <option key={size} value={size} className="bg-gray-800">{size}</option>
                ))}
              </select>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Briefcase className="inline h-4 w-4 mr-2" />
                Industry *
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="" className="bg-gray-800">Select industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry} className="bg-gray-800">{industry}</option>
                ))}
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Globe className="inline h-4 w-4 mr-2" />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourcompany.com"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 (xxx) xxx-xxxx"
              />
            </div>

            {/* Company Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                <FileText className="inline h-4 w-4 mr-2" />
                Company Description
              </label>
              <textarea
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Tell us about your company..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Setting up...' : 'Complete Setup & Continue'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          * Required fields
        </p>
      </div>
    </div>
  );
};

export default HROnboarding;
