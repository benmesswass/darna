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

/** Ligne « réservation » (photo + texte + montant) — revenus, réservations… */
function RowSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center">
      <Skeleton className="h-20 w-full shrink-0 rounded-2xl sm:w-28" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-20 shrink-0" />
    </div>
  );
}

/** `/dashboard/revenus` : titre + 3 cartes récap + liste de réservations. */
export function RevenusSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-56" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-3xl" />
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** `/dashboard/messagerie` : titre + liste de conversations (avatar + texte). */
export function MessagerieSkeleton() {
  return (
    <div>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <div className="mt-6 space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 ring-1 ring-darna/10"
          >
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
