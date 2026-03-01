/**
 * Test utilities and helpers for study plan creator tests
 */

/**
 * Creates mock subject data for testing
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock subject object
 */
export function createMockSubject(overrides = {}) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return {
    id: Date.now(),
    name: 'Test Subject',
    priority: 1,
    examDates: [tomorrow.toISOString().split('T')[0]],
    materials: [],
    ...overrides
  }
}

/**
 * Creates multiple mock subjects
 * @param {number} count - Number of subjects to create
 * @param {Object} options - Options for subject creation
 * @returns {Array} Array of mock subjects
 */
export function createMockSubjects(count, options = {}) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Subject ${i + 1}`,
    priority: i + 1,
    examDates: [tomorrow.toISOString().split('T')[0]],
    materials: [],
    ...options
  }))
}

/**
 * Creates a mock study plan
 * @param {Object} overrides - Override default values
 * @returns {Object} Mock study plan object
 */
export function createMockPlan(overrides = {}) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const defaultPlan = {
    daysUntilExam: 30,
    totalHours: 60,
    earliestExamDate: tomorrow.toISOString().split('T')[0],
    subjects: [
      {
        name: 'Math',
        priority: 1,
        hours: 20,
        minutesPerDay: 40,
        examDates: [tomorrow.toISOString().split('T')[0]],
        materials: []
      }
    ],
    dailySchedule: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subjects: [],
      totalMinutes: 120
    })),
    summary: {
      totalDays: 30,
      totalHours: 60,
      hoursPerDay: 2,
      subjectsCount: 1
    }
  }
  
  return { ...defaultPlan, ...overrides }
}

/**
 * Renders a component with localStorage mock setup
 * @param {Function} renderFn - React Testing Library render function
 * @param {React.Component} component - Component to render
 * @param {Object} storageData - Initial localStorage data
 * @returns {Object} Render result with storage utilities
 */
export function renderWithStorage(renderFn, component, storageData = {}) {
  // Clear localStorage
  localStorage.clear()
  
  // Set up initial storage data
  Object.entries(storageData).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value))
  })
  
  const result = renderFn(component)
  
  return {
    ...result,
    getStorageItem: (key) => {
      try {
        const item = localStorage.getItem(key)
        return item ? JSON.parse(item) : null
      } catch {
        return null
      }
    },
    setStorageItem: (key, value) => {
      localStorage.setItem(key, JSON.stringify(value))
    },
    clearStorage: () => {
      localStorage.clear()
    }
  }
}

/**
 * Waits for localStorage to be updated
 * Useful for testing async persistence
 * @param {string} key - localStorage key to wait for
 * @param {number} timeout - Maximum wait time in ms
 * @returns {Promise} Resolves when key is updated
 */
export function waitForStorageUpdate(key, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const checkInterval = 10
    
    const check = () => {
      if (localStorage.getItem(key) !== null) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for storage key: ${key}`))
      } else {
        setTimeout(check, checkInterval)
      }
    }
    
    check()
  })
}

/**
 * Creates mock materials/topics
 * @param {number} count - Number of materials to create
 * @param {Object} options - Options for material creation
 * @returns {Array} Array of mock materials
 */
export function createMockMaterials(count, options = {}) {
  return Array.from({ length: count }, (_, i) => {
    if (options.format === 'string') {
      return `Topic ${i + 1}`
    }
    
    return {
      name: `Topic ${i + 1}`,
      timeType: options.timeType || 'minutes',
      estimatedMinutes: options.estimatedMinutes || 30,
      pomodoroCount: options.pomodoroCount || null,
      ...options
    }
  })
}
