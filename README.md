# Job Tracker - Notion Only

A simple browser extension that automatically tracks job applications and syncs them directly to your Notion database.

## 🎯 How It Works

1. **Click "Apply"** on any job site (LinkedIn, Indeed, Glassdoor, etc.)
2. **Extension detects** the job application
3. **Extracts job data** (title, company, URL, applied date)
4. **Syncs to Notion** with auto-incrementing ID
5. **Shows confirmation** toast notification

## 🚀 Setup

### 1. Install Browser Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension/` folder
4. Make sure it's enabled

### 2. Setup Notion Database
1. Create a Notion database with these properties:
   - `id` (Number) - Auto-incrementing ID
   - `title` (Title) - Job title
   - `company` (Rich Text) - Company name
   - `url` (URL) - Job posting URL
   - `applied` (Date) - Application date

2. Get your Notion credentials:
   - **Notion Token**: Create an integration at https://www.notion.so/my-integrations
   - **Database ID**: Copy from your database URL

### 3. Setup Groq AI (Optional but Recommended)
1. Get your Groq API key:
   - Sign up at https://console.groq.com/
   - Create an API key
   - **Groq API Key**: Copy your API key

**Note**: Groq AI provides intelligent job data extraction that works across all job sites. Without it, the extension uses fallback extraction methods.

### 4. Configure Environment
Create a `.env` file in the root directory:
```
NOTION_TOKEN=your_notion_token_here
NOTION_DB_ID=your_notion_database_id_here
GROQ_API_KEY=your_groq_api_key_here
PORT=4000
```

### 5. Start the Server
```bash
npm install
node server.js
```

## 🎯 Usage

1. **Start the server**: `node server.js`
2. **Go to any job site** (LinkedIn, Indeed, etc.)
3. **Click "Apply"** on any job posting
4. **Groq AI intelligently extracts** job title and company name from any website layout
5. **See the job** automatically added to your Notion database with auto-incrementing ID

## 📁 Project Structure

```
job-tracker/
├── extension/           # Browser extension
│   ├── manifest.json   # Extension configuration
│   ├── content.js      # Job detection logic
│   └── background.js   # Service worker
├── server.js           # Local server (Notion API)
├── .env               # Environment variables
└── README.md          # This file
```

## 🔧 Features

- ✅ **Auto job detection** on any job site
- ✅ **Groq AI extraction** - intelligently finds job title and company from any website layout
- ✅ **Fallback extraction** - works even without Groq AI
- ✅ **Direct Notion sync** with auto-incrementing IDs
- ✅ **Real-time updates** to your Notion database
- ✅ **Toast notifications** for confirmation
- ✅ **Universal compatibility** - works on LinkedIn, Indeed, Glassdoor, and more
- ✅ **Simple setup** - just extension + server

## 🎯 What You Get

- **Automatic job tracking** from any job site
- **Organized Notion database** with all your applications
- **Auto-incrementing IDs** (1, 2, 3, etc.)
- **Real-time sync** - jobs appear immediately in Notion
- **Clean interface** - use Notion's native interface

## 🚀 Benefits

- **Simpler system** - No React app needed
- **Direct Notion access** - Use Notion's powerful interface
- **Better performance** - Fewer moving parts
- **Easier maintenance** - Just extension + server
- **Professional setup** - Clean, minimal architecture

Your job applications are now automatically tracked and organized in your Notion database! 🎯
