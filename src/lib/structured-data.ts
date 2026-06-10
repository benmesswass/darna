import { SITE_URL } from "@/lib/config";

type PropertyForJsonLd = {
  slug: string;
  title: string;
  description: string;
  type: string;
  price: number;
  city: string;
  gouvernorat: string;
  address: string | null;
  latitude: number;
  longitude: number;
  surface: number | null;
  rooms: number | null;
  maxGuests: number | null;
  photos: { url: string }[];
  reviews: { rating: number }[];
};

/**
 * JSON-LD schema.org : `Accommodation` pour les séjours,
 * `RealEstateListing` pour la location longue durée et la vente.
 */
export function buildPropertyJsonLd(
  property: PropertyForJsonLd
): Record<string, unknown> {
  const url = `${SITE_URL}/annonce/${property.slug}`;
  const images = property.photos.map((p) => `${SITE_URL}${p.url}`);

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    name: property.title,
    description: property.description,
    url,
    image: images,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address ?? undefined,
      addressLocality: property.city,
      addressRegion: property.gouvernorat,
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: property.latitude,
      longitude: property.longitude,
    },
  };

  if (property.surface) {
    base.floorSize = {
      "@type": "QuantitativeValue",
      value: property.surface,
      unitCode: "MTK",
    };
  }
  if (property.rooms) base.numberOfRooms = property.rooms;

  if (property.reviews.length > 0) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(
        (
          property.reviews.reduce((s, r) => s + r.rating, 0) /
          property.reviews.length
        ).toFixed(1)
      ),
      reviewCount: property.reviews.length,
      bestRating: 5,
    };
  }

  if (property.type === "SEJOUR") {
    return {
      ...base,
      "@type": "Accommodation",
      occupancy: property.maxGuests
        ? { "@type": "QuantitativeValue", maxValue: property.maxGuests }
        : undefined,
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: "TND",
        unitText: "nuit",
        availability: "https://schema.org/InStock",
      },
    };
  }

  return {
    ...base,
    "@type": "RealEstateListing",
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "TND",
      ...(property.type === "LOCATION" ? { unitText: "mois" } : {}),
      availability: "https://schema.org/InStock",
    },
  };
}
