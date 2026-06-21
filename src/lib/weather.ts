/**
 * Météo destination (module SERVEUR uniquement — ne jamais importer côté client).
 *
 * Deux modes, comme les autres briques Phase 2 :
 *  - **repli** par défaut (aucune config) : météo saisonnière statique par mois,
 *    suffisante pour la démo hors-ligne et zéro service externe ;
 *  - **live** quand `WEATHER_MODE=live` : appel Open-Meteo (gratuit, sans clé)
 *    avec timeout court ; en cas d'échec on retombe sur le repli saisonnier.
 *
 * Le but produit est l'inspiration (« il fait beau là-bas, allez-y ») : une
 * valeur approchée et toujours disponible vaut mieux qu'un trou.
 */
import { getCity } from "@/lib/geo";

export type WeatherCondition = "clear" | "clouds" | "rain";

export type CityWeather = {
  tempC: number;
  condition: WeatherCondition;
  /** `live` = Open-Meteo ; `seasonal` = repli statique. */
  source: "live" | "seasonal";
};

/** Prévision agrégée sur une période (séjour recherché) : min/max + tendance. */
export type CityForecast = {
  tempMin: number;
  tempMax: number;
  condition: WeatherCondition;
  /** `live` = prévision Open-Meteo ; `seasonal` = moyenne mensuelle (hors horizon). */
  source: "live" | "seasonal";
};

/** Le mode live (appel réseau) est opt-in ; sinon repli saisonnier. */
export function isWeatherLive(): boolean {
  return process.env.WEATHER_MODE === "live";
}

/**
 * Températures moyennes mensuelles (°C) du littoral tunisien — repli quand le
 * live est coupé ou échoue. Index 0 = janvier. L'écart côte/intérieur est
 * négligeable à l'échelle « inspiration » ; on reste volontairement simple.
 */
const SEASONAL_TEMP_C = [16, 17, 19, 22, 26, 30, 33, 33, 30, 26, 21, 17];

function seasonalWeather(): CityWeather {
  const month = new Date().getMonth();
  const tempC = SEASONAL_TEMP_C[month] ?? 24;
  // Avril→octobre : grand soleil tunisien ; hiver : plutôt nuageux.
  const condition: WeatherCondition = month >= 3 && month <= 9 ? "clear" : "clouds";
  return { tempC, condition, source: "seasonal" };
}

/** Mappe un weather_code WMO (Open-Meteo) vers nos 3 catégories d'affichage. */
function conditionFromCode(code: number): WeatherCondition {
  if (code <= 1) return "clear"; // ciel clair / peu nuageux
  if (code <= 48) return "clouds"; // nuageux / brouillard
  return "rain"; // bruine, pluie, neige, orage
}

/**
 * Météo actuelle d'une ville canonique du référentiel. Renvoie toujours une
 * valeur (live si possible, sinon repli saisonnier), ou null si la ville est
 * inconnue (pas de coordonnées).
 */
export async function getCityWeather(cityName: string): Promise<CityWeather | null> {
  const city = getCity(cityName);
  if (!city) return null;
  if (!isWeatherLive()) return seasonalWeather();

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}` +
      `&longitude=${city.longitude}&current=temperature_2m,weather_code`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    // Cache 30 min : la météo bouge lentement, on ne martèle pas l'API.
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return seasonalWeather();
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (typeof temp !== "number" || typeof code !== "number") return seasonalWeather();
    return { tempC: Math.round(temp), condition: conditionFromCode(code), source: "live" };
  } catch {
    // Réseau coupé / timeout / API down → l'inspiration reste affichée.
    return seasonalWeather();
  }
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Horizon de prévision journalière d'Open-Meteo (~16 jours). */
const FORECAST_HORIZON_DAYS = 15;

function monthFromIso(iso: string): number | null {
  if (!ISO_RE.test(iso)) return null;
  const m = Number.parseInt(iso.slice(5, 7), 10) - 1;
  return m >= 0 && m <= 11 ? m : null;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function seasonalForecast(startIso: string): CityForecast {
  const m = monthFromIso(startIso) ?? new Date().getMonth();
  const t = SEASONAL_TEMP_C[m] ?? 24;
  // Amplitude diurne approchée autour de la moyenne mensuelle.
  return {
    tempMin: t - 4,
    tempMax: t + 3,
    condition: m >= 3 && m <= 9 ? "clear" : "clouds",
    source: "seasonal",
  };
}

/** Catégorie dominante d'une liste de codes WMO (la plus fréquente). */
function dominantCondition(codes: number[]): WeatherCondition {
  const tally: Record<WeatherCondition, number> = { clear: 0, clouds: 0, rain: 0 };
  for (const c of codes) tally[conditionFromCode(c)] += 1;
  return (Object.entries(tally) as [WeatherCondition, number][]).sort(
    (a, b) => b[1] - a[1]
  )[0][0];
}

/**
 * Prévision agrégée (min/max + tendance) pour la période recherchée
 * [startIso, endIso]. En live, n'interroge Open-Meteo que pour la portion dans
 * l'horizon de prévision (~16 j) ; au-delà (ou repli/échec) → moyenne mensuelle.
 * Renvoie null si la ville est inconnue ou la date de début invalide.
 */
export async function getCityForecast(
  cityName: string,
  startIso: string,
  endIso?: string
): Promise<CityForecast | null> {
  const city = getCity(cityName);
  if (!city || !ISO_RE.test(startIso)) return null;
  if (!isWeatherLive()) return seasonalForecast(startIso);

  const today = todayIso();
  const maxIso = addDaysIso(today, FORECAST_HORIZON_DAYS);
  const rangeEnd = endIso && ISO_RE.test(endIso) && endIso > startIso ? endIso : startIso;
  // Aucun chevauchement avec l'horizon de prévision → moyenne mensuelle.
  if (startIso > maxIso || rangeEnd < today) return seasonalForecast(startIso);
  const start = startIso < today ? today : startIso;
  const end = rangeEnd > maxIso ? maxIso : rangeEnd;

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}` +
      `&longitude=${city.longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&timezone=auto&start_date=${start}&end_date=${end}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 1800 },
    }).finally(() => clearTimeout(timeout));
    if (!res.ok) return seasonalForecast(startIso);
    const data = (await res.json()) as {
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        weather_code?: number[];
      };
    };
    const maxs = data.daily?.temperature_2m_max ?? [];
    const mins = data.daily?.temperature_2m_min ?? [];
    const codes = data.daily?.weather_code ?? [];
    if (!maxs.length || !mins.length) return seasonalForecast(startIso);
    return {
      tempMin: Math.round(Math.min(...mins)),
      tempMax: Math.round(Math.max(...maxs)),
      condition: codes.length ? dominantCondition(codes) : "clear",
      source: "live",
    };
  } catch {
    return seasonalForecast(startIso);
  }
}
