/**
 * Add a job row to your Notion database.
 * Uses local server to avoid CORS issues.
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
    console.log('Adding job to Notion via local server:', job)
    
    // Use local server to avoid CORS issues
    const response = await fetch('http://localhost:4000/api/notion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Notion API error: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('Job added to Notion successfully:', result)
    return {
      success: true,
      notionPageId: result.id,
      message: 'Job successfully added to Notion database'
    }
  } catch (error) {
    console.error('Notion API error:', error)
    throw error
  }
}