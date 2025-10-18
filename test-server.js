const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Test server is running!');
});

// Notion test route
app.post('/api/notion', (req, res) => {
  console.log('Received job data:', req.body);
  res.json({ 
    success: true, 
    id: 'test-' + Date.now(), 
    message: 'Test job added to Notion' 
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Test server listening on http://localhost:${PORT}`);
});


