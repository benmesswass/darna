/**
 * Phase 1 — J1 (P0) · Concurrence anti double-réservation sur une VRAIE base
 * PostgreSQL (TEST_AUTOMATION_ROADMAP §3, §6.2).
 *
 * `booking-conflict.test.ts` mocke Prisma et prouve la LOGIQUE du garde-fou.
 * Ici on prouve l'INVARIANT MÉTIER au niveau moteur : on lance DEUX
 * `createBookingAction` EN PARALLÈLE sur le même créneau, contre la transaction
 * SERIALIZABLE réelle, et on vérifie qu'il ne reste JAMAIS deux réservations
 * actives qui se chevauchent — quel que soit le sort du perdant (rejet propre
 * OU abandon de sérialisation Postgres). C'est le test que le commentaire de
 * `bookings.ts` renvoyait à « un test d'intégration sur Postgres éphémère ».
 *
 * Gate : ne tourne que si `DATABASE_URL` est défini (CI : Postgres + migrate
 * deploy). En local sans base, le bloc est ignoré → `npm test` reste vert.
 *
 * On utilise le VRAI `@/lib/prisma` : ce fichier ne doit PAS le mocker. Seules
 * les dépendances périphériques (session, i18n, notifications, audit, konnect,
 * navigation) sont mockées.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DB_ENABLED,
  createUser,
  createStayProperty,
  cleanupByPrefix,
  bookingFormData,
  ymd,
  type FakeSessionUser,
} from "./helpers";

const PREFIX = "itest-conc";

// requireUser renvoie tour à tour l'un des deux voyageurs (les deux sont des
// comptes vérifiés symétriques : peu importe lequel gagne la course).
let sessionUsers: FakeSessionUser[] = [];
let nextUser = 0;

vi.mock("@/lib/session", () => ({
  requireUser: vi.fn(async () => sessionUsers[nextUser++ % sessionUsers.length]),
  getSessionUser: vi.fn(async () => null),
}));
vi.mock("@/lib/i18n/server", () => ({
  getT: vi.fn().mockResolvedValue({
    booking: {
      verifRequise: "Vérification requise.",
      compteSuspendu: "Compte suspendu.",
      datesInvalides: "Dates invalides.",
      datesIndisponibles: "Dates indisponibles.",
      proprietaireImpossible: "Impossible de réserver son propre logement.",
      capaciteDepassee: (n: number) => `Capacité dépassée (${n}).`,
      cashNonDisponible: "Paiement sur place indisponible.",
      cashKycRequis: "KYC requis.",
    },
    common: { erreurInconnue: "Erreur inconnue." },
  }),
}));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logStructured: vi.fn() }));
vi.mock("@/lib/notifications", () => ({
  sendBookingConfirmationEmail: vi.fn(),
  sendNewBookingHostEmail: vi.fn(),
}));
vi.mock("@/lib/notification-center", () => ({
  notifyBookingConfirmed: vi.fn(),
  notifyNewBookingReceived: vi.fn(),
}));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(),
  // Fonction pure réelle (pas de raison de la mocker) — nécessaire à
  // settleKonnectBooking (course paiement, decrit plus bas).
  tndToMillimes: (tnd: number) => Math.round(tnd * 1000),
  getKonnectPayment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// redirect() = succès : la vraie fonction Next lève ; on lève un sentinel pour
// distinguer un booking réussi (redirection) d'un rejet (retour { error }).
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// Import APRÈS les mocks (hoisting vi.mock garanti par Vitest).
const { createBookingAction } = await import("@/actions/bookings");
const { prisma } = await import("@/lib/prisma");
const { settleKonnectBooking } = await import("@/lib/payments");
const { getKonnectPayment } = await import("@/lib/konnect");
const { sendBookingConfirmationEmail, sendNewBookingHostEmail } = await import(
  "@/lib/notifications"
);
const { notifyBookingConfirmed, notifyNewBookingReceived } = await import(
  "@/lib/notification-center"
);

type Outcome = { redirected: boolean; error?: string; threw?: string };

/** Joue createBookingAction et classe l'issue : redirection (succès) / error / throw. */
async function attemptBooking(fd: FormData): Promise<Outcome> {
  try {
    const state = await createBookingAction({}, fd);
    return { redirected: false, error: state?.error };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.startsWith("NEXT_REDIRECT:")) return { redirected: true };
    return { redirected: false, threw: msg };
  }
}

describe.runIf(DB_ENABLED)("J1 — concurrence anti double-réservation (Postgres réel)", () => {
  let owner: FakeSessionUser;
  let slug: string;

  beforeAll(async () => {
    // Sanity : la base doit répondre, sinon on veut un échec clair (pas un skip
    // silencieux) puisque DATABASE_URL est défini.
    await prisma.$queryRaw`SELECT 1`;
    owner = await createUser(PREFIX, { role: "HOTE" });
    const guestA = await createUser(PREFIX);
    const guestB = await createUser(PREFIX);
    sessionUsers = [guestA, guestB];
    const property = await createStayProperty(PREFIX, owner.id);
    slug = property.slug;
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
    await prisma.$disconnect();
  });

  it("deux réservations simultanées sur le même créneau → exactement une gagne", async () => {
    // 5 rounds sur des créneaux distincts pour multiplier les chances de tomber
    // sur la vraie fenêtre de course (write-skew détecté au commit SERIALIZABLE).
    for (let round = 0; round < 5; round++) {
      const arrivee = ymd(10 + round * 5);
      const depart = ymd(12 + round * 5);

      const [a, b] = await Promise.all([
        attemptBooking(bookingFormData(slug, arrivee, depart)),
        attemptBooking(bookingFormData(slug, arrivee, depart)),
      ]);

      // INVARIANT DUR : une seule réservation active persiste sur ce créneau.
      const active = await prisma.booking.count({
        where: {
          property: { slug },
          status: { in: ["EN_ATTENTE", "CONFIRMEE"] },
          checkIn: { lt: new Date(`${depart}T00:00:00.000Z`) },
          checkOut: { gt: new Date(`${arrivee}T00:00:00.000Z`) },
        },
      });
      expect(active, `round ${round}: exactement 1 réservation active attendue`).toBe(1);

      // Exactement une tentative a réussi (redirection) ; l'autre a été refusée
      // (rejet propre datesIndisponibles OU abandon de sérialisation P2034).
      const winners = [a, b].filter((o) => o.redirected).length;
      expect(winners, `round ${round}: un seul gagnant`).toBe(1);
    }
  });
});

// P2.5 (ROADMAP.md) — course paiement + réservation simultanée : le webhook
// Konnect et la page de retour (`?konnect=success`) appellent tous deux
// settleKonnectBooking SANS coordination entre eux (src/lib/payments.ts) —
// seule la transaction SERIALIZABLE + l'updateMany conditionné à
// status:"EN_ATTENTE" empêchent une double confirmation / un double e-mail.
describe.runIf(DB_ENABLED)("J1 — course de règlement Konnect (webhook vs retour user)", () => {
  const PAY_PREFIX = "itest-pay";
  let guest: FakeSessionUser;
  let propertyId: string;

  beforeAll(async () => {
    const owner = await createUser(PAY_PREFIX, { role: "HOTE" });
    guest = await createUser(PAY_PREFIX);
    const property = await createStayProperty(PAY_PREFIX, owner.id);
    propertyId = property.id;
  });

  afterAll(async () => {
    await cleanupByPrefix(PAY_PREFIX);
  });

  it("deux règlements simultanés du même paiement → une seule confirmation, un seul jeu de notifications", async () => {
    vi.clearAllMocks();
    const booking = await prisma.booking.create({
      data: {
        propertyId,
        guestId: guest.id,
        checkIn: new Date(`${ymd(200)}T00:00:00.000Z`),
        checkOut: new Date(`${ymd(202)}T00:00:00.000Z`),
        nightlyPrice: 200,
        serviceFee: 20,
        totalPrice: 420,
        amountPaid: 20,
        status: "EN_ATTENTE",
        paymentRef: "pay-race-ref",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    vi.mocked(getKonnectPayment).mockResolvedValue({
      status: "completed",
      reachedAmount: 20_000, // 20 TND en millimes — couvre amountPaid.
    } as never);

    const [first, second] = await Promise.all([
      settleKonnectBooking({ bookingId: booking.id }),
      settleKonnectBooking({ bookingId: booking.id }),
    ]);

    expect([first, second]).toEqual(["CONFIRMEE", "CONFIRMEE"]);

    const persisted = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
    expect(persisted.status).toBe("CONFIRMEE");
    expect(persisted.amountPaid).toBe(20);

    // INVARIANT : le compte-rendu (e-mails + notifs) ne part qu'UNE fois —
    // c'est exactement ce que le count===0 de l'updateMany protège dans
    // settleKonnectBooking (src/lib/payments.ts), pas juste le statut final.
    expect(sendBookingConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(sendNewBookingHostEmail).toHaveBeenCalledTimes(1);
    expect(notifyBookingConfirmed).toHaveBeenCalledTimes(1);
    expect(notifyNewBookingReceived).toHaveBeenCalledTimes(1);
  });
});

// P2.5 (ROADMAP.md) — expiration paresseuse du hold de 15 min : aucun cron,
// le créneau se libère au premier createBookingAction suivant qui touche la
// même annonce (étape 1 de la transaction, bookings.ts) — jamais un job
// séparé. Prouve l'invariant "zéro cron pour l'état" (CLAUDE.md).
describe.runIf(DB_ENABLED)("J1 — expiration paresseuse libère le créneau (Postgres réel)", () => {
  const HOLD_PREFIX = "itest-hold";
  let guestA: FakeSessionUser;
  let guestB: FakeSessionUser;
  let propertyId: string;
  let slug: string;

  beforeAll(async () => {
    const owner = await createUser(HOLD_PREFIX, { role: "HOTE" });
    guestA = await createUser(HOLD_PREFIX);
    guestB = await createUser(HOLD_PREFIX);
    const property = await createStayProperty(HOLD_PREFIX, owner.id);
    propertyId = property.id;
    slug = property.slug;
  });

  afterAll(async () => {
    await cleanupByPrefix(HOLD_PREFIX);
  });

  it("un hold EN_ATTENTE expiré n'empêche pas une nouvelle réservation sur les mêmes dates", async () => {
    const arrivee = ymd(210);
    const depart = ymd(212);

    const staleHold = await prisma.booking.create({
      data: {
        propertyId,
        guestId: guestA.id,
        checkIn: new Date(`${arrivee}T00:00:00.000Z`),
        checkOut: new Date(`${depart}T00:00:00.000Z`),
        nightlyPrice: 200,
        serviceFee: 20,
        totalPrice: 220,
        status: "EN_ATTENTE",
        // Expiré depuis 1 minute — jamais rattrapé par un cron, seulement
        // par la prochaine transaction qui touche cette annonce.
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    sessionUsers = [guestB];
    nextUser = 0;
    const outcome = await attemptBooking(bookingFormData(slug, arrivee, depart));
    expect(outcome.redirected, JSON.stringify(outcome)).toBe(true);

    const refreshedHold = await prisma.booking.findUniqueOrThrow({ where: { id: staleHold.id } });
    expect(refreshedHold.status).toBe("ANNULEE");

    const active = await prisma.booking.count({
      where: { propertyId, status: { in: ["EN_ATTENTE", "CONFIRMEE"] } },
    });
    expect(active).toBe(1);
  });
});
