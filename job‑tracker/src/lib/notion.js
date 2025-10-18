// Notion integration is handled server-side via Vercel API route
// Environment variables are set in Vercel dashboard, not client-side

/**
 * Add a job row to your Notion database.
 * Uses Vercel API route for server-side Notion integration.
 *
 * @param {object} job
 *   { title: string, company: string, url: string, applied: string }
 * @returns {Promise<object>} The created page data.
 */
export async function addJobToNotion(job) {
  if (!job || !job.title) {
    throw new Error('Invalid job data provided')
  }
  
  try {
    console.log('Sending job to Vercel API:', job)
    
    // Call your Vercel API route instead of Notion directly
    const response = await fetch('/api/add-job', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    })
    
    if (!response.ok) {
      // Handle 404 (API route not found) gracefully for local development
      if (response.status === 404) {
        console.log('Vercel API route not available in local development')
        return {
          success: false,
          message: 'Notion integration requires Vercel deployment'
        }
      }
      
      const errorData = await response.json()
      throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }
    
    const result = await response.json()
    console.log('Job synced to Notion successfully!')
    return result
  } catch (error) {
    console.error('Notion sync error:', error)
    
    // Handle network errors gracefully for local development
    if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
      console.log('Vercel API route not available in local development')
      return {
        success: false,
        message: 'Notion integration requires Vercel deployment'
      }
    }
    
    throw error
  }
}