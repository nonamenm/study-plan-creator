import PropTypes from 'prop-types'

function DayCompleteModal({
  isOpen,
  onClose,
  dayNumber,
  message
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg p-8 max-w-md mx-4 shadow-xl border-4 border-green-400" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Day {dayNumber} Complete!</h2>
          <p className="text-xl text-gray-700 mb-2 font-semibold">{message || 'Well done keep going, there\'s not long left now'}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors mt-4"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

DayCompleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dayNumber: PropTypes.number.isRequired,
  message: PropTypes.string,
}

export default DayCompleteModal
