'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContextDoc {
  id: string;
  title: string;
  doc_type: string;
  team_id: string | null;
  created_at: string;
  accel_teams: { name: string } | null;
}

interface Team {
  id: string;
  name: string;
}

type FormState = 'idle' | 'submitting' | 'error';

const DOC_TYPE_LABELS: Record<string, string> = {
  program_outline: 'Program outline',
  team_application: 'Team application',
  reference: 'Reference material',
  general: 'General',
};

const ACCEPTED_EXTENSIONS = ['.txt', '.md', '.csv'];
const MAX_CONTENT_BYTES = 100_000;

// ─── Component ────────────────────────────────────────────────────────────────

interface ContextDocsPanelProps {
  teams: Team[];
}

export default function ContextDocsPanel({ teams }: ContextDocsPanelProps) {
  const [docs, setDocs] = useState<ContextDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<string>('general');
  const [teamId, setTeamId] = useState<string>('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>('idle');
  const [formError, setFormError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load docs on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await fetch('/api/accelerator/context-docs');
      if (!response.ok) throw new Error(`Failed to load (${response.status})`);
      const { docs: fetched } = await response.json() as { docs: ContextDoc[] };
      setDocs(fetched);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  // ── File picker ─────────────────────────────────────────────────────────────

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFormError(`Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`);
      return;
    }

    if (file.size > MAX_CONTENT_BYTES) {
      setFormError('File is too large. Maximum size is 100 KB.');
      return;
    }

    setFormError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsText(file);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setFormError('Title and content are required.');
      return;
    }

    if (new TextEncoder().encode(content).length > MAX_CONTENT_BYTES) {
      setFormError('Content is too large. Maximum size is 100 KB.');
      return;
    }

    setFormState('submitting');
    setFormError(null);

    try {
      const response = await fetch('/api/accelerator/context-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          doc_type: docType,
          team_id: teamId || null,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Error ${response.status}`);
      }

      const { doc } = await response.json() as { doc: ContextDoc };
      setDocs((prev) => [{ ...doc, accel_teams: null }, ...prev]);
      resetForm();
    } catch (err) {
      setFormState('error');
      setFormError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  function resetForm() {
    setShowForm(false);
    setTitle('');
    setDocType('general');
    setTeamId('');
    setContent('');
    setFileName(null);
    setFormState('idle');
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  async function handleDelete(docId: string) {
    setDeletingId(docId);
    try {
      const response = await fetch(`/api/accelerator/context-docs/${docId}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Delete failed (${response.status})`);
      }
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error('[context-docs] Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900/40">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10">
            <FileText size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-100">Context Documents</p>
            <p className="mt-0.5 text-xs text-neutral-500">
              Program outlines, team applications, and reference material for the AI Advisor.
              After uploading, run &quot;Sync AI Knowledge Base&quot; to index the content.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 transition-colors hover:border-neutral-600 hover:text-neutral-100"
        >
          <Plus size={12} />
          Add document
        </button>
      </div>

      {/* ── Upload form ── */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border-b border-neutral-800 px-5 py-4 space-y-3">
          {/* Title + type row */}
          <div className="flex gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
              maxLength={200}
              className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
            <div className="relative">
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="appearance-none rounded-md border border-neutral-700 bg-neutral-900 pl-3 pr-8 py-2 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
              >
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>
          </div>

          {/* Team (optional) */}
          {teams.length > 0 && (
            <div className="relative">
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full appearance-none rounded-md border border-neutral-700 bg-neutral-900 pl-3 pr-8 py-2 text-xs text-neutral-300 focus:border-neutral-600 focus:outline-none"
              >
                <option value="">All teams (program-wide)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <ChevronDown size={10} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            </div>
          )}

          {/* File picker or text area */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-200"
              >
                {fileName ? `📄 ${fileName}` : 'Upload file (.txt, .md, .csv)'}
              </button>
              <span className="text-xs text-neutral-600">or paste below</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste document content here…"
              rows={6}
              className="w-full resize-none rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-neutral-300 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
            />
            <p className="text-right text-[10px] text-neutral-600">
              {new TextEncoder().encode(content).length.toLocaleString()} / 100,000 bytes
            </p>
          </div>

          {/* Error */}
          {formError && (
            <div className="flex items-center gap-2 text-xs text-red-400">
              <AlertCircle size={12} />
              {formError}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formState === 'submitting'}
              className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {formState === 'submitting' && <Loader2 size={11} className="animate-spin" />}
              Save document
            </button>
          </div>
        </form>
      )}

      {/* ── Document list ── */}
      <div className="px-5 py-3">
        {isLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-neutral-600">
            <Loader2 size={12} className="animate-spin" />
            Loading…
          </div>
        ) : loadError ? (
          <div className="flex items-center gap-2 py-4 text-xs text-red-400">
            <AlertCircle size={12} />
            {loadError}
          </div>
        ) : docs.length === 0 ? (
          <p className="py-4 text-xs text-neutral-600">
            No documents yet. Add a program outline or team application to enrich the AI Advisor.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-800/60">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-neutral-200">{doc.title}</p>
                  <p className="mt-0.5 text-[10px] text-neutral-600">
                    {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                    {doc.accel_teams?.name ? ` · ${doc.accel_teams.name}` : ''}
                    {' · '}
                    {format(parseISO(doc.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  title="Delete document"
                  className="shrink-0 rounded-md p-1.5 text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-red-400 disabled:opacity-40"
                >
                  {deletingId === doc.id
                    ? <Loader2 size={13} className="animate-spin" />
                    : <Trash2 size={13} />
                  }
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
