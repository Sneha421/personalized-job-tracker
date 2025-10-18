const { Client } = require('@notionhq/client');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the job data from the request body
    const job = req.body;
    
    console.log('Vercel API called with job:', job);
    
    // Check for environment variables
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DB_ID) {
      console.log('Missing Notion credentials');
      return res.status(200).json({
        success: false,
        message: 'Notion credentials not configured. Please set NOTION_TOKEN and NOTION_DB_ID environment variables in Vercel.'
      });
    }
    
    // Initialize Notion client
    const notion = new Client({
      auth: process.env.NOTION_TOKEN
    });

    // Get the database ID from environment variables
    const databaseId = process.env.NOTION_DB_ID;

    // Create a new page in the Notion database
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
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
    });

    return res.status(200).json({
      success: true,
      notionPageId: response.id,
      message: 'Job successfully added to Notion database'
    });

  } catch (error) {
    console.error('Notion API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
