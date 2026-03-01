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
  
  // 5. Create topic assignment tracker (explicit state management)
  // WHY Map-based tracking is needed:
  // - Ensures even distribution: Without tracking, topics might cluster on early days
  // - Guarantees coverage: Tracks which topics haven't appeared yet (assignedCount === 0)
  // - Enables spacing effect: Tracks last assignment day for spaced repetition
  // - Prevents over-allocation: Ensures topics appear proportionally across all days
  // Structure: Map<subjectName, {assignedDays: Map<topicName, [dayNumbers]>}>
  const topicTracker = new Map()
  
  // 6. Create daily schedule
  const dailySchedule = createDailySchedule(subjectsWithWeights, daysUntilExam, dailyHours, topicTracker)
  
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
 * @param {Map} topicTracker - Map tracking topic assignments per subject (explicit state)
 * @returns {Array} Array of daily schedule objects
 */
function createDailySchedule(subjects, daysUntilExam, dailyHours, topicTracker) {
  const dailyMinutes = dailyHours * 60
  const schedule = []
  
  // Clear topic assignment tracker for new schedule (explicit reset)
  topicTracker.clear()
  
  // Minimum study block size (25 minutes = one Pomodoro, research-backed)
  const MIN_STUDY_BLOCK_MINUTES = 25
  
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
      
      // Minimum study block if subject is included (ensures meaningful study sessions)
      if (minutesToAllocate >= MIN_STUDY_BLOCK_MINUTES || (minutesToAllocate > 0 && remainingForSubject > 0)) {
        const finalMinutes = Math.max(MIN_STUDY_BLOCK_MINUTES, minutesToAllocate)
        
        // Distribute topics for this subject on this day based on available time
        const topics = getTopicsForSubject(subject, day, daysUntilExam, finalMinutes, topicTracker)
        
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
        
        if (minutesToAdd >= MIN_STUDY_BLOCK_MINUTES) {
          // Add to existing entry or create new
          const existingIndex = daySchedule.subjects.findIndex(s => s.name === subject.name)
          if (existingIndex >= 0) {
            daySchedule.subjects[existingIndex].minutes += minutesToAdd
            daySchedule.subjects[existingIndex].hours = (daySchedule.subjects[existingIndex].minutes / 60).toFixed(1)
          } else {
            // Distribute topics for this subject on this day based on available time
            const topics = getTopicsForSubject(subject, day, daysUntilExam, minutesToAdd, topicTracker)
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

/**
 * Helper function to safely get topics for a subject with error handling
 * Ensures students always see topics even if distribution fails
 * 
 * @param {Object} subject - Subject with materials array
 * @param {number} day - Current day number (1-based)
 * @param {number} totalDays - Total days until exam
 * @param {number} availableMinutes - Minutes available for this subject on this day
 * @param {Map} topicTracker - Map tracking topic assignments per subject
 * @returns {Array<Object>} Array of topic objects to study on this day
 */
function getTopicsForSubject(subject, day, totalDays, availableMinutes, topicTracker) {
  try {
    const topics = distributeTopicsForDay(subject, day, totalDays, availableMinutes, topicTracker)
    return topics || []
  } catch (error) {
    console.error(`Error distributing topics for ${subject.name} on day ${day}:`, error)
    // Fallback: ensure at least one topic appears so students always have something to study
    const materials = subject.materials || []
    if (materials.length > 0) {
      const firstMaterial = materials[0]
      return [{
        name: typeof firstMaterial === 'string' ? firstMaterial : (firstMaterial.name || ''),
        estimatedMinutes: null,
        pomodoroCount: typeof firstMaterial === 'object' ? (firstMaterial.pomodoroCount || null) : null,
        timeType: typeof firstMaterial === 'object' ? (firstMaterial.timeType || null) : null
      }]
    }
    return []
  }
}

/**
 * Distributes topics for a subject across a specific day based on available time
 * Uses smart distribution: prioritizes unassigned topics, ensures even distribution
 * 
 * @param {Object} subject - Subject with materials array and minutes allocated for this day
 * @param {number} day - Current day number (1-based)
 * @param {number} totalDays - Total days until exam
 * @param {number} availableMinutes - Minutes available for this subject on this day
 * @param {Map} topicTracker - Map tracking topic assignments per subject (explicit state)
 * @returns {Array<Object>} Array of topic objects {name, estimatedMinutes} to study on this day
 */
function distributeTopicsForDay(subject, day, totalDays, availableMinutes = null, topicTracker) {
  // Get materials - handle both old format (strings) and new format (objects)
  const materials = subject.materials || []
  
  if (!materials || materials.length === 0) {
    return []
  }
  
  // Convert to normalized format: array of {name, estimatedMinutes, pomodoroCount, timeType}
  // Handle both minutes and pomodoro (pomodoro is already converted to minutes in the form)
  const normalizedMaterials = materials
    .map(m => {
      if (typeof m === 'string') {
        return { name: m.trim(), estimatedMinutes: null, pomodoroCount: null, timeType: null }
      }
      // If pomodoro, ensure estimatedMinutes is calculated (should already be done in form, but double-check)
      let estimatedMinutes = m.estimatedMinutes || null
      if (m.timeType === 'pomodoro' && m.pomodoroCount && !estimatedMinutes) {
        estimatedMinutes = m.pomodoroCount * 25
      }
      return {
        name: (m.name || '').trim(),
        estimatedMinutes: estimatedMinutes,
        pomodoroCount: m.pomodoroCount || null,
        timeType: m.timeType || null
      }
    })
    .filter(m => m.name !== '')
  
  if (normalizedMaterials.length === 0) {
    return []
  }
  
  // Initialize tracker for this subject (tracks which days each topic was assigned to)
  if (!topicTracker.has(subject.name)) {
    topicTracker.set(subject.name, {
      assignedDays: new Map() // topic name -> [day numbers] - tracks assignment history
    })
  }
  
  const tracker = topicTracker.get(subject.name)
  
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
  
  // WHY multiple sorting passes are needed:
  // 1. Unassigned topics first: CRITICAL - Without this, some topics might never appear
  //    Example: If topic A always fits but topic B doesn't, B would never be assigned
  // 2. Fewer assignments: Ensures even distribution - topics appear similar number of times
  //    Example: Topic A appears 5 times, Topic B appears 0 times → prioritize B
  // 3. Older assignments: Spacing effect (research-backed) - better retention when reviewed after gap
  //    Example: Topic reviewed on day 1 and day 5 is better than day 1 and day 2
  // Smart sorting: ensures all topics appear and are distributed evenly
  // Level 1: Unassigned topics first (critical - ensures students see all topics)
  // Level 2: Fewer assignments first (even distribution across days)
  // Level 3: Older assignments first (spacing effect - review topics after time gap)
  topicStats.sort((a, b) => {
    // Unassigned topics get highest priority
    if (a.assignedCount === 0 && b.assignedCount > 0) return -1
    if (b.assignedCount === 0 && a.assignedCount > 0) return 1
    // Then prioritize topics with fewer assignments (even distribution)
    if (a.assignedCount !== b.assignedCount) return a.assignedCount - b.assignedCount
    // Finally, prioritize older assignments (spacing effect for better retention)
    return a.lastDay - b.lastDay
  })
  
  // Filter and sort topics that fit within available time
  // Combine passes 1 & 2: prioritize unassigned, then fit as many as possible
  const topicsThatFit = topicStats.filter(t => t.estimatedMinutes <= minutesForToday)
  
  // Sort fitting topics: unassigned first, then smallest first (maximizes topics per day)
  topicsThatFit.sort((a, b) => {
    // Unassigned topics first (critical for coverage)
    if (a.assignedCount === 0 && b.assignedCount > 0) return -1
    if (b.assignedCount === 0 && a.assignedCount > 0) return 1
    // Then smallest first (fits more topics per day)
    return a.estimatedMinutes - b.estimatedMinutes
  })
  
  // Single pass: assign topics that fit, prioritizing unassigned topics
  const selectedTopics = []
  let remainingMinutes = minutesForToday
  
  for (const topic of topicsThatFit) {
    if (remainingMinutes <= 0) break
    
    if (remainingMinutes >= topic.estimatedMinutes) {
      selectedTopics.push({
        name: topic.name,
        estimatedMinutes: topic.estimatedMinutes,
        pomodoroCount: topic.pomodoroCount || null,
        timeType: topic.timeType || null
      })
      remainingMinutes -= topic.estimatedMinutes
      
      // Track assignment (ensures even distribution across days)
      trackTopicAssignment(tracker, topic.name, day)
    }
  }
  
  // WHY fallback logic exists:
  // - Time estimates may be inaccurate or missing (user didn't specify)
  // - Available minutes might be less than smallest topic estimate
  // - Without fallback, student would see empty day → demotivating
  // - Ensures progress: Always shows at least one topic to study
  // - Better UX: Empty days are confusing; one topic is better than none
  // Fallback: if no topics fit but we have materials, assign smallest topic anyway
  // This ensures students always see at least one topic, even if time estimates are off
  if (selectedTopics.length === 0 && topicStats.length > 0) {
    const smallestTopic = topicStats.reduce((min, topic) => 
      !min || topic.estimatedMinutes < min.estimatedMinutes ? topic : min
    )
    
    selectedTopics.push({
      name: smallestTopic.name,
      estimatedMinutes: smallestTopic.estimatedMinutes,
      pomodoroCount: smallestTopic.pomodoroCount || null,
      timeType: smallestTopic.timeType || null
    })
    
    trackTopicAssignment(tracker, smallestTopic.name, day)
  }
  
  return selectedTopics
}

/**
 * Helper function to track topic assignments
 * Avoids code duplication and ensures consistent tracking
 * 
 * @param {Object} tracker - Tracker object for this subject
 * @param {string} topicName - Name of the topic being assigned
 * @param {number} day - Day number the topic is assigned to
 */
function trackTopicAssignment(tracker, topicName, day) {
  if (!tracker.assignedDays.has(topicName)) {
    tracker.assignedDays.set(topicName, [])
  }
  tracker.assignedDays.get(topicName).push(day)
}
