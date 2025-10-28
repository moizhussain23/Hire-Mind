import { useState, useEffect } from 'react'
import { X, Send, Copy, Check, UserPlus, Mail, ChevronUp, ChevronDown } from 'lucide-react'

interface InviteCandidatesModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InviteData) => void
  loading?: boolean
  interviews: Array<{
    id: string
    jobTitle: string
    description: string
    skillCategory: string
    experienceLevel: string
    interviewType: string
  }>
  defaultInterviewId?: string | null
}

export interface InviteData {
  interviewId: string
  candidateEmails: string[]
  customMessage: string
  timeSlots: string[] // ISO strings sent to backend
}

interface TimeSlotInput {
  date: string
  hours: string
  minutes: string
}

const InviteCandidatesModal = ({ isOpen, onClose, onSubmit, loading = false, interviews, defaultInterviewId }: InviteCandidatesModalProps) => {
  // Separate state for time slot inputs (structured)
  const [timeSlotInputs, setTimeSlotInputs] = useState<TimeSlotInput[]>([
    { date: '', hours: '', minutes: '' },
    { date: '', hours: '', minutes: '' },
    { date: '', hours: '', minutes: '' }
  ])

  const [formData, setFormData] = useState<Omit<InviteData, 'timeSlots'>>({
    interviewId: defaultInterviewId || '',
    candidateEmails: [''],
    customMessage: ''
  })

  // Debug logging
  useEffect(() => {
    console.log('InviteCandidatesModal props:', { isOpen, interviews, defaultInterviewId })
  }, [isOpen, interviews, defaultInterviewId])
  
  // Update form data when defaultInterviewId changes
  useEffect(() => {
    if (defaultInterviewId) {
      setFormData(prev => ({
        ...prev,
        interviewId: defaultInterviewId
      }))
    }
  }, [defaultInterviewId])

  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // Generate interview link
  const generateInterviewLink = (interviewId: string) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/interview/${interviewId}`
  }

  const addEmailField = () => {
    setFormData(prev => ({
      ...prev,
      candidateEmails: [...prev.candidateEmails, '']
    }))
  }

  const removeEmailField = (index: number) => {
    if (formData.candidateEmails.length > 1) {
      setFormData(prev => ({
        ...prev,
        candidateEmails: prev.candidateEmails.filter((_, i) => i !== index)
      }))
    }
  }

  const updateEmail = (index: number, email: string) => {
    setFormData(prev => ({
      ...prev,
      candidateEmails: prev.candidateEmails.map((e, i) => i === index ? email : e)
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedLink(text)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validEmails = formData.candidateEmails.filter(email => email.trim() && email.includes('@'))
    
    // Convert time slot inputs to ISO strings
    const processedTimeSlots = timeSlotInputs
      .map((slot, idx) => {
        console.log(`Time Slot ${idx + 1}:`, slot)
        if (slot.date && slot.hours !== '' && slot.minutes !== '') {
          const h = slot.hours.padStart(2, '0')
          const m = slot.minutes.padStart(2, '0')
          const isoString = new Date(`${slot.date}T${h}:${m}`).toISOString()
          console.log(`  → ISO: ${isoString}`)
          return isoString
        }
        console.log(`  → SKIPPED (missing: ${!slot.date ? 'date' : ''} ${!slot.hours ? 'hours' : ''} ${!slot.minutes ? 'minutes' : ''})`)
        return null
      })
      .filter(Boolean) as string[]
    
    console.log('📤 Submitting invitation data:', {
      interviewId: formData.interviewId,
      candidateEmails: validEmails,
      timeSlots: processedTimeSlots,
      timeSlotInputs
    })
    
    if (formData.interviewId && validEmails.length > 0 && processedTimeSlots.length === 3) {
      onSubmit({
        ...formData,
        candidateEmails: validEmails,
        timeSlots: processedTimeSlots
      })
    } else {
      console.error('❌ Validation failed:', {
        hasInterviewId: !!formData.interviewId,
        validEmailsCount: validEmails.length,
        timeSlotsCount: processedTimeSlots.length
      })
      alert(`Please fill all required fields:\n- Interview: ${formData.interviewId ? '✓' : '✗'}\n- Emails: ${validEmails.length > 0 ? '✓' : '✗'}\n- Time Slots: ${processedTimeSlots.length}/3`)
    }
  }

  const selectedInterview = interviews.find(i => i.id === formData.interviewId)
  const interviewLink = formData.interviewId ? generateInterviewLink(formData.interviewId) : ''

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Invite Candidates</h2>
                <p className="text-emerald-100 text-sm">Send interview invitations to candidates</p>
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* No Interviews Message */}
          {interviews.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="text-amber-600">⚠️</div>
                <div>
                  <h4 className="font-semibold text-amber-800">No Interviews Available</h4>
                  <p className="text-sm text-amber-700">You need to create an interview first before you can invite candidates.</p>
                </div>
              </div>
            </div>
          )}

          {/* Select Interview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Interview *
            </label>
            <select
              value={formData.interviewId}
              onChange={(e) => setFormData(prev => ({ ...prev, interviewId: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              required
            >
              <option value="">
                {interviews.length === 0 ? 'No interviews available - Create an interview first' : 'Choose an interview'}
              </option>
              {interviews.map(interview => (
                <option key={interview.id} value={interview.id}>
                  {interview.jobTitle} - {interview.skillCategory} ({interview.experienceLevel})
                </option>
              ))}
            </select>
          </div>

          {/* Interview Link */}
          {selectedInterview && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Interview Details:</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Position:</strong> {selectedInterview.jobTitle}</p>
                <p><strong>Category:</strong> {selectedInterview.skillCategory}</p>
                <p><strong>Level:</strong> {selectedInterview.experienceLevel}</p>
                <p><strong>Type:</strong> {selectedInterview.interviewType}</p>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interview Link:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={interviewLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(interviewLink)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-1"
                  >
                    {copiedLink === interviewLink ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Candidate Emails */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Candidate Email Addresses *
            </label>
            <div className="space-y-3">
              {formData.candidateEmails.map((email, index) => (
                <div key={index} className="flex space-x-2">
                  <div className="flex-1 flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      placeholder="candidate@example.com"
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                    />
                  </div>
                  {formData.candidateEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailField(index)}
                      className="px-3 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addEmailField}
                className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add another email</span>
              </button>
            </div>
          </div>

          {/* Time Slots - Phase 1 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Interview Time Slots * (Provide 3 options for candidates)
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Candidates will choose one of these time slots when accepting the invitation.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Pick date from calendar, then type time directly (no Date object issues!)
              </p>
            </div>
            <div className="space-y-4">
              {timeSlotInputs.map((slot, index) => {
                const updateTimeSlot = (field: 'date' | 'hours' | 'minutes', value: string) => {
                  setTimeSlotInputs(prev => {
                    const updated = [...prev]
                    updated[index] = { ...updated[index], [field]: value }
                    return updated
                  })
                }

                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700">Time Slot {index + 1}</span>
                      {slot.date && slot.hours && slot.minutes && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                          {new Date(`${slot.date}T${slot.hours.padStart(2, '0')}:${slot.minutes.padStart(2, '0')}`).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Date Picker (Calendar) */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">📅 Select Date</label>
                        <input
                          type="date"
                          value={slot.date}
                          onChange={(e) => updateTimeSlot('date', e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm"
                          required
                        />
                      </div>
                      
                      {/* Time Inputs */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Hours */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Hour (0-23)</label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={slot.hours}
                              onChange={(e) => updateTimeSlot('hours', e.target.value.replace(/\D/g, ''))}
                              placeholder="14"
                              maxLength={2}
                              className="w-full px-2 py-2 pr-6 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm text-center font-medium"
                              required
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(slot.hours || '0')
                                  const newVal = current >= 23 ? 0 : current + 1
                                  updateTimeSlot('hours', String(newVal))
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                              >
                                <ChevronUp className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(slot.hours || '0')
                                  const newVal = current <= 0 ? 23 : current - 1
                                  updateTimeSlot('hours', String(newVal))
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                              >
                                <ChevronDown className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Minutes */}
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Min (0-59)</label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={slot.minutes}
                              onChange={(e) => updateTimeSlot('minutes', e.target.value.replace(/\D/g, ''))}
                              placeholder="00"
                              maxLength={2}
                              className="w-full px-2 py-2 pr-6 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all text-sm text-center font-medium"
                              required
                            />
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(slot.minutes || '0')
                                  const newVal = current >= 59 ? 0 : current + 1
                                  updateTimeSlot('minutes', String(newVal))
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                              >
                                <ChevronUp className="w-3 h-3 text-gray-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseInt(slot.minutes || '0')
                                  const newVal = current <= 0 ? 59 : current - 1
                                  updateTimeSlot('minutes', String(newVal))
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                              >
                                <ChevronDown className="w-3 h-3 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={formData.customMessage}
              onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
            />
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
              disabled={
                loading || 
                interviews.length === 0 || 
                !formData.interviewId || 
                formData.candidateEmails.every(email => !email.trim()) ||
                timeSlotInputs.some(slot => !slot.date || slot.hours === '' || slot.minutes === '')
              }
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-5 w-5" />
              <span>{loading ? 'Sending...' : interviews.length === 0 ? 'No Interviews Available' : 'Send Invitations'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteCandidatesModal
