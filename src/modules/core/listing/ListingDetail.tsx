import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/server";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { markerPriceLabel } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { PropertyMap } from "@/components/map/PropertyMap";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import {
  FreshnessBadge,
  StatusBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/property/Badges";
import {
  CheckIcon,
  DoorIcon,
  MapPinIcon,
  RulerIcon,
  ShieldIcon,
  StarIcon,
} from "@/components/icons";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPropertyJsonLd } from "@/lib/structured-data";
import { Caracteristique } from "@/modules/core/listing/Caracteristique";
import type {
  ListingData,
  ListingFavCtx,
} from "@/modules/core/listing/types";

/**
 * Coque PARTAGÉE de la fiche annonce, rendue à l'identique pour les deux
 * verticales. Tout ce qui diffère entre Séjour et Immo est injecté en slot par
 * StayDetail / ImmoDetail (modules) — le noyau ne connaît AUCUNE verticale.
 *
 * Le point d'entrée /annonce/[slug] résout le slug + le contexte visiteur puis
 * dispatche vers StayDetail ou ImmoDetail, qui composent ce composant.
 */
export async function ListingDetail({
  property,
  favCtx,
  arrivee,
  activeSection,
  priceSuffix,
  eligibleBookingId,
  characteristicsExtra,
  afterAmenities,
  afterLocation,
  belowPrice,
  cta,
}: {
  property: ListingData;
  favCtx: ListingFavCtx;
  /** Date d'arrivée recherchée, propagée au sélecteur de favori. */
  arrivee?: string;
  /** Garde la nav + l'accent sur la bonne verticale (route hors-section). */
  activeSection: "sejours" | "immobilier";
  priceSuffix?: string;
  /** Réservation éligible à un avis (séjour terminé sans avis) — séjour only. */
  eligibleBookingId?: string;
  /** Caractéristiques supplémentaires (ex. capacité séjour). */
  characteristicsExtra?: ReactNode;
  /** Section insérée après les équipements (ex. calendrier séjour). */
  afterAmenities?: ReactNode;
  /** Section insérée après la localisation (ex. contact immo). */
  afterLocation?: ReactNode;
  /** Contenu sous le prix dans l'encart (ex. info frais de service séjour). */
  belowPrice?: ReactNode;
  /** Appel à l'action de la verticale (Réserver / Contacter). */
  cta: ReactNode;
}) {
  const fr = await getT();

  const isActive =
    property.status === "ACTIVE" && property.expiresAt.getTime() > Date.now();
  const amenities = property.amenities ? property.amenities.split("|") : [];
  const avgRating =
    property.reviews.length > 0
      ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
        property.reviews.length
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={buildPropertyJsonLd(property)} />
      {/* Garde la nav + l'accent sur la bonne verticale (route hors-section). */}
      <ActiveSection name={activeSection} />
      {!isActive ? (
        <div className="mb-6 rounded-2xl bg-ink px-5 py-4 text-sm font-medium text-white">
          {fr.property.annonceIndisponible}
        </div>
      ) : null}

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={property.type} />
            {property.verified ? <VerifiedBadge /> : null}
            <StatusBadge status={property.status} />
            <FreshnessBadge publishedAt={property.publishedAt} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-darna">{property.title}</h1>
            {favCtx ? (
              <FavoriteButton
                propertyId={property.id}
                city={property.city}
                isFavorited={favCtx.favoritedIds.has(property.id)}
                folders={favCtx.folders}
                defaultDate={arrivee}
              />
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-ink/60">
            <MapPinIcon width={16} height={16} />
            {property.address ? `${property.address} — ` : ""}
            {property.city}, {property.gouvernorat}
          </p>
        </div>
        <div className="text-end">
          <Price
            amount={property.price}
            suffix={priceSuffix}
            className="text-3xl font-bold text-darna"
          />
          {avgRating ? (
            <a
              href="#avis"
              aria-label={fr.property.voirAvis}
              title={fr.property.voirAvis}
              className="mt-1 inline-flex items-center justify-end gap-1 rounded-full text-sm text-ink/70 underline-offset-4 transition hover:text-darna hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darna/40"
            >
              <StarIcon width={15} height={15} fill="currentColor" className="text-sand" />
              {avgRating.toFixed(1)} · {fr.property.nbAvis(property.reviews.length)}
            </a>
          ) : null}
        </div>
      </div>

      {/* Galerie immersive (clic → lightbox plein écran) */}
      <PropertyGallery
        title={property.title}
        images={property.photos.map((photo) => ({
          url: photo.url,
          alt: photo.alt,
          caption: photo.caption,
        }))}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-10">
          {/* Caractéristiques */}
          <section>
            <h2 className="text-xl font-bold text-darna">
              {fr.property.caracteristiques}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {property.surface ? (
                <Caracteristique
                  icon={<RulerIcon />}
                  label={fr.property.surface(property.surface)}
                />
              ) : null}
              {property.rooms ? (
                <Caracteristique
                  icon={<DoorIcon />}
                  label={fr.property.pieces(property.rooms)}
                />
              ) : null}
              {characteristicsExtra}
            </div>
          </section>

          {/* Description */}
          <section>
            <h2 className="text-xl font-bold text-darna">{fr.property.description}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/80">
              {property.description}
            </p>
          </section>

          {/* Équipements */}
          {amenities.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold text-darna">
                {fr.property.equipements}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink/80 ring-1 ring-darna/10"
                  >
                    <CheckIcon width={14} height={14} className="text-darna" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {/* Section spécifique verticale insérée après les équipements
              (ex. calendrier de disponibilités côté séjour). */}
          {afterAmenities}

          {/* Localisation */}
          <section>
            <h2 className="text-xl font-bold text-darna">{fr.property.localisation}</h2>
            <div className="mt-4 h-72 overflow-hidden rounded-3xl ring-1 ring-darna/10">
              <PropertyMap
                markers={[
                  {
                    id: property.id,
                    slug: property.slug,
                    title: property.title,
                    priceLabel: markerPriceLabel(property.price, property.type),
                    verified: property.verified,
                    latitude: property.latitude,
                    longitude: property.longitude,
                  },
                ]}
              />
            </div>
          </section>

          {/* Section spécifique verticale insérée après la localisation
              (ex. contact direct côté location / vente). */}
          {afterLocation}

          {/* Avis — uniquement de voyageurs ayant réservé */}
          <ReviewsSection
            propertyId={property.id}
            propertyType={property.type}
            eligibleBookingId={eligibleBookingId}
            reviews={property.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              authorName: r.author.name,
              createdAt: r.createdAt.toISOString(),
            }))}
          />
        </div>

        {/* Encart latéral : prix + actions + confiance */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-darna/10">
            <Price
              amount={property.price}
              suffix={priceSuffix}
              className="text-2xl font-bold text-darna"
            />
            {belowPrice}

            {cta}

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-cream p-3.5 text-xs leading-relaxed text-ink/70">
              <ShieldIcon width={26} height={26} className="shrink-0 text-darna" />
              {property.verified
                ? fr.property.verifieTooltip
                : fr.property.nonVerifieTooltip}
            </div>
          </div>

          {/* Annonceur */}
          <div className="rounded-3xl bg-white p-6 ring-1 ring-darna/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">
              {property.owner.role === "AGENCE"
                ? fr.property.agence
                : fr.property.proprietaire}
            </p>
            <p className="mt-1 font-semibold text-ink">{property.owner.name}</p>
            {property.owner.kycStatus === "VERIFIE" ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-darna/5 px-2.5 py-1 text-xs font-medium text-darna">
                <CheckIcon width={12} height={12} strokeWidth={3} />
                {fr.kyc.statutVerifie}
              </p>
            ) : property.owner.kycStatus === "DEMO_VERIFIE" ? (
              // Badge DÉMO distinct (couleur neutre, libellé explicite) : ne jamais
              // afficher une confiance « vérifié réel » pour une vérification de démo.
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-ink/55">
                <CheckIcon width={12} height={12} strokeWidth={3} />
                {fr.kyc.statutVerifieDemo}
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
