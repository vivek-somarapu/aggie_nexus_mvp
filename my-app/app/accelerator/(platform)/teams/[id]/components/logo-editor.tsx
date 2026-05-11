'use client';

import { useState } from 'react';
import Image from 'next/image';

interface LogoEditorProps {
  teamId: string;
  currentLogoUrl: string | null;
}

export default function LogoEditor({ teamId, currentLogoUrl }: LogoEditorProps) {
  const [url, setUrl] = useState(currentLogoUrl ?? '');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setIsPending(true);
    setError(null);
    const response = await fetch(`/api/accelerator/teams/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo_url: url || '' }),
    });
    setIsPending(false);
    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? 'Save failed.');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {url && (
        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-neutral-800">
          <Image src={url} alt="Logo preview" fill className="object-contain p-1" unoptimized />
        </div>
      )}
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={save}
        disabled={isPending}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white disabled:opacity-50"
      >
        {isPending ? 'Saving...' : 'Save logo'}
      </button>
    </div>
  );
}
