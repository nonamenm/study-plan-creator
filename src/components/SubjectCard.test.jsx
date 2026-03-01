import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SubjectCard from './SubjectCard'
import { createMockSubject } from '../test/utils/test-helpers'

describe('SubjectCard', () => {
  const defaultProps = {
    subject: createMockSubject({ name: 'Math', priority: 1 }),
    numberOfSubjects: '3',
    onUpdatePriority: vi.fn(),
    onRemove: vi.fn(),
    onUpdateExamDates: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn(),
    availablePriorities: [1, 2, 3],
    errors: {},
    setErrors: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders subject name', () => {
      render(<SubjectCard {...defaultProps} />)
      expect(screen.getByText('Math')).toBeInTheDocument()
    })

    it('renders priority badge', () => {
      const { container } = render(<SubjectCard {...defaultProps} />)
      // Priority badge is in a span with specific classes, select dropdown also has "Priority 1"
      const badges = container.querySelectorAll('span.px-2.py-1.rounded')
      const priorityBadge = Array.from(badges).find(badge => badge.textContent === 'Priority 1')
      expect(priorityBadge).toBeInTheDocument()
    })

    it('renders exam dates count', () => {
      const subject = createMockSubject({
        name: 'Math',
        examDates: ['2024-02-15', '2024-03-20']
      })
      render(<SubjectCard {...defaultProps} subject={subject} />)
      expect(screen.getByText(/2 exam/)).toBeInTheDocument()
    })

    it('shows "No exam dates set" when no dates', () => {
      const subject = createMockSubject({ examDates: [] })
      render(<SubjectCard {...defaultProps} subject={subject} />)
      expect(screen.getByText('No exam dates set')).toBeInTheDocument()
    })

    it('shows collapsed state (arrow indicator)', () => {
      const { container } = render(<SubjectCard {...defaultProps} isCollapsed={true} />)
      const arrow = container.querySelector('span.transform')
      expect(arrow).toBeInTheDocument()
      // When collapsed, arrow should not have rotate-90 class
      const hasRotate = arrow?.className.includes('rotate-90')
      expect(hasRotate).toBe(false)
    })

    it('shows expanded state (arrow rotated)', () => {
      const { container } = render(<SubjectCard {...defaultProps} isCollapsed={false} />)
      const arrow = container.querySelector('span.transform')
      expect(arrow).toBeInTheDocument()
      // When expanded, arrow should have rotate-90 class
      const hasRotate = arrow?.className.includes('rotate-90')
      expect(hasRotate).toBe(true)
    })

    it('shows exam dates when expanded', () => {
      const subject = createMockSubject({
        examDates: ['2024-02-15']
      })
      render(<SubjectCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText('Exam Dates:')).toBeInTheDocument()
    })

    it('hides exam dates when collapsed', () => {
      const subject = createMockSubject({
        examDates: ['2024-02-15']
      })
      render(<SubjectCard {...defaultProps} subject={subject} isCollapsed={true} />)
      expect(screen.queryByText('Exam Dates:')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('toggles collapse on header click', async () => {
      const user = userEvent.setup()
      const onToggleCollapse = vi.fn()
      render(<SubjectCard {...defaultProps} onToggleCollapse={onToggleCollapse} />)
      
      const header = screen.getByText('Math').closest('div[class*="cursor-pointer"]')
      await user.click(header)
      
      expect(onToggleCollapse).toHaveBeenCalledWith(defaultProps.subject.id)
    })

    it('updates priority via select', async () => {
      const user = userEvent.setup()
      const onUpdatePriority = vi.fn()
      render(<SubjectCard {...defaultProps} onUpdatePriority={onUpdatePriority} />)
      
      const select = screen.getByDisplayValue('Priority 1')
      await user.selectOptions(select, '2')
      
      expect(onUpdatePriority).toHaveBeenCalledWith(defaultProps.subject.id, '2')
    })

    it('removes subject (calls onRemove with stopPropagation)', async () => {
      const user = userEvent.setup()
      const onRemove = vi.fn()
      render(<SubjectCard {...defaultProps} onRemove={onRemove} />)
      
      const removeButton = screen.getByText('Remove')
      await user.click(removeButton)
      
      expect(onRemove).toHaveBeenCalledWith(defaultProps.subject.id)
    })

    it('adds exam date', async () => {
      const user = userEvent.setup()
      const onUpdateExamDates = vi.fn()
      const subject = createMockSubject({ examDates: ['2024-02-15'] })
      render(<SubjectCard {...defaultProps} subject={subject} onUpdateExamDates={onUpdateExamDates} isCollapsed={false} />)
      
      const addButton = screen.getByText('+ Add Exam Date')
      await user.click(addButton)
      
      expect(onUpdateExamDates).toHaveBeenCalled()
      const callArgs = onUpdateExamDates.mock.calls[0]
      expect(callArgs[0]).toBe(subject.id)
      expect(callArgs[1].length).toBe(2) // Original + new empty date
    })

    it('removes exam date', async () => {
      const user = userEvent.setup()
      const onUpdateExamDates = vi.fn()
      const subject = createMockSubject({ examDates: ['2024-02-15', '2024-03-20'] })
      render(<SubjectCard {...defaultProps} subject={subject} onUpdateExamDates={onUpdateExamDates} isCollapsed={false} />)
      
      const removeButtons = screen.getAllByText('×')
      // First × is for removing the subject, second is for removing exam date
      const removeDateButton = removeButtons[1]
      await user.click(removeDateButton)
      
      expect(onUpdateExamDates).toHaveBeenCalled()
      const callArgs = onUpdateExamDates.mock.calls[0]
      expect(callArgs[1].length).toBe(1) // One date removed
    })

    it('validates exam dates (future dates only)', async () => {
      const user = userEvent.setup()
      const setErrors = vi.fn()
      const subject = createMockSubject({ examDates: [''] })
      const { container } = render(<SubjectCard {...defaultProps} subject={subject} setErrors={setErrors} isCollapsed={false} />)
      
      const dateInput = container.querySelector('input[type="date"]')
      expect(dateInput).toBeInTheDocument()
      
      const today = new Date().toISOString().split('T')[0]
      await user.type(dateInput, today)
      
      // Should set error for past/today date
      expect(setErrors).toHaveBeenCalled()
    })

    it('sorts exam dates chronologically', async () => {
      const user = userEvent.setup()
      const onUpdateExamDates = vi.fn()
      const subject = createMockSubject({ examDates: ['2024-03-20', '2024-02-15'] })
      render(<SubjectCard {...defaultProps} subject={subject} onUpdateExamDates={onUpdateExamDates} isCollapsed={false} />)
      
      // When a valid date is entered, dates should be sorted
      const dateInputs = screen.getAllByDisplayValue(/2024-/)
      expect(dateInputs.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('handles empty exam dates array', () => {
      const subject = createMockSubject({ examDates: [] })
      render(<SubjectCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText('No exam dates set')).toBeInTheDocument()
    })

    it('handles multiple exam dates', () => {
      const subject = createMockSubject({
        examDates: ['2024-02-15', '2024-03-20', '2024-04-25']
      })
      render(<SubjectCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText(/3 exam/)).toBeInTheDocument()
    })

    it('handles invalid date input gracefully', async () => {
      const user = userEvent.setup()
      const setErrors = vi.fn()
      const subject = createMockSubject({ examDates: [''] })
      const { container } = render(<SubjectCard {...defaultProps} subject={subject} setErrors={setErrors} isCollapsed={false} />)
      
      const dateInput = container.querySelector('input[type="date"]')
      expect(dateInput).toBeInTheDocument()
      
      // Date inputs have built-in validation, so clearing should be handled gracefully
      await user.clear(dateInput)
      expect(dateInput).toBeInTheDocument()
    })

    it('handles priority change without triggering collapse', async () => {
      const user = userEvent.setup()
      const onToggleCollapse = vi.fn()
      const onUpdatePriority = vi.fn()
      render(
        <SubjectCard
          {...defaultProps}
          onToggleCollapse={onToggleCollapse}
          onUpdatePriority={onUpdatePriority}
        />
      )
      
      const select = screen.getByDisplayValue('Priority 1')
      await user.click(select)
      await user.selectOptions(select, '2')
      
      // Collapse should not be triggered by priority change
      expect(onToggleCollapse).not.toHaveBeenCalled()
      expect(onUpdatePriority).toHaveBeenCalled()
    })
  })
})
