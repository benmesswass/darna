import Image from "next/image";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import type { ListingWithPhoto } from "@/lib/listings";
import { isListingFeatured } from "@/lib/listings";
import type { FavoriteCardProp } from "@/lib/favorites";
import { Price } from "@/components/currency/Price";
import { FavoriteButton } from "./FavoriteButton";
import { FeaturedBadge, FreshnessBadge, TypeBadge, VerifiedBadge } from "./Badges";
import { DoorIcon, MapPinIcon, RulerIcon, UsersIcon } from "@/components/icons";

export async function PropertyCard({
  property,
  showType = false,
  favorite,
}: {
  property: ListingWithPhoto;
  showType?: boolean;
  // Fourni uniquement pour un utilisateur connecté → affiche le cœur favori.
  favorite?: FavoriteCardProp;
}) {
  const fr = await getT();
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
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        featured
          ? "ring-2 ring-amber-400 hover:ring-amber-400"
          : "ring-1 ring-darna/5 hover:ring-darna/15"
      }`}
    >
      <Link href={`/annonce/${property.slug}`} className="flex flex-1 flex-col">
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
          <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
            {featured ? <FeaturedBadge small /> : null}
            {showType ? <TypeBadge type={property.type} /> : null}
            {property.verified ? <VerifiedBadge small /> : null}
          </div>
          <div className="absolute bottom-3 start-3">
            <FreshnessBadge publishedAt={property.publishedAt} />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">{property.title}</h3>
          <p className="flex items-center gap-1 text-sm text-ink/60">
            <MapPinIcon width={15} height={15} />
            {property.city}, {property.gouvernorat}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
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
            {property.type === "SEJOUR" && property.maxGuests ? (
              <span className="flex items-center gap-1">
                <UsersIcon width={14} height={14} />
                {fr.property.capacite(property.maxGuests)}
              </span>
            ) : null}
          </div>
          <div className="mt-auto pt-1">
            <Price
              amount={property.price}
              suffix={priceSuffix(property.type)}
              className="text-lg font-bold text-darna"
            />
          </div>
        </div>
      </Link>

      {favorite ? (
        <FavoriteButton
          propertyId={property.id}
          city={property.city}
          isFavorited={favorite.isFavorited}
          folders={favorite.folders}
          size="sm"
          className="absolute end-3 top-3 z-10"
        />
      ) : null}
    </div>
  );
}
