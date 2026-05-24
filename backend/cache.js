// CortexFlow — Cache Module
// Redis-backed caching with in-memory fallback for MVP

const { createClient } = require('redis');
const crypto = require('crypto');
const database = require('./database');

class Cache {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    this.TTL = Number(process.env.CACHE_TTL || 3600); // seconds
  }

  /**
   * Try to connect to Redis. Falls back to in-memory cache if unavailable.
   */
  async initialize() {
    const redisUrl = this._buildRedisUrl();

    if (!redisUrl) {
      console.log('[Cache] No REDIS_URL provided, using in-memory cache');
      this.isRedisConnected = false;
      return;
    }

    try {
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries >= 12) return new Error('Redis reconnect attempts exhausted');
            return Math.min(1000 * retries, 30000);
          }
        }
      });

      this.redisClient.on('error', (err) => {
        console.error('[Cache] Redis error:', err && err.message ? err.message : err);
      });
      this.redisClient.on('ready', () => {
        this.isRedisConnected = true;
        console.log('[Cache] Redis ready');
      });
      this.redisClient.on('end', () => {
        this.isRedisConnected = false;
        console.warn('[Cache] Redis connection closed');
      });

      await this.redisClient.connect();
      const pong = await this.redisClient.ping().catch(() => null);
      if (pong) {
        this.isRedisConnected = true;
        console.log('[Cache] Connected to Redis (PING OK)');
      } else {
        console.warn('[Cache] Connected to Redis but PING failed');
      }
    } catch (err) {
      console.log('[Cache] Redis unavailable, using in-memory cache');
      this.isRedisConnected = false;
      // Clean up the client to prevent reconnect attempts
      if (this.redisClient) {
        try { await this.redisClient.disconnect(); } catch (_) {}
        this.redisClient = null;
      }
    }
  }

  /**
   * Resolve Redis URL from environment variables.
   */
  _buildRedisUrl() {
    if (process.env.REDIS_URL) return process.env.REDIS_URL;

    const host = process.env.REDIS_HOST || process.env.REDIS_ENDPOINT;
    const port = process.env.REDIS_PORT || '6379';
    const username = process.env.REDIS_USERNAME || 'default';
    const token = process.env.REDIS_TOKEN || process.env.REDIS_PASSWORD;
    const tls = process.env.REDIS_TLS === 'true';

    if (!host || !token) return null;

    const scheme = tls ? 'rediss' : 'redis';
    const user = encodeURIComponent(username);
    const pass = encodeURIComponent(token);
    return `${scheme}://${user}:${pass}@${host}:${port}`;
  }

  /**
   * Generate a cache key from a string input using MD5 hash.
   */
  _generateKey(prefix, input) {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return `cortexflow:${prefix}:${hash}`;
  }

  /**
   * Get a value from cache.
   */
  async get(prefix, input) {
    const key = this._generateKey(prefix, input);

    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          console.log(`[Cache] HIT - ${prefix}`);
          return JSON.parse(value);
        }
      } else {
        const entry = this.memoryCache.get(key);
        if (entry && Date.now() - entry.timestamp < this.TTL * 1000) {
          console.log(`[Cache] HIT (memory) - ${prefix}`);
          return entry.value;
        }
      }
    } catch (err) {
      console.log(`[Cache] Error reading: ${err.message}`);
      this.isRedisConnected = false;
    }

    console.log(`[Cache] MISS - ${prefix}`);
    return null;
  }

  /**
   * Set a value in cache.
   */
  async set(prefix, input, value) {
    const key = this._generateKey(prefix, input);

    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.set(key, JSON.stringify(value), { EX: this.TTL });
      } else {
        this.memoryCache.set(key, { value, timestamp: Date.now() });
      }
      console.log(`[Cache] SET - ${prefix}`);
    } catch (err) {
      console.log(`[Cache] Error writing: ${err.message}`);
      this.isRedisConnected = false;
    }
  }

  /**
   * Store session state for a given session ID.
   */
  async setSession(sessionId, data) {
    await this.set('session', sessionId, data);
    await database.saveSession(sessionId, data);

    if (data && data.result) {
      await database.saveAnalysisResult(sessionId, data.result);
    }
  }

  /**
   * Retrieve session state.
   */
  async getSession(sessionId) {
    const cached = await this.get('session', sessionId);
    if (cached) return cached;

    const dbSession = await database.getSession(sessionId);
    if (!dbSession) return null;

    const sessionData = {
      idea: dbSession.idea,
      answers: dbSession.answers || undefined,
      retrieved: dbSession.retrieved || undefined,
      context: dbSession.context || undefined,
      result: dbSession.result || undefined,
      startedAt: dbSession.created_at ? new Date(dbSession.created_at).getTime() : undefined
    };

    await this.set('session', sessionId, sessionData);
    return sessionData;
  }

  /**
   * Get cache stats for observability.
   */
  getStats() {
    return {
      backend: this.isRedisConnected ? 'redis' : 'memory',
      memoryEntries: this.memoryCache.size
    };
  }
}

module.exports = new Cache();
