import PropTypes from 'prop-types'

function getPriorityColor(priority, totalSubjects) {
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

function PlanSubjectCard({
  subject,
  studyPlan,
  isEditing,
  editingMaterials,
  onEditMaterials,
  onUpdateSubjects,
  onToggleEdit,
  isCollapsed,
  onToggleCollapse,
  getTopicRepetitionCount,
  collapsedItems,
  setCollapsedItems
}) {
  const subjectMaterials = subject.materials || []
  const subjectKey = subject.id || subject.name

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Subject Header — clickable to collapse */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onToggleCollapse(subjectKey)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'} text-gray-500`}>
            ▶
          </span>
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
              ~{subject.minutesPerDay ? subject.minutesPerDay.toFixed(0) : '0'} min/day
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleEdit(subjectKey)
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            {isEditing ? 'Done' : 'Edit Materials'}
          </button>
        </div>
      </div>
      
      {/* Study Materials Section — collapsible */}
      {!isCollapsed && (
        <div className="px-4 pb-4 pl-6 border-l-2 border-blue-300 ml-4">
          <div className="text-xs font-medium text-gray-600 mb-2">
            Study Materials/Topics:
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              {editingMaterials.map((material, idx) => {
                const materialName = typeof material === 'string' ? material : (material.name || '')
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
                          onEditMaterials(updated)
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
                          onEditMaterials(updated)
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
                              onEditMaterials(updated)
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
                              onEditMaterials(updated)
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
                          onEditMaterials(updated)
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
                  onClick={() => onEditMaterials([...editingMaterials, { name: '', timeType: '', estimatedMinutes: '', pomodoroCount: '' }])}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                >
                  + Add Topic
                </button>
                <button
                  onClick={() => {
                    if (onUpdateSubjects) {
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
                    onToggleEdit(null)
                  }}
                  className="px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => onToggleEdit(null)}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {subjectMaterials.length > 0 ? (
                <>
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
                  
                  {/* Breakdown Dropdown */}
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <button
                        onClick={() => {
                          const breakdownKey = `breakdown-${subjectKey}`
                          setCollapsedItems(prev => {
                            const next = new Set(prev)
                            if (next.has(breakdownKey)) {
                              next.delete(breakdownKey)
                            } else {
                              next.add(breakdownKey)
                            }
                            return next
                          })
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <span>Breakdown</span>
                        <span className={`transform transition-transform ${collapsedItems.has(`breakdown-${subjectKey}`) ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      <span className="text-xs text-gray-500 italic">
                        See how often each topic appears in your calendar
                      </span>
                    </div>
                    
                    {collapsedItems.has(`breakdown-${subjectKey}`) && (
                      <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="text-xs font-semibold text-gray-600 mb-2">Topic Repetition in Calendar:</div>
                        <div className="space-y-2">
                          {subjectMaterials.map((material, idx) => {
                            const materialName = typeof material === 'string' ? material : (material.name || '')
                            const repetitionCount = getTopicRepetitionCount(subject.name || subject.id, materialName)
                            
                            return (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <span className="text-gray-700">{materialName}</span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  repetitionCount > 0 
                                    ? 'bg-green-100 text-green-700 border border-green-300' 
                                    : 'bg-gray-100 text-gray-500 border border-gray-300'
                                }`}>
                                  {repetitionCount > 0 ? `${repetitionCount} time${repetitionCount > 1 ? 's' : ''}` : 'Not scheduled'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No study materials added yet. Click &quot;Edit Materials&quot; to add topics.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

PlanSubjectCard.propTypes = {
  subject: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string.isRequired,
    priority: PropTypes.number.isRequired,
    examDates: PropTypes.arrayOf(PropTypes.string).isRequired,
    hours: PropTypes.number.isRequired,
    minutesPerDay: PropTypes.number.isRequired,
    materials: PropTypes.array,
  }).isRequired,
  studyPlan: PropTypes.shape({
    subjects: PropTypes.array.isRequired,
    summary: PropTypes.shape({
      subjectsCount: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  isEditing: PropTypes.bool.isRequired,
  editingMaterials: PropTypes.array.isRequired,
  onEditMaterials: PropTypes.func.isRequired,
  onUpdateSubjects: PropTypes.func,
  onToggleEdit: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  getTopicRepetitionCount: PropTypes.func.isRequired,
  collapsedItems: PropTypes.instanceOf(Set).isRequired,
  setCollapsedItems: PropTypes.func.isRequired,
}

export default PlanSubjectCard
