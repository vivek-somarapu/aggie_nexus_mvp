/**
 * Thin wrapper around the Jina AI v1 embeddings REST API.
 *
 * Uses plain fetch — no additional npm package required.
 * Model: jina-embeddings-v3 (1024-dimensional vectors, cosine similarity).
 *
 * Degrades gracefully: functions throw when JINA_API_KEY is absent so
 * callers can guard with a key-presence check before calling.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const JINA_EMBEDDINGS_URL = 'https://api.jina.ai/v1/embeddings';
const JINA_MODEL = 'jina-embeddings-v3';
const EMBEDDING_DIMENSIONS = 1024;

// Stay well under Jina's per-request limit; keeps individual payloads small.
const MAX_BATCH_SIZE = 100;

// ─── Types ────────────────────────────────────────────────────────────────────

interface JinaEmbeddingObject {
  index: number;
  embedding: number[];
}

interface JinaEmbeddingsResponse {
  data: JinaEmbeddingObject[];
}

export interface EmbeddingResult {
  text: string;
  vector: number[];
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function requireApiKey(): string {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) throw new Error('JINA_API_KEY environment variable is not set');
  return apiKey;
}

async function fetchBatch(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch(JINA_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
      truncate: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jina API error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as JinaEmbeddingsResponse;

  // Sort by index to guard against out-of-order responses.
  const sorted = [...json.data].sort((a, b) => a.index - b.index);
  return sorted.map((item) => item.embedding);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Embeds a single text string. Throws if JINA_API_KEY is absent or the API
 * call fails.
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = requireApiKey();
  const vectors = await fetchBatch([text], apiKey);
  return vectors[0];
}

/**
 * Embeds an array of texts in batches, respecting the per-request size limit.
 * Results are returned in the same order as the input array.
 */
export async function embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
  if (texts.length === 0) return [];

  const apiKey = requireApiKey();
  const results: EmbeddingResult[] = [];

  for (let offset = 0; offset < texts.length; offset += MAX_BATCH_SIZE) {
    const batch = texts.slice(offset, offset + MAX_BATCH_SIZE);
    const vectors = await fetchBatch(batch, apiKey);
    for (let i = 0; i < batch.length; i++) {
      results.push({ text: batch[i], vector: vectors[i] });
    }
  }

  return results;
}
