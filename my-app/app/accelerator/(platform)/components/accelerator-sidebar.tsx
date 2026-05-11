'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import type { AccelRole } from '@/lib/accel-types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: AccelRole[];
}

// Ordered list of sidebar navigation items.
// Each item declares which roles can see it.
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
}

export default function AcceleratorSidebar({ role }: AcceleratorSidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex w-56 flex-col border-r border-neutral-800 bg-neutral-950">
      {/* Logo / program name */}
      <div className="flex h-14 items-center border-b border-neutral-800 px-4">
        <span className="text-sm font-semibold tracking-wide text-neutral-100">
          AggieX <span className="text-maroon-500 text-neutral-400">&#39;26</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-3">
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
              className={[
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-neutral-800 text-neutral-100'
                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200',
              ].join(' ')}
            >
              <Icon size={15} strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: back to main site */}
      <div className="border-t border-neutral-800 p-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-xs text-neutral-500 transition-colors hover:text-neutral-300"
        >
          ← aggiex.org
        </Link>
      </div>
    </aside>
  );
}
