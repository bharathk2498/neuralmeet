const config = {
  didApiKey: process.env.DID_API_KEY,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'https://bharathk2498.github.io',
  apiBaseUrl: 'https://api.d-id.com',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY
};

if (!config.didApiKey) {
  console.error('FATAL ERROR: DID_API_KEY not found in environment variables');
  console.error('Please add DID_API_KEY to your .env file or GitHub Secrets');
  process.exit(1);
}

module.exports = config;