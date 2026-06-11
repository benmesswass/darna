import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { HouseIcon } from "@/components/icons";
import { MobileMenu } from "./MobileMenu";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export async function Header() {
  const [user, fr] = await Promise.all([getSessionUser(), getT()]);

  const mobileItems = [
    { href: "/sejours", label: fr.nav.sejours },
    { href: "/immobilier", label: fr.nav.immobilier },
    { href: "/prix-du-marche", label: fr.nav.prixDuMarche },
    { href: "/diaspora", label: fr.nav.diaspora },
    { href: "/devenir-wakil", label: fr.nav.devenirWakil },
    user
      ? { href: "/dashboard", label: fr.nav.dashboard }
      : { href: "/connexion", label: fr.nav.connexion },
  ];

  return (
    <header className="no-print sticky top-0 z-[1100] bg-darna text-white shadow-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" aria-label={fr.meta.siteName}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-darna-dark">
              <HouseIcon width={22} height={22} strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">{fr.meta.siteName}</span>
          </Link>

          {/* Double navigation : les deux verticales du produit */}
          <nav className="hidden items-center rounded-full bg-white/10 p-1 md:flex">
            <Link
              href="/sejours"
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white hover:text-darna"
            >
              {fr.nav.sejours}
            </Link>
            <Link
              href="/immobilier"
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white/90 transition hover:bg-white hover:text-darna"
            >
              {fr.nav.immobilier}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            <Link
              href="/prix-du-marche"
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.prixDuMarche}
            </Link>
            <Link
              href="/diaspora"
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.diaspora}
            </Link>
            <Link
              href="/devenir-wakil"
              className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.devenirWakil}
            </Link>
          </nav>

          {/* Toujours visible, même sur mobile : besoin de premier niveau
              pour un site trilingue (et cible diaspora mobile-first). */}
          <LanguageSwitcher />

          <CurrencyToggle />

          {user ? (
            <Link
              href="/dashboard"
              className="hidden rounded-full bg-sand px-4 py-2 text-sm font-semibold text-darna-dark transition hover:bg-sand-light md:block"
            >
              {fr.nav.dashboard}
            </Link>
          ) : (
            <Link
              href="/connexion"
              className="hidden rounded-full bg-sand px-4 py-2 text-sm font-semibold text-darna-dark transition hover:bg-sand-light md:block"
            >
              {fr.nav.connexion}
            </Link>
          )}

          <MobileMenu items={mobileItems} />
        </div>
      </div>
    </header>
  );
}
