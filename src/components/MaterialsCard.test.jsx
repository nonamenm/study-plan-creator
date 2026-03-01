import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MaterialsCard from './MaterialsCard'
import { createMockSubject, createMockMaterials } from '../test/utils/test-helpers'

describe('MaterialsCard', () => {
  const defaultProps = {
    subject: createMockSubject({
      name: 'Math',
      priority: 1,
      materials: []
    }),
    numberOfSubjects: '3',
    onUpdateMaterials: vi.fn(),
    onRemove: vi.fn(),
    isCollapsed: false,
    onToggleCollapse: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders subject name and priority', () => {
      render(<MaterialsCard {...defaultProps} />)
      expect(screen.getByText('Math')).toBeInTheDocument()
      expect(screen.getByText('P1')).toBeInTheDocument()
    })

    it('renders topic count', () => {
      const subject = createMockSubject({
        materials: createMockMaterials(3)
      })
      render(<MaterialsCard {...defaultProps} subject={subject} />)
      expect(screen.getByText(/3 topic/)).toBeInTheDocument()
    })

    it('shows collapsed state', () => {
      const { container } = render(<MaterialsCard {...defaultProps} isCollapsed={true} />)
      const arrow = container.querySelector('span.transform')
      expect(arrow).toBeInTheDocument()
      expect(arrow?.className).not.toContain('rotate-90')
    })

    it('shows expanded state', () => {
      const { container } = render(<MaterialsCard {...defaultProps} isCollapsed={false} />)
      const arrow = container.querySelector('span.transform')
      expect(arrow).toBeInTheDocument()
      expect(arrow?.className).toContain('rotate-90')
    })

    it('displays materials list when expanded', () => {
      const subject = createMockSubject({
        materials: createMockMaterials(2)
      })
      render(<MaterialsCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText('Study Materials/Topics:')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Topic 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Topic 2')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('adds new material/topic', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      render(<MaterialsCard {...defaultProps} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const addButton = screen.getByText('+ Add Material/Topic')
      await user.click(addButton)
      
      expect(onUpdateMaterials).toHaveBeenCalled()
      const callArgs = onUpdateMaterials.mock.calls[0]
      expect(callArgs[0]).toBe(defaultProps.subject.id)
      expect(callArgs[1].length).toBe(1) // New material added
    })

    it('edits material name', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1)
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const nameInput = screen.getByDisplayValue('Topic 1')
      await user.clear(nameInput)
      await user.type(nameInput, 'New Topic Name')
      
      expect(onUpdateMaterials).toHaveBeenCalled()
    })

    it('changes time type to minutes', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: '' })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const selects = screen.getAllByRole('combobox')
      const timeTypeSelect = selects[0]
      await user.selectOptions(timeTypeSelect, 'minutes')
      
      expect(onUpdateMaterials).toHaveBeenCalled()
    })

    it('changes time type to pomodoro', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: '' })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const selects = screen.getAllByRole('combobox')
      const timeTypeSelect = selects[0]
      await user.selectOptions(timeTypeSelect, 'pomodoro')
      
      expect(onUpdateMaterials).toHaveBeenCalled()
    })

    it('updates minutes value', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: 'minutes', estimatedMinutes: 30 })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const minutesInput = screen.getByPlaceholderText('Min')
      await user.clear(minutesInput)
      await user.type(minutesInput, '60')
      
      expect(onUpdateMaterials).toHaveBeenCalled()
    })

    it('updates pomodoro count (calculates minutes)', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: 'pomodoro', pomodoroCount: 2 })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const pomodoroInput = screen.getByPlaceholderText('Count')
      // Set value directly using fireEvent for more control
      fireEvent.change(pomodoroInput, { target: { value: '4' } })
      
      expect(onUpdateMaterials).toHaveBeenCalled()
      // Find call with pomodoroCount = 4
      const callWithValue4 = onUpdateMaterials.mock.calls.find(call => {
        const material = call[1][0]
        const pomodoroCount = typeof material.pomodoroCount === 'string' 
          ? parseInt(material.pomodoroCount) 
          : material.pomodoroCount
        return pomodoroCount === 4
      })
      
      expect(callWithValue4).toBeDefined()
      const updatedMaterial = callWithValue4[1][0]
      // Should calculate estimatedMinutes as pomodoroCount * 25
      expect(updatedMaterial.estimatedMinutes).toBe(100) // 4 * 25
    })

    it('removes material', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(2)
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const removeButtons = screen.getAllByText('×')
      // First × is for removing the subject, subsequent ones are for materials
      const removeMaterialButton = removeButtons[1]
      await user.click(removeMaterialButton)
      
      expect(onUpdateMaterials).toHaveBeenCalled()
      const callArgs = onUpdateMaterials.mock.calls[0]
      expect(callArgs[1].length).toBe(1) // One material removed
    })

    it('toggles collapse', async () => {
      const user = userEvent.setup()
      const onToggleCollapse = vi.fn()
      render(<MaterialsCard {...defaultProps} onToggleCollapse={onToggleCollapse} />)
      
      const header = screen.getByText('Math').closest('div[class*="cursor-pointer"]')
      await user.click(header)
      
      expect(onToggleCollapse).toHaveBeenCalledWith(defaultProps.subject.id)
    })
  })

  describe('edge cases', () => {
    it('handles empty materials array', () => {
      const subject = createMockSubject({ materials: [] })
      render(<MaterialsCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText('No materials added yet. Add topics you need to study.')).toBeInTheDocument()
    })

    it('handles string format materials (backward compatibility)', () => {
      const subject = createMockSubject({
        materials: ['Topic 1', 'Topic 2']
      })
      render(<MaterialsCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByDisplayValue('Topic 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Topic 2')).toBeInTheDocument()
    })

    it('handles object format materials', () => {
      const subject = createMockSubject({
        materials: createMockMaterials(2)
      })
      render(<MaterialsCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByDisplayValue('Topic 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Topic 2')).toBeInTheDocument()
    })

    it('displays pomodoro conversion message', () => {
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: 'pomodoro', pomodoroCount: 2 })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} isCollapsed={false} />)
      expect(screen.getByText(/50 minutes \(1 pomodoro = 25 min\)/)).toBeInTheDocument()
    })

    it('handles switching from minutes to pomodoro', async () => {
      const user = userEvent.setup()
      const onUpdateMaterials = vi.fn()
      const subject = createMockSubject({
        materials: createMockMaterials(1, { timeType: 'minutes', estimatedMinutes: 60 })
      })
      render(<MaterialsCard {...defaultProps} subject={subject} onUpdateMaterials={onUpdateMaterials} isCollapsed={false} />)
      
      const selects = screen.getAllByRole('combobox')
      const timeTypeSelect = selects[0]
      await user.selectOptions(timeTypeSelect, 'pomodoro')
      
      expect(onUpdateMaterials).toHaveBeenCalled()
      const callArgs = onUpdateMaterials.mock.calls[0]
      const updatedMaterial = callArgs[1][0]
      expect(updatedMaterial.timeType).toBe('pomodoro')
      expect(updatedMaterial.estimatedMinutes).toBe('') // Cleared when switching
    })
  })
})
