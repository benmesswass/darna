/**
 * P2.6 (ROADMAP.md) — invariants qui ne se voient qu'au niveau moteur :
 * contraintes uniques, cascades/SetNull, atomicité d'une transaction batch.
 * VRAI Postgres, jamais Prisma mocké (cf. tests/integration/helpers.ts).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { DB_ENABLED, createUser, createStayProperty, cleanupByPrefix } from "./helpers";

const PREFIX = "itest-dbc";

async function isUniqueViolation(fn: () => Promise<unknown>): Promise<boolean> {
  try {
    await fn();
    return false;
  } catch (err) {
    return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
  }
}

describe.runIf(DB_ENABLED)("Contraintes uniques (Postgres réel)", () => {
  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it("User.email : deux comptes ne peuvent pas partager le même e-mail", async () => {
    const email = `${PREFIX}-dup-${randomUUID()}@itest.darna.local`;
    const { prisma } = await import("@/lib/prisma");
    const makeUser = (id: string) =>
      prisma.user.create({
        data: { id, email, passwordHash: "x", name: "Dup", role: "VOYAGEUR" },
      });
    await makeUser(`${PREFIX}-u1-${randomUUID()}`);
    expect(await isUniqueViolation(() => makeUser(`${PREFIX}-u2-${randomUUID()}`))).toBe(true);
  });

  it("User.cinHash : deux comptes ne peuvent pas partager la même CIN chiffrée", async () => {
    const cinHash = `${PREFIX}-cin-${randomUUID()}`;
    const { prisma } = await import("@/lib/prisma");
    const makeUser = (id: string) =>
      prisma.user.create({
        data: {
          id,
          email: `${id}@itest.darna.local`,
          passwordHash: "x",
          name: "Dup CIN",
          role: "VOYAGEUR",
          cinHash,
        },
      });
    await makeUser(`${PREFIX}-c1-${randomUUID()}`);
    expect(await isUniqueViolation(() => makeUser(`${PREFIX}-c2-${randomUUID()}`))).toBe(true);
  });

  it("Property.slug : deux annonces ne peuvent pas partager le même slug", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const slug = `${PREFIX}-slug-${randomUUID()}`;
    const { prisma } = await import("@/lib/prisma");
    const makeProperty = () =>
      prisma.property.create({
        data: {
          slug,
          title: "Dup slug",
          description: "desc",
          type: "SEJOUR",
          vertical: "STAY",
          status: "ACTIVE",
          price: 100,
          city: "Hammamet",
          gouvernorat: "Nabeul",
          latitude: 36.4,
          longitude: 10.61,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ownerId: owner.id,
        },
      });
    await makeProperty();
    expect(await isUniqueViolation(makeProperty)).toBe(true);
  });

  it("Booking.paymentRef : deux réservations ne peuvent pas partager la même référence Konnect", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const guest = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id);
    const paymentRef = `${PREFIX}-pay-${randomUUID()}`;
    const { prisma } = await import("@/lib/prisma");
    const makeBooking = (offsetDays: number) =>
      prisma.booking.create({
        data: {
          propertyId: property.id,
          guestId: guest.id,
          checkIn: new Date(Date.now() + offsetDays * 86_400_000),
          checkOut: new Date(Date.now() + (offsetDays + 2) * 86_400_000),
          nightlyPrice: 200,
          serviceFee: 20,
          totalPrice: 420,
          status: "EN_ATTENTE",
          paymentRef,
        },
      });
    await makeBooking(400);
    expect(await isUniqueViolation(() => makeBooking(410))).toBe(true);
  });

  it("Review.bookingId : un seul avis voyageur par réservation", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const guest = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn: new Date(Date.now() + 420 * 86_400_000),
        checkOut: new Date(Date.now() + 422 * 86_400_000),
        nightlyPrice: 200,
        serviceFee: 20,
        totalPrice: 420,
        status: "TERMINEE",
      },
    });
    const makeReview = () =>
      prisma.review.create({
        data: {
          bookingId: booking.id,
          propertyId: property.id,
          authorId: guest.id,
          rating: 5,
          proprete: 5,
          communication: 5,
          conformite: 5,
          qualitePrix: 5,
          comment: "Séjour test",
        },
      });
    await makeReview();
    expect(await isUniqueViolation(makeReview)).toBe(true);
  });

  it("Favorite[userId,propertyId] : un même voyageur ne peut pas favoriser deux fois la même annonce", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const guest = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const makeFavorite = () =>
      prisma.favorite.create({ data: { userId: guest.id, propertyId: property.id } });
    await makeFavorite();
    expect(await isUniqueViolation(makeFavorite)).toBe(true);
  });
});

describe.runIf(DB_ENABLED)("Cascades et SetNull (Postgres réel)", () => {
  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it("supprimer un hôte supprime ses annonces (Property.ownerId onDelete: Cascade)", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");

    await prisma.user.delete({ where: { id: owner.id } });

    const stillThere = await prisma.property.findUnique({ where: { id: property.id } });
    expect(stillThere).toBeNull();
  });

  it("supprimer un voyageur supprime ses réservations (Booking.guestId onDelete: Cascade)", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const guest = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: guest.id,
        checkIn: new Date(Date.now() + 450 * 86_400_000),
        checkOut: new Date(Date.now() + 452 * 86_400_000),
        nightlyPrice: 200,
        serviceFee: 20,
        totalPrice: 420,
        status: "EN_ATTENTE",
      },
    });

    await prisma.user.delete({ where: { id: guest.id } });

    const stillThere = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(stillThere).toBeNull();
  });

  it("supprimer un dossier de favoris déclasse ses favoris SANS les supprimer (Favorite.folderId onDelete: SetNull)", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const guest = await createUser(PREFIX);
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const folder = await prisma.favoriteFolder.create({
      data: { userId: guest.id, name: "À tester" },
    });
    const favorite = await prisma.favorite.create({
      data: { userId: guest.id, propertyId: property.id, folderId: folder.id },
    });

    await prisma.favoriteFolder.delete({ where: { id: folder.id } });

    const refreshed = await prisma.favorite.findUniqueOrThrow({ where: { id: favorite.id } });
    expect(refreshed.folderId).toBeNull();
  });
});

describe.runIf(DB_ENABLED)("Atomicité — réordonnancement de photos (Postgres réel)", () => {
  afterAll(async () => {
    await cleanupByPrefix(PREFIX);
  });

  it("setCoverPhotoAction laisse des positions consécutives et uniques, la photo choisie en tête", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const photos = await Promise.all(
      [0, 1, 2].map((position) =>
        prisma.photo.create({
          data: { propertyId: property.id, url: `https://x/${position}.jpg`, alt: "x", position },
        })
      )
    );
    const chosen = photos[2];

    // Même logique que setCoverPhotoAction (src/actions/properties.ts) sans
    // passer par la session/authOrization — on isole l'invariant transaction.
    const ordered = await prisma.photo.findMany({
      where: { propertyId: property.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const reordered = [chosen.id, ...ordered.map((p) => p.id).filter((id) => id !== chosen.id)];
    await prisma.$transaction(
      reordered.map((id, position) => prisma.photo.update({ where: { id }, data: { position } }))
    );

    const result = await prisma.photo.findMany({
      where: { propertyId: property.id },
      orderBy: { position: "asc" },
    });
    expect(result.map((p) => p.position)).toEqual([0, 1, 2]);
    expect(result[0].id).toBe(chosen.id);
  });

  it("une transaction batch échoue TOUT ENTIÈRE si une seule mise à jour est invalide (rien n'est appliqué)", async () => {
    const owner = await createUser(PREFIX, { role: "HOTE" });
    const property = await createStayProperty(PREFIX, owner.id);
    const { prisma } = await import("@/lib/prisma");
    const photos = await Promise.all(
      [0, 1].map((position) =>
        prisma.photo.create({
          data: { propertyId: property.id, url: `https://x/${position}.jpg`, alt: "x", position },
        })
      )
    );

    await expect(
      prisma.$transaction([
        prisma.photo.update({ where: { id: photos[0].id }, data: { position: 9 } }),
        // Id inexistant : cette étape échoue, TOUTE la transaction doit
        // rollback — y compris la mise à jour valide ci-dessus.
        prisma.photo.update({ where: { id: "does-not-exist" }, data: { position: 9 } }),
      ])
    ).rejects.toThrow();

    const untouched = await prisma.photo.findUniqueOrThrow({ where: { id: photos[0].id } });
    expect(untouched.position).toBe(0);
  });
});
