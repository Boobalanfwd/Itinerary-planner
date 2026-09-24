export default function ItineraryLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero banner skeleton */}
      <div className="relative h-64 sm:h-80 bg-muted w-full" />

      {/* Content skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Day list panel */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-4 space-y-3"
              >
                <div className="h-5 w-28 rounded bg-muted" />
                <div className="h-3 w-40 rounded bg-muted/60" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex gap-3 items-start">
                      <div className="h-8 w-8 rounded-lg bg-muted flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-full rounded bg-muted" />
                        <div className="h-2.5 w-3/4 rounded bg-muted/60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Map panel */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-muted h-[500px]" />
        </div>
      </div>
    </div>
  );
}
