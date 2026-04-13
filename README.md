# PureIRC

A modern IRC network website with a built-in WebSocket-to-IRC gateway, tabbed web chat client, real-time channel data, and dynamic server statistics. Currently powering [3nd3r.net](http://snek.3nd3r.net:3000).

## Features

**Web IRC Client**
- Custom WebSocket-to-IRC gateway — no third-party embed required
- Tabbed interface with per-channel message buffers (like a real IRC client)
- Status window for MOTD, server notices, and connection events
- User list sidebar with full prefix support (~, &, @, %, +)
- Optional NickServ password field for auto-identify on connect
- Comprehensive command support: channel ops, services, oper commands, and more
- Unread tab indicators, maximize mode, and standalone `/chat` page
- IRC formatting codes stripped automatically

**Live Channel Data**
- Real-time user count per channel
- Dynamic channel list synced with IRC server (top 18 displayed)
- Auto-refresh every 45 seconds

**Server Statistics**
- Total users online, channel count, operator count
- Updates every 30 seconds

**Modern Dark UI**
- Tailwind CSS dark theme with responsive design
- Lucide icons (bundled locally)
- Smooth animations and transitions
- **6 built-in themes** (Cyan, Purple, Emerald, Rose, Amber, Blue)
- Theme switcher dropdown in header

**Configurable Branding**
- Centralized `config.json` for site name, IRC host, tagline, colors, and more
- Environment variables override config values
- Easy to adapt for different IRC networks without code changes

**Production-Ready Backend**
- Node.js / Express REST API
- IRC protocol integration with in-memory cache
- Helmet.js security headers, CORS, gzip compression
- WebSocket gateway with per-IP rate limiting
- No-cache headers for JS/HTML to prevent stale client code

---

## Quick Start

### Requirements
- Node.js 18+ ([download](https://nodejs.org/))
- npm 9+ (included with Node.js)
- A server/VPS with outbound access to IRC port 6667

### Installation

```bash
# Clone the repository
git clone https://github.com/lord3nd3r/PureIRC.git
cd PureIRC

# Install dependencies
npm install

# Copy the example environment file and edit it
cp .env.example .env
nano .env  # or your preferred editor

# Start the server
npm start
```

The server starts on port 3000 by default. Visit **http://localhost:3000** to see the site, and **http://localhost:3000/chat** for the standalone IRC web client.

### Configuration (config.json)

The site branding, IRC host, and all UI text is configured in `config.json`. You can edit this file to customize the website for different IRC networks without modifying any code.

**Key configuration options:**

```json
{
  "site": {
    "name": "3nd3r.net",
    "fullName": "3nd3r.net Network",
    "domain": "3nd3r.net",
    "tagline": "The Internet\nRelay Chat Network",
    "description": "A free, open... network."
  },
  "irc": {
    "host": "irc.rizon.net",
    "port": 6667,
    "portSSL": 6697,
    "defaultChannel": "#3nd3r"
  },
  "branding": {
    "defaultTheme": "cyan",
    "icon": "radio"
  },
  "ui": {
    "showThemeSwitcher": true
  }
}
```

**Environment variable overrides:**

Create a `.env` file to override config values:

```env
IRC_HOST=irc.example.com
IRC_PORT=6667
IRC_SSL_PORT=6697
```

The priority is: Environment Variables > config.json > Defaults

### Themes

The site includes 6 built-in themes. Change the theme by editing `config.json`:

```json
{
  "branding": {
    "defaultTheme": "purple"
  },
  "ui": {
    "showThemeSwitcher": true
  }
}
```

Users can also pick their preferred theme (stored in browser localStorage) if the switcher is enabled.

**Available themes:**

| Theme | Color | Hex |
|-------|-------|-----|
| Cyan | Cool cyan | #06b6d4 |
| Purple | Elegant purple | #a855f7 |
| Emerald | Fresh green | #10b981 |
| Rose | Warm pink | #f43f5e |
| Amber | Warm gold | #f59e0b |
| Blue | Classic blue | #3b82f6 |

To add new themes, add them to the `themes` object in `config.json`.

---

## Web Chat Commands

The built-in web chat client supports a comprehensive set of IRC commands. Type `/help` in the client to see the full list.

### Channel
| Command | Description |
|---------|-------------|
| `/join #channel` | Join a channel |
| `/part [#channel]` | Leave current or specified channel |
| `/topic [text]` | View or set channel topic |
| `/invite nick [#channel]` | Invite a user to channel |
| `/cycle` | Part and rejoin current channel |
| `/names` | Refresh the user list |

### User Modes
| Command | Description |
|---------|-------------|
| `/op nick` | Give operator (+o) |
| `/deop nick` | Remove operator (-o) |
| `/voice nick` | Give voice (+v) |
| `/devoice nick` | Remove voice (-v) |
| `/hop nick` | Give halfop (+h) |
| `/dehop nick` | Remove halfop (-h) |
| `/admin nick` | Give admin/protect (+a) |
| `/deadmin nick` | Remove admin (-a) |
| `/owner nick` | Give owner (+q) |
| `/deowner nick` | Remove owner (-q) |
| `/kick nick [reason]` | Kick a user |
| `/ban mask` | Set a ban (+b) |
| `/unban mask` | Remove a ban (-b) |
| `/kickban nick [reason]` | Ban then kick |
| `/mode [modes]` | Set arbitrary channel/user modes |

### Services
| Command | Description |
|---------|-------------|
| `/ns <command>` | Send to NickServ |
| `/cs <command>` | Send to ChanServ |
| `/ms <command>` | Send to MemoServ |
| `/bs <command>` | Send to BotServ |
| `/hs <command>` | Send to HostServ |
| `/os <command>` | Send to OperServ |
| `/identify <password>` | Identify with NickServ |
| `/ghost nick [pass]` | Ghost a nickname |
| `/regain nick [pass]` | Regain a nickname |

### Chat
| Command | Description |
|---------|-------------|
| `/msg nick text` | Private message |
| `/notice nick text` | Send a notice |
| `/me action` | Action message |
| `/ctcp nick command` | Send CTCP |

### Info
| Command | Description |
|---------|-------------|
| `/whois nick` | WHOIS query |
| `/whowas nick` | WHOWAS query |
| `/who [target]` | WHO query |
| `/list` | List channels |
| `/motd` | View MOTD |
| `/version` | Server version |
| `/time` | Server time |
| `/ping` | Ping server |
| `/stats [type]` | Server stats |

### IRCop Commands
| Command | Description |
|---------|-------------|
| `/oper user pass` | Authenticate as oper |
| `/kill nick [reason]` | Kill a user |
| `/kline [time] mask :reason` | K-line a user |
| `/unkline mask` | Remove K-line |
| `/gline mask` | G-line a user |
| `/ungline mask` | Remove G-line |
| `/zline ip` | Z-line an IP |
| `/unzline ip` | Remove Z-line |
| `/dline ip` | D-line an IP |
| `/undline ip` | Remove D-line |
| `/wallops text` | Broadcast to opers (wallops) |
| `/globops text` | Broadcast to opers (globops) |
| `/sajoin nick #channel` | Force-join a user |
| `/sapart nick #channel` | Force-part a user |
| `/sanick nick newnick` | Force nick change |
| `/samode target modes` | Force mode change |
| `/chghost nick hostname` | Change a user's host |
| `/sethost hostname` | Set your own host |
| `/chgident nick ident` | Change a user's ident |
| `/chgname nick :realname` | Change a user's realname |
| `/userip nick` | Get user's IP |
| `/squit server` | Disconnect a server |
| `/rehash` | Rehash IRCd config |
| `/die` | Shut down the IRCd |
| `/restart` | Restart the IRCd |
| `/map` | Show server map |
| `/links` | Show server links |
| `/trace [target]` | Trace route |
| `/modules` | List loaded modules |

### Other
| Command | Description |
|---------|-------------|
| `/nick newnick` | Change nickname |
| `/away [message]` | Set away status |
| `/back` | Clear away status |
| `/quit [message]` | Disconnect |
| `/clear` | Clear current buffer |
| `/raw <line>` | Send raw IRC command |
| `/help` | Show command list |

Any unrecognized `/command` is sent as a raw IRC line.

---

## Production Deployment (systemd)

Create a systemd service so it runs on boot and restarts on crash:

```bash
sudo nano /etc/systemd/system/pureirc.service
```

```ini
[Unit]
Description=3nd3r.net IRC Website
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/PureIRC
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable pureirc
sudo systemctl start pureirc

# Check status
sudo systemctl status pureirc

# View logs
journalctl -u pureirc -f
```

### Cloudflare Setup

Works behind Cloudflare — the WebSocket IRC gateway needs proper configuration.

**1. DNS**

Add an A record pointing your domain to your server IP. Enable the orange cloud (proxied).

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | 3nd3r.net | YOUR_SERVER_IP | Proxied |
| A | www | YOUR_SERVER_IP | Proxied |

**2. SSL/TLS**

Go to **SSL/TLS > Overview** and set encryption mode to **Full (strict)** if you have a valid cert on your origin, or **Full** with a Cloudflare Origin CA cert.

Generate an origin certificate:
- Go to **SSL/TLS > Origin Server > Create Certificate**
- Save the cert and key on your server (e.g. `/etc/ssl/certs/`)
- Update your reverse proxy (Nginx/Caddy) to use them

**3. WebSocket Support**

Cloudflare proxies WebSocket connections automatically on all plans. No extra config needed — the `/ws/irc` gateway will work through Cloudflare as long as:
- Your origin server accepts the connection on the same port
- You're using `wss://` (Cloudflare upgrades to HTTPS)

Verify in **Network > WebSockets** that WebSockets are enabled (on by default).

**4. Reverse Proxy (Nginx)**

You'll need Nginx (or Caddy) in front of Node.js to handle SSL and proxy requests:

```nginx
server {
    listen 443 ssl http2;
    server_name 3nd3r.net www.3nd3r.net;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/certs/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket gateway
    location /ws/irc {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}

server {
    listen 80;
    server_name 3nd3r.net www.3nd3r.net;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

**5. Update .env for Production**

```env
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://3nd3r.net
```

**6. Cloudflare Page Rules (optional)**

- Cache static assets: `3nd3r.net/js/*` → Cache Level: Cache Everything
- Bypass cache for API: `3nd3r.net/api/*` → Cache Level: Bypass
- Bypass cache for WebSocket: `3nd3r.net/ws/*` → Cache Level: Bypass

---

## WEBIRC (Real Client IPs)

By default, all web chat users appear to connect from the server's IP address. To show each user's real IP/hostname on IRC, you need to configure **WEBIRC** on both the gateway and the IRC server.

### How It Works

When a user connects via the web client, the gateway sends a `WEBIRC` command to the IRC server before registration:

```
WEBIRC <password> webchat <user-ip> <user-ip>
```

The IRC server verifies the password and source IP match a trusted WEBIRC block, then uses the provided user IP as the connecting client's address instead of the server's.

### Step 1: Configure the IRCd

Add a WEBIRC block to your IRCd config:

**auth block (solanum/charybdis):**

```
auth {
    user = "*@YOUR.SERVER.IP";
    password = "a-strong-secret-here";
    spoof = "webchat.3nd3r.net";
    class = "users";
};
```

**cgiirc block (if supported):**

```
cgiirc {
    type = "webirc";
    host = "YOUR.SERVER.IP";
    password = "a-strong-secret-here";
};
```

After editing, rehash or restart the IRCd:

```bash
/rehash
# or
sudo systemctl restart solanum
```

### Step 2: Set the Password in .env

```env
WEBIRC_PASSWORD=a-strong-secret-here
```

### Step 3: Restart the Web Server

```bash
sudo systemctl restart pureirc
```

### Verifying It Works

Connect via the web client and check the connection notice on IRC:

**Before WEBIRC (server IP shown):**
```
*** Client connecting: SomeUser (webchat@your-vps.host.com) [SERVER_IP]
```

**After WEBIRC (real client IP shown):**
```
*** Client connecting: SomeUser (webchat@user-isp.com) [203.0.113.45]
```

### Important Notes

- The `WEBIRC_PASSWORD` must match exactly between `.env` and the IRCd config
- The IRCd must trust the IP that the web server connects from
- If your server has both IPv4 and IPv6, add blocks for both addresses
- The gateway already reads `X-Forwarded-For` for real client IPs behind reverse proxies
- Without `WEBIRC_PASSWORD` set, the gateway falls back to normal behavior (all users show server IP)

---

## Architecture

```
Express Server (port 3000)
├── REST API
│   ├── GET /api/channels — Channel list with user counts
│   ├── GET /api/stats    — Server statistics
│   ├── GET /api/config   — Site configuration for frontend
│   └── GET /health       — Health check
├── WebSocket Gateway (/ws/irc)
│   └── Per-client WebSocket ↔ IRC connection proxy
│       ├── Rate limiting (3 connections per IP)
│       ├── 30s connection timeout
│       ├── NickServ auto-identify
│       ├── Mode normalization (irc-framework → frontend)
│       └── IRC formatting code stripping
├── Static Files (/public)
│   ├── index.html      — Main site with embedded chat modal
│   ├── chat.html       — Standalone chat page
│   └── js/main.js      — All frontend logic
└── IRC Connection Layer
    └── irc.rizon.net:6667
```

### Frontend
- Vanilla JavaScript — no build step, no frameworks
- Per-channel message buffers with tab switching
- Status window tab for server messages
- Full user prefix display (~, &, @, %, +) with sorted user list
- Mode change messages displayed in chat
- Maximize toggle and open-in-new-tab support

---

## File Structure

```
├── server.js                  # Express + HTTP server entry point
├── config.json                # Site configuration (brand, theme, IRC host, etc.)
├── package.json
├── .env.example               # Environment variables template
│
├── api/
│   ├── routes.js              # Route definitions
│   ├── irc-service.js         # IRC protocol queries
│   ├── channel-controller.js  # Channel endpoint logic
│   └── stats-controller.js    # Stats endpoint logic
│
├── services/
│   ├── irc-cache.js           # In-memory cache (45s/30s TTL)
│   └── irc-gateway.js         # WebSocket-to-IRC gateway
│
└── public/
    ├── index.html             # Main page with embedded chat modal
    ├── chat.html              # Standalone full-page chat client
    └── js/
        ├── main.js            # All UI + IRC client logic
        ├── config-manager.js  # Load & access configuration
        ├── theme-manager.js   # Handle theme switching
        ├── api-client.js      # API request wrapper
        ├── app.js             # Frontend initialization
        ├── irc-modal.js       # Chat modal component
        ├── channel-renderer.js # Channel list UI
        ├── stats-widget.js    # Stats display
        └── lucide.min.js      # Icon library (local)
```

---

## API Endpoints

### Get Channels
```
GET /api/channels
```
Returns array of channels with user counts and topics.

### Get Server Stats
```
GET /api/stats
```
Returns users online, total channels, operators, uptime.

### Get Configuration
```
GET /api/config
```
Returns the merged configuration (config.json + environment variables). Used by the frontend to customize UI, branding, and themes.

### Health Check
```
GET /health
```
Returns server status and uptime.

### WebSocket Gateway
```
ws://localhost:3000/ws/irc
```
Per-client WebSocket connection that proxies to the IRC server. Supports `connect`, `join`, `part`, `message`, `action`, `nick`, and `raw` commands. Optional `nsPassword` field on connect for NickServ auto-identify.

---

## Configuration

Create `.env` from `.env.example`:

```env
# IRC Server
IRC_HOST=irc.rizon.net
IRC_PORT=6667
IRC_SSL_PORT=6697

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# WEBIRC (optional)
WEBIRC_PASSWORD=
```

---

## Development

```bash
npm start          # Start server
npm run dev        # Start in development mode
```

```bash
curl http://localhost:3000/api/channels
curl http://localhost:3000/api/stats
curl http://localhost:3000/api/config
curl http://localhost:3000/health
```

All frontend logic is in `public/js/main.js`. Edit Tailwind classes directly in the HTML files.

---

## Using This for Other IRC Networks

This website is designed to be easily adaptable for any IRC network. To use it for your network:

1. **Edit `config.json`:**
   ```json
   {
     "site": {
       "name": "YourNetwork",
       "fullName": "Your Network Name",
       "domain": "yournetwork.com",
       "description": "Your network description"
     },
     "irc": {
       "host": "irc.yournetwork.com",
       "port": 6667,
       "defaultChannel": "#YourNetwork"
     }
   }
   ```

2. **Set environment variables (optional):**
   ```env
   IRC_HOST=irc.yournetwork.com
   IRC_PORT=6667
   ```

3. **Choose a theme** (or create a new one):
   ```json
   {
     "branding": {
       "defaultTheme": "purple"
     }
   }
   ```

4. **Redeploy** — No code changes needed!

The `/api/config` endpoint serves the configuration to the frontend, and all hardcoded strings are now data-driven. Themes, colors, and branding are all customizable via `config.json`.

---

## Security

- Helmet.js security headers with custom CSP
- CORS configuration (configurable origin)
- Gzip compression
- WebSocket rate limiting (3 connections per IP)
- IRC message length capped at 512 bytes
- Input sanitization (HTML escaping)
- No-cache headers on JS/HTML to prevent stale code
- NickServ passwords are never stored — used only for the single connection
- No sensitive data exposed to frontend

---

## License

MIT

---

## Troubleshooting

### Stats showing 0 users / 0 channels
- The bot IRC connection may have timed out on first start. Wait 10-15 seconds for the retry.
- Check server logs: `journalctl -u pureirc -f`
- Verify IRC connectivity: `telnet irc.rizon.net 6667`
- Ensure `IRC_HOST` and `IRC_PORT` are correct in `.env` or `config.json`

### Web chat won't connect
- Check the browser console (F12) for WebSocket errors.
- If behind Cloudflare, ensure WebSockets are enabled and the Nginx proxy passes `Upgrade` headers.
- Verify the server is running: `curl http://localhost:3000/health`

### Styling broken (black & white page)
- Tailwind CSS loads from CDN. Check your CSP doesn't block it.
- Hard refresh: Ctrl+Shift+R

### User prefixes not showing
- Prefixes are set by mode events after joining. If the NAMES reply arrives after mode changes, the merge logic preserves them.
- If still missing, check browser console for mode-related errors.
