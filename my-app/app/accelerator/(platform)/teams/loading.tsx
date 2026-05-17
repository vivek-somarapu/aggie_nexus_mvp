export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-24 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="h-5 w-36 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-24 bg-neutral-800 rounded" />
              </div>
              <div className="h-6 w-16 bg-neutral-800 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex justify-between">
                  <div className="h-3 w-20 bg-neutral-800 rounded" />
                  <div className="h-3 w-16 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
