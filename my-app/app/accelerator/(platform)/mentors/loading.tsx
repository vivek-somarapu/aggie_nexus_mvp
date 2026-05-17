export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-neutral-800 shrink-0" />
              <div>
                <div className="h-4 w-32 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-24 bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-5 w-20 bg-neutral-800 rounded-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
