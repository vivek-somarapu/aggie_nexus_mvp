export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="h-3 w-24 bg-neutral-800 rounded" />
        <div className="h-7 w-32 bg-neutral-800 rounded" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-neutral-800 px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-4 w-24 bg-neutral-800 rounded" />
                  <div className="h-4 w-16 bg-neutral-800 rounded" />
                  <div className="h-5 w-10 bg-neutral-800 rounded" />
                </div>
                <div className="h-3 w-56 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-36 bg-neutral-800 rounded" />
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="h-4 w-20 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-16 bg-neutral-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
