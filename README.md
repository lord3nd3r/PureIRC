# PureIRC Network Website

A modern, fully-functional IRC network website with real-time channel data, dynamic user counts, and an embedded web client.

![PureIRC Website](https://via.placeholder.com/1200x400?text=PureIRC+Network+Website)

## Features

✨ **Live Channel Data**
- Real-time user count per channel
- Dynamic channel list synced with IRC server
- Auto-refresh every 45 seconds

📊 **Server Statistics**
- Total users online
- Total channels count
- Network uptime & operator count
- Updates every 30 seconds

🎨 **Modern Dark UI**
- Tailwind CSS dark theme
- Responsive design (mobile, tablet, desktop)
- Smooth animations & transitions
- Lucide icons (local copy)

🔗 **Seamless IRC Integration**
- Embedded KiwiIRC web client
- One-click channel connection
- Channel switching via modal
- Support for #hashtag navigation

🚀 **Production-Ready Backend**
- Node.js/Express REST API
- IRC protocol integration with caching
- In-memory cache with 45s TTL
- Error handling & graceful degradation
- CORS & security headers enabled

📱 **User-Friendly**
- No registration required to browse
- One-click connect to any channel
- Mobile-optimized interface
- Keyboard navigation support

---

## Quick Start

### Requirements
- Node.js 16+
- npm 8+

### Installation
```bash
git clone https://github.com/youruser/pureirc-network.git
cd burnout
npm install
cp .env.example .env
npm start
```

Visit: **http://localhost:3000**

---

## Architecture

### Backend
```
Express Server (port 3000)
    ├── REST API (/api/*)
    │   ├── /api/channels — Get channel list
    │   ├── /api/stats — Server statistics
    │   └── /api/health — Health check
    └── Static Files (/public)
        ├── index.html
        ├── js/main.js
        └── js/lucide.min.js
                ↓
        [IRC Connection Layer]
                ↓
        IRC Server (irc.pureirc.com:6667)
```

### Frontend
```
Browser
    ├── HTML (Tailwind CSS dark theme)
    ├── JavaScript (main.js — vanilla, no frameworks)
    ├── Icons (Lucide — SVG)
    └── API Client
        ├── Auto-fetch channels every 45s
        ├── Auto-fetch stats every 30s
        └── Smooth DOM updates
```

---

## File Structure

```
burnout/
├── server.js                  # Express entry point
├── package.json               # Dependencies
├── .env.example               # Configuration template
│
├── api/
│   ├── routes.js             # Route definitions
│   ├── irc-service.js        # IRC protocol queries
│   ├── channel-controller.js # Channel endpoint logic
│   └── stats-controller.js   # Stats endpoint logic
│
├── services/
│   └── irc-cache.js          # In-memory cache (45s TTL)
│
├── public/
│   ├── index.html            # Main page
│   └── js/
│       ├── main.js           # All UI logic (single file)
│       └── lucide.min.js     # Icon library
│
├── docs/
│   ├── README.md             # This file
│   ├── SETUP.md              # Deployment guide
│   ├── API.md                # API reference
│   └── ARCHITECTURE.md       # Technical details
│
└── db/
    └── schema.sql            # Future: User database
```

---

## API Endpoints

### Get Channels
```bash
GET /api/channels
```
Returns: Array of channels with user counts, topics, categories

### Get Server Stats
```bash
GET /api/stats
```
Returns: Users online, total channels, operators, uptime

### Health Check
```bash
GET /health
```
Returns: Server status and uptime

See [API.md](docs/API.md) for detailed documentation.

---

## Configuration

Create `.env` from `.env.example`:

```bash
# Server
PORT=3000
NODE_ENV=development

# IRC Connection
IRC_HOST=irc.pureirc.com
IRC_PORT=6667
IRC_USE_SSL=false

# Cache (milliseconds)
CACHE_TTL_CHANNELS=45000   # 45 seconds
CACHE_TTL_STATS=30000      # 30 seconds

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## Development

### Start Server
```bash
npm start
```

### Test API
```bash
curl http://localhost:3000/api/channels
curl http://localhost:3000/api/stats
curl http://localhost:3000/health
```

### View Logs
Server logs appear in console with `[IRC]`, `[Cache]`, `[API]` prefixes

### Modify UI
Edit `public/js/main.js` — all frontend logic is in one file for simplicity

### Update Styles
Edit Tailwind classes directly in `public/index.html` or CSS in `<style>` tag

---

## Deployment

### Systemd (Recommended for Linux VPS)
```bash
# See SETUP.md for complete guide
sudo systemctl start pureirc
sudo systemctl status pureirc
```

### Docker
```bash
docker-compose up -d
docker-compose logs -f
```

### Heroku
```bash
heroku create pureirc-network
git push heroku master
```

See [SETUP.md](docs/SETUP.md) for detailed deployment instructions.

---

## Performance

- **Page Load**: ~2 seconds (Tailwind CDN + JS parsing)
- **API Response Time**: ~50-200ms (cached)
- **Channel Update Latency**: 45 seconds (configurable)
- **Stats Update Latency**: 30 seconds (configurable)
- **Memory Usage**: ~50MB (Node.js + cache)

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

---

## Security

- ✅ CORS enabled (configurable)
- ✅ Security headers (Helmet.js)
- ✅ Gzip compression enabled
- ✅ No sensitive data in frontend
- ✅ Environment variables for credentials
- 🔜 Rate limiting (future)
- 🔜 Input validation (future)

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

