// jobExtractor.js
const cheerio = require('cheerio');

async function extractJobData(pageContent, url) {
  console.log('🔍 Using simple HTML extraction...');

  try {
    const $ = cheerio.load(pageContent);

    // ---------- 1. Title ----------
    let title = '';

    // For LinkedIn: Look for the main job title
    if (url.includes('linkedin.com')) {
      // Try to find the actual job title by looking for specific LinkedIn selectors
      const jobTitleSelectors = [
        '.job-details-jobs-unified-top-card__job-title',
        '.job-details-jobs-unified-top-card__job-title h1',
        '.job-details-jobs-unified-top-card__job-title h2',
        '[data-testid="job-details-job-title"]',
        '.job-details-jobs-unified-top-card__job-title span'
      ];
      
      jobTitleSelectors.some(sel => {
        const el = $(sel).first();
        if (el.length && el.text().trim()) {
          const text = el.text().trim();
          // Only use if it looks like a real job title
          if (text.length > 10 && 
              !text.includes('Top job picks') && 
              !text.includes('Search all Jobs') &&
              !text.includes('Job search') &&
              !text.match(/^\(\d+\)/) &&
              !text.includes('LinkedIn')) {
            title = text;
            return true;
          }
        }
        return false;
      });
      
      // Fallback to h2 if no specific selectors worked
      if (!title) {
        const titleEl2 = $('h2').first();
        if (titleEl2.length && titleEl2.text().trim()) {
          const text = titleEl2.text().trim();
          if (text.length > 10 && 
              !text.includes('Top job picks') && 
              !text.includes('Search all Jobs') &&
              !text.match(/^\(\d+\)/)) {
            title = text;
          }
        }
      }
    } else {
      // For other sites, try h1, h2, h3
      ['h1', 'h2', 'h3'].some(tag => {
        const el = $(tag).first();
        if (el && el.text().trim()) {
          title = el.text().trim();
          return true;
        }
        return false;
      });
    }

    // Fallback to page title
    if (!title) {
      const rawTitle = $('title').first().text().trim();
      if (rawTitle) {
        title = rawTitle
          .replace(/\s*\|\s*.*$/, '')
          .replace(/\s*-\s*.*$/, '')
          .replace(/\s*at\s+.*$/i, '')
          .trim();
      }
    }

    // ---------- 2. Company ----------
    let company = '';

    // For LinkedIn: Look for company name
    if (url.includes('linkedin.com')) {
      // Try multiple LinkedIn company selectors
      const companySelectors = [
        '._company-name',
        '.job-details-jobs-unified-top-card__company-name',
        '.job-details-jobs-unified-top-card__company-name a',
        '.job-details-jobs-unified-top-card__company-name span',
        '[data-testid="job-details-company-name"]',
        '.job-details-jobs-unified-top-card__company-name div',
        '.company-name',
        '.company',
        '[class*="company"]',
        '[class*="employer"]'
      ];
      
      companySelectors.some(sel => {
        const el = $(sel).first();
        if (el.length && el.text().trim()) {
          const text = el.text().trim();
          // Filter out language options and other irrelevant text
          if (!text.includes('Deutsch') && 
              !text.includes('English') && 
              !text.includes('Français') && 
              !text.includes('日本語') && 
              !text.includes('简体中文') &&
              text.length < 100 && // Avoid very long text blocks
              text.length > 1) { // Avoid single characters
            company = text;
            return true;
          }
        }
        return false;
      });
    } else {
      // For other sites, try common company selectors
      const companySelectors = ['.company', '.employer', '[class*="company"]'];
      companySelectors.some(sel => {
        const el = $(sel).first();
        if (el && el.text().trim()) {
          company = el.text().trim();
          return true;
        }
        return false;
      });
    }

    // Fallback to title tag
    if (!company && $('title').length) {
      const rawTitle = $('title').first().text();
      const match = rawTitle.match(/at\s+([^|]+)/i);
      if (match) company = match[1].trim();
    }
    
    // LinkedIn-specific fallback: try to extract from title
    if (!company && url.includes('linkedin.com') && $('title').length) {
      const rawTitle = $('title').first().text();
      // Try "Job Title | Company Name" format first
      const parts = rawTitle.split('|');
      if (parts.length > 1) {
        company = parts[1].trim();
      } else {
        // Fallback to "at Company" format
        const match = rawTitle.match(/at\s+([^|]+)/i);
        if (match) {
          company = match[1].trim();
        }
      }
    }
    
    // Final fallback: try to find any text that looks like a company name
    if (!company && url.includes('linkedin.com')) {
      // Look for any text that might be a company name (but not job titles)
      const possibleCompanies = $('*').filter(function() {
        const text = $(this).text().trim();
        return text.length > 2 && 
               text.length < 50 && 
               !text.includes('LinkedIn') &&
               !text.includes('Jobs') &&
               !text.includes('Search') &&
               !text.includes('Apply') &&
               !text.includes('Save') &&
               !text.match(/^\(\d+\)/) &&
               !text.includes('Top job picks') &&
               !text.includes('Engineer') &&
               !text.includes('Developer') &&
               !text.includes('Manager') &&
               !text.includes('Analyst') &&
               !text.includes('Intern') &&
               !text.includes('Software') &&
               !text.includes('Machine Learning') &&
               !text.includes('Applied AI');
      });
      
      if (possibleCompanies.length > 0) {
        // Take the first reasonable company name
        company = possibleCompanies.first().text().trim();
      }
    }
    
    // Ultimate fallback: if still no company, use a generic name
    if (!company && url.includes('linkedin.com')) {
      company = 'LinkedIn Company';
    }

    // ---------- 3. Return ----------
    const hostname = new URL(url).hostname;
    const site = hostname.split('.').slice(-2).join('.');

    return {
      title: title || 'Job Application',
      company: company || `${hostname.split('.')[0]} Company`,
      url,
      applied: new Date().toISOString(),
      site,
    };
  } catch (err) {
    console.warn('❌ Job extraction failed:', err);
    const hostname = new URL(url).hostname;
    return {
      title: 'Job Application',
      company: `${hostname.split('.')[0]} Company`,
      url,
      applied: new Date().toISOString(),
      site: hostname,
    };
  }
}

module.exports = { extractJobData };