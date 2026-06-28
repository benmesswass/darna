import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildUnavailableDates } from "@/lib/listings";
import { markerPriceLabel } from "@/lib/format";
import { PropertyCtas } from "@/components/property/PropertyCtas";
import { StayDatesPicker } from "@/modules/stay/listing/StayDatesPicker";
import { UsersIcon } from "@/components/icons";
import { ListingDetail } from "@/modules/core/listing/ListingDetail";
import { Caracteristique } from "@/modules/core/listing/Caracteristique";
import type { CancelPolicy } from "@/lib/constants";
import type {
  ListingData,
  ListingFavCtx,
  ListingViewer,
} from "@/modules/core/listing/types";

/**
 * Fiche de la verticale SÉJOUR : calendrier de disponibilités, capacité,
 * encart frais de service, CTA « Réserver » (funnel transactionnel + escrow).
 * Compose le noyau ListingDetail en lui injectant ses sections spécifiques.
 */
export async function StayDetail({
  property,
  user,
  favCtx,
  arrivee,
}: {
  property: ListingData;
  user: ListingViewer;
  favCtx: ListingFavCtx;
  arrivee?: string;
}) {
  const fr = await getT();

  // Avis possible uniquement après un séjour confirmé et terminé, sans avis existant.
  const eligibleBooking = user
    ? await prisma.booking.findFirst({
        where: {
          propertyId: property.id,
          guestId: user.id,
          status: { in: ["CONFIRMEE", "TERMINEE"] },
          checkOut: { lt: new Date() },
          review: null,
        },
        select: { id: true },
      })
    : null;

  const isActive =
    property.status === "ACTIVE" && property.expiresAt.getTime() > Date.now();

  const unavailable = buildUnavailableDates([
    ...property.bookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...property.availabilities.map((a) => ({ start: a.startDate, end: a.endDate })),
  ]);

  return (
    <ListingDetail
      property={property}
      favCtx={favCtx}
      arrivee={arrivee}
      activeSection="sejours"
      // Anti-bypass : l'identité de l'hôte (nom/contact) reste masquée tant que
      // l'acompte n'est pas réglé. Les coordonnées sont révélées à la
      // confirmation (cf. getRevealedContacts).
      anonymizeOwner
      priceSuffix={fr.common.parNuit}
      eligibleBookingId={eligibleBooking?.id}
      characteristicsExtra={
        property.stay?.maxGuests ? (
          <Caracteristique
            icon={<UsersIcon />}
            label={fr.property.capacite(property.stay.maxGuests)}
          />
        ) : null
      }
      afterAmenities={
        <section>
          <h2 className="text-xl font-bold text-darna">
            {fr.property.disponibilites}
          </h2>
          <div className="mt-4">
            <StayDatesPicker
              slug={property.slug}
              unavailable={unavailable}
              active={isActive}
            />
          </div>
        </section>
      }
      belowPrice={
        <>
          <p className="mt-1 text-xs text-ink/50">{fr.property.fraisServiceInfo}</p>
          <div className="mt-2 rounded-xl bg-cream px-3 py-2 text-xs">
            <p className="font-semibold text-ink/80">
              {fr.property.politiqueAnnulation} :{" "}
              <span className="text-darna">
                {fr.property.cancelPolicy[property.cancelPolicy as CancelPolicy] ??
                  property.cancelPolicy}
              </span>
            </p>
            <p className="mt-0.5 text-ink/60">
              {fr.property.cancelPolicyDesc[property.cancelPolicy as CancelPolicy]}
            </p>
          </div>
        </>
      }
      cta={
        <PropertyCtas
          slug={property.slug}
          type={property.type}
          title={property.title}
          priceLabel={markerPriceLabel(property.price, property.type)}
          // Séjour : le téléphone de l'hôte n'est JAMAIS transmis avant
          // réservation confirmée (anti-bypass). Contact via réservation only.
          ownerPhone={null}
          active={isActive}
        />
      }
    />
  );
}
