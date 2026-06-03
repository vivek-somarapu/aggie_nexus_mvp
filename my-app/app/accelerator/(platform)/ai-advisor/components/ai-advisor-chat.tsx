'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Loader2, RotateCcw, X, AlertCircle, Mic, MicOff, CheckCircle2, Sparkles } from 'lucide-react';
import type { AccelRole } from '@/lib/accel-types';
import type { ExtractionResult } from '@/app/api/accelerator/ai-advisor/extract/route';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string };

type ExtractionWithTeam = ExtractionResult & { team_id: string };

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_STARTER_PROMPTS: Record<AccelRole, string[]> = {
  founder: [
    'What do I need to submit this week?',
    'What feedback did AggieX leave on my deliverables?',
    'Can you explain this week\'s curriculum?',
    'How is my traction looking?',
    'What\'s coming up on the calendar?',
  ],
  aggiex_team: [
    'Which teams are behind on deliverables?',
    'Who has the most traction momentum?',
    'Summarize team progress for this week\'s check-in.',
    'Which teams deserve more program funding?',
    'Who hasn\'t logged traction recently?',
  ],
  mce_staff: [
    'Give me an overview of cohort health.',
    'Which teams are struggling?',
    'How does overall traction look this week?',
    'Summarize the program for a stakeholder update.',
  ],
  mentor: [
    'What should I focus on in my next mentor session?',
    'How is my assigned team progressing?',
    'What traction has my team logged recently?',
    'What meetings have we had so far?',
  ],
};

const ROLE_LABELS: Record<AccelRole, string> = {
  founder: 'Founder Advisor',
  aggiex_team: 'Program Advisor',
  mce_staff: 'Cohort Observer',
  mentor: 'Mentor Advisor',
};

// ─── Action card state ────────────────────────────────────────────────────────

type ActionPhase =
  | { tag: 'recording' }
  | { tag: 'transcribing' }
  | { tag: 'extracting'; transcript: string }
  | { tag: 'review'; transcript: string; extraction: ExtractionWithTeam; selected: Set<number> }
  | { tag: 'submitting' }
  | { tag: 'done'; count: number };

// ─── Component ────────────────────────────────────────────────────────────────

interface AiAdvisorChatProps {
  role: string;
  userName: string;
  onClose?: () => void;
}

export default function AiAdvisorChat({ role, userName, onClose }: AiAdvisorChatProps) {
  const accelRole = role as AccelRole;
  const isFounder = accelRole === 'founder';
  const starterPrompts = ROLE_STARTER_PROMPTS[accelRole] ?? [];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return;
    setChatError(null);
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '' };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setIsLoading(true);

    abortRef.current = new AbortController();
    try {
      const response = await fetch('/api/accelerator/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          messages: next.slice(0, -1).map((m) => ({
            id: m.id,
            role: m.role,
            parts: [{ type: 'text', text: m.content }],
          })),
        }),
      });
      if (!response.ok || !response.body) {
        setChatError(`Error ${response.status}. Please try again.`);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
        );
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        setChatError('Something went wrong. Please try again.');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const [input, setInput] = useState('');
  const [actionPhase, setActionPhase] = useState<ActionPhase | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, actionPhase]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [input]);

  const submit = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage(text);
    if (isFounder && !actionPhase) runExtractionSilently(text);
  };

  async function runExtractionSilently(text: string) {
    try {
      const response = await fetch('/api/accelerator/ai-advisor/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text }),
      });
      if (!response.ok) return;
      const extraction = await response.json() as ExtractionWithTeam;
      if (extraction.deliverables.length === 0 && extraction.traction.length === 0) return;
      const totalItems = extraction.deliverables.length + extraction.traction.length;
      setActionPhase({
        tag: 'review',
        transcript: text,
        extraction,
        selected: new Set(Array.from({ length: totalItems }, (_, i) => i)),
      });
    } catch {
      // Silent failure — don't surface extraction errors for background runs
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const useStarterPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    setChatError(null);
    setInput('');
    setActionPhase(null);
    setActionError(null);
  };

  // ── Voice + extraction flow (founder only) ────────────────────────────────

  async function startRecording() {
    setActionError(null);
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
        await handleAudioReady(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setActionPhase({ tag: 'recording' });
    } catch {
      setActionError('Microphone access denied. Please allow mic access and try again.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  async function handleAudioReady(blob: Blob) {
    setActionPhase({ tag: 'transcribing' });

    const form = new FormData();
    form.append('audio', blob, 'audio.webm');
    const transcribeResponse = await fetch('/api/accelerator/transcribe', {
      method: 'POST',
      body: form,
    });

    if (!transcribeResponse.ok) {
      const data = await transcribeResponse.json();
      setActionPhase(null);
      setActionError(data.error ?? 'Transcription failed.');
      return;
    }

    const { transcript } = await transcribeResponse.json() as { transcript: string };
    await runExtraction(transcript);
  }

  async function runExtraction(transcript: string) {
    setActionPhase({ tag: 'extracting', transcript });

    const extractResponse = await fetch('/api/accelerator/ai-advisor/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });

    if (!extractResponse.ok) {
      const data = await extractResponse.json();
      setActionPhase(null);
      setActionError(data.error ?? 'Extraction failed.');
      return;
    }

    const extraction = await extractResponse.json() as ExtractionWithTeam;

    if (extraction.deliverables.length === 0 && extraction.traction.length === 0) {
      setActionPhase(null);
      setActionError('No deliverables or traction detected in your message. Try being more specific (e.g. "We submitted our pitch deck and hit 200 users").');
      return;
    }

    const totalItems = extraction.deliverables.length + extraction.traction.length;
    setActionPhase({
      tag: 'review',
      transcript,
      extraction,
      selected: new Set(Array.from({ length: totalItems }, (_, i) => i)),
    });
  }

  async function confirmExtraction(phase: Extract<ActionPhase, { tag: 'review' }>) {
    const { extraction, selected } = phase;
    setActionPhase({ tag: 'submitting' });
    setActionError(null);

    let submittedCount = 0;

    const deliverablePromises = extraction.deliverables.map(async (item, index) => {
      if (!selected.has(index)) return;
      const response = await fetch('/api/accelerator/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliverable_id: item.id,
          team_id: extraction.team_id,
          status: 'submitted',
          text_content: item.text_content,
        }),
      });
      if (response.ok) submittedCount++;
    });

    const tractionOffset = extraction.deliverables.length;
    const tractionPromises = extraction.traction.map(async (item, index) => {
      if (!selected.has(tractionOffset + index)) return;
      const response = await fetch('/api/accelerator/traction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: extraction.team_id,
          metric_type: item.metric_type,
          value: item.value,
          unit: item.unit,
          notes: item.notes ?? '',
          entry_date: new Date().toISOString().split('T')[0],
        }),
      });
      if (response.ok) submittedCount++;
    });

    await Promise.all([...deliverablePromises, ...tractionPromises]);
    setActionPhase({ tag: 'done', count: submittedCount });
  }

  function toggleSelected(phase: Extract<ActionPhase, { tag: 'review' }>, index: number) {
    const next = new Set(phase.selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setActionPhase({ ...phase, selected: next });
  }

  const hasMessages = messages.length > 0;
  const isInActionFlow = actionPhase !== null;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <Image
              src="/images/AggieX_logo_X.png"
              alt="AggieX"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-100 leading-tight">
              {ROLE_LABELS[accelRole]}
            </p>
            <p className="text-[10px] text-neutral-600 leading-tight mt-0.5">
              AggieX Advisor · Live program data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(hasMessages || isInActionFlow) && (
            <button
              onClick={reset}
              title="New chat"
              className="flex items-center justify-center h-7 w-7 rounded-md text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            >
              <RotateCcw size={12} />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="flex items-center justify-center h-7 w-7 rounded-md text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Message area ── */}
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
        {!hasMessages && !isInActionFlow ? (
          /* Empty state — starter prompts */
          <div className="my-auto flex flex-col items-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src="/images/AggieX_logo_X.png"
                alt="AggieX"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-neutral-200">
              Hi {userName.split(' ')[0]}, ask me anything.
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              I have access to your live program data.
              {isFounder && ' Hit the mic to submit via voice.'}
            </p>

            <div className="mt-8 flex max-w-md flex-wrap justify-center gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => useStarterPrompt(prompt)}
                  className="rounded-full border border-neutral-800 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-neutral-700 hover:text-neutral-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Message thread + action card */
          <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
            {messages.map((message) => {
              const textContent = message.content;
              if (!textContent && message.role !== 'user') return null;

              return (
                <div
                  key={message.id}
                  className={['flex', message.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
                >
                  {message.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                      <Image
                        src="/images/AggieX_logo_X.png"
                        alt="AggieX"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                  )}
                  <div
                    className={[
                      'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-tr-sm bg-neutral-700 text-neutral-100'
                        : 'rounded-tl-sm bg-neutral-900 text-neutral-200',
                    ].join(' ')}
                  >
                    {textContent
                      ? <MessageContent content={textContent} />
                      : <span className="text-neutral-600 italic text-xs">No content</span>
                    }
                  </div>
                </div>
              );
            })}

            {/* Streaming indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                  <Image
                    src="/images/AggieX_logo_X.png"
                    alt="AggieX"
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-neutral-900 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                </div>
              </div>
            )}

            {/* Chat error */}
            {chatError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{chatError}</p>
              </div>
            )}

            {/* ── Action card ── */}
            {actionPhase && (
              <ActionCard
                phase={actionPhase}
                onToggle={(i) => {
                  if (actionPhase.tag === 'review') toggleSelected(actionPhase, i);
                }}
                onConfirm={() => {
                  if (actionPhase.tag === 'review') confirmExtraction(actionPhase);
                }}
                onDismiss={() => { setActionPhase(null); setActionError(null); }}
              />
            )}

            {actionError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3">
                <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-300">{actionError}</p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input area ── */}
      <div className="shrink-0 border-t border-neutral-800 px-6 py-4">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleFormSubmit} className="flex items-end gap-2">
            {/* Mic button (founder only) */}
            {isFounder && (
              <button
                type="button"
                title={actionPhase?.tag === 'recording' ? 'Stop recording' : 'Submit via voice'}
                disabled={
                  actionPhase !== null && actionPhase.tag !== 'recording'
                }
                onClick={() => {
                  if (actionPhase?.tag === 'recording') {
                    stopRecording();
                  } else {
                    startRecording();
                  }
                }}
                className={[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
                  actionPhase?.tag === 'recording'
                    ? 'animate-pulse bg-red-500 text-white'
                    : actionPhase !== null
                    ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed opacity-50'
                    : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200',
                ].join(' ')}
              >
                {actionPhase?.tag === 'recording' ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            )}

            <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 focus-within:border-neutral-600 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isFounder
                    ? 'Ask a question or hit the mic to submit progress…'
                    : 'Ask about deliverables, traction, curriculum, team progress…'
                }
                rows={1}
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
                style={{ maxHeight: '160px' }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white transition-colors hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </form>
          <p className="mt-2 text-center text-[10px] text-neutral-700">
            {isFounder
              ? 'Enter to send · Shift+Enter for new line · Mic to submit progress by voice'
              : 'Enter to send · Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Action Card ─────────────────────────────────────────────────────────────

interface ActionCardProps {
  phase: ActionPhase;
  onToggle: (index: number) => void;
  onConfirm: () => void;
  onDismiss: () => void;
}

function ActionCard({ phase, onToggle, onConfirm, onDismiss }: ActionCardProps) {
  if (phase.tag === 'recording') {
    return (
      <StatusCard icon="mic" label="Listening…" sublabel="Click the mic button to stop recording." />
    );
  }

  if (phase.tag === 'transcribing') {
    return <StatusCard icon="spinner" label="Transcribing audio…" />;
  }

  if (phase.tag === 'extracting') {
    return (
      <StatusCard
        icon="spinner"
        label="Analyzing your update…"
        sublabel={`"${phase.transcript.slice(0, 80)}${phase.transcript.length > 80 ? '…' : ''}"`}
      />
    );
  }

  if (phase.tag === 'submitting') {
    return <StatusCard icon="spinner" label="Submitting…" />;
  }

  if (phase.tag === 'done') {
    return (
      <div className="rounded-2xl rounded-tl-sm border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-300">
            Submitted {phase.count} item{phase.count !== 1 ? 's' : ''} successfully.
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (phase.tag === 'review') {
    const { extraction, selected } = phase;
    const hasSelection = selected.size > 0;

    return (
      <div className="rounded-2xl rounded-tl-sm border border-neutral-700 bg-neutral-900 px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={13} className="shrink-0 text-purple-400" />
          <p className="text-xs font-medium text-neutral-200">
            {extraction.summary}
          </p>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {extraction.deliverables.map((item, index) => (
            <label
              key={item.id}
              className="flex items-start gap-2.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.has(index)}
                onChange={() => onToggle(index)}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-purple-500"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-neutral-200">{item.title}</p>
                <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{item.text_content}</p>
              </div>
            </label>
          ))}

          {extraction.traction.map((item, index) => {
            const globalIndex = extraction.deliverables.length + index;
            return (
              <label
                key={`${item.metric_type}-${index}`}
                className="flex items-start gap-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(globalIndex)}
                  onChange={() => onToggle(globalIndex)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-purple-500"
                />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-neutral-200 capitalize">
                    Traction: {item.metric_type}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {item.value} {item.unit}{item.notes ? ` — ${item.notes}` : ''}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onConfirm}
            disabled={!hasSelection}
            className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm & Submit
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function StatusCard({ icon, label, sublabel }: { icon: 'mic' | 'spinner'; label: string; sublabel?: string }) {
  return (
    <div className="rounded-2xl rounded-tl-sm border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="flex items-center gap-2">
        {icon === 'spinner' ? (
          <Loader2 size={13} className="shrink-0 animate-spin text-neutral-500" />
        ) : (
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-red-500" />
        )}
        <p className="text-xs text-neutral-400">{label}</p>
      </div>
      {sublabel && (
        <p className="mt-1 text-xs text-neutral-600 italic pl-5">{sublabel}</p>
      )}
    </div>
  );
}

// ─── Message content renderer ─────────────────────────────────────────────────

function MessageContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        if (line.startsWith('### ')) {
          return (
            <p key={index} className="font-semibold text-neutral-100">
              {renderInline(line.slice(4))}
            </p>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <p key={index} className="font-semibold text-neutral-100 mt-2">
              {renderInline(line.slice(3))}
            </p>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2">
              <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-neutral-500" />
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        if (line.trim() === '') {
          return <div key={index} className="h-1" />;
        }
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-neutral-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-neutral-800 px-1 py-0.5 font-mono text-xs text-neutral-300">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
