import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { immoEnabled, stayEnabled } from "@/lib/modes";
import { HouseIcon } from "@/components/icons";
import { MobileMenu } from "./MobileMenu";
import { NavLink } from "./NavLink";
import { PrimaryNav } from "./PrimaryNav";
import { AccountMenu } from "./AccountMenu";
import { buildDashboardLinks } from "@/lib/dashboard-nav";
import { countUnreadMessages } from "@/lib/messages";
import { MessagesNotifier } from "@/components/messages/MessagesNotifier";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

/** Initiales (1 à 2 lettres) pour l'avatar du menu « Mon espace ». */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function Header() {
  const [user, fr] = await Promise.all([getSessionUser(), getT()]);

  // Pages de l'espace personnel (menu « Mon espace » du header). On injecte la
  // pastille des messages non lus sur le lien « Messagerie ».
  const unreadMessages = user ? await countUnreadMessages(user.id) : 0;
  const navLinks = user
    ? buildDashboardLinks(user, fr).map((l) =>
        l.href === "/dashboard/messagerie" && unreadMessages > 0
          ? { ...l, badge: unreadMessages }
          : l
      )
    : [];

  // Navigation des verticales : seules les verticales activées sont proposées
  // (cf. src/lib/modes.ts). En démo, les deux sont actives → nav inchangée.
  const primaryItems = [
    stayEnabled() ? { href: "/sejours", label: fr.nav.sejours } : null,
    immoEnabled() ? { href: "/immobilier", label: fr.nav.immobilier } : null,
  ].filter((item): item is { href: string; label: string } => item !== null);

  const mobileItems = [
    ...primaryItems,
    { href: "/prix-du-marche", label: fr.nav.prixDuMarche },
    { href: "/diaspora", label: fr.nav.diaspora },
    { href: "/devenir-wakil", label: fr.nav.devenirWakil },
    user
      ? { href: "/dashboard", label: fr.nav.dashboard }
      : { href: "/connexion", label: fr.nav.connexion },
  ];

  return (
    <header className="accent-transition no-print sticky top-0 z-[1100] border-b-2 border-[var(--color-accent)] bg-darna text-white shadow-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2" aria-label={fr.meta.siteName}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-darna-dark">
              <HouseIcon width={22} height={22} strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold tracking-tight">{fr.meta.siteName}</span>
          </Link>

          {/* Double navigation : les deux verticales du produit.
              Pastille glissante + accent par section (voir PrimaryNav). */}
          <PrimaryNav items={primaryItems} />
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            <NavLink
              href="/prix-du-marche"
              className="rounded-lg px-3 py-2 text-sm"
              activeClassName="bg-white/10 font-semibold text-white"
              inactiveClassName="text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.prixDuMarche}
            </NavLink>
            <NavLink
              href="/diaspora"
              className="rounded-lg px-3 py-2 text-sm"
              activeClassName="bg-white/10 font-semibold text-white"
              inactiveClassName="text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.diaspora}
            </NavLink>
            <NavLink
              href="/devenir-wakil"
              className="rounded-lg px-3 py-2 text-sm"
              activeClassName="bg-white/10 font-semibold text-white"
              inactiveClassName="text-white/80 hover:bg-white/10 hover:text-white"
            >
              {fr.nav.devenirWakil}
            </NavLink>
          </nav>

          {/* Toujours visible, même sur mobile : besoin de premier niveau
              pour un site trilingue (et cible diaspora mobile-first). */}
          <LanguageSwitcher />

          <CurrencyToggle />

          {user ? (
            <AccountMenu
              name={user.name}
              image={user.image}
              initials={initials(user.name)}
              links={navLinks}
              label={fr.nav.dashboard}
              logoutLabel={fr.nav.deconnexion}
              initialUnread={unreadMessages}
            />
          ) : (
            <Link
              href="/connexion"
              className="accent-transition hidden rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-strong)] md:block"
            >
              {fr.nav.connexion}
            </Link>
          )}

          <MobileMenu
            items={mobileItems}
            loggedIn={Boolean(user)}
            logoutLabel={fr.nav.deconnexion}
          />
        </div>
      </div>

      {/* Notification in-app : sonde le nombre de non-lus et prévient (toast +
          notification navigateur) à l'arrivée d'un nouveau message. */}
      {user ? <MessagesNotifier initialCount={unreadMessages} /> : null}
    </header>
  );
}
