/**
 * API Client - Centralized fetch wrapper for all API calls
 */

const API_BASE = '/api';

class APIClient {
  constructor(baseURL = API_BASE) {
    this.baseURL = baseURL;
  }

  /**
   * Make a GET request
   */
  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[API] GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[API] POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Get all channels
   */
  async getChannels() {
    return this.get('/channels');
  }

  /**
   * Get popular channels
   */
  async getPopularChannels(limit = 10) {
    return this.get(`/channels/popular?limit=${limit}`);
  }

  /**
   * Search channels
   */
  async searchChannels(query) {
    return this.get(`/channels/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get single channel info
   */
  async getChannel(name) {
    return this.get(`/channels/${encodeURIComponent(name)}`);
  }

  /**
   * Get server stats
   */
  async getStats() {
    return this.get('/stats');
  }

  /**
   * Get cache status
   */
  async getCacheStatus() {
    return this.get('/stats/cache-status');
  }

  /**
   * Get network summary
   */
  async getNetworkSummary() {
    return this.get('/stats/network-summary');
  }
}

const apiClient = new APIClient();
export default apiClient;
