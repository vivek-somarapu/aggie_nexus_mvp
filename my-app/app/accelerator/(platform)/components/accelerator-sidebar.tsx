'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Space_Grotesk } from 'next/font/google';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  TrendingUp,
  BookOpen,
  Calendar,
  UserCheck,
  Settings,
  DollarSign,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpLeft,
} from 'lucide-react';
import type { AccelRole } from '@/lib/accel-types';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-space-grotesk',
});

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AccelRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/accelerator/dashboard',
    icon: LayoutDashboard,
    roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
  },
  {
    label: 'Teams',
    href: '/accelerator/teams',
    icon: Users,
    roles: ['aggiex_team', 'mce_staff'],
  },
  {
    label: 'My Team',
    href: '/accelerator/my-team',
    icon: Users,
    roles: ['founder'],
  },
  {
    label: 'Deliverables',
    href: '/accelerator/deliverables',
    icon: ClipboardList,
    roles: ['aggiex_team', 'mce_staff'],
  },
  {
    label: 'My Deliverables',
    href: '/accelerator/my-team/deliverables',
    icon: ClipboardList,
    roles: ['founder'],
  },
  {
    label: 'Traction',
    href: '/accelerator/traction',
    icon: TrendingUp,
    roles: ['aggiex_team', 'mce_staff'],
  },
  {
    label: 'My Traction',
    href: '/accelerator/my-team/traction',
    icon: TrendingUp,
    roles: ['founder'],
  },
  {
    label: 'Meetings',
    href: '/accelerator/meetings',
    icon: MessageSquare,
    roles: ['aggiex_team', 'mce_staff', 'mentor'],
  },
  {
    label: 'My Meetings',
    href: '/accelerator/my-team/meetings',
    icon: MessageSquare,
    roles: ['founder'],
  },
  {
    label: 'Curriculum',
    href: '/accelerator/curriculum',
    icon: BookOpen,
    roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
  },
  {
    label: 'Calendar',
    href: '/accelerator/calendar',
    icon: Calendar,
    roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
  },
  {
    label: 'Mentors',
    href: '/accelerator/mentors',
    icon: UserCheck,
    roles: ['aggiex_team'],
  },
  {
    label: 'My Teams',
    href: '/accelerator/my-assignments',
    icon: UserCheck,
    roles: ['mentor'],
  },
  {
    label: 'Funding',
    href: '/accelerator/funding',
    icon: DollarSign,
    roles: ['aggiex_team', 'mce_staff'],
  },
  {
    label: 'Internal Docs',
    href: '/accelerator/internal-docs',
    icon: FileText,
    roles: ['aggiex_team', 'mce_staff'],
  },
  {
    label: 'Users',
    href: '/accelerator/users',
    icon: Users,
    roles: ['aggiex_team'],
  },
  {
    label: 'Settings',
    href: '/accelerator/settings',
    icon: Settings,
    roles: ['aggiex_team'],
  },
];

interface AcceleratorSidebarProps {
  role: AccelRole;
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function AcceleratorSidebar({
  role,
  isCollapsed,
  onToggle,
}: AcceleratorSidebarProps) {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={`
        ${spaceGrotesk.variable}
        relative flex flex-col flex-shrink-0
        border-r border-neutral-800 bg-neutral-950
        transition-[width] duration-200 ease-in-out
        ${isCollapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* ── Header ── */}
      <div
        className={`
          flex h-14 items-center border-b border-neutral-800
          ${isCollapsed ? 'justify-center px-0' : 'justify-between px-4'}
        `}
      >
        {isCollapsed ? (
          /* Collapsed: just the circles icon */
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="flex items-center justify-center w-8 h-8 rounded-md
              text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800
              transition-colors"
          >
            <Image
              src="/images/circles-logo.png"
              alt=""
              width={20}
              height={20}
              className="opacity-50"
            />
          </button>
        ) : (
          /* Expanded: Caneckt wordmark + collapse button */
          <>
            <div className="flex flex-col gap-px leading-none">
              <span
                className="text-sm font-bold tracking-tight text-neutral-100"
                style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
              >
                Caneckt
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-600">
                AggieX &rsquo;26
              </span>
            </div>

            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="flex items-center justify-center w-6 h-6 rounded
                text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800
                transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden p-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/accelerator/dashboard'
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={[
                'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors',
                isCollapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200',
              ].join(' ')}
            >
              <Icon size={15} strokeWidth={1.75} className="shrink-0" />

              {/* Label — fades and collapses when sidebar is collapsed */}
              <span
                className={`
                  whitespace-nowrap overflow-hidden transition-all duration-150 ease-in-out
                  ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}
                `}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer: expand button (collapsed) or back link (expanded) ── */}
      <div className="border-t border-neutral-800 p-2">
        {isCollapsed ? (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="flex w-full items-center justify-center rounded-md p-2
              text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800
              transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-2.5 py-2
              text-xs text-neutral-600 hover:text-neutral-300
              transition-colors overflow-hidden"
          >
            <ArrowUpLeft size={12} className="shrink-0" />
            <span className="whitespace-nowrap">aggiex.org</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
