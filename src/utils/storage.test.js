import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getProfile,
  saveProfile,
  getFormData,
  saveFormData,
  getStudyPlan,
  saveStudyPlan,
  getProgress,
  saveProgress,
  clearProgress
} from './storage'

describe('storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  describe('getProfile / saveProfile', () => {
    it('returns null for missing profile', () => {
      expect(getProfile()).toBeNull()
    })

    it('saves and retrieves profile correctly', () => {
      const profile = { name: 'Test User' }
      saveProfile(profile)
      expect(getProfile()).toEqual(profile)
    })

    it('overwrites existing profile', () => {
      saveProfile({ name: 'User 1' })
      saveProfile({ name: 'User 2' })
      expect(getProfile()).toEqual({ name: 'User 2' })
    })
  })

  describe('getFormData / saveFormData', () => {
    it('returns null for missing form data', () => {
      expect(getFormData()).toBeNull()
    })

    it('saves and retrieves form data correctly', () => {
      const formData = {
        numberOfSubjects: '3',
        subjects: [{ name: 'Math', priority: 1, examDates: ['2024-02-15'] }],
        dailyHours: '2.5'
      }
      saveFormData(formData)
      expect(getFormData()).toEqual(formData)
    })

    it('handles complex nested objects', () => {
      const formData = {
        numberOfSubjects: '2',
        subjects: [
          {
            name: 'Math',
            priority: 1,
            examDates: ['2024-02-15', '2024-03-20'],
            materials: [{ name: 'Algebra', timeType: 'minutes', estimatedMinutes: 60 }]
          }
        ],
        dailyHours: '3'
      }
      saveFormData(formData)
      const retrieved = getFormData()
      expect(retrieved.subjects[0].materials[0].name).toBe('Algebra')
    })
  })

  describe('getStudyPlan / saveStudyPlan', () => {
    it('returns null for missing study plan', () => {
      expect(getStudyPlan()).toBeNull()
    })

    it('saves and retrieves study plan correctly', () => {
      const plan = {
        daysUntilExam: 30,
        totalHours: 60,
        earliestExamDate: '2024-02-15',
        subjects: [{ name: 'Math', priority: 1, hours: 20 }],
        dailySchedule: [],
        summary: { totalDays: 30, totalHours: 60, hoursPerDay: 2, subjectsCount: 1 }
      }
      saveStudyPlan(plan)
      expect(getStudyPlan()).toEqual(plan)
    })

    it('handles large study plan objects', () => {
      const plan = {
        daysUntilExam: 100,
        totalHours: 200,
        subjects: Array.from({ length: 10 }, (_, i) => ({
          name: `Subject ${i + 1}`,
          priority: i + 1,
          hours: 20
        })),
        dailySchedule: Array.from({ length: 100 }, (_, i) => ({
          day: i + 1,
          date: `2024-${String(i + 1).padStart(2, '0')}-15`,
          subjects: [],
          totalMinutes: 120
        })),
        summary: { totalDays: 100, totalHours: 200, hoursPerDay: 2, subjectsCount: 10 }
      }
      saveStudyPlan(plan)
      const retrieved = getStudyPlan()
      expect(retrieved.dailySchedule.length).toBe(100)
      expect(retrieved.subjects.length).toBe(10)
    })
  })

  describe('getProgress / saveProgress', () => {
    it('returns null for missing progress', () => {
      expect(getProgress()).toBeNull()
    })

    it('saves and retrieves progress correctly', () => {
      const progress = {
        completedDays: [1, 3, 5],
        completedTopics: ['1-Math-0', '1-Math-1'],
        completedPomodoros: ['1-Math-0-1', '1-Math-0-2']
      }
      saveProgress(progress)
      expect(getProgress()).toEqual(progress)
    })

    it('handles empty progress arrays', () => {
      const progress = {
        completedDays: [],
        completedTopics: [],
        completedPomodoros: []
      }
      saveProgress(progress)
      expect(getProgress()).toEqual(progress)
    })
  })

  describe('clearProgress', () => {
    it('removes progress from localStorage', () => {
      saveProgress({
        completedDays: [1, 2],
        completedTopics: ['1-Math-0'],
        completedPomodoros: []
      })
      clearProgress()
      expect(getProgress()).toBeNull()
    })

    it('does not affect other storage keys', () => {
      saveProfile({ name: 'Test' })
      saveFormData({ numberOfSubjects: '2', subjects: [], dailyHours: '2' })
      saveProgress({ completedDays: [1], completedTopics: [], completedPomodoros: [] })
      
      clearProgress()
      
      expect(getProfile()).toEqual({ name: 'Test' })
      expect(getFormData()).toEqual({ numberOfSubjects: '2', subjects: [], dailyHours: '2' })
      expect(getProgress()).toBeNull()
    })
  })

  describe('error handling', () => {
    it('handles corrupt JSON gracefully', () => {
      // Manually set invalid JSON
      localStorage.setItem('sp_profile', '{ invalid json }')
      expect(getProfile()).toBeNull()
    })

    it('handles null values correctly', () => {
      localStorage.setItem('sp_profile', 'null')
      expect(getProfile()).toBeNull()
    })

    it('handles empty string values', () => {
      localStorage.setItem('sp_profile', '')
      expect(getProfile()).toBeNull()
    })

    it('handles non-existent keys', () => {
      expect(getProfile()).toBeNull()
      expect(getFormData()).toBeNull()
      expect(getStudyPlan()).toBeNull()
      expect(getProgress()).toBeNull()
    })
  })

  describe('roundtrip tests', () => {
    it('preserves data integrity through save/load cycle', () => {
      const originalData = {
        numberOfSubjects: '5',
        subjects: [
          {
            id: 123,
            name: 'Advanced Math',
            priority: 1,
            examDates: ['2024-06-15', '2024-07-20'],
            materials: [
              { name: 'Calculus', timeType: 'pomodoro', pomodoroCount: 4, estimatedMinutes: 100 },
              { name: 'Algebra', timeType: 'minutes', estimatedMinutes: 90 }
            ]
          }
        ],
        dailyHours: '4.5'
      }
      
      saveFormData(originalData)
      const retrieved = getFormData()
      
      expect(retrieved).toEqual(originalData)
      expect(retrieved.subjects[0].materials[0].pomodoroCount).toBe(4)
      expect(retrieved.subjects[0].examDates.length).toBe(2)
    })

    it('handles special characters in strings', () => {
      const profile = { name: "O'Brien & Co." }
      saveProfile(profile)
      expect(getProfile()).toEqual(profile)
    })

    it('handles unicode characters', () => {
      const profile = { name: 'José María' }
      saveProfile(profile)
      expect(getProfile()).toEqual(profile)
    })
  })
})
