'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AccelRole } from '@/lib/accel-types';
import AcceleratorSidebar from './accelerator-sidebar';

interface AccelShellProps {
  role: AccelRole;
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

export default function AccelShell({ role, children }: AccelShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Ghosted rings — pure texture, won't distract during actual work */}
      <BackgroundRings />

      <AcceleratorSidebar
        role={role}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Content column: main scrolls, footer stays pinned */}
      <div className="relative z-10 flex flex-1 min-w-0 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        <footer className="shrink-0 border-t border-neutral-900 px-6 py-2.5 flex justify-end">
          <span className="text-[10px] text-neutral-800 tracking-wide">
            A Zachary Nowroozi Production
          </span>
        </footer>
      </div>
    </div>
  );
}
