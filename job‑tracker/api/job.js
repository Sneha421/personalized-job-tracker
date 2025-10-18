export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }
  
  // Simple test endpoint that doesn't require authentication
  if (req.method === 'POST') {
    const job = req.body;
    console.log('Job received:', job);
    
    return res.status(200).json({
      success: true,
      message: 'Job received successfully',
      job: job
    });
  }
  
  return res.status(200).json({ 
    message: 'Job API is working',
    method: req.method
  });
}
