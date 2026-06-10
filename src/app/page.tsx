import Link from "next/link";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { activeListingWhere, getFeaturedListings } from "@/lib/listings";
import { PropertyCard } from "@/components/property/PropertyCard";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  CoinsIcon,
  GlobeIcon,
  PalmIcon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/icons";

const POPULAR_CITIES = ["Hammamet", "Djerba", "Sousse", "La Marsa", "Tozeur"];

export default async function HomePage() {
  const [featured, verifiedCount, activeCities, reviewCount] = await Promise.all([
    getFeaturedListings(6),
    prisma.property.count({ where: { ...activeListingWhere(), verified: true } }),
    prisma.property.groupBy({ by: ["city"], where: activeListingWhere() }),
    prisma.review.count(),
  ]);
  return (
    <div>
      {/* Hero — recherche directe + message de marque + preuves chiffrées */}
      <section className="relative overflow-hidden bg-darna text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-darna-light/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {fr.brand.heroTitle}
            <br />
            <span className="text-sand">{fr.brand.heroLine2}</span>
            <br />
            {fr.brand.heroLine3}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/75">{fr.brand.heroSub}</p>

          {/* Recherche immédiate */}
          <form
            method="GET"
            action="/sejours"
            className="mt-9 flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl shadow-black/20"
          >
            <SearchIcon width={20} height={20} className="shrink-0 text-darna" />
            <input
              type="text"
              name="ville"
              placeholder={fr.search.villePlaceholder}
              className="h-11 w-full min-w-0 bg-transparent text-base text-ink outline-none placeholder:text-ink/40"
            />
            <button
              type="submit"
              className="shrink-0 rounded-full bg-darna px-6 py-3 text-sm font-bold text-white transition hover:bg-darna-light sm:px-8"
            >
              {fr.common.rechercher}
            </button>
          </form>

          {/* Destinations en un clic */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/50">{fr.home.villesPopulaires}</span>
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city}
                href={`/sejours?ville=${encodeURIComponent(city)}`}
                className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1 font-medium text-white/85 transition hover:border-sand hover:bg-sand hover:text-darna-dark"
              >
                {city}
              </Link>
            ))}
          </div>

          {/* Preuves chiffrées, calculées en direct depuis la base */}
          <dl className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-7">
            {[
              { value: verifiedCount, label: fr.home.statsAnnoncesVerifiees },
              { value: activeCities.length, label: fr.home.statsVilles },
              { value: reviewCount, label: fr.home.statsAvis },
            ].map(({ value, label }) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="text-3xl font-bold text-sand sm:text-4xl">{value}</dd>
                <dd className="mt-1 text-xs leading-snug text-white/60 sm:text-sm">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Les deux verticales */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/sejours"
            className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-darna to-darna-light p-8 text-white shadow-lg transition hover:shadow-xl"
          >
            <PalmIcon width={44} height={44} className="text-sand" />
            <h2 className="mt-4 text-2xl font-bold">{fr.home.verticalSejoursTitle}</h2>
            <p className="mt-2 max-w-md text-sm text-white/80">
              {fr.home.verticalSejoursDesc}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sand">
              {fr.brand.ctaSejours}
              <ArrowRightIcon className="transition group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            href="/immobilier"
            className="group relative overflow-hidden rounded-3xl bg-white p-8 shadow-lg ring-1 ring-darna/10 transition hover:shadow-xl"
          >
            <BuildingIcon width={44} height={44} className="text-darna" />
            <h2 className="mt-4 text-2xl font-bold text-darna">
              {fr.home.verticalImmobilierTitle}
            </h2>
            <p className="mt-2 max-w-md text-sm text-ink/70">
              {fr.home.verticalImmobilierDesc}
            </p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-darna">
              {fr.brand.ctaImmobilier}
              <ArrowRightIcon className="transition group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>

      {/* Annonces vérifiées récentes */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl font-bold text-darna">{fr.home.featuredTitle}</h2>
            <Link
              href="/sejours"
              className="hidden items-center gap-1.5 text-sm font-semibold text-darna hover:text-darna-light sm:flex"
            >
              {fr.home.featuredAll}
              <ArrowRightIcon width={16} height={16} />
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PropertyCard key={p.id} property={p} showType />
            ))}
          </div>
        </section>
      ) : null}

      {/* La confiance est le produit */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-darna">
            {fr.home.trustTitle}
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: CheckIcon, title: fr.home.trust1Title, desc: fr.home.trust1Desc },
              { icon: CoinsIcon, title: fr.home.trust2Title, desc: fr.home.trust2Desc },
              { icon: ShieldIcon, title: fr.home.trust3Title, desc: fr.home.trust3Desc },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-3xl bg-cream p-7 ring-1 ring-darna/5">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-darna text-sand">
                  <Icon width={24} height={24} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-darna">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Indice des prix, diaspora, wakil */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
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
              className="group rounded-3xl bg-white p-7 shadow-sm ring-1 ring-darna/10 transition hover:shadow-lg"
            >
              <Icon width={30} height={30} className="text-sand" />
              <h3 className="mt-3 text-lg font-bold text-darna">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{desc}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-darna">
                {cta}
                <ArrowRightIcon
                  width={15}
                  height={15}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
