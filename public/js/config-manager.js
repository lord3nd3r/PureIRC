/**
 * Config Manager - Loads and provides access to application configuration
 */

class ConfigManager {
  constructor() {
    this.config = null;
    this.isLoaded = false;
  }

  /**
   * Load config from API endpoint
   */
  async load() {
    if (this.isLoaded) return this.config;

    try {
      const response = await fetch('/api/config');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.status}`);
      }
      this.config = await response.json();
      this.isLoaded = true;
      console.log('[Config] Loaded successfully', this.config);
      return this.config;
    } catch (error) {
      console.error('[Config] Failed to load:', error);
      // Return default config on error
      this.config = this.getDefaultConfig();
      this.isLoaded = true;
      return this.config;
    }
  }

  /**
   * Get default config (fallback)
   */
  getDefaultConfig() {
    return {
      site: {
        name: 'PureIRC',
        fullName: 'PureIRC Network',
        domain: 'pureirc.com',
        description: 'A free, open, and welcoming IRC network.',
        favicon: 'vite.svg'
      },
      irc: {
        host: 'irc.pureirc.com',
        port: 6667,
        portSSL: 6697,
        defaultChannel: '#PureIRC',
        botName: 'PureBot',
        botUsername: 'purebot',
        botRealname: 'Pure IRC Bot',
        botVersion: 'PureBot v1.0',
        userPrefix: 'PureUser'
      },
      branding: {
        accentColor: 'cyan',
        primaryColor: '#06b6d4',
        icon: 'radio'
      },
      ui: {
        pageTitle: 'PureIRC — Free IRC Network',
        chatPageTitle: 'PureIRC — Web Chat',
        headerTitle: 'PureIRC Web Client',
        modalTitle: 'Connect to PureIRC'
      },
      social: {
        supportEmail: 'support@pureirc.com',
        supportChannel: '#help',
        githubUrl: 'https://github.com/pureirc/network-website'
      }
    };
  }

  /**
   * Get nested config value with dot notation
   */
  get(key, defaultValue = null) {
    if (!this.isLoaded) {
      console.warn('[Config] Config not loaded, using default');
      return defaultValue;
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Check if config is ready
   */
  isReady() {
    return this.isLoaded && this.config !== null;
  }
}

// Create global instance
window.configManager = new ConfigManager();
