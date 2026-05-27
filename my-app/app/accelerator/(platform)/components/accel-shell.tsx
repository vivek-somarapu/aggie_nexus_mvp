'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import type { AccelRole } from '@/lib/accel-types';
import AcceleratorSidebar from './accelerator-sidebar';
import AiAdvisorChat from '../ai-advisor/components/ai-advisor-chat';

interface AccelShellProps {
  role: AccelRole;
  userName: string;
  children: React.ReactNode;
}

// Very faint orbital rings — same three-ring pattern as the landing page
// but at opacity-[0.03] so they read as texture, not decoration.
function BackgroundRings() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-[0.035]">
      {/* Blue ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          top: '50%',
          right: '-120px',
          marginTop: -400,
          border: '1.5px solid rgba(45, 41, 221, 0.9)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      />
      {/* Maroon ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 520,
          height: 520,
          top: '50%',
          right: '60px',
          marginTop: -160,
          border: '1.5px solid rgba(140, 0, 0, 0.9)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 32, repeat: Infinity, ease: 'linear' }}
      />
      {/* Green ring */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          top: '50%',
          right: '-40px',
          marginTop: -100,
          border: '1px solid rgba(41, 221, 108, 0.9)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

export default function AccelShell({ role, userName, children }: AccelShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Ghosted rings — pure texture, won't distract during actual work */}
      <BackgroundRings />

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden sm:contents">
        <AcceleratorSidebar
          role={role}
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed((prev) => !prev)}
          isAdvisorOpen={isAdvisorOpen}
          onAdvisorToggle={() => setIsAdvisorOpen((prev) => !prev)}
        />
      </div>

      {/* Mobile nav backdrop */}
      <div
        className={[
          'sm:hidden fixed inset-0 z-40 bg-black/60',
          'transition-opacity duration-200',
          isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={() => setIsMobileNavOpen(false)}
      />

      {/* Mobile nav drawer */}
      <div
        className={[
          'sm:hidden fixed inset-y-0 left-0 z-50 flex',
          'transition-transform duration-200 ease-in-out',
          isMobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <AcceleratorSidebar
          role={role}
          isCollapsed={false}
          onToggle={() => {}}
          isAdvisorOpen={isAdvisorOpen}
          onAdvisorToggle={() => {
            setIsAdvisorOpen((prev) => !prev);
            setIsMobileNavOpen(false);
          }}
          onMobileClose={() => setIsMobileNavOpen(false)}
        />
      </div>

      {/* Content column: main scrolls, footer stays pinned */}
      <div className="relative z-10 flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Mobile top bar — hidden on sm+ */}
        <div className="sm:hidden shrink-0 flex h-12 items-center gap-3 border-b border-neutral-800 px-4 bg-neutral-950">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            aria-label="Open navigation"
            className="flex items-center justify-center w-8 h-8 rounded-md
              text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800
              transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-neutral-100 tracking-tight">Caneckt</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Footer — h-10 to match the sidebar footer exactly */}
        <footer className="shrink-0 border-t border-neutral-800 h-10 flex items-center justify-end px-6">
          <span className="text-[10px] text-neutral-400 tracking-wide">
            A Zachary Nowroozi Production
          </span>
        </footer>

        {/* ── AI Advisor overlay panel ── */}
        {/* Always in the DOM so chat history is preserved across open/close */}
        <div
          className={[
            'absolute right-0 inset-y-0 flex flex-col',
            'w-full sm:w-[440px] sm:max-w-[calc(100vw-5rem)]',
            'bg-neutral-950 border-l border-neutral-800',
            'shadow-[-12px_0_32px_rgba(0,0,0,0.5)]',
            'transition-transform duration-300 ease-in-out z-30',
            isAdvisorOpen ? 'translate-x-0' : 'translate-x-full',
          ].join(' ')}
        >
          <AiAdvisorChat
            role={role}
            userName={userName}
            onClose={() => setIsAdvisorOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
