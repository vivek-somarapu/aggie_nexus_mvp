export default function Loading() {
  return (
    <div className="flex h-full flex-col animate-pulse">
      <div className="border-b border-neutral-800 px-6 py-4">
        <div className="h-5 w-32 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-56 bg-neutral-800 rounded" />
      </div>

      <div className="flex-1 px-6 py-8 flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 1 ? 'justify-end' : ''}`}>
            {i % 2 === 0 && <div className="h-8 w-8 rounded-full bg-neutral-800 shrink-0" />}
            <div className={`rounded-xl px-4 py-3 ${i % 2 === 1 ? 'bg-neutral-800 w-48' : 'bg-neutral-800 w-72'}`}>
              <div className="h-3 w-full bg-neutral-700 rounded mb-1" />
              <div className="h-3 w-3/4 bg-neutral-700 rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-neutral-800 px-6 py-4">
        <div className="h-10 w-full bg-neutral-800 rounded-lg" />
      </div>
    </div>
  );
}
