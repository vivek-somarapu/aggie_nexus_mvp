'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, Key, Terminal, FileText } from 'lucide-react';

interface ApiKeyRow {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

const INSTALL_COMMAND =
  'mkdir -p ~/.aggiex && curl -fsSL ' +
  'https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js ' +
  '-o ~/.aggiex/server.js && chmod +x ~/.aggiex/server.js';

function buildSetupPrompt(apiKey: string): string {
  return `## AggieX MCP Setup

Add the following to your \`.claude/settings.json\`:

\`\`\`json
{
  "mcpServers": {
    "aggiex": {
      "command": "node",
      "args": ["~/.aggiex/server.js"],
      "env": {
        "AGGIEX_API_KEY": "${apiKey}",
        "AGGIEX_BASE_URL": "https://caneckt.aggiex.org"
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

function StepHeader({ number, icon, title }: {
  number: number;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-[10px] font-semibold text-neutral-400">
        {number}
      </span>
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
      </div>
    </div>
  );
}

export default function DeveloperPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<Record<string, boolean>>({});
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

  async function copyToClipboard(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => setCopied((prev) => ({ ...prev, [id]: false })), 2000);
  }

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

  async function revokeKey(id: string) {
    const response = await fetch(`/api/accelerator/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setKeys((prev) => prev.filter((key) => key.id !== id));
      if (newKey) setNewKey(null);
    }
  }

  const setupPrompt = buildSetupPrompt(newKey ?? 'ak_your_key_here');

  return (
    <div className="flex flex-col gap-10">

      {/* Step 1: Install */}
      <section>
        <StepHeader
          number={1}
          icon={<Terminal size={13} className="text-neutral-500" />}
          title="Install the MCP server"
        />
        <p className="mb-3 text-xs text-neutral-500">
          Run this once in your terminal to download the server to your home directory.
        </p>
        <div className="relative rounded-lg border border-neutral-800 bg-neutral-950">
          <pre className="overflow-x-auto px-4 py-3 pr-12 font-mono text-xs text-neutral-300">
            {INSTALL_COMMAND}
          </pre>
          <button
            onClick={() => copyToClipboard(INSTALL_COMMAND, 'install')}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
          >
            {copied['install'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
      </section>

      {/* Step 2: Generate API key */}
      <section>
        <StepHeader
          number={2}
          icon={<Key size={13} className="text-neutral-500" />}
          title="Generate an API key"
        />

        {newKey ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Key size={13} className="text-amber-400" />
              <p className="text-xs font-medium text-amber-300">
                Key generated — it&apos;s embedded in the setup prompt below. Copy it before leaving this page.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-100">
                {newKey}
              </code>
              <button
                onClick={() => copyToClipboard(newKey, 'rawkey')}
                className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
              >
                {copied['rawkey'] ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied['rawkey'] ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-xs text-neutral-500">
              Generate a key first — it will be automatically embedded in the setup prompt below.
            </p>
            <button
              onClick={generateKey}
              disabled={isGenerating}
              className="rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
            >
              {isGenerating ? 'Generating…' : '+ Generate API key'}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
        )}

        {!isLoading && keys.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-neutral-200">{key.label}</p>
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
        )}
      </section>

      {/* Step 3: Setup prompt */}
      <section>
        <StepHeader
          number={3}
          icon={<FileText size={13} className="text-neutral-500" />}
          title="Copy setup prompt"
        />
        <p className="mb-3 text-xs text-neutral-500">
          Paste this into your project&apos;s{' '}
          <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-neutral-400">CLAUDE.md</code>.
          It configures the MCP server and tells your agent when and how to use the AggieX tools
          — with your API key already embedded.
        </p>
        <div className={`relative rounded-lg border bg-neutral-950 transition-colors ${
          newKey ? 'border-emerald-800/50' : 'border-neutral-800'
        }`}>
          {newKey && (
            <div className="flex items-center gap-1.5 border-b border-emerald-800/50 px-4 py-2">
              <Check size={11} className="text-emerald-400" />
              <span className="text-xs text-emerald-500">API key filled in</span>
            </div>
          )}
          {!newKey && (
            <div className="flex items-center gap-1.5 border-b border-neutral-800 px-4 py-2">
              <Key size={11} className="text-neutral-600" />
              <span className="text-xs text-neutral-600">Generate a key above to fill in your API key</span>
            </div>
          )}
          <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-4 pr-12 font-mono text-xs text-neutral-300">
            {setupPrompt}
          </pre>
          <button
            onClick={() => copyToClipboard(setupPrompt, 'prompt')}
            className="absolute right-2 top-10 flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-white"
          >
            {copied['prompt'] ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-600">
          If <code className="font-mono">~/.aggiex/server.js</code> doesn&apos;t resolve, replace{' '}
          <code className="font-mono">~</code> with your full home path (e.g.{' '}
          <code className="font-mono">/Users/yourname</code>).
        </p>
      </section>

    </div>
  );
}
