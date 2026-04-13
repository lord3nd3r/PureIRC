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

// ========== STATIC FILES ==========
app.use(express.static(path.join(__dirname, 'public')));

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

// ========== API ROUTES ==========
app.use('/api', routes);

// ========== CONFIG ENDPOINT ==========
app.get('/api/config', (req, res) => {
  res.json(getFinalConfig());
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ========== ROOT ROUTE ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== CHAT STANDALONE ==========
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

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
  console.log(`\n🚀 PureIRC API Server`);
  console.log(`📌 Listening on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`📡 IRC Server: ${process.env.IRC_HOST}:${process.env.IRC_PORT}`);
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
