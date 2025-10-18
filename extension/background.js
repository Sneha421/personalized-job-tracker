// Background script for Job-Tracker browser extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'NEW_JOB') {
    console.log('Background: Received job data:', request.payload);
    
    // Store in localStorage for the React app to pick up
    try {
      localStorage.setItem('newJob', JSON.stringify(request.payload));
      localStorage.setItem('newJobTimestamp', Date.now().toString());
      
      // Also dispatch a custom event to notify the React app
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (jobData) => {
              // Dispatch custom event in the page context
              window.dispatchEvent(new CustomEvent('job-tracker-new-job', { 
                detail: jobData 
              }));
            },
            args: [request.payload]
          });
        }
      });
      
      console.log('Background: Job stored and event dispatched');
      sendResponse({ success: true, message: 'Job stored successfully' });
    } catch (error) {
      console.error('Background: Error storing job:', error);
      sendResponse({ success: false, message: error.message });
    }
  }
  
  return true; // Keep the message channel open for async response
});
