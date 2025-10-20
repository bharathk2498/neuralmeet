require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const cloneRoutes = require('./routes/clone');

const app = express();

// CORS configuration
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files publicly - FIXED PATH
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/clone', cloneRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    hasApiKey: !!config.didApiKey
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NeuralMeet Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      createClone: 'POST /api/clone/create',
      getStatus: 'GET /api/clone/status/:talkId',
      getCredits: 'GET /api/clone/credits',
      deleteClone: 'DELETE /api/clone/:talkId'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`D-ID API Key configured: ${config.didApiKey ? 'Yes' : 'No'}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
});

module.exports = app;