// CortexFlow — RAG Module
// In-memory vector storage with cosine similarity retrieval using Gemini Embeddings

const fs = require('fs');
const path = require('path');

class RAG {
  constructor() {
    this.documents = [];
    this.vectors = [];
    this.isInitialized = false;
  }

  async _getGeminiEmbedding(text) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBtrDLQzDwJKkw2XdBNy7SJxsyAGdl8Yzo';
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text }] }
        })
      });
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      return data.embedding.values;
    } catch (err) {
      console.error("[RAG] Gemini Embedding error", err);
      return [];
    }
  }

  async _getGeminiBatchEmbeddings(texts) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBtrDLQzDwJKkw2XdBNy7SJxsyAGdl8Yzo';
    try {
      const requests = texts.map(text => ({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      }));
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });
      
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      return data.embeddings.map(e => e.values);
    } catch (err) {
      console.error("[RAG] Gemini Batch Embedding error", err);
      return Array(texts.length).fill([]);
    }
  }

  /**
   * Load dataset and compute embeddings using Gemini text-embedding-004
   */
  async initialize() {
    if (this.isInitialized) return;

    const dataPath = path.join(__dirname, '..', 'data', 'dataset.json');
    const raw = fs.readFileSync(dataPath, 'utf-8');
    this.documents = JSON.parse(raw);

    const texts = this.documents.map(doc => this._documentToText(doc));
    
    // Process in batches of 100 to respect Gemini limits
    this.vectors = [];
    const BATCH_SIZE = 100;
    
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await this._getGeminiBatchEmbeddings(batchTexts);
      
      for (let j = 0; j < batchEmbeddings.length; j++) {
        if (batchEmbeddings[j] && batchEmbeddings[j].length > 0) {
          this.vectors.push({
            id: this.documents[i + j].id,
            vector: batchEmbeddings[j],
            document: this.documents[i + j]
          });
        }
      }
    }

    this.isInitialized = true;
    console.log(`[RAG] Initialized with ${this.vectors.length} documents using Gemini embeddings`);
  }

  /**
   * Retrieve top-k most relevant documents for a given query.
   */
  async retrieve(query, topK = 5) {
    const queryVector = await this._getGeminiEmbedding(query.toLowerCase());
    
    if (!queryVector || queryVector.length === 0) {
      return [];
    }

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
