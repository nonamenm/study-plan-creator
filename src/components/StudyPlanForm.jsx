import { useState, useMemo } from 'react'
import { generateStudyPlan } from '../utils/studyPlanGenerator'
import StudyPlanDisplay from './StudyPlanDisplay'

function StudyPlanForm() {
  // Form state
  const [currentStep, setCurrentStep] = useState(1) // 1 = Basic Info, 2 = Materials
  const [numberOfSubjects, setNumberOfSubjects] = useState('')
  const [subjects, setSubjects] = useState([])
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectPriority, setNewSubjectPriority] = useState(1)
  const [newSubjectExamDates, setNewSubjectExamDates] = useState(['']) // Array to support multiple exam dates
  const [dailyHours, setDailyHours] = useState('')
  const [learningStyle, setLearningStyle] = useState('')
  const [errors, setErrors] = useState({})
  const [studyPlan, setStudyPlan] = useState(null)

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
      examDates: sortedExamDates, // Store as array
      materials: [] // Array to store study materials/topics as objects {name, timeType: 'minutes'|'pomodoro', estimatedMinutes, pomodoroCount}
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

    // If no errors, generate study plan
    if (Object.keys(newErrors).length === 0) {
      try {
        const plan = generateStudyPlan(
          subjects,
          parseInt(numberOfSubjects),
          parseFloat(dailyHours)
        )
        setStudyPlan(plan)
        // Scroll to top to show the plan
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error) {
        setErrors({ ...newErrors, general: error.message || 'Failed to generate study plan. Please check your inputs.' })
      }
    }
  }

  // Handle updating subjects from the plan display
  const handleUpdateSubjects = (updatedSubjects) => {
    // Update the form's subjects state
    setSubjects(updatedSubjects)
  }

  // Handle refreshing the plan (regenerates with current subjects)
  const handleRefreshPlan = () => {
    try {
      const plan = generateStudyPlan(
        subjects,
        parseInt(numberOfSubjects),
        parseFloat(dailyHours)
      )
      setStudyPlan(plan)
      // Scroll to top to show updated plan
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (error) {
      console.error('Error refreshing study plan:', error)
      setErrors({ general: 'Failed to refresh study plan. Please check your inputs.' })
    }
  }

  // If plan is generated, show the plan display
  if (studyPlan) {
    return (
      <StudyPlanDisplay
        studyPlan={studyPlan}
        onBack={() => setStudyPlan(null)}
        onUpdateSubjects={handleUpdateSubjects}
        onRefreshPlan={handleRefreshPlan}
      />
    )
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

  // Validate step 1 before moving to step 2
  const validateStep1 = () => {
    const newErrors = {}
    
    if (!numberOfSubjects || parseInt(numberOfSubjects) <= 0) {
      newErrors.numberOfSubjects = 'Please specify number of subjects'
    }
    
    if (subjects.length === 0) {
      newErrors.subjects = 'Please add at least one subject'
    }
    
    if (!dailyHours || parseFloat(dailyHours) <= 0) {
      newErrors.dailyHours = 'Daily study hours must be greater than 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle moving to next step
  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2)
      setErrors({}) // Clear errors when moving forward
    }
  }
  
  // Handle moving back to previous step
  const handleBackStep = () => {
    setCurrentStep(1)
    setErrors({})
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className={`flex-1 text-center py-2 ${currentStep === 1 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-100 text-gray-600'} rounded-lg transition-colors`}>
            Step 1: Basic Information
          </div>
          <div className="w-4"></div>
          <div className={`flex-1 text-center py-2 ${currentStep === 2 ? 'bg-blue-100 text-blue-800 font-semibold' : 'bg-gray-100 text-gray-600'} rounded-lg transition-colors`}>
            Step 2: Study Materials
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          {currentStep === 1 ? 'Add your subjects and exam dates' : 'Add topics and time estimates for each subject'}
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
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
          placeholder="e.g. 8"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.numberOfSubjects && (
          <p className="text-red-500 text-sm mt-1">{errors.numberOfSubjects}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">
          How many subjects do you need to study? (e.g. 1 = highest priority, 8 = lowest priority)
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
          <div className="bg-gray-100 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => {
                    setNewSubjectName(e.target.value)
                    setErrors({ ...errors, subject: '' })
                  }}
                  placeholder="Enter subject name (e.g. Math, English, Irish)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                </label>
                <p className="text-xs text-gray-500 italic">
                  💡 Some exams consist of Paper 1 and Paper 2 exams. Add multiple dates if your subject has multiple papers.
                </p>
                {newSubjectExamDates.map((date, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        // Validate year is exactly 4 digits
                        if (inputValue) {
                          const dateParts = inputValue.split('-')
                          if (dateParts.length === 3) {
                            const year = dateParts[0]
                            // Check if year is exactly 4 digits and within reasonable range
                            if (year.length !== 4 || isNaN(year) || parseInt(year) < new Date().getFullYear() || parseInt(year) > new Date().getFullYear() + 100) {
                              setErrors({ ...errors, subject: 'Please enter a valid date with a 4-digit year' })
                              return
                            }
                          }
                        }
                        const updatedDates = [...newSubjectExamDates]
                        updatedDates[index] = inputValue
                        setNewSubjectExamDates(updatedDates)
                        setErrors({ ...errors, subject: '' })
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(new Date().getFullYear() + 100, 11, 31).toISOString().split('T')[0]}
                      placeholder={`Exam ${index + 1} date`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                              // Validate year is exactly 4 digits
                              if (newDate) {
                                const dateParts = newDate.split('-')
                                if (dateParts.length === 3) {
                                  const year = dateParts[0]
                                  // Check if year is exactly 4 digits and within reasonable range
                                  if (year.length !== 4 || isNaN(year) || parseInt(year) < new Date().getFullYear() || parseInt(year) > new Date().getFullYear() + 100) {
                                    setErrors({ ...errors, subject: 'Please enter a valid date with a 4-digit year' })
                                    return
                                  }
                                }
                              }
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
                            max={new Date(new Date().getFullYear() + 100, 11, 31).toISOString().split('T')[0]}
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
              placeholder="e.g. 2.5"
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

          {/* Next Button for Step 1 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextStep}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Next: Add Materials →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Study Materials */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Add Study Materials & Topics</h2>
            <p className="text-gray-600 text-sm">
              For each subject, add the topics you need to study. You can optionally specify how long each topic takes.
            </p>
          </div>

          {/* Subjects List with Materials */}
          {subjects.length > 0 ? (
            <div className="space-y-4">
              {subjects.map((subject) => {
                const subjectExamDates = subject.examDates || []
                
                return (
                  <div key={subject.id} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                    {/* Subject Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded text-sm font-semibold border ${getPriorityColor(subject.priority, parseInt(numberOfSubjects))}`}>
                          P{subject.priority}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(subject.id)}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {/* Study Materials */}
                    <div className="space-y-2 pl-2 border-l-2 border-blue-300 mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Study Materials/Topics:</div>
                      {(subject.materials || []).map((material, materialIndex) => {
                        // Handle both old format (string) and new format (object)
                        const materialName = typeof material === 'string' ? material : (material.name || '')
                        // Ensure timeType is explicitly set, default to empty string
                        const timeType = typeof material === 'object' && material.timeType !== undefined && material.timeType !== null 
                          ? material.timeType 
                          : ''
                        const materialValue = timeType === 'pomodoro' && typeof material === 'object'
                          ? (material.pomodoroCount || '')
                          : (timeType === 'minutes' && typeof material === 'object' && material.estimatedMinutes ? material.estimatedMinutes : '')
                        
                        return (
                          <div key={materialIndex} className="flex flex-col gap-2">
                            <div className="flex gap-2 items-center">
                              <input
                                type="text"
                                value={materialName}
                                onChange={(e) => {
                                  const updatedMaterials = [...(subject.materials || [])]
                                  const currentMaterial = updatedMaterials[materialIndex]
                                  if (typeof currentMaterial === 'string') {
                                    updatedMaterials[materialIndex] = e.target.value
                                  } else {
                                    updatedMaterials[materialIndex] = {
                                      ...currentMaterial,
                                      name: e.target.value
                                    }
                                  }
                                  setSubjects(subjects.map(s => 
                                    s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                                  ))
                                }}
                                placeholder="Topic name"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <select
                                value={timeType}
                                onChange={(e) => {
                                  const updatedMaterials = [...(subject.materials || [])]
                                  const currentMaterial = updatedMaterials[materialIndex]
                                  const newTimeType = e.target.value
                                  if (typeof currentMaterial === 'string') {
                                    updatedMaterials[materialIndex] = {
                                      name: currentMaterial,
                                      timeType: newTimeType,
                                      estimatedMinutes: '',
                                      pomodoroCount: ''
                                    }
                                  } else {
                                    updatedMaterials[materialIndex] = {
                                      ...currentMaterial,
                                      timeType: newTimeType,
                                      estimatedMinutes: newTimeType === 'minutes' ? currentMaterial.estimatedMinutes : '',
                                      pomodoroCount: newTimeType === 'pomodoro' ? currentMaterial.pomodoroCount : ''
                                    }
                                  }
                                  setSubjects(subjects.map(s => 
                                    s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                                  ))
                                }}
                                className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              >
                                <option value="">Select option</option>
                                <option value="minutes">Minutes</option>
                                <option value="pomodoro">Pomodoro</option>
                              </select>
                              {timeType === 'minutes' && (
                                <>
                                  <input
                                    type="number"
                                    value={materialValue}
                                    onChange={(e) => {
                                      const updatedMaterials = [...(subject.materials || [])]
                                      const currentMaterial = updatedMaterials[materialIndex]
                                      const minutes = e.target.value ? parseInt(e.target.value) : ''
                                      if (typeof currentMaterial === 'string') {
                                        updatedMaterials[materialIndex] = {
                                          name: currentMaterial,
                                          timeType: 'minutes',
                                          estimatedMinutes: minutes
                                        }
                                      } else {
                                        updatedMaterials[materialIndex] = {
                                          ...currentMaterial,
                                          estimatedMinutes: minutes
                                        }
                                      }
                                      setSubjects(subjects.map(s => 
                                        s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                                      ))
                                    }}
                                    placeholder="Min"
                                    min="1"
                                    className="w-24 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">min</span>
                                </>
                              )}
                              {timeType === 'pomodoro' && (
                                <>
                                  <input
                                    type="number"
                                    value={materialValue}
                                    onChange={(e) => {
                                      const updatedMaterials = [...(subject.materials || [])]
                                      const currentMaterial = updatedMaterials[materialIndex]
                                      const pomodoroCount = e.target.value ? parseInt(e.target.value) : ''
                                      if (typeof currentMaterial === 'string') {
                                        updatedMaterials[materialIndex] = {
                                          name: currentMaterial,
                                          timeType: 'pomodoro',
                                          pomodoroCount: pomodoroCount,
                                          estimatedMinutes: pomodoroCount ? pomodoroCount * 25 : ''
                                        }
                                      } else {
                                        updatedMaterials[materialIndex] = {
                                          ...currentMaterial,
                                          pomodoroCount: pomodoroCount,
                                          estimatedMinutes: pomodoroCount ? pomodoroCount * 25 : ''
                                        }
                                      }
                                      setSubjects(subjects.map(s => 
                                        s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                                      ))
                                    }}
                                    placeholder="Count"
                                    min="1"
                                    className="w-24 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <span className="text-xs text-gray-500">pomodoro(s)</span>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMaterials = (subject.materials || []).filter((_, i) => i !== materialIndex)
                                  setSubjects(subjects.map(s => 
                                    s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                                  ))
                                }}
                                className="px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                                title="Remove this material"
                              >
                                ×
                              </button>
                            </div>
                            {timeType === 'pomodoro' && materialValue && (
                              <p className="text-xs text-gray-500 ml-2">
                                = {parseInt(materialValue) * 25} minutes (1 pomodoro = 25 min)
                              </p>
                            )}
                          </div>
                        )
                      })}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedMaterials = [...(subject.materials || []), { name: '', timeType: '', estimatedMinutes: '', pomodoroCount: '' }]
                          setSubjects(subjects.map(s => 
                            s.id === subject.id ? { ...s, materials: updatedMaterials } : s
                          ))
                        }}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                      >
                        + Add Material/Topic
                      </button>
                      {(!subject.materials || subject.materials.length === 0) && (
                        <p className="text-xs text-gray-400 italic">No materials added yet. Add topics you need to study.</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Specify estimated time per topic (minutes or pomodoros). 1 pomodoro = 25 minutes. If left blank, time will be auto-calculated.
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No subjects found. Please go back to Step 1 and add subjects first.
            </p>
          )}

          {/* General Error Display */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">{errors.general}</p>
            </div>
          )}

          {/* Navigation Buttons for Step 2 */}
          <div className="flex justify-between gap-4">
            <button
              type="button"
              onClick={handleBackStep}
              className="px-8 py-3 bg-gray-500 text-white rounded-lg font-semibold text-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Generate Study Plan
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

export default StudyPlanForm
