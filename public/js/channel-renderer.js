/**
 * Channel Renderer - Handles rendering and updates of channel grid
 */

import apiClient from './api-client.js';

class ChannelRenderer {
  constructor() {
    this.grid = document.getElementById('channels-grid');
    this.channels = [];
    this.refreshInterval = null;
    this.categoryColors = {
      General: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      Support: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      Technology: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      Gaming: "text-orange-400 bg-orange-500/10 border-orange-500/20",
      Entertainment: "text-pink-400 bg-pink-500/10 border-pink-500/20"
    };
  }

  /**
   * Initialize renderer and start auto-refresh
   */
  async init() {
    console.log('[Renderer] Initializing channel renderer');
    
    try {
      await this.fetchAndRender();
      this.startAutoRefresh();
    } catch (err) {
      console.error('[Renderer] Initialization error:', err);
      this.showError('Failed to load channels');
    }
  }

  /**
   * Fetch channels from API and render
   */
  async fetchAndRender() {
    try {
      const response = await apiClient.getChannels();
      
      if (response.success && response.data) {
        this.channels = response.data;
        this.render();
        console.log(`[Renderer] Rendered ${this.channels.length} channels`);
      } else {
        throw new Error('Invalid API response');
      }
    } catch (err) {
      console.error('[Renderer] Fetch error:', err);
      throw err;
    }
  }

  /**
   * Render channels to grid
   */
  render() {
    if (!this.grid) {
      console.warn('[Renderer] Grid element not found');
      return;
    }

    // Get featured channels from config
    const config = window.SITE_CONFIG || {};
    const featuredChannels = window.appConfig?.ui?.channelsDisplay?.featuredChannels || ['#3nd3r', '#chat', '#help'];
    const maxDisplay = window.appConfig?.ui?.channelsDisplay?.maxChannels || 18;
    
    const featuredNames = featuredChannels.map(ch => ch.toLowerCase());
    const featured = this.channels.filter(ch => featuredNames.includes(ch.name.toLowerCase()));
    const unpinned = this.channels.filter(ch => !featuredNames.includes(ch.name.toLowerCase()));

    // Combine: featured first, then rest sorted by user count
    const sorted = [
      ...featured.sort((a, b) => a.name.localeCompare(b.name)),
      ...unpinned.sort((a, b) => b.users - a.users)
    ];

    // Render top N channels based on config
    const displayed = sorted.slice(0, maxDisplay);

    this.grid.innerHTML = displayed.map(ch => this.createChannelCard(ch, featuredNames)).join('');

    // Re-initialize Lucide icons for new content
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * Create a channel card HTML
   */
  createChannelCard(channel, featuredNames = []) {
    const { name, users, topic } = channel;
    const category = this.categorizeChannel(name);
    const colorClass = this.categoryColors[category] || "text-gray-400 bg-white/5 border-white/10";
    const isFeatured = featuredNames.includes(name.toLowerCase());

    return `
      <div onclick="window.channelRenderer.openChannelModal('${name}')" 
           class="group bg-gray-900 hover:bg-gray-800/80 border border-white/5 hover:border-white/10 rounded-xl p-5 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <i data-lucide="hash" class="w-4 h-4 text-cyan-400"></i>
            </div>
            <span class="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">${name}</span>
          </div>
          ${isFeatured ? '<span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">Featured</span>' : ''}
        </div>
        <p class="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">${topic}</p>
        <div class="flex items-center justify-between">
          <span class="text-xs px-2.5 py-1 rounded-full border font-medium ${colorClass}">${category}</span>
          <div class="flex items-center gap-1.5 text-xs text-gray-500">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            ${users.toLocaleString()}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Categorize channel based on name
   */
  categorizeChannel(name) {
    const nameLower = name.toLowerCase();
    
    if (['#pureirc', '#chat', '#dennis', '#canada', '#1up', '#idle-chat'].includes(nameLower)) return 'General';
    if (['#help'].includes(nameLower)) return 'Support';
    if (['#routing', '#pureirc.us', '#pureirc.com', '#versailles'].includes(nameLower)) return 'Network';
    if (['#irpg', '#gaming', '#games'].includes(nameLower)) return 'Gaming';
    if (['#ascii', '#buzznet', '#eulenspiegal', '#godzilla'].includes(nameLower)) return 'Entertainment';
    
    return 'General';
  }

  /**
   * Start auto-refresh every 30 seconds
   */
  startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      try {
        await this.fetchAndRender();
      } catch (err) {
        console.error('[Renderer] Auto-refresh error:', err);
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

  /**
   * Open IRC modal with channel
   */
  openChannelModal(channelName) {
    if (window.openIrcModal) {
      window.openIrcModal(channelName);
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    if (this.grid) {
      this.grid.innerHTML = `
        <div class="col-span-full bg-red-950/30 border border-red-500/30 rounded-xl p-6 text-center">
          <p class="text-sm text-red-300">${message}</p>
          <button onclick="window.location.reload()" class="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-colors">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Create global instance
window.channelRenderer = new ChannelRenderer();

export default ChannelRenderer;
