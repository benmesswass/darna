import { prisma } from "@/lib/prisma";

/**
 * Export RGPD (droit à la portabilité, LANCEMENT_ROADMAP.md §L7.3) — collecte
 * TOUT ce qui appartient au compte, jamais les données d'AUTRUI au-delà du
 * strict nécessaire pour donner du contexte : un message reçu garde son
 * corps (le compte en est destinataire, ça lui appartient aussi) mais
 * n'expose l'expéditeur QUE par son nom, jamais son id/e-mail/téléphone.
 * Même principe pour les avis reçus (auteur par son nom seulement).
 *
 * Extrait dans un module dédié (plutôt que la route directement) pour rester
 * testable en vitest sans dépendance HTTP — même patron que
 * settleKonnectBooking/src/lib/payments.ts, appelé par un handler mince.
 */
export async function buildAccountExport(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      country: true,
      kycStatus: true,
      emailVerified: true,
      phoneVerified: true,
      isWakil: true,
      createdAt: true,
      // Jamais cin/cinHash : donnée chiffrée au repos, ne doit jamais
      // ressortir en clair par un export, même vers son propre titulaire.
    },
  });

  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      title: true,
      type: true,
      city: true,
      price: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const bookings = await prisma.booking.findMany({
    where: { guestId: userId },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      totalPrice: true,
      amountPaid: true,
      status: true,
      createdAt: true,
      property: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const reviewsAuthored = await prisma.review.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      property: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const guestReviewsReceived = await prisma.guestReview.findMany({
    where: { targetId: userId },
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      author: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const messagesRaw = await prisma.message.findMany({
    where: {
      booking: { OR: [{ guestId: userId }, { property: { ownerId: userId } }] },
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      senderId: true,
      sender: { select: { name: true } },
      booking: { select: { property: { select: { title: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  // Un message ENVOYÉ par ce compte garde toutes ses infos ; un message REÇU
  // n'expose l'expéditeur que par son nom (donnée d'autrui, cf. en-tête).
  const messages = messagesRaw.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    propertyTitle: m.booking.property.title,
    envoyeParMoi: m.senderId === userId,
    expediteurNom: m.senderId === userId ? undefined : m.sender.name,
  }));

  const creditTransactions = await prisma.creditTransaction.findMany({
    where: { wallet: { userId } },
    select: { amount: true, motif: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: "desc" },
  });

  return {
    exportedAt: new Date().toISOString(),
    profil: user,
    annonces: properties,
    reservations: bookings,
    avis: { redigesParMoi: reviewsAuthored, recusDesHotes: guestReviewsReceived },
    messages,
    mouvementsCredits: creditTransactions,
  };
}
