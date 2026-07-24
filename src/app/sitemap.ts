import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { activeListingWhere } from "@/lib/listings";
import { SITE_URL } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/sejours`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/immobilier`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/prix-du-marche`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/combien-gagner`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/diaspora`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/devenir-wakil`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/confidentialite`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // Seules les annonces actives et non expirées sont indexables. Borné à la
  // limite Google d'un fichier sitemap (50 000 URL) — au-delà, passer à un
  // index de sitemaps paginés. Les plus récentes d'abord.
  const properties = await prisma.property.findMany({
    where: activeListingWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 50_000 - staticPages.length,
  });

  // Fiches hôte publiques : un hôte par annonce active, dédupliqué (groupBy).
  const hosts = await prisma.property.groupBy({
    by: ["ownerId"],
    where: activeListingWhere(),
  });

  return [
    ...staticPages,
    ...properties.map((p) => ({
      url: `${SITE_URL}/annonce/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...hosts.map((h) => ({
      url: `${SITE_URL}/hote/${h.ownerId}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
