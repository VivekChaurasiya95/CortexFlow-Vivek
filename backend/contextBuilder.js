// CortexFlow — Context Builder
// Normalizes retrieved RAG chunks + user input into a structured context object

class ContextBuilder {
  /**
   * Build structured context from user input, follow-up answers, and retrieved chunks.
   * 
   * @param {string} idea - The user's raw idea
   * @param {object} answers - Follow-up question answers { audience, problem, productType, timeline }
   * @param {Array} retrievedChunks - RAG results with { score, document }
   * @returns {object} Structured context for agents
   */
  build(idea, answers = {}, retrievedChunks = [], liveWebResults = []) {
    // Categorize retrieved chunks
    const similarProducts = [];
    const painPoints = [];
    const trends = [];
    const risks = [];
    const opportunities = [];

    for (const chunk of retrievedChunks) {
      const doc = chunk.document;
      const entry = {
        title: doc.title,
        description: doc.description,
        relevance: Math.round(chunk.score * 100) / 100
      };

      switch (doc.category) {
        case 'product_idea':
          similarProducts.push(entry);
          break;
        case 'user_complaint':
        case 'ux_frustration':
          painPoints.push(entry);
          break;
        case 'market_trend':
          trends.push(entry);
          break;
        case 'startup_failure':
          risks.push(entry);
          break;
        case 'opportunity_signal':
          opportunities.push(entry);
          break;
        default:
          // If no category match, add to most relevant bucket
          if (doc.problems && doc.problems.length > 0) {
            painPoints.push(entry);
          } else {
            opportunities.push(entry);
          }
      }
    }

    return {
      idea,
      audience: answers.audience || 'Not specified',
      problem: answers.problem || 'Not specified',
      product_type: answers.productType || 'Not specified',
      timeline: answers.timeline || 'Not specified',
      similar_products: similarProducts,
      pain_points: painPoints,
      trends,
      risks,
      opportunities,
      raw_chunks: retrievedChunks.map(c => ({
        title: c.document.title,
        tags: c.document.tags,
        problems: c.document.problems,
        notes: c.document.notes,
        score: Math.round(c.score * 100) / 100
      })),
      live_web_data: liveWebResults.map(r => ({
        title: r.title,
        snippet: r.snippet,
        url: r.url
      }))
    };
  }

  /**
   * Generate contextual follow-up questions based on the idea.
   * Returns 2-4 questions to personalize the analysis.
   */
  generateQuestions(idea) {
    // These questions are always relevant and help specialize the analysis
    return [
      {
        id: 'audience',
        question: 'Who is this for?',
        placeholder: 'e.g., small business owners, developers, students...',
        required: false
      },
      {
        id: 'problem',
        question: 'What specific problem are you solving?',
        placeholder: 'e.g., managing invoices is too slow and manual...',
        required: false
      },
      {
        id: 'productType',
        question: 'What type of product are you envisioning?',
        placeholder: 'e.g., consumer app, SaaS, internal tool, marketplace...',
        required: false
      },
      {
        id: 'timeline',
        question: 'What timeline are you targeting?',
        placeholder: 'e.g., 3 months MVP, 6 months launch, exploring...',
        required: false
      }
    ];
  }
}

module.exports = new ContextBuilder();
