/* ------------------------------------------------------------------
 * 1️⃣  Helpers – detect “Apply / Submit” buttons
 * ------------------------------------------------------------------ */
const APPLY_BTN_SELECTORS = [
  'button',
  'a',
  'input[type="submit"]'
];

function isApplyBtn(el) {
  const txt = (el.innerText || '').toLowerCase();
  return (
    txt.includes('apply') ||
    txt.includes('submit') ||
    txt.includes('join the team') ||
    txt.includes('apply now')
  );
}

/* ------------------------------------------------------------------
 * 2️⃣  Build a very small job object
 * ------------------------------------------------------------------ */
function extractJob() {
  // Title
  const titleEl = document.querySelector('h1') || document.querySelector('h2');
  const title = titleEl?.innerText?.trim() || 'Unknown title';

  // Company – a handful of common selectors
  const companySelectors = [
    '.company',
    '.employer',
    '.companyName',
    '.jobsearch-CompanyInfoWithoutHeader',
    '.jobsearch-CompanyInfo',
    '.posted-company',
    '.text-muted'
  ];
  let company = 'Unknown company';
  for (const sel of companySelectors) {
    const el = document.querySelector(sel);
    if (el?.innerText) {
      company = el.innerText.trim();
      break;
    }
  }

  // URL + timestamp
  const url = window.location.href;
  const applied = new Date().toISOString();

  return { title, company, url, applied };
}

/* ------------------------------------------------------------------
 * 3️⃣  Simple toast helper
 * ------------------------------------------------------------------ */
function showToast(msg) {
  const div = document.createElement('div');
  div.textContent = msg;
  Object.assign(div.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#2d3748',
    color: '#fff',
    padding: '12px 18px',
    borderRadius: '8px',
    zIndex: 999999,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    fontFamily: 'sans-serif',
    fontSize: '14px'
  });
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

/* ------------------------------------------------------------------
 * 4️⃣  Listen for clicks
 * ------------------------------------------------------------------ */
document.body.addEventListener('click', e => {
  const btn = e.target.closest(APPLY_BTN_SELECTORS.join(','));
  if (!btn || !isApplyBtn(btn)) return;

  const job = extractJob();          // build the payload

  // Send it to the background worker
  chrome.runtime.sendMessage(
    { type: 'NEW_JOB', payload: job },
    response => {
      if (chrome.runtime.lastError) {
        console.error('Extension error:', chrome.runtime.lastError);
        showToast('⚠️  Extension failed to send job');
      } else if (response?.success) {
        showToast(`✅ Applied to "${job.title}" at ${job.company}`);
      } else {
        showToast(`⚠️  Failed to save job: ${response?.message || 'unknown'}`);
      }
    }
  );
});