import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  validateSubjectName,
  validateExamDates,
  validatePriority,
  validateFormSubmission
} from './formValidation'

describe('validateSubjectName', () => {
  it('returns null for valid name', () => {
    const existingSubjects = [{ name: 'Math' }, { name: 'Science' }]
    expect(validateSubjectName('English', existingSubjects)).toBeNull()
  })

  it('returns error for empty name', () => {
    const existingSubjects = []
    expect(validateSubjectName('', existingSubjects)).toBe('Subject name is required')
  })

  it('returns error for whitespace-only name', () => {
    const existingSubjects = []
    expect(validateSubjectName('   ', existingSubjects)).toBe('Subject name is required')
  })

  it('returns error for duplicate name (case-insensitive)', () => {
    const existingSubjects = [{ name: 'Math' }, { name: 'Science' }]
    expect(validateSubjectName('math', existingSubjects)).toBe('This subject already exists')
    expect(validateSubjectName('MATH', existingSubjects)).toBe('This subject already exists')
    expect(validateSubjectName('Math', existingSubjects)).toBe('This subject already exists')
  })

  it('handles empty existingSubjects array', () => {
    expect(validateSubjectName('Math', [])).toBeNull()
  })

  it('trims whitespace before checking duplicates', () => {
    const existingSubjects = [{ name: 'Math' }]
    expect(validateSubjectName('  Math  ', existingSubjects)).toBe('This subject already exists')
  })
})

describe('validateExamDates', () => {
  beforeEach(() => {
    // Mock Date to ensure consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null for valid future dates', () => {
    const futureDate = '2024-02-15'
    expect(validateExamDates([futureDate])).toBeNull()
  })

  it('returns error for empty array', () => {
    expect(validateExamDates([])).toBe('At least one exam date is required for this subject')
  })

  it('returns error for all empty strings', () => {
    expect(validateExamDates(['', '   ', ''])).toBe('At least one exam date is required for this subject')
  })

  it('returns error for past dates', () => {
    const pastDate = '2024-01-10'
    expect(validateExamDates([pastDate])).toBe('All exam dates must be in the future')
  })

  it('returns error for today\'s date', () => {
    const today = '2024-01-15'
    expect(validateExamDates([today])).toBe('All exam dates must be in the future')
  })

  it('handles multiple dates (all must be future)', () => {
    const dates = ['2024-02-15', '2024-03-20']
    expect(validateExamDates(dates)).toBeNull()
  })

  it('returns error if any date is in the past', () => {
    const dates = ['2024-02-15', '2024-01-10']
    expect(validateExamDates(dates)).toBe('All exam dates must be in the future')
  })

  it('filters out empty strings before validation', () => {
    const dates = ['', '2024-02-15', '   ']
    expect(validateExamDates(dates)).toBeNull()
  })
})

describe('validatePriority', () => {
  it('returns null for valid priority', () => {
    const usedPriorities = new Set([1, 3])
    expect(validatePriority(2, 5, usedPriorities)).toBeNull()
  })

  it('returns error for NaN', () => {
    const usedPriorities = new Set()
    expect(validatePriority('abc', 5, usedPriorities)).toBe('Invalid priority selected')
    expect(validatePriority(NaN, 5, usedPriorities)).toBe('Invalid priority selected')
  })

  it('returns error for out of range (< 1)', () => {
    const usedPriorities = new Set()
    expect(validatePriority(0, 5, usedPriorities)).toBe('Priority must be between 1 and 5')
    expect(validatePriority(-1, 5, usedPriorities)).toBe('Priority must be between 1 and 5')
  })

  it('returns error for out of range (> numberOfSubjects)', () => {
    const usedPriorities = new Set()
    expect(validatePriority(6, 5, usedPriorities)).toBe('Priority must be between 1 and 5')
    expect(validatePriority(10, 5, usedPriorities)).toBe('Priority must be between 1 and 5')
  })

  it('returns error for already used priority', () => {
    const usedPriorities = new Set([1, 2, 3])
    expect(validatePriority(2, 5, usedPriorities)).toBe('This priority is already assigned to another subject')
  })

  it('handles empty usedPriorities Set', () => {
    const usedPriorities = new Set()
    expect(validatePriority(1, 5, usedPriorities)).toBeNull()
  })

  it('accepts string priority and converts to number', () => {
    const usedPriorities = new Set()
    expect(validatePriority('3', 5, usedPriorities)).toBeNull()
  })

  it('handles boundary values correctly', () => {
    const usedPriorities = new Set()
    expect(validatePriority(1, 5, usedPriorities)).toBeNull()
    expect(validatePriority(5, 5, usedPriorities)).toBeNull()
  })
})

describe('validateFormSubmission', () => {
  it('returns empty object for valid form', () => {
    // Use dates that are definitely in the future
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const formData = {
      numberOfSubjects: '2',
      subjects: [
        { name: 'Math', examDates: [tomorrow.toISOString().split('T')[0]] },
        { name: 'Science', examDates: [nextWeek.toISOString().split('T')[0]] }
      ],
      dailyHours: '2.5'
    }
    expect(validateFormSubmission(formData)).toEqual({})
  })

  it('returns error for missing numberOfSubjects', () => {
    const formData = {
      subjects: [{ name: 'Math', examDates: ['2024-02-15'] }],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.numberOfSubjects).toBe('Please specify number of subjects')
  })

  it('returns error for zero numberOfSubjects', () => {
    const formData = {
      numberOfSubjects: '0',
      subjects: [{ name: 'Math', examDates: ['2024-02-15'] }],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.numberOfSubjects).toBe('Please specify number of subjects')
  })

  it('returns error for no subjects', () => {
    const formData = {
      numberOfSubjects: '3',
      subjects: [],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.subjects).toBe('Please add at least one subject')
  })

  it('returns error for incomplete subjects count', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const formData = {
      numberOfSubjects: '3',
      subjects: [
        { name: 'Math', examDates: [tomorrow.toISOString().split('T')[0]] },
        { name: 'Science', examDates: [nextWeek.toISOString().split('T')[0]] }
      ],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.subjects).toBe('Please add all 3 subject(s)')
  })

  it('returns error for subjects without exam dates', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const formData = {
      numberOfSubjects: '2',
      subjects: [
        { name: 'Math', examDates: [tomorrow.toISOString().split('T')[0]] },
        { name: 'Science', examDates: [] }
      ],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.subjects).toBe('All subjects must have at least one exam date')
  })

  it('returns error for invalid dailyHours', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const formData = {
      numberOfSubjects: '2',
      subjects: [
        { name: 'Math', examDates: [tomorrow.toISOString().split('T')[0]] },
        { name: 'Science', examDates: [nextWeek.toISOString().split('T')[0]] }
      ],
      dailyHours: '0'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.dailyHours).toBe('Daily study hours must be greater than 0')
  })

  it('returns error for missing dailyHours', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const formData = {
      numberOfSubjects: '2',
      subjects: [
        { name: 'Math', examDates: [tomorrow.toISOString().split('T')[0]] },
        { name: 'Science', examDates: [nextWeek.toISOString().split('T')[0]] }
      ],
      dailyHours: ''
    }
    const errors = validateFormSubmission(formData)
    expect(errors.dailyHours).toBe('Daily study hours must be greater than 0')
  })

  it('returns multiple errors simultaneously', () => {
    const formData = {
      numberOfSubjects: '0',
      subjects: [],
      dailyHours: ''
    }
    const errors = validateFormSubmission(formData)
    expect(errors.numberOfSubjects).toBeDefined()
    expect(errors.subjects).toBeDefined()
    expect(errors.dailyHours).toBeDefined()
  })

  it('handles null subjects array', () => {
    const formData = {
      numberOfSubjects: '2',
      subjects: null,
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.subjects).toBe('Please add at least one subject')
  })

  it('handles subjects with null examDates', () => {
    const formData = {
      numberOfSubjects: '1',
      subjects: [
        { name: 'Math', examDates: null }
      ],
      dailyHours: '2.5'
    }
    const errors = validateFormSubmission(formData)
    expect(errors.subjects).toBe('All subjects must have at least one exam date')
  })
})
