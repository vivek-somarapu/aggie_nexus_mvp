export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-52 bg-neutral-800 rounded" />
      </div>

      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-20 bg-neutral-800 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-5 w-12 bg-neutral-800 rounded" />
                <div className="h-4 w-36 bg-neutral-800 rounded" />
              </div>
              <div className="h-4 w-24 bg-neutral-800 rounded" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-6 w-28 bg-neutral-800 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
