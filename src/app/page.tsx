import Link from "next/link";
import { fr } from "@/lib/i18n/fr";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  CoinsIcon,
  PalmIcon,
  ShieldIcon,
} from "@/components/icons";

export default function HomePage() {
  return (
    <div>
      {/* Hero — le message de marque est l'identité de Darna */}
      <section className="relative overflow-hidden bg-darna text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-darna-light/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sand/20 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            {fr.brand.heroTitle}
            <br />
            <span className="text-sand">{fr.brand.heroLine2}</span>
            <br />
            {fr.brand.heroLine3}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/80">{fr.brand.heroSub}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sejours"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sand px-7 py-3.5 text-base font-semibold text-darna-dark transition hover:bg-sand-light"
            >
              <PalmIcon />
              {fr.brand.ctaSejours}
            </Link>
            <Link
              href="/immobilier"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white hover:text-darna"
            >
              <BuildingIcon />
              {fr.brand.ctaImmobilier}
            </Link>
          </div>
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
    </div>
  );
}
