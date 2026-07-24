import type { ReactNode } from "react";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { ShareButton } from "@/components/property/ShareButton";
import { markerPriceLabel } from "@/lib/format";
import { SITE_URL } from "@/lib/config";
import { PropertyMap } from "@/components/map/PropertyMap";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import {
  FreshnessBadge,
  PromoBadge,
  StatusBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/property/Badges";
import { PromoPrice } from "@/components/property/PromoPrice";
import { isPropertyPromoActive } from "@/lib/listings";
import {
  CheckIcon,
  ClockIcon,
  DoorIcon,
  MapPinIcon,
  RulerIcon,
  ShieldIcon,
  StarIcon,
  UsersIcon,
} from "@/components/icons";
import { RatingStars } from "@/components/property/RatingStars";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { PropertyCard } from "@/components/property/PropertyCard";
import { SimilarListingsCarousel } from "@/components/property/SimilarListingsCarousel";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPropertyJsonLd } from "@/lib/structured-data";
import { getSimilarListings } from "@/lib/listings";
import { blendedRatingStats } from "@/lib/rating";
import { favoritePropFor } from "@/lib/favorites";
import { getAnonId, logProductEvent } from "@/lib/product-events";
import { getSessionUser } from "@/lib/session";
import {
  computeListingActivitySignal,
  getLastConfirmedBookingDate,
} from "@/lib/listing-activity";
import { ListingActivityTracker } from "@/components/property/ListingActivityTracker";
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
  // Prix promo hôte actif (CROISSANCE_ROADMAP.md §PM1) — badge + prix barré.
  const promoActive =
    property.verified && isPropertyPromoActive(property.promoUntil) && property.promoPrice !== null;
  const amenities = property.amenities ? property.amenities.split("|") : [];
  // §AHC7 — la note affichée en tête de fiche intègre les annulations hôte
  // récentes (note automatique 1/5, cf. src/lib/rating.ts) : même chiffre que
  // celui recalculé dans ReviewsList, pour ne jamais afficher deux moyennes
  // différentes sur la même page. Les données structurées SEO (JsonLd
  // ci-dessous) restent volontairement sur les vrais avis uniquement.
  const ratingStats = blendedRatingStats(property.reviews, property.hostCancellations.length);
  const avgRating = ratingStats.total > 0 ? ratingStats.average : null;
  const reviewCount = ratingStats.total;
  const similarListings = await getSimilarListings(property);

  // Instrumentation produit (INSTRUMENTATION_ROADMAP.md §IN0) — uniquement les
  // vues d'annonces réellement publiques : une prévisualisation par son propre
  // hôte pendant EN_ATTENTE_VALIDATION n'est pas de l'intérêt visiteur.
  if (isActive) {
    const [viewer, anonId] = await Promise.all([getSessionUser(), getAnonId()]);
    await logProductEvent({
      event: "LISTING_VIEWED",
      userId: viewer?.id ?? null,
      anonId,
      metadata: { propertyId: property.id, vertical: property.vertical },
    });
  }

  // Signal de dynamique temps réel (GROWTH_ROADMAP.md §G5) — « dernière
  // réservation » n'a de sens que pour SEJOUR (LOCATION/VENTE = mise en
  // relation, pas de réservation).
  const lastBookedAt =
    isActive && property.type === "SEJOUR"
      ? await getLastConfirmedBookingDate(property.id)
      : null;
  const activitySignal = computeListingActivitySignal({
    viewCount: property.viewCount,
    lastBookedAt,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={buildPropertyJsonLd(property)} />
      {/* Garde la nav + l'accent sur la bonne verticale (route hors-section). */}
      <ActiveSection name={activeSection} />
      {isActive ? <ListingActivityTracker propertyId={property.id} /> : null}
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
            {promoActive ? (
              <PromoBadge
                price={property.price}
                promoPrice={property.promoPrice!}
                promoUntil={property.promoUntil!}
              />
            ) : null}
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
            <h1 className="text-3xl font-bold text-heading">{property.title}</h1>
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
          <p className="mt-1 flex items-center gap-1.5 text-body/60">
            <MapPinIcon width={16} height={16} />
            {property.address ? `${property.address} — ` : ""}
            {property.city}, {property.gouvernorat}
          </p>
        </div>
        <div className="text-end">
          <PromoPrice
            price={property.price}
            promoPrice={property.promoPrice}
            promoUntil={property.promoUntil}
            verified={property.verified}
            suffix={priceSuffix}
            className="text-3xl font-bold text-heading"
          />
          {avgRating ? (
            <a
              href="#avis"
              aria-label={fr.property.voirAvis}
              title={fr.property.voirAvis}
              className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-heading underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-darna/40"
            >
              <RatingStars rating={avgRating} size={22} />
              {avgRating.toFixed(1)} · {fr.property.nbAvis(reviewCount)}
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
              {/* Texte fixe (non adaptatif) : ce bloc reste sur un fond clair
                  (ambre/bleu) quel que soit le thème, cf. globals.css. */}
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
            <h2 className="text-xl font-bold text-heading">
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
            <h2 className="text-xl font-bold text-heading">{fr.property.description}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-body/80">
              {property.description}
            </p>
          </section>

          {/* Équipements */}
          {amenities.length > 0 ? (
            <section>
              <h2 className="text-xl font-bold text-heading">
                {fr.property.equipements}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm text-body/80 ring-1 ring-darna/10"
                  >
                    <CheckIcon width={14} height={14} className="text-heading" />
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
            <h2 className="text-xl font-bold text-heading">{fr.property.localisation}</h2>
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
                    reviewCount,
                    city: property.city,
                  },
                ]}
              />
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-darna/15 px-4 py-2 text-sm font-semibold text-heading transition hover:bg-darna/5"
            >
              <MapPinIcon width={16} height={16} />
              {fr.property.ouvrirGoogleMaps}
            </a>
          </section>

          {/* Section spécifique verticale insérée après la localisation
              (ex. contact direct côté location / vente). */}
          {afterLocation}

          {/* Avis — uniquement de voyageurs ayant réservé, + entrées système
              « annulé par l'hôte » (§AHC7). */}
          <ReviewsSection
            propertyId={property.id}
            propertyType={property.type}
            eligibleBookingId={eligibleBookingId}
            reviews={property.reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              proprete: r.proprete,
              communication: r.communication,
              conformite: r.conformite,
              qualitePrix: r.qualitePrix,
              comment: r.comment,
              authorName: r.author.name,
              createdAt: r.createdAt.toISOString(),
            }))}
            cancellations={property.hostCancellations}
          />
        </div>

        {/* Encart latéral : prix + actions + confiance */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-darna/10">
            <PromoPrice
              price={property.price}
              promoPrice={property.promoPrice}
              promoUntil={property.promoUntil}
              verified={property.verified}
              suffix={priceSuffix}
              className="text-2xl font-bold text-heading"
            />
            {belowPrice}

            {activitySignal.viewCount || activitySignal.lastBookedDaysAgo !== null ? (
              <div className="mt-3 space-y-1.5">
                {activitySignal.viewCount ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-body/60">
                    <UsersIcon width={14} height={14} className="shrink-0 text-darna" />
                    {fr.property.activiteVues(activitySignal.viewCount)}
                  </p>
                ) : null}
                {activitySignal.lastBookedDaysAgo !== null ? (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-body/60">
                    <ClockIcon width={14} height={14} className="shrink-0 text-darna" />
                    {fr.property.activiteDerniereResa(activitySignal.lastBookedDaysAgo)}
                  </p>
                ) : null}
              </div>
            ) : null}

            {cta}

            <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-cream p-3.5 text-xs leading-relaxed text-body/70">
              <ShieldIcon width={26} height={26} className="shrink-0 text-heading" />
              {property.verified
                ? fr.property.verifieTooltip
                : fr.property.nonVerifieTooltip}
            </div>
          </div>

          {/* Annonceur */}
          <div className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-body/40">
              {property.owner.role === "AGENCE"
                ? fr.property.agence
                : fr.property.proprietaire}
            </p>
            {anonymizeOwner ? (
              <p className="mt-1 font-semibold text-body">{fr.property.hoteMasque}</p>
            ) : (
              // Lien vers la fiche hôte publique — jamais affiché tant que
              // l'identité est masquée (anti-bypass, cf. anonymizeOwner).
              <Link
                href={`/hote/${property.owner.id}`}
                className="mt-1 inline-block font-semibold text-body underline-offset-4 hover:text-heading hover:underline"
              >
                {property.owner.name}
              </Link>
            )}
            {/* Réputation : affichée même hôte masqué, ce n'est pas une
                donnée d'identité (contrairement au nom/contact). */}
            {property.owner.ratingCount > 0 ? (
              <p className="mt-1 flex items-center gap-1 text-sm text-body/70">
                <StarIcon width={14} height={14} fill="currentColor" className="text-sand" />
                {property.owner.ratingAvg!.toFixed(1)} ·{" "}
                {fr.property.nbAvis(property.owner.ratingCount)}
              </p>
            ) : null}
            {property.owner.kycStatus === "VERIFIE" ? (
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-darna/5 px-2.5 py-1 text-xs font-medium text-heading">
                <CheckIcon width={12} height={12} strokeWidth={3} />
                {fr.kyc.statutVerifie}
              </p>
            ) : property.owner.kycStatus === "DEMO_VERIFIE" ? (
              // Badge DÉMO distinct (couleur neutre, libellé explicite) : ne jamais
              // afficher une confiance « vérifié réel » pour une vérification de démo.
              <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs font-medium text-body/55">
                <CheckIcon width={12} height={12} strokeWidth={3} />
                {fr.kyc.statutVerifieDemo}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Annonces similaires : même ville + même type, hors l'annonce
          courante — invite à continuer de parcourir sans repartir de la
          recherche. Masquée s'il n'y a rien de comparable. */}
      {similarListings.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-heading">
            {fr.property.annoncesSimilaires}
          </h2>
          <SimilarListingsCarousel className="mt-4">
            {similarListings.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                favorite={favoritePropFor(favCtx, p.id, arrivee)}
              />
            ))}
          </SimilarListingsCarousel>
        </section>
      ) : null}
    </div>
  );
}
