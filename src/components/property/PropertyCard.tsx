import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { SERVICE_FEE_RATE } from "@/lib/config";
import type { ListingWithPhoto } from "@/lib/listings";
import { effectiveNightlyPrice, isListingFeatured, isPropertyPromoActive } from "@/lib/listings";
import type { FavoriteCardProp } from "@/lib/favorites";
import { Price } from "@/components/currency/Price";
import { FavoriteButton } from "./FavoriteButton";
import { FeaturedBadge, FreshnessBadge, PromoBadge, TypeBadge, VerifiedBadge } from "./Badges";
import { PromoPrice } from "./PromoPrice";
import { DoorIcon, MapPinIcon, RulerIcon, UsersIcon } from "@/components/icons";

export async function PropertyCard({
  property,
  showType = false,
  favorite,
  query = "",
  nights,
}: {
  property: ListingWithPhoto;
  showType?: boolean;
  // Fourni uniquement pour un utilisateur connecté → affiche le cœur favori.
  favorite?: FavoriteCardProp;
  // Query string optionnelle (ex. « ?arrivee=…&depart=… ») ajoutée au lien,
  // pour transmettre les dates de recherche à la page détail.
  query?: string;
  // Nombre de nuits recherché (séjours uniquement) : si fourni, on affiche le
  // coût TOTAL du séjour (sous-total + frais de service), c.-à-d. ce qui sera
  // réellement payé — cohérent avec « le prix affiché est le prix payé ».
  nights?: number;
}) {
  const fr = await getT();
  // Prix réellement payé : le prix promo hôte si actif (§PM1), sinon le prix normal.
  const nightlyPrice = effectiveNightlyPrice(property);
  const promoActive =
    property.verified && isPropertyPromoActive(property.promoUntil) && property.promoPrice !== null;
  // Total tout compris pour le séjour cherché (même calcul que la réservation).
  const stayTotal =
    nights && nights > 0 && property.type === "SEJOUR"
      ? nightlyPrice * nights + Math.round(nightlyPrice * nights * SERVICE_FEE_RATE)
      : null;
  // Helper interne : dépend du dictionnaire de la requête.
  function priceSuffix(type: string): string | undefined {
    if (type === "SEJOUR") return fr.common.parNuit;
    if (type === "LOCATION") return fr.common.parMois;
    return undefined;
  }
  const photo = property.photos[0];
  const featured = isListingFeatured(property.featuredUntil);

  return (
    // Conteneur : le cœur est un FRÈRE du <Link> (un <button> dans un <a> est
    // invalide) ; il est superposé en absolu et neutralise la navigation.
    <div
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        featured
          ? "ring-2 ring-amber-400 hover:ring-amber-400"
          : "ring-1 ring-darna/5 hover:ring-darna/15"
      }`}
    >
      <Link href={`/annonce/${property.slug}${query}`} className="flex flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-darna/10">
          {photo ? (
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : null}
          {/* Quand le cœur est présent (end-3), on borne la rangée à end-14
              pour qu'elle retourne à la ligne avant la zone du cœur — sinon
              le dernier badge (Vérifié) passe dessous. */}
          <div
            className={`absolute start-3 top-3 flex flex-wrap gap-1.5 ${
              favorite ? "end-14" : ""
            }`}
          >
            {featured ? <FeaturedBadge small /> : null}
            {promoActive ? (
              <PromoBadge
                small
                price={property.price}
                promoPrice={property.promoPrice!}
                promoUntil={property.promoUntil!}
              />
            ) : null}
            {showType ? <TypeBadge type={property.type} /> : null}
            {property.verified ? (
              <VerifiedBadge
                small
                level={property.verificationLevel ?? null}
                verifierName={property.verifiedBy?.name}
                verifiedAt={property.verifiedAt}
              />
            ) : null}
          </div>
          <div className="absolute bottom-3 start-3">
            <FreshnessBadge publishedAt={property.publishedAt} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 font-semibold text-body">{property.title}</h3>
          <p className="flex items-center gap-1 text-sm text-muted">
            <MapPinIcon width={15} height={15} />
            {property.city}, {property.gouvernorat}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {property.surface ? (
              <span className="flex items-center gap-1">
                <RulerIcon width={14} height={14} />
                {fr.property.surface(property.surface)}
              </span>
            ) : null}
            {property.rooms ? (
              <span className="flex items-center gap-1">
                <DoorIcon width={14} height={14} />
                {fr.property.pieces(property.rooms)}
              </span>
            ) : null}
            {property.type === "SEJOUR" && property.stay?.maxGuests ? (
              <span className="flex items-center gap-1">
                <UsersIcon width={14} height={14} />
                {fr.property.capacite(property.stay.maxGuests)}
              </span>
            ) : null}
          </div>
          <div className="mt-auto pt-1">
            <PromoPrice
              price={property.price}
              promoPrice={property.promoPrice}
              promoUntil={property.promoUntil}
              verified={property.verified}
              suffix={priceSuffix(property.type)}
              className="text-lg font-bold text-heading"
            />
            {stayTotal !== null ? (
              <p className="mt-0.5 text-xs text-muted">
                <Price amount={stayTotal} className="font-semibold text-body/80" />{" "}
                {fr.search.totalSejour(nights!)}
              </p>
            ) : null}
          </div>
        </div>
      </Link>

      {favorite ? (
        <FavoriteButton
          propertyId={property.id}
          city={property.city}
          isFavorited={favorite.isFavorited}
          folders={favorite.folders}
          defaultDate={favorite.defaultDate}
          size="sm"
          className="absolute end-3 top-3 z-10"
        />
      ) : null}
    </div>
  );
}
