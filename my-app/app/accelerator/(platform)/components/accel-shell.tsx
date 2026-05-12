'use client';

import { useState } from 'react';
import type { AccelRole } from '@/lib/accel-types';
import AcceleratorSidebar from './accelerator-sidebar';

interface AccelShellProps {
  role: AccelRole;
  children: React.ReactNode;
}

// Client wrapper that owns the sidebar collapse state.
// The layout is a server component so it can't hold useState directly —
// this shell bridges the gap without turning the whole layout client-side.
export default function AccelShell({ role, children }: AccelShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-neutral-100">
      <AcceleratorSidebar
        role={role}
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
      />
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
