/**
 * Splits long text into overlapping character-window chunks for per-chunk
 * embedding. Targeting ~400 tokens per chunk (1 token ≈ 4 chars).
 *
 * Overlap preserves context across chunk boundaries so queries that span two
 * chunks still find a relevant match.
 */

const CHUNK_SIZE = 1600;   // ~400 tokens
const CHUNK_OVERLAP = 200; // ~50 tokens of shared context

/**
 * Returns `text` split into overlapping chunks of at most CHUNK_SIZE characters.
 * Short texts that fit in a single chunk are returned as a one-element array.
 * Empty or whitespace-only input returns an empty array.
 */
export function chunkText(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) return [];
  if (trimmed.length <= CHUNK_SIZE) return [trimmed];

  const chunks: string[] = [];
  let offset = 0;

  while (offset < trimmed.length) {
    const end = Math.min(offset + CHUNK_SIZE, trimmed.length);
    const chunk = trimmed.slice(offset, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    if (end >= trimmed.length) break;
    offset += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}
