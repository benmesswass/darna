import type { Metadata } from "next";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getTravelerProfile } from "@/lib/traveler-profile";
import { getSessionUser } from "@/lib/session";
import { CheckIcon, StarIcon } from "@/components/icons";
import { AnimatedGrid } from "@/components/ui/AnimatedGrid";
import { formatDateFr, formatDateShortFr } from "@/lib/format";
import { GuestReviewForm } from "@/components/booking/GuestReviewForm";

/** Initiales (1 à 2 lettres) dérivées du nom, pour l'avatar par défaut. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const viewer = await getSessionUser();
  const traveler = viewer ? await getTravelerProfile(id, viewer.id) : null;
  return {
    title: traveler ? frMeta.traveler.titre(traveler.name) : undefined,
    robots: { index: false, follow: false },
  };
}

/**
 * Fiche voyageur, accessible uniquement à un hôte ayant reçu ce voyageur
 * (réservation CONFIRMEE/TERMINEE) — cf. getTravelerProfile pour le gating
 * serveur. Contrairement à /hote/[id], jamais indexée ni publique au sens
 * marketing : un voyageur reste un particulier.
 */
export default async function TravelerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const viewer = await getSessionUser();
  if (!viewer) redirect("/connexion");

  const traveler = await getTravelerProfile(id, viewer.id);
  if (!traveler) notFound();

  const fr = await getT();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <AnimatedGrid className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10 sm:p-8">
        <div key="header" className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-sand ring-4 ring-cream">
            {traveler.image ? (
              <Image
                src={traveler.image}
                alt={traveler.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-darna-dark">
                {initials(traveler.name)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
              {fr.traveler.sousTitre}
            </p>
            <h1 className="text-2xl font-bold text-heading">{traveler.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {fr.traveler.membreDepuis(traveler.createdAt.getFullYear())}
            </p>
          </div>
        </div>

        <div key="badges" className="mt-5 flex flex-wrap items-center gap-3">
          {traveler.kycStatus === "VERIFIE" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-darna/5 px-2.5 py-1 text-xs font-medium text-heading">
              <CheckIcon width={12} height={12} strokeWidth={3} />
              {fr.kyc.statutVerifie}
            </span>
          ) : traveler.kycStatus === "DEMO_VERIFIE" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-muted">
              <CheckIcon width={12} height={12} strokeWidth={3} />
              {fr.kyc.statutVerifieDemo}
            </span>
          ) : null}

          {traveler.ratingAvg ? (
            <span className="inline-flex items-center gap-1 text-sm text-body/70">
              <StarIcon width={15} height={15} fill="currentColor" className="text-sand" />
              {traveler.ratingAvg.toFixed(1)} · {fr.traveler.avisRecus(traveler.ratingCount)}
            </span>
          ) : (
            <span className="text-sm text-muted">{fr.search.sansAvis}</span>
          )}
        </div>
      </AnimatedGrid>

      {traveler.reviewableBookings.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-heading">{fr.traveler.donnerAvis}</h2>
          <div className="mt-4 space-y-3">
            {traveler.reviewableBookings.map((b) => (
              <div key={b.id}>
                <p className="text-xs font-semibold text-muted">
                  {b.propertyTitle} ·{" "}
                  {fr.booking.sejourDates(
                    formatDateShortFr(new Date(b.checkIn)),
                    formatDateShortFr(new Date(b.checkOut))
                  )}
                </p>
                <GuestReviewForm bookingId={b.id} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <h2 className="mt-8 text-lg font-semibold text-heading">{fr.traveler.avisTitre}</h2>

      {traveler.reviews.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {traveler.reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl bg-surface p-4 text-sm ring-1 ring-darna/10"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-0.5 text-sand">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <StarIcon
                      key={n}
                      width={14}
                      height={14}
                      fill={n <= r.rating ? "currentColor" : "none"}
                      className={n <= r.rating ? "" : "text-subtle"}
                    />
                  ))}
                </span>
                <span className="text-xs text-muted">{formatDateFr(new Date(r.createdAt))}</span>
              </div>
              <p className="mt-2 text-body/70">{r.comment}</p>
              <p className="mt-2 text-xs font-semibold text-muted">{r.authorName}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface p-6 text-sm text-muted ring-1 ring-darna/10">
          {fr.traveler.aucunAvis}
        </p>
      )}
    </div>
  );
}
