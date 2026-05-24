// CortexFlow — Real-Time Web Search Module
// Uses googlethis to fetch live search results for idea validation

const google = require('googlethis');

/**
 * Perform real-time web searches related to a user's idea.
 * Returns structured search results with titles and snippets.
 *
 * @param {string} idea - The user's product idea
 * @param {string} audience - Target audience (optional)
 * @returns {object} { results: Array, searchQueries: Array }
 */
async function searchWeb(idea, audience = '') {
  const queries = buildQueries(idea, audience);
  const allResults = [];

  for (const query of queries) {
    try {
      console.log(`[Search] Querying: "${query}"`);
      const response = await google.search(query, {
        page: 0,
        safe: false,
        additional_params: { hl: 'en' }
      });

      if (response && response.results) {
        const mapped = response.results.slice(0, 5).map(r => ({
          title: r.title || '',
          snippet: r.description || '',
          url: r.url || '',
          source: 'google',
          query
        }));
        allResults.push(...mapped);
      }
    } catch (err) {
      console.warn(`[Search] Query failed for "${query}": ${err.message}`);
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allResults.filter(r => {
    if (!r.url || seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`[Search] Found ${unique.length} unique results across ${queries.length} queries`);

  return {
    results: unique.slice(0, 10),
    searchQueries: queries,
    timestamp: new Date().toISOString()
  };
}

/**
 * Build targeted search queries from the user's idea.
 */
function buildQueries(idea, audience) {
  // Extract a short keyword phrase from the idea (first 60 chars max)
  const shortIdea = idea.length > 60 ? idea.substring(0, 60).trim() : idea.trim();

  const queries = [
    `${shortIdea} alternatives competitors 2025`,
    `${shortIdea} market trends`
  ];

  if (audience && audience.trim()) {
    queries.push(`${shortIdea} for ${audience.trim()}`);
  }

  return queries;
}

module.exports = { searchWeb };
