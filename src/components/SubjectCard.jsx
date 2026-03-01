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

function SubjectCard({
  subject,
  numberOfSubjects,
  onUpdatePriority,
  onRemove,
  onUpdateExamDates,
  isCollapsed,
  onToggleCollapse,
  availablePriorities,
  errors,
  setErrors
}) {
  const subjectExamDates = subject.examDates || []

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Subject Header — clickable to collapse */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => onToggleCollapse(subject.id)}
      >
        <div className="flex items-center gap-3 flex-1">
          <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'} text-gray-500`}>
            ▶
          </span>
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
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdatePriority(subject.id, e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {availablePriorities.map(priority => (
              <option key={priority} value={priority}>
                Priority {priority}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(subject.id)
            }}
            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
      
      {/* Exam Dates — collapsible */}
      {!isCollapsed && (
        <div className="space-y-2 pl-5 pr-3 pb-3 border-l-2 border-gray-300 ml-3">
          <div className="text-xs font-medium text-gray-600">Exam Dates:</div>
          {subjectExamDates.map((date, dateIndex) => (
            <div key={dateIndex} className="flex gap-2 items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const newDate = e.target.value
                  
                  const updatedDates = [...subjectExamDates]
                  updatedDates[dateIndex] = newDate
                  
                  let hasError = false
                  if (newDate && newDate.length === 10) {
                    const dateParts = newDate.split('-')
                    if (dateParts.length === 3) {
                      const year = dateParts[0]
                      const month = dateParts[1]
                      const day = dateParts[2]
                      if (year.length === 4 && month.length === 2 && day.length === 2) {
                        const yearNum = parseInt(year)
                        if (isNaN(yearNum) || yearNum < new Date().getFullYear() || yearNum > new Date().getFullYear() + 100) {
                          setErrors(prev => ({ ...prev, subject: 'Please enter a valid date with a 4-digit year' }))
                          hasError = true
                        } else {
                          const selectedDate = new Date(newDate)
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          
                          if (selectedDate <= today) {
                            setErrors(prev => ({ ...prev, subject: 'Exam date must be in the future' }))
                            hasError = true
                          }
                        }
                      }
                    }
                  }
                  
                  if (newDate && newDate.length === 10 && !hasError) {
                    updatedDates.sort((a, b) => {
                      if (!a || a.length !== 10) return 1
                      if (!b || b.length !== 10) return -1
                      return new Date(a) - new Date(b)
                    })
                  }
                  
                  onUpdateExamDates(subject.id, updatedDates)
                  
                  if (!hasError) {
                    setErrors(prev => ({ ...prev, subject: '' }))
                  }
                }}
                min={new Date().toISOString().split('T')[0]}
                max={new Date(new Date().getFullYear() + 100, 11, 31).toISOString().split('T')[0]}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  const updatedDates = subjectExamDates.filter((_, i) => i !== dateIndex)
                  onUpdateExamDates(subject.id, updatedDates)
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
              onUpdateExamDates(subject.id, updatedDates)
            }}
            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
          >
            + Add Exam Date
          </button>
        </div>
      )}
    </div>
  )
}

SubjectCard.propTypes = {
  subject: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    priority: PropTypes.number.isRequired,
    examDates: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  numberOfSubjects: PropTypes.string.isRequired,
  onUpdatePriority: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onUpdateExamDates: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  availablePriorities: PropTypes.arrayOf(PropTypes.number).isRequired,
  errors: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
}

export default SubjectCard
