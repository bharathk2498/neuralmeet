// Backend Configuration
// Your backend is deployed and uses the GitHub Secret for API key

const BACKEND_CONFIG = {
  // Local development
  local: 'http://localhost:3000',
  
  // Production - update this after deploying to Render/Railway/Vercel
  production: 'https://neuralmeet-backend.onrender.com',
  
  // Auto-detect environment
  get url() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? this.local
      : this.production;
  }
};

// API Helper Functions
const API = {
  async checkHealth() {
    const response = await fetch(`${BACKEND_CONFIG.url}/health`);
    return response.json();
  },

  async getCredits() {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/credits`);
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

    return response.json();
  },

  async getCloneStatus(talkId) {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/status/${talkId}`);
    return response.json();
  },

  async deleteClone(talkId) {
    const response = await fetch(`${BACKEND_CONFIG.url}/api/clone/${talkId}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BACKEND_CONFIG, API };
}
