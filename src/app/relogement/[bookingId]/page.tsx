import { redirect, notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getRebookingSuggestions } from "@/lib/listings";
import { signRebookingDiscount } from "@/lib/rebooking-discount";
import { REBOOKING_DISCOUNT_CAP_TND, REBOOKING_DISCOUNT_RATE, REBOOKING_DISCOUNT_VALIDITY_DAYS } from "@/lib/config";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { AnimatedGrid } from "@/components/ui/AnimatedGrid";
import { HeartIcon, ChevronLeftIcon } from "@/components/icons";
import Link from "next/link";

/**
 * Liste de relogement après une annulation À L'INITIATIVE DE L'HÔTE
 * (ANNULATION_HOTE_ROADMAP.md §AH6) : jusqu'à 10 alternatives (§AH3),
 * calculées à la consultation (pas figées à l'instant de l'annulation), avec
 * un token de réduction ponctuelle (§AH4) généré ici et propagé sur chaque
 * carte — n'importe laquelle des suggestions en bénéficie, pas seulement
 * « la meilleure ». Accès restreint au voyageur concerné par CETTE
 * réservation annulée par l'hôte (IDOR + garde métier).
 */
export default async function RelogementPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      guestId: true,
      propertyId: true,
      guests: true,
      checkIn: true,
      checkOut: true,
      nightlyPrice: true,
      cancelledByHostAt: true,
      property: { select: { title: true, city: true } },
    },
  });
  if (!booking || booking.guestId !== user.id || !booking.cancelledByHostAt) notFound();

  const [suggestions, fr, favCtx] = await Promise.all([
    getRebookingSuggestions({
      propertyId: booking.propertyId,
      city: booking.property.city,
      guests: booking.guests,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nightlyPrice: booking.nightlyPrice,
    }),
    getT(),
    getFavoriteContext(user.id),
  ]);

  const promo = signRebookingDiscount(bookingId, user.id);
  const query = `?promo=${encodeURIComponent(promo)}`;

  const percent = Math.round(REBOOKING_DISCOUNT_RATE * 100);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-heading">{fr.relogement.titre}</h1>

      <div className="mt-3 flex max-w-2xl items-start gap-3.5 rounded-2xl bg-surface p-4 ring-1 ring-darna/10">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand/20">
          <HeartIcon width={18} height={18} className="text-sand" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-heading">{fr.relogement.headline}</p>
          <p className="mt-0.5 text-sm text-body/70">{fr.relogement.resume}</p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              {fr.relogement.reductionChip(percent, REBOOKING_DISCOUNT_CAP_TND)}
            </span>
          </div>
          <details className="group mt-2">
            <summary className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-heading">
              <ChevronLeftIcon
                width={11}
                height={11}
                strokeWidth={2.5}
                className="rotate-180 transition group-open:-rotate-90"
              />
              {fr.relogement.enSavoirPlus}
            </summary>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-body/70">
              {fr.relogement.detailParagraphe(REBOOKING_DISCOUNT_VALIDITY_DAYS)}
            </p>
          </details>
        </div>
      </div>

      <p className="mt-5 max-w-2xl text-body/70">{fr.relogement.intro(booking.property.title)}</p>

      {suggestions.length > 0 ? (
        <AnimatedGrid className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {suggestions.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              favorite={favoritePropFor(favCtx, p.id)}
              query={query}
            />
          ))}
        </AnimatedGrid>
      ) : (
        <div className="mt-6 rounded-2xl bg-surface p-6 text-sm text-muted ring-1 ring-darna/10">
          <p>{fr.relogement.aucuneSuggestion}</p>
          <Link
            href="/sejours"
            className="mt-3 inline-block rounded-2xl bg-sand px-5 py-2.5 text-sm font-bold text-darna-dark transition hover:bg-sand-light"
          >
            {fr.relogement.voirTousLesSejours}
          </Link>
        </div>
      )}
    </div>
  );
}
