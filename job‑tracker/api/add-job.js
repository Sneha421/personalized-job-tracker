import { createClient } from '@supabase/supabase-js';
import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const job = req.body;
    console.log('Vercel function called with job:', job);
    console.log('Environment check - SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('Environment check - SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
    console.log('Environment check - NOTION_TOKEN:', process.env.NOTION_TOKEN ? 'SET' : 'NOT SET');
    console.log('Environment check - NOTION_DB_ID:', process.env.NOTION_DB_ID ? 'SET' : 'NOT SET');
    
    let supabaseData = null;
    let notionData = null;
    
    // 1️⃣ Insert into Supabase
    if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
      try {
        console.log('Inserting job into Supabase...');
        const supabase = createClient(
          process.env.VITE_SUPABASE_URL,
          process.env.VITE_SUPABASE_ANON_KEY
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
        return res.status(500).json({
          success: false,
          error: `Supabase error: ${error.message}`
        });
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

        const response = await notion.pages.create({
          parent: { database_id: process.env.NOTION_DB_ID },
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
    
    return res.status(200).json({
      success: true,
      supabaseData: supabaseData,
      notionData: notionData,
      message: `Job successfully added to ${supabaseData ? 'Supabase' : ''}${supabaseData && notionData ? ' and ' : ''}${notionData ? 'Notion' : ''}`
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}