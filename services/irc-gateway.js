import { WebSocketServer } from 'ws';
import { Client as IrcClient } from 'irc-framework';

// Get IRC config from global app config or environment/defaults
function getIrcConfig() {
  const cfg = global.appConfig || {};
  const ircConfig = cfg.irc || {};
  
  return {
    host: process.env.IRC_HOST || ircConfig.host || 'irc.example.com',
    port: parseInt(process.env.IRC_PORT || ircConfig.port || 6667),
    sslPort: parseInt(process.env.IRC_SSL_PORT || ircConfig.portSSL || 6697),
    webircPassword: process.env.WEBIRC_PASSWORD || ''
  };
}

const WEBIRC_PASSWORD = process.env.WEBIRC_PASSWORD || '';
const MAX_CONNECTIONS_PER_IP = 3;
const CONNECTION_TIMEOUT = 30000;
const MAX_MESSAGE_LENGTH = 512;

// Strip IRC formatting codes (bold, color, underline, etc.)
function stripIrcFormatting(text) {
  if (!text) return '';
  return text
    .replace(/\x03(\d{1,2}(,\d{1,2})?)?/g, '')  // colors
    .replace(/[\x02\x0F\x16\x1D\x1F\x04]/g, '');  // bold, reset, reverse, italic, underline, hex color
}

// Track connections per IP
const ipConnectionCount = new Map();

export function attachGateway(server) {
  const wss = new WebSocketServer({ server, path: '/ws/irc' });

  wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    console.log(`[Gateway] New WebSocket connection from ${ip}`);

    // Rate limit per IP
    const count = ipConnectionCount.get(ip) || 0;
    if (count >= MAX_CONNECTIONS_PER_IP) {
      ws.close(4429, 'Too many connections');
      return;
    }
    ipConnectionCount.set(ip, count + 1);

    let ircClient = null;
    let connected = false;
    let joinedChannels = new Set();

    function send(data) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }

    function cleanup() {
      const current = ipConnectionCount.get(ip) || 1;
      if (current <= 1) {
        ipConnectionCount.delete(ip);
      } else {
        ipConnectionCount.set(ip, current - 1);
      }
      if (ircClient) {
        try { ircClient.quit('Web client disconnected'); } catch {}
        ircClient = null;
      }
      connected = false;
      joinedChannels.clear();
    }

    ws.on('close', (code, reason) => {
      console.log(`[Gateway] WebSocket closed: code=${code}, reason=${reason || 'none'}`);
      cleanup();
    });
    ws.on('error', (err) => {
      console.log(`[Gateway] WebSocket error:`, err.message || err);
      cleanup();
    });

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (!msg || typeof msg.type !== 'string') return;

      switch (msg.type) {
        case 'connect': {
          if (connected || ircClient) return;

          let nickname = String(msg.nickname || '').trim();
          if (!nickname || !/^[a-zA-Z_\[\]\\`^{}|][a-zA-Z0-9_\[\]\\`^{}|\-]{0,15}$/.test(nickname)) {
            nickname = 'PureUser' + Math.floor(Math.random() * 9999);
          }
          const useSSL = Boolean(msg.ssl);
          const CONFIG = getIrcConfig();
          const port = useSSL ? CONFIG.sslPort : CONFIG.port;

          console.log(`[Gateway] Connect request: nick=${nickname}, host=${CONFIG.host}, port=${port}, ssl=${useSSL}`);

          ircClient = new IrcClient();

          // Connection timeout
          const connectTimer = setTimeout(() => {
            if (!connected) {
              send({ type: 'error', message: 'Connection timed out' });
              ws.close();
            }
          }, CONNECTION_TIMEOUT);

          const connectOpts = {
            host: CONFIG.host,
            port: port,
            nick: nickname,
            username: 'webchat',
            gecos: 'Web Client',
            tls: useSSL,
            rejectUnauthorized: false,
            auto_reconnect: false,
          };

          // WEBIRC: pass the real client IP to the IRC server
          if (WEBIRC_PASSWORD) {
            connectOpts.webirc = {
              password: WEBIRC_PASSWORD,
              username: 'webchat',
              hostname: ip,
              address: ip,
            };
          }

          ircClient.connect(connectOpts);

          ircClient.on('error', (err) => {
            console.log(`[Gateway] IRC client error:`, err.message || err);
            send({ type: 'error', message: 'IRC connection error: ' + (err.message || 'Unknown error') });
          });

          ircClient.on('registered', () => {
            clearTimeout(connectTimer);
            connected = true;
            send({
              type: 'connected',
              nickname: ircClient.user.nick,
              server: CONFIG.host,
            });
          });

          ircClient.on('message', (event) => {
            send({
              type: 'message',
              nick: event.nick,
              target: event.target,
              message: stripIrcFormatting(event.message),
              isAction: event.type === 'action',
              time: Date.now(),
            });
          });

          ircClient.on('action', (event) => {
            send({
              type: 'message',
              nick: event.nick,
              target: event.target,
              message: stripIrcFormatting(event.message),
              isAction: true,
              time: Date.now(),
            });
          });

          ircClient.on('notice', (event) => {
            send({
              type: 'notice',
              nick: event.nick || '*',
              target: event.target,
              message: stripIrcFormatting(event.message),
              time: Date.now(),
            });
          });

          ircClient.on('join', (event) => {
            send({
              type: 'join',
              nick: event.nick,
              channel: event.channel,
              time: Date.now(),
            });
            // If it's us joining, request the user list
            if (event.nick === ircClient.user.nick) {
              joinedChannels.add(event.channel);
            }
          });

          ircClient.on('part', (event) => {
            send({
              type: 'part',
              nick: event.nick,
              channel: event.channel,
              message: event.message || '',
              time: Date.now(),
            });
            if (event.nick === ircClient.user.nick) {
              joinedChannels.delete(event.channel);
            }
          });

          ircClient.on('kick', (event) => {
            send({
              type: 'kick',
              nick: event.kicked,
              by: event.nick,
              channel: event.channel,
              reason: event.message || '',
              time: Date.now(),
            });
            if (event.kicked === ircClient.user.nick) {
              joinedChannels.delete(event.channel);
            }
          });

          ircClient.on('quit', (event) => {
            send({
              type: 'quit',
              nick: event.nick,
              message: event.message || '',
              time: Date.now(),
            });
          });

          ircClient.on('nick', (event) => {
            send({
              type: 'nick',
              oldNick: event.nick,
              newNick: event.new_nick,
              time: Date.now(),
            });
          });

          ircClient.on('topic', (event) => {
            send({
              type: 'topic',
              channel: event.channel,
              topic: stripIrcFormatting(event.topic),
              nick: event.nick || '',
              time: Date.now(),
            });
          });

          // irc-framework fires 'channel info' when joining a channel (RPL_TOPIC)
          ircClient.on('channel info', (event) => {
            if (event.topic) {
              send({
                type: 'topic',
                channel: event.channel,
                topic: stripIrcFormatting(event.topic),
                nick: '',
                time: Date.now(),
              });
            }
          });

          ircClient.on('userlist', (event) => {
            console.log(`[Gateway] Userlist for ${event.channel}:`, JSON.stringify(event.users.slice(0, 3)));
            send({
              type: 'userlist',
              channel: event.channel,
              users: event.users.map(u => ({
                nick: u.nick,
                modes: u.modes || [],
              })),
            });
          });

          ircClient.on('mode', (event) => {
            if (event.target && event.target.startsWith('#')) {
              // Normalize modes: irc-framework sends { mode: "+o", param: "nick" }
              // Frontend expects { mode: "o", adding: true, param: "nick" }
              const modes = (event.modes || []).map(m => {
                const raw = m.mode || '';
                const adding = raw.startsWith('+');
                const mode = raw.replace(/^[+-]/, '');
                return { mode, adding, param: m.param || '' };
              });
              send({
                type: 'mode',
                channel: event.target,
                nick: event.nick || '',
                modes: modes,
                time: Date.now(),
              });
            }
          });

          ircClient.on('motd', (event) => {
            send({
              type: 'motd',
              motd: stripIrcFormatting(event.motd),
              time: Date.now(),
            });
          });

          ircClient.on('nick in use', (event) => {
            const newNick = event.nick + '_';
            ircClient.changeNick(newNick);
            send({
              type: 'nick_in_use',
              oldNick: event.nick,
              newNick: newNick,
            });
          });

          ircClient.on('irc error', (event) => {
            send({
              type: 'irc_error',
              error: event.error,
              reason: event.reason || event.message || '',
              time: Date.now(),
            });
          });

          ircClient.on('close', () => {
            send({ type: 'disconnected', message: 'Connection to IRC server closed' });
            connected = false;
            ws.close();
          });

          ircClient.on('socket close', () => {
            if (connected) {
              send({ type: 'disconnected', message: 'Connection lost' });
              connected = false;
            }
            ws.close();
          });

          break;
        }

        case 'join': {
          if (!connected || !ircClient) return;
          let channel = String(msg.channel || '').trim();
          if (!channel) return;
          if (!channel.startsWith('#')) channel = '#' + channel;
          if (channel.length > 50) return;
          ircClient.join(channel);
          break;
        }

        case 'part': {
          if (!connected || !ircClient) return;
          let channel = String(msg.channel || '').trim();
          if (!channel) return;
          ircClient.part(channel);
          break;
        }

        case 'message': {
          if (!connected || !ircClient) return;
          let target = String(msg.target || '').trim();
          let text = String(msg.text || '').trim();
          if (!target || !text) return;
          if (text.length > MAX_MESSAGE_LENGTH) text = text.substring(0, MAX_MESSAGE_LENGTH);
          ircClient.say(target, text);
          // Echo back to sender
          send({
            type: 'message',
            nick: ircClient.user.nick,
            target: target,
            message: text,
            isAction: false,
            isSelf: true,
            time: Date.now(),
          });
          break;
        }

        case 'action': {
          if (!connected || !ircClient) return;
          let target = String(msg.target || '').trim();
          let text = String(msg.text || '').trim();
          if (!target || !text) return;
          if (text.length > MAX_MESSAGE_LENGTH) text = text.substring(0, MAX_MESSAGE_LENGTH);
          ircClient.action(target, text);
          send({
            type: 'message',
            nick: ircClient.user.nick,
            target: target,
            message: text,
            isAction: true,
            isSelf: true,
            time: Date.now(),
          });
          break;
        }

        case 'nick': {
          if (!connected || !ircClient) return;
          let newNick = String(msg.nickname || '').trim();
          if (!newNick || !/^[a-zA-Z_\[\]\\`^{}|][a-zA-Z0-9_\[\]\\`^{}|\-]{0,15}$/.test(newNick)) return;
          ircClient.changeNick(newNick);
          break;
        }

        case 'raw': {
          if (!connected || !ircClient) return;
          let line = String(msg.line || '').trim();
          if (!line || line.length > MAX_MESSAGE_LENGTH) return;
          ircClient.raw(line);
          break;
        }
      }
    });
  });

  console.log('[Gateway] WebSocket-to-IRC gateway attached at /ws/irc');
  return wss;
}
