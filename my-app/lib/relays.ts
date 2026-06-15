import type { AccelRole } from '@/lib/accel-types';

const BASE = process.env.RELAYS_BASE_URL!;
const KEY = process.env.RELAYS_API_KEY!;

export type RelaysOutcome =
  | 'meeting_happened'
  | 'ongoing_relationship'
  | 'led_to_funding'
  | 'led_to_event'
  | 'no_response'
  | 'declined_after_intro'
  | 'other';

export interface RelaysResult {
  result_id: string;
  score: number;
  visibility: 'visible' | 'anonymized';
  requires_approval: boolean;
  connection_degree: number;
  full_name?: string;
  role_title?: string;
  company?: string;
  anon_description?: string;
  expertise_signals?: string[];
}

export interface RelaysSearchResponse {
  results: RelaysResult[];
  confidence: number;
}

// Maps AccelRole → Relays role_key
const ROLE_KEY_MAP: Record<AccelRole, string> = {
  founder: 'founder',
  aggiex_team: 'aggiex_team',
  mce_staff: 'mce_team',
  mentor: 'mentor',
};

export function toRelaysRoleKey(role: AccelRole): string {
  return ROLE_KEY_MAP[role] ?? role;
}

async function call<T = unknown>(
  path: string,
  token: string,
  body?: unknown,
  method = 'POST',
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Relays ${path} ${res.status}: ${text}`);
  }
  return res.status === 204 ? (null as T) : (res.json() as Promise<T>);
}

export async function provisionMember(user: {
  external_user_id: string;
  role: AccelRole;
  full_name: string;
  email: string;
  title?: string | null;
  company?: string | null;
  bio?: string | null;
}): Promise<void> {
  await call('/v1/identities', KEY, {
    external_user_id: user.external_user_id,
    role_key: toRelaysRoleKey(user.role),
    full_name: user.full_name,
    email: user.email,
    ...(user.title && { title: user.title }),
    ...(user.company && { company: user.company }),
    ...(user.bio && { bio: user.bio }),
  });
}

async function getUserToken(externalUserId: string): Promise<string> {
  const response = await call<{ access_token: string }>('/v1/tokens', KEY, {
    external_user_id: externalUserId,
  });
  return response.access_token;
}

export async function searchNetwork(
  externalUserId: string,
  queryText: string,
  purpose?: string,
): Promise<RelaysSearchResponse> {
  const token = await getUserToken(externalUserId);
  return call<RelaysSearchResponse>('/v1/match/query', token, {
    query_text: queryText,
    ...(purpose && { purpose }),
  });
}

export async function logOutcome(
  externalUserId: string,
  resultId: string,
  outcome: RelaysOutcome,
): Promise<void> {
  const token = await getUserToken(externalUserId);
  await call('/v1/match/outcome', token, { result_id: resultId, outcome });
}
