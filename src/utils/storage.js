const KEYS = {
  profile: 'sp_profile',
  formData: 'sp_formData',
  studyPlan: 'sp_studyPlan',
  progress: 'sp_progress',
}

function getItem(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function setItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getProfile() {
  return getItem(KEYS.profile)
}

export function saveProfile(data) {
  setItem(KEYS.profile, data)
}

export function getFormData() {
  return getItem(KEYS.formData)
}

export function saveFormData(data) {
  setItem(KEYS.formData, data)
}

export function getStudyPlan() {
  return getItem(KEYS.studyPlan)
}

export function saveStudyPlan(data) {
  setItem(KEYS.studyPlan, data)
}

export function getProgress() {
  return getItem(KEYS.progress)
}

export function saveProgress(data) {
  setItem(KEYS.progress, data)
}

export function clearProgress() {
  localStorage.removeItem(KEYS.progress)
}
