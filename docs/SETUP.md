# PureIRC Setup & Deployment Guide

## Prerequisites

- Node.js 16+ (check: `node --version`)
- npm 8+ (check: `npm --version`)
- Access to IRC server at `irc.pureirc.com:6667` (or configure in `.env`)
- Git (for version control)

---

## Local Development Setup

### 1. Clone Repository
```bash
cd /home/ender/burnout
# Already cloned, just pull latest
git pull origin master
```

### 2. Install Dependencies
```bash
npm install
```

This installs:
- `express` — Web server
- `irc` — IRC protocol client
- `cors` — CORS middleware
- `compression` — Gzip compression
- `helmet` — Security headers
- `dotenv` — Environment variables
- `tailwindcss`, `lucide` — UI libraries (dev deps)

### 3. Configure Environment
Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env`:
```bash
PORT=3000
NODE_ENV=development
IRC_HOST=irc.pureirc.com
IRC_PORT=6667
IRC_USE_SSL=false
CORS_ORIGIN=http://localhost:3000
CACHE_TTL_CHANNELS=45000
CACHE_TTL_STATS=30000
```

### 4. Start Server
```bash
npm start
```

Expected output:
```
🚀 PureIRC API Server
📌 Listening on http://localhost:3000
🌐 Environment: development
📡 IRC Server: irc.pureirc.com:6667
[IRC] Connecting to irc.pureirc.com:6667...
[IRC] Connected and registered
[Cache] IRC connection established
```

### 5. Test in Browser
Open: `http://localhost:3000`

You should see:
- Dark theme with cyan accents ✓
- Responsive header with navigation ✓
- Hero section with "The Internet Relay Chat Network" ✓
- Channel grid showing default channels ✓
- "Connect Now" button works ✓

### 6. Test API
```bash
curl http://localhost:3000/api/channels
curl http://localhost:3000/api/stats
curl http://localhost:3000/health
```

---

## Production Deployment

### Option A: VPS with systemd

#### 1. SSH into VPS
```bash
ssh user@your-vps.com
```

#### 2. Install Node.js
```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Clone Repository
```bash
cd /opt
sudo git clone https://github.com/youruser/pureirc-network.git
cd pureirc-network
sudo chown -R user:user .
```

#### 4. Install Dependencies
```bash
npm install --production
```

#### 5. Create `.env`
```bash
cp .env.example .env
nano .env
```

Set:
```
PORT=3000
NODE_ENV=production
IRC_HOST=irc.pureirc.com
IRC_PORT=6667
CORS_ORIGIN=https://pureirc.com
```

#### 6. Create systemd Service
```bash
sudo nano /etc/systemd/system/pureirc.service
```

Add:
```ini
[Unit]
Description=PureIRC Network Website
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/opt/pureirc-network
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

#### 7. Enable & Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable pureirc
sudo systemctl start pureirc
sudo systemctl status pureirc
```

#### 8. Setup Nginx Proxy
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/pureirc
```

Add:
```nginx
upstream pureirc {
  server localhost:3000;
}

server {
  listen 80;
  server_name pureirc.com www.pureirc.com;

  location / {
    proxy_pass http://pureirc;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

#### 9. Enable Site & SSL
```bash
sudo ln -s /etc/nginx/sites-available/pureirc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d pureirc.com -d www.pureirc.com
```

#### 10. Check Logs
```bash
sudo journalctl -u pureirc -f
```

---

### Option B: Docker Deployment

#### 1. Create `Dockerfile`
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 2. Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  pureirc:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      IRC_HOST: irc.pureirc.com
      IRC_PORT: 6667
      PORT: 3000
    restart: unless-stopped
    networks:
      - pureirc

networks:
  pureirc:
    driver: bridge
```

#### 3. Deploy
```bash
docker-compose up -d
docker-compose logs -f
```

---

### Option C: Heroku Deployment

#### 1. Create `Procfile`
```
web: node server.js
```

#### 2. Install Heroku CLI
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

#### 3. Login & Deploy
```bash
heroku login
heroku create pureirc-network
git push heroku master
heroku logs -t
```

#### 4. Set Environment Variables
```bash
heroku config:set NODE_ENV=production
heroku config:set IRC_HOST=irc.pureirc.com
heroku config:set IRC_PORT=6667
```

---

## Building for Production

### Optimize Frontend
```bash
# Already using local Lucide + Tailwind CDN
# No additional build step needed for JS

# Optional: Pre-minify main.js
npm install -g uglify-js
uglifyjs public/js/main.js -c -m -o public/js/main.min.js
# Update HTML to use main.min.js
```

### Cache Busting
Add version to CSS/JS filenames:
```html
<script src="/js/main.js?v=1.0.0"></script>
```

### Enable Compression
Already configured in `server.js` with:
```javascript
app.use(compression());
```

### Security Headers
Already configured in `server.js` with:
```javascript
app.use(helmet());
```

---

## Monitoring & Maintenance

### Check Server Status
```bash
curl http://localhost:3000/health
```

### View Recent Logs
```bash
# Development
tail -f /path/to/console.log

# systemd
sudo journalctl -u pureirc -n 50

# Docker
docker-compose logs -f
```

### Restart Service
```bash
# systemd
sudo systemctl restart pureirc

# Docker
docker-compose restart

# Manual
pkill -f "node server.js"
npm start
```

### Monitor Cache Performance
```bash
curl http://localhost:3000/api/stats | jq '.cacheStatus'
```

Expected:
- Cache age < 45000ms for channels
- Cache age < 30000ms for stats

### Database Backup (Future)
```bash
# When using SQLite
cp db/users.db db/users.db.backup
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### IRC Connection Failed
```bash
# Test IRC server connectivity
telnet irc.pureirc.com 6667

# Check .env IRC settings
cat .env | grep IRC_

# Check server logs
npm start  # Look for [IRC] errors
```

### Tailwind CSS Not Loading
- Clear browser cache: Ctrl+Shift+Delete
- Ensure https://cdn.tailwindcss.com is accessible
- Check CSP headers: `curl -I http://localhost:3000`

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

### Out of Memory
Increase Node heap size:
```bash
node --max-old-space-size=4096 server.js
```

---

## Performance Tips

1. **Increase Cache TTL** if IRC server is slow:
   ```bash
   CACHE_TTL_CHANNELS=60000  # 60 seconds
   CACHE_TTL_STATS=45000     # 45 seconds
   ```

2. **Enable Gzip Compression** (already enabled in helmet/compression)

3. **Use CDN for Static Assets**:
   - Serve `public/` from CloudFlare/CloudFront
   - Set long cache headers

4. **Database Optimization** (future):
   ```bash
   CREATE INDEX idx_channel_name ON channels(name);
   CREATE INDEX idx_user_email ON users(email);
   ```

5. **Monitor IRC Connection**:
   - Connection pooling (not needed for read-only)
   - Auto-reconnect on disconnect (already implemented)

---

## Security Checklist

- [ ] Change default IRC server if needed (.env)
- [ ] Enable SSL/TLS for IRC (IRC_USE_SSL=true)
- [ ] Set strong CORS_ORIGIN
- [ ] Keep Node.js and dependencies updated (`npm audit`, `npm update`)
- [ ] Use HTTPS in production (set up with Certbot/Nginx)
- [ ] Restrict API rate limiting (future feature)
- [ ] Enable database encryption if using user accounts
- [ ] Keep database backups
- [ ] Monitor error logs for suspicious activity

---

## Getting Help

1. Check logs: `npm start` (development) or `sudo journalctl -u pureirc -f` (systemd)
2. Read docs: See `/docs` folder
3. Test endpoints: `curl http://localhost:3000/api/channels`
4. Report issues on GitHub

