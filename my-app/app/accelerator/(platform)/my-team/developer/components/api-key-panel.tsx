'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Trash2, Key } from 'lucide-react';

interface ApiKeyRow {
  id: string;
  label: string;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeyPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setIsLoading(true);
    const response = await fetch('/api/accelerator/api-keys');
    if (response.ok) {
      const data = await response.json();
      setKeys(data);
    }
    setIsLoading(false);
  }

  async function generateKey() {
    setIsGenerating(true);
    setError(null);
    const response = await fetch('/api/accelerator/api-keys', { method: 'POST' });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Failed to generate key.');
      setIsGenerating(false);
      return;
    }
    const data = await response.json();
    setNewKey(data.raw_key);
    await loadKeys();
    setIsGenerating(false);
  }

  async function revokeKey(id: string) {
    const response = await fetch(`/api/accelerator/api-keys/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newKey) setNewKey(null);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Newly generated key — shown once */}
      {newKey && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Key size={13} className="text-amber-400" />
            <p className="text-xs font-medium text-amber-300">
              Copy this key now — it won&apos;t be shown again.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-100">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-2 text-xs text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-2 text-xs text-neutral-600 hover:text-neutral-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Existing keys */}
      {isLoading ? (
        <p className="text-xs text-neutral-600">Loading…</p>
      ) : keys.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-800 px-6 py-8 text-center">
          <p className="text-xs text-neutral-600">No API keys yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
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

      {error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
      )}

      <button
        onClick={generateKey}
        disabled={isGenerating}
        className="self-start rounded-md border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white disabled:opacity-50"
      >
        {isGenerating ? 'Generating…' : '+ Generate new key'}
      </button>
    </div>
  );
}
