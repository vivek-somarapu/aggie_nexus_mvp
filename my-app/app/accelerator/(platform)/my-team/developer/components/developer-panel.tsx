'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ApiKeyRow {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

type KeyStatus = 'idle' | 'verifying' | 'ok' | 'error';

const SESSION_STORAGE_KEY = 'aggiex_dev_raw_key';
const MCP_URL = 'https://www.accelerator.aggiex.org/api/mcp/founder';

function buildCliCommand(apiKey: string): string {
  return `claude mcp add --transport http aggiex ${MCP_URL} --header "Authorization: Bearer ${apiKey}"`;
}

function buildSettingsJson(apiKey: string): string {
  return `{
  "mcpServers": {
    "aggiex": {
      "type": "http",
      "url": "${MCP_URL}",
      "headers": {
        "Authorization": "Bearer ${apiKey}"
      }
    }
  }
}`;
}

const AGENT_CONTEXT = `## AggieX Accelerator Integration

You have access to the AggieX accelerator platform via the \`aggiex\` MCP server.

**Available tools:**
- \`whoami\` — Your identity, team, current week, and available tools (call this first)
- \`get_team_status\` — Team name, current program week, and submission progress
- \`get_pending_deliverables\` — Deliverables not yet submitted or needing revision
- \`get_submission_status\` — Review status of all submissions, including staff feedback
- \`get_curriculum\` — Resources and materials for the current or any program week
- \`submit_deliverable(deliverable_id, text_content)\` — Submit a written response
- \`log_traction(metric_type, value, unit, notes?)\` — Log metrics: users, revenue, LOIs, pilots
- \`get_traction_history\` — Recent traction log entries

**Use proactively:**
- Session start: call \`whoami\`, then \`get_pending_deliverables\`
- User mentions growth metrics ("200 users", "closed 3 LOIs", "$5k MRR"): offer to \`log_traction\`
- Work completes on a deliverable: offer to \`submit_deliverable\`
- User asks about resources or curriculum: call \`get_curriculum\`
- Always confirm with the user before submitting or logging`;

export default function DeveloperPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      setActiveKey(stored);
      setKeyStatus('ok');
    }
  }, []);

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

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000);
  }

  async function verifyKey(rawKey: string) {
    setKeyStatus('verifying');
    setKeyStatusMessage('');
    const response = await fetch('/api/accelerator/api-keys/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_key: rawKey }),
    });
    const data = await response.json() as { valid: boolean; reason?: string };
    if (data.valid) {
      setKeyStatus('ok');
    } else {
      setKeyStatus('error');
      setKeyStatusMessage(data.reason ?? 'Verification failed — contact support.');
    }
  }

  async function generateKey() {
    setIsGenerating(true);
    setGenerateError(null);
    const response = await fetch('/api/accelerator/api-keys', { method: 'POST' });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setGenerateError(data.error ?? 'Failed to generate key.');
      setIsGenerating(false);
      return;
    }
    const data = await response.json() as { raw_key: string };
    sessionStorage.setItem(SESSION_STORAGE_KEY, data.raw_key);
    setActiveKey(data.raw_key);
    await loadKeys();
    setIsGenerating(false);
    verifyKey(data.raw_key);
  }

  async function revokeKey(id: string) {
    const response = await fetch(`/api/accelerator/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setKeys((prev) => prev.filter((key) => key.id !== id));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setActiveKey(null);
      setKeyStatus('idle');
    }
  }

  return (
    <div className="flex flex-col gap-8">

      {!activeKey ? (
        <div>
          <p className="mb-4 text-sm text-neutral-400">
            Generate an API key to connect Claude Code, Cursor, or any MCP-compatible coding agent
            to AggieX — no installation required.
          </p>
          <button
            onClick={generateKey}
            disabled={isGenerating}
            className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
          >
            {isGenerating ? 'Generating…' : 'Generate API key'}
          </button>
          {generateError && (
            <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {generateError}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {keyStatus === 'verifying' && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 size={12} className="animate-spin" />
              Verifying key…
            </div>
          )}
          {keyStatus === 'ok' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <Check size={12} />
              Key verified — ready to connect
            </div>
          )}
          {keyStatus === 'error' && (
            <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                <AlertTriangle size={12} />
                Key verification failed
              </div>
              <p className="mt-1 text-xs text-red-400/80">{keyStatusMessage}</p>
            </div>
          )}

          {/* Claude Code CLI */}
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-300">Claude Code — run in terminal</p>
            <div className="relative rounded-lg border border-neutral-800 bg-neutral-950">
              <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs text-neutral-300">
                {buildCliCommand(activeKey)}
              </pre>
              <button
                onClick={() => copyToClipboard(buildCliCommand(activeKey), 'cli')}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
              >
                {copied['cli'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* Cursor / other editors */}
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-300">
              Cursor / other editors — add to{' '}
              <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-neutral-400">.cursor/mcp.json</code>{' '}
              or equivalent
            </p>
            <div className="relative rounded-lg border border-neutral-800 bg-neutral-950">
              <pre className="overflow-x-auto px-4 py-4 pr-12 font-mono text-xs text-neutral-300">
                {buildSettingsJson(activeKey)}
              </pre>
              <button
                onClick={() => copyToClipboard(buildSettingsJson(activeKey), 'json')}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
              >
                {copied['json'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* CLAUDE.md context */}
          <div>
            <p className="mb-2 text-xs font-medium text-neutral-300">
              CLAUDE.md context — paste into your project to guide the agent
            </p>
            <div className="relative rounded-lg border border-neutral-800 bg-neutral-950">
              <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 pr-12 font-mono text-xs text-neutral-300">
                {AGENT_CONTEXT}
              </pre>
              <button
                onClick={() => copyToClipboard(AGENT_CONTEXT, 'context')}
                className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
              >
                {copied['context'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-600">
            <button
              onClick={() => {
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
                setActiveKey(null);
                setKeyStatus('idle');
              }}
              className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
            >
              Generate a new key
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
