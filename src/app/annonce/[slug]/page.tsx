import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { buildUnavailableDates, getPropertyBySlug } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext } from "@/lib/favorites";
import { FavoriteButton } from "@/components/property/FavoriteButton";
import { markerPriceLabel } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { PropertyMap } from "@/components/map/PropertyMap";
import { PropertyGallery } from "@/components/property/PropertyGallery";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
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
  UsersIcon,
} from "@/components/icons";
import { PropertyCtas, toWhatsAppNumber } from "@/components/property/PropertyCtas";
import { ReviewsSection } from "@/components/property/ReviewsSection";
import { ContactForm } from "@/components/property/ContactForm";
import { ActiveSection } from "@/components/layout/ActiveSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPropertyJsonLd } from "@/lib/structured-data";
import { formatTndServer } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      city: true,
      price: true,
      type: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  // Résolu avant le début du streaming → vrai statut HTTP 404.
  if (!property) notFound();

  const suffix =
    property.type === "SEJOUR"
      ? ` ${frMeta.common.parNuit}`
      : property.type === "LOCATION"
        ? ` ${frMeta.common.parMois}`
        : "";
  const title = `${property.title} — ${property.city}, ${formatTndServer(property.price)}${suffix}`;
  const description = property.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/annonce/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_TN",
      images: property.photos[0] ? [{ url: property.photos[0].url }] : undefined,
    },
  };
}

export default async function AnnoncePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  // Dates de recherche transmises depuis la liste séjours (arrivee=YYYY-MM-DD) :
  // sert à pré-remplir le nom de dossier favori avec le mois recherché.
  searchParams: Promise<{ arrivee?: string }>;
}) {
  const fr = await getT();
  const { slug } = await params;
  const { arrivee } = await searchParams;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const user = await getSessionUser();
  const favCtx = await getFavoriteContext(user?.id);

  // Avis possible uniquement après un séjour confirmé et terminé, sans avis existant.
  const eligibleBooking =
    user && property.type === "SEJOUR"
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
  const isSejour = property.type === "SEJOUR";
  const amenities = property.amenities ? property.amenities.split("|") : [];
  const avgRating =
    property.reviews.length > 0
      ? property.reviews.reduce((sum, r) => sum + r.rating, 0) /
        property.reviews.length
      : null;

  const unavailable = buildUnavailableDates([
    ...property.bookings.map((b) => ({ start: b.checkIn, end: b.checkOut })),
    ...property.availabilities.map((a) => ({ start: a.startDate, end: a.endDate })),
  ]);

  const priceSuffix = isSejour
    ? fr.common.parNuit
    : property.type === "LOCATION"
      ? fr.common.parMois
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={buildPropertyJsonLd(property)} />
      {/* Garde la nav + l'accent sur la bonne verticale (route hors-section). */}
      <ActiveSection name={isSejour ? "sejours" : "immobilier"} />
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
              {isSejour && property.maxGuests ? (
                <Caracteristique
                  icon={<UsersIcon />}
                  label={fr.property.capacite(property.maxGuests)}
                />
              ) : null}
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

          {/* Calendrier (séjours uniquement) */}
          {isSejour ? (
            <section>
              <h2 className="text-xl font-bold text-darna">
                {fr.property.disponibilites}
              </h2>
              <div className="mt-4 rounded-3xl bg-white p-5 ring-1 ring-darna/10">
                <AvailabilityCalendar unavailable={unavailable} />
              </div>
            </section>
          ) : null}

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

          {/* Contact direct (location / vente) */}
          {!isSejour && isActive ? (
            <section id="contact">
              <h2 className="text-xl font-bold text-darna">{fr.contact.titre}</h2>
              <div className="mt-4 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
                <ContactForm
                  propertyId={property.id}
                  propertyTitle={property.title}
                  whatsappHref={
                    property.owner.phone
                      ? `https://wa.me/${toWhatsAppNumber(property.owner.phone)}?text=${encodeURIComponent(
                          fr.property.partagerWhatsapp(
                            property.title,
                            markerPriceLabel(property.price, property.type)
                          )
                        )}`
                      : null
                  }
                  defaults={{
                    name: user?.name ?? "",
                    email: user?.email ?? "",
                    phone: user?.phone ?? "",
                  }}
                />
              </div>
            </section>
          ) : null}

          {/* Avis — uniquement de voyageurs ayant réservé */}
          <ReviewsSection
            propertyId={property.id}
            propertyType={property.type}
            eligibleBookingId={eligibleBooking?.id}
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
            {isSejour ? (
              <p className="mt-1 text-xs text-ink/50">{fr.property.fraisServiceInfo}</p>
            ) : null}

            <PropertyCtas
              slug={property.slug}
              type={property.type}
              title={property.title}
              priceLabel={markerPriceLabel(property.price, property.type)}
              ownerPhone={property.owner.phone}
              active={isActive}
            />

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

function Caracteristique({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-ink/80 ring-1 ring-darna/10">
      <span className="text-darna">{icon}</span>
      {label}
    </div>
  );
}
