import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getHostProfile } from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { CheckIcon, StarIcon } from "@/components/icons";
import { AnimatedGrid } from "@/components/ui/AnimatedGrid";
import { ReviewsList } from "@/components/property/ReviewsList";

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
  const host = await getHostProfile(id);
  if (!host) return {};

  return {
    title: frMeta.host.titre(host.name),
    alternates: { canonical: `/hote/${id}` },
  };
}

/**
 * Fiche hôte publique : annonces actives de l'hôte, ancienneté, note moyenne
 * agrégée sur ses avis. Uniquement pour un HOTE/AGENCE (getHostProfile refuse
 * un VOYAGEUR) — pas de fiche à exposer pour un simple compte voyageur.
 */
export default async function HostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const host = await getHostProfile(id);
  if (!host) notFound();

  const fr = await getT();
  const sessionUser = await getSessionUser();
  const favCtx = await getFavoriteContext(sessionUser?.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <AnimatedGrid className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10 sm:p-8">
        <div key="header" className="flex flex-wrap items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-sand ring-4 ring-cream">
            {host.image ? (
              <Image
                src={host.image}
                alt={host.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-darna-dark">
                {initials(host.name)}
              </span>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-body/40">
              {host.role === "AGENCE" ? fr.property.agence : fr.property.proprietaire}
            </p>
            <h1 className="text-2xl font-bold text-heading">{host.name}</h1>
            <p className="mt-1 text-sm text-body/60">
              {fr.host.membreDepuis(host.createdAt.getFullYear())}
            </p>
          </div>
        </div>

        <div key="badges" className="mt-5 flex flex-wrap items-center gap-3">
          {host.kycStatus === "VERIFIE" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-darna/5 px-2.5 py-1 text-xs font-medium text-heading">
              <CheckIcon width={12} height={12} strokeWidth={3} />
              {fr.kyc.statutVerifie}
            </span>
          ) : host.kycStatus === "DEMO_VERIFIE" ? (
            // Badge DÉMO distinct : jamais une confiance « vérifié réel » pour
            // une vérification de démo (même règle que ListingDetail).
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-body/55">
              <CheckIcon width={12} height={12} strokeWidth={3} />
              {fr.kyc.statutVerifieDemo}
            </span>
          ) : null}

          {host.ratingAvg ? (
            <a
              href="#avis"
              aria-label={fr.property.voirAvis}
              title={fr.property.voirAvis}
              className="inline-flex items-center gap-1 rounded-full text-sm text-body/70 underline-offset-4 transition hover:text-heading hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darna/40"
            >
              <StarIcon width={15} height={15} fill="currentColor" className="text-sand" />
              {host.ratingAvg.toFixed(1)} · {fr.property.nbAvis(host.ratingCount)}
            </a>
          ) : (
            <span className="text-sm text-body/50">{fr.search.sansAvis}</span>
          )}
        </div>
      </AnimatedGrid>

      <h2 className="mt-8 text-lg font-semibold text-heading">
        {fr.host.annoncesActives(host.listings.length)}
      </h2>

      {host.listings.length > 0 ? (
        <AnimatedGrid className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {host.listings.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              showType
              favorite={favoritePropFor(favCtx, p.id)}
            />
          ))}
        </AnimatedGrid>
      ) : (
        <p className="mt-4 rounded-2xl bg-surface p-6 text-sm text-body/60 ring-1 ring-darna/10">
          {fr.host.aucuneAnnonceActive}
        </p>
      )}

      {host.reviews.length > 0 ? (
        <div id="avis" className="mt-8 scroll-mt-24">
          <h2 className="text-lg font-semibold text-heading">{fr.property.avis}</h2>
          <ReviewsList reviews={host.reviews} />
        </div>
      ) : null}
    </div>
  );
}
