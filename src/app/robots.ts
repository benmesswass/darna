import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** Domaine canonique de production (LANCEMENT_ROADMAP.md §L6) — tout SITE_URL différent (staging, preview) est traité comme non public. */
const PRODUCTION_SITE_URL = "https://darna.tn";

export default function robots(): MetadataRoute.Robots {
  // Staging/preview : jamais indexé, quel que soit le contenu (données de
  // démo). Seul le domaine de production exact ouvre l'indexation.
  if (SITE_URL !== PRODUCTION_SITE_URL) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api",
        "/reservation",
        "/contrat",
        "/connexion",
        "/inscription",
        "/voyageur",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
