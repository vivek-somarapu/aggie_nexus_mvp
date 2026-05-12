'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Send, Loader2, Sparkles, RotateCcw, X } from 'lucide-react';
import type { AccelRole } from '@/lib/accel-types';

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

// ─── Component ───────────────────────────────────────────────────────────────

interface AiAdvisorChatProps {
  role: string;
  userName: string;
  onClose?: () => void;
}

export default function AiAdvisorChat({ role, userName, onClose }: AiAdvisorChatProps) {
  const accelRole = role as AccelRole;
  const starterPrompts = ROLE_STARTER_PROMPTS[accelRole] ?? [];

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/accelerator/ai-advisor' }),
  });

  const isLoading = status === 'submitted' || status === 'streaming';

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
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
    sendMessage({ text });
  };

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
    setMessages([]);
    setInput('');
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-500/15">
            <Sparkles size={13} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-100 leading-tight">
              {ROLE_LABELS[accelRole]}
            </p>
            <p className="text-[10px] text-neutral-600 leading-tight mt-0.5">
              Llama 3.3 · Live program data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasMessages && (
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
        {!hasMessages ? (
          /* Empty state — starter prompts */
          <div className="my-auto flex flex-col items-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Sparkles size={18} className="text-purple-400" />
            </div>
            <p className="mt-3 text-sm font-medium text-neutral-200">
              Hi {userName.split(' ')[0]}, ask me anything.
            </p>
            <p className="mt-1 text-xs text-neutral-600">
              I have access to your live program data.
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
          /* Message thread */
          <div className="mx-auto w-full max-w-2xl flex flex-col gap-4">
            {messages.map((message) => {
              const textContent = message.parts
                .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                .map((part) => part.text)
                .join('');

              if (!textContent) return null;

              return (
                <div
                  key={message.id}
                  className={['flex', message.role === 'user' ? 'justify-end' : 'justify-start'].join(' ')}
                >
                  {message.role === 'assistant' && (
                    <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                      <Sparkles size={11} className="text-purple-400" />
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
                    <MessageContent content={textContent} />
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                  <Sparkles size={11} className="text-purple-400" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-neutral-900 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-500" />
                </div>
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
            <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 focus-within:border-neutral-600 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about deliverables, traction, curriculum, team progress…"
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
            Enter to send · Shift+Enter for new line · Data refreshes each session
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Message content renderer ─────────────────────────────────────────────────
// Very lightweight markdown: bold, code, and bullet lists without a heavy library

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
  // Handle **bold** and `code` inline
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
