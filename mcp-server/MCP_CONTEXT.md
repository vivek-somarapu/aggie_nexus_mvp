# AggieX MCP — Full Context for AI Assistants

This document gives a complete picture of the AggieX MCP infrastructure: what exists, how it works, where the code lives, and what the known rough edges are. It is written for an AI assistant with no prior knowledge of the codebase.

---

## What Is This?

AggieX is a startup accelerator platform built on Next.js (App Router) + Supabase. It has two separate MCP servers that let coding agents interact with the platform:

| Server | Who uses it | Transport | Location |
|--------|-------------|-----------|----------|
| **Founder MCP** | Startup founders | stdio (local process) | `mcp-server/` |
| **Staff MCP** | AggieX/MCE team | HTTP (remote, Streamable HTTP) | `my-app/app/api/mcp/` |

They share the same API key authentication system but are otherwise independent.

---

## Part 1 — Founder MCP (stdio)

### What it does

Founders install a local Node.js binary on their machine. Their coding agent (Claude Code, Cursor, Windsurf) spawns the binary as a child process and communicates over stdin/stdout using the MCP protocol. The binary then makes authenticated HTTP requests to the AggieX platform API.

### Files

```
mcp-server/
  src/index.ts          # MCP server source (TypeScript)
  dist/index.js         # Compiled single-file bundle (committed, distributed via curl)
  package.json          # Build script uses esbuild
  AGENT_INSTRUCTIONS.md # Maintained instructions fetched by the update_aggiex_mcp tool
```

### Tools exposed

| Tool | What it does |
|------|-------------|
| `get_team_status` | Returns founder name, team name, venture stage, current program week |
| `get_pending_deliverables` | Lists deliverables not yet submitted or needing revision |
| `submit_deliverable` | Submits a text response for a specific deliverable by ID |
| `log_traction` | Records a traction metric (revenue, users, LOIs, pilots, etc.) |
| `get_traction_history` | Returns recent traction entries for the team |
| `update_aggiex_mcp` | Fetches the latest `AGENT_INSTRUCTIONS.md` from GitHub for self-update |

### How founders install it

**Mac/Linux:**
```bash
mkdir -p ~/.aggiex && curl -fsSL https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js -o ~/.aggiex/server.js && chmod +x ~/.aggiex/server.js
```

**Windows (PowerShell):**
```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.aggiex"
Invoke-WebRequest -Uri https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js -OutFile "$env:USERPROFILE\.aggiex\server.js"
```

### Claude Code settings.json config

**Mac/Linux** (`.claude/settings.json` inside the project, or `~/.claude.json` globally):
```json
{
  "mcpServers": {
    "aggiex": {
      "command": "/bin/bash",
      "args": ["-lc", "node ~/.aggiex/server.js"],
      "env": {
        "AGGIEX_API_KEY": "ak_...",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}
```

**Windows** (`%APPDATA%\Claude\claude_desktop_config.json` or project `.claude/settings.json`):
```json
{
  "mcpServers": {
    "aggiex": {
      "command": "cmd.exe",
      "args": ["/c", "node %USERPROFILE%\\.aggiex\\server.js"],
      "env": {
        "AGGIEX_API_KEY": "ak_...",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}
```

**Critical details:**
- `/bin/bash -lc` on Mac ensures login shell so Homebrew Node is on PATH; `~` expands inside bash
- `cmd.exe /c` on Windows expands `%USERPROFILE%` and finds Node
- `AGGIEX_BASE_URL` **must** use `www.accelerator.aggiex.org` — the apex domain `accelerator.aggiex.org` returns a Cloudflare 307 redirect, and Node's `fetch` (and MCP clients) do not follow 307 on POST requests
- The `AGGIEX_API_KEY` is a raw key starting with `ak_` generated from the platform settings page

### How the server makes API calls

```typescript
// mcp-server/src/index.ts
const API_KEY = process.env.AGGIEX_API_KEY;
const BASE_URL = process.env.AGGIEX_BASE_URL ?? 'https://www.accelerator.aggiex.org';

async function apiFetch(path: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
      ...options?.headers,
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}
```

Every tool handler calls `apiFetch()` — no session cookies, only the API key bearer token.

### Build process

```bash
cd mcp-server
npm run build
# runs: esbuild src/index.ts --bundle --platform=node --target=node18 --format=cjs --banner:js='#!/usr/bin/env node' --outfile=dist/index.js
```

- Format is CJS (not ESM) because top-level `await` is not supported in CJS — all async logic is wrapped in `async function main() { ... } main()`
- The shebang (`#!/usr/bin/env node`) comes only from `--banner:js`, **not** from the source file — adding it to `src/index.ts` causes a duplicate shebang SyntaxError on Node.js
- The bundle (~540 KB) is committed to git so founders can `curl` it without needing npm

---

## Part 2 — Staff MCP (HTTP)

### What it does

AggieX team members and MCE staff add the MCP server via one `claude mcp add` command. Claude Code sends HTTP requests directly to the production API — no local binary, no installation. The server implements the [Streamable HTTP MCP transport](https://modelcontextprotocol.io/docs/concepts/transports#streamable-http) as a custom Next.js route.

### Files

```
my-app/app/api/mcp/
  route.ts    # HTTP handler: MCP protocol (initialize, tools/list, tools/call)
  tools.ts    # Tool definitions (STAFF_TOOLS array) + handleToolCall() dispatcher
```

### Connect command

```bash
claude mcp add --transport http aggiex-staff https://www.accelerator.aggiex.org/api/mcp \
  --header "Authorization: Bearer ak_..."
```

Again, `www.` is required — the apex domain redirects.

### Tools exposed

| Tool | What it does |
|------|-------------|
| `get_program_overview` | All weeks with themes/lock status, all active teams, current week |
| `get_all_teams_status` | Submission progress per team for any given week |
| `get_team_detail` | Deep dive on one team: founders, submissions, traction (partial name match) |
| `process_meeting_notes` | AI vision (Groq LLaMA 3.2 90B) on a meeting notes image → structured summary, action items, suggested deliverables |
| `add_deliverable` | Creates a deliverable for a week, optionally scoped to specific teams |
| `update_submission_status` | Approve, flag, or request revision on any submission |
| `unlock_week` | Makes a program week visible to founders |
| `create_curriculum_item` | Adds a resource to a week's curriculum (founders-only or internal) |
| `add_internal_doc` | Creates an internal document visible only to AggieX/MCE staff |

### How the HTTP MCP handler works

The handler (`route.ts`) is a custom JSON-RPC implementation — it does not use the `@modelcontextprotocol/sdk` HTTP transport. This was intentional: the SDK's `StreamableHTTPServerTransport` doesn't integrate cleanly with Next.js serverless functions.

```
POST /api/mcp
  → parse JSON-RPC body
  → authenticate via requireAccelAuth (API key bearer token)
  → route on method:
      "initialize"   → return server capabilities
      "ping"         → return {}
      "tools/list"   → return STAFF_TOOLS array
      "tools/call"   → call handleToolCall(name, args, profile)
      "notifications/*" → return 202 (ignored)
  → return JSON-RPC response
```

GET requests return 405 — there is no SSE stream. All responses are single JSON objects.

All DB operations in `handleToolCall` use `createAdminClient()` (Supabase service role key), which bypasses RLS. This is intentional — staff tools need unrestricted cross-team access.

`process_meeting_notes` makes an external call to Groq (`GROQ_API_KEY` env var required).

---

## Part 3 — Authentication System

Both MCP servers use the same API key mechanism.

### API key table

```sql
CREATE TABLE accel_api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid REFERENCES accel_teams(id) ON DELETE CASCADE,  -- nullable for staff
  profile_id   uuid NOT NULL REFERENCES accel_profiles(id) ON DELETE CASCADE,
  key_hash     text NOT NULL UNIQUE,  -- SHA-256(raw_key), raw key is never stored
  label        text,
  last_used_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

`team_id` is nullable so AggieX team members (who have no `team_id` in their profile) can generate keys.

### Key generation

```typescript
// my-app/app/api/accelerator/api-keys/route.ts
const rawKey = `ak_${randomBytes(32).toString('base64url')}`;
const keyHash = createHash('sha256').update(rawKey).digest('hex');
// Store keyHash in DB, return rawKey to client ONCE
```

The raw key is shown in the UI once (stored in `sessionStorage` so it survives page refresh but is cleared when the tab closes). It is never stored server-side.

### Auth middleware

```typescript
// my-app/lib/accel-auth.ts
export async function requireAccelAuth(
  request: NextRequest,
  allowedRoles: AccelRole[]
): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ak_')
    ? authHeader.slice('Bearer '.length)
    : null;

  if (bearerToken) {
    // Hash the key and look it up via admin client (bypasses RLS)
    const keyHash = createHash('sha256').update(bearerToken).digest('hex');
    const admin = createAdminClient();
    const { data: keyRow } = await admin
      .from('accel_api_keys')
      .select('profile_id, team_id')
      .eq('key_hash', keyHash)
      .single();

    if (!keyRow) return 401;

    // Fetch the profile via admin client
    const { data: profile } = await admin
      .from('accel_profiles')
      .select('*')
      .eq('id', keyRow.profile_id)
      .single();

    // Check role is allowed
    if (!allowedRoles.includes(profile.role)) return 403;
    return { profile, error: null };
  }

  // Fall back to Supabase session cookie
  return requireAccelRole(allowedRoles);
}
```

**Important:** After `requireAccelAuth` succeeds for an API key caller, all subsequent DB queries must use `createAdminClient()`, not `createClient()`. Using `createClient()` after API key auth creates an anonymous Supabase client (no session cookie = `auth.uid()` is null), and RLS will block all data access. The routes that accept API key auth (`/api/accelerator/me`, `/deliverables`, `/submissions`, `/traction`) all use `createAdminClient()` for their queries.

`requireAccelRole` (session-only, no API key path) should only be used in routes that are browser-only (form submissions, page actions, etc.).

### Role system

```typescript
type AccelRole = 'founder' | 'aggiex_team' | 'mce_staff' | 'mentor';
```

- **`founder`** — startup team member; scoped to their own team's data
- **`aggiex_team`** — AggieX staff; full read/write via admin client
- **`mce_staff`** — MCE staff; same as aggiex_team for most routes
- **`mentor`** — read-only access; no MCP server currently

---

## Part 4 — Platform URLs and Settings Pages

### Where founders generate keys
`/accelerator/my-team/developer` — founder settings page  
Component: `my-app/app/accelerator/(platform)/my-team/developer/components/developer-panel.tsx`

### Where AggieX staff generate keys
`/accelerator/settings/developer` — staff settings page  
Component: `my-app/app/accelerator/(platform)/settings/developer/components/staff-connect-panel.tsx`

Both pages:
1. Generate key → POST `/api/accelerator/api-keys`
2. Immediately verify via POST `/api/accelerator/api-keys/verify` (reads back the hash to confirm admin client + DB are working)
3. Show the key status (verified / error) before presenting the copy-able config

### Key management routes
- `GET /api/accelerator/api-keys` — list keys (no raw key, only id + label + last_used_at)
- `POST /api/accelerator/api-keys` — generate new key (returns raw key once)
- `DELETE /api/accelerator/api-keys/[id]` — revoke a key
- `POST /api/accelerator/api-keys/verify` — verify a raw key is in the DB (used immediately after generation as a health check)

---

## Part 5 — Known Issues and Improvement Opportunities

### Current limitations

**No SSE / streaming for staff MCP**  
The staff HTTP MCP server returns single JSON responses. The Streamable HTTP spec allows SSE streaming for long-running tool calls, but this isn't implemented. For tools like `process_meeting_notes` (which calls Groq vision and can take 5–10s), a streaming response would give the agent a progress signal. Currently the Vercel function has `maxDuration = 60` to avoid timeouts.

**No pagination on tool results**  
`get_all_teams_status`, `get_traction_history`, and `get_pending_deliverables` return all rows up to a fixed limit. As the program grows, these could become large. Adding cursor-based pagination or a `limit` parameter would help.

**Founder MCP has no `get_curriculum` tool**  
Founders can submit deliverables and log traction, but they can't query the curriculum (resources, files, links added by staff). Adding a `get_curriculum` tool would let agents surface relevant material when a founder asks "what resources do we have for Week 3?"

**`submit_deliverable` is text-only**  
The platform supports file and link submissions, but the MCP tool only handles `text_content`. Founders with file or link deliverables still need to use the browser.

**No retry/backoff in `apiFetch`**  
If the platform API is momentarily down, the MCP server throws immediately. Adding a simple retry (1–2 attempts with exponential backoff) would make the server more resilient to transient errors.

**`update_aggiex_mcp` fetches from `main` branch**  
If the repo's main branch is ahead of what's deployed, the instructions could reference features or tools that don't exist yet. Pinning to a tagged release or a separate `mcp-stable` branch would be more reliable.

**Windows: `%USERPROFILE%` path with spaces**  
If a Windows user's username contains a space, `node %USERPROFILE%\.aggiex\server.js` passed as a single string to `cmd.exe /c` may fail. Wrapping in quotes (`"node \"%USERPROFILE%\.aggiex\server.js\""`) would fix this.

**Session storage clears on tab close**  
The raw API key is stored in `sessionStorage` so it survives page refresh. But if the founder closes the tab, they lose the key display and have to generate a new one (accumulating orphaned keys). Using `localStorage` with an explicit "forget key" button would be friendlier, at the cost of slightly longer key exposure window.

### Suggested improvements

1. **Add `get_curriculum` tool to the founder MCP** — query `accel_curriculum_files` filtered to the current week and the founder's access level
2. **Add `get_submission_status` tool to the founder MCP** — let agents check whether a specific deliverable was submitted and what the review status is, without having to call `get_pending_deliverables` and parse the list
3. **Add SSE streaming to `process_meeting_notes`** — this is the most time-consuming tool; streaming intermediate tokens from Groq would give the agent a live progress signal
4. **Add a `search_teams` tool to the staff MCP** — `get_team_detail` requires knowing the team name; a fuzzy search tool would help when staff say "find the fintech team working on payments"
5. **Add tool-level rate limiting** — write tools (`add_deliverable`, `update_submission_status`, `unlock_week`) should be rate-limited per API key to prevent accidental bulk mutations from a looping agent
6. **Publish the founder MCP to npm** — currently distributed via `curl` from GitHub. Publishing as `aggiex-mcp` to npm would enable `npx aggiex-mcp` as the run command, removing the download step entirely and making updates automatic

---

## Part 6 — Common Errors and Diagnoses

| Error | Likely cause | Fix |
|-------|-------------|-----|
| `API error 401: {"error":"Unauthorized"}` | API key not in DB, wrong key, or key hash mismatch | Verify the key in the platform UI; regenerate if needed |
| `API error 401` on traction GET specifically | Old code before the `requireAccelRole` → `requireAccelAuth` fix | Redeploy latest code |
| `get_pending_deliverables` returns nothing | `createClient()` used after API key auth (RLS blocks anonymous queries) | Redeploy latest code; all routes now use `createAdminClient()` |
| `current_week: null` from `get_team_status` | Same RLS issue — `accel_weeks` query was session-based | Same fix |
| MCP server not found / ENOENT | `~` not expanded; Node not on PATH for GUI apps | Use `/bin/bash -lc "node ~/.aggiex/server.js"` not `node ~/.aggiex/server.js` directly |
| `SyntaxError: Invalid or unexpected token` on Node startup | Duplicate shebang — source file has `#!/usr/bin/env node` AND esbuild `--banner:js` adds another | Remove shebang from `src/index.ts`; only the build banner produces it |
| `process_meeting_notes` times out | Groq vision call taking >60s or `GROQ_API_KEY` missing | Check `GROQ_API_KEY` env var on Vercel; increase `maxDuration` if needed |
| 307 redirect / empty response on POST | Using `accelerator.aggiex.org` instead of `www.accelerator.aggiex.org` | Always use `www.` in `AGGIEX_BASE_URL` |
| Windows: `%USERPROFILE%` not expanding | Config uses wrong shell or single-quotes | Ensure `cmd.exe /c` is the command, not `node` directly |

---

## Part 7 — Environment Variables Required

| Variable | Where | Purpose |
|----------|-------|---------|
| `SUPABASE_URL` | Vercel + local | Supabase project URL |
| `SUPABASE_ANON_KEY` | Vercel + local | Public anon key (used by `createClient`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel only | Service role key (used by `createAdminClient` — never expose client-side) |
| `GROQ_API_KEY` | Vercel only | Required for `process_meeting_notes` vision tool |
| `AGGIEX_API_KEY` | Founder's machine | Raw API key from the platform settings page |
| `AGGIEX_BASE_URL` | Founder's machine | Must be `https://www.accelerator.aggiex.org` (www. required) |

---

## Part 8 — Supabase Client Patterns

The codebase has two Supabase client factories:

```typescript
// my-app/lib/supabase/server.ts
createClient()           // Session-based; reads auth cookie; subject to RLS
                         // Use for browser-initiated requests where the user is logged in

// my-app/lib/supabase/accel-admin.ts
createAdminClient()      // Uses SUPABASE_SERVICE_ROLE_KEY; bypasses RLS entirely
                         // Use for API key auth paths, server-side admin operations,
                         // and anywhere the calling user doesn't have a session cookie
```

The rule: if a route can be called via API key (no browser session), use `createAdminClient()` for all DB queries in that route. Never mix — auth succeeding via API key and then querying with `createClient()` will silently return empty data due to RLS.
