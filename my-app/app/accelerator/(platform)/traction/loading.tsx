export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-32 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-48 bg-neutral-800 rounded" />
      </div>

      <section className="mb-10">
        <div className="h-3 w-40 bg-neutral-800 rounded mb-3" />
        {Array.from({ length: 3 }).map((_, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            <div className="h-3 w-20 bg-neutral-800 rounded mb-2" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, cardIndex) => (
                <div key={cardIndex} className="rounded-lg border border-neutral-800 px-3 py-3">
                  <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
                  <div className="h-6 w-12 bg-neutral-800 rounded mb-1" />
                  <div className="h-3 w-8 bg-neutral-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section>
        <div className="h-3 w-24 bg-neutral-800 rounded mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between rounded-md border border-neutral-800 px-4 py-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-16 bg-neutral-800 rounded" />
                  <div className="h-3 w-12 bg-neutral-800 rounded" />
                  <div className="h-4 w-8 bg-neutral-800 rounded" />
                </div>
                <div className="h-3 w-48 bg-neutral-800 rounded" />
              </div>
              <div className="ml-4 shrink-0 text-right">
                <div className="h-4 w-16 bg-neutral-800 rounded mb-1" />
                <div className="h-3 w-20 bg-neutral-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
