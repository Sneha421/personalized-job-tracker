// pages/api/add-job.js
import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_TOKEN })
const databaseId = process.env.NOTION_DB_ID

export default async function handler(req, res) {
  /* ──────────────────────  CORS ────────────────────── */
  res.setHeader('Access-Control-Allow-Origin', '*')          // ← allow all origins
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Origin', 'https://www.linkedin.com') 

  // Handle the preflight OPTIONS request that the browser sends first
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { title, company, url, applied } = req.body

  if (!title || !company || !url || !applied) {
    return res
      .status(400)
      .json({ error: 'Missing one or more required fields' })
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        title: { title: [{ text: { content: title } }] },
        company: { rich_text: [{ text: { content: company } }] },
        url: { url: url },
        applied: { date: { start: applied } },
      },
    })

    // Success – return the created page
    return res.status(200).json({ success: true, data: response })
  } catch (err) {
    console.error('Notion API error', err)
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown Notion error',
    })
  }
}