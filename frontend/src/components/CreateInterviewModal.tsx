import { useState } from 'react'
import { X, Briefcase, Users, Clock, Video, Mic, Monitor } from 'lucide-react'

interface CreateInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InterviewData) => void
  loading?: boolean
}

export interface InterviewData {
  jobTitle: string
  description: string
  skillCategory: string
  experienceLevel: 'fresher' | 'mid' | 'senior'
  interviewType: 'voice' | 'video' | 'both'
  interviewCategory: 'tech' | 'non-tech'
  hasCodingRound: boolean
  allowedLanguages: string[]
  codingInstructions: string
  technicalAssessmentType: string
  duration: number
  questions: string[]
}

const techSkillCategories = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Mobile Development',
  'Cloud Engineering',
  'Cybersecurity',
  'Database Administration'
]

const nonTechSkillCategories = [
  'Marketing',
  'Sales',
  'Product Management',
  'UI/UX Design',
  'Human Resources',
  'Finance & Accounting',
  'Operations',
  'Customer Success',
  'Business Development',
  'General Management'
]

const experienceLevels = [
  { value: 'fresher', label: 'Fresher (0-2 years)', icon: '🌱' },
  { value: 'mid', label: 'Mid Level (2-5 years)', icon: '🚀' },
  { value: 'senior', label: 'Senior (5+ years)', icon: '⭐' }
]

const interviewTypes = [
  { value: 'voice', label: 'Voice Only', icon: Mic, description: 'Audio-only interview' },
  { value: 'video', label: 'Video Only', icon: Video, description: 'Video-only interview' },
  { value: 'both', label: 'Voice & Video', icon: Monitor, description: 'Full audio and video' }
]

const CreateInterviewModal = ({ isOpen, onClose, onSubmit, loading = false }: CreateInterviewModalProps) => {
  const [formData, setFormData] = useState<InterviewData>({
    jobTitle: '',
    description: '',
    skillCategory: '',
    experienceLevel: 'mid',
    interviewType: 'both',
    interviewCategory: 'tech',
    hasCodingRound: false,
    allowedLanguages: [],
    codingInstructions: '',
    technicalAssessmentType: '',
    duration: 30,
    questions: []
  })

  const [customQuestion, setCustomQuestion] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.jobTitle && formData.description && formData.skillCategory) {
      onSubmit(formData)
    }
  }

  const addCustomQuestion = () => {
    if (customQuestion.trim()) {
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, customQuestion.trim()]
      }))
      setCustomQuestion('')
    }
  }

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Interview</h2>
                <p className="text-indigo-100 text-sm">Set up an AI-powered interview for your candidates</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Interview Category - FIRST */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
            <label className="block text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              Step 1: Select Interview Category *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className={`flex items-center p-5 border-3 rounded-xl cursor-pointer transition-all ${
                formData.interviewCategory === 'tech' 
                  ? 'border-indigo-600 bg-white shadow-lg scale-105' 
                  : 'border-gray-300 bg-white hover:border-indigo-400 hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="interviewCategory"
                  value="tech"
                  checked={formData.interviewCategory === 'tech'}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewCategory: e.target.value as any }))}
                  className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="ml-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-2">💻</span>
                    <span className="text-lg font-bold text-gray-900">Technical Interview</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">For technical roles - coding, system design, algorithms</p>
                </div>
              </label>
              <label className={`flex items-center p-5 border-3 rounded-xl cursor-pointer transition-all ${
                formData.interviewCategory === 'non-tech' 
                  ? 'border-purple-600 bg-white shadow-lg scale-105' 
                  : 'border-gray-300 bg-white hover:border-purple-400 hover:shadow-md'
              }`}>
                <input
                  type="radio"
                  name="interviewCategory"
                  value="non-tech"
                  checked={formData.interviewCategory === 'non-tech'}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewCategory: e.target.value as any }))}
                  className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                />
                <div className="ml-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-2">🎯</span>
                    <span className="text-lg font-bold text-gray-900">Non-Technical Interview</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">For behavioral, leadership, communication skills</p>
                </div>
              </label>
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
              placeholder={formData.interviewCategory === 'tech' ? 'e.g., Senior Frontend Developer' : 'e.g., Marketing Manager'}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Job Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={formData.interviewCategory === 'tech' 
                ? 'Describe the technical role, required skills, and tech stack...' 
                : 'Describe the role, responsibilities, and key competencies...'}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              required
            />
          </div>

          {/* Skill Category & Experience Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {formData.interviewCategory === 'tech' ? 'Technical Skill Category *' : 'Department/Focus Area *'}
              </label>
              <select
                value={formData.skillCategory}
                onChange={(e) => setFormData(prev => ({ ...prev, skillCategory: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                required
              >
                <option value="">Select a category</option>
                {(formData.interviewCategory === 'tech' ? techSkillCategories : nonTechSkillCategories).map((category: string) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Level
              </label>
              <div className="space-y-2">
                {experienceLevels.map(level => (
                  <label key={level.value} className="flex items-center space-x-3 p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 cursor-pointer transition-all">
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level.value}
                      checked={formData.experienceLevel === level.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value as any }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-2xl">{level.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Interview Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Interview Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {interviewTypes.map(type => (
                <label 
                  key={type.value} 
                  className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all group ${
                    formData.interviewType === type.value 
                      ? 'border-indigo-600 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="interviewType"
                    value={type.value}
                    checked={formData.interviewType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewType: e.target.value as any }))}
                    className="sr-only"
                  />
                  <type.icon className={`h-8 w-8 mb-2 ${
                    formData.interviewType === type.value 
                      ? 'text-indigo-600' 
                      : 'text-gray-600 group-hover:text-indigo-600'
                  }`} />
                  <span className={`font-semibold ${
                    formData.interviewType === type.value 
                      ? 'text-indigo-900' 
                      : 'text-gray-900'
                  }`}>{type.label}</span>
                  <span className="text-xs text-gray-500 text-center">{type.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tech-Specific Fields */}
          {formData.interviewCategory === 'tech' && (
            <div className="space-y-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
              <h4 className="font-semibold text-indigo-900 flex items-center">
                <span className="text-xl mr-2">⚙️</span>
                Technical Interview Settings
              </h4>
              
              {/* Coding Round Toggle */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <label className="font-medium text-gray-900">Include Coding Round?</label>
                  <p className="text-xs text-gray-500">Add a coding assessment to this interview</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.hasCodingRound}
                    onChange={(e) => setFormData(prev => ({ ...prev, hasCodingRound: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Coding Environment Settings */}
              {formData.hasCodingRound && (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">💡</span>
                      </div>
                      <div className="ml-3">
                        <h5 className="text-sm font-semibold text-blue-900">Built-in Code Editor</h5>
                        <p className="text-xs text-blue-700 mt-1">
                          Candidates will use our integrated code editor with syntax highlighting, 
                          multiple language support, and real-time code execution during the interview.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programming Languages Allowed
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go'].map(lang => (
                        <label key={lang} className="flex items-center p-2 bg-white rounded border border-gray-200 hover:border-indigo-300 cursor-pointer">
                          <input
                            type="checkbox"
                            className="text-indigo-600 focus:ring-indigo-500 rounded"
                            checked={formData.allowedLanguages.includes(lang)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({ ...prev, allowedLanguages: [...prev.allowedLanguages, lang] }))
                              } else {
                                setFormData(prev => ({ ...prev, allowedLanguages: prev.allowedLanguages.filter(l => l !== lang) }))
                              }
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technical Assessment Type
                    </label>
                    <select
                      value={formData.technicalAssessmentType}
                      onChange={(e) => setFormData(prev => ({ ...prev, technicalAssessmentType: e.target.value }))}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                    >
                      <option value="">Select assessment type</option>
                      <option value="DSA">Data Structures & Algorithms</option>
                      <option value="System Design">System Design</option>
                      <option value="Frontend">Frontend Development</option>
                      <option value="Backend">Backend Development</option>
                      <option value="Full Stack">Full Stack Development</option>
                      <option value="Database">Database Design</option>
                      <option value="API Design">API Design</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coding Challenge Instructions (Optional)
                    </label>
                    <textarea
                      value={formData.codingInstructions}
                      onChange={(e) => setFormData(prev => ({ ...prev, codingInstructions: e.target.value }))}
                      placeholder="E.g., Implement a function to reverse a linked list, optimize for time complexity..."
                      rows={3}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide specific coding problems or guidelines for the interviewer</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Duration: {formData.duration} minutes
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Custom Questions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Questions (Optional)
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Add a custom question..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomQuestion())}
              />
              <button
                type="button"
                onClick={addCustomQuestion}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.questions.length > 0 && (
              <div className="space-y-2">
                {formData.questions.map((question, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{question}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.jobTitle || !formData.description || !formData.skillCategory}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateInterviewModal
