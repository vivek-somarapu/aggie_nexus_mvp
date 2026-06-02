'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Mic, MicOff, Paperclip, X } from 'lucide-react';
import { SUBMISSION_STATUS_LABELS } from '@/lib/accel-types';
import type { AccelSubmissionStatus } from '@/lib/accel-types';

// ─── Constants ───────────────────────────────────────────────

const STATUS_COLORS: Record<AccelSubmissionStatus, string> = {
  not_started: 'bg-neutral-800 text-neutral-500',
  in_progress: 'bg-blue-500/10 text-blue-400',
  submitted: 'bg-amber-500/10 text-amber-400',
  under_review: 'bg-purple-500/10 text-purple-400',
  approved: 'bg-emerald-500/10 text-emerald-400',
  needs_revision: 'bg-orange-500/10 text-orange-400',
  flagged: 'bg-red-500/10 text-red-400',
};

function detectFileType(filename: string): 'pdf' | 'docx' | 'image' | 'other' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext ?? '')) return 'image';
  return 'other';
}

interface PendingFile {
  localId: string;
  file: File;
  uploading: boolean;
  publicUrl: string | null;
  error: string | null;
}

// ─── Types ────────────────────────────────────────────────────

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  expected_format: string;
  is_required: boolean;
  submission: {
    id: string;
    status: string;
    text_content: string | null;
    version: number;
  } | null;
  feedback?: string | null;
}

interface SubmitDeliverablePanelProps {
  deliverable: Deliverable;
  teamId: string;
}

// ─── Component ───────────────────────────────────────────────

export default function SubmitDeliverablePanel({
  deliverable,
  teamId,
}: SubmitDeliverablePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [textContent, setTextContent] = useState(
    deliverable.submission?.text_content ?? ''
  );
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState(
    deliverable.submission?.status ?? 'not_started'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = localStatus !== 'approved';
  const acceptsText = ['text', 'any'].includes(deliverable.expected_format);
  const acceptsFile = ['file', 'any'].includes(deliverable.expected_format);
  const acceptsLink = ['link', 'any'].includes(deliverable.expected_format);

  // ── Voice recording ───────────────────────────────────────

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setSubmitError('Microphone access denied.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function transcribeAudio(blob: Blob) {
    setIsTranscribing(true);
    const form = new FormData();
    form.append('audio', blob, 'audio.webm');

    const response = await fetch('/api/accelerator/transcribe', {
      method: 'POST',
      body: form,
    });

    setIsTranscribing(false);

    if (!response.ok) {
      const data = await response.json();
      setSubmitError(data.error ?? 'Transcription failed.');
      return;
    }

    const { transcript } = await response.json() as { transcript: string };
    setTextContent((prev) => prev ? `${prev}\n\n${transcript}` : transcript);
  }

  // ── File upload ───────────────────────────────────────────

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = '';

    const newEntries: PendingFile[] = files.map((file) => ({
      localId: `${Date.now()}-${Math.random()}`,
      file,
      uploading: true,
      publicUrl: null,
      error: null,
    }));

    setPendingFiles((prev) => [...prev, ...newEntries]);

    await Promise.all(
      newEntries.map(async (entry) => {
        const form = new FormData();
        form.append('file', entry.file);

        const response = await fetch('/api/upload/submissions', {
          method: 'POST',
          body: form,
        });

        if (!response.ok) {
          const data = await response.json();
          setPendingFiles((prev) =>
            prev.map((f) =>
              f.localId === entry.localId
                ? { ...f, uploading: false, error: data.error ?? 'Upload failed.' }
                : f
            )
          );
          return;
        }

        const { publicUrl } = await response.json() as { publicUrl: string };
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.localId === entry.localId
              ? { ...f, uploading: false, publicUrl }
              : f
          )
        );
      })
    );
  }

  function removePendingFile(localId: string) {
    setPendingFiles((prev) => prev.filter((f) => f.localId !== localId));
  }

  // ── Submission ────────────────────────────────────────────

  const handleSubmit = async () => {
    const hasText = textContent.trim().length > 0;
    const readyFiles = pendingFiles.filter((f) => f.publicUrl !== null);

    if (deliverable.expected_format === 'text' && !hasText) {
      setSubmitError('Content is required.');
      return;
    }
    if (deliverable.expected_format === 'file' && readyFiles.length === 0) {
      setSubmitError('Please attach at least one file.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const submissionResponse = await fetch('/api/accelerator/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverable_id: deliverable.id,
        team_id: teamId,
        status: 'submitted',
        text_content: hasText ? textContent : null,
      }),
    });

    if (!submissionResponse.ok) {
      const data = await submissionResponse.json();
      setSubmitError(data.error ?? 'Submission failed.');
      setIsSubmitting(false);
      return;
    }

    const submission = await submissionResponse.json() as { id: string };

    // Attach any uploaded files
    if (readyFiles.length > 0) {
      await Promise.all(
        readyFiles.map((f) =>
          fetch(`/api/accelerator/submissions/${submission.id}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file_url: f.publicUrl,
              file_name: f.file.name,
              file_type: detectFileType(f.file.name),
            }),
          })
        )
      );
    }

    setIsSubmitting(false);
    setLocalStatus('submitted');
    setPendingFiles([]);
    setIsExpanded(false);
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const response = await fetch('/api/accelerator/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deliverable_id: deliverable.id,
        team_id: teamId,
        status: 'in_progress',
        text_content: textContent || null,
      }),
    });

    setIsSubmitting(false);
    if (response.ok) setLocalStatus('in_progress');
  };

  const hasUploadableFiles = pendingFiles.some((f) => f.publicUrl !== null);
  const hasAnyUploading = pendingFiles.some((f) => f.uploading);

  return (
    <div className={[
      'overflow-hidden rounded-lg border transition-colors',
      isExpanded ? 'border-neutral-700' : 'border-neutral-800',
    ].join(' ')}>
      {/* Header row — always visible */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-200">{deliverable.title}</span>
          {deliverable.is_required && (
            <span className="text-xs text-neutral-600">Required</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[localStatus as AccelSubmissionStatus] ?? 'bg-neutral-800 text-neutral-500'}`}>
            {SUBMISSION_STATUS_LABELS[localStatus as AccelSubmissionStatus] ?? localStatus}
          </span>
          {isExpanded ? (
            <ChevronUp size={14} className="text-neutral-500" />
          ) : (
            <ChevronDown size={14} className="text-neutral-500" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="border-t border-neutral-800 px-4 pb-4 pt-3">
          {/* Feedback from AggieX */}
          {deliverable.feedback &&
            (localStatus === 'needs_revision' || localStatus === 'flagged') && (
              <div className="mb-4 flex items-start gap-2.5 rounded-md border border-orange-500/25 bg-orange-500/5 px-3 py-3">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-orange-400" />
                <div>
                  <p className="text-xs font-medium text-orange-400">Feedback from AggieX</p>
                  <p className="mt-1 text-sm text-neutral-300">{deliverable.feedback}</p>
                </div>
              </div>
            )}

          {/* Approved message */}
          {localStatus === 'approved' && (
            <div className="mb-4 flex items-center gap-2.5 rounded-md border border-emerald-500/25 bg-emerald-500/5 px-3 py-2.5">
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
              <p className="text-sm text-emerald-300">Approved — no further action needed.</p>
            </div>
          )}

          {deliverable.description && (
            <p className="mb-3 text-sm text-neutral-400">{deliverable.description}</p>
          )}

          {/* Text input */}
          {acceptsText && (
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                {deliverable.expected_format === 'text' ? 'Response' : 'Text content (optional)'}
              </label>
              <div className="relative">
                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Write your response here..."
                  disabled={!canSubmit}
                  className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 pr-10 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
                />
                {canSubmit && (
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isTranscribing}
                    title={isRecording ? 'Stop recording' : 'Record voice input'}
                    className={[
                      'absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md transition-colors',
                      isRecording
                        ? 'animate-pulse bg-red-500/20 text-red-400'
                        : 'text-neutral-600 hover:bg-neutral-800 hover:text-neutral-300',
                      isTranscribing ? 'opacity-50 cursor-not-allowed' : '',
                    ].join(' ')}
                  >
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}
              </div>
              {isRecording && (
                <p className="mt-1 text-xs text-red-400">Recording… click the mic to stop.</p>
              )}
              {isTranscribing && (
                <p className="mt-1 text-xs text-neutral-500">Transcribing…</p>
              )}
            </div>
          )}

          {/* Link input */}
          {acceptsLink && (
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                {deliverable.expected_format === 'link' ? 'URL *' : 'Link (optional)'}
              </label>
              <input
                type="url"
                placeholder="https://..."
                disabled={!canSubmit}
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
              />
            </div>
          )}

          {/* File upload */}
          {acceptsFile && canSubmit && (
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-neutral-500">
                {deliverable.expected_format === 'file' ? 'File *' : 'File (optional)'}
              </label>

              {/* Attached files list */}
              {pendingFiles.length > 0 && (
                <div className="mb-2 flex flex-col gap-1">
                  {pendingFiles.map((f) => (
                    <div
                      key={f.localId}
                      className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5"
                    >
                      <Paperclip size={12} className="shrink-0 text-neutral-500" />
                      <span className="flex-1 truncate text-xs text-neutral-300">{f.file.name}</span>
                      {f.uploading && (
                        <span className="text-xs text-neutral-600">Uploading…</span>
                      )}
                      {f.error && (
                        <span className="text-xs text-red-400">{f.error}</span>
                      )}
                      {f.publicUrl && (
                        <span className="text-xs text-emerald-500">✓</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removePendingFile(f.localId)}
                        className="text-neutral-600 hover:text-neutral-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                onChange={handleFileSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-md border border-dashed border-neutral-700 px-4 py-3 text-xs text-neutral-500 transition-colors hover:border-neutral-600 hover:text-neutral-300 w-full justify-center"
              >
                <Paperclip size={13} />
                Attach file
              </button>
            </div>
          )}

          {/* File upload placeholder when not canSubmit */}
          {acceptsFile && !canSubmit && pendingFiles.length === 0 && (
            <div className="mb-3 rounded-md border border-neutral-800 px-3 py-2 text-xs text-neutral-600">
              Files attached to this submission.
            </div>
          )}

          {submitError && (
            <p className="mb-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {submitError}
            </p>
          )}

          {canSubmit && (
            <div className="flex justify-end gap-2">
              {acceptsText && (
                <button
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="rounded-md px-3 py-1.5 text-xs text-neutral-500 transition-colors hover:text-neutral-300 disabled:opacity-50"
                >
                  Save draft
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || hasAnyUploading || (acceptsFile && deliverable.expected_format === 'file' && !hasUploadableFiles)}
                className="rounded-md bg-neutral-100 px-4 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          )}

          {deliverable.submission?.version && deliverable.submission.version > 1 && (
            <p className="mt-2 text-xs text-neutral-600">
              Version {deliverable.submission.version}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
