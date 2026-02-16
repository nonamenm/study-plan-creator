import { useState } from 'react'
import PropTypes from 'prop-types'

function StudyPlanDisplay({ studyPlan, onBack, onUpdateSubjects, onRefreshPlan }) {
  const [selectedDay, setSelectedDay] = useState(null)
  const [completedDays, setCompletedDays] = useState(new Set())
  const [completedTopics, setCompletedTopics] = useState(new Set()) // Track completed topics: "day-subject-topicIndex"
  const [completedPomodoros, setCompletedPomodoros] = useState(new Set()) // Track completed pomodoros: "day-subject-topicIndex-pomodoroNumber"
  const [currentPage, setCurrentPage] = useState(1)
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [editingMaterials, setEditingMaterials] = useState([])
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [showLongBreakModal, setShowLongBreakModal] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Pagination settings
  const daysPerPage = 7 // Show 7 days per page (one week)
  const totalPages = Math.ceil(studyPlan.dailySchedule.length / daysPerPage)
  
  // Get days for current page
  const startIndex = (currentPage - 1) * daysPerPage
  const endIndex = startIndex + daysPerPage
  const currentPageDays = studyPlan.dailySchedule.slice(startIndex, endIndex)

  const toggleDayComplete = (day) => {
    const newCompleted = new Set(completedDays)
    if (newCompleted.has(day)) {
      newCompleted.delete(day)
    } else {
      newCompleted.add(day)
    }
    setCompletedDays(newCompleted)
  }

  // Toggle topic completion
  const toggleTopicComplete = (day, subjectName, topicIndex) => {
    const topicKey = `${day}-${subjectName}-${topicIndex}`
    const newCompleted = new Set(completedTopics)
    if (newCompleted.has(topicKey)) {
      newCompleted.delete(topicKey)
    } else {
      newCompleted.add(topicKey)
    }
    setCompletedTopics(newCompleted)
  }

  // Check if a topic is completed
  const isTopicCompleted = (day, subjectName, topicIndex) => {
    const topicKey = `${day}-${subjectName}-${topicIndex}`
    return completedTopics.has(topicKey)
  }

  // Toggle pomodoro completion
  const togglePomodoroComplete = (day, subjectName, topicIndex, pomodoroNumber) => {
    const pomodoroKey = `${day}-${subjectName}-${topicIndex}-${pomodoroNumber}`
    const newCompleted = new Set(completedPomodoros)
    const wasCompleted = newCompleted.has(pomodoroKey)
    
    if (wasCompleted) {
      // Unchecking - remove from set
      newCompleted.delete(pomodoroKey)
      setCompletedPomodoros(newCompleted)
      // Hide modals if unchecking
      setShowBreakModal(false)
      setShowLongBreakModal(false)
      setShowConfetti(false)
    } else {
      // Checking - add to set
      newCompleted.add(pomodoroKey)
      setCompletedPomodoros(newCompleted)
      
      // Count total completed pomodoros
      const totalCompleted = newCompleted.size
      
      // Check if this is the 5th pomodoro (or a multiple of 5)
      if (totalCompleted > 0 && totalCompleted % 5 === 0) {
        // 30 minute break with confetti!
        setShowConfetti(true)
        setShowLongBreakModal(true)
        // Auto-hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000)
      } else {
        // Regular 5 minute break
        setShowBreakModal(true)
      }
    }
  }

  // Check if a pomodoro is completed
  const isPomodoroCompleted = (day, subjectName, topicIndex, pomodoroNumber) => {
    const pomodoroKey = `${day}-${subjectName}-${topicIndex}-${pomodoroNumber}`
    return completedPomodoros.has(pomodoroKey)
  }

  const progressPercentage = studyPlan.dailySchedule.length > 0
    ? Math.round((completedDays.size / studyPlan.dailySchedule.length) * 100)
    : 0

  const getPriorityColor = (priority, totalSubjects) => {
    if (!totalSubjects || totalSubjects <= 0) {
      return 'bg-gray-100 text-gray-800 border-gray-300'
    }
    
    const priorityPercent = (totalSubjects - priority + 1) / totalSubjects
    
    if (priorityPercent >= 0.67) {
      return 'bg-red-100 text-red-800 border-red-300'
    } else if (priorityPercent >= 0.33) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 relative">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <span
                className="text-2xl"
                style={{
                  color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181'][Math.floor(Math.random() * 5)],
                }}
              >
                🎉
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 5 Minute Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowBreakModal(false)}>
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-6xl mb-4">⏱️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Great Work!</h2>
              <p className="text-lg text-gray-600 mb-6">Take a 5 minute break</p>
              <button
                onClick={() => setShowBreakModal(false)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Continue Studying
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 30 Minute Break Modal with Confetti */}
      {showLongBreakModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowLongBreakModal(false)
          setShowConfetti(false)
        }}>
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg p-8 max-w-md mx-4 shadow-xl border-4 border-yellow-400" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-6xl mb-4">🎉🎊🎈</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Congratulations!</h2>
              <p className="text-xl text-gray-700 mb-2 font-semibold">You've completed 5 pomodoros!</p>
              <p className="text-lg text-gray-600 mb-6">Take a well-deserved 30 minute break</p>
              <button
                onClick={() => {
                  setShowLongBreakModal(false)
                  setShowConfetti(false)
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Continue Studying
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">📚 Your Study Plan</h1>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Form
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Days Until First Exam</div>
              <div className="text-2xl font-bold text-blue-700">{studyPlan.daysUntilExam}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Study Hours</div>
              <div className="text-2xl font-bold text-green-700">{studyPlan.totalHours.toFixed(1)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Hours Per Day</div>
              <div className="text-2xl font-bold text-purple-700">{studyPlan.summary.hoursPerDay}</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Subjects</div>
              <div className="text-2xl font-bold text-orange-700">{studyPlan.summary.subjectsCount}</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedDays.size} of {studyPlan.dailySchedule.length} days completed
            </p>
          </div>
        </div>

        {/* Subject Allocations */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Subject Time Allocation & Study Materials</h2>
            {onRefreshPlan && (
              <button
                onClick={onRefreshPlan}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium flex items-center gap-2"
                title="Refresh plan to update topic distribution in calendar"
              >
                🔄 Refresh Plan
              </button>
            )}
          </div>
          {onRefreshPlan && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> After editing topics/materials, click "Refresh Plan" to update the calendar with the new topic distribution.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {studyPlan.subjects
              .sort((a, b) => a.priority - b.priority)
              .map((subject) => {
                const isEditing = editingSubjectId === subject.id
                const subjectMaterials = subject.materials || []
                
                return (
                  <div
                    key={subject.id || subject.name}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* Subject Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="font-medium text-gray-800">{subject.name}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(subject.priority, studyPlan.summary.subjectsCount)}`}>
                          Priority {subject.priority}
                        </span>
                        <span className="text-sm text-gray-600">
                          {subject.examDates.length} exam{subject.examDates.length > 1 ? 's' : ''}: {subject.examDates.map(d => new Date(d).toLocaleDateString()).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-gray-800 text-sm">
                            {subject.hours.toFixed(1)} hours total
                          </div>
                          <div className="text-xs text-gray-600">
                            ~{subject.minutesPerDay.toFixed(0)} min/day
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (isEditing) {
                              setEditingSubjectId(null)
                              setEditingMaterials([])
                            } else {
                              setEditingSubjectId(subject.id || subject.name)
                              setEditingMaterials([...subjectMaterials])
                            }
                          }}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                        >
                          {isEditing ? 'Done' : '✏️ Edit Materials'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Study Materials Section */}
                    <div className="mt-3 pl-2 border-l-2 border-blue-300">
                      <div className="text-xs font-medium text-gray-600 mb-2">
                        Study Materials/Topics:
                      </div>
                      
                      {isEditing ? (
                        <div className="space-y-2">
                          {editingMaterials.map((material, idx) => {
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
                              <div key={idx} className="flex flex-col gap-2">
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={materialName}
                                    onChange={(e) => {
                                      const updated = [...editingMaterials]
                                      const currentMaterial = updated[idx]
                                      if (typeof currentMaterial === 'string') {
                                        updated[idx] = e.target.value
                                      } else {
                                        updated[idx] = {
                                          ...currentMaterial,
                                          name: e.target.value
                                        }
                                      }
                                      setEditingMaterials(updated)
                                    }}
                                    placeholder="Topic name"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <select
                                    value={timeType}
                                    onChange={(e) => {
                                      const updated = [...editingMaterials]
                                      const currentMaterial = updated[idx]
                                      const newTimeType = e.target.value
                                      if (typeof currentMaterial === 'string') {
                                        updated[idx] = {
                                          name: currentMaterial,
                                          timeType: newTimeType,
                                          estimatedMinutes: '',
                                          pomodoroCount: ''
                                        }
                                      } else {
                                        updated[idx] = {
                                          ...currentMaterial,
                                          timeType: newTimeType,
                                          estimatedMinutes: newTimeType === 'minutes' ? currentMaterial.estimatedMinutes : '',
                                          pomodoroCount: newTimeType === 'pomodoro' ? currentMaterial.pomodoroCount : ''
                                        }
                                      }
                                      setEditingMaterials(updated)
                                    }}
                                    className="px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                                          const updated = [...editingMaterials]
                                          const currentMaterial = updated[idx]
                                          const minutes = e.target.value ? parseInt(e.target.value) : ''
                                          if (typeof currentMaterial === 'string') {
                                            updated[idx] = {
                                              name: currentMaterial,
                                              timeType: 'minutes',
                                              estimatedMinutes: minutes
                                            }
                                          } else {
                                            updated[idx] = {
                                              ...currentMaterial,
                                              estimatedMinutes: minutes
                                            }
                                          }
                                          setEditingMaterials(updated)
                                        }}
                                        placeholder="Min"
                                        min="1"
                                        className="w-20 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                          const updated = [...editingMaterials]
                                          const currentMaterial = updated[idx]
                                          const pomodoroCount = e.target.value ? parseInt(e.target.value) : ''
                                          if (typeof currentMaterial === 'string') {
                                            updated[idx] = {
                                              name: currentMaterial,
                                              timeType: 'pomodoro',
                                              pomodoroCount: pomodoroCount,
                                              estimatedMinutes: pomodoroCount ? pomodoroCount * 25 : ''
                                            }
                                          } else {
                                            updated[idx] = {
                                              ...currentMaterial,
                                              pomodoroCount: pomodoroCount,
                                              estimatedMinutes: pomodoroCount ? pomodoroCount * 25 : ''
                                            }
                                          }
                                          setEditingMaterials(updated)
                                        }}
                                        placeholder="Count"
                                        min="1"
                                        className="w-20 px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                      <span className="text-xs text-gray-500">pomodoro(s)</span>
                                    </>
                                  )}
                                  <button
                                    onClick={() => {
                                      const updated = editingMaterials.filter((_, i) => i !== idx)
                                      setEditingMaterials(updated)
                                    }}
                                    className="px-2 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingMaterials([...editingMaterials, { name: '', timeType: '', estimatedMinutes: '', pomodoroCount: '' }])}
                              className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            >
                              + Add Topic
                            </button>
                            <button
                              onClick={() => {
                                // Update the subject in studyPlan
                                if (onUpdateSubjects) {
                                  // Filter out empty materials and convert strings to objects if needed
                                  const cleanedMaterials = editingMaterials
                                    .filter(m => {
                                      if (typeof m === 'string') {
                                        return m.trim() !== ''
                                      }
                                      return m.name && m.name.trim() !== ''
                                    })
                                    .map(m => {
                                      if (typeof m === 'string') {
                                        return { name: m.trim(), timeType: '', estimatedMinutes: '', pomodoroCount: '' }
                                      }
                                      return {
                                        name: m.name.trim(),
                                        timeType: m.timeType || '',
                                        estimatedMinutes: m.estimatedMinutes || '',
                                        pomodoroCount: m.pomodoroCount || ''
                                      }
                                    })
                                  
                                  const updatedSubjects = studyPlan.subjects.map(s =>
                                    (s.id || s.name) === (subject.id || subject.name)
                                      ? { ...s, materials: cleanedMaterials }
                                      : s
                                  )
                                  onUpdateSubjects(updatedSubjects)
                                }
                                setEditingSubjectId(null)
                                setEditingMaterials([])
                                // Note: User needs to click "Refresh Plan" button to regenerate calendar
                              }}
                              className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => {
                                setEditingSubjectId(null)
                                setEditingMaterials([])
                              }}
                              className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {subjectMaterials.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {subjectMaterials.map((material, idx) => {
                                const materialName = typeof material === 'string' ? material : (material.name || '')
                                const timeType = typeof material === 'object' && material.timeType ? material.timeType : 'minutes'
                                const materialMinutes = typeof material === 'object' && material.estimatedMinutes ? material.estimatedMinutes : null
                                const pomodoroCount = typeof material === 'object' && material.pomodoroCount ? material.pomodoroCount : null
                                
                                return (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded text-sm text-gray-700"
                                    title={
                                      timeType === 'pomodoro' && pomodoroCount 
                                        ? `${pomodoroCount} pomodoro(s) = ${materialMinutes} minutes` 
                                        : materialMinutes 
                                        ? `Estimated: ${materialMinutes} minutes` 
                                        : 'Time will be auto-calculated'
                                    }
                                  >
                                    {materialName}
                                    {timeType === 'pomodoro' && pomodoroCount ? (
                                      <span className="ml-1 text-xs text-gray-500">({pomodoroCount} pomodoro{pomodoroCount > 1 ? 's' : ''})</span>
                                    ) : materialMinutes ? (
                                      <span className="ml-1 text-xs text-gray-500">({materialMinutes}m)</span>
                                    ) : null}
                                  </span>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 italic">
                              No study materials added yet. Click "Edit Materials" to add topics.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Daily Schedule - Vertical Calendar Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Weekly Study Calendar</h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Week {currentPage} of {totalPages} ({studyPlan.dailySchedule.length} days total)
              </div>
              {onRefreshPlan && (
                <button
                  onClick={onRefreshPlan}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                  title="Refresh plan after editing topics"
                >
                  🔄 Refresh Plan
                </button>
              )}
            </div>
          </div>
          
          {/* Vertical Calendar Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-400">
                  <th className="border-r border-gray-300 p-3 text-center text-sm font-semibold text-gray-700 w-16">
                    ✓
                  </th>
                  <th className="border-r border-gray-300 p-3 text-left text-sm font-semibold text-gray-700 w-20">
                    Day
                  </th>
                  <th className="border-r border-gray-300 p-3 text-left text-sm font-semibold text-gray-700 w-32">
                    Date
                  </th>
                  <th className="border-r border-gray-300 p-3 text-left text-sm font-semibold text-gray-700 w-24">
                    Total Time
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Subjects
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentPageDays.map((day) => {
                  const dayOfWeek = new Date(day.date).getDay()
                  const isCompleted = completedDays.has(day.day)
                  const totalHours = (day.totalMinutes / 60).toFixed(1)
                  const weekdayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })
                  const dateStr = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  
                  return (
                    <tr
                      key={day.day}
                      className={`${
                        isCompleted
                          ? 'bg-green-50'
                          : dayOfWeek === 0 || dayOfWeek === 6
                          ? 'bg-blue-50'
                          : 'bg-white hover:bg-gray-50'
                      } transition-colors border-b-2 border-gray-400`}
                    >
                      {/* Checkbox Column */}
                      <td className="border-r border-gray-300 p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isCompleted}
                          onChange={() => toggleDayComplete(day.day)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      
                      {/* Day Number Column */}
                      <td className="border-r border-gray-300 p-3">
                        <div className="font-bold text-gray-800">Day {day.day}</div>
                        <div className="text-xs text-gray-500 mt-1">{weekdayName}</div>
                      </td>
                      
                      {/* Date Column */}
                      <td className="border-r border-gray-300 p-3">
                        <div className="text-sm text-gray-700">{dateStr}</div>
                      </td>
                      
                      {/* Total Time Column */}
                      <td className="border-r border-gray-300 p-3">
                        <div className="text-sm font-semibold text-gray-800">{totalHours} hours</div>
                        <div className="text-xs text-gray-500">{day.totalMinutes} minutes</div>
                      </td>
                      
                      {/* Subjects Column */}
                      <td className="p-3">
                        <div className="space-y-3">
                          {day.subjects.length > 0 ? (
                            day.subjects.map((subject, idx) => (
                              <div
                                key={idx}
                                className="p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                {/* Subject Header */}
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(subject.priority, studyPlan.summary.subjectsCount)}`}>
                                      P{subject.priority}
                                    </span>
                                    <span className="font-medium text-gray-800 text-sm">
                                      {subject.name}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-600 font-medium ml-2">
                                    {subject.minutes}m ({subject.hours}h)
                                  </span>
                                </div>
                                
                                {/* Topics for this subject */}
                                {subject.topics && subject.topics.length > 0 ? (
                                  <div className="ml-8 mt-2">
                                    <div className="text-xs text-gray-500 mb-1 font-medium">Topics:</div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      {subject.topics.map((topic, topicIdx) => {
                                        // Handle both string and object formats
                                        const topicName = typeof topic === 'string' ? topic : (topic.name || '')
                                        const topicMinutes = typeof topic === 'object' && topic.estimatedMinutes ? topic.estimatedMinutes : null
                                        const pomodoroCount = typeof topic === 'object' && topic.pomodoroCount ? topic.pomodoroCount : null
                                        const timeType = typeof topic === 'object' && topic.timeType ? topic.timeType : null
                                        const topicCompleted = isTopicCompleted(day.day, subject.name, topicIdx)
                                        
                                        return (
                                          <div
                                            key={topicIdx}
                                            className="flex flex-col gap-1"
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="checkbox"
                                                checked={topicCompleted}
                                                onChange={() => toggleTopicComplete(day.day, subject.name, topicIdx)}
                                                className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
                                                title="Mark topic as completed"
                                              />
                                              <span
                                                className={`px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700 transition-all ${
                                                  topicCompleted 
                                                    ? 'line-through text-gray-400 bg-green-50 border-green-300' 
                                                    : ''
                                                }`}
                                                title={topicMinutes ? `Estimated: ${topicMinutes} minutes` : 'Time auto-calculated'}
                                              >
                                                {topicName}
                                                {topicMinutes && !pomodoroCount && (
                                                  <span className="ml-1 text-gray-500">({topicMinutes}m)</span>
                                                )}
                                                {pomodoroCount && (
                                                  <span className="ml-1 text-gray-500">({pomodoroCount} pomodoro{pomodoroCount > 1 ? 's' : ''})</span>
                                                )}
                                              </span>
                                            </div>
                                            {/* Pomodoro checkboxes */}
                                            {pomodoroCount && pomodoroCount > 0 && (
                                              <div className="ml-6 flex items-center gap-1 flex-wrap">
                                                <span className="text-xs text-gray-500 mr-1">Pomodoros:</span>
                                                {Array.from({ length: pomodoroCount }, (_, i) => i + 1).map((pomoNum) => {
                                                  const pomoCompleted = isPomodoroCompleted(day.day, subject.name, topicIdx, pomoNum)
                                                  return (
                                                    <label
                                                      key={pomoNum}
                                                      className="flex items-center gap-1 cursor-pointer"
                                                      title={`Pomodoro ${pomoNum} of ${pomodoroCount}`}
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={pomoCompleted}
                                                        onChange={() => togglePomodoroComplete(day.day, subject.name, topicIdx, pomoNum)}
                                                        className="w-3 h-3 text-orange-600 rounded focus:ring-1 focus:ring-orange-500 cursor-pointer"
                                                      />
                                                      <span className={`text-xs ${pomoCompleted ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                        {pomoNum}
                                                      </span>
                                                    </label>
                                                  )
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                    {/* Show total topic time vs available time */}
                                    {(() => {
                                      const totalTopicTime = subject.topics.reduce((sum, topic) => {
                                        const minutes = typeof topic === 'object' && topic.estimatedMinutes ? topic.estimatedMinutes : 0
                                        return sum + minutes
                                      }, 0)
                                      if (totalTopicTime > 0) {
                                        return (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Topics: {totalTopicTime}m / Available: {subject.minutes}m
                                          </div>
                                        )
                                      }
                                      return null
                                    })()}
                                  </div>
                                ) : (
                                  <div className="ml-8 mt-1">
                                    <span className="text-xs text-gray-400 italic">No topics assigned</span>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-400 italic">No subjects scheduled</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage = 
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1) ||
                    (currentPage <= 2 && page <= 4) ||
                    (currentPage >= totalPages - 1 && page >= totalPages - 3)
                  
                  if (!showPage) {
                    // Show ellipsis
                    const prevPage = page - 1
                    const nextPage = page + 1
                    if (
                      (prevPage === 1 || prevPage === currentPage - 1) &&
                      (nextPage === totalPages || nextPage === currentPage + 1)
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>
                    }
                    return null
                  }
                  
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white font-semibold'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

StudyPlanDisplay.propTypes = {
  studyPlan: PropTypes.shape({
    dailySchedule: PropTypes.arrayOf(PropTypes.shape({
      day: PropTypes.number.isRequired,
      date: PropTypes.string.isRequired,
      subjects: PropTypes.array.isRequired,
      totalMinutes: PropTypes.number.isRequired
    })).isRequired,
    daysUntilExam: PropTypes.number.isRequired,
    totalHours: PropTypes.number.isRequired,
    earliestExamDate: PropTypes.string.isRequired,
    subjects: PropTypes.array.isRequired,
    summary: PropTypes.shape({
      totalDays: PropTypes.number.isRequired,
      totalHours: PropTypes.number.isRequired,
      hoursPerDay: PropTypes.number.isRequired,
      subjectsCount: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onUpdateSubjects: PropTypes.func,
  onRefreshPlan: PropTypes.func
}

export default StudyPlanDisplay
