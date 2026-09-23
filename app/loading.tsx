export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-5 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-40 animate-pulse rounded-md bg-secondary" />
          <div className="h-4 w-80 max-w-[70vw] animate-pulse rounded-md bg-secondary/70" />
        </div>
        <div className="h-9 w-48 animate-pulse rounded-lg bg-secondary" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-xl border border-border bg-card"
          >
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 rounded bg-secondary" />
              <div className="h-4 w-1/2 rounded bg-secondary/70" />
              <div className="h-4 w-3/4 rounded bg-secondary/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
