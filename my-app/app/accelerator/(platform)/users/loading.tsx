export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-24 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="h-8 w-48 bg-neutral-800 rounded" />
        <div className="h-8 w-28 bg-neutral-800 rounded" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border border-neutral-800 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />
              <div>
                <div className="h-4 w-32 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-40 bg-neutral-800 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-neutral-800 rounded-full" />
              <div className="h-5 w-12 bg-neutral-800 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
