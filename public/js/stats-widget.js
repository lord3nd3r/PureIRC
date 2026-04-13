/**
 * Stats Widget - Handles server statistics display and updates
 */

import apiClient from './api-client.js';

class StatsWidget {
  constructor() {
    this.usersOnlineElement = document.querySelector('[data-stat="users"]');
    this.channelsElement = document.querySelector('[data-stat="channels"]');
    this.uptimeElement = document.querySelector('[data-stat="uptime"]');
    this.statusIndicator = document.querySelector('[data-stat="status-indicator"]');
    this.refreshInterval = null;
  }

  /**
   * Initialize stats widget and start auto-refresh
   */
  async init() {
    console.log('[Stats] Initializing stats widget');
    
    try {
      await this.fetchAndUpdate();
      this.startAutoRefresh();
    } catch (err) {
      console.error('[Stats] Initialization error:', err);
      this.setOffline();
    }
  }

  /**
   * Fetch stats from API and update UI
   */
  async fetchAndUpdate() {
    try {
      const response = await apiClient.getNetworkSummary();
      
      if (response.success && response.data) {
        this.updateDisplay(response.data);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('[Stats] Fetch error:', err);
      this.setOffline();
      throw err;
    }
  }

  /**
   * Update display with stats data
   */
  updateDisplay(data) {
    // Update users online
    if (this.usersOnlineElement) {
      const currentValue = parseInt(this.usersOnlineElement.textContent) || 0;
      const newValue = data.usersOnline || 0;
      
      if (currentValue !== newValue) {
        this.animateUpdate(this.usersOnlineElement, newValue);
      }
    }

    // Update total channels
    if (this.channelsElement) {
      const currentValue = parseInt(this.channelsElement.textContent) || 0;
      const newValue = data.totalChannels || 0;
      
      if (currentValue !== newValue) {
        this.animateUpdate(this.channelsElement, newValue);
      }
    }

    // Update status indicator
    if (this.statusIndicator) {
      if (data.online) {
        this.statusIndicator.classList.remove('bg-red-400');
        this.statusIndicator.classList.add('bg-emerald-400');
      } else {
        this.statusIndicator.classList.remove('bg-emerald-400');
        this.statusIndicator.classList.add('bg-red-400');
      }
    }

    console.log('[Stats] Updated display:', data);
  }

  /**
   * Animate number update with fade effect
   */
  animateUpdate(element, newValue) {
    element.style.opacity = '0.5';
    setTimeout(() => {
      element.textContent = newValue.toLocaleString();
      element.style.opacity = '1';
    }, 150);
  }

  /**
   * Set offline status
   */
  setOffline() {
    if (this.usersOnlineElement) {
      this.usersOnlineElement.textContent = '0';
    }
    if (this.statusIndicator) {
      this.statusIndicator.classList.remove('bg-emerald-400');
      this.statusIndicator.classList.add('bg-red-400');
    }
  }

  /**
   * Start auto-refresh every 30 seconds
   */
  startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      try {
        await this.fetchAndUpdate();
      } catch (err) {
        console.error('[Stats] Auto-refresh error:', err);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Create global instance
window.statsWidget = new StatsWidget();

export default StatsWidget;
