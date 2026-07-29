/**
 * P2.5 (ROADMAP.md) — intégrité du prix sur une VRAIE base PostgreSQL.
 *
 * `booking-promo-price.test.ts` (Prisma mocké) prouve déjà que le schéma de
 * validation (`createSchema`) n'accepte aucun champ prix. Ici on prouve
 * l'INVARIANT au niveau moteur : même en injectant des champs prix hostiles
 * dans le FormData, la ligne PERSISTÉE en base reflète uniquement le calcul
 * serveur (`property.price` × nuits + frais), jamais l'entrée client.
 *
 * On utilise le VRAI `@/lib/prisma` : ce fichier ne doit PAS le mocker.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { DB_ENABLED, createUser, createStayProperty, cleanupByPrefix, ymd, type FakeSessionUser } from "./helpers";

const PREFIX = "itest-price";

let sessionUser: FakeSessionUser;

vi.mock("@/lib/session", () => ({
  requireUser: vi.fn(async () => sessionUser),
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
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

const { createBookingAction } = await import("@/actions/bookings");
const { prisma } = await import("@/lib/prisma");

describe.runIf(DB_ENABLED)("Intégrité du prix — createBookingAction (Postgres réel)", () => {
  const PRICE_PER_NIGHT = 300;
  let slug: string;

  beforeAll(async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    sessionUser = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id, { price: PRICE_PER_NIGHT });
    slug = property.slug;
  });

  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it("un prix/total injecté dans le FormData n'a AUCUN effet sur le montant persisté", async () => {
    const arrivee = ymd(300);
    const depart = ymd(302); // 2 nuits

    const fd = new FormData();
    fd.set("slug", slug);
    fd.set("arrivee", arrivee);
    fd.set("depart", depart);
    fd.set("voyageurs", "2");
    // Injection hostile : aucun de ces champs n'existe dans createSchema —
    // s'ils avaient le moindre effet, ce test échouerait.
    fd.set("totalPrice", "1");
    fd.set("price", "1");
    fd.set("nightlyPrice", "0");
    fd.set("serviceFee", "0");
    fd.set("amount", "-1000");

    let redirected = false;
    try {
      await createBookingAction({}, fd);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.startsWith("NEXT_REDIRECT:")) redirected = true;
      else throw err;
    }
    expect(redirected).toBe(true);

    const booking = await prisma.booking.findFirstOrThrow({
      where: { property: { slug } },
    });

    const expectedSubtotal = PRICE_PER_NIGHT * 2;
    const expectedServiceFee = Math.round(expectedSubtotal * 0.1); // SERVICE_FEE_RATE = 10 %
    expect(booking.nightlyPrice).toBe(PRICE_PER_NIGHT);
    expect(booking.serviceFee).toBe(expectedServiceFee);
    expect(booking.totalPrice).toBe(expectedSubtotal + expectedServiceFee);
    // Jamais les valeurs hostiles injectées.
    expect(booking.totalPrice).not.toBe(1);
    expect(booking.nightlyPrice).not.toBe(0);
  });
});
