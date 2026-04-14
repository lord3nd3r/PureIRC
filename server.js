import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import routes from './api/routes.js';
import { attachGateway } from './services/irc-gateway.js';
import getCache from './services/irc-cache.js';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ========== MIDDLEWARE ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      upgradeInsecureRequests: null,
    }
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ========== LOAD CONFIG ==========
let baseConfig = {};
try {
  const configPath = path.join(__dirname, 'config.json');
  const configData = fs.readFileSync(configPath, 'utf8');
  baseConfig = JSON.parse(configData);
} catch (err) {
  console.error('[ERROR] Failed to load config.json:', err);
}

// Function to build final config (merging env overrides)
function getFinalConfig() {
  const config = JSON.parse(JSON.stringify(baseConfig)); // Deep copy
  
  // Override with environment variables if set
  if (process.env.IRC_HOST) config.irc.host = process.env.IRC_HOST;
  if (process.env.IRC_PORT) config.irc.port = parseInt(process.env.IRC_PORT, 10);
  if (process.env.IRC_SSL_PORT) config.irc.portSSL = parseInt(process.env.IRC_SSL_PORT, 10);
  if (process.env.IRC_NICK) config.irc.botName = process.env.IRC_NICK;
  if (process.env.IRC_USERNAME) config.irc.botUsername = process.env.IRC_USERNAME;
  if (process.env.IRC_REALNAME) config.irc.botRealname = process.env.IRC_REALNAME;
  
  return config;
}

// Make config globally available to all modules
global.appConfig = getFinalConfig();
console.log('[Config] Loaded with IRC host:', global.appConfig.irc.host);

// ========== TEMPLATE RENDERING FUNCTION ==========
async function renderTemplate(filePath, res) {
  try {
    const config = getFinalConfig();
    const siteName = config.site?.name || 'PureIRC';
    const domain = config.site?.domain || 'pureirc.com';
    const description = config.site?.description || '';
    const tagline = config.site?.tagline || 'The Internet\nRelay Chat Network';
    const footerDescription = config.site?.footerDescription || '';
    const foundedYear = String(config.site?.foundedYear || new Date().getFullYear());
    const defaultChannel = config.irc?.defaultChannel || '#help';
    const supportChannel = config.social?.supportChannel || '#help';
    const userPrefix = config.irc?.userPrefix || 'User';
    const ircHost = config.irc?.host || 'irc.pureirc.com';
    const ircPort = String(config.irc?.port || 6667);
    const ircPortSSL = String(config.irc?.portSSL || 6697);

    // Fetch live channel count from IRC cache
    let maxChannels = '0';
    try {
      const cache = getCache();
      const channels = await cache.getChannels();
      maxChannels = String(channels.length || 0);
      console.log(`[Template] Fetched ${maxChannels} channels for rendering`);
    } catch (err) {
      console.warn('[Template] Could not fetch live channel count:', err.message);
      maxChannels = '0';
    }

    let html = fs.readFileSync(filePath, 'utf8');
    html = html.replace(/\{\{SITE_NAME\}\}/g, siteName);
    html = html.replace(/\{\{SITE_DOMAIN\}\}/g, domain);
    html = html.replace(/\{\{SITE_DESCRIPTION\}\}/g, description);
    html = html.replace(/\{\{SITE_TAGLINE\}\}/g, tagline);
    html = html.replace(/\{\{FOOTER_DESCRIPTION\}\}/g, footerDescription);
    html = html.replace(/\{\{FOUNDED_YEAR\}\}/g, foundedYear);
    html = html.replace(/\{\{DEFAULT_CHANNEL\}\}/g, defaultChannel);
    html = html.replace(/\{\{SUPPORT_CHANNEL\}\}/g, supportChannel);
    html = html.replace(/\{\{USER_PREFIX\}\}/g, userPrefix);
    html = html.replace(/\{\{IRC_HOST\}\}/g, ircHost);
    html = html.replace(/\{\{IRC_PORT\}\}/g, ircPort);
    html = html.replace(/\{\{IRC_PORT_SSL\}\}/g, ircPortSSL);
    html = html.replace(/\{\{MAX_CHANNELS\}\}/g, maxChannels);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(html);
  } catch (err) {
    console.error('[Template] Rendering error:', err);
    res.status(500).send('Template rendering error: ' + err.message);
  }
}

// ========== CONFIG ENDPOINT ==========
app.get('/api/config', async (req, res) => {
  const config = getFinalConfig();
  
  // Add real channel count from IRC cache
  try {
    const cache = getCache();
    const channels = await cache.getChannels();
    config.irc.maxChannels = channels.length;
  } catch (err) {
    console.warn('[Config] Could not fetch live channel count:', err.message);
    // Fall back to config value if available
    if (!config.irc.maxChannels) {
      config.irc.maxChannels = 0;
    }
  }
  
  res.json(config);
});

// ========== ROOT ROUTE ==========
app.get('/', async (req, res) => {
  await renderTemplate(path.join(__dirname, 'public', 'index.html'), res);
});

// ========== CHAT STANDALONE ==========
app.get('/chat', async (req, res) => {
  await renderTemplate(path.join(__dirname, 'public', 'chat.html'), res);
});

// ========== API ROUTES ==========
app.use('/api', routes);

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========== STATIC FILES (serve after dynamic routes) ==========
app.use(express.static(path.join(__dirname, 'public'), {
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'Not Found',
      status: 404
    }
  });
});

// ========== START SERVER ==========
const server = createServer(app);

// Attach WebSocket-to-IRC gateway
attachGateway(server);

server.listen(PORT, () => {
  const cfg = global.appConfig || {};
  const ircCfg = cfg.irc || {};
  console.log(`\n🚀 PureIRC API Server`);
  console.log(`📌 Listening on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 IRC Server: ${ircCfg.host}:${ircCfg.port}`);
  console.log(`🔌 WebSocket gateway: ws://localhost:${PORT}/ws/irc\n`);
});

// ========== GRACEFUL SHUTDOWN ==========
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
