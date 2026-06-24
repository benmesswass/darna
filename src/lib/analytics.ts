import { prisma } from "@/lib/prisma";
import { VERTICALS, type Vertical } from "@/lib/constants";

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

/**
 * Fenêtres temporelles proposées par le sélecteur global. `null` = « tout »
 * (cumulatif depuis l'origine). Les métriques de FLUX (inscriptions / jour,
 * funnel de réservation, activité par verticale) s'adaptent à la fenêtre ;
 * les métriques de STOCK (annonces actives, comptes, rétention) restent « à ce
 * jour » par nature.
 */
export const PERIOD_OPTIONS = [7, 30, 90, null] as const;
export type PeriodDays = (typeof PERIOD_OPTIONS)[number];

/** Borne `periodDays` à une valeur valide (défaut 30). `null` = tout. */
export function parsePeriod(raw: string | undefined): PeriodDays {
  if (raw === "all") return null;
  const n = Number(raw);
  if (n === 7 || n === 30 || n === 90) return n;
  return 30;
}

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

/**
 * Performance d'une verticale. STAY (séjours) = seule verticale transactionnelle :
 * réservations payées + GMV. IMMO (location/vente) = mise en relation, pas de
 * paiement en ligne (invariant produit) : on suit les leads (ContactRequest).
 * Les annonces (stock) sont comptées pour les deux. paidBookings/gmvTnd/leads
 * sont calculés sur la fenêtre sélectionnée.
 */
export type VerticalStats = {
  vertical: Vertical;
  activeListings: number;
  verifiedActiveListings: number;
  verificationRate: number;
  paidBookings: number;
  gmvTnd: number;
  leads: number;
};

export type FounderAnalytics = {
  generatedAt: Date;
  periodDays: PeriodDays;
  northStar: {
    /** North-star produit : annonces vérifiées ET actives. */
    verifiedActiveListings: number;
    activeListings: number;
    verificationRate: number;
    /** GMV TND cumulée : somme des réservations payées (démo incluse). */
    gmvTnd: number;
    /** GMV réelle cumulée TND : hors paiements simulés (démo). */
    realGmvTnd: number;
    confirmedBookings: number;
    totalUsers: number;
  };
  /** Split STAY vs IMMO (les deux modèles ne se mélangent pas dans les KPI). */
  byVertical: VerticalStats[];
  acquisition: {
    signupsByDay: TimePoint[];
    /** Nombre de jours couverts par l'histogramme (≤ 90). */
    signupsWindowDays: number;
    signupsLast7: number;
    signupsLast30: number;
    byRole: Segment[];
    /** Répartition des comptes par pays déclaré (pilotage diaspora). */
    byCountry: Segment[];
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

export async function getFounderAnalytics(
  periodDays: PeriodDays = 30
): Promise<FounderAnalytics> {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY_MS);
  const since7 = new Date(now.getTime() - 7 * DAY_MS);
  const since90 = new Date(now.getTime() - 90 * DAY_MS);

  // Borne de la fenêtre sélectionnée (null = tout). Filtre `createdAt` réutilisé
  // par toutes les métriques de flux ; objet vide quand « tout ».
  const periodStart = periodDays ? new Date(now.getTime() - periodDays * DAY_MS) : null;
  const inPeriod = periodStart ? { createdAt: { gte: periodStart } } : {};

  // Histogramme des inscriptions : fenêtre = période sélectionnée, bornée à
  // [7, 90] jours (au-delà, illisible en barres). On récupère assez de signups
  // pour servir aussi les cartes de référence 7 j / 30 j.
  const signupsWindowDays = Math.min(90, Math.max(7, periodDays ?? 90));
  const fetchSignupsSince = new Date(
    now.getTime() - Math.max(30, signupsWindowDays) * DAY_MS
  );

  const [
    verifiedActiveListings,
    activeListings,
    totalUsers,
    gmvAgg,
    realGmvAgg,
    confirmedBookings,
    recentSignups,
    roleGroups,
    countryGroups,
    emailVerifiedCount,
    listersCount,
    listersKycOkCount,
    distinctOwners,
    activeByVertical,
    verifiedActiveByVertical,
    paidStayAgg,
    immoLeads,
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
    // Inscriptions récentes (bucketées en JS — pas de SQL brut) : couvre la
    // fenêtre de l'histogramme ET les cartes de référence 7 j / 30 j.
    prisma.user.findMany({
      where: { createdAt: { gte: fetchSignupsSince } },
      select: { createdAt: true },
    }),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.groupBy({ by: ["country"], _count: { _all: true } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { role: { in: [...LISTER_ROLES] } } }),
    prisma.user.count({
      where: { role: { in: [...LISTER_ROLES] }, kycStatus: { in: [...KYC_OK] } },
    }),
    prisma.property.findMany({ select: { ownerId: true }, distinct: ["ownerId"] }),
    // ── Split par verticale (stock annonces) ──
    prisma.property.groupBy({
      by: ["vertical"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.property.groupBy({
      by: ["vertical"],
      where: { status: "ACTIVE", verified: true },
      _count: { _all: true },
    }),
    // STAY = seule verticale transactionnelle : toutes les réservations en
    // relèvent. GMV + nombre de réservations payées sur la fenêtre.
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      _count: { _all: true },
      where: { status: { in: [...PAID_BOOKING_STATUSES] }, ...inPeriod },
    }),
    // IMMO = mise en relation : leads reçus (ContactRequest) sur la fenêtre.
    prisma.contactRequest.count({ where: { ...inPeriod } }),
    // ── Funnel de réservation sur la fenêtre ──
    prisma.booking.groupBy({
      by: ["status"],
      where: { ...inPeriod },
      _count: { _all: true },
    }),
    prisma.booking.count({ where: { paymentRef: { not: null }, ...inPeriod } }),
    prisma.booking.count({
      where: { status: "EN_ATTENTE", expiresAt: { lte: now }, ...inPeriod },
    }),
    prisma.booking.count({
      where: { status: "EN_ATTENTE", expiresAt: { gt: now }, ...inPeriod },
    }),
    // Dernière réservation par voyageur → segmentation rétention/churn (stock).
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

  // ── Acquisition : série temporelle des inscriptions (fenêtre adaptative) ──
  const dayCounts = new Map<string, number>();
  for (let i = signupsWindowDays - 1; i >= 0; i--) {
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
  const signupsLast30 = recentSignups.filter((u) => u.createdAt >= since30).length;
  const signupsLast7 = recentSignups.filter((u) => u.createdAt >= since7).length;

  const byRole: Segment[] = roleGroups
    .map((g) => ({ label: g.role, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const byCountry: Segment[] = countryGroups
    .map((g) => ({ label: g.country ?? "—", count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  // ── Split par verticale ──
  const activeMap = new Map(activeByVertical.map((g) => [g.vertical, g._count._all]));
  const verifiedMap = new Map(
    verifiedActiveByVertical.map((g) => [g.vertical, g._count._all])
  );
  const byVertical: VerticalStats[] = VERTICALS.map((vertical) => {
    const active = activeMap.get(vertical) ?? 0;
    const verified = verifiedMap.get(vertical) ?? 0;
    const isStay = vertical === "STAY";
    return {
      vertical,
      activeListings: active,
      verifiedActiveListings: verified,
      verificationRate: ratio(verified, active),
      paidBookings: isStay ? paidStayAgg._count._all : 0,
      gmvTnd: isStay ? paidStayAgg._sum.totalPrice ?? 0 : 0,
      leads: isStay ? 0 : immoLeads,
    };
  });

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
    periodDays,
    northStar: {
      verifiedActiveListings,
      activeListings,
      verificationRate: ratio(verifiedActiveListings, activeListings),
      gmvTnd: gmvAgg._sum.totalPrice ?? 0,
      realGmvTnd: realGmvAgg._sum.totalPrice ?? 0,
      confirmedBookings,
      totalUsers,
    },
    byVertical,
    acquisition: {
      signupsByDay,
      signupsWindowDays,
      signupsLast7,
      signupsLast30,
      byRole,
      byCountry,
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
