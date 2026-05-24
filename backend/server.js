// CortexFlow — Express Server
// API routes for the CortexFlow intelligence pipeline

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const rag = require('./rag');
const contextBuilder = require('./contextBuilder');
const orchestrator = require('./orchestrator');
const cache = require('./cache');
const agents = require('./agents');
const { searchWeb } = require('./search');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ─── INITIALIZATION ────────────────────────────────────────────────

async function initialize() {
  console.log('\n🧠 CortexFlow — Starting up...\n');

  // Initialize RAG
  await rag.initialize();

  // Initialize cache (Redis with fallback)
  await cache.initialize();

  console.log('\n✅ All systems initialized\n');
}

// ─── ROUTES ────────────────────────────────────────────────────────

/**
 * POST /api/analyze
 * Start analysis with just the idea. Returns guided questions.
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { idea } = req.body;

    if (!idea || idea.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide an idea with at least 10 characters.'
      });
    }

    // Generate session
    const sessionId = uuidv4();

    // Get initial RAG results for context-aware questions
    const retrieved = rag.retrieve(idea, 5);

    // Generate follow-up questions
    const questions = contextBuilder.generateQuestions(idea);

    // Store session state
    await cache.setSession(sessionId, {
      idea,
      retrieved,
      startedAt: Date.now()
    });

    res.json({
      sessionId,
      questions,
      retrievedCount: retrieved.length,
      message: 'Answer the questions below to personalize your analysis (all optional).'
    });
  } catch (error) {
    console.error('[Server] /api/analyze error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/analyze/run
 * Run the full pipeline with idea + answers.
 */
app.post('/api/analyze/run', async (req, res) => {
  try {
    const { idea, answers = {}, sessionId } = req.body;

    if (!idea || idea.trim().length < 10) {
      return res.status(400).json({
        error: 'Please provide an idea with at least 10 characters.'
      });
    }

    // Retrieve relevant documents + live web data in parallel
    const [retrieved, liveSearch] = await Promise.all([
      Promise.resolve(rag.retrieve(
        `${idea} ${answers.audience || ''} ${answers.problem || ''} ${answers.productType || ''}`,
        5
      )),
      searchWeb(idea, answers.audience || '').catch(err => {
        console.warn('[Server] Live search failed, continuing without:', err.message);
        return { results: [], searchQueries: [], timestamp: null };
      })
    ]);

    // Build structured context with live data
    const context = contextBuilder.build(idea, answers, retrieved, liveSearch.results);

    // Run the agent pipeline
    const result = await orchestrator.run(context);

    // Add the questions that were answered for transparency
    result.questions = Object.entries(answers)
      .filter(([_, v]) => v && v.trim())
      .map(([k, v]) => ({ question: k, answer: v }));

    // Store final result in session for resume and refinement
    await cache.setSession(sessionId, {
      context,
      result
    });

    res.json(result);
  } catch (error) {
    console.error('[Server] /api/analyze/run error:', error);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

/**
 * GET /api/session/:id
 * Retrieve past session state.
 */
app.get('/api/session/:id', async (req, res) => {
  try {
    const session = await cache.getSession(req.params.id);
    if (!session || !session.result) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

/**
 * POST /api/analyze/refine
 * Answer a follow-up question based on the current strategy.
 */
app.post('/api/analyze/refine', async (req, res) => {
  try {
    const { sessionId, question } = req.body;
    if (!sessionId || !question) {
      return res.status(400).json({ error: 'Missing sessionId or question' });
    }

    const session = await cache.getSession(sessionId);
    if (!session || !session.result) {
      return res.status(404).json({ error: 'Session not found or incomplete' });
    }

    const answer = await agents.refinementAgent(session.result, session.context, question);
    res.json({ answer });
  } catch (error) {
    console.error('[Server] /api/analyze/refine error:', error);
    res.status(500).json({ error: 'Refinement failed' });
  }
});

/**
 * GET /api/health
 * Health check endpoint.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    cache: cache.getStats(),
    ewmaLatency: orchestrator.getEWMALatency(),
    timestamp: new Date().toISOString()
  });
});

// ─── START SERVER ──────────────────────────────────────────────────

initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CortexFlow API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}).catch(err => {
  console.error('Failed to initialize:', err);
  process.exit(1);
});
