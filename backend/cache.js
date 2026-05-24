// CortexFlow — Cache Module
// Redis-backed caching with in-memory fallback for MVP

const { createClient } = require('redis');
const crypto = require('crypto');

class Cache {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map();
    this.isRedisConnected = false;
    this.TTL = 3600; // 1 hour default TTL
  }

  /**
   * Try to connect to Redis. Falls back to in-memory cache if unavailable.
   */
  async initialize() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 3000,
          reconnectStrategy: false  // Don't auto-reconnect
        }
      });

      // Suppress repeated error logs
      this.redisClient.on('error', () => {});

      await this.redisClient.connect();
      this.isRedisConnected = true;
      console.log('[Cache] Connected to Redis');
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
      if (this.isRedisConnected) {
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
      if (this.isRedisConnected) {
        await this.redisClient.set(key, JSON.stringify(value), { EX: this.TTL });
      } else {
        this.memoryCache.set(key, { value, timestamp: Date.now() });
      }
      console.log(`[Cache] SET - ${prefix}`);
    } catch (err) {
      console.log(`[Cache] Error writing: ${err.message}`);
    }
  }

  /**
   * Store session state for a given session ID.
   */
  async setSession(sessionId, data) {
    await this.set('session', sessionId, data);
  }

  /**
   * Retrieve session state.
   */
  async getSession(sessionId) {
    return await this.get('session', sessionId);
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
