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
  }

  /**
   * Connect to IRC server
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
          version: 'PureBot v1.0'
        };

        console.log(`[IRC] Connecting to ${config.host}:${config.port}...`);

        this.client = new IRCFramework.Client(config);

        // Connection established
        this.client.on('registered', () => {
          console.log('[IRC] Connected and registered');
          this.connected = true;
          resolve(this);
        });

        // Error handling
        this.client.on('error', (error) => {
          console.error('[IRC] Error:', error);
          this.connected = false;
          reject(new Error(`IRC connection error: ${error}`));
        });

        // Connection lost
        this.client.on('socket close', () => {
          console.log('[IRC] Socket closed');
          this.connected = false;
        });

        // Connect
        this.client.connect();

        // Setup timeout
        setTimeout(() => {
          if (!this.connected) {
            this.disconnect();
            reject(new Error('IRC connection timeout'));
          }
        }, 10000);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Disconnect from IRC server
   */
  disconnect() {
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

      const onList = (event) => {
        if (event.channels) {
          channels.push(...event.channels.map(ch => ({
            name: ch.channel,
            users: ch.num_users || 0,
            topic: ch.topic || ''
          })));
        }
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

      const onServerNumeric = (event) => {
        // Parse server numeric replies
        if (event.command === '251') { // LUSERCLIENT
          const match = event.params[1].match(/There are (\d+) users/);
          if (match) {
            stats.usersOnline = parseInt(match[1]);
          }
        } else if (event.command === '254') { // LUSERCHANNELS
          stats.totalChannels = parseInt(event.params[1]);
        } else if (event.command === '252') { // LUSEROP
          stats.operators = parseInt(event.params[1]);
        }
      };

      this.client.on('server numeric 251', onServerNumeric);
      this.client.on('server numeric 254', onServerNumeric);
      this.client.on('server numeric 252', onServerNumeric);

      // Request stats
      this.client.raw('LUSERS');

      setTimeout(() => {
        this.client.removeListener('server numeric 251', onServerNumeric);
        this.client.removeListener('server numeric 254', onServerNumeric);
        this.client.removeListener('server numeric 252', onServerNumeric);
        resolve(stats);
      }, 2000);
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
