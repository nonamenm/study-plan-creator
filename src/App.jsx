import { useState } from 'react'
import StudyPlanForm from './components/StudyPlanForm'
import { getProfile, saveProfile } from './utils/storage'

function App() {
  const [profile, setProfile] = useState(() => getProfile())
  const [nameInput, setNameInput] = useState('')
  const [nameError, setNameError] = useState('')

  const handleNameSubmit = (e) => {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed) {
      setNameError('Please enter your name')
      return
    }
    const newProfile = { name: trimmed }
    saveProfile(newProfile)
    setProfile(newProfile)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Study Plan Creator
          </h1>
          <p className="text-gray-600 text-center mb-6">
            What's your name?
          </p>
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value)
                setNameError('')
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              autoFocus
            />
            {nameError && (
              <p className="text-red-500 text-sm">{nameError}</p>
            )}
            <button
              type="submit"
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Study Plan Creator
          </h1>
          <p className="text-gray-600">
            Hi, {profile.name} — create a personalized study plan based on your subjects, priorities, and available time
          </p>
        </header>

        <StudyPlanForm />
      </div>
    </div>
  )
}

export default App
