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
    { url: `${SITE_URL}/diaspora`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/devenir-wakil`, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Seules les annonces actives et non expirées sont indexables.
  const properties = await prisma.property.findMany({
    where: activeListingWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  return [
    ...staticPages,
    ...properties.map((p) => ({
      url: `${SITE_URL}/annonce/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
