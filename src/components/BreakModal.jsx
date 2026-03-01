import PropTypes from 'prop-types'

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function BreakModal({
  isOpen,
  onClose,
  duration,
  isLongBreak,
  timerStarted,
  timeRemaining,
  onStartTimer,
  onResetTimer
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className={`rounded-lg p-8 max-w-md mx-4 shadow-xl ${isLongBreak ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-4 border-yellow-400' : 'bg-white'}`} onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <h2 className={`font-bold text-gray-800 mb-2 ${isLongBreak ? 'text-3xl' : 'text-2xl'}`}>
            {isLongBreak ? 'Congratulations!' : 'Great Work!'}
          </h2>
          <p className={`text-gray-700 mb-2 font-semibold ${isLongBreak ? 'text-xl' : 'text-lg'}`}>
            {isLongBreak ? "You've completed 5 pomodoros!" : ''}
          </p>
          <p className={`text-gray-600 mb-4 ${isLongBreak ? 'text-lg' : 'text-lg'}`}>
            {isLongBreak ? 'Take a well-deserved break' : 'Take a break'}
          </p>
          
          {/* Timer Display */}
          <div className="mb-6">
            {timerStarted ? (
              <div>
                <div className={`text-5xl font-bold mb-2 ${
                  timeRemaining === 0 
                    ? 'text-green-600' 
                    : timeRemaining <= 60 
                    ? 'text-orange-600' 
                    : 'text-blue-600'
                }`}>
                  {formatTime(timeRemaining)}
                </div>
                {timeRemaining === 0 && (
                  <div className="mb-4">
                    <p className="text-xl font-bold text-green-600 mb-2">Break Complete!</p>
                    <p className="text-lg font-semibold text-orange-600">Get yo ass back to studying</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-3xl font-semibold text-gray-400 mb-4">
                {formatTime(timeRemaining)}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {!timerStarted ? (
              <button
                onClick={onStartTimer}
                className={`px-6 py-3 text-white rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 transition-colors ${isLongBreak ? 'bg-green-600 focus:ring-green-500' : 'bg-blue-600 focus:ring-blue-500 hover:bg-blue-700'}`}
              >
                Start Break
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                Continue Studying
              </button>
            )}
            {timerStarted && timeRemaining > 0 && (
              <button
                onClick={onResetTimer}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

BreakModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number.isRequired,
  isLongBreak: PropTypes.bool.isRequired,
  timerStarted: PropTypes.bool.isRequired,
  timeRemaining: PropTypes.number.isRequired,
  onStartTimer: PropTypes.func.isRequired,
  onResetTimer: PropTypes.func.isRequired,
}

export default BreakModal
