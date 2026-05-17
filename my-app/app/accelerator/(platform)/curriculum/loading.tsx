export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-32 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-52 bg-neutral-800 rounded" />
      </div>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 5 }).map((_, weekIndex) => (
          <div key={weekIndex}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-4 w-14 bg-neutral-800 rounded" />
              <div className="h-4 w-40 bg-neutral-800 rounded" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, fileIndex) => (
                <div key={fileIndex} className="flex items-center gap-3 rounded-md border border-neutral-800 px-4 py-3">
                  <div className="h-8 w-8 bg-neutral-800 rounded shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-neutral-800 rounded mb-1" />
                    <div className="h-3 w-24 bg-neutral-800 rounded" />
                  </div>
                  <div className="h-7 w-20 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
