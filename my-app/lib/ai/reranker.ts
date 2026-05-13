/**
 * Jina AI cross-encoder reranker.
 *
 * After hybrid retrieval returns ~15 candidates, the reranker scores each
 * chunk against the query using a full cross-encoder pass — far more accurate
 * than cosine similarity alone. Returns the top-N indices by relevance.
 *
 * Model: jina-reranker-v2-base-multilingual
 * Free tier: 1M tokens/month (generous for this use case)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const JINA_RERANK_URL = 'https://api.jina.ai/v1/rerank';
const JINA_RERANKER_MODEL = 'jina-reranker-v2-base-multilingual';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JinaRerankResult {
  index: number;
  relevance_score: number;
}

interface JinaRerankResponse {
  results: JinaRerankResult[];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the indices of the top-N chunks from `chunks`, ranked by relevance
 * to `query`. Indices are ordered by descending relevance score.
 *
 * Falls back to the original 0..N-1 order when:
 *   - JINA_API_KEY is absent
 *   - Fewer than two chunks are provided
 *   - The API call throws (caller catches and falls back)
 */
export async function rerankChunks(
  query: string,
  chunks: string[],
  topN: number,
): Promise<number[]> {
  if (chunks.length <= 1) return chunks.map((_, i) => i).slice(0, topN);

  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) return chunks.map((_, i) => i).slice(0, topN);

  const response = await fetch(JINA_RERANK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: JINA_RERANKER_MODEL,
      query,
      documents: chunks.map((text) => ({ text })),
      top_n: topN,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Jina reranker error ${response.status}: ${body}`);
  }

  const json = (await response.json()) as JinaRerankResponse;
  return json.results.map((result) => result.index);
}
