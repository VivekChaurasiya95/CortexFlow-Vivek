# CortexFlow Database Setup Guide

This guide walks through setting up **Redis** and **PostgreSQL** for CortexFlow.

## Overview

- **Redis**: Fast in-memory cache for session caching, semantic query caching, and agent output reuse
- **PostgreSQL**: Persistent database for storing sessions, ideas, and analysis results

## Redis Setup

### Option 1: Docker (Recommended)

```bash
docker run -d \
  --name cortexflow-redis \
  -p 6379:6379 \
  redis:7-alpine
```

Verify connection:
```bash
redis-cli ping
# Output: PONG
```

### Option 2: Local Installation

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use Windows Subsystem for Linux (WSL)

**Mac:**
```bash
brew install redis
redis-server
```

**Linux:**
```bash
sudo apt-get install redis-server
redis-server
```

## PostgreSQL Setup

### Option 1: Docker (Recommended)

```bash
docker run -d \
  --name cortexflow-postgres \
  -e POSTGRES_USER=cortexflow \
  -e POSTGRES_PASSWORD=cortexflow_password \
  -e POSTGRES_DB=cortexflow \
  -p 5432:5432 \
  postgres:16-alpine
```

Verify connection:
```bash
psql -h localhost -U cortexflow -d cortexflow
```

### Option 2: Local Installation

**Windows:**
- Download from: https://www.postgresql.org/download/windows/

**Mac:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Create Database and User

```bash
psql -U postgres -h localhost

# Inside psql:
CREATE USER cortexflow WITH PASSWORD 'cortexflow_password';
CREATE DATABASE cortexflow OWNER cortexflow;
GRANT ALL PRIVILEGES ON DATABASE cortexflow TO cortexflow;
```

Or use a connection command:
```bash
psql -h localhost -U cortexflow -d cortexflow -c "SELECT NOW();"
```

## Backend Configuration

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Create `.env` File

Copy from `.env.example` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-...

# Redis Configuration
REDIS_URL=redis://localhost:6379

# PostgreSQL Configuration
DATABASE_URL=postgresql://cortexflow:cortexflow_password@localhost:5432/cortexflow
DB_HOST=localhost
DB_PORT=5432
DB_USER=cortexflow
DB_PASSWORD=cortexflow_password
DB_NAME=cortexflow

# Server
PORT=3001
```

### 3. Start the Server

```bash
npm run dev
# Or for production: npm start
```

The server will:
1. Initialize Redis connection (with fallback to in-memory if unavailable)
2. Initialize PostgreSQL connection and auto-create schema
3. Start API on `http://localhost:3001`

## Verify Setup

### Check Health Endpoint

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "cache": {
    "backend": "redis",
    "memoryEntries": 0
  },
  "database": {
    "connected": true,
    "poolSize": 1
  },
  "ewmaLatency": 0,
  "timestamp": "2026-05-24T10:00:00.000Z"
}
```

### List Sessions (Admin)

```bash
curl http://localhost:3001/api/admin/sessions?limit=10
```

## Using Docker Compose (Easiest)

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: cortexflow
      POSTGRES_PASSWORD: cortexflow_password
      POSTGRES_DB: cortexflow
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cortexflow"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  redis_data:
  postgres_data:
```

Start both services:
```bash
docker-compose up -d
```

## Database Schema

The schema is automatically created on first run. Tables:

- `sessions`: User analysis sessions
- `ideas`: Product ideas (optional, for future expansion)
- `analysis_results`: Stored analysis outputs

## Connection Fallbacks

- **Redis**: Gracefully falls back to in-memory cache if unavailable
- **PostgreSQL**: Logs warning but continues operating without persistence

For production, ensure both services are always available.

## Troubleshooting

### Redis Connection Issues

```bash
# Check if Redis is running
redis-cli ping

# Clear Redis cache
redis-cli FLUSHALL

# View Redis logs
docker logs cortexflow-redis
```

### PostgreSQL Connection Issues

```bash
# Test connection
psql -h localhost -U cortexflow -d cortexflow

# View recent connections
SELECT datname, usename, state FROM pg_stat_activity;

# Check PostgreSQL logs
docker logs cortexflow-postgres
```

### Clear All Data

**Redis:**
```bash
redis-cli FLUSHALL
```

**PostgreSQL:**
```bash
psql -U cortexflow -d cortexflow -c "DROP TABLE IF EXISTS analysis_results, ideas, sessions CASCADE;"
```

## Next Steps

1. Start Redis and PostgreSQL
2. Create `.env` with correct credentials
3. Run `npm install` in `/backend`
4. Run `npm run dev` to start the server
5. Test with health endpoint: `curl http://localhost:3001/api/health`
