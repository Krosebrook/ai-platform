// Simple vector store using cosine similarity
// Start with basic TF-IDF-like vectors, upgrade to proper embeddings later

interface VectorEntry {
  id: string;
  text: string;
  vector: number[];
  metadata: Record<string, unknown>;
}

class VectorStoreImpl {
  private entries: VectorEntry[] = [];
  private vocabulary = new Map<string, number>();
  private storageKey = 'ai-platform-vectors';

  async init() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        this.entries = data.entries || [];
        this.vocabulary = new Map(data.vocabulary || []);
      }
    } catch { /* fresh start */ }
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify({
        entries: this.entries.slice(-1000), // Keep last 1000
        vocabulary: Array.from(this.vocabulary.entries()),
      }));
    } catch { /* storage limit */ }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  private vectorize(text: string): number[] {
    const tokens = this.tokenize(text);
    const freq = new Map<string, number>();
    tokens.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));

    // Build vocab if needed
    freq.forEach((_, token) => {
      if (!this.vocabulary.has(token)) {
        this.vocabulary.set(token, this.vocabulary.size);
      }
    });

    // Create sparse vector as dense (limited to 500 dims)
    const maxDims = 500;
    const vector = new Array(Math.min(this.vocabulary.size, maxDims)).fill(0);
    freq.forEach((count, token) => {
      const idx = this.vocabulary.get(token)!;
      if (idx < maxDims) vector[idx] = count / tokens.length;
    });

    return vector;
  }

  private cosine(a: number[], b: number[]): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  add(id: string, text: string, metadata: Record<string, unknown> = {}) {
    const vector = this.vectorize(text);
    this.entries.push({ id, text, vector, metadata });
    this.persist();
  }

  search(query: string, limit = 5): Array<{ id: string; text: string; score: number; metadata: Record<string, unknown> }> {
    const queryVec = this.vectorize(query);
    return this.entries
      .map(entry => ({
        id: entry.id,
        text: entry.text,
        score: this.cosine(queryVec, entry.vector),
        metadata: entry.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .filter(r => r.score > 0.05);
  }

  remove(id: string) {
    this.entries = this.entries.filter(e => e.id !== id);
    this.persist();
  }

  clear() {
    this.entries = [];
    this.vocabulary.clear();
    this.persist();
  }
}

export const VectorStore = new VectorStoreImpl();
