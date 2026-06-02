'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';

interface ApiKeyRow {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

function buildFullPrompt(apiKey: string): string {
  return `## AggieX MCP Setup

### 1. Install

Run in your terminal:

\`\`\`bash
mkdir -p ~/.aggiex && curl -fsSL https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js -o ~/.aggiex/server.js && chmod +x ~/.aggiex/server.js
\`\`\`

### 2. Configure

Add to \`.claude/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "aggiex": {
      "command": "node",
      "args": ["~/.aggiex/server.js"],
      "env": {
        "AGGIEX_API_KEY": "${apiKey}",
        "AGGIEX_BASE_URL": "https://accelerator.aggiex.org"
      }
    }
  }
}
\`\`\`

## AggieX Accelerator Integration

You have access to the AggieX accelerator platform via the \`aggiex\` MCP server.

**Available tools:**
- \`get_team_status\` — Team name, current program week, and submission progress
- \`get_pending_deliverables\` — Deliverables not yet submitted or needing revision
- \`submit_deliverable(deliverable_id, text_content)\` — Submit a written response for a deliverable
- \`log_traction(metric_type, value, unit, notes?)\` — Log metrics: users, revenue, LOIs, pilots, retention
- \`get_traction_history\` — View recent traction log entries

**Use proactively:**
- Session start: check \`get_team_status\` and \`get_pending_deliverables\`
- User mentions growth metrics ("200 users", "closed 3 LOIs", "$5k MRR"): offer to \`log_traction\`
- Work completes on a deliverable: offer to \`submit_deliverable\`
- Always confirm with the user before submitting or logging`;
}

export default function DeveloperPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    const response = await fetch('/api/accelerator/api-keys');
    if (response.ok) {
      const data = await response.json() as ApiKeyRow[];
      setKeys(data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  async function generateKey() {
    setIsGenerating(true);
    setError(null);
    const response = await fetch('/api/accelerator/api-keys', { method: 'POST' });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error ?? 'Failed to generate key.');
      setIsGenerating(false);
      return;
    }
    const data = await response.json() as { raw_key: string };
    setNewKey(data.raw_key);
    await loadKeys();
    setIsGenerating(false);
  }

  async function copyPrompt() {
    if (!newKey) return;
    await navigator.clipboard.writeText(buildFullPrompt(newKey));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  async function revokeKey(id: string) {
    const response = await fetch(`/api/accelerator/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setKeys((prev) => prev.filter((key) => key.id !== id));
      if (newKey) setNewKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {!newKey ? (
        <div>
          <p className="mb-4 text-sm text-neutral-400">
            Generate an API key to get your one-click setup prompt for Claude Code, Cursor, or any
            MCP-compatible coding agent.
          </p>
          <button
            onClick={generateKey}
            disabled={isGenerating}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
          >
            {isGenerating ? 'Generating…' : 'Generate API key'}
          </button>
          {error && (
            <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
          )}
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm text-neutral-400">
            Your setup prompt is ready. Paste it into your project&apos;s{' '}
            <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-neutral-300">CLAUDE.md</code>
            {' '}— it includes the install command, MCP config, and agent context with your API key embedded.
          </p>
          <button
            onClick={copyPrompt}
            className="flex items-center gap-2 rounded-md border border-neutral-600 bg-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-400 hover:bg-neutral-700"
          >
            {promptCopied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy prompt
              </>
            )}
          </button>
          <p className="mt-3 text-xs text-neutral-600">
            Need to generate another?{' '}
            <button
              onClick={() => setNewKey(null)}
              className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
            >
              Go back
            </button>
          </p>
        </div>
      )}

      {!isLoading && keys.length > 0 && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest text-neutral-600">Active keys</p>
          <div className="flex flex-col gap-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-neutral-300">{key.label}</p>
                  <p className="mt-0.5 text-xs text-neutral-600">
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at && (
                      <> · Last used {new Date(key.last_used_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => revokeKey(key.id)}
                  title="Revoke key"
                  className="ml-4 flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
