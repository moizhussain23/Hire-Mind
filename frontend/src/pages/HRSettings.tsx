import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { hrProfileAPI } from '../services/api';
import { Building2, Users, Globe, Phone, FileText, Briefcase, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HRSettings = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await hrProfileAPI.getProfile(getToken);
        const profile = response.data.profile;
        
        if (profile && profile.isOnboardingComplete) {
          setFormData({
            companyName: profile.companyName || '',
            companySize: profile.companySize || '',
            industry: profile.industry || '',
            website: profile.website || '',
            phoneNumber: profile.phoneNumber || '',
            companyDescription: profile.companyDescription || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [getToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await hrProfileAPI.updateProfile(getToken, formData);
      setSuccess('Company profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#070f2b] via-[#1a1f3a] to-[#070f2b] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#070f2b] via-[#1a1f3a] to-[#070f2b] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/hr')}
            className="flex items-center text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Company Settings</h1>
          <p className="text-white/60">Manage your company profile and information</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
                {success}
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

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/hr')}
                className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          * Required fields
        </p>
      </div>
    </div>
  );
};

export default HRSettings;
