import type { SessionUser } from "@/lib/session";
import type { Dictionary } from "@/lib/i18n";
import type { NavItem } from "@/components/dashboard/DashboardNav";

/**
 * Liste ordonnée des pages de l'espace personnel, selon le rôle — source UNIQUE
 * partagée par la barre latérale du dashboard et le menu « Mon espace » du
 * header. Sans badges (les compteurs sont injectés par la page dashboard qui a
 * les requêtes). Ordre métier : annonces → demandes → mes voyageurs → revenus…
 */
export function buildDashboardLinks(user: SessionUser, fr: Dictionary): NavItem[] {
  const isLister = user.role === "HOTE" || user.role === "AGENCE";
  const isAdmin = user.role === "ADMIN";
  const isAdminOrWakil = isAdmin || user.isWakil;

  const links: NavItem[] = [];

  if (isLister) {
    links.push(
      { href: "/dashboard/annonces", label: fr.dashboard.mesAnnonces, icon: "BuildingIcon" },
      { href: "/dashboard/demandes", label: fr.dashboard.demandesRecues, icon: "UsersIcon" },
      { href: "/dashboard/reservations", label: fr.dashboard.mesVoyageurs, icon: "CalendarIcon" },
      { href: "/dashboard/revenus", label: fr.dashboard.revenus, icon: "CoinsIcon" },
      { href: "/dashboard/factures", label: fr.factures.listeTitre, icon: "ShieldIcon" },
      { href: "/dashboard/yield", label: fr.dashboard.yieldAdvisor, icon: "SparklesIcon" }
    );
    // Abonnement (MONETISATION_IMMO_ROADMAP.md §MI2) : ne concerne que les
    // comptes agence, le mécanisme ne cible pas les hôtes individuels.
    if (user.role === "AGENCE") {
      links.push({ href: "/dashboard/abonnement", label: fr.abonnement.titre, icon: "CoinsIcon" });
    }
  } else {
    links.push({
      href: "/dashboard/reservations",
      label: fr.dashboard.mesReservations,
      icon: "CalendarIcon",
    });
  }

  links.push(
    { href: "/dashboard/messagerie", label: fr.messages.lien, icon: "MailIcon" },
    // Universel (voyageur ET hôte, cf. §CR2 parrainage hôte) — pas de gating par rôle.
    { href: "/dashboard/credits", label: fr.dashboard.mesCredits, icon: "CoinsIcon" },
    { href: "/dashboard/favoris", label: fr.dashboard.favoris, icon: "HeartIcon" },
    { href: "/dashboard/alertes", label: fr.dashboard.mesAlertes, icon: "BellIcon" },
    { href: "/dashboard/profil", label: fr.dashboard.monProfil, icon: "UserIcon" },
    { href: "/dashboard/verifications", label: fr.verifications.navLabel, icon: "ShieldIcon" }
  );

  if (isAdmin) {
    links.push({
      href: "/dashboard/admin/analytics",
      label: fr.admin.navAnalytics,
      icon: "ChartIcon",
    });
  }
  if (isAdminOrWakil) {
    links.push({
      href: "/dashboard/admin/annonces",
      label: fr.admin.navAnnonces,
      icon: "StarIcon",
    });
  }
  if (isAdmin) {
    links.push(
      { href: "/dashboard/admin/wakils", label: fr.admin.navWakils, icon: "UsersIcon" },
      { href: "/dashboard/admin/signalements", label: fr.admin.navSignalements, icon: "ShieldIcon" },
      { href: "/dashboard/admin/factures", label: fr.admin.navFactures, icon: "CoinsIcon" },
      {
        href: "/dashboard/admin/remboursements",
        label: fr.admin.navRemboursements,
        icon: "CoinsIcon",
      },
      {
        href: "/dashboard/admin/non-conformite",
        label: fr.admin.navNonConformite,
        icon: "ShieldIcon",
      },
      { href: "/dashboard/admin/financement", label: fr.admin.navFinancement, icon: "BuildingIcon" }
    );
  }

  return links;
}
