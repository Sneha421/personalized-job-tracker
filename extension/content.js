/* ----------------------------------------------------------
   1️⃣  Detect clicks on “Apply / Submit” buttons
   ---------------------------------------------------------- */
   const APPLY_BUTTONS = [
    'button',
    'a',
    'input[type="submit"]'
  ];
  
  function isApplyButton(el) {
    const txt = (el.innerText || '').toLowerCase();
    return (
      txt.includes('apply') ||
      txt.includes('submit') ||
      txt.includes('join the team') ||
      txt.includes('apply now')
    );
  }
  
  /* ----------------------------------------------------------
     2️⃣  Harvest job information (simple heuristics)
     ---------------------------------------------------------- */
  function extractJobData() {
    // 2.1  Job title
    const titleEl = document.querySelector('h1') || document.querySelector('h2');
    const jobTitle = titleEl?.innerText?.trim() || 'Unknown title';
  
    // 2.2  Company name – a handful of common selectors
    const companySelectors = [
      '.company', '.employer', '.companyName', '.jobsearch-CompanyInfoWithoutHeader',
      '.jobsearch-CompanyInfo', '.posted-company', '.text-muted'
    ];
    let companyName = 'Unknown company';
    for (const sel of companySelectors) {
      const el = document.querySelector(sel);
      if (el?.innerText) {
        companyName = el.innerText.trim();
        break;
      }
    }
  
    // 2.3  URL of the posting
    const url = window.location.href;
  
    // 2.4  Timestamp
    const appliedAt = new Date().toISOString();
  
    return {
      title: jobTitle,
      company: companyName,
      url,
      applied: appliedAt
    };
  }
  
  /* ----------------------------------------------------------
     3️⃣  Post the job to the Vercel API
     ---------------------------------------------------------- */
  async function postJob(job) {
    // 👉 Your Netlify deployment URL
    const VERCEL_API = 'https://job-tracker-1760804473.netlify.app/.netlify/functions/add-job';
    
    console.log('Job-Tracker: Using API URL:', VERCEL_API);
    console.log('Job-Tracker: Sending job data:', job);
  
    try {
      const resp = await fetch(VERCEL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job)
      });
  
      if (!resp.ok) {
        const err = await resp.json();
        console.warn('Job‑Tracker: API error', err);
        throw new Error(`API ${resp.status}`);
      }
  
      const result = await resp.json();
      console.info('Job‑Tracker: job saved', result);
      showToast(`✅ Applied to "${job.title}" at ${job.company}`);
    } catch (err) {
      console.error('Job‑Tracker: network or server error', err);
      showToast('⚠️  Failed to save job');
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
    document.body.addEventListener('click', (e) => {
      const el = e.target.closest(APPLY_BUTTONS.join(','));
      if (!el || !isApplyButton(el)) return;
  
      // Optional: prevent the original navigation so you stay on the page
      // e.preventDefault();
  
      const job = extractJobData();
      postJob(job);
    }, { capture: true, passive: true });
  }
  
  init();