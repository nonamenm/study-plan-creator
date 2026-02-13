import { useState } from 'react'
import StudyPlanForm from './components/StudyPlanForm'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📚 Study Plan Creator
          </h1>
          <p className="text-gray-600">
            Create a personalized study plan based on your subjects, priorities, and available time
          </p>
        </header>
        
        <StudyPlanForm />
      </div>
    </div>
  )
}

export default App
