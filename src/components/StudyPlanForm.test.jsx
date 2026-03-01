import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyPlanForm from './StudyPlanForm'
import * as storage from '../utils/storage'
import { createMockSubject, createMockSubjects, createMockPlan } from '../test/utils/test-helpers'

// Mock StudyPlanDisplay to avoid rendering the full component in tests
vi.mock('./StudyPlanDisplay', () => ({
  default: ({ studyPlan }) => <div data-testid="study-plan-display">Plan Display: {studyPlan ? 'Plan exists' : 'No plan'}</div>
}))

describe('StudyPlanForm', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('loads saved form data from localStorage', () => {
      const savedData = {
        numberOfSubjects: '5',
        subjects: createMockSubjects(2),
        dailyHours: '3.5'
      }
      storage.saveFormData(savedData)

      render(<StudyPlanForm />)
      
      expect(screen.getByDisplayValue('5')).toBeInTheDocument()
      expect(screen.getByDisplayValue('3.5')).toBeInTheDocument()
    })

    it('falls back to defaultSubjects if no saved data', () => {
      render(<StudyPlanForm />)
      // Should show Step 1 with default subjects count
      expect(screen.getByText(/Step 1: Basic Information/)).toBeInTheDocument()
    })

    it('initializes on Step 1', () => {
      render(<StudyPlanForm />)
      expect(screen.getByText(/Step 1: Basic Information/)).toBeInTheDocument()
    })

    it('shows StudyPlanDisplay when saved plan exists', () => {
      const plan = createMockPlan()
      storage.saveStudyPlan(plan)

      render(<StudyPlanForm />)
      
      expect(screen.getByTestId('study-plan-display')).toBeInTheDocument()
      // Mock component renders "Plan exists" when plan is truthy
      const display = screen.getByTestId('study-plan-display')
      expect(display.textContent).toContain('Plan exists')
    })
  })

  describe('form flow', () => {
    it('adds subject and saves to localStorage', async () => {
      const user = userEvent.setup()
      const { container } = render(<StudyPlanForm />)
      
      // Set number of subjects first
      const numberOfSubjectsInput = screen.getByLabelText(/number of subjects/i) || screen.getByDisplayValue('')
      await user.clear(numberOfSubjectsInput)
      await user.type(numberOfSubjectsInput, '2')
      
      // Add subject name
      const nameInput = screen.getByPlaceholderText(/subject name/i)
      await user.type(nameInput, 'Math')
      
      // Add exam date - find date input in container
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateInputs = container.querySelectorAll('input[type="date"]')
      if (dateInputs.length > 0) {
        await user.type(dateInputs[0], tomorrow.toISOString().split('T')[0])
      }
      
      // Submit add subject
      const addButton = screen.getByText(/add subject/i)
      await user.click(addButton)
      
      // Check localStorage was updated
      await waitFor(() => {
        const savedData = storage.getFormData()
        expect(savedData).toBeTruthy()
        expect(savedData.subjects.length).toBeGreaterThan(0)
      })
    })

    it('removes subject and updates localStorage', async () => {
      const user = userEvent.setup()
      const subjects = createMockSubjects(2)
      storage.saveFormData({
        numberOfSubjects: '2',
        subjects,
        dailyHours: '2'
      })

      render(<StudyPlanForm />)
      
      // Find and click remove button for first subject
      const removeButtons = screen.getAllByText('Remove')
      await user.click(removeButtons[0])
      
      // Check localStorage was updated
      await waitFor(() => {
        const savedData = storage.getFormData()
        expect(savedData.subjects.length).toBe(1)
      })
    })

    it('validates before submission', async () => {
      const user = userEvent.setup()
      render(<StudyPlanForm />)
      
      // Try to navigate to Step 2 without filling required fields
      const nextButton = screen.queryByText(/next/i)
      if (nextButton) {
        await user.click(nextButton)
        // Should stay on Step 1 if validation fails
        expect(screen.getByText(/Step 1: Basic Information/)).toBeInTheDocument()
      }
    })

    it('generates plan and saves to localStorage', async () => {
      const user = userEvent.setup()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 10)
      
      const subjects = [
        createMockSubject({
          name: 'Math',
          examDates: [tomorrow.toISOString().split('T')[0]]
        })
      ]
      
      storage.saveFormData({
        numberOfSubjects: '1',
        subjects,
        dailyHours: '2'
      })

      render(<StudyPlanForm />)
      
      // Navigate to Step 2
      const nextButton = screen.getByText(/next/i)
      await user.click(nextButton)
      
      // Wait for Step 2 to render
      await waitFor(() => {
        expect(screen.getByText(/Step 2: Study Materials/)).toBeInTheDocument()
      })
      
      // Generate plan
      const generateButton = screen.getByText(/generate study plan/i)
      await user.click(generateButton)
      
      // Check plan was saved
      await waitFor(() => {
        const savedPlan = storage.getStudyPlan()
        expect(savedPlan).toBeTruthy()
        expect(savedPlan.subjects).toBeDefined()
      })
      
      // Check progress was cleared
      expect(storage.getProgress()).toBeNull()
    })

    it('clears progress on plan generation', async () => {
      const user = userEvent.setup()
      // Set up progress first
      storage.saveProgress({
        completedDays: [1, 2],
        completedTopics: ['1-Math-0'],
        completedPomodoros: []
      })
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 10)
      const subjects = [
        createMockSubject({
          name: 'Math',
          examDates: [tomorrow.toISOString().split('T')[0]]
        })
      ]
      
      storage.saveFormData({
        numberOfSubjects: '1',
        subjects,
        dailyHours: '2'
      })

      render(<StudyPlanForm />)
      
      // Navigate to Step 2
      const nextButton = screen.getByText(/next/i)
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText(/generate study plan/i)).toBeInTheDocument()
      })
      
      const generateButton = screen.getByText(/generate study plan/i)
      await user.click(generateButton)
      
      // Progress should be cleared
      await waitFor(() => {
        expect(storage.getProgress()).toBeNull()
      })
    })
  })

  describe('localStorage integration', () => {
    it('persists form data on subject add/remove', async () => {
      const user = userEvent.setup()
      render(<StudyPlanForm />)
      
      // Add a subject
      const numberOfSubjectsInput = screen.getByLabelText(/number of subjects/i) || screen.getByDisplayValue('')
      await user.clear(numberOfSubjectsInput)
      await user.type(numberOfSubjectsInput, '1')
      
      const nameInput = screen.getByPlaceholderText(/subject name/i)
      await user.type(nameInput, 'Test Subject')
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dateInputs = document.querySelectorAll('input[type="date"]')
      if (dateInputs.length > 0) {
        await user.type(dateInputs[0], tomorrow.toISOString().split('T')[0])
      }
      
      const addButton = screen.getByText(/add subject/i)
      await user.click(addButton)
      
      await waitFor(() => {
        const savedData = storage.getFormData()
        expect(savedData).toBeTruthy()
      })
    })

    it('loads saved plan on mount', () => {
      const plan = createMockPlan()
      storage.saveStudyPlan(plan)

      render(<StudyPlanForm />)
      
      expect(screen.getByTestId('study-plan-display')).toBeInTheDocument()
    })

    it('handles corrupt localStorage gracefully', () => {
      // Set invalid JSON
      localStorage.setItem('sp_formData', '{ invalid json }')
      
      // Should not crash, should fall back to defaults
      render(<StudyPlanForm />)
      expect(screen.getByText(/Step 1: Basic Information/)).toBeInTheDocument()
    })
  })

  describe('step navigation', () => {
    it('moves from Step 1 to Step 2', async () => {
      const user = userEvent.setup()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 10)
      
      const subjects = [
        createMockSubject({
          name: 'Math',
          examDates: [tomorrow.toISOString().split('T')[0]]
        })
      ]
      
      storage.saveFormData({
        numberOfSubjects: '1',
        subjects,
        dailyHours: '2'
      })

      render(<StudyPlanForm />)
      
      const nextButton = screen.getByText(/next/i)
      await user.click(nextButton)
      
      expect(screen.getByText(/Step 2: Study Materials/)).toBeInTheDocument()
    })

    it('moves back from Step 2 to Step 1', async () => {
      const user = userEvent.setup()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 10)
      
      const subjects = [
        createMockSubject({
          name: 'Math',
          examDates: [tomorrow.toISOString().split('T')[0]]
        })
      ]
      
      storage.saveFormData({
        numberOfSubjects: '1',
        subjects,
        dailyHours: '2'
      })

      render(<StudyPlanForm />)
      
      // Go to Step 2
      const nextButton = screen.getByText(/next/i)
      await user.click(nextButton)
      
      // Go back to Step 1
      const backButton = screen.getByText(/back/i)
      await user.click(backButton)
      
      expect(screen.getByText(/Step 1: Basic Information/)).toBeInTheDocument()
    })
  })
})
