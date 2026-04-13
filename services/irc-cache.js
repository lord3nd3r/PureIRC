import IRCService from '../api/irc-service.js';

/**
 * IRC Cache Service - Caches IRC queries with TTL
 */
class IRCCache {
  constructor() {
    this.cache = {
      channels: {
        data: null,
        timestamp: null,
        ttl: 5 * 60 * 1000 // 5 minutes
      },
      stats: {
        data: null,
        timestamp: null,
        ttl: 5 * 60 * 1000 // 5 minutes
      }
    };

    this.ircService = new IRCService();
    this.connected = false;
    this.refreshInterval = null;

    // When the bot reconnects, refresh data immediately
    this.ircService.onReconnect = () => {
      this.connected = true;
      console.log('[Cache] Bot reconnected, refreshing data...');
      this.refreshChannels().catch(() => {});
      this.refreshStats().catch(() => {});
    };

    this.init();
  }

  /**
   * Initialize IRC connection and periodic refresh
   */
  async init() {
    try {
      await this.ircService.connect();
      this.connected = true;
      console.log('[Cache] IRC connection established');

      // Do initial fetch
      await this.refreshChannels();
      await this.refreshStats();

      // Set up periodic refresh
      this.startPeriodicRefresh();
    } catch (err) {
      console.error('[Cache] Failed to initialize:', err.message);
      this.connected = false;
      // Retry connection every 10 seconds
      setTimeout(() => this.init(), 10000);
    }
  }

  /**
   * Start periodic cache refresh
   */
  startPeriodicRefresh() {
    // Refresh every 5 minutes
    const REFRESH_MS = 5 * 60 * 1000;

    this.refreshInterval = setInterval(async () => {
      if (!this.connected) {
        console.log('[Cache] Not connected, skipping refresh');
        return;
      }

      try {
        await this.refreshChannels();
        await this.refreshStats();
        console.log('[Cache] Periodic refresh completed');
      } catch (err) {
        console.error('[Cache] Refresh error:', err.message);
      }
    }, REFRESH_MS);
  }

  /**
   * Refresh channel list from IRC
   */
  async refreshChannels() {
    try {
      const channels = await this.ircService.getChannels();
      
      // Format channels
      const formatted = channels.map(ch => ({
        name: ch.name || '#unknown',
        users: ch.users || 0,
        topic: ch.topic || 'No topic set'
      }));

      // Sort by user count descending
      formatted.sort((a, b) => b.users - a.users);

      this.cache.channels.data = formatted;
      this.cache.channels.timestamp = Date.now();

      console.log(`[Cache] Fetched ${formatted.length} channels`);
      return formatted;
    } catch (err) {
      console.error('[Cache] Error fetching channels:', err.message);
      throw err;
    }
  }

  /**
   * Refresh server stats from IRC
   */
  async refreshStats() {
    try {
      const stats = await this.ircService.getServerStats();
      
      this.cache.stats.data = {
        ...stats,
        cached: true,
        cachedAt: new Date().toISOString()
      };
      this.cache.stats.timestamp = Date.now();

      console.log(`[Cache] Fetched server stats: ${stats.usersOnline} users online`);
      return this.cache.stats.data;
    } catch (err) {
      console.error('[Cache] Error fetching stats:', err.message);
      throw err;
    }
  }

  /**
   * Get cached channels (with TTL check)
   */
  async getChannels() {
    const now = Date.now();
    const isExpired = !this.cache.channels.timestamp || 
                      (now - this.cache.channels.timestamp) > this.cache.channels.ttl;

    if (isExpired && this.connected) {
      console.log('[Cache] Channels cache expired, refreshing...');
      await this.refreshChannels();
    }

    return this.cache.channels.data || [];
  }

  /**
   * Get cached stats (with TTL check)
   */
  async getStats() {
    const now = Date.now();
    const isExpired = !this.cache.stats.timestamp || 
                      (now - this.cache.stats.timestamp) > this.cache.stats.ttl;

    if (isExpired && this.connected) {
      console.log('[Cache] Stats cache expired, refreshing...');
      await this.refreshStats();
    }

    return this.cache.stats.data || {
      timestamp: new Date(),
      connected: this.connected,
      host: process.env.IRC_HOST || 'irc.pureirc.com',
      port: parseInt(process.env.IRC_PORT || 6667),
      usersOnline: 0,
      totalChannels: 0,
      operators: 0
    };
  }

  /**
   * Get cache status
   */
  getStatus() {
    return {
      connected: this.connected,
      channels: {
        count: this.cache.channels.data ? this.cache.channels.data.length : 0,
        cached: !!this.cache.channels.data,
        age: this.cache.channels.timestamp ? Date.now() - this.cache.channels.timestamp : null,
        ttl: this.cache.channels.ttl
      },
      stats: {
        cached: !!this.cache.stats.data,
        age: this.cache.stats.timestamp ? Date.now() - this.cache.stats.timestamp : null,
        ttl: this.cache.stats.ttl
      }
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.ircService) {
      this.ircService.disconnect();
    }
  }
}

// Singleton instance
let cacheInstance = null;

export function getCache() {
  if (!cacheInstance) {
    cacheInstance = new IRCCache();
  }
  return cacheInstance;
}

export default getCache;
