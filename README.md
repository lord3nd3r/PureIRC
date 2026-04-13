# PureIRC Network Website

A modern IRC network website with a built-in WebSocket-to-IRC gateway, tabbed web chat client, real-time channel data, and dynamic server statistics.

## Features

**Web IRC Client**
- Custom WebSocket-to-IRC gateway — no third-party embed required
- Tabbed interface with per-channel message buffers (like a real IRC client)
- Status window for MOTD, server notices, and connection events
- User list sidebar with op/voice prefixes and sorted display
- `/join`, `/part`, `/nick`, `/me`, `/msg`, `/topic` commands
- Unread tab indicators, maximize mode, and standalone `/chat` page
- IRC formatting codes stripped automatically

**Live Channel Data**
- Real-time user count per channel
- Dynamic channel list synced with IRC server
- Auto-refresh every 45 seconds

**Server Statistics**
- Total users online, channel count, operator count
- Updates every 30 seconds

**Modern Dark UI**
- Tailwind CSS dark theme with responsive design
- Lucide icons (bundled locally)
- Smooth animations and transitions
- **6 built-in themes** (Cyan, Purple, Emerald, Rose, Amber, Blue)
- Optional theme switcher UI

**Configurable Branding**
- Centralized `config.json` for site name, IRC host, colors, and more
- Environment variables override config values
- Easy to adapt for different IRC networks without code changes

**Production-Ready Backend**
- Node.js / Express REST API
- IRC protocol integration with in-memory cache
- Helmet.js security headers, CORS, gzip compression
- WebSocket gateway with per-IP rate limiting

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
    "name": "PureIRC",                          // Site name
    "fullName": "PureIRC Network",              // Full name for footer
    "domain": "pureirc.com",                    // Domain
    "description": "A free, open... network."  // Hero description
  },
  "irc": {
    "host": "irc.pureirc.com",                 // IRC server host
    "port": 6667,                              // Default port
    "portSSL": 6697,                           // SSL port
    "defaultChannel": "#PureIRC"               // Channel to join
  },
  "branding": {
    "defaultTheme": "cyan",                    // One of: cyan, purple, emerald, rose, amber, blue
    "icon": "radio"                            // Lucide icon name
  },
  "ui": {
    "showThemeSwitcher": false                 // Show theme selector in header
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
    "defaultTheme": "purple"  // cyan, purple, emerald, rose, amber, or blue
  },
  "ui": {
    "showThemeSwitcher": true  // Show theme picker in header for users
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

### Production Deployment (systemd)

Create a systemd service so it runs on boot and restarts on crash:

```bash
sudo nano /etc/systemd/system/pureirc.service
```

```ini
[Unit]
Description=PureIRC Website
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

PureIRC works behind Cloudflare, but the WebSocket IRC gateway needs proper configuration.

**1. DNS**

Add an A record pointing your domain to your server IP. Enable the orange cloud (proxied).

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| A | pureirc.com | YOUR_SERVER_IP | Proxied |
| A | www | YOUR_SERVER_IP | Proxied |

**2. SSL/TLS**

Go to **SSL/TLS > Overview** and set encryption mode to **Full (strict)** if you have a valid cert on your origin, or **Full** with a Cloudflare Origin CA cert.

Generate an origin certificate:
- Go to **SSL/TLS > Origin Server > Create Certificate**
- Save the cert and key on your server (e.g. `/etc/ssl/pureirc/`)
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
    server_name pureirc.com www.pureirc.com;

    ssl_certificate     /etc/ssl/pureirc/cert.pem;
    ssl_certificate_key /etc/ssl/pureirc/key.pem;

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
    server_name pureirc.com www.pureirc.com;
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
CORS_ORIGIN=https://pureirc.com
```

**6. Cloudflare Page Rules (optional)**

- Cache static assets: `pureirc.com/js/*` → Cache Level: Cache Everything
- Bypass cache for API: `pureirc.com/api/*` → Cache Level: Bypass
- Bypass cache for WebSocket: `pureirc.com/ws/*` → Cache Level: Bypass

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

PureIRC runs **solanum** (charybdis fork). Add a CGI:IRC/WEBIRC block to your `ircd.conf`:

**Option A — `auth` block (solanum/charybdis):**

```
auth {
    /* Your web server's IP — the one IRC sees connections from */
    user = "*@2604:2dc0:101:200::1584";  /* IPv6 */
    /* user = "*@YOUR.SERVER.IPv4";       /* IPv4 — add both if needed */

    password = "a-strong-secret-here";
    spoof = "webchat.pureirc.com";
    class = "users";
};
```

**Option B — `cgiirc` block (if your IRCd version supports it):**

```
cgiirc {
    type = "webirc";
    host = "2604:2dc0:101:200::1584";
    password = "a-strong-secret-here";
};
```

After editing, rehash or restart the IRCd:

```bash
# From IRC as an oper:
/rehash

# Or restart the service:
sudo systemctl restart solanum
```

### Step 2: Set the Password in .env

Add the same password to your `.env` file on the web server:

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
-lonestar.us.pureirc.com- *** Client connecting: SomeUser (webchat@vps-638d4e9a.vps.ovh.us) [2604:2dc0:101:200::1584]
```

**After WEBIRC (real client IP shown):**
```
-lonestar.us.pureirc.com- *** Client connecting: SomeUser (webchat@user-hostname.isp.com) [203.0.113.45]
```

### Important Notes

- The `WEBIRC_PASSWORD` must match exactly between `.env` and the IRCd config
- The IRCd must trust the IP that the web server connects from (your VPS IP)
- If your server has both IPv4 and IPv6, add auth/cgiirc blocks for both addresses
- If you're behind Cloudflare/Nginx, make sure the gateway reads `X-Forwarded-For` to get the real client IP (this is already handled)
- Without `WEBIRC_PASSWORD` set, the gateway falls back to normal behavior (all users show server IP)

---

## Architecture

```
Express Server (port 3000)
├── REST API
│   ├── GET /api/channels — Channel list with user counts
│   ├── GET /api/stats    — Server statistics
│   └── GET /health       — Health check
├── WebSocket Gateway (/ws/irc)
│   └── Per-client WebSocket ↔ IRC connection proxy
│       ├── Rate limiting (3 connections per IP)
│       ├── 30s connection timeout
│       └── IRC formatting code stripping
├── Static Files (/public)
│   ├── index.html      — Main site
│   ├── chat.html       — Standalone chat page
│   └── js/main.js      — All frontend logic
└── IRC Connection Layer
    └── irc.pureirc.com:6667
```

### Frontend
- Vanilla JavaScript — no build step, no frameworks
- Per-channel message buffers with tab switching
- Status window tab for server messages
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
Per-client WebSocket connection that proxies to the IRC server. Supports `connect`, `join`, `part`, `message`, `action`, `nick`, and `raw` commands.

---

## Configuration

Create `.env` from `.env.example`:

```env
# IRC Server
IRC_HOST=irc.pureirc.com
IRC_PORT=6667
IRC_SSL_PORT=6697
IRC_USE_SSL=false
IRC_NICK=PureBot
IRC_USERNAME=purebot
IRC_REALNAME=Pure IRC Bot

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Cache
CACHE_TTL_SECONDS=45
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
- No sensitive data exposed to frontend

---

## License

MIT

---

## Troubleshooting

### Stats showing 0 users / 0 channels
- The bot IRC connection may have timed out on first start. Wait 10-15 seconds for the retry.
- Check server logs: `journalctl -u pureirc -f` — look for `[Cache] Fetched server stats: X users online`
- Verify IRC connectivity: `telnet irc.pureirc.com 6667`
- Ensure `IRC_HOST` and `IRC_PORT` are correct in `.env`

### Web chat won't connect
- SSL to `irc.pureirc.com:6697` does not work. Make sure the SSL checkbox is **unchecked**.
- If behind Cloudflare, ensure WebSockets are enabled and the Nginx proxy passes `Upgrade` headers.
- Check browser console (F12) for WebSocket errors.

### Styling broken (black & white page)
- Tailwind CSS loads from CDN. Check your CSP doesn't block `https://cdn.tailwindcss.com`.
- Hard refresh: Ctrl+Shift+R

### Icons missing
- Lucide is bundled locally at `/js/lucide.min.js`. Verify it loads: `curl http://localhost:3000/js/lucide.min.js | head -1`

---

## License

MIT

---

## Support

- 📖 **Documentation**: See `/docs` folder
- 🐛 **Report Issues**: GitHub Issues
- 💬 **Chat**: Join #help on PureIRC
- 📧 **Email**: support@pureirc.com

---

## Credits

Built with:
- [Express.js](https://expressjs.com/) — Web framework
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Lucide Icons](https://lucide.dev/) — Icons
- [KiwiIRC](https://kiwiirc.com/) — Web client
- [Node IRC](https://github.com/Martyn/node-irc) — IRC protocol

---

**Made with ❤️ for the IRC community**

[Website](https://pureirc.com) • [IRC Server](irc://irc.pureirc.com) • [GitHub](https://github.com/pureirc/network-website)

