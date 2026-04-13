# PureIRC Website Architecture

## Overview
Multi-tier architecture with a Node.js/Express backend that queries a live IRC server and serves a modern dark-themed frontend with real-time channel data.

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **IRC Library** — `irc` npm package for IRC protocol communication
- **Caching** — In-memory cache with 45s TTL to reduce IRC server load
- **Environment** — `.env` configuration for credentials & settings

### Frontend
- **Tailwind CSS** — Dark theme styling (CDN loaded)
- **Lucide Icons** — SVG icon library (local copy)
- **Vanilla JavaScript** — Single `main.js` file, no frameworks
- **Responsive Design** — Mobile-first approach (works on all devices)

### Database
- **SQLite** — (Optional) For user accounts; not yet implemented

---

## Directory Structure

```
/burnout
├── index.html                    # Original file (kept for reference)
├── server.js                     # Express entry point
├── package.json                  # Node dependencies
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Template for .env
│
├── api/
│   ├── routes.js                 # Route definitions
│   ├── irc-service.js            # IRC protocol queries
│   ├── channel-controller.js     # Channel logic
│   └── stats-controller.js       # Server stats logic
│
├── services/
│   ├── irc-cache.js              # In-memory cache (45s TTL)
│   ├── database.js               # SQLite operations (future)
│   └── auth.js                   # Authentication (future)
│
├── public/
│   ├── index.html                # Served HTML
│   ├── js/
│   │   ├── main.js               # All JS logic (single file)
│   │   └── lucide.min.js         # Icon library (local)
│   └── img/
│       └── [favicon & assets]
│
├── db/
│   ├── schema.sql                # User schema (future)
│   └── users.db                  # SQLite database (gitignored)
│
└── docs/
    ├── API.md                    # API endpoint specs
    ├── SETUP.md                  # Deployment guide
    ├── ARCHITECTURE.md           # This file
    └── IRC-CONNECTION.md         # IRC protocol details
```

---

## Data Flow

### Request Path
```
Browser HTTP Request
    ↓
Express Server (server.js)
    ↓
Route Handler (api/routes.js)
    ↓
Controller (channel-controller.js or stats-controller.js)
    ↓
IRC Cache (services/irc-cache.js)
    ↓
IRC Service (api/irc-service.js) — queries IRC server
    ↓
Response JSON → Browser
```

### Frontend Data Updates
```
Page Load → main.js initializes
    ↓
loadChannels() & loadStats() fetch from /api/
    ↓
renderChannels() & renderStats() update DOM
    ↓
setInterval() auto-refresh every 30-45s
    ↓
Smooth transitions update user counts in place
```

---

## Key Components

### 1. **Express Server** (`server.js`)
- Handles CORS, compression, security (Helmet)
- Serves static files from `/public`
- Mounts API routes at `/api`
- Health check endpoint: `GET /health`

### 2. **API Routes** (`api/routes.js`)
- `GET /api/channels` — List all channels
- `GET /api/channels/:name` — Single channel details
- `GET /api/stats` — Server statistics
- `POST /api/auth/register` — User registration (future)
- `POST /api/auth/login` — User login (future)

### 3. **IRC Connection** (`api/irc-service.js`)
- Connects to irc.pureirc.com on port 6667/6697
- Queries channel list via IRC `/LIST` command
- Retrieves user counts and channel topics
- Handles connection errors and reconnection logic

### 4. **Caching Layer** (`services/irc-cache.js`)
- Stores channel & stats data with timestamps
- 45-second TTL on channels, 30-second TTL on stats
- Auto-refresh on expiry
- Prevents repeated IRC server queries

### 5. **Frontend App** (`public/js/main.js`)
- ~500 lines of vanilla JavaScript
- Functions:
  - `initApp()` — Initialize on page load
  - `loadChannels()` / `loadStats()` — Fetch from API
  - `renderChannels()` / `renderStats()` — Update DOM
  - `openIrcModal()` — Open IRC connection modal
  - `connectIrc()` — Connect to KiwiIRC web client
  - UI helpers: `setupHeaderScrollEffect()`, `setupMobileMenu()`, `setupConnectTabs()`, etc.

---

## Configuration

### Environment Variables (`.env`)
```bash
# Server
PORT=3000
NODE_ENV=development

# IRC Connection
IRC_HOST=irc.pureirc.com
IRC_PORT=6667
IRC_USE_SSL=false

# CORS
CORS_ORIGIN=http://localhost:3000

# Cache
CACHE_TTL_CHANNELS=45000    # 45 seconds
CACHE_TTL_STATS=30000        # 30 seconds
```

---

## Performance Notes

### Caching Strategy
- **45-second TTL on channels** — Reduces IRC server load while keeping data relatively fresh
- **30-second TTL on stats** — More frequent updates for user count display
- **Auto-refresh on expiry** — Background requests don't block user interaction

### Browser Performance
- Single `main.js` file (~21KB) — No module bundle overhead
- Tailwind CSS from CDN (~30KB) — Downloaded once, cached by browser
- Lucide icons (~389KB minified) — Downloaded once, reusable everywhere
- No DOM re-renders on every update — Smooth transitions with class toggling

---

## Future Enhancements

1. **User Accounts** — SQLite + bcrypt for optional login
2. **WebSocket Updates** — Real-time channel/user count without polling
3. **Custom Web Client** — Replace KiwiIRC with built-in client
4. **Admin Dashboard** — Manage channels, users, network stats
5. **Search/Filter** — Find channels by topic or user count
6. **Favorites** — Save preferred channels per user
7. **API Rate Limiting** — Protect against abuse
8. **SSL/TLS for IRC** — Secure connections on port 6697

---

## Troubleshooting

### No channels showing up
- Check IRC server is running: `telnet irc.pureirc.com 6667`
- Check `/api/channels` returns data: `curl http://localhost:3000/api/channels`
- Check cache is updating: Look for `[Cache]` logs in server console

### Styling broken (black & white)
- Ensure Tailwind CSS CDN is accessible: https://cdn.tailwindcss.com
- Check browser console for XHR errors

### Icons not showing
- Check `/js/lucide.min.js` is being served: `curl http://localhost:3000/js/lucide.min.js`
- Ensure `<script src="/js/lucide.min.js"></script>` is in HTML head

### Connection modal not working
- Check `/js/main.js` loaded: `curl http://localhost:3000/js/main.js`
- Check browser console for JS errors
- Ensure KiwiIRC URL is valid: https://kiwiirc.com/nextclient/

