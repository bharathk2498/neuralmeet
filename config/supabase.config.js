// Supabase Configuration
// DO NOT COMMIT WITH REAL KEYS - Use environment variables in production

const SupabaseConfig = {
  url: 'https://axzvvnqasdsnopbzjqrq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4enZ2bnFhc2Rzbm9wYnpqcXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MTc5MjQsImV4cCI6MjA3NjM5MzkyNH0.Yw5PYzGAwOeTj0mgXQ5zYg_He045qO2j2c-Z40n5WIM'
};

// File upload constraints
const UploadConfig = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedVoiceTypes: ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'video/quicktime'],
  allowedVideoTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
  voiceDurationMin: 5 * 60, // 5 minutes in seconds
  videoDurationMin: 2 * 60  // 2 minutes in seconds
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseConfig, UploadConfig };
}