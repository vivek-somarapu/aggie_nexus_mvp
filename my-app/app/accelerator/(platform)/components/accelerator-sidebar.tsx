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

interface NavGroup {
  label: string;
  items: NavItem[];
}

// Items are grouped by conceptual area rather than listed flat.
// Curriculum  = what teams receive (resources).
// Deliverables = what teams submit (assignments).
// Grouping them under "Program" signals both belong to the weekly cadence
// without merging their distinct functions.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        label: 'Dashboard',
        href: '/accelerator/dashboard',
        icon: LayoutDashboard,
        roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
      },
    ],
  },
  {
    label: 'Program',
    items: [
      {
        label: 'Calendar',
        href: '/accelerator/calendar',
        icon: Calendar,
        roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
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
        label: 'Curriculum',
        href: '/accelerator/curriculum',
        icon: BookOpen,
        roles: ['founder', 'aggiex_team', 'mce_staff', 'mentor'],
      },
    ],
  },
  {
    label: 'Progress',
    items: [
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
        label: 'Funding',
        href: '/accelerator/funding',
        icon: DollarSign,
        roles: ['aggiex_team', 'mce_staff'],
      },
    ],
  },
  {
    label: 'People',
    items: [
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
    ],
  },
  {
    label: 'Admin',
    items: [
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
    ],
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

  // Filter each group to items the current role can see;
  // drop the whole group if nothing is visible.
  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={`
        ${spaceGrotesk.variable}
        relative z-20 flex flex-col flex-shrink-0
        border-r border-neutral-800/60 bg-neutral-950
        transition-[width] duration-200 ease-in-out
        ${isCollapsed ? 'w-14' : 'w-56'}
      `}
    >
      {/* ── Header ── */}
      <div
        className={`
          flex h-14 items-center border-b border-neutral-800/60 gap-2.5
          ${isCollapsed ? 'justify-center px-0' : 'justify-between px-3'}
        `}
      >
        {isCollapsed ? (
          <button
            onClick={onToggle}
            aria-label="Expand sidebar"
            className="flex items-center justify-center w-8 h-8 rounded-md
              text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800
              transition-colors"
          >
            <Image
              src="/images/circles-logo.png"
              alt="AggieX"
              width={20}
              height={20}
              className="opacity-40"
            />
          </button>
        ) : (
          <>
            {/* AggieX circles mark + Caneckt wordmark */}
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/images/circles-logo.png"
                alt="AggieX"
                width={22}
                height={22}
                className="opacity-70 shrink-0"
              />
              <div className="flex flex-col gap-px leading-none min-w-0">
                <span
                  className="text-sm font-bold tracking-tight text-neutral-100 truncate"
                  style={{ fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
                >
                  Caneckt
                </span>
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-neutral-600">
                  AggieX &rsquo;26
                </span>
              </div>
            </div>

            <button
              onClick={onToggle}
              aria-label="Collapse sidebar"
              className="flex items-center justify-center w-6 h-6 rounded shrink-0
                text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800
                transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-2 gap-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {/* Section label — hidden when collapsed */}
            {!isCollapsed && (
              <p className="mb-1 px-2.5 text-[9px] font-mono uppercase tracking-[0.35em] text-neutral-700">
                {group.label}
              </p>
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
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
                    <span
                      className={`
                        whitespace-nowrap overflow-hidden
                        transition-all duration-150 ease-in-out
                        ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}
                      `}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-neutral-800/60 p-2">
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
              transition-colors"
          >
            <ArrowUpLeft size={12} className="shrink-0" />
            <span
              className={`
                whitespace-nowrap overflow-hidden
                transition-all duration-150 ease-in-out
                ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'}
              `}
            >
              aggiex.org
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
