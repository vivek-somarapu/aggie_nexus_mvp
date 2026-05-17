export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="rounded-lg border border-neutral-800 px-5 py-5 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="h-5 w-40 bg-neutral-800 rounded mb-2" />
            <div className="h-3 w-56 bg-neutral-800 rounded" />
          </div>
          <div className="h-6 w-20 bg-neutral-800 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-20 bg-neutral-800 rounded mb-1" />
              <div className="h-4 w-28 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-800 px-5 py-5">
        <div className="h-3 w-24 bg-neutral-800 rounded mb-4" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />
              <div>
                <div className="h-4 w-32 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-24 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
