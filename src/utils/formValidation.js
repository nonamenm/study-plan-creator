/**
 * Validation utilities for study plan form
 */

/**
 * Validates subject name
 * @param {string} name - Subject name to validate
 * @param {Array} existingSubjects - Array of existing subject objects
 * @returns {string|null} Error message or null if valid
 */
export function validateSubjectName(name, existingSubjects) {
  if (!name || !name.trim()) {
    return 'Subject name is required'
  }

  if (existingSubjects.some(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
    return 'This subject already exists'
  }

  return null
}

/**
 * Validates exam dates
 * @param {Array<string>} dates - Array of date strings
 * @returns {string|null} Error message or null if valid
 */
export function validateExamDates(dates) {
  const validExamDates = dates.filter(date => date && date.trim() !== '')
  
  if (validExamDates.length === 0) {
    return 'At least one exam date is required for this subject'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (const examDate of validExamDates) {
    const selectedDate = new Date(examDate)
    if (selectedDate <= today) {
      return 'All exam dates must be in the future'
    }
  }

  return null
}

/**
 * Validates priority
 * @param {number|string} priority - Priority value to validate
 * @param {number} numberOfSubjects - Total number of subjects
 * @param {Set<number>} usedPriorities - Set of already used priorities
 * @returns {string|null} Error message or null if valid
 */
export function validatePriority(priority, numberOfSubjects, usedPriorities) {
  const priorityNum = parseInt(priority)
  
  if (isNaN(priorityNum)) {
    return 'Invalid priority selected'
  }

  const priorityInRange = priorityNum >= 1 && priorityNum <= numberOfSubjects
  if (!priorityInRange) {
    return `Priority must be between 1 and ${numberOfSubjects}`
  }

  if (usedPriorities.has(priorityNum)) {
    return 'This priority is already assigned to another subject'
  }

  return null
}

/**
 * Validates complete form submission
 * @param {Object} formData - Form data object
 * @param {string} formData.numberOfSubjects - Number of subjects
 * @param {Array} formData.subjects - Array of subject objects
 * @param {string} formData.dailyHours - Daily study hours
 * @returns {Object} Object with error keys and messages, empty if valid
 */
export function validateFormSubmission(formData) {
  const errors = {}
  const { numberOfSubjects, subjects, dailyHours } = formData

  if (!numberOfSubjects || parseInt(numberOfSubjects) <= 0) {
    errors.numberOfSubjects = 'Please specify number of subjects'
  }

  if (!subjects || subjects.length === 0) {
    errors.subjects = 'Please add at least one subject'
  } else if (numberOfSubjects && subjects.length < parseInt(numberOfSubjects)) {
    errors.subjects = `Please add all ${numberOfSubjects} subject(s)`
  }

  // Validate all subjects have exam dates
  if (subjects && subjects.length > 0) {
    const subjectsWithoutDates = subjects.filter(s => !s.examDates || s.examDates.length === 0)
    if (subjectsWithoutDates.length > 0) {
      errors.subjects = 'All subjects must have at least one exam date'
    }
  }

  if (!dailyHours || parseFloat(dailyHours) <= 0) {
    errors.dailyHours = 'Daily study hours must be greater than 0'
  }

  return errors
}
