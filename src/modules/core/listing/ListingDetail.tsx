import type { ReactNode } from "react";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { ShareButton } from "@/components/property/ShareButton";
import { markerPriceLabel } from "@/lib/format";
import { SITE_URL } from "@/lib/config";
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
  anonymizeOwner = false,
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
  /**
   * Masque l'IDENTITÉ de l'hôte (nom) dans l'encart annonceur — séjours only.
   * Anti-bypass : le nom n'est révélé qu'après réservation confirmée. On garde
   * le rôle + le badge de vérification (trust) sans la donnée personnelle.
   */
  anonymizeOwner?: boolean;
}) {
  const fr = await getT();

  const isPending = property.status === "EN_ATTENTE_VALIDATION";
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
      {isPending ? (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 text-sm font-medium text-amber-800">
          {fr.property.annonceEnAttente}
        </div>
      ) : !isActive ? (
        <div className="mb-6 rounded-2xl bg-ink px-5 py-4 text-sm font-medium text-white">
          {fr.property.annonceIndisponible}
        </div>
      ) : null}

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={property.type} />
            {property.verified ? (
              <VerifiedBadge
                level={property.verificationLevel}
                verifierName={property.verifiedBy?.name}
                verifiedAt={property.verifiedAt}
              />
            ) : null}
            <StatusBadge status={property.status} />
            <FreshnessBadge publishedAt={property.publishedAt} />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-darna">{property.title}</h1>
            <ShareButton
              title={property.title}
              url={`${SITE_URL}/annonce/${property.slug}`}
            />
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

      {/* ── Bloc confiance ─────────────────────────────────────────────── */}
      {property.verificationLevel ? (
        <div
          className={`mt-6 rounded-2xl border-2 p-5 ${
            property.verificationLevel === "ON_SITE"
              ? "border-amber-300 bg-amber-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl leading-none">
              {property.verificationLevel === "ON_SITE" ? "🏅" : "🛡️"}
            </span>
            <div className="flex-1">
              <p className="font-bold text-ink">
                {property.verificationLevel === "ON_SITE"
                  ? fr.badges.verifieOnSite
                  : fr.badges.verifieRemote}
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink/50">
                {property.verificationLevel === "ON_SITE"
                  ? fr.property.verifieOnSiteCriteres
                  : fr.property.verifieRemoteCriteres}
              </p>
              {property.verifiedBy && property.verifiedAt ? (
                <p className="mt-0.5 text-xs text-ink/50">
                  {fr.property.verifiePar(property.verifiedBy.name)} ·{" "}
                  {property.verifiedAt.toLocaleDateString("fr-TN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-ink/70">
                {property.verificationLevel === "ON_SITE"
                  ? fr.property.verifieOnSiteBloc
                  : fr.property.verifieRemoteBloc}
              </p>
              <a
                href="/devenir-wakil"
                className="mt-2 inline-block text-xs font-semibold underline underline-offset-2 text-ink/50 hover:text-darna"
              >
                {property.verificationLevel === "ON_SITE"
                  ? fr.property.enSavoirPlusWakil
                  : fr.property.enSavoirPlusDarna}
              </a>
            </div>
          </div>
        </div>
      ) : null}

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
                    price: property.price,
                    verified: property.verified,
                    latitude: property.latitude,
                    longitude: property.longitude,
                    imageUrl: property.photos[0]?.url ?? null,
                    rating: avgRating,
                    reviewCount: property.reviews.length,
                    city: property.city,
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
            {anonymizeOwner ? (
              <p className="mt-1 font-semibold text-ink">{fr.property.hoteMasque}</p>
            ) : (
              // Lien vers la fiche hôte publique — jamais affiché tant que
              // l'identité est masquée (anti-bypass, cf. anonymizeOwner).
              <Link
                href={`/hote/${property.owner.id}`}
                className="mt-1 inline-block font-semibold text-ink underline-offset-4 hover:text-darna hover:underline"
              >
                {property.owner.name}
              </Link>
            )}
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
