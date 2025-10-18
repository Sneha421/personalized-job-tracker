// Load environment variables with fallbacks for testing
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: '*' }));      // Allow all origins
app.use(express.json());             // Parse JSON bodies

// Environment variables with fallbacks
const SUPABASE_URL = process.env.SUPABASE_URL || 'your_supabase_url_here';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';
const NOTION_TOKEN = process.env.NOTION_TOKEN || 'your_notion_token_here';
const NOTION_DB_ID = process.env.NOTION_DB_ID || 'your_notion_db_id_here';

// 4️⃣  Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 5️⃣  Notion client
const notion = new Client({ auth: NOTION_TOKEN });

// 6️⃣  POST route for both Supabase and Notion
app.post('/api/add-job', async (req, res) => {
  const { title, company, url, applied } = req.body;
  if (!title || !company || !url || !applied) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    // Insert into Supabase
    const { data: supData, error: supErr } = await supabase
      .from('jobs')
      .insert([{ title, company, url, applied }])
      .single();
    if (supErr) throw supErr;

    // Insert into Notion
    const notionRes = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
        title:   { title:   [{ text: { content: title } }] },
        company: { rich_text: [{ text: { content: company } }] },
        url:     { url },
        applied: { date: { start: applied } },
      },
    });

    return res.json({ success: true, data: { supabase: supData, notion: notionRes } });
  } catch (err) {
    console.error('Backend error:', err);
    return res.status(500).json({ error: err.message });
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
    
    // Insert into Notion
    const notionRes = await notion.pages.create({
      parent: { database_id: NOTION_DB_ID },
      properties: {
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

// 8️⃣  Optional "home" route for sanity check
app.get('/', (req, res) => {
  res.send('⚙️  Job‑Tracker backend is running. Use POST /api/add-job or POST /api/notion.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Local API listening on http://localhost:${PORT}`)
);
