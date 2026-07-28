import type { Metadata } from "next";
import Link from "next/link";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { EUR_TO_TND } from "@/lib/config";
import { getFeaturedListings } from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { DiasporaCurrencyCta } from "@/components/diaspora/DiasporaCurrencyCta";
import {
  ArrowRightIcon,
  CheckIcon,
  GlobeIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: frMeta.diaspora.titre,
  description: frMeta.diaspora.sousTitre,
};

export default async function DiasporaPage() {
  const fr = await getT();
  const featured = await getFeaturedListings(3);
  const favCtx = await getFavoriteContext((await getSessionUser())?.id);
  const taux = EUR_TO_TND.toLocaleString("fr-FR");

  return (
    <div>
      {/* Hero diaspora */}
      <section className="bg-darna text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sand">
            <GlobeIcon width={16} height={16} />
            {fr.nav.diaspora}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            {fr.diaspora.titre}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            {fr.diaspora.sousTitre}
          </p>
        </div>
      </section>

      {/* Proposition de valeur */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: CheckIcon, title: fr.diaspora.arg1Titre, desc: fr.diaspora.arg1Desc },
            { icon: ShieldIcon, title: fr.diaspora.arg2Titre, desc: fr.diaspora.arg2Desc },
            { icon: SparklesIcon, title: fr.diaspora.arg3Titre, desc: fr.diaspora.arg3Desc },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-surface p-7 ring-1 ring-darna/10">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-darna text-sand">
                <Icon width={24} height={24} />
              </span>
              <h2 className="mt-4 text-lg font-bold text-heading">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-body/70">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Toggle TND / EUR */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-darna to-darna-light p-8 text-white sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">{fr.diaspora.toggleTitre}</h2>
              <p className="mt-2 max-w-xl text-sm text-white/80">
                {fr.diaspora.toggleDesc(taux)}
              </p>
            </div>
            <DiasporaCurrencyCta />
          </div>
        </div>
      </section>

      {/* Séjours vérifiés mis en avant */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-heading">{fr.diaspora.ctaTitre}</h2>
              <p className="mt-1 text-sm text-muted">{fr.diaspora.ctaDesc}</p>
            </div>
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
    </div>
  );
}
