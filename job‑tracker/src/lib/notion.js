import { Client } from '@notionhq/client'

/**
 * Add a job row to your Notion database.
 * Direct client-side Notion integration.
 *
 * @param {object} job
 *   { title: string, company: string, url: string, applied: string }
 * @returns {Promise<object>} The created page data.
 */
export async function addJobToNotion(job) {
  if (!job || !job.title) {
    throw new Error('Invalid job data provided')
  }
  
  // Check for environment variables
  const notionToken = import.meta.env.VITE_NOTION_TOKEN
  const notionDbId = import.meta.env.VITE_NOTION_DB_ID
  
  if (!notionToken || !notionDbId) {
    console.log('Notion credentials not configured')
    return {
      success: false,
      message: 'Notion credentials not configured. Please set VITE_NOTION_TOKEN and VITE_NOTION_DB_ID in your .env file.'
    }
  }
  
  try {
    console.log('Adding job to Notion:', job)
    
    // Initialize Notion client
    const notion = new Client({
      auth: notionToken
    })

    // Create a new page in the Notion database
    const response = await notion.pages.create({
      parent: { database_id: notionDbId },
      properties: {
        title: {
          title: [{ text: { content: job.title } }]
        },
        company: {
          rich_text: [{ text: { content: job.company } }]
        },
        url: {
          url: job.url
        },
        applied: {
          date: { start: job.applied }
        }
      }
    })
    
    console.log('Job added to Notion successfully:', response.id)
    return {
      success: true,
      notionPageId: response.id,
      message: 'Job successfully added to Notion database'
    }
  } catch (error) {
    console.error('Notion API error:', error)
    throw error
  }
}