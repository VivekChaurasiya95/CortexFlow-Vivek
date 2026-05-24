// CortexFlow — PostgreSQL Database Module
// Persistent storage for sessions, ideas, and analysis results

const { Pool } = require('pg');

class Database {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize PostgreSQL connection pool
   */
  async initialize() {
    const connectionString = process.env.DATABASE_URL || this._buildConnectionString();

    if (!connectionString) {
      console.log('[Database] No DATABASE_URL provided, skipping PostgreSQL initialization');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      this.pool.on('error', (err) => {
        console.error('[Database] Pool error:', err.message);
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('[Database] Connected to PostgreSQL');

      // Initialize schema
      await this._initializeSchema();
    } catch (err) {
      console.warn('[Database] PostgreSQL connection failed:', err.message);
      this.isConnected = false;
    }
  }

  /**
   * Build connection string from environment variables
   */
  _buildConnectionString() {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT || '5432';
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_NAME;

    if (!host || !user || !password || !database) {
      return null;
    }

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Create database schema if not exists
   */
  async _initializeSchema() {
    if (!this.isConnected || !this.pool) return;

    try {
      await this.pool.query(`
        CREATE EXTENSION IF NOT EXISTS pgcrypto;

        CREATE TABLE IF NOT EXISTS sessions (
          session_id UUID PRIMARY KEY,
          idea TEXT NOT NULL,
          answers JSONB,
          retrieved JSONB,
          context JSONB,
          result JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ideas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          status VARCHAR(50) DEFAULT 'draft',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS analysis_results (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
          research JSONB,
          market JSONB,
          risk JSONB,
          strategy JSONB,
          sources JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
        CREATE INDEX IF NOT EXISTS idx_ideas_session_id ON ideas(session_id);
        CREATE INDEX IF NOT EXISTS idx_analysis_session_id ON analysis_results(session_id);
      `);

      console.log('[Database] Schema initialized');
    } catch (err) {
      console.error('[Database] Schema initialization error:', err.message);
    }
  }

  /**
   * Store or update a session with full context and results
   */
  async saveSession(sessionId, data) {
    if (!this.isConnected || !this.pool) return;

    try {
      const { idea, answers, retrieved, context, result } = data;

      await this.pool.query(
        `INSERT INTO sessions (session_id, idea, answers, retrieved, context, result, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
         ON CONFLICT (session_id) DO UPDATE SET
           idea = COALESCE($2, sessions.idea),
           answers = COALESCE($3, sessions.answers),
           retrieved = COALESCE($4, sessions.retrieved),
           context = COALESCE($5, sessions.context),
           result = COALESCE($6, sessions.result),
           updated_at = CURRENT_TIMESTAMP`,
        [sessionId, idea || null, answers || null, retrieved || null, context || null, result || null]
      );

      console.log('[Database] Session saved:', sessionId);
    } catch (err) {
      console.error('[Database] Save session error:', err.message);
    }
  }

  /**
   * Retrieve a session by ID
   */
  async getSession(sessionId) {
    if (!this.isConnected || !this.pool) return null;

    try {
      const result = await this.pool.query(
        `SELECT * FROM sessions WHERE session_id = $1`,
        [sessionId]
      );

      if (result.rows.length > 0) {
        console.log('[Database] Session retrieved:', sessionId);
        return result.rows[0];
      }

      return null;
    } catch (err) {
      console.error('[Database] Get session error:', err.message);
      return null;
    }
  }

  /**
   * Save analysis result
   */
  async saveAnalysisResult(sessionId, result) {
    if (!this.isConnected || !this.pool) return;

    try {
      const { research, market, risk, strategy, sources } = result;

      await this.pool.query(
        `INSERT INTO analysis_results (session_id, research, market, risk, strategy, sources)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [sessionId, research || null, market || null, risk || null, strategy || null, sources || null]
      );

      console.log('[Database] Analysis result saved:', sessionId);
    } catch (err) {
      console.error('[Database] Save analysis error:', err.message);
    }
  }

  /**
   * Get all sessions (for debugging/admin)
   */
  async getAllSessions(limit = 50) {
    if (!this.isConnected || !this.pool) return [];

    try {
      const result = await this.pool.query(
        `SELECT session_id, idea, created_at, updated_at FROM sessions ORDER BY created_at DESC LIMIT $1`,
        [limit]
      );

      return result.rows;
    } catch (err) {
      console.error('[Database] Get all sessions error:', err.message);
      return [];
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      console.log('[Database] Connection closed');
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      poolSize: this.pool ? this.pool.totalCount : 0
    };
  }
}

module.exports = new Database();
