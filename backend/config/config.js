const config = {
  didApiKey: process.env.DID_API_KEY,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  // Allow both local and production origins
  frontendUrl: process.env.NODE_ENV === 'production' 
    ? (process.env.FRONTEND_URL || 'https://bharathk2498.github.io')
    : 'http://127.0.0.1:5500',
  apiBaseUrl: 'https://api.d-id.com',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
};

// Only warn about missing API key instead of exiting
// This allows the server to start and show better error messages
if (!config.didApiKey) {
  console.warn('WARNING: DID_API_KEY not found in environment variables');
  console.warn('Clone creation will fail until API key is configured');
  console.warn('Set DID_API_KEY in Render dashboard Environment section');
}

module.exports = config;
