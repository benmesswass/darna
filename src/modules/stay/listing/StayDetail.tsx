import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { buildUnavailableDates } from "@/lib/listings";
import { markerPriceLabel } from "@/lib/format";
import { PropertyCtas } from "@/components/property/PropertyCtas";
import { StayDatesPicker } from "@/modules/stay/listing/StayDatesPicker";
import { UsersIcon } from "@/components/icons";
import { ListingDetail } from "@/modules/core/listing/ListingDetail";
import { Caracteristique } from "@/modules/core/listing/Caracteristique";
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
        <p className="mt-1 text-xs text-ink/50">{fr.property.fraisServiceInfo}</p>
      }
      cta={
        <PropertyCtas
          slug={property.slug}
          type={property.type}
          title={property.title}
          priceLabel={markerPriceLabel(property.price, property.type)}
          ownerPhone={property.owner.phone}
          active={isActive}
        />
      }
    />
  );
}
