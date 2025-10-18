const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');

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
    console.log('Environment check - SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('Environment check - SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    
    let supabaseData = null;
    let notionData = null;
    
    // 1️⃣ Insert into Supabase first
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      try {
        console.log('Inserting job into Supabase...');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_ANON_KEY
        );
        
        const { data, error } = await supabase
          .from('jobs')
          .insert([job])
          .select()
          .single();
        
        if (error) throw error;
        supabaseData = data;
        console.log('Job inserted into Supabase:', supabaseData);
      } catch (error) {
        console.error('Supabase error:', error);
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
            error: `Supabase error: ${error.message}`
          })
        };
      }
    } else {
      console.log('Supabase credentials not configured');
    }
    
    // 2️⃣ Insert into Notion
    if (process.env.NOTION_TOKEN && process.env.NOTION_DB_ID) {
      try {
        console.log('Inserting job into Notion...');
        const notion = new Client({
          auth: process.env.NOTION_TOKEN
        });

        const databaseId = process.env.NOTION_DB_ID;
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
        
        notionData = response;
        console.log('Job inserted into Notion:', notionData);
      } catch (error) {
        console.error('Notion error:', error);
        // Don't fail the entire request if Notion fails
      }
    } else {
      console.log('Notion credentials not configured');
    }

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
        supabaseData: supabaseData,
        notionData: notionData,
        message: `Job successfully added to ${supabaseData ? 'Supabase' : ''}${supabaseData && notionData ? ' and ' : ''}${notionData ? 'Notion' : ''}`
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