// Background script for Job-Tracker browser extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'NEW_JOB') {
    console.log('Background: Received job data:', request.payload);
    
    // Forward the message to all tabs with the React app
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        // Check if this is a localhost tab (React app)
        if (tab.url && tab.url.includes('localhost')) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (jobData) => {
              // Store in localStorage and dispatch event
              try {
                localStorage.setItem('newJob', JSON.stringify(jobData));
                localStorage.setItem('newJobTimestamp', Date.now().toString());
                
                // Dispatch custom event
                window.dispatchEvent(new CustomEvent('job-tracker-new-job', { 
                  detail: jobData 
                }));
                
                console.log('Job stored in localStorage and event dispatched');
              } catch (error) {
                console.error('Error storing job:', error);
              }
            },
            args: [request.payload]
          });
        }
      });
    });
    
    sendResponse({ success: true, message: 'Job forwarded to React app' });
  }
  
  return true; // Keep the message channel open for async response
});
