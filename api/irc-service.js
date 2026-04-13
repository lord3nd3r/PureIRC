import IRCFramework from 'irc-framework';

/**
 * IRC Service - Connects to IRC server and retrieves channel/server data
 */
class IRCService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.channels = [];
    this.serverInfo = {};
    this.reconnectTimer = null;
    this.onReconnect = null; // callback for cache to know when we reconnect
  }

  /**
   * Connect to IRC server (persistent — auto-reconnects)
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        const config = {
          host: process.env.IRC_HOST || 'irc.pureirc.com',
          port: parseInt(process.env.IRC_PORT || 6667),
          nick: process.env.IRC_NICK || 'PureBot',
          username: process.env.IRC_USERNAME || 'purebot',
          realname: process.env.IRC_REALNAME || 'Pure IRC Bot',
          tls: process.env.IRC_USE_SSL === 'true',
          version: 'PureBot v1.0',
          auto_reconnect: false // we handle reconnect ourselves
        };

        console.log(`[IRC] Connecting to ${config.host}:${config.port}...`);

        this.client = new IRCFramework.Client(config);
        let resolved = false;

        // Connection established
        this.client.on('registered', () => {
          console.log('[IRC] Connected and registered');
          this.connected = true;
          if (!resolved) { resolved = true; resolve(this); }
        });

        // Error handling
        this.client.on('error', (error) => {
          console.error('[IRC] Error:', error);
        });

        // Connection lost — auto-reconnect
        this.client.on('socket close', () => {
          if (this.connected) {
            console.log('[IRC] Connection lost, reconnecting in 15s...');
          }
          this.connected = false;
          this._scheduleReconnect();
        });

        // Connect
        this.client.connect();

        // Setup timeout for initial connect only
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            this.disconnect();
            reject(new Error('IRC connection timeout'));
          }
        }, 15000);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Schedule a reconnect attempt
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        console.log('[IRC] Reconnected successfully');
        if (this.onReconnect) this.onReconnect();
      } catch (err) {
        console.error('[IRC] Reconnect failed:', err.message);
        // will retry via socket close handler
      }
    }, 15000);
  }

  /**
   * Disconnect from IRC server
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.client) {
      this.client.quit('Goodbye');
      this.connected = false;
    }
  }

  /**
   * Get list of all channels on the server
   * Returns array of { name, users, topic }
   */
  async getChannels() {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        return reject(new Error('IRC client not connected'));
      }

      const channels = [];
      let listFinished = false;

      const onList = (list) => {
        // irc-framework passes the channel array directly
        const items = Array.isArray(list) ? list : (list && list.channels ? list.channels : []);
        channels.push(...items.map(ch => ({
          name: ch.channel,
          users: ch.num_users || 0,
          topic: ch.topic || ''
        })));
      };

      const onListEnd = () => {
        this.client.removeListener('channel list end', onListEnd);
        this.client.removeListener('channel list', onList);
        listFinished = true;
        resolve(channels);
      };

      this.client.on('channel list', onList);
      this.client.on('channel list end', onListEnd);

      // Send LIST command
      this.client.raw('LIST');

      // Timeout after 15 seconds
      setTimeout(() => {
        if (!listFinished) {
          this.client.removeListener('channel list', onList);
          this.client.removeListener('channel list end', onListEnd);
          resolve(channels);
        }
      }, 15000);
    });
  }

  /**
   * Get channel info (name, user count, topic)
   */
  async getChannelInfo(channelName) {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        return reject(new Error('IRC client not connected'));
      }

      if (!channelName.startsWith('#')) {
        channelName = '#' + channelName;
      }

      let info = {
        name: channelName,
        users: 0,
        topic: '',
        modes: ''
      };

      const onTopic = (event) => {
        if (event.channel === channelName) {
          info.topic = event.topic;
        }
      };

      const onNames = (event) => {
        if (event.channel === channelName) {
          info.users = event.users.length;
        }
      };

      const cleanup = () => {
        this.client.removeListener('topic', onTopic);
        this.client.removeListener('userlist', onNames);
      };

      this.client.on('topic', onTopic);
      this.client.on('userlist', onNames);

      // Get channel info
      this.client.raw('TOPIC', channelName);
      this.client.raw('NAMES', channelName);

      setTimeout(() => {
        cleanup();
        resolve(info);
      }, 3000);
    });
  }

  /**
   * Get server statistics
   */
  async getServerStats() {
    return new Promise((resolve, reject) => {
      if (!this.connected || !this.client) {
        return reject(new Error('IRC client not connected'));
      }

      const stats = {
        timestamp: new Date(),
        connected: this.connected,
        host: process.env.IRC_HOST || 'irc.pureirc.com',
        port: parseInt(process.env.IRC_PORT || 6667),
        usersOnline: 0,
        totalChannels: 0,
        operators: 0,
        uptime: null
      };

      const onStats = (event) => {
        if (event.users !== undefined) {
          stats.usersOnline = event.users;
        }
        if (event.channels !== undefined) {
          stats.totalChannels = event.channels;
        }
        if (event.operators !== undefined) {
          stats.operators = event.operators;
        }
      };

      const onUnknownCommand = (event) => {
        // irc-framework emits LUSERS numerics as 'unknown command'
        if (event.command === '251') { // LUSERCLIENT: "There are X users and Y invisible on Z servers"
          // Global users from 266 is more accurate, but parse 251 as fallback
          const match = event.params[1].match(/There are (\d+) users and (\d+) invisible/);
          if (match) {
            stats.usersOnline = parseInt(match[1]) + parseInt(match[2]);
          }
        } else if (event.command === '266') { // GLOBALUSERS: params[1] is current global users
          stats.usersOnline = parseInt(event.params[1]) || stats.usersOnline;
        } else if (event.command === '254') { // LUSERCHANNELS: params[1] is channel count
          stats.totalChannels = parseInt(event.params[1]) || 0;
        } else if (event.command === '252') { // LUSEROP: params[1] is oper count
          stats.operators = parseInt(event.params[1]) || 0;
        }
      };

      this.client.on('unknown command', onUnknownCommand);

      // Request stats
      this.client.raw('LUSERS');

      setTimeout(() => {
        this.client.removeListener('unknown command', onUnknownCommand);
        resolve(stats);
      }, 3000);
    });
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.client !== null;
  }
}

export default IRCService;
