// Backend Configuration
// Toggle MOCK_MODE to test without backend deployment

const BACKEND_CONFIG = {
  // 🚀 PRODUCTION MODE ENABLED - Using live backend on Render
  MOCK_MODE: false,
  
  // Local development
  local: 'http://localhost:3000',
  
  // Production - Render deployment URL
  production: 'https://neuralmeet.onrender.com',
  
  // Auto-detect environment
  get url() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? this.local
      : this.production;
  }
};

// Mock responses for testing without backend
const MOCK_API = {
  async checkHealth() {
    console.log('🔧 MOCK MODE: Health check');
    await new Promise(r => setTimeout(r, 500));
    return {
      status: 'healthy (mock)',
      timestamp: new Date().toISOString(),
      environment: 'development',
      hasApiKey: true
    };
  },

  async getCredits() {
    console.log('🔧 MOCK MODE: Getting credits');
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      credits: {
        remaining: 95,
        total: 100
      }
    };
  },

  async createClone(audioFile, imageFile) {
    console.log('🔧 MOCK MODE: Creating clone with:', {
      audio: audioFile?.name,
      image: imageFile?.name
    });
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 2000));
    
    // Generate unique talk ID
    const talkId = 'mock-talk-' + Date.now();
    
    return {
      success: true,
      talkId: talkId,
      data: {
        talk_id: talkId,
        status: 'created',
        result_url: 'https://via.placeholder.com/600x400/6366f1/ffffff?text=Mock+AI+Clone+Created',
        message: '✅ Mock clone created! Backend not deployed yet.'
      }
    };
  },

  async getCloneStatus(talkId) {
    console.log('🔧 MOCK MODE: Getting status for:', talkId);
    await new Promise(r => setTimeout(r, 1000));
    
    return {
      success: true,
      data: {
        status: 'done',
        result_url: 'https://via.placeholder.com/600x400/10b981/ffffff?text=Clone+Generation+Complete',
        created_at: new Date().toISOString()
      }
    };
  },

  async deleteClone(talkId) {
    console.log('🔧 MOCK MODE: Deleting clone:', talkId);
    await new Promise(r => setTimeout(r, 500));
    
    return {
      success: true,
      message: 'Clone deleted (mock)'
    };
  }
};

// Real API Functions
const REAL_API = {
  async checkHealth() {
    const response = await fetch(`${BACKEND_CONFIG.url}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async getCredits() {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/credits`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async createClone(audioFile, imageFile) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('image', imageFile);

    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/create`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async getCloneStatus(talkId) {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/status/${talkId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  async deleteClone(talkId) {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/${talkId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }
};

// Unified API - automatically uses mock or real based on MOCK_MODE
const API = BACKEND_CONFIG.MOCK_MODE ? MOCK_API : REAL_API;

// Log current mode on load
console.log(
  BACKEND_CONFIG.MOCK_MODE 
    ? '🔧 MOCK MODE ENABLED - Backend not required. UI testing only.' 
    : `🚀 PRODUCTION MODE - Using backend at ${BACKEND_CONFIG.url}`
);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BACKEND_CONFIG, API };
}