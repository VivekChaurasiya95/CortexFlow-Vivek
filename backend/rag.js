// CortexFlow — RAG Module
// In-memory vector storage with cosine similarity retrieval

const fs = require('fs');
const path = require('path');

class RAG {
  constructor() {
    this.documents = [];
    this.vectors = [];
    this.isInitialized = false;
  }

  /**
   * Load dataset and compute simple TF-IDF-like vectors for each entry.
   * For MVP, we use term frequency vectors instead of external embedding APIs
   * to keep things fast and dependency-free.
   */
  async initialize() {
    if (this.isInitialized) return;

    const dataPath = path.join(__dirname, '..', 'data', 'dataset.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    this.documents = JSON.parse(raw);

    // Build vocabulary from all documents
    this.vocabulary = this._buildVocabulary(this.documents);

    // Compute vectors for each document
    this.vectors = this.documents.map(doc => ({
      id: doc.id,
      vector: this._textToVector(this._documentToText(doc)),
      document: doc
    }));

    this.isInitialized = true;
    console.log(`[RAG] Initialized with ${this.documents.length} documents, vocabulary size: ${this.vocabulary.length}`);
  }

  /**
   * Retrieve top-k most relevant documents for a given query.
   */
  retrieve(query, topK = 5) {
    const queryVector = this._textToVector(query.toLowerCase());

    const scored = this.vectors.map(item => ({
      score: this._cosineSimilarity(queryVector, item.vector),
      document: item.document
    }));

    // Sort by score descending and return top-k
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).filter(s => s.score > 0.01);
  }

  /**
   * Convert a document object into a searchable text string.
   */
  _documentToText(doc) {
    return [
      doc.title,
      doc.description,
      (doc.tags || []).join(' '),
      (doc.problems || []).join(' '),
      doc.category,
      doc.source_type,
      doc.notes || ''
    ].join(' ').toLowerCase();
  }

  /**
   * Build vocabulary from all documents.
   */
  _buildVocabulary(documents) {
    const wordSet = new Set();
    documents.forEach(doc => {
      const text = this._documentToText(doc);
      this._tokenize(text).forEach(word => wordSet.add(word));
    });
    return Array.from(wordSet);
  }

  /**
   * Tokenize text into words, removing stopwords.
   */
  _tokenize(text) {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'shall', 'not', 'no', 'nor',
      'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
      'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
      'our', 'their', 'what', 'which', 'who', 'whom', 'than', 'more', 'most',
      'as', 'if', 'then', 'so', 'also', 'just', 'about', 'up', 'out', 'into'
    ]);

    return text
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));
  }

  /**
   * Convert text to a term-frequency vector.
   */
  _textToVector(text) {
    const tokens = this._tokenize(text);
    const freq = {};
    tokens.forEach(t => { freq[t] = (freq[t] || 0) + 1; });

    return this.vocabulary.map(word => freq[word] || 0);
  }

  /**
   * Cosine similarity between two vectors.
   */
  _cosineSimilarity(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }
}

module.exports = new RAG();
