export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-16 bg-neutral-800 rounded mb-2" />
        <div className="h-6 w-28 bg-neutral-800 rounded mb-1" />
        <div className="h-3 w-44 bg-neutral-800 rounded" />
      </div>

      <div className="flex flex-col gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="h-3 w-24 bg-neutral-800 rounded mb-2" />
            <div className="h-10 w-full bg-neutral-800 rounded" />
          </div>
        ))}
        <div className="pt-2">
          <div className="h-9 w-28 bg-neutral-800 rounded" />
        </div>
      </div>
    </div>
  );
}
