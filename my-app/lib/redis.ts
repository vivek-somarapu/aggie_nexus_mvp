import { Redis } from '@upstash/redis';

// ─── Redis client singleton ───────────────────────────────────────────────────
//
// Returns null when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not
// configured. All callers must handle the null case — this keeps local dev and
// staging environments fully functional without a Redis instance.

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (client) return client;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  client = new Redis({ url, token });
  return client;
}
