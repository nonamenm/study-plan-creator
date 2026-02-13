import { useState, useMemo } from 'react'

function StudyPlanForm() {
  // Form state
  const [numberOfSubjects, setNumberOfSubjects] = useState('')
  const [subjects, setSubjects] = useState([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectPriority, setNewSubjectPriority] = useState(1)
  const [newSubjectExamDates, setNewSubjectExamDates] = useState(['']) // Array to support multiple exam dates
  const [dailyHours, setDailyHours] = useState('')
  const [learningStyle, setLearningStyle] = useState('')
  const [errors, setErrors] = useState({})

  // Get available priorities (priorities not yet assigned)
  const availablePriorities = useMemo(() => {
    if (!numberOfSubjects || parseInt(numberOfSubjects) <= 0) return []
    
    const total = parseInt(numberOfSubjects)
    // Ensure all priorities are numbers for consistent comparison
    const usedPriorities = new Set(subjects.map(s => parseInt(s.priority)))
    const allPriorities = Array.from({ length: total }, (_, i) => i + 1)
    
    return allPriorities.filter(p => !usedPriorities.has(p))
  }, [numberOfSubjects, subjects])


  // Add a new subject to the list
  const handleAddSubject = (e) => {
    e.preventDefault()
    
    // Validate number of subjects is set
    if (!numberOfSubjects || parseInt(numberOfSubjects) <= 0) {
      setErrors({ ...errors, numberOfSubjects: 'Please specify number of subjects first' })
      return
    }

    // Check if all subjects are already added
    if (subjects.length >= parseInt(numberOfSubjects)) {
      setErrors({ ...errors, subject: `You can only add ${numberOfSubjects} subject(s)` })
      return
    }

    // Validate subject name
    if (!newSubjectName.trim()) {
      setErrors({ ...errors, subject: 'Subject name is required' })
      return
    }

    // Check for duplicate subject names
    if (subjects.some(s => s.name.toLowerCase() === newSubjectName.trim().toLowerCase())) {
      setErrors({ ...errors, subject: 'This subject already exists' })
      return
    }

    // Validate exam dates (filter out empty strings)
    const validExamDates = newSubjectExamDates.filter(date => date.trim() !== '')
    
    if (validExamDates.length === 0) {
      setErrors({ ...errors, subject: 'At least one exam date is required for this subject' })
      return
    }

    // Validate all exam dates are in the future
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const examDate of validExamDates) {
      const selectedDate = new Date(examDate)
      if (selectedDate <= today) {
        setErrors({ ...errors, subject: 'All exam dates must be in the future' })
        return
      }
    }
    
    // Sort exam dates chronologically
    const sortedExamDates = validExamDates.sort((a, b) => new Date(a) - new Date(b))

    // Validate priority is available (recalculate directly to avoid stale state)
    const total = parseInt(numberOfSubjects)
    const priorityNum = parseInt(newSubjectPriority) // Ensure it's a number
    
    // Validate it's a valid number
    if (isNaN(priorityNum)) {
      setErrors({ ...errors, subject: 'Invalid priority selected' })
      return
    }
    
    // Get all used priorities as numbers (calculate fresh, don't rely on memoized values)
    const usedPriorities = new Set(subjects.map(s => parseInt(s.priority)))
    
    // Validate range and availability
    const priorityInRange = priorityNum >= 1 && priorityNum <= total
    const priorityNotUsed = !usedPriorities.has(priorityNum)
    
    if (!priorityInRange) {
      setErrors({ ...errors, subject: `Priority must be between 1 and ${total}` })
      return
    }
    
    if (!priorityNotUsed) {
      setErrors({ ...errors, subject: 'This priority is already assigned to another subject' })
      return
    }

    // Add subject
    const newSubject = {
      id: Date.now(), // Simple ID generation
      name: newSubjectName.trim(),
      priority: priorityNum,
      examDates: sortedExamDates // Store as array
    }

    // Update subjects
    const updatedSubjects = [...subjects, newSubject]
    setSubjects(updatedSubjects)
    setNewSubjectName('')
    setNewSubjectExamDates(['']) // Reset to single empty date input
    
    // Calculate next available priority directly (don't rely on memoized value)
    // Note: 'total' is already declared above, so we reuse it
    const updatedUsedPriorities = new Set(updatedSubjects.map(s => parseInt(s.priority)))
    const allPriorities = Array.from({ length: total }, (_, i) => i + 1)
    const nextAvailable = allPriorities.find(p => !updatedUsedPriorities.has(p))
    
    setNewSubjectPriority(nextAvailable || 1)
    setErrors({ ...errors, subject: '', numberOfSubjects: '' })
  }

  // Remove a subject from the list
  const handleRemoveSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id))
  }

  // Update subject priority
  const handleUpdatePriority = (id, newPriority) => {
    const newPriorityNum = parseInt(newPriority)
    
    // Check if new priority is already taken by another subject
    const priorityTaken = subjects.some(s => s.id !== id && s.priority === newPriorityNum)
    if (priorityTaken) {
      setErrors({ ...errors, subject: 'This priority is already assigned to another subject' })
      return
    }

    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, priority: newPriorityNum } : s
    ))
    setErrors({ ...errors, subject: '' })
  }

  // Handle number of subjects change
  const handleNumberOfSubjectsChange = (value) => {
    const num = parseInt(value) || 0
    
    // If reducing number of subjects, remove excess subjects
    if (num < subjects.length) {
      setSubjects(subjects.slice(0, num))
    }
    
    // If reducing and current priority is invalid, reset to next available
    if (num > 0 && !availablePriorities.includes(newSubjectPriority)) {
      const newAvailable = Array.from({ length: num }, (_, i) => i + 1)
        .filter(p => !subjects.some(s => s.priority === p))
      if (newAvailable.length > 0) {
        setNewSubjectPriority(Math.min(...newAvailable))
      }
    }
    
    setNumberOfSubjects(value)
    setErrors({ ...errors, numberOfSubjects: '' })
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    // Validation
    if (!numberOfSubjects || parseInt(numberOfSubjects) <= 0) {
      newErrors.numberOfSubjects = 'Please specify number of subjects'
    }

    if (subjects.length === 0) {
      newErrors.subjects = 'Please add at least one subject'
    } else if (subjects.length < parseInt(numberOfSubjects)) {
      newErrors.subjects = `Please add all ${numberOfSubjects} subject(s)`
    }

    // Validate all subjects have exam dates
    const subjectsWithoutDates = subjects.filter(s => !s.examDates || s.examDates.length === 0)
    if (subjectsWithoutDates.length > 0) {
      newErrors.subjects = 'All subjects must have at least one exam date'
    }

    if (!dailyHours || parseFloat(dailyHours) <= 0) {
      newErrors.dailyHours = 'Daily study hours must be greater than 0'
    }

    setErrors(newErrors)

    // If no errors, proceed (for now just log - Phase 2 will generate plan)
    if (Object.keys(newErrors).length === 0) {
      console.log('Form submitted:', {
        subjects,
        dailyHours: parseFloat(dailyHours),
        learningStyle
      })
      // TODO: Generate study plan (Phase 2)
      alert('Form is valid! Study plan generation will be implemented in Phase 2.')
    }
  }

  // Get priority badge color based on priority number and total subjects
  const getPriorityColor = (priority, totalSubjects) => {
    if (!totalSubjects || totalSubjects <= 0) {
      return 'bg-gray-100 text-gray-800 border-gray-300'
    }
    
    // Calculate priority percentage (1 = highest, N = lowest)
    const priorityPercent = (totalSubjects - priority + 1) / totalSubjects
    
    // Color gradient: Red (high priority) -> Yellow (medium) -> Blue (low priority)
    if (priorityPercent >= 0.67) {
      return 'bg-red-100 text-red-800 border-red-300' // Top third
    } else if (priorityPercent >= 0.33) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300' // Middle third
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-300' // Bottom third
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      {/* Number of Subjects Section */}
      <div className="mb-6">
        <label htmlFor="numberOfSubjects" className="block text-lg font-semibold text-gray-700 mb-2">
          Number of Subjects <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="numberOfSubjects"
          value={numberOfSubjects}
          onChange={(e) => handleNumberOfSubjectsChange(e.target.value)}
          min="1"
          max="20"
          placeholder="e.g., 8"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.numberOfSubjects && (
          <p className="text-red-500 text-sm mt-1">{errors.numberOfSubjects}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">
          How many subjects do you need to study? (Priority 1 = highest priority, {numberOfSubjects || 'N'} = lowest priority)
        </p>
      </div>

      {/* Subjects Section */}
      <div className="mb-6">
        <label className="block text-lg font-semibold text-gray-700 mb-3">
          Subjects <span className="text-red-500">*</span>
          {numberOfSubjects && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({subjects.length} of {numberOfSubjects} added)
            </span>
          )}
        </label>
        
        {/* Add Subject Input */}
        {numberOfSubjects && parseInt(numberOfSubjects) > 0 && (
          <div className="space-y-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newSubjectName}
                onChange={(e) => {
                  setNewSubjectName(e.target.value)
                  setErrors({ ...errors, subject: '' })
                }}
                placeholder="Enter subject name (e.g., Math, English, Irish)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={subjects.length >= parseInt(numberOfSubjects)}
              />
              <select
                value={newSubjectPriority}
                onChange={(e) => {
                  const selectedPriority = parseInt(e.target.value, 10)
                  if (!isNaN(selectedPriority)) {
                    setNewSubjectPriority(selectedPriority)
                    setErrors({ ...errors, subject: '' })
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={subjects.length >= parseInt(numberOfSubjects) || availablePriorities.length === 0}
              >
                {availablePriorities.map(priority => (
                  <option key={priority} value={String(priority)}>
                    Priority {priority}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddSubject}
                disabled={subjects.length >= parseInt(numberOfSubjects)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Subject
              </button>
            </div>
            
            {/* Exam Dates Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Exam Dates <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">(e.g., Paper 1, Paper 2)</span>
              </label>
              {newSubjectExamDates.map((date, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const updatedDates = [...newSubjectExamDates]
                      updatedDates[index] = e.target.value
                      setNewSubjectExamDates(updatedDates)
                      setErrors({ ...errors, subject: '' })
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder={`Exam ${index + 1} date`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={subjects.length >= parseInt(numberOfSubjects)}
                  />
                  {index === newSubjectExamDates.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setNewSubjectExamDates([...newSubjectExamDates, ''])}
                      disabled={subjects.length >= parseInt(numberOfSubjects)}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title="Add another exam date"
                    >
                      + Add Date
                    </button>
                  )}
                  {newSubjectExamDates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updatedDates = newSubjectExamDates.filter((_, i) => i !== index)
                        setNewSubjectExamDates(updatedDates)
                        setErrors({ ...errors, subject: '' })
                      }}
                      className="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                      title="Remove this exam date"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {errors.subject && (
          <p className="text-red-500 text-sm mb-2">{errors.subject}</p>
        )}

        {/* Subjects List */}
        {subjects.length > 0 ? (
          <div className="space-y-2">
            {subjects
              .sort((a, b) => a.priority - b.priority) // Sort by priority
              .map((subject) => {
                const availablePrioritiesForSubject = Array.from(
                  { length: parseInt(numberOfSubjects) || 0 }, 
                  (_, i) => i + 1
                ).filter(p => p === subject.priority || !subjects.some(s => s.id !== subject.id && s.priority === p))
                
                const subjectExamDates = subject.examDates || []
                
                return (
                  <div
                    key={subject.id}
                    className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 gap-3"
                  >
                    {/* Subject Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-gray-800">{subject.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(subject.priority, parseInt(numberOfSubjects) || 0)}`}>
                          Priority {subject.priority}
                        </span>
                        <span className="text-sm text-gray-600">
                          {subjectExamDates.filter(d => d && d.trim() !== '').length > 0 
                            ? `${subjectExamDates.filter(d => d && d.trim() !== '').length} exam${subjectExamDates.filter(d => d && d.trim() !== '').length > 1 ? 's' : ''}: ${subjectExamDates.filter(d => d && d.trim() !== '').map(d => new Date(d).toLocaleDateString()).join(', ')}`
                            : 'No exam dates set'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={subject.priority}
                          onChange={(e) => handleUpdatePriority(subject.id, e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {availablePrioritiesForSubject.map(priority => (
                            <option key={priority} value={priority}>
                              Priority {priority}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject.id)}
                          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    
                    {/* Exam Dates */}
                    <div className="space-y-2 pl-2 border-l-2 border-gray-300">
                      <div className="text-xs font-medium text-gray-600">Exam Dates:</div>
                      {subjectExamDates.map((date, dateIndex) => (
                        <div key={dateIndex} className="flex gap-2 items-center">
                          <input
                            type="date"
                            value={date}
                            onChange={(e) => {
                              const newDate = e.target.value
                              const selectedDate = new Date(newDate)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              
                              if (selectedDate <= today) {
                                setErrors({ ...errors, subject: 'Exam date must be in the future' })
                                return
                              }
                              
                              const updatedDates = [...subjectExamDates]
                              updatedDates[dateIndex] = newDate
                              // Sort dates chronologically
                              updatedDates.sort((a, b) => new Date(a) - new Date(b))
                              
                              setSubjects(subjects.map(s => 
                                s.id === subject.id ? { ...s, examDates: updatedDates } : s
                              ))
                              setErrors({ ...errors, subject: '' })
                            }}
                            min={new Date().toISOString().split('T')[0]}
                            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updatedDates = subjectExamDates.filter((_, i) => i !== dateIndex)
                              setSubjects(subjects.map(s => 
                                s.id === subject.id ? { ...s, examDates: updatedDates } : s
                              ))
                            }}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                            title="Remove this exam date"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedDates = [...subjectExamDates, '']
                          setSubjects(subjects.map(s => 
                            s.id === subject.id ? { ...s, examDates: updatedDates } : s
                          ))
                        }}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                      >
                        + Add Exam Date
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        ) : numberOfSubjects && parseInt(numberOfSubjects) > 0 ? (
          <p className="text-gray-500 text-sm italic">
            No subjects added yet. Add your first subject above.
          </p>
        ) : (
          <p className="text-gray-500 text-sm italic">
            Please specify the number of subjects first.
          </p>
        )}

        {errors.subjects && (
          <p className="text-red-500 text-sm mt-2">{errors.subjects}</p>
        )}
      </div>

      {/* Daily Hours Section */}
      <div className="mb-6">
        <label htmlFor="dailyHours" className="block text-lg font-semibold text-gray-700 mb-2">
          Daily Study Time (hours) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="dailyHours"
          value={dailyHours}
          onChange={(e) => {
            setDailyHours(e.target.value)
            setErrors({ ...errors, dailyHours: '' })
          }}
          min="0.5"
          max="24"
          step="0.5"
          placeholder="e.g., 2.5"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.dailyHours && (
          <p className="text-red-500 text-sm mt-1">{errors.dailyHours}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">
          How many hours can you study per day?
        </p>
      </div>

      {/* Learning Style Section (Optional) */}
      <div className="mb-6">
        <label htmlFor="learningStyle" className="block text-lg font-semibold text-gray-700 mb-2">
          Learning Style <span className="text-gray-400 text-sm">(Optional)</span>
        </label>
        <select
          id="learningStyle"
          value={learningStyle}
          onChange={(e) => setLearningStyle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select your learning style</option>
          <option value="Visual">Visual (learn by seeing)</option>
          <option value="Auditory">Auditory (learn by hearing)</option>
          <option value="Reading/Writing">Reading/Writing (learn by reading/writing)</option>
          <option value="Kinesthetic">Kinesthetic (learn by doing)</option>
        </select>
        <p className="text-gray-500 text-sm mt-1">
          This will be used for future study method suggestions
        </p>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        Generate Study Plan
      </button>
    </form>
  )
}

export default StudyPlanForm
