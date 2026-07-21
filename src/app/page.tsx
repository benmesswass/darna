import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import {
  activeListingWhere,
  getAlaUneListings,
  getFeaturedListings,
  getRecentVerifications,
} from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { immoEnabled, stayEnabled } from "@/lib/modes";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { GOUVERNORATS } from "@/lib/geo";
import { VERIFIED_LISTINGS_TARGET } from "@/lib/constants";
import { formatDateFr } from "@/lib/format";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HomeHero } from "@/components/layout/HomeHero";
import { ScrollRevealGrid } from "@/components/ui/ScrollRevealGrid";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  CoinsIcon,
  GlobeIcon,
  PalmIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/icons";

const POPULAR_CITIES = ["Hammamet", "Djerba", "Sousse", "La Marsa", "Tozeur"];

export default async function HomePage() {
  const fr = await getT();
  const [alaUne, featured, verifiedCount, activeCities, reviewCount, recentVerifications] =
    await Promise.all([
      getAlaUneListings(4),
      getFeaturedListings(6),
      prisma.property.count({ where: { ...activeListingWhere(), verified: true } }),
      prisma.property.groupBy({ by: ["city"], where: activeListingWhere() }),
      prisma.review.count(),
      getRecentVerifications(5),
    ]);
  const favCtx = await getFavoriteContext((await getSessionUser())?.id);
  return (
    <div>
      {/* Hero « double mode » — Séjours et Immobilier à égalité, recherche qui
          se métamorphose + identité couleur par verticale (cf. HomeHero). */}
      <HomeHero
        stayEnabled={stayEnabled()}
        immoEnabled={immoEnabled()}
        gouvernorats={GOUVERNORATS}
        popularCities={POPULAR_CITIES}
        stats={{
          verified: verifiedCount,
          cities: activeCities.length,
          reviews: reviewCount,
        }}
      />

      {/* Mur de la confiance en direct (G10) — progression vers l'objectif
          north-star + dernières vérifications (ville + date, zéro donnée
          personnelle). Masqué s'il n'y a encore aucune vérification. */}
      {recentVerifications.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
          <div className="rounded-3xl bg-cream p-6 ring-1 ring-darna/5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-heading sm:text-2xl">
                {fr.home.liveTrustTitle}
              </h2>
              <Link
                href="/sejours"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:text-darna-light"
              >
                {fr.home.liveTrustCta}
                <ArrowRightIcon width={15} height={15} />
              </Link>
            </div>
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-darna/10">
                <div
                  className="h-full rounded-full bg-darna"
                  style={{
                    width: `${Math.min(100, Math.round((verifiedCount / VERIFIED_LISTINGS_TARGET) * 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-body/70">
                {fr.home.liveTrustProgress(verifiedCount, VERIFIED_LISTINGS_TARGET)}
              </p>
            </div>
            <ScrollRevealGrid className="mt-5 flex flex-wrap gap-2">
              {recentVerifications
                .filter((p) => p.verifiedAt !== null)
                .map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-surface px-3.5 py-1.5 text-sm text-body ring-1 ring-darna/10"
                  >
                    {fr.home.liveTrustItem(p.city, formatDateFr(p.verifiedAt as Date))}
                  </span>
                ))}
            </ScrollRevealGrid>
          </div>
        </section>
      ) : null}

      {/* La différence entre les deux verticales — clarifie le produit */}
      <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-heading sm:text-3xl">
          {fr.home.diffTitle}
        </h2>
        <div className="mx-auto mt-6 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sand/20 text-heading">
                <PalmIcon width={22} height={22} />
              </span>
              <h3 className="text-lg font-bold text-heading">{fr.nav.sejours}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-body/70">
              {fr.home.diffSejours}
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-darna/10 text-heading">
                <BuildingIcon width={22} height={22} />
              </span>
              <h3 className="text-lg font-bold text-heading">{fr.nav.immobilier}</h3>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-body/70">
              {fr.home.diffImmo}
            </p>
          </div>
        </div>
      </section>

      {/* À la une — annonces mises en avant par les hôtes (placement payant) */}
      {alaUne.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-darna-dark">
              <SparklesIcon width={18} height={18} />
            </span>
            <div>
              <h2 className="text-3xl font-bold text-heading">{fr.home.alaUneTitle}</h2>
              <p className="text-sm text-body/60">{fr.home.alaUneSub}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {alaUne.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                showType
                favorite={favoritePropFor(favCtx, p.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Annonces vérifiées récentes */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-heading">{fr.home.featuredTitle}</h2>
            <Link
              href="/sejours"
              className="hidden items-center gap-1.5 text-sm font-semibold text-heading hover:text-darna-light sm:flex"
            >
              {fr.home.featuredAll}
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                showType
                favorite={favoritePropFor(favCtx, p.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* La confiance est le produit */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-heading">
            {fr.home.trustTitle}
          </h2>
          <ScrollRevealGrid className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: CheckIcon, title: fr.home.trust1Title, desc: fr.home.trust1Desc },
              { icon: CoinsIcon, title: fr.home.trust2Title, desc: fr.home.trust2Desc },
              { icon: ShieldIcon, title: fr.home.trust3Title, desc: fr.home.trust3Desc },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl bg-cream p-7 ring-1 ring-darna/5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-darna text-sand">
                  <Icon width={24} height={24} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-heading">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-body/70">{desc}</p>
              </div>
            ))}
          </ScrollRevealGrid>
        </div>
      </section>

      {/* Indice des prix, diaspora, wakil */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ScrollRevealGrid className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: SparklesIcon,
              title: fr.home.statsTitle,
              desc: fr.home.statsDesc,
              cta: fr.home.statsCta,
              href: "/prix-du-marche",
            },
            {
              icon: GlobeIcon,
              title: fr.home.diasporaTitle,
              desc: fr.home.diasporaDesc,
              cta: fr.home.diasporaCta,
              href: "/diaspora",
            },
            {
              icon: ShieldIcon,
              title: fr.home.wakilTitle,
              desc: fr.home.wakilDesc,
              cta: fr.home.wakilCta,
              href: "/devenir-wakil",
            },
          ].map(({ icon: Icon, title, desc, cta, href }) => (
            <Link
              key={href}
              href={href}
              className="group flex h-full flex-col rounded-3xl bg-surface p-7 shadow-sm ring-1 ring-darna/10 transition hover:shadow-lg"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-darna text-sand">
                <Icon width={24} height={24} />
              </span>
              <h3 className="mt-4 text-lg font-bold text-heading">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-body/70">{desc}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-heading">
                {cta}
                <ArrowRightIcon
                  width={15}
                  height={15}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </ScrollRevealGrid>
      </section>
    </div>
  );
}
