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
vi.mock("@/lib/notifications", () => ({ sendBookingConfirmationEmail: vi.fn() }));
vi.mock("@/lib/konnect", () => ({
  isKonnectEnabled: vi.fn(() => false),
  initKonnectPayment: vi.fn(),
  signKonnectWebhook: vi.fn(),
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
