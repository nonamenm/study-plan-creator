/**
 * Generates a study plan based on subjects, priorities, exam dates, and available time
 * 
 * @param {Array} subjects - Array of subject objects with {name, priority, examDates}
 * @param {number} numberOfSubjects - Total number of subjects
 * @param {number} dailyHours - Hours available per day for studying
 * @returns {Object} Study plan with daily schedule and subject allocations
 */
export function generateStudyPlan(subjects, numberOfSubjects, dailyHours) {
  // 1. Find the earliest exam date across all subjects
  const allExamDates = subjects.flatMap(s => s.examDates || [])
    .filter(date => date && date.trim() !== '')
    .map(date => new Date(date))
    .sort((a, b) => a - b)
  
  if (allExamDates.length === 0) {
    throw new Error('No valid exam dates found')
  }
  
  const earliestExamDate = allExamDates[0]
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate days until first exam
  const daysUntilExam = Math.ceil((earliestExamDate - today) / (1000 * 60 * 60 * 24))
  
  if (daysUntilExam <= 0) {
    throw new Error('Earliest exam date must be in the future')
  }
  
  // 2. Calculate total hours available
  const totalHours = daysUntilExam * dailyHours
  const N = numberOfSubjects
  
  // 3. Assign weights based on priority (inverse priority system)
  // Priority 1 gets weight N, Priority 2 gets weight (N-1), etc.
  let totalWeight = 0
  const subjectsWithWeights = subjects.map(subject => {
    const weight = N - subject.priority + 1
    totalWeight += weight
    // Ensure materials are preserved
    return {
      ...subject,
      materials: subject.materials || [], // Explicitly preserve materials
      weight,
      hours: 0, // Will calculate next
      minutesPerDay: 0 // Will calculate next
    }
  })
  
  // 4. Distribute hours proportionally
  subjectsWithWeights.forEach(subject => {
    subject.hours = (subject.weight / totalWeight) * totalHours
    subject.minutesPerDay = (subject.hours / daysUntilExam) * 60
  })
  
  // 5. Create daily schedule
  const dailySchedule = createDailySchedule(subjectsWithWeights, daysUntilExam, dailyHours)
  
  return {
    daysUntilExam,
    totalHours,
    earliestExamDate: earliestExamDate.toISOString().split('T')[0],
    subjects: subjectsWithWeights,
    dailySchedule,
    summary: {
      totalDays: daysUntilExam,
      totalHours,
      hoursPerDay: dailyHours,
      subjectsCount: subjects.length
    }
  }
}

/**
 * Creates a day-by-day schedule distributing subjects across available days
 * 
 * @param {Array} subjects - Subjects with calculated hours and weights
 * @param {number} daysUntilExam - Total days available
 * @param {number} dailyHours - Hours per day
 * @returns {Array} Array of daily schedule objects
 */
function createDailySchedule(subjects, daysUntilExam, dailyHours) {
  const dailyMinutes = dailyHours * 60
  const schedule = []
  
  // Clear topic assignment tracker for new schedule
  topicAssignmentTracker.clear()
  
  // Sort subjects by priority (highest priority first)
  const sortedSubjects = [...subjects].sort((a, b) => a.priority - b.priority)
  
  // Calculate total weight for distribution
  const totalWeight = sortedSubjects.reduce((sum, s) => sum + s.weight, 0)
  
  // Track how many minutes each subject has been allocated so far
  const allocatedMinutes = sortedSubjects.reduce((acc, s) => {
    acc[s.name] = 0
    return acc
  }, {})
  
  // Create schedule for each day
  for (let day = 1; day <= daysUntilExam; day++) {
    const daySchedule = {
      day,
      date: new Date(Date.now() + (day - 1) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0],
      subjects: [],
      totalMinutes: 0
    }
    
    let remainingMinutes = dailyMinutes
    
    // Distribute time based on priority weights
    // Higher priority subjects get more time per day
    for (const subject of sortedSubjects) {
      if (remainingMinutes <= 0) break
      
      // Calculate target minutes for this subject today based on its weight
      const targetMinutesToday = Math.round((subject.weight / totalWeight) * dailyMinutes)
      
      // Check how much this subject still needs
      const remainingForSubject = subject.minutesPerDay * daysUntilExam - allocatedMinutes[subject.name]
      const minutesToAllocate = Math.min(
        targetMinutesToday,
        remainingMinutes,
        Math.max(0, remainingForSubject) // Don't allocate more than needed
      )
      
      // Minimum 15 minutes if subject is included (to make it meaningful)
      if (minutesToAllocate >= 15 || (minutesToAllocate > 0 && remainingForSubject > 0)) {
        const finalMinutes = Math.max(15, minutesToAllocate)
        
        // Distribute topics for this subject on this day based on available time
        let topics = []
        try {
          topics = distributeTopicsForDay(subject, day, daysUntilExam, finalMinutes) || []
        } catch (error) {
          console.error(`Error distributing topics for ${subject.name} on day ${day}:`, error)
          // Fallback: if distribution fails, try to get at least one topic
          const materials = subject.materials || []
          if (materials.length > 0) {
            const firstMaterial = materials[0]
            topics = [{
              name: typeof firstMaterial === 'string' ? firstMaterial : (firstMaterial.name || ''),
              estimatedMinutes: null
            }]
          }
        }
        
        daySchedule.subjects.push({
          name: subject.name,
          priority: subject.priority,
          minutes: finalMinutes,
          hours: (finalMinutes / 60).toFixed(1),
          topics: topics // Add topics for this subject on this day
        })
        daySchedule.totalMinutes += finalMinutes
        allocatedMinutes[subject.name] += finalMinutes
        remainingMinutes -= finalMinutes
      }
    }
    
    // If there's remaining time, distribute to subjects that need more (prioritize high priority)
    if (remainingMinutes > 0) {
      const subjectsNeedingMore = sortedSubjects
        .filter(s => {
          const needed = s.minutesPerDay * daysUntilExam - allocatedMinutes[s.name]
          return needed > 0
        })
        .sort((a, b) => a.priority - b.priority) // Higher priority first
      
      for (const subject of subjectsNeedingMore) {
        if (remainingMinutes <= 0) break
        
        const needed = subject.minutesPerDay * daysUntilExam - allocatedMinutes[subject.name]
        const minutesToAdd = Math.min(remainingMinutes, Math.ceil(needed))
        
        if (minutesToAdd >= 15) {
          // Add to existing entry or create new
          const existingIndex = daySchedule.subjects.findIndex(s => s.name === subject.name)
          if (existingIndex >= 0) {
            daySchedule.subjects[existingIndex].minutes += minutesToAdd
            daySchedule.subjects[existingIndex].hours = (daySchedule.subjects[existingIndex].minutes / 60).toFixed(1)
          } else {
            // Distribute topics for this subject on this day based on available time
            let topics = []
            try {
              topics = distributeTopicsForDay(subject, day, daysUntilExam, minutesToAdd) || []
            } catch (error) {
              console.error(`Error distributing topics for ${subject.name} on day ${day}:`, error)
              const materials = subject.materials || []
              if (materials.length > 0) {
                const firstMaterial = materials[0]
                topics = [{
                  name: typeof firstMaterial === 'string' ? firstMaterial : (firstMaterial.name || ''),
                  estimatedMinutes: null
                }]
              }
            }
            daySchedule.subjects.push({
              name: subject.name,
              priority: subject.priority,
              minutes: minutesToAdd,
              hours: (minutesToAdd / 60).toFixed(1),
              topics: topics
            })
          }
          daySchedule.totalMinutes += minutesToAdd
          allocatedMinutes[subject.name] += minutesToAdd
          remainingMinutes -= minutesToAdd
        }
      }
    }
    
    // Sort subjects in day schedule by priority
    daySchedule.subjects.sort((a, b) => a.priority - b.priority)
    
    schedule.push(daySchedule)
  }
  
  return schedule
}

// Track which topics have been assigned to which days for each subject
const topicAssignmentTracker = new Map()

/**
 * Distributes topics for a subject across a specific day based on available time
 * @param {Object} subject - Subject with materials array and minutes allocated for this day
 * @param {number} day - Current day number (1-based)
 * @param {number} totalDays - Total days until exam
 * @param {number} availableMinutes - Minutes available for this subject on this day
 * @returns {Array<Object>} Array of topic objects {name, estimatedMinutes} to study on this day
 */
function distributeTopicsForDay(subject, day, totalDays, availableMinutes = null) {
  // Get materials - handle both old format (strings) and new format (objects)
  const materials = subject.materials || []
  
  if (!materials || materials.length === 0) {
    return []
  }
  
  // Convert to normalized format: array of {name, estimatedMinutes}
  const normalizedMaterials = materials
    .map(m => {
      if (typeof m === 'string') {
        return { name: m.trim(), estimatedMinutes: null }
      }
      return {
        name: (m.name || '').trim(),
        estimatedMinutes: m.estimatedMinutes || null
      }
    })
    .filter(m => m.name !== '')
  
  if (normalizedMaterials.length === 0) {
    return []
  }
  
  // Initialize tracker for this subject
  if (!topicAssignmentTracker.has(subject.name)) {
    topicAssignmentTracker.set(subject.name, {
      assignedDays: new Map(), // topic name -> [day numbers]
      dayCounter: 0
    })
  }
  
  const tracker = topicAssignmentTracker.get(subject.name)
  
  // Calculate estimated time per topic if not specified
  // Use total subject hours divided by number of topics
  const totalSubjectMinutes = subject.minutesPerDay * totalDays
  const averageMinutesPerTopic = Math.ceil(totalSubjectMinutes / normalizedMaterials.length)
  
  // Assign estimated minutes to topics that don't have them
  const materialsWithTime = normalizedMaterials.map(m => ({
    ...m,
    estimatedMinutes: m.estimatedMinutes || averageMinutesPerTopic
  }))
  
  // If we have available minutes for this day, use it; otherwise estimate
  const minutesForToday = availableMinutes || Math.ceil(subject.minutesPerDay)
  
  // Get topics that haven't been assigned much (or at all)
  const topicStats = materialsWithTime.map(material => {
    const assignedDays = tracker.assignedDays.get(material.name) || []
    return {
      ...material,
      assignedCount: assignedDays.length,
      lastDay: assignedDays.length > 0 ? Math.max(...assignedDays) : 0
    }
  })
  
  // Sort: unassigned first, then by assignment count, then by last assignment day
  topicStats.sort((a, b) => {
    if (a.assignedCount === 0 && b.assignedCount > 0) return -1
    if (b.assignedCount === 0 && a.assignedCount > 0) return 1
    if (a.assignedCount !== b.assignedCount) return a.assignedCount - b.assignedCount
    return a.lastDay - b.lastDay
  })
  
  // Select topics that fit within available time
  const selectedTopics = []
  let remainingMinutes = minutesForToday
  
  // First pass: assign topics that fit perfectly
  for (const topic of topicStats) {
    if (remainingMinutes <= 0) break
    
    // Check if this topic fits
    if (topic.estimatedMinutes <= remainingMinutes) {
      selectedTopics.push({
        name: topic.name,
        estimatedMinutes: topic.estimatedMinutes
      })
      remainingMinutes -= topic.estimatedMinutes
      
      // Track assignment
      if (!tracker.assignedDays.has(topic.name)) {
        tracker.assignedDays.set(topic.name, [])
      }
      tracker.assignedDays.get(topic.name).push(day)
    }
  }
  
  // Second pass: if we have remaining time, try to fit smaller unassigned topics
  if (remainingMinutes > 0 && selectedTopics.length < topicStats.length) {
    const unassignedTopics = topicStats.filter(t => 
      !selectedTopics.find(st => st.name === t.name) && 
      t.estimatedMinutes <= remainingMinutes
    )
    
    // Sort by size (smallest first) to maximize number of topics
    unassignedTopics.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes)
    
    for (const topic of unassignedTopics) {
      if (remainingMinutes <= 0) break
      selectedTopics.push({
        name: topic.name,
        estimatedMinutes: topic.estimatedMinutes
      })
      remainingMinutes -= topic.estimatedMinutes
      
      if (!tracker.assignedDays.has(topic.name)) {
        tracker.assignedDays.set(topic.name, [])
      }
      tracker.assignedDays.get(topic.name).push(day)
    }
  }
  
  // Third pass: if no topics were assigned but we have materials, assign at least one
  // This ensures topics are always shown, even if they exceed available time
  if (selectedTopics.length === 0 && topicStats.length > 0) {
    // Find the smallest topic or the first unassigned one
    const smallestTopic = topicStats.reduce((min, topic) => 
      !min || topic.estimatedMinutes < min.estimatedMinutes ? topic : min
    )
    
    selectedTopics.push({
      name: smallestTopic.name,
      estimatedMinutes: smallestTopic.estimatedMinutes
    })
    
    // Track assignment
    if (!tracker.assignedDays.has(smallestTopic.name)) {
      tracker.assignedDays.set(smallestTopic.name, [])
    }
    tracker.assignedDays.get(smallestTopic.name).push(day)
  }
  
  tracker.dayCounter++
  
  return selectedTopics
}
