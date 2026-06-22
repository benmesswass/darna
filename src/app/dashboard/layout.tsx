import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/actions/auth";
import {
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  HeartIcon,
  ShieldIcon,
  SparklesIcon,
  UserIcon,
  UsersIcon,
  StarIcon,
} from "@/components/icons";

/** Initiales (1 à 2 lettres) pour l'avatar par défaut de l'en-tête. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const isLister = user.role === "HOTE" || user.role === "AGENCE";
  const isAdminOrWakil = user.role === "ADMIN" || user.isWakil;

  // Fetch pending counts for admin/wakil nav badges (skip for regular users)
  let pendingAnnonces = 0;
  let pendingWakils = 0;
  if (isAdminOrWakil) {
    [pendingAnnonces, pendingWakils] = await Promise.all([
      prisma.property.count({ where: { status: "ACTIVE", verified: false } }),
      user.role === "ADMIN"
        ? prisma.wakilApplication.count({ where: { status: "RECUE", deletedAt: null } })
        : Promise.resolve(0),
    ]);
  }

  const links: { href: string; label: string; icon: React.FC<{ width: number; height: number }>; badge?: number }[] = [
    ...(isLister
      ? [
          { href: "/dashboard/annonces", label: fr.dashboard.mesAnnonces, icon: BuildingIcon },
          { href: "/dashboard/demandes", label: fr.dashboard.demandesRecues, icon: UsersIcon },
          { href: "/dashboard/yield", label: fr.dashboard.yieldAdvisor, icon: SparklesIcon },
        ]
      : []),
    {
      href: "/dashboard/reservations",
      label: isLister ? fr.dashboard.mesVoyageurs : fr.dashboard.mesReservations,
      icon: CalendarIcon,
    },
    { href: "/dashboard/favoris", label: fr.dashboard.favoris, icon: HeartIcon },
    { href: "/dashboard/profil", label: fr.dashboard.monProfil, icon: UserIcon },
    { href: "/dashboard/kyc", label: fr.dashboard.kyc, icon: ShieldIcon },
    ...(isAdminOrWakil
      ? [
          {
            href: "/dashboard/admin/annonces",
            label: fr.admin.navAnnonces,
            icon: StarIcon,
            badge: pendingAnnonces > 0 ? pendingAnnonces : undefined,
          },
          ...(user.role === "ADMIN"
            ? [
                {
                  href: "/dashboard/admin/wakils",
                  label: fr.admin.navWakils,
                  icon: UsersIcon,
                  badge: pendingWakils > 0 ? pendingWakils : undefined,
                },
              ]
            : []),
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <Link
            href="/dashboard/profil"
            aria-label={fr.dashboard.monProfil}
            className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-sand ring-2 ring-white shadow-sm transition hover:ring-darna/20"
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg font-bold text-darna-dark">
                {initials(user.name)}
              </span>
            )}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-darna">
              {fr.dashboard.bonjour(user.name)}
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-sm text-ink/60">
              {user.email}
              {user.kycStatus === "VERIFIE" || user.kycStatus === "DEMO_VERIFIE" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[11px] font-semibold text-darna-dark">
                  <CheckIcon width={11} height={11} strokeWidth={3} />
                  {user.kycStatus === "DEMO_VERIFIE"
                    ? fr.kyc.statutVerifieDemo
                    : fr.kyc.statutVerifie}
                </span>
              ) : null}
            </p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-darna/20 px-4 py-2 text-sm font-semibold text-darna transition hover:bg-darna hover:text-white"
          >
            {fr.nav.deconnexion}
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="flex gap-1.5 overflow-x-auto lg:flex-col">
          {links.map(({ href, label, icon: Icon, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-white hover:text-darna hover:shadow-sm"
            >
              <Icon width={17} height={17} />
              {label}
              {badge ? (
                <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-darna px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </Link>
          ))}
          {isLister ? (
            <Link
              href="/dashboard/annonces/nouvelle"
              className="mt-2 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-sand px-3.5 py-2.5 text-sm font-bold text-darna-dark transition hover:bg-sand-light"
            >
              {fr.dashboard.nouvelleAnnonce}
            </Link>
          ) : null}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
