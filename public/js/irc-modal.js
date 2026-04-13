/**
 * IRC Modal - Handles web client modal and connection form
 */

import apiClient from './api-client.js';

class IRCModal {
  constructor() {
    this.modal = document.getElementById('irc-modal');
    this.connectForm = document.getElementById('irc-connect-form');
    this.frameContainer = document.getElementById('irc-frame-container');
    this.channelBar = document.getElementById('irc-channel-bar');
    this.nicknameInput = document.getElementById('irc-nickname');
    this.channelInput = document.getElementById('irc-channel-input');
    this.sslCheckbox = document.getElementById('irc-ssl');
    this.portDisplay = document.getElementById('irc-port-display');
    this.channelDisplay = document.getElementById('irc-channel-display');
    this.frame = document.getElementById('irc-frame');
    this.quickPicksContainer = document.getElementById('channel-quick-picks');
    this.switchInput = document.getElementById('irc-switch-input');
    this.channelBarPills = document.getElementById('irc-channel-bar-pills');

    this.currentChannel = '#PureIRC';
    this.connected = false;
    this.channels = [];

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal?.classList.contains('hidden')) {
        this.close();
      }
    });

    // Close by clicking backdrop
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // SSL checkbox
    this.sslCheckbox?.addEventListener('change', () => {
      this.updatePortDisplay();
    });

    // Connect button
    document.getElementById('irc-connect-btn')?.addEventListener('click', () => {
      this.connect();
    });

    // Nickname enter key
    this.nicknameInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.connect();
    });

    // Channel input enter key
    this.channelInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.connect();
    });

    // Switch channel enter key
    this.switchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.switchChannel();
    });

    // Channel switch button
    document.querySelector('[onclick="window.ircModal.switchChannel()"]')?.addEventListener('click', () => {
      this.switchChannel();
    });

    // Open in new tab
    document.querySelector('[onclick="window.ircModal.openInNewTab()"]')?.addEventListener('click', () => {
      this.openInNewTab();
    });

    // Close button
    document.querySelector('[onclick="window.ircModal.close()"]')?.addEventListener('click', () => {
      this.close();
    });
  }

  /**
   * Initialize and load channel data
   */
  async init() {
    try {
      const response = await apiClient.getChannels();
      if (response.success && response.data) {
        this.channels = response.data;
        this.populateQuickPicks();
      }
    } catch (err) {
      console.error('[IRC Modal] Error loading channels:', err);
    }
  }

  /**
   * Populate quick-pick channel buttons
   */
  populateQuickPicks() {
    if (!this.quickPicksContainer) return;

    this.quickPicksContainer.innerHTML = this.channels
      .slice(0, 9) // Limit to 9
      .map(ch => `
        <button type="button" 
                onclick="window.ircModal.pickChannel('${ch.name}')" 
                class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 hover:text-white font-mono transition-colors">
          ${ch.name}
        </button>
      `)
      .join('');
  }

  /**
   * Pick a channel from quick-pick
   */
  pickChannel(name) {
    this.channelInput.value = name;
    this.updateQuickPickActive(name);
  }

  /**
   * Update active quick-pick button
   */
  updateQuickPickActive(name) {
    document.querySelectorAll('#channel-quick-picks .channel-pill').forEach(btn => {
      if (btn.textContent.trim() === name) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Open modal with optional channel
   */
  open(channel = '#PureIRC') {
    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }

    this.currentChannel = channel;
    this.channelInput.value = channel;
    this.updateQuickPickActive(channel);

    this.modal?.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // If already connected, switch channel in-place
    if (this.connected) {
      this.switchIrcChannel(channel);
    } else {
      this.connectForm?.classList.remove('hidden');
      this.frameContainer?.classList.add('hidden');
      this.channelBar?.classList.add('hidden');
    }

    if (window.lucide) {
      lucide.createIcons();
    }
  }

  /**
   * Close modal
   */
  close() {
    this.modal?.classList.add('hidden');
    document.body.style.overflow = '';
  }

  /**
   * Update port display based on SSL checkbox
   */
  updatePortDisplay() {
    if (this.portDisplay) {
      this.portDisplay.textContent = this.sslCheckbox?.checked 
        ? '6697 (SSL)' 
        : '6667';
    }
  }

  /**
   * Connect to IRC
   */
  connect() {
    let nickname = (this.nicknameInput?.value || '').trim();
    let channel = (this.channelInput?.value || '').trim() || '#PureIRC';

    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }

    if (!nickname) {
      nickname = 'PureUser' + Math.floor(Math.random() * 9999);
      if (this.nicknameInput) {
        this.nicknameInput.value = nickname;
      }
    }

    // Validate nickname
    if (!/^[a-zA-Z_][a-zA-Z0-9_\-]{0,15}$/.test(nickname)) {
      nickname = 'PureUser' + Math.floor(Math.random() * 9999);
      if (this.nicknameInput) {
        this.nicknameInput.value = nickname;
      }
    }

    this.currentChannel = channel;
    this.connected = true;

    const url = this.buildKiwiUrl(nickname, channel);
    if (this.frame) {
      this.frame.src = url;
    }

    // Show iframe, hide form
    this.connectForm?.classList.add('hidden');
    this.frameContainer?.classList.remove('hidden');
    this.channelBar?.classList.remove('hidden');
    
    if (this.channelDisplay) {
      this.channelDisplay.textContent = channel;
    }

    this.renderChannelBar(channel);
  }

  /**
   * Build KiwiIRC URL
   */
  buildKiwiUrl(nickname, channel) {
    const channelClean = channel.startsWith('#') ? channel.substring(1) : channel;
    let url = `https://kiwiirc.com/nextclient/irc.pureirc.com/?nick=${encodeURIComponent(nickname)}`;
    url += `#${encodeURIComponent(channelClean)}`;
    return url;
  }

  /**
   * Render channel bar with quick switches
   */
  renderChannelBar(activeChannel) {
    if (!this.channelBarPills) return;

    this.channelBarPills.innerHTML = this.channels
      .slice(0, 9)
      .map(ch => {
        const isActive = ch.name === activeChannel;
        return `
          <button onclick="window.ircModal.switchIrcChannel('${ch.name}')" 
                  class="channel-pill text-xs px-3 py-1.5 rounded-full border border-white/10 text-gray-400 font-mono whitespace-nowrap transition-colors ${isActive ? 'active' : ''}">
            ${ch.name}
          </button>
        `;
      })
      .join('');
  }

  /**
   * Switch IRC channel
   */
  switchIrcChannel(channel) {
    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }

    this.currentChannel = channel;

    if (this.channelDisplay) {
      this.channelDisplay.textContent = channel;
    }

    const nickname = (this.nicknameInput?.value || '').trim() || 'PureUser' + Math.floor(Math.random() * 9999);
    const url = this.buildKiwiUrl(nickname, channel);

    if (this.frame) {
      this.frame.src = url;
    }

    this.renderChannelBar(channel);
  }

  /**
   * Switch channel from input
   */
  switchChannel() {
    let channel = (this.switchInput?.value || '').trim();
    if (!channel) return;

    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }

    if (this.switchInput) {
      this.switchInput.value = '';
    }

    this.switchIrcChannel(channel);
  }

  /**
   * Open in new tab
   */
  openInNewTab() {
    const nickname = (this.nicknameInput?.value || '').trim() || 'PureUser' + Math.floor(Math.random() * 9999);
    const url = this.buildKiwiUrl(nickname, this.currentChannel);
    window.open(url, '_blank');
  }
}

// Create global instance
window.ircModal = new IRCModal();

// Global functions for onclick handlers
window.openIrcModal = (channel) => window.ircModal.open(channel);
window.closeIrcModal = () => window.ircModal.close();

export default IRCModal;
