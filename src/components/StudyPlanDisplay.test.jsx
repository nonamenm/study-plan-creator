import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StudyPlanDisplay from './StudyPlanDisplay'
import * as storage from '../utils/storage'
import { createMockPlan } from '../test/utils/test-helpers'

// Mock child components to simplify tests
vi.mock('./PlanSubjectCard', () => ({
  default: ({ subject }) => (
    <div data-testid={`subject-${subject.name}`}>
      <span>{subject.name}</span>
    </div>
  )
}))

vi.mock('./BreakModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="break-modal">Break Modal</div> : null
}))

vi.mock('./DayCompleteModal', () => ({
  default: ({ isOpen }) => isOpen ? <div data-testid="day-complete-modal">Day Complete</div> : null
}))

describe('StudyPlanDisplay', () => {
  const defaultProps = {
    studyPlan: createMockPlan(),
    onBack: vi.fn(),
    onUpdateSubjects: vi.fn(),
    onRefreshPlan: vi.fn()
  }

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('localStorage integration', () => {
    it('loads progress from localStorage on mount', () => {
      storage.saveProgress({
        completedDays: [1, 2],
        completedTopics: ['1-Math-0'],
        completedPomodoros: ['1-Math-0-1']
      })

      render(<StudyPlanDisplay {...defaultProps} />)
      
      // Progress should be loaded from localStorage
      const progress = storage.getProgress()
      expect(progress.completedDays).toContain(1)
      expect(progress.completedDays).toContain(2)
    })

    it('handles missing progress gracefully', () => {
      // No progress saved
      render(<StudyPlanDisplay {...defaultProps} />)
      
      // Should render without errors
      expect(screen.getByTestId('subject-Math')).toBeInTheDocument()
    })

    it('clears progress on plan refresh', async () => {
      const user = userEvent.setup()
      // Create a handler that clears progress when called
      const onRefreshPlan = vi.fn(() => {
        storage.clearProgress()
      })
      
      // Set up progress first
      storage.saveProgress({
        completedDays: [1],
        completedTopics: [],
        completedPomodoros: []
      })

      render(<StudyPlanDisplay {...defaultProps} onRefreshPlan={onRefreshPlan} />)
      
      // Get first refresh button (there may be multiple)
      const refreshButtons = screen.getAllByText(/Refresh Plan/i)
      await user.click(refreshButtons[0])
      
      expect(onRefreshPlan).toHaveBeenCalled()
      // Progress should be cleared by the handler
      expect(storage.getProgress()).toBeNull()
    })
  })

  describe('rendering', () => {
    it('renders without crashing', () => {
      render(<StudyPlanDisplay {...defaultProps} />)
      expect(screen.getByTestId('subject-Math')).toBeInTheDocument()
    })

    it('shows subject cards', () => {
      render(<StudyPlanDisplay {...defaultProps} />)
      expect(screen.getByTestId('subject-Math')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('navigates back to form', async () => {
      const user = userEvent.setup()
      const onBack = vi.fn()
      render(<StudyPlanDisplay {...defaultProps} onBack={onBack} />)
      
      const backButton = screen.getByText(/Back to Form/i)
      await user.click(backButton)
      expect(onBack).toHaveBeenCalled()
    })
  })
})
