// Load environment variables with fallbacks for testing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const { extractJobData } = require('./lib/groq');

const app = express();
app.use(cors({ origin: '*' }));      // Allow all origins
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies with larger limit

// Environment variables with fallbacks
const NOTION_TOKEN = process.env.NOTION_TOKEN || 'your_notion_token_here';
const NOTION_DB_ID = process.env.NOTION_DB_ID || 'your_notion_db_id_here';

// 5️⃣  Notion client
const notion = new Client({ auth: NOTION_TOKEN });

// 6️⃣  POST route for rule-based job extraction
app.post('/api/groq-extract', async (req, res) => {
  const { pageContent, url } = req.body;
  
  if (!pageContent || !url) {
    return res.status(400).json({ error: 'Missing pageContent or url' });
  }

  try {
    console.log('🔍 Extracting job data with rule-based extraction...');
    const jobData = await extractJobData(pageContent, url);
    return res.json({ success: true, jobData });
  } catch (error) {
    console.error('❌ Rule-based extraction error:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 7️⃣  POST route for Notion only
app.post('/api/notion', async (req, res) => {
  const { title, company, url, applied } = req.body;
  if (!title || !company || !url || !applied) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Check if Notion credentials are configured
  if (NOTION_TOKEN === 'your_notion_token_here' || NOTION_DB_ID === 'your_notion_db_id_here') {
    console.log('Notion credentials not configured, returning mock success');
    return res.json({ 
      success: true, 
      id: 'mock-' + Date.now(), 
      message: 'Job would be added to Notion (credentials not configured)' 
    });
  }

  try {
    console.log('Adding job to Notion:', { title, company, url, applied });
    
    // Get the next ID by counting existing records
    const existingRecords = await notion.databases.query({
      database_id: NOTION_DB_ID
    });
    const nextId = existingRecords.results.length + 1;
    console.log('Next ID will be:', nextId);
    
    // Insert into Notion
    const notionRes = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        id:      { number: nextId },
        title:   { title:   [{ text: { content: title } }] },
        company: { rich_text: [{ text: { content: company } }] },
        url:     { url },
        applied: { date: { start: applied } },
      },
    });

    console.log('Notion page created:', notionRes.id);
    return res.json({ success: true, id: notionRes.id, message: 'Job added to Notion' });
  } catch (err) {
    console.error('Notion error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 8️⃣  GET route to fetch jobs from Notion
app.get('/api/notion-jobs', async (req, res) => {
  // Check if Notion credentials are configured
  if (NOTION_TOKEN === 'your_notion_token_here' || NOTION_DB_ID === 'your_notion_db_id_here') {
    console.log('Notion credentials not configured, returning mock data');
    return res.json({
      success: true,
      jobs: [
        {
          id: 'mock-1',
          title: 'Mock Job 1',
          company: 'Mock Company 1',
          url: 'https://example.com/1',
          applied: '2025-01-01'
        }
      ]
    });
  }

  try {
    console.log('Fetching jobs from Notion...');

    // Query Notion database
    const response = await notion.databases.query({
      database_id: NOTION_DB_ID,
      sorts: [
        {
          property: 'applied',
          direction: 'descending'
        }
      ]
    });

    // Transform Notion data to our format
    const jobs = response.results.map(page => {
      const props = page.properties;
      return {
        id: page.id,
        notionId: props.id?.number || 0,
        title: props.title?.title?.[0]?.text?.content || 'Unknown Title',
        company: props.company?.rich_text?.[0]?.text?.content || 'Unknown Company',
        url: props.url?.url || '',
        applied: props.applied?.date?.start || new Date().toISOString()
      };
    });

    console.log(`Found ${jobs.length} jobs in Notion`);
    return res.json({ success: true, jobs });
  } catch (err) {
    console.error('Notion fetch error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 9️⃣  Optional "home" route for sanity check
app.get('/', (req, res) => {
  res.send('⚙️  Job‑Tracker backend is running. Use POST /api/notion to add jobs to Notion.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Local API listening on http://localhost:${PORT}`)
);
