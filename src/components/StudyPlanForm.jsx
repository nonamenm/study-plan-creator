import { useState, useMemo } from 'react'
import { generateStudyPlan } from '../utils/studyPlanGenerator'
import StudyPlanDisplay from './StudyPlanDisplay'
import defaultSubjects from '../data/defaultSubjects'
import * as storage from '../utils/storage'
import { validateSubjectName, validateExamDates, validatePriority, validateFormSubmission } from '../utils/formValidation'
import SubjectCard from './SubjectCard'
import MaterialsCard from './MaterialsCard'

function StudyPlanForm() {
  const savedFormData = storage.getFormData()
  const savedPlan = storage.getStudyPlan()

  const initialSubjects = savedFormData?.subjects ?? defaultSubjects
  const [currentStep, setCurrentStep] = useState(1)
  const [numberOfSubjects, setNumberOfSubjects] = useState(savedFormData?.numberOfSubjects ?? String(defaultSubjects.length))
  const [subjects, setSubjects] = useState(initialSubjects)
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newSubjectPriority, setNewSubjectPriority] = useState(initialSubjects.length + 1)
  const [newSubjectExamDates, setNewSubjectExamDates] = useState([''])
  const [dailyHours, setDailyHours] = useState(savedFormData?.dailyHours ?? '')
  const [errors, setErrors] = useState({})
  const [studyPlan, setStudyPlan] = useState(savedPlan ?? null)
  const [collapsedItems, setCollapsedItems] = useState(new Set())

  const toggleSubjectCollapse = (subjectId) => {
    const key = `form-subject-${subjectId}`
    setCollapsedItems(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const persistFormData = (overrides = {}) => {
    storage.saveFormData({
      numberOfSubjects,
      subjects,
      dailyHours,
      ...overrides,
    })
  }

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
    const nameError = validateSubjectName(newSubjectName, subjects)
    if (nameError) {
      setErrors({ ...errors, subject: nameError })
      return
    }

    // Validate exam dates
    const examDateError = validateExamDates(newSubjectExamDates)
    if (examDateError) {
      setErrors({ ...errors, subject: examDateError })
      return
    }
    
    // Sort exam dates chronologically
    const validExamDates = newSubjectExamDates.filter(date => date.trim() !== '')
    const sortedExamDates = validExamDates.sort((a, b) => new Date(a) - new Date(b))

    // Validate priority
    const total = parseInt(numberOfSubjects)
    const priorityNum = parseInt(newSubjectPriority)
    const usedPriorities = new Set(subjects.map(s => parseInt(s.priority)))
    const priorityError = validatePriority(priorityNum, total, usedPriorities)
    if (priorityError) {
      setErrors({ ...errors, subject: priorityError })
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
    persistFormData({ subjects: updatedSubjects })
  }

  // Remove a subject from the list
  const handleRemoveSubject = (id) => {
    const updatedSubjects = subjects.filter(s => s.id !== id)
    setSubjects(updatedSubjects)
    persistFormData({ subjects: updatedSubjects })
  }

  // Handle updating exam dates for a subject
  const handleUpdateExamDates = (id, updatedDates) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, examDates: updatedDates } : s
    ))
  }

  // Handle updating materials for a subject
  const handleUpdateMaterials = (id, updatedMaterials) => {
    setSubjects(subjects.map(s => 
      s.id === id ? { ...s, materials: updatedMaterials } : s
    ))
  }

  // Update subject priority
  const handleUpdatePriority = (id, newPriority) => {
    const newPriorityNum = parseInt(newPriority)
    const usedPriorities = new Set(subjects.filter(s => s.id !== id).map(s => parseInt(s.priority)))
    const priorityError = validatePriority(newPriorityNum, parseInt(numberOfSubjects), usedPriorities)
    
    if (priorityError) {
      setErrors({ ...errors, subject: priorityError })
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
    const newErrors = validateFormSubmission({ numberOfSubjects, subjects, dailyHours })
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
        persistFormData()
        storage.saveStudyPlan(plan)
        storage.clearProgress()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (error) {
        setErrors({ ...newErrors, general: error.message || 'Failed to generate study plan. Please check your inputs.' })
      }
    }
  }

  // Handle updating subjects from the plan display
  const handleUpdateSubjects = (updatedSubjects) => {
    setSubjects(updatedSubjects)
    persistFormData({ subjects: updatedSubjects })
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
      persistFormData()
      storage.saveStudyPlan(plan)
      storage.clearProgress()
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
                  <strong>Tip:</strong> Some exams consist of Paper 1 and Paper 2 exams. Add multiple dates if your subject has multiple papers.
                </p>
                {newSubjectExamDates.map((date, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        const inputValue = e.target.value
                        // Always update the date value first (allow typing)
                        const updatedDates = [...newSubjectExamDates]
                        updatedDates[index] = inputValue
                        setNewSubjectExamDates(updatedDates)
                        
                        // Only validate if date is complete (has all parts)
                        if (inputValue && inputValue.length === 10) {
                          const dateParts = inputValue.split('-')
                          if (dateParts.length === 3) {
                            const year = dateParts[0]
                            const month = dateParts[1]
                            const day = dateParts[2]
                            // Check if all parts are present and year is valid
                            if (year.length === 4 && month.length === 2 && day.length === 2) {
                              const yearNum = parseInt(year)
                              if (isNaN(yearNum) || yearNum < new Date().getFullYear() || yearNum > new Date().getFullYear() + 100) {
                                setErrors({ ...errors, subject: 'Please enter a valid date with a 4-digit year' })
                                return
                              }
                            }
                          }
                        }
                        // Clear errors if date is being typed or is valid
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
                
                return (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    numberOfSubjects={numberOfSubjects}
                    onUpdatePriority={handleUpdatePriority}
                    onRemove={handleRemoveSubject}
                    onUpdateExamDates={handleUpdateExamDates}
                    isCollapsed={collapsedItems.has(`form-subject-${subject.id}`)}
                    onToggleCollapse={toggleSubjectCollapse}
                    availablePriorities={availablePrioritiesForSubject}
                    errors={errors}
                    setErrors={setErrors}
                  />
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
              {subjects.map((subject) => (
                <MaterialsCard
                  key={subject.id}
                  subject={subject}
                  numberOfSubjects={numberOfSubjects}
                  onUpdateMaterials={handleUpdateMaterials}
                  onRemove={handleRemoveSubject}
                  isCollapsed={collapsedItems.has(`form-subject-${subject.id}`)}
                  onToggleCollapse={toggleSubjectCollapse}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              No subjects found. Please go back to Step 1 and add subjects first.
            </p>
          )}

          {/* Error Display */}
          {(errors.general || errors.dailyHours || errors.numberOfSubjects || errors.subjects) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg space-y-1">
              {errors.general && <p className="text-red-600 font-medium">{errors.general}</p>}
              {errors.dailyHours && <p className="text-red-600 font-medium">{errors.dailyHours}</p>}
              {errors.numberOfSubjects && <p className="text-red-600 font-medium">{errors.numberOfSubjects}</p>}
              {errors.subjects && <p className="text-red-600 font-medium">{errors.subjects}</p>}
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
