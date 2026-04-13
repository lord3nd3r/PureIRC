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
- Node.js 18+
- npm 9+

### Installation
```bash
git clone https://github.com/lord3nd3r/PureIRC.git
cd PureIRC
npm install
cp .env.example .env
npm start
```

Visit: **http://localhost:3000**

The web chat client is available at **http://localhost:3000/chat** (standalone) or via the "Connect" buttons on the main page (modal).

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

### Channels showing but user count is 0
- Check IRC server connection: `telnet irc.pureirc.com 6667`
- Check server logs for `[IRC]` errors
- Ensure IRC_HOST and IRC_PORT are correct in `.env`

### Styling broken (black & white)
- Clear browser cache (Ctrl+Shift+Delete)
- Check Tailwind CDN is accessible: curl https://cdn.tailwindcss.com
- Check browser console for CSP warnings

### Icons not showing (empty squares)
- Check `/js/lucide.min.js` loads: curl http://localhost:3000/js/lucide.min.js
- Ensure Lucide initialization runs in main.js

### Connection modal doesn't work
- Check browser console for JavaScript errors
- Ensure KiwiIRC URL is valid in main.js
- Test IRC connection manually

See [troubleshooting section](docs/SETUP.md#troubleshooting) for more help.

---

## Roadmap

- [x] Live channel list with user counts
- [x] Server statistics widget
- [x] Responsive dark theme
- [x] Web client integration
- [x] API documentation
- [ ] User accounts & registration
- [ ] Channel favorites
- [ ] Search & filter
- [ ] Custom web IRC client
- [ ] Admin dashboard
- [ ] Analytics & statistics
- [ ] WebSocket real-time updates

---

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

Licensed under the MIT License — see LICENSE file for details

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

