import { prisma } from "@/lib/prisma";

/**
 * Analytics « founder » — tableau de bord d'adoption de la plateforme réservé à
 * l'ADMIN (Wassim). Calcul à la volée via agrégations Prisma : zéro SQL brut,
 * zéro service externe, zéro table de stats. Suffisant tant que les volumes
 * restent modestes ; si la base grossit, basculer vers un snapshot quotidien
 * pré-agrégé (cf. décision produit).
 *
 * Server-only : importé uniquement par la page serveur admin. Ne JAMAIS
 * exposer en RPC client.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Statuts de réservation considérés comme « payés » (séquestre engagé). */
const PAID_BOOKING_STATUSES = ["CONFIRMEE", "TERMINEE"] as const;
/** Rôles annonceurs (publient des annonces). */
const LISTER_ROLES = ["HOTE", "AGENCE"] as const;
/** kycStatus considérés comme vérifiés (réel ou démo). */
const KYC_OK = ["VERIFIE", "DEMO_VERIFIE"] as const;

/** Clé jour locale `YYYY-MM-DD` (fuseau serveur). */
function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
/** Clé mois `YYYY-MM`. */
function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}
/** Taux borné [0,1], 0 si dénominateur nul. */
function ratio(num: number, den: number): number {
  return den > 0 ? num / den : 0;
}

export type TimePoint = { date: string; count: number };
export type Segment = { label: string; count: number };
export type CohortRow = {
  month: string;
  signups: number;
  activated: number;
  activationRate: number;
};

export type FounderAnalytics = {
  generatedAt: Date;
  northStar: {
    /** North-star produit : annonces vérifiées ET actives. */
    verifiedActiveListings: number;
    activeListings: number;
    verificationRate: number;
    /** GMV TND : somme des réservations payées (démo incluse). */
    gmvTnd: number;
    /** GMV réelle TND : hors paiements simulés (démo). */
    realGmvTnd: number;
    confirmedBookings: number;
    totalUsers: number;
  };
  acquisition: {
    signupsByDay: TimePoint[];
    signupsLast7: number;
    signupsLast30: number;
    byRole: Segment[];
    emailVerifiedRate: number;
    kycVerifiedRate: number;
    listersWithListingRate: number;
  };
  bookingFunnel: {
    created: number;
    initiated: number;
    confirmed: number;
    cancelled: number;
    expired: number;
    pending: number;
    conversionRate: number;
    abandonRate: number;
  };
  retention: {
    travelersWhoBooked: number;
    activeTravelers30: number;
    atRisk: number;
    churned: number;
    cohorts: CohortRow[];
  };
  wakil: {
    applicationsByStatus: Segment[];
    onSiteVerifications: number;
    topWakils: Segment[];
  };
  recentEvents: {
    id: string;
    action: string;
    userName: string | null;
    success: boolean;
    createdAt: Date;
  }[];
};

export async function getFounderAnalytics(): Promise<FounderAnalytics> {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const since90 = new Date(now.getTime() - 90 * DAY_MS);

  const [
    verifiedActiveListings,
    activeListings,
    totalUsers,
    gmvAgg,
    realGmvAgg,
    confirmedBookings,
    recentSignups,
    roleGroups,
    emailVerifiedCount,
    listersCount,
    listersKycOkCount,
    distinctOwners,
    bookingStatusGroups,
    initiatedBookings,
    expiredBookings,
    pendingBookings,
    travelerLastBooking,
    allUsersLight,
    wakilStatusGroups,
    onSiteVerifications,
    topWakilGroups,
    recentEventsRaw,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "ACTIVE", verified: true } }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: [...PAID_BOOKING_STATUSES] } },
    }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: { status: { in: [...PAID_BOOKING_STATUSES] }, demo: false },
    }),
    prisma.booking.count({ where: { status: { in: [...PAID_BOOKING_STATUSES] } } }),
    // Inscriptions des 30 derniers jours (bucketées en JS — pas de SQL brut).
    prisma.user.findMany({
      where: { createdAt: { gte: since30 } },
      select: { createdAt: true },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { role: { in: [...LISTER_ROLES] } } }),
    prisma.user.count({
      where: { role: { in: [...LISTER_ROLES] }, kycStatus: { in: [...KYC_OK] } },
    }),
    prisma.property.findMany({ select: { ownerId: true }, distinct: ["ownerId"] }),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.booking.count({ where: { paymentRef: { not: null } } }),
    prisma.booking.count({
      where: { status: "EN_ATTENTE", expiresAt: { lte: now } },
    }),
    prisma.booking.count({
      where: { status: "EN_ATTENTE", expiresAt: { gt: now } },
    }),
    // Dernière réservation par voyageur → segmentation rétention/churn.
    prisma.booking.groupBy({ by: ["guestId"], _max: { createdAt: true } }),
    // Cohortes : tous les comptes (mois d'inscription) + activation.
    prisma.user.findMany({ select: { id: true, createdAt: true } }),
    prisma.wakilApplication.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.property.count({ where: { verificationLevel: "ON_SITE" } }),
    prisma.property.groupBy({
      by: ["verifiedById"],
      where: { verificationLevel: "ON_SITE", verifiedById: { not: null } },
      _count: { _all: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        success: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  // ── Acquisition : série temporelle des inscriptions (30 jours glissants) ──
  const dayCounts = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    dayCounts.set(dayKey(new Date(now.getTime() - i * DAY_MS)), 0);
  }
  for (const u of recentSignups) {
    const k = dayKey(u.createdAt);
    if (dayCounts.has(k)) dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  const signupsByDay: TimePoint[] = [...dayCounts].map(([date, count]) => ({
    date,
    count,
  }));
  const signupsLast30 = recentSignups.length;
  const signupsLast7 = recentSignups.filter((u) => u.createdAt >= since7).length;

  const byRole: Segment[] = roleGroups
    .map((g) => ({ label: g.role, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  // ── Funnel de réservation (source de vérité = table Booking) ──
  const statusCount = (s: string) =>
    bookingStatusGroups.find((g) => g.status === s)?._count._all ?? 0;
  const created = bookingStatusGroups.reduce((sum, g) => sum + g._count._all, 0);
  const confirmed = statusCount("CONFIRMEE") + statusCount("TERMINEE");
  const cancelled = statusCount("ANNULEE");

  // ── Rétention / churn voyageurs ──
  const activatedGuestIds = new Set(travelerLastBooking.map((b) => b.guestId));
  let activeTravelers30 = 0;
  let atRisk = 0;
  let churned = 0;
  for (const b of travelerLastBooking) {
    const last = b._max.createdAt;
    if (!last) continue;
    if (last >= since30) activeTravelers30++;
    else if (last >= since90) atRisk++;
    else churned++;
  }

  // ── Cohortes d'activation par mois d'inscription ──
  const cohortMap = new Map<string, { signups: number; activated: number }>();
  for (const u of allUsersLight) {
    const m = monthKey(u.createdAt);
    const row = cohortMap.get(m) ?? { signups: 0, activated: 0 };
    row.signups++;
    if (activatedGuestIds.has(u.id)) row.activated++;
    cohortMap.set(m, row);
  }
  const cohorts: CohortRow[] = [...cohortMap]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, { signups, activated }]) => ({
      month,
      signups,
      activated,
      activationRate: ratio(activated, signups),
    }));

  // ── Réseau Wakil ──
  const wakilIds = topWakilGroups
    .map((g) => g.verifiedById)
    .filter((id): id is string => id !== null);
  const wakilNames = wakilIds.length
    ? await prisma.user.findMany({
        where: { id: { in: wakilIds } },
        select: { id: true, name: true },
      })
    : [];
  const nameById = new Map(wakilNames.map((w) => [w.id, w.name]));
  const topWakils: Segment[] = topWakilGroups
    .map((g) => ({
      label: nameById.get(g.verifiedById as string) ?? "—",
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    generatedAt: now,
    northStar: {
      verifiedActiveListings,
      activeListings,
      verificationRate: ratio(verifiedActiveListings, activeListings),
      gmvTnd: gmvAgg._sum.totalPrice ?? 0,
      realGmvTnd: realGmvAgg._sum.totalPrice ?? 0,
      confirmedBookings,
      totalUsers,
    },
    acquisition: {
      signupsByDay,
      signupsLast7,
      signupsLast30,
      byRole,
      emailVerifiedRate: ratio(emailVerifiedCount, totalUsers),
      kycVerifiedRate: ratio(listersKycOkCount, listersCount),
      listersWithListingRate: ratio(distinctOwners.length, listersCount),
    },
    bookingFunnel: {
      created,
      initiated: initiatedBookings,
      confirmed,
      cancelled,
      expired: expiredBookings,
      pending: pendingBookings,
      conversionRate: ratio(confirmed, created),
      abandonRate: ratio(cancelled + expiredBookings, created),
    },
    retention: {
      travelersWhoBooked: activatedGuestIds.size,
      activeTravelers30,
      atRisk,
      churned,
      cohorts,
    },
    wakil: {
      applicationsByStatus: wakilStatusGroups
        .map((g) => ({ label: g.status, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      onSiteVerifications,
      topWakils,
    },
    recentEvents: recentEventsRaw.map((e) => ({
      id: e.id,
      action: e.action,
      userName: e.user?.name ?? null,
      success: e.success,
      createdAt: e.createdAt,
    })),
  };
}
