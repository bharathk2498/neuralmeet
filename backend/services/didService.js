const axios = require('axios');
const config = require('../config/config');

class DIDService {
  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Authorization': `Basic ${config.didApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async createTalk(audioUrl, imageUrl, options = {}) {
    try {
      const payload = {
        script: {
          type: 'audio',
          audio_url: audioUrl
        },
        source_url: imageUrl,
        config: {
          fluent: options.fluent || true,
          pad_audio: options.padAudio || 0,
          stitch: options.stitch || true
        }
      };

      console.log('Creating D-ID talk with payload:', JSON.stringify(payload, null, 2));

      const response = await this.client.post('/talks', payload);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('D-ID API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create talk',
        details: error.response?.data
      };
    }
  }

  async getTalkStatus(talkId) {
    try {
      const response = await this.client.get(`/talks/${talkId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get talk status:', error.message);
      throw new Error(`Failed to get talk status: ${error.message}`);
    }
  }

  async getCredits() {
    try {
      const response = await this.client.get('/credits');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Failed to get credits:', error.message);
      throw new Error(`Failed to get credits: ${error.message}`);
    }
  }

  async deleteTalk(talkId) {
    try {
      await this.client.delete(`/talks/${talkId}`);
      return {
        success: true,
        message: 'Talk deleted successfully'
      };
    } catch (error) {
      console.error('Failed to delete talk:', error.message);
      throw new Error(`Failed to delete talk: ${error.message}`);
    }
  }
}

module.exports = new DIDService();