/* ----------------------------------------------------------
   1️⃣  Detect clicks on "Apply / Submit" buttons (Universal)
   ---------------------------------------------------------- */
const APPLY_BUTTONS = [
  'button',
  'a',
  'input[type="submit"]',
  '[role="button"]',
  '.btn',
  '.button'
];

function isApplyButton(el) {
  const txt = (el.innerText || '').toLowerCase();
  const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
  const title = (el.getAttribute('title') || '').toLowerCase();
  const className = (el.className || '').toLowerCase();
  
  // Check text content
  const textMatch = (
    txt.includes('apply') ||
    txt.includes('submit') ||
    txt.includes('join the team') ||
    txt.includes('apply now') ||
    txt.includes('submit application') ||
    txt.includes('send application') ||
    txt.includes('quick apply') ||
    txt.includes('easy apply') ||
    txt.includes('one-click apply')
  );
  
  // Check aria-label and title
  const ariaMatch = (
    ariaLabel.includes('apply') ||
    ariaLabel.includes('submit') ||
    title.includes('apply') ||
    title.includes('submit')
  );
  
  // Check common button classes
  const classMatch = (
    className.includes('apply') ||
    className.includes('submit') ||
    className.includes('btn-apply') ||
    className.includes('apply-btn')
  );
  
  return textMatch || ariaMatch || classMatch;
}

/* ----------------------------------------------------------
   2️⃣  Harvest job information (simple heuristics)
   ---------------------------------------------------------- */
async function extractJobData() {
  console.log('🤖 Using Groq AI to extract job data...');
  
  try {
    // Get the page content for AI analysis (limit size to avoid payload issues)
    const pageContent = document.documentElement.outerHTML.substring(0, 100000); // Limit to 100KB
    const url = window.location.href;
    
    console.log('📄 Sending page content to Groq AI...');
    
    // Call Groq AI extraction endpoint
    const response = await fetch('http://localhost:4000/api/groq-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageContent,
        url
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Groq AI extracted job data:', result.jobData);
      return result.jobData;
    } else {
      console.error('❌ Groq AI extraction failed:', response.status);
      return fallbackExtraction();
    }
  } catch (error) {
    console.error('❌ Groq AI extraction error:', error);
    return fallbackExtraction();
  }
}

/* ----------------------------------------------------------
   2️⃣  Fallback extraction (if Groq AI fails)
   ---------------------------------------------------------- */
function fallbackExtraction() {
  console.log('🔄 Using fallback extraction...');
  
  // 2.1  Job title - Universal extraction
  let jobTitle = 'Unknown title';
  
  // Try multiple title selectors
  const titleSelectors = [
    'h1', 'h2', 'h3',
    '.job-title', '.jobTitle', '.job_title',
    '[data-testid*="title"]', '[data-test*="title"]',
    '.title', '.job-title', '.position-title',
    'h1[class*="title"]', 'h2[class*="title"]',
    'h1[class*="job"]', 'h2[class*="job"]'
  ];
  
  for (const selector of titleSelectors) {
    const el = document.querySelector(selector);
    if (el?.innerText?.trim()) {
      jobTitle = el.innerText.trim();
      break;
    }
  }
  
  // If still unknown, try to extract from page title
  if (jobTitle === 'Unknown title') {
    const pageTitle = document.title;
    // Remove common suffixes
    jobTitle = pageTitle
      .replace(/\s*-\s*.*$/, '')
      .replace(/\s*\|\s*.*$/, '')
      .replace(/\s*at\s+.*$/, '')
      .trim();
  }

  // 2.2  Company name – Universal extraction
  let companyName = 'Unknown company';
  
  // Universal company selectors
  const companySelectors = [
    // LinkedIn specific
    '.job-details-jobs-unified-top-card__company-name',
    '.job-details-jobs-unified-top-card__company-name a',
    '.job-details-jobs-unified-top-card__company-name span',
    '[data-test-id="job-details-company-name"]',
    // Indeed
    '.jobsearch-CompanyInfoWithoutHeader',
    '.jobsearch-CompanyInfo',
    // Glassdoor
    '.employerName',
    // AngelList/Wellfound
    '.company-name',
    // Generic
    '.company', '.employer', '.companyName', '.company-name',
    '.employer-name', '.employerName', '.posted-company',
    '[class*="company"]', '[class*="employer"]',
    '[data-testid*="company"]', '[data-test*="company"]',
    // Common patterns
    'h2', 'h3', 'h4', 'h5', 'h6'
  ];
  
  // Try selectors first
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el?.innerText && el.innerText.trim() !== '') {
      const text = el.innerText.trim();
      // Filter out common non-company text
      if (text.length > 2 && text.length < 100 && 
          !text.includes('LinkedIn') && !text.includes('Jobs') && 
          !text.includes('Apply') && !text.includes('Submit') &&
          !text.includes('Posted') && !text.includes('ago')) {
        companyName = text;
        break;
      }
    }
  }
  
  // If still unknown, try to extract from page title
  if (companyName === 'Unknown company') {
    const pageTitle = document.title;
    const titleMatch = pageTitle.match(/at\s+([^|]+)/);
    if (titleMatch) {
      companyName = titleMatch[1].trim();
    }
  }
  
  // If still unknown, try to extract from URL
  if (companyName === 'Unknown company') {
    const url = window.location.href;
    // Extract company from URL patterns
    const urlMatch = url.match(/\/([^\/]+)\/jobs/) || url.match(/company\/([^\/]+)/);
    if (urlMatch) {
      companyName = urlMatch[1].replace(/-/g, ' ').replace(/_/g, ' ');
    }
  }

  // 2.3  URL of the posting
  const url = window.location.href;
  
  // 2.4  Timestamp
  const appliedAt = new Date().toISOString();
  
  // Debug logging
  console.log('Job-Tracker: Fallback extracted data:', {
    title: jobTitle,
    company: companyName,
    url,
    applied: appliedAt,
    site: window.location.hostname
  });
  
  return {
    title: jobTitle,
    company: companyName,
    url,
    applied: appliedAt
  };
}

/* ----------------------------------------------------------
   3️⃣  Post the job to localStorage for React app
   ---------------------------------------------------------- */
async function postJob(job) {
  console.log('Job-Tracker: Syncing job to Notion:', job);
  
  try {
    // Directly sync to Notion via local server
    console.log('📋 Syncing to Notion...');
    const response = await fetch('http://localhost:4000/api/notion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(job)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Job synced to Notion:', result);
      showToast(`✅ Applied to "${job.title}" at ${job.company} - Added to Notion!`);
    } else {
      console.error('❌ Notion sync failed:', response.status);
      showToast(`❌ Failed to sync "${job.title}" to Notion`);
    }
  } catch (error) {
    console.error('❌ Notion sync error:', error);
    showToast(`❌ Error syncing "${job.title}" to Notion`);
  }
}

/* ----------------------------------------------------------
   4️⃣  Small toast helper (visual feedback)
   ---------------------------------------------------------- */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.background = '#2d3748';
  toast.style.color = '#fff';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '6px';
  toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
  toast.style.zIndex = 999999;
  toast.style.fontFamily = 'sans-serif';
  toast.style.fontSize = '14px';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ----------------------------------------------------------
   5️⃣  Attach a global click listener
   ---------------------------------------------------------- */
function init() {
  console.log('🚀 Job-Tracker extension loaded and ready!');
  console.log('🔍 Extension is active on:', window.location.href);
  
  document.body.addEventListener('click', async (e) => {
    const el = e.target.closest(APPLY_BUTTONS.join(','));
    if (!el || !isApplyButton(el)) return;

    console.log('🎯 Apply button clicked:', el.innerText || el.textContent);
    
    // Optional: prevent the original navigation so you stay on the page
    // e.preventDefault();

    const job = await extractJobData();
    postJob(job);
  }, { capture: true, passive: true });
}

init();