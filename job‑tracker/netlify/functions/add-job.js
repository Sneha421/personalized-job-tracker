const { Client } = require('@notionhq/client');

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      },
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the job data from the request body
    const job = JSON.parse(event.body);
    
    console.log('Netlify function called with job:', job);
    console.log('Environment check - NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'SET' : 'NOT SET');
    console.log('Environment check - NOTION_DB_ID:', process.env.NOTION_DB_ID ? 'SET' : 'NOT SET');
    
    // Check for Notion credentials
    if (!process.env.NOTION_TOKEN || !process.env.NOTION_DB_ID) {
      console.log('Missing Notion credentials');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          success: false,
          message: 'Notion credentials not configured. Please set NOTION_TOKEN and NOTION_DB_ID environment variables in Netlify.'
        })
      };
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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400'
      },
      body: JSON.stringify({
        success: true,
        notionPageId: response.id,
        message: 'Job successfully added to Notion database'
      })
    };

  } catch (error) {
    console.error('Notion API error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};