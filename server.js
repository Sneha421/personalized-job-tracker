require('dotenv').config();          // 1️⃣  Load .env

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: '*' }));      // 2️⃣  Allow all origins
app.use(express.json());             // 3️⃣  Parse JSON bodies

// 4️⃣  Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 5️⃣  Notion client
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const NOTION_DB_ID = process.env.NOTION_DB_ID;

// 6️⃣  POST route
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
        Title:   { title:   [{ text: { content: title } }] },
        Company: { rich_text: [{ text: { content: company } }] },
        URL:     { url },
        Applied: { date: { start: applied } },
      },
    });

    return res.json({ success: true, data: { supabase: supData, notion: notionRes } });
  } catch (err) {
    console.error('Backend error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 7️⃣  Optional "home" route for sanity check
app.get('/', (req, res) => {
  res.send('⚙️  Job‑Tracker backend is running. Use POST /api/add-job.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`Local API listening on http://localhost:${PORT}`)
);
