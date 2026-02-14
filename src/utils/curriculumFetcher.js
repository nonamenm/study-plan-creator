/**
 * Fetches Leaving Cert curriculum topics from Curriculum Online
 * Note: This uses web scraping and may be subject to CORS restrictions
 */

// Mapping of common subject names to Curriculum Online URLs
const CURRICULUM_URLS = {
  'mathematics': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/mathematics/',
  'maths': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/mathematics/',
  'english': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/english/',
  'irish': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/gaeilge/',
  'gaeilge': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/gaeilge/',
  'physics': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/physics/',
  'chemistry': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/chemistry/',
  'biology': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/biology/',
  'history': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/history/',
  'geography': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/geography/',
  'french': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/french/',
  'german': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/german/',
  'spanish': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/spanish/',
  'business': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/business-studies/',
  'business studies': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/business-studies/',
  'accounting': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/accounting/',
  'economics': 'https://www.curriculumonline.ie/senior-cycle/senior-cycle-subjects/economics/',
}

/**
 * Fetches curriculum topics for a subject
 * @param {string} subjectName - Name of the subject
 * @returns {Promise<Array<string>>} Array of topic names
 */
export async function fetchCurriculumTopics(subjectName) {
  const normalizedName = subjectName.toLowerCase().trim()
  const url = CURRICULUM_URLS[normalizedName]
  
  if (!url) {
    throw new Error(`Curriculum not available for subject: ${subjectName}. Please add materials manually.`)
  }

  try {
    // Try direct fetch first (may fail due to CORS)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
      mode: 'cors'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch curriculum: ${response.status}`)
    }

    const html = await response.text()
    return parseCurriculumHTML(html, subjectName)
  } catch (error) {
    // If direct fetch fails (likely CORS), try using a CORS proxy
    console.warn('Direct fetch failed, trying CORS proxy:', error.message)
    return fetchWithCORSProxy(url, subjectName)
  }
}

/**
 * Parses HTML content to extract curriculum topics
 * @param {string} html - HTML content from curriculum page
 * @param {string} subjectName - Name of the subject
 * @returns {Array<string>} Array of topic names
 */
function parseCurriculumHTML(html, subjectName) {
  const topics = []
  
  // Create a temporary DOM parser (works in browser)
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  // Try to find syllabus/topic sections
  // Common patterns in curriculum pages:
  // 1. Look for headings (h2, h3) that might contain topics
  // 2. Look for lists (ul, ol) with topic items
  // 3. Look for specific class names or IDs
  
  // Strategy 1: Find headings that look like topics
  const headings = doc.querySelectorAll('h2, h3, h4')
  headings.forEach(heading => {
    const text = heading.textContent.trim()
    // Filter out navigation and non-topic headings
    if (text && 
        text.length < 100 && 
        !text.toLowerCase().includes('menu') &&
        !text.toLowerCase().includes('navigation') &&
        !text.toLowerCase().includes('skip') &&
        text.length > 3) {
      // Check if it looks like a topic (not a page title)
      if (!text.toLowerCase().includes(subjectName.toLowerCase()) ||
          text.split(' ').length <= 5) {
        topics.push(text)
      }
    }
  })
  
  // Strategy 2: Find list items that might be topics
  const listItems = doc.querySelectorAll('li')
  listItems.forEach(li => {
    const text = li.textContent.trim()
    // Filter for reasonable topic names
    if (text && 
        text.length > 5 && 
        text.length < 80 &&
        !text.includes('http') &&
        !text.includes('@')) {
      // Check if parent is in a syllabus section
      const parent = li.closest('section, div')
      if (parent) {
        const parentText = parent.textContent.toLowerCase()
        if (parentText.includes('syllabus') || 
            parentText.includes('topic') || 
            parentText.includes('content') ||
            parentText.includes('unit')) {
          topics.push(text.split('\n')[0].trim()) // Take first line only
        }
      }
    }
  })
  
  // Strategy 3: Look for specific patterns in text content
  const bodyText = doc.body.textContent
  const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  lines.forEach(line => {
    // Look for lines that might be topics (short, capitalized, etc.)
    if (line.length > 5 && 
        line.length < 60 &&
        line.split(' ').length <= 8 &&
        !line.includes('http') &&
        !line.includes('©') &&
        !line.includes('Curriculum Online')) {
      // Check if it's in a relevant section
      if (line.match(/^[A-Z][a-z]+/) || // Starts with capital
          line.match(/^\d+\./)) { // Numbered list
        topics.push(line)
      }
    }
  })
  
  // Remove duplicates and clean up
  const uniqueTopics = [...new Set(topics)]
    .filter(topic => {
      // Filter out common non-topic text
      const lower = topic.toLowerCase()
      return !lower.includes('home') &&
             !lower.includes('contact') &&
             !lower.includes('privacy') &&
             !lower.includes('cookie') &&
             !lower.includes('menu') &&
             !lower.includes('search')
    })
    .slice(0, 30) // Limit to 30 topics
  
  if (uniqueTopics.length === 0) {
    throw new Error('Could not extract topics from curriculum page. The page structure may have changed.')
  }
  
  return uniqueTopics
}

/**
 * Fetches curriculum using a CORS proxy
 * @param {string} url - URL to fetch
 * @param {string} subjectName - Name of the subject
 * @returns {Promise<Array<string>>} Array of topic names
 */
async function fetchWithCORSProxy(url, subjectName) {
  // Try using a public CORS proxy (note: these may be unreliable)
  const proxyUrls = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`, // May require activation
  ]
  
  for (const proxyUrl of proxyUrls) {
    try {
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      })
      
      if (response.ok) {
        const html = await response.text()
        return parseCurriculumHTML(html, subjectName)
      }
    } catch (error) {
      console.warn(`Proxy ${proxyUrl} failed:`, error.message)
      continue
    }
  }
  
  throw new Error('Unable to fetch curriculum due to CORS restrictions. Please add materials manually.')
}

/**
 * Gets a fallback list of common topics for a subject
 * @param {string} subjectName - Name of the subject
 * @returns {Array<string>} Array of common topics
 */
export function getFallbackTopics(subjectName) {
  const normalizedName = subjectName.toLowerCase().trim()
  
  const fallbackTopics = {
    'mathematics': ['Algebra', 'Functions', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Number Theory'],
    'maths': ['Algebra', 'Functions', 'Calculus', 'Geometry', 'Trigonometry', 'Statistics', 'Probability', 'Number Theory'],
    'english': ['Poetry', 'Drama', 'Prose', 'Language', 'Composition', 'Comprehension', 'Shakespeare', 'Literary Analysis'],
    'irish': ['Filíocht', 'Drámaíocht', 'Prós', 'Teanga', 'Scríbhneoireacht', 'Léamhthuiscint', 'Gramadach'],
    'gaeilge': ['Filíocht', 'Drámaíocht', 'Prós', 'Teanga', 'Scríbhneoireacht', 'Léamhthuiscint', 'Gramadach'],
    'physics': ['Mechanics', 'Waves', 'Optics', 'Electricity', 'Magnetism', 'Thermodynamics', 'Modern Physics', 'Atomic Physics'],
    'chemistry': ['Atomic Structure', 'Bonding', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],
    'biology': ['Cell Biology', 'Genetics', 'Ecology', 'Human Biology', 'Plant Biology', 'Evolution', 'Biochemistry'],
    'history': ['Irish History', 'European History', 'World History', 'Historical Research', 'Document Analysis'],
    'geography': ['Physical Geography', 'Human Geography', 'Regional Geography', 'Geographical Skills', 'Fieldwork'],
    'french': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Listening', 'Speaking', 'Literature'],
    'german': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Listening', 'Speaking', 'Literature'],
    'spanish': ['Grammar', 'Vocabulary', 'Reading Comprehension', 'Writing', 'Listening', 'Speaking', 'Literature'],
  }
  
  return fallbackTopics[normalizedName] || []
}
