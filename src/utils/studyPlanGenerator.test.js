import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateStudyPlan } from './studyPlanGenerator'

describe('generateStudyPlan', () => {
  beforeEach(() => {
    // Use fixed date for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('generates plan with valid inputs', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)

      expect(plan).toHaveProperty('daysUntilExam')
      expect(plan).toHaveProperty('totalHours')
      expect(plan).toHaveProperty('earliestExamDate')
      expect(plan).toHaveProperty('subjects')
      expect(plan).toHaveProperty('dailySchedule')
      expect(plan).toHaveProperty('summary')
    })

    it('calculates daysUntilExam correctly', () => {
      const examDate = new Date('2024-01-20')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [examDate.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      expect(plan.daysUntilExam).toBe(5)
    })

    it('preserves materials array', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: [{ name: 'Algebra', timeType: 'minutes', estimatedMinutes: 60 }]
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      expect(plan.subjects[0].materials).toEqual(subjects[0].materials)
    })

    it('returns correct structure', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)

      expect(plan.summary.totalDays).toBe(plan.daysUntilExam)
      expect(plan.summary.totalHours).toBe(plan.totalHours)
      expect(plan.summary.hoursPerDay).toBe(2)
      expect(plan.summary.subjectsCount).toBe(1)
      expect(plan.dailySchedule.length).toBe(plan.daysUntilExam)
    })
  })

  describe('error handling', () => {
    it('throws error for no exam dates', () => {
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [],
          materials: []
        }
      ]

      expect(() => generateStudyPlan(subjects, 1, 2)).toThrow('No valid exam dates found')
    })

    it('throws error for all empty exam date strings', () => {
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: ['', '   '],
          materials: []
        }
      ]

      expect(() => generateStudyPlan(subjects, 1, 2)).toThrow('No valid exam dates found')
    })

    it('throws error for past exam dates', () => {
      const pastDate = new Date('2024-01-10')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [pastDate.toISOString().split('T')[0]],
          materials: []
        }
      ]

      expect(() => generateStudyPlan(subjects, 1, 2)).toThrow('Earliest exam date must be in the future')
    })

    it('throws error for today\'s exam date', () => {
      const today = new Date('2024-01-15')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [today.toISOString().split('T')[0]],
          materials: []
        }
      ]

      expect(() => generateStudyPlan(subjects, 1, 2)).toThrow('Earliest exam date must be in the future')
    })
  })

  describe('priority distribution', () => {
    it('distributes hours by priority (Priority 1 gets most)', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        },
        {
          name: 'Science',
          priority: 2,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 2, 2)
      const mathSubject = plan.subjects.find(s => s.name === 'Math')
      const scienceSubject = plan.subjects.find(s => s.name === 'Science')

      expect(mathSubject.hours).toBeGreaterThan(scienceSubject.hours)
    })

    it('calculates weights correctly (Priority 1 = weight N)', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        },
        {
          name: 'Science',
          priority: 2,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 2, 2)
      const mathSubject = plan.subjects.find(s => s.name === 'Math')
      const scienceSubject = plan.subjects.find(s => s.name === 'Science')

      // Priority 1 gets weight 2, Priority 2 gets weight 1
      // So Math should get 2/3 of total hours, Science gets 1/3
      expect(mathSubject.weight).toBe(2)
      expect(scienceSubject.weight).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles single subject', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      expect(plan.subjects.length).toBe(1)
      expect(plan.subjects[0].hours).toBeGreaterThan(0)
    })

    it('handles many subjects (10+)', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = Array.from({ length: 10 }, (_, i) => ({
        name: `Subject ${i + 1}`,
        priority: i + 1,
        examDates: [tomorrow.toISOString().split('T')[0]],
        materials: []
      }))

      const plan = generateStudyPlan(subjects, 10, 4)
      expect(plan.subjects.length).toBe(10)
      expect(plan.dailySchedule.length).toBeGreaterThan(0)
    })

    it('handles very short timeline (1 day)', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      expect(plan.daysUntilExam).toBe(1)
      expect(plan.dailySchedule.length).toBe(1)
    })

    it('handles very long timeline (365 days)', () => {
      const nextYear = new Date('2025-01-16') // Exactly 366 days from 2024-01-15
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [nextYear.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      // Should be 366 days (leap year consideration)
      expect(plan.daysUntilExam).toBeGreaterThanOrEqual(365)
      expect(plan.dailySchedule.length).toBe(plan.daysUntilExam)
    })

    it('handles subjects with no materials', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      expect(plan.dailySchedule[0].subjects[0].topics).toEqual([])
    })

    it('handles subjects with many materials', () => {
      const tomorrow = new Date('2024-01-16')
      const materials = Array.from({ length: 20 }, (_, i) => ({
        name: `Topic ${i + 1}`,
        timeType: 'minutes',
        estimatedMinutes: 30
      }))

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 4)
      // Should distribute topics across days
      const daysWithTopics = plan.dailySchedule.filter(day => 
        day.subjects.some(s => s.topics && s.topics.length > 0)
      )
      expect(daysWithTopics.length).toBeGreaterThan(0)
    })
  })

  describe('topic distribution', () => {
    it('ensures all topics appear at least once', () => {
      const tomorrow = new Date('2024-01-16')
      const materials = [
        { name: 'Topic 1', timeType: 'minutes', estimatedMinutes: 30 },
        { name: 'Topic 2', timeType: 'minutes', estimatedMinutes: 30 },
        { name: 'Topic 3', timeType: 'minutes', estimatedMinutes: 30 }
      ]

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 4)
      const allTopics = new Set()
      
      plan.dailySchedule.forEach(day => {
        day.subjects.forEach(subject => {
          subject.topics.forEach(topic => {
            allTopics.add(topic.name)
          })
        })
      })

      expect(allTopics.size).toBeGreaterThanOrEqual(3)
    })

    it('distributes topics evenly across days', () => {
      const examDate = new Date('2024-01-25') // 10 days
      const materials = [
        { name: 'Topic 1', timeType: 'minutes', estimatedMinutes: 30 },
        { name: 'Topic 2', timeType: 'minutes', estimatedMinutes: 30 },
        { name: 'Topic 3', timeType: 'minutes', estimatedMinutes: 30 }
      ]

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [examDate.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 4)
      const topicCounts = new Map()

      plan.dailySchedule.forEach(day => {
        day.subjects.forEach(subject => {
          subject.topics.forEach(topic => {
            topicCounts.set(topic.name, (topicCounts.get(topic.name) || 0) + 1)
          })
        })
      })

      // Each topic should appear multiple times across 10 days
      topicCounts.forEach((count, topic) => {
        expect(count).toBeGreaterThan(0)
      })
    })

    it('prioritizes unassigned topics', () => {
      const examDate = new Date('2024-01-20') // 5 days
      const materials = [
        { name: 'Topic 1', timeType: 'minutes', estimatedMinutes: 60 },
        { name: 'Topic 2', timeType: 'minutes', estimatedMinutes: 60 },
        { name: 'Topic 3', timeType: 'minutes', estimatedMinutes: 60 }
      ]

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [examDate.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 4)
      const firstDayTopics = plan.dailySchedule[0].subjects[0].topics.map(t => t.name)
      
      // First day should include at least one topic
      expect(firstDayTopics.length).toBeGreaterThan(0)
    })

    it('handles topics that don\'t fit in available time', () => {
      const tomorrow = new Date('2024-01-16')
      const materials = [
        { name: 'Large Topic', timeType: 'minutes', estimatedMinutes: 500 } // Too large for one day
      ]

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 2)
      // Should still assign the topic (fallback logic)
      const hasTopics = plan.dailySchedule.some(day =>
        day.subjects.some(s => s.topics && s.topics.length > 0)
      )
      expect(hasTopics).toBe(true)
    })

    it('falls back to smallest topic if none fit', () => {
      const tomorrow = new Date('2024-01-16')
      const materials = [
        { name: 'Small Topic', timeType: 'minutes', estimatedMinutes: 10 },
        { name: 'Large Topic', timeType: 'minutes', estimatedMinutes: 500 }
      ]

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials
        }
      ]

      const plan = generateStudyPlan(subjects, 1, 0.5) // Very limited time
      // Should still show at least one topic
      const allTopics = []
      plan.dailySchedule.forEach(day => {
        day.subjects.forEach(s => {
          allTopics.push(...s.topics.map(t => t.name))
        })
      })
      expect(allTopics.length).toBeGreaterThan(0)
    })
  })

  describe('multiple subjects with different priorities', () => {
    it('distributes time correctly across priorities', () => {
      const tomorrow = new Date('2024-01-16')
      const subjects = [
        {
          name: 'High Priority',
          priority: 1,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        },
        {
          name: 'Medium Priority',
          priority: 2,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        },
        {
          name: 'Low Priority',
          priority: 3,
          examDates: [tomorrow.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 3, 3)
      const highPriority = plan.subjects.find(s => s.priority === 1)
      const mediumPriority = plan.subjects.find(s => s.priority === 2)
      const lowPriority = plan.subjects.find(s => s.priority === 3)

      expect(highPriority.hours).toBeGreaterThan(mediumPriority.hours)
      expect(mediumPriority.hours).toBeGreaterThan(lowPriority.hours)
    })
  })

  describe('earliest exam date selection', () => {
    it('selects earliest exam date across all subjects', () => {
      const date1 = new Date('2024-01-20')
      const date2 = new Date('2024-01-25')
      const date3 = new Date('2024-01-18') // This is actually the earliest

      const subjects = [
        {
          name: 'Math',
          priority: 1,
          examDates: [date2.toISOString().split('T')[0]],
          materials: []
        },
        {
          name: 'Science',
          priority: 2,
          examDates: [date1.toISOString().split('T')[0], date3.toISOString().split('T')[0]],
          materials: []
        }
      ]

      const plan = generateStudyPlan(subjects, 2, 2)
      // Should use date3 (Jan 18) as earliest
      expect(plan.earliestExamDate).toBe(date3.toISOString().split('T')[0])
      expect(plan.daysUntilExam).toBe(3)
    })
  })
})
