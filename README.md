<![CDATA[<div align="center">

# PureIRC

**A production-grade IRC network website with a built-in WebSocket-to-IRC gateway, feature-complete web chat client, real-time channel directory, live server statistics, and full operator tooling — all in a single self-hosted Node.js application.**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![IRC](https://img.shields.io/badge/Protocol-IRC%20RFC%202812-8B5CF6)](https://www.rfc-editor.org/rfc/rfc2812)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Feature Breakdown](#feature-breakdown)
  - [Web IRC Client](#web-irc-client)
  - [WebSocket-to-IRC Gateway](#websocket-to-irc-gateway)
  - [Live Channel Directory](#live-channel-directory)
  - [Server Statistics Engine](#server-statistics-engine)
  - [Theming System](#theming-system)
  - [Configuration-Driven Branding](#configuration-driven-branding)
  - [Server-Side Template Rendering](#server-side-template-rendering)
  - [Security Hardening](#security-hardening)
- [Architecture](#architecture)
  - [System Diagram](#system-diagram)
  - [Data Flow](#data-flow)
  - [Backend Stack](#backend-stack)
  - [Frontend Stack](#frontend-stack)
  - [IRC Bot (Cache Agent)](#irc-bot-cache-agent)
  - [WebSocket Gateway Internals](#websocket-gateway-internals)
  - [Caching Layer](#caching-layer)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Run in Development](#run-in-development)
- [Configuration Reference](#configuration-reference)
  - [config.json](#configjson)
  - [Environment Variables (.env)](#environment-variables-env)
  - [Configuration Priority](#configuration-priority)
  - [Template Variables](#template-variables)
- [REST API Reference](#rest-api-reference)
  - [GET /api/channels](#get-apichannels)
  - [GET /api/channels/popular](#get-apichannelspopular)
  - [GET /api/channels/search](#get-apichannelssearch)
  - [GET /api/channels/:name](#get-apichannelsname)
  - [GET /api/stats](#get-apistats)
  - [GET /api/stats/cache-status](#get-apistatscache-status)
  - [GET /api/stats/network-summary](#get-apistatsnetwork-summary)
  - [GET /api/config](#get-apiconfig)
  - [GET /health](#get-health)
- [WebSocket Protocol Reference](#websocket-protocol-reference)
  - [Client → Server Messages](#client--server-messages)
  - [Server → Client Messages](#server--client-messages)
- [Web Chat Command Reference](#web-chat-command-reference)
  - [Channel Management](#channel-management)
  - [User Mode Management](#user-mode-management)
  - [IRC Services Shortcuts](#irc-services-shortcuts)
  - [Messaging](#messaging)
  - [Information Queries](#information-queries)
  - [IRCop Commands](#ircop-commands)
  - [IRCop Extended Commands](#ircop-extended-commands)
  - [Connection & UI](#connection--ui)
- [WEBIRC Configuration](#webirc-configuration)
  - [How WEBIRC Works](#how-webirc-works)
  - [Step 1: Configure the IRCd](#step-1-configure-the-ircd)
  - [Step 2: Set the Password](#step-2-set-the-password)
  - [Step 3: Verify](#step-3-verify)
  - [Important Notes](#important-notes)
- [Theming Guide](#theming-guide)
  - [Built-in Themes](#built-in-themes)
  - [Theme Architecture](#theme-architecture)
  - [Creating Custom Themes](#creating-custom-themes)
  - [Theme Persistence](#theme-persistence)
- [Production Deployment](#production-deployment)
  - [systemd Service](#systemd-service)
  - [Nginx Reverse Proxy](#nginx-reverse-proxy)
  - [Cloudflare Configuration](#cloudflare-configuration)
  - [Docker Deployment](#docker-deployment)
- [Adapting for Your Network](#adapting-for-your-network)
- [Troubleshooting](#troubleshooting)
- [Security Model](#security-model)
- [License](#license)

---

## Overview

PureIRC is a complete, self-hosted web presence for an IRC network. It replaces the need for separate solutions (a website, a web chat gateway, a channel directory, a stats page) with a single, unified Node.js application. Every piece of branding — site name, IRC host, tagline, colors, featured channels — is configurable via a single `config.json` file and environment variable overrides. **Zero code changes are required** to deploy this for any IRC network.

The crown jewel is the **built-in web IRC client**: a custom WebSocket-to-IRC gateway that creates a real, per-user IRC connection on the backend. This is not an iframe embed of a third-party service. It speaks raw IRC protocol via `irc-framework`, supports WEBIRC for real client IP passthrough, and provides a tabbed, multi-channel interface with full operator command support.

---

## Feature Breakdown

### Web IRC Client

The web client is a fully custom implementation — not a third-party embed. Each user gets their own real IRC connection brokered through the server's WebSocket gateway.

| Capability | Detail |
|---|---|
| **Real IRC connections** | Each webchat session opens a dedicated TCP connection to the IRCd via `irc-framework` on the backend. The user is a real IRC client. |
| **Tabbed interface** | Multi-channel support with a horizontal tab bar. Status window (`*status`) for server notices, MOTD, and connection events. |
| **Per-channel message buffers** | Each channel maintains its own scrollback buffer (500 lines max). Switching tabs restores the full scrollback for that buffer. |
| **User list sidebar** | Sorted by rank: Owner (~), Admin (&), Op (@), HalfOp (%), Voice (+), then alphabetical. Real-time updates on JOIN, PART, QUIT, KICK, MODE, and NICK events. |
| **Nick tab-completion** | Press `Tab` in the input to cycle through matching nicknames in the current channel. Adds `: ` suffix at line start, space otherwise. |
| **Unread indicators** | Tabs for inactive channels show a pulsing dot when new messages arrive. |
| **NickServ auto-identify** | Optional password field on the connect form. Sends `IDENTIFY` to NickServ immediately after registration completes. |
| **SSL/TLS toggle** | Checkbox on the connect form switches between plaintext port (6667) and SSL port (6697). |
| **IRC formatting stripped** | Bold (0x02), color (0x03), italic (0x1D), underline (0x1F), reverse (0x16), reset (0x0F), and hex color (0x04) codes are stripped from all incoming messages. |
| **Nick colorization** | Each nickname is assigned a deterministic color via a hash function, spread across 10 distinct hues. Self messages are highlighted in theme accent color. |
| **Action messages** | `/me` actions render in purple italics with the `* Nick` prefix. |
| **Mode change display** | Mode changes render with a `★` prefix and a human-readable `+ao Nick Nick` format. |
| **WHOIS display** | `/whois` results are rendered inline with structured fields: ident, hostname, realname, server, channels, account, SSL status, idle time, and signon date. |
| **MOTD rendering** | Server MOTD is displayed line-by-line in the status window on connect. |
| **Maximize mode** | Toggle to expand the chat modal to full viewport. Also supports opening in a dedicated `/chat` page. |
| **Standalone page** | `GET /chat` serves a full-page chat client (no surrounding website chrome). Same WebSocket gateway, same features. |
| **Command history** | All unrecognized `/command` input is forwarded as raw IRC, so any IRCd-specific command works out of the box. |

### WebSocket-to-IRC Gateway

| Aspect | Detail |
|---|---|
| **Endpoint** | `ws://host/ws/irc` (or `wss://` behind TLS termination) |
| **Per-IP rate limiting** | Maximum 3 concurrent WebSocket connections per IP address. Excess connections receive close code `4429`. |
| **Connection timeout** | 30-second timeout on initial IRC registration. If the IRCd doesn't respond, the WebSocket is closed. |
| **Message length cap** | Outbound messages are truncated to 512 bytes (IRC protocol limit). |
| **WEBIRC support** | When `WEBIRC_PASSWORD` is set, the gateway sends a `WEBIRC` command before registration, passing the real client IP (from `X-Forwarded-For` or socket address). |
| **Nickname validation** | Nicknames are validated against RFC 2812 pattern: `^[a-zA-Z_\[\]\\` + "`" + `^{}|][a-zA-Z0-9_\[\]\\` + "`" + `^{}|\-]{0,15}$`. Invalid nicks are replaced with a random `UserNNNN` fallback. |
| **Graceful cleanup** | On WebSocket close, the IRC connection is quit with `Web client disconnected`. IP connection counter is decremented. |

### Live Channel Directory

- Fetches the full channel list from the IRC server via `LIST` command through a persistent bot connection
- Channels are cached in memory and sorted by user count (descending)
- Featured/pinned channels (configurable in `config.json`) appear first in the grid
- Each channel card displays: name, topic, user count, and auto-assigned category badge
- Category auto-detection by channel name (General, Support, Gaming, Entertainment)
- Clicking a channel card opens the web client pre-configured to join that channel
- Auto-refreshes every 5 minutes (cache TTL), frontend polls every 30 seconds
- Configurable max channels displayed (default: 18)
- Graceful fallback to static default channels if the IRC connection fails

### Server Statistics Engine

- Queries the IRC server via `LUSERS` command on the persistent bot connection
- Parses IRC numerics: `251` (LUSERCLIENT), `252` (LUSEROP), `254` (LUSERCHANNELS), `266` (GLOBALUSERS)
- `266` (global user count) is preferred over `251` for accuracy
- Stats displayed: Users Online, Total Channels, Network Status indicator
- Cache TTL: 5 minutes (server-side), frontend polls every 30 seconds
- Display uses animated opacity transitions on value updates

### Theming System

6 built-in color themes with hot-swapping support:

| Theme | Primary | Accent Text | CSS Variable |
|-------|---------|-------------|--------------|
| **Cyan** | `#06b6d4` | `#22d3ee` | Default |
| **Purple** | `#a855f7` | `#d8b4fe` | — |
| **Emerald** | `#10b981` | `#6ee7b7` | — |
| **Rose** | `#f43f5e` | `#fb7185` | — |
| **Amber** | `#f59e0b` | `#fcd34d` | — |
| **Blue** | `#3b82f6` | `#60a5fa` | — |

- Theme switcher dropdown in the site header (can be disabled via `config.json`)
- User preference persisted in `localStorage` (`app-theme` key)
- Theme changes update CSS custom properties (`--theme-primary`, `--theme-accent`, `--theme-accent-light`, `--theme-accent-dark`) and dynamically swap Tailwind utility classes across the DOM
- `themeChanged` custom event dispatched on `window` for any modules that need to react

### Configuration-Driven Branding

Every user-facing string is data-driven. The `config.json` file controls:

- **Site identity**: Name, full name, domain, description, tagline, footer description, founded year
- **IRC connection**: Host, port, SSL port, default channel, bot identity (name, username, realname, version), user prefix for anonymous webchat nicks
- **Branding**: Lucide icon name for the logo, default theme
- **UI**: Theme switcher visibility, max channels displayed, featured channels list
- **Social**: Support email, support channel, GitHub URL

### Server-Side Template Rendering

HTML pages are **not static files**. The server reads `index.html` and `chat.html` from disk, performs mustache-style `{{VARIABLE}}` replacements with live config values, and serves the result. Template variables include:

`{{SITE_NAME}}`, `{{SITE_DOMAIN}}`, `{{SITE_DESCRIPTION}}`, `{{SITE_TAGLINE}}`, `{{FOOTER_DESCRIPTION}}`, `{{FOUNDED_YEAR}}`, `{{DEFAULT_CHANNEL}}`, `{{SUPPORT_CHANNEL}}`, `{{USER_PREFIX}}`, `{{IRC_HOST}}`, `{{IRC_PORT}}`, `{{IRC_PORT_SSL}}`, `{{MAX_CHANNELS}}`

The `{{MAX_CHANNELS}}` variable is fetched live from the IRC cache at render time, reflecting the actual channel count on the network.

### Security Hardening

| Layer | Implementation |
|---|---|
| **HTTP headers** | Helmet.js with custom CSP allowing Tailwind CDN, inline scripts, and WebSocket connections |
| **CORS** | Configurable origin (`CORS_ORIGIN` env var), credentials enabled |
| **Compression** | gzip via `compression` middleware |
| **No-cache on code** | JavaScript and HTML files served with `Cache-Control: no-cache, no-store, must-revalidate` to prevent stale client code |
| **WebSocket rate limit** | 3 connections per IP |
| **Message length** | Capped at 512 bytes |
| **Input escaping** | All user-generated content is HTML-escaped before DOM insertion via `textContent`→`innerHTML` conversion |
| **Password handling** | NickServ passwords are used once for the `IDENTIFY` command and never stored |
| **No sensitive data in frontend** | The `/api/config` endpoint serves the full config, but credentials are only in `.env` (gitignored) |

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│                                                                  │
│  ┌──────────────────┐     ┌──────────────────────────────────┐  │
│  │   Landing Page   │     │       Web IRC Client             │  │
│  │   (index.html)   │     │   (index.html modal / chat.html) │  │
│  │                  │     │                                  │  │
│  │  • Channel grid  │     │  • Tab bar & message buffers     │  │
│  │  • Stats widget  │     │  • User list sidebar             │  │
│  │  • Connect form  │     │  • Input with tab-completion     │  │
│  │  • FAQ accordion │     │  • 80+ slash commands            │  │
│  │  • Theme picker  │     │  • Nick colorization & WHOIS     │  │
│  └────────┬─────────┘     └───────────────┬──────────────────┘  │
│           │ HTTP (fetch)                  │ WebSocket            │
└───────────┼───────────────────────────────┼──────────────────────┘
            │                               │
            ▼                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Node.js / Express Server                       │
│                                                                   │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  REST API   │  │  Template Engine │  │  WebSocket Gateway   │ │
│  │             │  │                  │  │  (ws /ws/irc)        │ │
│  │  /api/      │  │  renderTemplate()│  │                      │ │
│  │  channels   │  │  {{VARS}} → HTML │  │  Per-client IRC conn │ │
│  │  stats      │  │                  │  │  Rate limiting       │ │
│  │  config     │  │  Serves / and   │  │  WEBIRC passthrough  │ │
│  │             │  │  /chat routes    │  │  Mode normalization  │ │
│  └──────┬──────┘  └──────────────────┘  └──────────┬───────────┘ │
│         │                                          │              │
│         ▼                                          │              │
│  ┌──────────────────┐                              │              │
│  │   IRC Cache      │                              │              │
│  │   (Singleton)    │                              │              │
│  │                  │                              │              │
│  │  channels: 5m TTL│                              │              │
│  │  stats:    5m TTL│                              │              │
│  │  auto-refresh    │                              │              │
│  └──────┬───────────┘                              │              │
│         │                                          │              │
│         ▼                                          ▼              │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    IRC Service (Bot)                          │ │
│  │  • Persistent connection to IRCd                             │ │
│  │  • Sends LIST and LUSERS commands                            │ │
│  │  • Auto-reconnect with 15s delay                             │ │
│  │  • Nick collision handling (random suffix)                   │ │
│  └──────────────────────────┬───────────────────────────────────┘ │
│                             │ TCP (irc-framework)                 │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   IRC Server     │
                    │  (e.g. Rizon,    │
                    │   UnrealIRCd,    │
                    │   Solanum, etc.) │
                    └──────────────────┘
```

### Data Flow

**REST API requests** (channels, stats):
```
Browser → HTTP GET → Express Router → Controller → IRC Cache → (if expired) → IRC Service → IRCd
                                                                                    └→ LUSERS / LIST
```

**WebSocket chat connections**:
```
Browser → WebSocket upgrade → Gateway creates new irc-framework Client → IRCd
                                   ├→ Events proxied as JSON to browser
                                   └→ Commands from browser sent as IRC protocol
```

**Page rendering**:
```
Browser → GET / or /chat → renderTemplate() reads HTML → replaces {{VARS}} with live config → Response
```

### Backend Stack

| Component | Package | Version | Purpose |
|---|---|---|---|
| HTTP server | `express` | ^4.18.2 | REST API, static files, template rendering |
| WebSocket | `ws` | ^8.20.0 | WebSocket server for the IRC gateway |
| IRC client | `irc-framework` | ^4.14.0 | IRC protocol implementation (bot + per-user connections) |
| Security | `helmet` | ^7.0.0 | HTTP security headers with custom CSP |
| CORS | `cors` | ^2.8.5 | Cross-origin request handling |
| Compression | `compression` | ^1.7.4 | gzip response compression |
| Environment | `dotenv` | ^16.0.3 | `.env` file loading |
| HTTP client | `axios` | ^1.3.4 | Available for future HTTP integrations |
| Hashing | `bcryptjs` | ^2.4.3 | Available for future auth features |
| Database | `sqlite3` | ^5.1.6 | Available for future user accounts (stub services exist) |

### Frontend Stack

| Component | Implementation |
|---|---|
| **JavaScript** | Vanilla JS, no framework, no build step. Single `main.js` (62KB, ~1700 lines) handles all UI and IRC client logic. |
| **CSS framework** | Tailwind CSS loaded from CDN (`https://cdn.tailwindcss.com`) |
| **Icons** | Lucide Icons, bundled locally (`lucide.min.js`, ~397KB) |
| **Modules** | Additional JS modules (`config-manager.js`, `theme-manager.js`, `api-client.js`, `app.js`, `irc-modal.js`, `channel-renderer.js`, `stats-widget.js`) exist as ES modules but `main.js` is the primary entry point for the served pages |

### IRC Bot (Cache Agent)

A persistent background IRC connection (`IRCService` class) that:

1. Connects to the configured IRCd on startup with configurable nick/username/realname
2. Handles nick collisions by appending a random 3-digit suffix
3. Auto-reconnects on disconnect with a 15-second delay
4. Responds to `LIST` and `LUSERS` commands to populate the cache
5. Fires a reconnect callback so the cache layer can immediately refresh after reconnecting
6. 15-second timeout on initial connection and data queries

### WebSocket Gateway Internals

The gateway (`services/irc-gateway.js`) attaches to the HTTP server and listens on `/ws/irc`:

1. **Connection**: Creates a new `irc-framework` Client per WebSocket connection
2. **Events proxied to browser**: `registered`, `message`, `action`, `notice`, `join`, `part`, `kick`, `quit`, `nick`, `topic`, `channel info`, `userlist`, `mode`, `whois`, `motd`, `nick in use`, `irc error`, `close`, `socket close`
3. **Mode normalization**: irc-framework sends modes as `{ mode: "+o", param: "nick" }` — the gateway normalizes to `{ mode: "o", adding: true, param: "nick" }` for the frontend
4. **Self-echo**: When the client sends a message, the gateway echoes it back as a `message` event with `isSelf: true` so the frontend can display it immediately without waiting for a server echo
5. **Channel tracking**: The gateway tracks which channels the user has joined via a `Set`, used for cleanup

### Caching Layer

`IRCCache` (singleton, `services/irc-cache.js`):

| Parameter | Value |
|---|---|
| Channel cache TTL | 5 minutes |
| Stats cache TTL | 5 minutes |
| Periodic refresh | Every 5 minutes |
| On-demand refresh | If cache is expired when a request arrives and the bot is connected, refresh before responding |
| Reconnect behavior | Immediately refresh both caches when the bot reconnects |
| Retry on init failure | Retries `init()` every 10 seconds if the initial IRC connection fails |

---

## Project Structure

```
PureIRC/
├── server.js                      # Express entry point, middleware, template engine, config loading
├── config.json                    # Network branding & settings (gitignored — use config.example.json)
├── config.example.json            # Template config with all available options documented
├── package.json                   # Dependencies and npm scripts
├── .env                           # Environment overrides (gitignored)
├── .env.example                   # Template .env with all variables documented
├── .gitignore                     # node_modules/, .env, *.log, config.json
├── postcss.config.js              # PostCSS config (Tailwind + autoprefixer)
├── tailwind.config.js             # Tailwind content paths
│
├── api/
│   ├── routes.js                  # Express router: mounts all /api/* endpoints
│   ├── irc-service.js             # IRCService class: persistent bot connection, LIST, LUSERS, NAMES
│   ├── channel-controller.js      # Handlers: listChannels, getChannelInfo, searchChannels, getPopularChannels
│   └── stats-controller.js        # Handlers: getStats, getCacheStatus, getNetworkSummary
│
├── services/
│   ├── irc-cache.js               # IRCCache singleton: TTL cache, periodic refresh, reconnect hooks
│   ├── irc-gateway.js             # WebSocket-to-IRC gateway: per-client connections, rate limiting, WEBIRC
│   ├── auth.js                    # AuthService stub (session management — not yet wired)
│   └── database.js                # DatabaseService stub (SQLite — not yet wired)
│
├── public/
│   ├── index.html                 # Main site: hero, connect guide, channel grid, rules, support, FAQ, footer, chat modal
│   ├── chat.html                  # Standalone full-page chat client (same gateway, no site chrome)
│   ├── tailwind.min.css           # Local Tailwind fallback
│   └── js/
│       ├── main.js                # Primary frontend: app init, API polling, channel render, stats, IRC client, commands
│       ├── config-manager.js      # ConfigManager class: fetches /api/config, dot-notation getter
│       ├── theme-manager.js       # ThemeManager class: CSS variable updates, Tailwind class swapping, localStorage
│       ├── api-client.js          # APIClient class: fetch wrapper with typed methods for each endpoint
│       ├── app.js                 # ES module app init (imports channel-renderer, stats-widget, irc-modal)
│       ├── irc-modal.js           # IRCModal class: connection form, KiwiIRC URL builder, channel quick-picks
│       ├── channel-renderer.js    # ChannelRenderer class: grid rendering, category detection, auto-refresh
│       ├── stats-widget.js        # StatsWidget class: stats display, animated updates, status indicator
│       └── lucide.min.js          # Lucide icon library (bundled, ~397KB)
│
├── docs/
│   ├── API.md                     # API endpoint documentation
│   ├── ARCHITECTURE.md            # Architecture overview
│   └── SETUP.md                   # Deployment guide
│
└── IMPLEMENTATION_COMPLETE.md     # Implementation notes and checklist
```

---

## Quick Start

### Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | Latest |
| Network | Outbound TCP to IRC port 6667 (or 6697 for SSL) | — |
| RAM | ~50MB | ~128MB |

### Installation

```bash
git clone https://github.com/lord3nd3r/PureIRC.git
cd PureIRC

npm install

cp .env.example .env
cp config.example.json config.json

# Edit both files for your network:
nano config.json   # Set site name, IRC host, channels, themes
nano .env          # Set IRC_HOST, PORT, CORS_ORIGIN, WEBIRC_PASSWORD
```

### Run in Development

```bash
npm run dev        # Starts with NODE_ENV=development
# or
npm start          # Starts with default NODE_ENV
```

Expected output:
```
[Config] Loaded with IRC host: irc.rizon.net

🚀 PureIRC API Server
📌 Listening on http://localhost:3000
🌐 Environment: development
📡 IRC Server: irc.rizon.net:6667
🔌 WebSocket gateway: ws://localhost:3000/ws/irc

[Gateway] WebSocket-to-IRC gateway attached at /ws/irc
[IRC] Connecting to irc.rizon.net:6667 as PureBot...
[IRC] Connected and registered as PureBot
[Cache] IRC connection established
[Cache] Fetched 287 channels
[Cache] Fetched server stats: 3402 users online
```

Open **http://localhost:3000** for the website, or **http://localhost:3000/chat** for the standalone chat client.

---

## Configuration Reference

### config.json

<details>
<summary><strong>Full annotated config.example.json</strong></summary>

```json
{
  "site": {
    "name": "MyIRC",                              // Short name (used in header, titles, footer)
    "fullName": "MyIRC Network",                   // Full name (used in copyright line)
    "domain": "example.com",                       // Domain for display purposes
    "description": "A free, open...",              // Hero section description paragraph
    "tagline": "The Internet\nRelay Chat Network", // Hero heading (\n splits into gradient text)
    "footerDescription": "A free, open...",        // Footer brand description
    "foundedYear": 2025,                           // Copyright year in footer
    "favicon": "vite.svg"                          // Favicon filename in public/
  },
  "irc": {
    "host": "irc.example.com",                     // IRC server hostname
    "port": 6667,                                  // Plain text port
    "portSSL": 6697,                               // SSL/TLS port
    "defaultChannel": "#general",                  // Default channel for connect forms
    "botName": "PureBot",                          // IRC nick for the cache bot
    "botUsername": "purebot",                       // IRC username (ident)
    "botRealname": "Pure IRC Bot",                 // IRC realname (GECOS)
    "botVersion": "PureBot v1.0",                  // CTCP VERSION response
    "userPrefix": "User"                           // Prefix for auto-generated webchat nicks
  },
  "branding": {
    "icon": "radio",                               // Lucide icon name for header/footer logo
    "defaultTheme": "cyan"                         // Default color theme
  },
  "ui": {
    "showThemeSwitcher": true,                     // Show/hide the theme dropdown in header
    "channelsDisplay": {
      "maxChannels": 18,                           // Max channels shown in the grid
      "featuredChannels": ["#general", "#chat"]    // Pinned channels (appear first, get "Featured" badge)
    }
  },
  "social": {
    "supportEmail": "admin@example.com",           // Not currently rendered, available for customization
    "supportChannel": "#help",                     // Support channel link in footer/support section
    "githubUrl": "https://github.com/..."          // Not currently rendered, available for customization
  },
  "themes": {
    "cyan": {
      "name": "Cyan",                              // Display name in theme picker
      "description": "Cool cyan accent",           // Tooltip text
      "primary": "#06b6d4",                        // CSS --theme-primary
      "accent": "cyan",                            // Tailwind color name (for class generation)
      "accentLight": "cyan-400",                   // Tailwind text utility suffix
      "accentDark": "cyan-600",                    // Tailwind text utility suffix
      "accentBg": "cyan-500/10",                   // Tailwind bg utility suffix
      "accentBorder": "cyan-500/20",               // Tailwind border utility suffix
      "accentGlow": "cyan-500/30",                 // Tailwind shadow utility suffix
      "textAccent": "#22d3ee"                      // CSS --theme-accent
    }
    // ... more themes
  }
}
```

</details>

### Environment Variables (.env)

| Variable | Default | Description |
|---|---|---|
| `IRC_HOST` | `config.json` value | IRC server hostname (overrides config) |
| `IRC_PORT` | `6667` | IRC plaintext port |
| `IRC_SSL_PORT` | `6697` | IRC SSL port |
| `IRC_USE_SSL` | `false` | Use SSL for the bot connection |
| `IRC_NICK` | `PureBot` | Bot nickname |
| `IRC_USERNAME` | `purebot` | Bot ident |
| `IRC_REALNAME` | `Pure IRC Bot` | Bot realname |
| `WEBIRC_PASSWORD` | *(empty)* | WEBIRC password for real IP passthrough (empty = disabled) |
| `PORT` | `3000` | HTTP server listen port |
| `NODE_ENV` | `development` | `development` or `production` |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |
| `LOG_LEVEL` | `debug` | Logging verbosity |
| `DB_PATH` | `./db/users.db` | SQLite database path (for future use) |
| `CACHE_TTL_SECONDS` | `45` | Cache TTL hint (actual TTLs are hardcoded at 5m in irc-cache.js) |

### Configuration Priority

```
Environment Variables (.env)  →  config.json  →  Hardcoded Defaults
         (highest)                                    (lowest)
```

### Template Variables

These `{{VARIABLES}}` are replaced server-side when serving HTML pages:

| Variable | Source |
|---|---|
| `{{SITE_NAME}}` | `config.site.name` |
| `{{SITE_DOMAIN}}` | `config.site.domain` |
| `{{SITE_DESCRIPTION}}` | `config.site.description` |
| `{{SITE_TAGLINE}}` | `config.site.tagline` |
| `{{FOOTER_DESCRIPTION}}` | `config.site.footerDescription` |
| `{{FOUNDED_YEAR}}` | `config.site.foundedYear` |
| `{{DEFAULT_CHANNEL}}` | `config.irc.defaultChannel` |
| `{{SUPPORT_CHANNEL}}` | `config.social.supportChannel` |
| `{{USER_PREFIX}}` | `config.irc.userPrefix` |
| `{{IRC_HOST}}` | `config.irc.host` |
| `{{IRC_PORT}}` | `config.irc.port` |
| `{{IRC_PORT_SSL}}` | `config.irc.portSSL` |
| `{{MAX_CHANNELS}}` | Live count from IRC cache |

---

## REST API Reference

All responses are JSON. All endpoints accept `GET` requests.

### GET /api/channels

Returns all channels sorted by user count (descending).

```json
{
  "success": true,
  "data": [
    { "name": "#lobby", "users": 312, "topic": "Welcome!" },
    { "name": "#tech", "users": 247, "topic": "Programming" }
  ],
  "count": 287,
  "timestamp": "2026-04-13T00:06:15.898Z"
}
```

### GET /api/channels/popular

Returns top channels sorted by user count. Query parameter: `?limit=10` (max 50).

### GET /api/channels/search

Search channels by name or topic. Query parameter: `?q=search+term`.

```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "query": "programming",
  "timestamp": "..."
}
```

### GET /api/channels/:name

Returns a single channel by name. The `#` prefix is optional — both `/api/channels/lobby` and `/api/channels/%23lobby` work.

### GET /api/stats

Returns server statistics with cache status metadata.

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-04-13T00:03:54.716Z",
    "connected": true,
    "host": "irc.rizon.net",
    "port": 6667,
    "usersOnline": 3402,
    "totalChannels": 287,
    "operators": 15,
    "cached": true,
    "cachedAt": "2026-04-13T00:03:56.716Z"
  },
  "cacheStatus": {
    "connected": true,
    "channels": { "count": 287, "cached": true, "age": 1234, "ttl": 300000 },
    "stats": { "cached": true, "age": 1234, "ttl": 300000 }
  },
  "timestamp": "..."
}
```

### GET /api/stats/cache-status

Returns raw cache metadata (age, TTL, connection status).

### GET /api/stats/network-summary

Returns a condensed summary: host, port, online status, user count, channel count, top 5 channels.

### GET /api/config

Returns the merged configuration (config.json + env overrides). Includes live `maxChannels` count from the IRC cache. Used by the frontend to load theming, branding, and featured channel data.

### GET /health

```json
{
  "status": "ok",
  "timestamp": "2026-04-13T00:06:15.898Z",
  "uptime": 86400.123
}
```

---

## WebSocket Protocol Reference

Endpoint: `ws://host:port/ws/irc` (or `wss://` with TLS termination)

All messages are JSON. The `type` field determines the message type.

### Client → Server Messages

| Type | Fields | Description |
|---|---|---|
| `connect` | `nickname`, `ssl` (bool), `nsPassword` (optional) | Initiate IRC connection |
| `join` | `channel` | Join a channel (auto-prefixes `#`) |
| `part` | `channel` | Leave a channel |
| `message` | `target`, `text` | Send a PRIVMSG |
| `action` | `target`, `text` | Send a CTCP ACTION (`/me`) |
| `nick` | `nickname` | Change nickname |
| `raw` | `line` | Send a raw IRC protocol line |

### Server → Client Messages

| Type | Key Fields | Description |
|---|---|---|
| `connected` | `nickname`, `server` | Registration complete |
| `message` | `nick`, `target`, `message`, `isAction`, `isSelf`, `time` | Channel/private message |
| `notice` | `nick`, `target`, `message`, `time` | Notice |
| `join` | `nick`, `channel`, `time` | User joined |
| `part` | `nick`, `channel`, `message`, `time` | User parted |
| `kick` | `nick` (kicked), `by`, `channel`, `reason`, `time` | User kicked |
| `quit` | `nick`, `message`, `time` | User quit |
| `nick` | `oldNick`, `newNick`, `time` | Nick change |
| `topic` | `channel`, `topic`, `nick`, `time` | Topic change or initial topic |
| `userlist` | `channel`, `users` (array of `{nick, modes[]}`) | NAMES reply |
| `mode` | `channel`, `nick`, `modes` (array of `{mode, adding, param}`) | Mode change |
| `whois` | `nick`, `ident`, `hostname`, `real_name`, `server`, `channels`, `account`, `secure`, `idle`, `logon`, etc. | WHOIS response |
| `motd` | `motd` (string, newline-separated) | Message of the Day |
| `nick_in_use` | `oldNick`, `newNick` | Nick collision (auto-appends `_`) |
| `irc_error` | `error`, `reason`, `time` | IRC error numeric |
| `error` | `message` | Gateway error |
| `disconnected` | `message` | Connection lost |

---

## Web Chat Command Reference

Type `/help` in the web client to see a summary. Any unrecognized `/command` is forwarded as raw IRC.

### Channel Management

| Command | Aliases | Description |
|---|---|---|
| `/join #channel` | `/j` | Join a channel |
| `/part [#channel]` | `/leave`, `/p` | Leave current or specified channel |
| `/topic [text]` | — | View or set channel topic |
| `/invite nick [#channel]` | — | Invite a user to current or specified channel |
| `/cycle [#channel]` | `/rejoin` | Part and rejoin (500ms delay) |
| `/names [#channel]` | — | Request NAMES list |

### User Mode Management

| Command | Description |
|---|---|
| `/op nick` | `+o` (operator) |
| `/deop nick` | `-o` |
| `/voice nick` | `+v` |
| `/devoice nick` | `-v` |
| `/hop nick` or `/halfop nick` | `+h` (halfop) |
| `/dehop nick` or `/dehalfop nick` | `-h` |
| `/admin nick` or `/protect nick` | `+a` (admin/protect) |
| `/deadmin nick` or `/deprotect nick` | `-a` |
| `/owner nick` | `+q` (owner) |
| `/deowner nick` | `-q` |
| `/kick nick [reason]` | Kick (alias: `/k`) |
| `/ban mask` | `+b` (ban) |
| `/unban mask` | `-b` |
| `/kickban nick [reason]` | Ban then kick (alias: `/kb`) |
| `/mode [target] modes` | Set arbitrary modes |

### IRC Services Shortcuts

| Command | Aliases | Target |
|---|---|---|
| `/ns <command>` | `/nickserv` | NickServ |
| `/cs <command>` | `/chanserv` | ChanServ |
| `/ms <command>` | `/memoserv` | MemoServ |
| `/bs <command>` | `/botserv` | BotServ |
| `/hs <command>` | `/hostserv` | HostServ |
| `/os <command>` | `/operserv` | OperServ |
| `/identify <password>` | `/id` | NickServ IDENTIFY |
| `/ghost nick [password]` | — | NickServ GHOST |
| `/regain nick [password]` | `/recover` | NickServ REGAIN |

### Messaging

| Command | Description |
|---|---|
| `/msg nick text` | Private message (aliases: `/privmsg`, `/query`) |
| `/notice nick text` | Send a NOTICE |
| `/me action text` | ACTION message (alias: `/action`) |
| `/ctcp nick COMMAND` | Send CTCP request |

### Information Queries

| Command | Alias | Description |
|---|---|---|
| `/whois nick` | `/wi` | WHOIS query (rendered inline) |
| `/whowas nick` | — | WHOWAS query |
| `/who [target]` | — | WHO query |
| `/list [params]` | — | Channel list |
| `/motd [server]` | — | Message of the Day |
| `/version [server]` | — | Server version |
| `/time [server]` | — | Server time |
| `/ping [target]` | — | Ping server |
| `/stats [type] [server]` | — | Server statistics |

### IRCop Commands

| Command | Description |
|---|---|
| `/oper user password` | Authenticate as IRC operator |
| `/kill nick [reason]` | Kill (disconnect) a user |
| `/kline [time] mask :reason` | Add a K-line |
| `/unkline mask` | Remove K-line |
| `/gline mask [reason]` | Add a G-line |
| `/ungline mask` | Remove G-line |
| `/zline ip [reason]` | Add a Z-line |
| `/unzline ip` | Remove Z-line |
| `/dline ip [reason]` | Add a D-line |
| `/undline ip` | Remove D-line |

### IRCop Extended Commands

| Command | Description |
|---|---|
| `/wallops text` | Broadcast to opers (WALLOPS) |
| `/globops text` | Broadcast to opers (GLOBOPS) |
| `/sajoin nick #channel` | Force-join a user |
| `/sapart nick #channel` | Force-part a user |
| `/sanick nick newnick` | Force nick change |
| `/samode target modes` | Force mode change |
| `/chghost nick hostname` | Change a user's displayed hostname |
| `/sethost hostname` | Set your own host |
| `/chgident nick ident` | Change a user's ident |
| `/chgname nick :realname` | Change a user's realname |
| `/userip nick` | Get user's real IP |
| `/squit server [reason]` | Disconnect a linked server |
| `/rehash [type]` | Rehash IRCd configuration |
| `/die [reason]` | Shut down the IRCd |
| `/restart [reason]` | Restart the IRCd |
| `/map` | Show server link map |
| `/links [mask]` | Show server links |
| `/trace [target]` | Trace route to server |
| `/modules [name]` | List loaded IRCd modules |

### Connection & UI

| Command | Description |
|---|---|
| `/nick newnick` | Change your nickname |
| `/away [message]` | Set away status (no args = clear) |
| `/back` | Clear away status |
| `/quit [message]` | Disconnect from IRC |
| `/clear` | Clear current channel buffer (alias: `/cls`) |
| `/raw <line>` | Send raw IRC protocol line (alias: `/quote`) |
| `/help` | Show command summary |

---

## WEBIRC Configuration

### How WEBIRC Works

Without WEBIRC, all web chat users appear to connect from the web server's IP address. WEBIRC solves this by sending the *real* client IP to the IRCd before user registration:

```
WEBIRC <password> webchat <client-ip> <client-ip>
```

The IRCd verifies the password and source IP match a trusted WEBIRC block, then uses the provided IP as the user's connecting address.

### Step 1: Configure the IRCd

**Solanum / Charybdis:**
```
auth {
    user = "*@YOUR.SERVER.IP";
    password = "a-strong-secret-here";
    spoof = "webchat.yournetwork.com";
    class = "users";
};
```

**UnrealIRCd / CGI:IRC:**
```
cgiirc {
    type = "webirc";
    host = "YOUR.SERVER.IP";
    password = "a-strong-secret-here";
};
```

Rehash or restart the IRCd after editing.

### Step 2: Set the Password

In `.env`:
```env
WEBIRC_PASSWORD=a-strong-secret-here
```

Restart PureIRC after changing this value.

### Step 3: Verify

Connect via the web client and check server notices:

**Before WEBIRC:**
```
*** Client connecting: WebUser (webchat@your-vps-hostname) [SERVER.IP]
```

**After WEBIRC:**
```
*** Client connecting: WebUser (webchat@user-isp.com) [203.0.113.45]
```

### Important Notes

- The `WEBIRC_PASSWORD` must match **exactly** between `.env` and the IRCd config
- The IRCd must trust the IP the web server connects from — add blocks for both IPv4 and IPv6 if applicable
- The gateway reads `X-Forwarded-For` headers for real client IPs behind reverse proxies (Nginx, Cloudflare)
- Without `WEBIRC_PASSWORD` set, the gateway operates normally (all users show server IP)

---

## Theming Guide

### Built-in Themes

| Theme | Primary (`--theme-primary`) | Accent (`--theme-accent`) |
|-------|----------------------------|---------------------------|
| **Cyan** | `#06b6d4` | `#22d3ee` |
| **Purple** | `#a855f7` | `#d8b4fe` |
| **Emerald** | `#10b981` | `#6ee7b7` |
| **Rose** | `#f43f5e` | `#fb7185` |
| **Amber** | `#f59e0b` | `#fcd34d` |
| **Blue** | `#3b82f6` | `#60a5fa` |

### Theme Architecture

Themes work through two mechanisms:

1. **CSS Custom Properties**: `--theme-primary`, `--theme-accent`, `--theme-accent-light`, `--theme-accent-dark` are set on `:root` and used throughout the CSS.

2. **Tailwind Class Swapping**: The `ThemeManager` dynamically replaces Tailwind color utility classes (e.g., `bg-cyan-500` → `bg-purple-500`) across the DOM when themes change.

### Creating Custom Themes

Add a new entry to the `themes` object in `config.json`:

```json
{
  "themes": {
    "custom": {
      "name": "Custom",
      "description": "Your custom theme",
      "primary": "#ff6b6b",
      "accent": "red",
      "accentLight": "red-400",
      "accentDark": "red-600",
      "accentBg": "red-500/10",
      "accentBorder": "red-500/20",
      "accentGlow": "red-500/30",
      "textAccent": "#fca5a5"
    }
  }
}
```

> **Note**: The `accent` field must be a valid Tailwind color name (cyan, purple, emerald, rose, amber, blue, red, orange, etc.) because it's used to construct Tailwind utility classes.

### Theme Persistence

- User selection is stored in `localStorage` under the key `app-theme`
- On page load: stored theme > `config.branding.defaultTheme` > `"cyan"`
- Theme switcher can be hidden by setting `ui.showThemeSwitcher: false`

---

## Production Deployment

### systemd Service

```bash
sudo nano /etc/systemd/system/pureirc.service
```

```ini
[Unit]
Description=PureIRC Network Website
After=network.target

[Service]
Type=simple
User=pureirc
WorkingDirectory=/opt/PureIRC
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
sudo systemctl status pureirc

# Logs
journalctl -u pureirc -f
```

### Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name yournetwork.com www.yournetwork.com;

    ssl_certificate     /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/certs/key.pem;

    # Standard HTTP proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket gateway — requires Upgrade headers and long timeouts
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

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yournetwork.com www.yournetwork.com;
    return 301 https://$host$request_uri;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Cloudflare Configuration

1. **DNS**: A record pointing to your server IP (Proxied/orange cloud)
2. **SSL**: Full (strict) with a Cloudflare Origin Certificate
3. **WebSockets**: Enabled by default on all plans — `/ws/irc` works through the proxy automatically
4. **Page Rules** (optional):
   - `yournetwork.com/js/*` → Cache Level: Cache Everything
   - `yournetwork.com/api/*` → Cache Level: Bypass
   - `yournetwork.com/ws/*` → Cache Level: Bypass

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  pureirc:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      NODE_ENV: production
    restart: unless-stopped
    volumes:
      - ./config.json:/app/config.json:ro
```

```bash
docker compose up -d
docker compose logs -f pureirc
```

---

## Adapting for Your Network

PureIRC is designed as a **white-label solution**. To deploy it for any IRC network with zero code changes:

1. **Copy and edit `config.example.json` → `config.json`**: Set your network name, IRC host, default channel, featured channels, support channel, and branding.

2. **Copy and edit `.env.example` → `.env`**: Set `IRC_HOST`, `IRC_PORT`, `CORS_ORIGIN`, and optionally `WEBIRC_PASSWORD`.

3. **(Optional) Add custom themes**: Add entries to the `themes` object in `config.json` using any valid Tailwind color.

4. **(Optional) Change the favicon**: Replace `vite.svg` in the project root and update `config.site.favicon`.

5. **Deploy**: `npm start` — the entire site is now branded for your network.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| **Stats showing 0 users / 0 channels** | Bot hasn't connected or data hasn't loaded yet | Wait 15-30 seconds. Check logs for `[IRC]` errors. Verify IRC connectivity: `telnet irc.host 6667` |
| **Web chat won't connect** | WebSocket blocked, server down, or bad Nginx config | Check browser console (F12) for WS errors. Verify `/ws/irc` proxy passes `Upgrade` headers. Check `curl http://localhost:3000/health` |
| **All webchat users show server IP** | WEBIRC not configured | Set `WEBIRC_PASSWORD` in `.env` and add a matching WEBIRC/auth block to your IRCd config |
| **Styling is broken (black & white)** | Tailwind CDN blocked by CSP or network | Hard refresh (Ctrl+Shift+R). Check that `cdn.tailwindcss.com` is reachable. Verify CSP headers in `server.js` |
| **User prefixes not showing** | NAMES reply race condition | Prefixes are set from both NAMES and MODE events with merge logic. If missing, check browser console for mode-related errors |
| **Nick in use on connect** | Another client using the same nick | The gateway auto-appends `_` on `nick in use`. For the bot, it appends a random 3-digit number |
| **"Too many connections" error** | 3+ WebSocket connections from same IP | Close other tabs/windows. Rate limit is 3 per IP (configurable in `irc-gateway.js`, `MAX_CONNECTIONS_PER_IP`) |
| **Channel grid not updating** | Cache stale or bot disconnected | Check `curl http://localhost:3000/api/stats` — look at `cacheStatus.connected`. The bot auto-reconnects every 15 seconds |
| **Port 3000 already in use** | Another process on port 3000 | `lsof -i :3000` to find it, or change `PORT` in `.env` |

---

## Security Model

| Concern | Mitigation |
|---|---|
| **XSS** | All user input is HTML-escaped via `textContent`→`innerHTML` conversion. No `innerHTML` assignments with raw user data. |
| **CSP** | Helmet.js with explicit Content-Security-Policy: `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com`, `connect-src 'self' ws: wss:` |
| **CORS** | Configurable `CORS_ORIGIN`, defaults to same-origin |
| **WebSocket abuse** | Per-IP connection limit (3), 30s connection timeout, 512-byte message cap |
| **Password security** | NickServ passwords are used once for IDENTIFY and never stored. WEBIRC passwords are server-side only (`.env`, gitignored) |
| **IRC injection** | Message length cap at 512 bytes. Nickname validation against RFC 2812. Channel names validated and auto-prefixed |
| **Cache poisoning** | Cache is write-only from the trusted bot connection. No user input flows into the cache |
| **Information disclosure** | `.env` and `config.json` are gitignored. `/api/config` serves branding data only, no secrets |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
<sub>Built with Node.js, Express, irc-framework, and vanilla JavaScript — no build step required.</sub>
</div>
]]>
