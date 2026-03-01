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

function MaterialsCard({
  subject,
  numberOfSubjects,
  onUpdateMaterials,
  onRemove,
  isCollapsed,
  onToggleCollapse
}) {
  return (
    <div className="border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
      {/* Subject Header — clickable to collapse */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onToggleCollapse(subject.id)}
      >
        <div className="flex items-center gap-3">
          <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'} text-gray-500`}>
            ▶
          </span>
          <span className={`px-3 py-1 rounded text-sm font-semibold border ${getPriorityColor(subject.priority, parseInt(numberOfSubjects))}`}>
            P{subject.priority}
          </span>
          <h3 className="text-lg font-semibold text-gray-800">{subject.name}</h3>
          <span className="text-sm text-gray-500">
            ({(subject.materials || []).filter(m => typeof m === 'string' ? m.trim() : m.name?.trim()).length} topic{(subject.materials || []).filter(m => typeof m === 'string' ? m.trim() : m.name?.trim()).length !== 1 ? 's' : ''})
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(subject.id)
          }}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
        >
          Remove
        </button>
      </div>
      
      {/* Study Materials — collapsible */}
      {!isCollapsed && (
        <div className="space-y-2 pl-6 pr-4 pb-4 border-l-2 border-blue-300 ml-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Study Materials/Topics:</div>
          {(subject.materials || []).map((material, materialIndex) => {
            const materialName = typeof material === 'string' ? material : (material.name || '')
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
                      onUpdateMaterials(subject.id, updatedMaterials)
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
                      onUpdateMaterials(subject.id, updatedMaterials)
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
                          onUpdateMaterials(subject.id, updatedMaterials)
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
                          onUpdateMaterials(subject.id, updatedMaterials)
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
                      onUpdateMaterials(subject.id, updatedMaterials)
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
              onUpdateMaterials(subject.id, updatedMaterials)
            }}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
          >
            + Add Material/Topic
          </button>
          {(!subject.materials || subject.materials.length === 0) && (
            <p className="text-xs text-gray-400 italic">No materials added yet. Add topics you need to study.</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            <strong>Tip:</strong> Specify estimated time per topic (minutes or pomodoros). 1 pomodoro = 25 minutes. If left blank, time will be auto-calculated.
          </p>
        </div>
      )}
    </div>
  )
}

MaterialsCard.propTypes = {
  subject: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    priority: PropTypes.number.isRequired,
    materials: PropTypes.array,
  }).isRequired,
  numberOfSubjects: PropTypes.string.isRequired,
  onUpdateMaterials: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
}

export default MaterialsCard
