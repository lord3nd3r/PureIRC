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
├── package.json
├── .env.example               # Configuration template
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

