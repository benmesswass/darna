/**
 * LANCEMENT_ROADMAP.md §L7.3 — droit à la portabilité. Règle testée : jamais
 * les données d'autrui au-delà du strict nécessaire (un message REÇU garde
 * son corps mais n'expose l'expéditeur que par son nom — jamais son id/
 * e-mail — et le profil n'expose jamais cin/cinHash, même vers son titulaire).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUniqueOrThrow: vi.fn() },
    property: { findMany: vi.fn() },
    booking: { findMany: vi.fn() },
    review: { findMany: vi.fn() },
    guestReview: { findMany: vi.fn() },
    message: { findMany: vi.fn() },
    creditTransaction: { findMany: vi.fn() },
  },
}));

import { buildAccountExport } from "@/lib/account-export";
import { prisma } from "@/lib/prisma";

const USER_ID = "user-1";

const userFindUniqueOrThrow = prisma.user.findUniqueOrThrow as unknown as Mock;
const propertyFindMany = prisma.property.findMany as unknown as Mock;
const bookingFindMany = prisma.booking.findMany as unknown as Mock;
const reviewFindMany = prisma.review.findMany as unknown as Mock;
const guestReviewFindMany = prisma.guestReview.findMany as unknown as Mock;
const messageFindMany = prisma.message.findMany as unknown as Mock;
const creditTransactionFindMany = prisma.creditTransaction.findMany as unknown as Mock;

beforeEach(() => {
  vi.clearAllMocks();
  userFindUniqueOrThrow.mockResolvedValue({
    id: USER_ID,
    name: "Wassim",
    email: "wassim@example.com",
    phone: "+21620000000",
    role: "VOYAGEUR",
    country: "France",
    kycStatus: "VERIFIE",
    emailVerified: true,
    phoneVerified: true,
    isWakil: false,
    createdAt: new Date("2026-01-01"),
  });
  propertyFindMany.mockResolvedValue([]);
  bookingFindMany.mockResolvedValue([]);
  reviewFindMany.mockResolvedValue([]);
  guestReviewFindMany.mockResolvedValue([]);
  messageFindMany.mockResolvedValue([]);
  creditTransactionFindMany.mockResolvedValue([]);
});

describe("buildAccountExport", () => {
  it("interroge chaque table uniquement pour CE compte (jamais un autre userId)", async () => {
    await buildAccountExport(USER_ID);

    expect(userFindUniqueOrThrow.mock.calls[0][0].where).toEqual({ id: USER_ID });
    expect(propertyFindMany.mock.calls[0][0].where).toEqual({ ownerId: USER_ID });
    expect(bookingFindMany.mock.calls[0][0].where).toEqual({ guestId: USER_ID });
    expect(reviewFindMany.mock.calls[0][0].where).toEqual({ authorId: USER_ID });
    expect(guestReviewFindMany.mock.calls[0][0].where).toEqual({ targetId: USER_ID });
    expect(creditTransactionFindMany.mock.calls[0][0].where).toEqual({ wallet: { userId: USER_ID } });
  });

  it("ne renvoie jamais cin/cinHash dans le profil", async () => {
    const result = await buildAccountExport(USER_ID);

    expect(result.profil).not.toHaveProperty("cin");
    expect(result.profil).not.toHaveProperty("cinHash");
    expect(userFindUniqueOrThrow.mock.calls[0][0].select).not.toHaveProperty("cin");
    expect(userFindUniqueOrThrow.mock.calls[0][0].select).not.toHaveProperty("cinHash");
  });

  it("un message ENVOYÉ par le compte garde ses infos, un message REÇU n'expose l'expéditeur QUE par son nom", async () => {
    messageFindMany.mockResolvedValue([
      {
        id: "msg-sent",
        body: "Bonjour, à quelle heure arrivez-vous ?",
        createdAt: new Date("2026-02-01"),
        senderId: USER_ID,
        sender: { name: "Wassim" },
        booking: { property: { title: "Villa Hammamet" } },
      },
      {
        id: "msg-received",
        body: "Vers 15h !",
        createdAt: new Date("2026-02-02"),
        senderId: "other-user",
        sender: { name: "Sami" },
        booking: { property: { title: "Villa Hammamet" } },
      },
    ]);

    const result = await buildAccountExport(USER_ID);

    expect(result.messages).toEqual([
      {
        id: "msg-sent",
        body: "Bonjour, à quelle heure arrivez-vous ?",
        createdAt: new Date("2026-02-01"),
        propertyTitle: "Villa Hammamet",
        envoyeParMoi: true,
        expediteurNom: undefined,
      },
      {
        id: "msg-received",
        body: "Vers 15h !",
        createdAt: new Date("2026-02-02"),
        propertyTitle: "Villa Hammamet",
        envoyeParMoi: false,
        expediteurNom: "Sami",
      },
    ]);
    // Jamais l'id/e-mail de l'expéditeur d'un message reçu, seulement son nom.
    const receivedMessage = result.messages.find((m) => m.id === "msg-received")!;
    expect(receivedMessage).not.toHaveProperty("senderId");
    expect(receivedMessage).not.toHaveProperty("senderEmail");
  });

  it("les messages interrogés couvrent les réservations où le compte est voyageur OU propriétaire de l'annonce", async () => {
    await buildAccountExport(USER_ID);

    expect(messageFindMany.mock.calls[0][0].where).toEqual({
      booking: { OR: [{ guestId: USER_ID }, { property: { ownerId: USER_ID } }] },
    });
  });

  it("un avis reçu (GuestReview) n'expose l'auteur (hôte) que par son nom", async () => {
    guestReviewFindMany.mockResolvedValue([
      { rating: 5, comment: "Voyageur exemplaire", createdAt: new Date(), author: { name: "Leïla" } },
    ]);

    const result = await buildAccountExport(USER_ID);

    expect(result.avis.recusDesHotes[0]).toEqual({
      rating: 5,
      comment: "Voyageur exemplaire",
      createdAt: expect.any(Date),
      author: { name: "Leïla" },
    });
  });

  it("inclut un horodatage d'export", async () => {
    const result = await buildAccountExport(USER_ID);

    expect(result.exportedAt).toEqual(expect.any(String));
    expect(new Date(result.exportedAt).getTime()).not.toBeNaN();
  });
});
