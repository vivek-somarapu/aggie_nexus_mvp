export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-4">
            <div className="h-3 w-20 bg-neutral-800 rounded mb-3" />
            <div className="h-7 w-24 bg-neutral-800 rounded mb-1" />
            <div className="h-3 w-16 bg-neutral-800 rounded" />
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-24 bg-neutral-800 rounded" />
        <div className="h-7 w-28 bg-neutral-800 rounded" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-5 w-20 bg-neutral-800 rounded-full" />
                <div className="h-4 w-24 bg-neutral-800 rounded" />
              </div>
              <div className="h-3 w-32 bg-neutral-800 rounded" />
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-neutral-800 rounded mb-1" />
              <div className="h-3 w-16 bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
