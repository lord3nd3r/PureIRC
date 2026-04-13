# PureIRC API Documentation

## Base URL
```
http://localhost:3000/api
```

---

## Endpoints

### 1. Get All Channels
**Request:**
```http
GET /api/channels
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "#lobby",
      "topic": "General chat and welcome",
      "users": 312,
      "category": "General",
      "pinned": true
    },
    {
      "name": "#tech",
      "topic": "Programming and tech",
      "users": 247,
      "category": "Technology",
      "pinned": false
    }
  ],
  "count": 2,
  "timestamp": "2026-04-13T00:06:15.898Z"
}
```

**Status Codes:**
- `200 OK` — Success
- `500 Internal Server Error` — IRC connection failed

**Caching:** 45-second TTL

**Example:**
```bash
curl http://localhost:3000/api/channels | jq
```

---

### 2. Get Single Channel
**Request:**
```http
GET /api/channels/:name
```

**Path Parameters:**
- `name` (string) — Channel name (e.g., `lobby` or `#lobby`)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "#lobby",
    "topic": "General chat and welcome",
    "users": 312,
    "created": "2003-01-15",
    "category": "General"
  },
  "timestamp": "2026-04-13T00:06:15.898Z"
}
```

**Status Codes:**
- `200 OK` — Success
- `404 Not Found` — Channel doesn't exist
- `500 Internal Server Error` — IRC connection failed

**Example:**
```bash
curl http://localhost:3000/api/channels/lobby
curl http://localhost:3000/api/channels/%23lobby  # %23 = #
```

---

### 3. Get Server Statistics
**Request:**
```http
GET /api/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2026-04-13T00:03:54.716Z",
    "connected": true,
    "host": "irc.pureirc.com",
    "port": 6667,
    "usersOnline": 3402,
    "totalChannels": 287,
    "operators": 15,
    "uptime": null,
    "cached": true,
    "cachedAt": "2026-04-13T00:03:56.716Z"
  },
  "cacheStatus": {
    "connected": true,
    "channels": {
      "count": 287,
      "cached": true,
      "age": 1234,
      "ttl": 45000
    },
    "stats": {
      "cached": true,
      "age": 1234,
      "ttl": 30000
    }
  },
  "timestamp": "2026-04-13T00:03:54.716Z"
}
```

**Status Codes:**
- `200 OK` — Success (even if IRC disconnected, returns cached data)
- `500 Internal Server Error` — Fatal error

**Caching:** 30-second TTL

**Example:**
```bash
curl http://localhost:3000/api/stats | jq
```

---

### 4. Health Check
**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-13T00:06:15.898Z",
  "uptime": 1234.567
}
```

**Status Codes:**
- `200 OK` — Server is running

**Example:**
```bash
curl http://localhost:3000/health
```

---

## Error Responses

### Generic Error Format
```json
{
  "success": false,
  "error": {
    "message": "Failed to connect to IRC server",
    "code": "IRC_CONNECTION_ERROR"
  },
  "timestamp": "2026-04-13T00:06:15.898Z"
}
```

### Common Error Codes
- `IRC_CONNECTION_ERROR` — Can't connect to IRC server
- `INVALID_CHANNEL_NAME` — Channel name format invalid
- `CHANNEL_NOT_FOUND` — Channel doesn't exist on network
- `CACHE_EXPIRED` — Cache expired and can't refresh

---

## Rate Limiting

Currently **no rate limiting** is implemented. 

Future: Implement rate limiting at 100 requests/minute per IP to prevent abuse.

---

## CORS Headers

All endpoints support CORS. The server accepts requests from:
```
http://localhost:3000
```

Configure in `.env`:
```bash
CORS_ORIGIN=http://localhost:3000
```

---

## Data Formats

### Channel Object
```json
{
  "name": "#channelname",
  "topic": "Channel description",
  "users": 123,
  "category": "General|Support|Technology|Gaming|Entertainment",
  "pinned": true,
  "created": "2003-01-15",
  "modes": "+nt"
}
```

### Server Stats Object
```json
{
  "usersOnline": 3400,
  "totalChannels": 287,
  "operators": 15,
  "host": "irc.pureirc.com",
  "port": 6667,
  "connected": true,
  "uptime": 86400,
  "cached": true,
  "cachedAt": "ISO 8601 timestamp"
}
```

---

## Response Headers

All responses include:
```
Content-Type: application/json
Access-Control-Allow-Origin: http://localhost:3000
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'
```

---

## Examples

### Fetch channels with curl
```bash
curl -s http://localhost:3000/api/channels | jq '.data | .[0]'
```

### Fetch channels with JavaScript
```javascript
fetch('/api/channels')
  .then(res => res.json())
  .then(data => console.log(data.data))
  .catch(err => console.error(err));
```

### Watch stats update every 30 seconds
```bash
watch -n 30 'curl -s http://localhost:3000/api/stats | jq .data.usersOnline'
```

### Check cache age
```bash
curl -s http://localhost:3000/api/stats | jq '.cacheStatus'
```

