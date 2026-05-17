export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-48 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-64 bg-neutral-800 rounded" />
      </div>

      <div className="mb-6 rounded-lg border border-neutral-800 px-5 py-4">
        <div className="h-3 w-28 bg-neutral-800 rounded mb-3" />
        <div className="h-4 w-full bg-neutral-800 rounded mb-2" />
        <div className="h-4 w-3/4 bg-neutral-800 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-4">
            <div className="h-3 w-20 bg-neutral-800 rounded mb-3" />
            <div className="h-5 w-32 bg-neutral-800 rounded mb-2" />
            <div className="h-3 w-24 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-neutral-800 px-5 py-4">
        <div className="h-3 w-32 bg-neutral-800 rounded mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-neutral-800 last:border-0">
            <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />
            <div>
              <div className="h-3 w-32 bg-neutral-800 rounded mb-1" />
              <div className="h-3 w-20 bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
