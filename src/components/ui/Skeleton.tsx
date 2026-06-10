/** Blocs de chargement — CSS pur, sans librairie. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-darna/10 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-darna/5">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-5 h-24 w-full rounded-3xl" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <Skeleton className="hidden h-[70vh] rounded-3xl lg:block" />
      </div>
    </div>
  );
}
