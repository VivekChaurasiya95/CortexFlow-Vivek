// CortexFlow — Orchestrator
// Coordinates the multi-agent pipeline with parallel/sequential execution

const { researchAgent, riskAgent, marketAgent, strategyAgent } = require('./agents');
const cache = require('./cache');
const EWMATracker = require('./ewma');

const pipelineLatencyTracker = new EWMATracker(0.2);

class Orchestrator {
  /**
   * Run the full agent pipeline on a structured context.
   * 
   * Pipeline:
   * 1. [Parallel] Research Agent + Risk Agent
   * 2. [Sequential] Market Agent (needs research output)
   * 3. [Sequential] Strategy Agent (needs all outputs)
   * 
   * @param {object} context - Structured context from ContextBuilder
   * @param {function} onProgress - Optional callback for progress updates
   * @returns {object} Combined results from all agents
   */
  async run(context, onProgress = () => {}) {
    const cacheKey = JSON.stringify({
      idea: context.idea,
      audience: context.audience,
      problem: context.problem,
      product_type: context.product_type
    });

    // Check full pipeline cache
    const cached = await cache.get('pipeline', cacheKey);
    if (cached) {
      onProgress({ stage: 'complete', message: 'Retrieved from cache', cached: true });
      return cached;
    }

    const log = {
      startTime: Date.now(),
      stages: [],
      cacheHits: []
    };

    let research, risk, market, strategy;

    // ── Step 1: Parallel — Research + Risk ──────────────────────
    onProgress({ stage: 'research_risk', message: 'Research Agent and Risk Agent thinking...' });

    // Check individual agent caches
    const cachedResearch = await cache.get('agent:research', cacheKey);
    const cachedRisk = await cache.get('agent:risk', cacheKey);

    const step1Start = Date.now();

    if (cachedResearch && cachedRisk) {
      research = cachedResearch;
      risk = cachedRisk;
      log.cacheHits.push('research', 'risk');
    } else {
      const results = await Promise.all([
        cachedResearch || researchAgent(context),
        cachedRisk || riskAgent(context)
      ]);
      research = results[0];
      risk = results[1];

      // Cache individual results
      if (!cachedResearch) await cache.set('agent:research', cacheKey, research);
      if (!cachedRisk) await cache.set('agent:risk', cacheKey, risk);
    }

    log.stages.push({
      name: 'research_risk',
      duration: Date.now() - step1Start,
      cached: !!(cachedResearch && cachedRisk)
    });

    // ── Step 2: Sequential — Market (needs research) ───────────
    onProgress({ stage: 'market', message: 'Evaluating market opportunities...' });

    const step2Start = Date.now();
    const cachedMarket = await cache.get('agent:market', cacheKey);

    if (cachedMarket) {
      market = cachedMarket;
      log.cacheHits.push('market');
    } else {
      market = await marketAgent(research, context);
      await cache.set('agent:market', cacheKey, market);
    }

    log.stages.push({
      name: 'market',
      duration: Date.now() - step2Start,
      cached: !!cachedMarket
    });

    // ── Step 3: Sequential — Strategy (needs all) ──────────────
    onProgress({ stage: 'strategy', message: 'Building strategy...' });

    const step3Start = Date.now();
    const cachedStrategy = await cache.get('agent:strategy', cacheKey);

    if (cachedStrategy) {
      strategy = cachedStrategy;
      log.cacheHits.push('strategy');
    } else {
      strategy = await strategyAgent(research, risk, market, context);
      await cache.set('agent:strategy', cacheKey, strategy);
    }

    log.stages.push({
      name: 'strategy',
      duration: Date.now() - step3Start,
      cached: !!cachedStrategy
    });

    const totalDuration = Date.now() - log.startTime;
    const currentEWMA = pipelineLatencyTracker.update(totalDuration);

    // ── Combine Results ────────────────────────────────────────
    const result = {
      research,
      risk,
      market,
      strategy,
      sources: context.raw_chunks.map(c => ({
        title: c.title,
        tags: c.tags,
        relevance: c.score
      })),
      meta: {
        totalDuration,
        ewmaLatency: currentEWMA,
        stages: log.stages,
        cacheHits: log.cacheHits,
        cacheStats: cache.getStats()
      }
    };

    // Cache the full pipeline result
    await cache.set('pipeline', cacheKey, result);

    onProgress({ stage: 'complete', message: 'Analysis complete' });

    // Log for observability
    this._logRun(context, result, log);

    return result;
  }

  /**
   * Log pipeline run for observability and debugging.
   */
  _logRun(context, result, log) {
    console.log('\n══════════════════════════════════════════════');
    console.log('  CortexFlow Pipeline Run');
    console.log('══════════════════════════════════════════════');
    console.log(`  Idea: ${context.idea.substring(0, 80)}...`);
    console.log(`  Audience: ${context.audience}`);
    console.log(`  Total Duration: ${Date.now() - log.startTime}ms`);
    console.log(`  Cache Hits: ${log.cacheHits.length > 0 ? log.cacheHits.join(', ') : 'none'}`);
    console.log(`  Stages:`);
    log.stages.forEach(s => {
      console.log(`    - ${s.name}: ${s.duration}ms ${s.cached ? '(cached)' : ''}`);
    });
    console.log('══════════════════════════════════════════════\n');
  }

  /**
   * Get the current EWMA latency for health checks
   */
  getEWMALatency() {
    return pipelineLatencyTracker.get();
  }
}

module.exports = new Orchestrator();
