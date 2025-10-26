require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const cloneRoutes = require('./routes/clone');

const app = express();

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or curl requests
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://bharathk2498.github.io',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'http://localhost:3000',
      config.frontendUrl
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('github.io')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // Allow anyway in production to avoid breaking
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files publicly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/clone', cloneRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    hasApiKey: !!config.didApiKey,
    apiKeyStatus: config.didApiKey ? 'configured' : 'missing'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'NeuralMeet Backend API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/health',
      createClone: 'POST /api/clone/create',
      uploadVideo: 'POST /api/clone/upload-video',
      saveClone: 'POST /api/clone/save',
      getSavedClones: 'GET /api/clone/saved',
      getClone: 'GET /api/clone/saved/:id',
      updateUsage: 'PUT /api/clone/saved/:id/use',
      deleteSavedClone: 'DELETE /api/clone/saved/:id',
      getStatus: 'GET /api/clone/status/:talkId',
      getCredits: 'GET /api/clone/credits',
      deleteTalk: 'DELETE /api/clone/:talkId'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
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
  console.log('='.repeat(60));
  console.log('NeuralMeet Backend Server Started');
  console.log('='.repeat(60));
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`D-ID API Key: ${config.didApiKey ? 'Configured ✓' : 'Missing ✗'}`);
  console.log(`Frontend URL: ${config.frontendUrl}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(60));
  
  if (!config.didApiKey) {
    console.warn('\n⚠️  WARNING: D-ID API Key is missing!');
    console.warn('Clone creation will not work until you configure DID_API_KEY');
    console.warn('Set it in Render Dashboard > Environment section\n');
  }
});

module.exports = app;
