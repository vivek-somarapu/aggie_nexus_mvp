'use client';

import { useState } from 'react';
import { ACCEL_ROLES } from '@/lib/accel-types';
import type { AccelProfile } from '@/lib/accel-types';

interface PendingApprovalRowProps {
  profile: AccelProfile;
}

export default function PendingApprovalRow({ profile }: PendingApprovalRowProps) {
  const [isPending, setIsPending] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleApprove = async () => {
    setIsPending(true);

    const response = await fetch(`/api/accelerator/profiles/${profile.id}/approve`, {
      method: 'POST',
    });

    setIsPending(false);

    if (response.ok) {
      setIsApproved(true);
    }
  };

  const appliedDate = profile.onboarding_completed_at
    ? new Date(profile.onboarding_completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <tr className="hover:bg-neutral-900/30">
      <td className="px-4 py-3 font-medium text-neutral-100">{profile.full_name}</td>
      <td className="px-4 py-3 text-neutral-400">{profile.email}</td>
      <td className="px-4 py-3 text-xs text-neutral-400">{ACCEL_ROLES[profile.role]}</td>
      <td className="px-4 py-3 text-xs text-neutral-500">{appliedDate}</td>
      <td className="px-4 py-3 text-right">
        {isApproved ? (
          <span className="text-xs text-emerald-400">Approved</span>
        ) : (
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
          >
            {isPending ? 'Approving...' : 'Approve'}
          </button>
        )}
      </td>
    </tr>
  );
}
