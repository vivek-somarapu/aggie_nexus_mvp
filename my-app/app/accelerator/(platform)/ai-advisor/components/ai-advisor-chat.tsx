'use client';

import { useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react';
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
}

export default function AiAdvisorChat({ role, userName }: AiAdvisorChatProps) {
  const accelRole = role as AccelRole;
  const starterPrompts = ROLE_STARTER_PROMPTS[accelRole] ?? [];

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, setMessages } =
    useChat({
      api: '/api/accelerator/ai-advisor',
    });

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
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
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-800 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles size={15} className="text-purple-400" />
          <div>
            <p className="text-sm font-medium text-neutral-100">
              {ROLE_LABELS[accelRole]}
            </p>
            <p className="text-xs text-neutral-600">
              Powered by Llama 3.3 · Live program data
            </p>
          </div>
        </div>
        {hasMessages && (
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
          >
            <RotateCcw size={11} />
            New chat
          </button>
        )}
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
            {messages.map((message) => (
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
                  <MessageContent content={message.content} />
                </div>
              </div>
            ))}

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
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900 focus-within:border-neutral-600 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
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
