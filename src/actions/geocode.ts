"use server";

import { nearestCity, resolveCity } from "@/lib/geo";

export type AddressSuggestion = {
  /** Libellé lisible présenté à l'hôte (« 12 Rue de la Plage, Hammamet »). */
  label: string;
  latitude: number;
  longitude: number;
  /** Ville du référentiel Darna rattachée — synchronise le menu ville. */
  city: string;
};

// Cadre géographique : Tunisie (ouest, sud, est, nord) — biaise ET filtre.
const TUNISIA_BBOX = "7.5,30.2,11.6,37.5";
const TUNISIA_CENTER = { lat: "34.0", lon: "9.5" };
const PHOTON_URL = "https://photon.komoot.io/api";

type PhotonProperties = {
  name?: string;
  housenumber?: string;
  street?: string;
  city?: string;
  district?: string;
  county?: string;
  state?: string;
  postcode?: string;
  countrycode?: string;
};
type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: PhotonProperties;
};

/** Construit un libellé lisible « rue / lieu, ville » à partir d'un résultat. */
function buildLabel(p: PhotonProperties): string {
  const line1 = [p.housenumber, p.street].filter(Boolean).join(" ") || p.name || "";
  const locality = p.city || p.district || p.county || "";
  const parts = [line1, locality].map((s) => s.trim()).filter(Boolean);
  // Dédoublonne (ex. « Hammamet, Hammamet »).
  const unique = parts.filter((s, i) => parts.indexOf(s) === i);
  return unique.join(", ").slice(0, 200);
}

/**
 * Autocomplétion d'adresse via Photon (OpenStreetMap) — gratuit, sans clé.
 * Appel côté serveur : User-Agent propre (fair-use) et aucun domaine externe
 * à autoriser dans la CSP du navigateur. Résultats biaisés et filtrés sur la
 * Tunisie ; chaque suggestion est rattachée à une ville du référentiel Darna
 * (recherche et index Postgres en dépendent).
 */
export async function searchAddressAction(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "fr");
  url.searchParams.set("limit", "6");
  url.searchParams.set("bbox", TUNISIA_BBOX);
  url.searchParams.set("lat", TUNISIA_CENTER.lat);
  url.searchParams.set("lon", TUNISIA_CENTER.lon);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Darna/1.0 (+https://darna.tn)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: PhotonFeature[] };

    const seen = new Set<string>();
    const out: AddressSuggestion[] = [];
    for (const f of data.features ?? []) {
      const p = f.properties ?? {};
      // Photon ne filtre pas strictement par pays : on ne garde que la Tunisie.
      if (p.countrycode && p.countrycode !== "TN") continue;
      const [lon, lat] = f.geometry?.coordinates ?? [];
      if (typeof lat !== "number" || typeof lon !== "number") continue;
      const label = buildLabel(p);
      if (!label || seen.has(label)) continue;
      seen.add(label);
      out.push({
        label,
        latitude: lat,
        longitude: lon,
        city: (p.city ? resolveCity(p.city) : null) ?? nearestCity(lat, lon).name,
      });
    }
    return out.slice(0, 6);
  } catch {
    // Photon indisponible / requête annulée : l'hôte garde le menu ville + le repère.
    return [];
  } finally {
    clearTimeout(timeout);
  }
}
