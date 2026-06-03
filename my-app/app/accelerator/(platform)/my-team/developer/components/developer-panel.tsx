'use client';

import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ApiKeyRow {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

type Platform = 'mac' | 'windows';
type KeyStatus = 'idle' | 'verifying' | 'ok' | 'error';

const SESSION_STORAGE_KEY = 'aggiex_dev_raw_key';

const INSTALL_COMMANDS: Record<Platform, string> = {
  mac: 'mkdir -p ~/.aggiex && curl -fsSL https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js -o ~/.aggiex/server.js && chmod +x ~/.aggiex/server.js',
  windows:
    'New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\\.aggiex"; Invoke-WebRequest -Uri "https://raw.githubusercontent.com/vivek-somarapu/aggie_nexus_mvp/main/mcp-server/dist/index.js" -OutFile "$env:USERPROFILE\\.aggiex\\server.js"',
};

function buildMcpConfig(apiKey: string, platform: Platform): string {
  if (platform === 'windows') {
    return `{
  "mcpServers": {
    "aggiex": {
      "command": "cmd.exe",
      "args": ["/c", "node %USERPROFILE%\\\\.aggiex\\\\server.js"],
      "env": {
        "AGGIEX_API_KEY": "${apiKey}",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}`;
  }
  return `{
  "mcpServers": {
    "aggiex": {
      "command": "/bin/bash",
      "args": ["-lc", "node ~/.aggiex/server.js"],
      "env": {
        "AGGIEX_API_KEY": "${apiKey}",
        "AGGIEX_BASE_URL": "https://www.accelerator.aggiex.org"
      }
    }
  }
}`;
}

const AGENT_CONTEXT = `## AggieX Accelerator Integration

You have access to the AggieX accelerator platform via the \`aggiex\` MCP server.

**Available tools:**
- \`update_aggiex_mcp\` — Fetch the latest setup instructions and version notes
- \`get_team_status\` — Team name, current program week, and submission progress
- \`get_pending_deliverables\` — Deliverables not yet submitted or needing revision
- \`submit_deliverable(deliverable_id, text_content)\` — Submit a written response
- \`log_traction(metric_type, value, unit, notes?)\` — Log metrics: users, revenue, LOIs, pilots, retention
- \`get_traction_history\` — View recent traction log entries

**Use proactively:**
- Session start: check \`get_team_status\` and \`get_pending_deliverables\`
- User mentions growth metrics ("200 users", "closed 3 LOIs", "$5k MRR"): offer to \`log_traction\`
- Work completes on a deliverable: offer to \`submit_deliverable\`
- Connection errors or config issues: call \`update_aggiex_mcp\` for troubleshooting
- Always confirm with the user before submitting or logging`;

function buildFullPrompt(apiKey: string, platform: Platform): string {
  const installLabel = platform === 'windows' ? 'PowerShell' : 'Terminal';
  return `## AggieX MCP Setup

### 1. Install (run once in ${installLabel})

\`\`\`${platform === 'windows' ? 'powershell' : 'bash'}
${INSTALL_COMMANDS[platform]}
\`\`\`

### 2. Configure — add to \`.claude/settings.json\`

\`\`\`json
${buildMcpConfig(apiKey, platform)}
\`\`\`

${AGENT_CONTEXT}`;
}

function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'mac';
  return /Win/i.test(navigator.userAgent) ? 'windows' : 'mac';
}

export default function DeveloperPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string>('');
  const [platform, setPlatform] = useState<Platform>('mac');
  const [promptCopied, setPromptCopied] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    // Restore key from session storage so page refreshes don't break the flow
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

  async function verifyKey(rawKey: string) {
    setKeyStatus('verifying');
    setKeyStatusMessage('');
    const response = await fetch('/api/accelerator/api-keys/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_key: rawKey }),
    });
    const data = await response.json() as { valid: boolean; reason?: string; label?: string };
    if (data.valid) {
      setKeyStatus('ok');
      setKeyStatusMessage('');
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

  async function copyPrompt() {
    if (!activeKey) return;
    await navigator.clipboard.writeText(buildFullPrompt(activeKey, platform));
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 2000);
  }

  async function revokeKey(id: string) {
    const response = await fetch(`/api/accelerator/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setKeys((prev) => prev.filter((key) => key.id !== id));
      // If the active key was the revoked one, clear it
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setActiveKey(null);
      setKeyStatus('idle');
    }
  }

  function resetToGenerate() {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setActiveKey(null);
    setKeyStatus('idle');
    setKeyStatusMessage('');
  }

  return (
    <div className="flex flex-col gap-8">

      {!activeKey ? (
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
          {generateError && (
            <p className="mt-3 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {generateError}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Verification status */}
          {keyStatus === 'verifying' && (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Loader2 size={12} className="animate-spin" />
              Verifying key…
            </div>
          )}
          {keyStatus === 'ok' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500">
              <Check size={12} />
              Key verified — ready to use
            </div>
          )}
          {keyStatus === 'error' && (
            <div className="rounded-md border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
                <AlertTriangle size={12} />
                Key verification failed
              </div>
              <p className="mt-1 text-xs text-red-400/80">{keyStatusMessage}</p>
              <p className="mt-1 text-xs text-neutral-600">
                This usually means the database migration hasn&apos;t been applied or the
                server environment is misconfigured. Contact the AggieX team.
              </p>
            </div>
          )}

          <p className="text-sm text-neutral-400">
            Your setup prompt is ready. Paste it into your project&apos;s{' '}
            <code className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-neutral-300">
              CLAUDE.md
            </code>{' '}
            — it includes the install command, MCP config, and agent context with your API key
            embedded.
          </p>

          {/* Platform toggle */}
          <div className="flex items-center gap-1 self-start rounded-lg border border-neutral-800 bg-neutral-950 p-1">
            <button
              onClick={() => setPlatform('mac')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                platform === 'mac'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Mac / Linux
            </button>
            <button
              onClick={() => setPlatform('windows')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                platform === 'windows'
                  ? 'bg-neutral-700 text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Windows
            </button>
          </div>

          <button
            onClick={copyPrompt}
            disabled={keyStatus === 'error'}
            className="flex w-fit items-center gap-2 rounded-md border border-neutral-600 bg-neutral-800 px-5 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-400 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
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

          <p className="text-xs text-neutral-600">
            Need a new key?{' '}
            <button
              onClick={resetToGenerate}
              className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
            >
              Generate another
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
