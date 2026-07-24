import { getT } from "@/lib/i18n/server";
import { markerPriceLabel } from "@/lib/format";
import { PropertyCtas } from "@/components/property/PropertyCtas";
import { ListingDetail } from "@/modules/core/listing/ListingDetail";
import { ImmoContactSection } from "@/modules/immo/listing/ImmoContactSection";
import { FinancingLeadSection } from "@/modules/immo/listing/FinancingLeadSection";
import type {
  ListingData,
  ListingFavCtx,
  ListingViewer,
} from "@/modules/core/listing/types";

/**
 * Fiche de la verticale IMMO (location longue durée / vente) : contact direct,
 * CTA « Contacter », pas de calendrier ni de paiement en ligne. Compose le
 * noyau ListingDetail en lui injectant la section contact (si annonce active).
 */
export async function ImmoDetail({
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

  const isActive =
    property.status === "ACTIVE" && property.expiresAt.getTime() > Date.now();
  const priceSuffix =
    property.type === "LOCATION" ? fr.common.parMois : undefined;

  return (
    <ListingDetail
      property={property}
      favCtx={favCtx}
      arrivee={arrivee}
      activeSection="immobilier"
      priceSuffix={priceSuffix}
      afterLocation={
        isActive ? (
          <div className="space-y-8">
            <ImmoContactSection property={property} user={user} />
            {property.type === "VENTE" ? (
              <FinancingLeadSection property={property} user={user} />
            ) : null}
          </div>
        ) : null
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
