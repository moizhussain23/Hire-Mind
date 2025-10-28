import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface EditInterviewData {
  jobTitle: string;
  jobDescription: string;
  experienceLevel: 'fresher' | 'mid' | 'senior';
  interviewType: 'voice' | 'video' | 'both';
  category: 'tech' | 'non-tech';
  hasCodingRound: boolean;
  codingLanguages: string[];
}

interface EditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditInterviewData) => void;
  loading?: boolean;
  initialData?: EditInterviewData;
}

const EditInterviewModal: React.FC<EditInterviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  initialData
}) => {
  const [formData, setFormData] = useState<EditInterviewData>({
    jobTitle: '',
    jobDescription: '',
    experienceLevel: 'mid',
    interviewType: 'both',
    category: 'tech',
    hasCodingRound: false,
    codingLanguages: []
  });

  // Load initial data when modal opens
  useEffect(() => {
    if (initialData && isOpen) {
      setFormData(initialData);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      codingLanguages: prev.codingLanguages.includes(language)
        ? prev.codingLanguages.filter(l => l !== language)
        : [...prev.codingLanguages, language]
    }));
  };

  if (!isOpen) return null;

  const availableLanguages = ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Ruby', 'PHP'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Interview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g., Senior Frontend Developer"
              required
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={4}
              placeholder="Describe the role, responsibilities, and requirements..."
              required
            />
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['fresher', 'mid', 'senior'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, experienceLevel: level })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.experienceLevel === level
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['voice', 'video', 'both'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, interviewType: type })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.interviewType === type
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['tech', 'non-tech'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    formData.category === cat
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'tech' ? 'Technical' : 'Non-Technical'}
                </button>
              ))}
            </div>
          </div>

          {/* Coding Round */}
          {formData.category === 'tech' && (
            <>
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCodingRound}
                    onChange={(e) => setFormData({ ...formData, hasCodingRound: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Include Coding Round
                  </span>
                </label>
              </div>

              {formData.hasCodingRound && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Programming Languages *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => handleLanguageToggle(lang)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.codingLanguages.includes(lang)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                  {formData.hasCodingRound && formData.codingLanguages.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">Please select at least one language</p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || (formData.hasCodingRound && formData.codingLanguages.length === 0)}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Interview'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInterviewModal;
