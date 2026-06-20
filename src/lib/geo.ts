/**
 * Référentiel géographique tunisien : 24 gouvernorats, villes avec
 * coordonnées GPS réelles, et résolution tolérante à la translittération
 * (« 7ammamet », « hamamet » → Hammamet ; « soussa » → Sousse…).
 */

export const GOUVERNORATS = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Le Kef",
  "Mahdia",
  "La Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
] as const;
export type Gouvernorat = (typeof GOUVERNORATS)[number];

export type City = {
  name: string;
  gouvernorat: Gouvernorat;
  latitude: number;
  longitude: number;
  /** Variantes orthographiques et translittérations courantes. */
  aliases: string[];
};

export const CITIES: City[] = [
  { name: "Tunis", gouvernorat: "Tunis", latitude: 36.8065, longitude: 10.1815, aliases: ["tounes", "tounis", "tunis centre"] },
  { name: "La Marsa", gouvernorat: "Tunis", latitude: 36.8775, longitude: 10.3247, aliases: ["marsa", "el marsa", "lamarsa"] },
  { name: "Sidi Bou Saïd", gouvernorat: "Tunis", latitude: 36.8687, longitude: 10.3417, aliases: ["sidi bou said", "sidi bousaid", "sidibou", "sidi bou"] },
  { name: "Carthage", gouvernorat: "Tunis", latitude: 36.8528, longitude: 10.3233, aliases: ["kartaj", "carthago", "qartaj"] },
  { name: "Gammarth", gouvernorat: "Tunis", latitude: 36.9061, longitude: 10.2858, aliases: ["gamarth", "9ammarth"] },
  { name: "Ariana", gouvernorat: "Ariana", latitude: 36.8625, longitude: 10.1956, aliases: ["aryana", "l'ariana"] },
  { name: "Hammamet", gouvernorat: "Nabeul", latitude: 36.4, longitude: 10.6167, aliases: ["hamamet", "7ammamet", "7amamet", "hammemet", "yasmine hammamet"] },
  { name: "Nabeul", gouvernorat: "Nabeul", latitude: 36.4561, longitude: 10.7376, aliases: ["nabel", "nabil", "neapolis"] },
  { name: "Kélibia", gouvernorat: "Nabeul", latitude: 36.8475, longitude: 11.0939, aliases: ["kelibia", "klibia", "9elibia"] },
  { name: "Sousse", gouvernorat: "Sousse", latitude: 35.8256, longitude: 10.6369, aliases: ["soussa", "sousa", "souse", "susa", "soussse"] },
  { name: "El Kantaoui", gouvernorat: "Sousse", latitude: 35.892, longitude: 10.598, aliases: ["kantaoui", "port el kantaoui", "el kantawi", "9antaoui"] },
  { name: "Monastir", gouvernorat: "Monastir", latitude: 35.7643, longitude: 10.8113, aliases: ["mounastir", "monastyr", "mestir"] },
  { name: "Mahdia", gouvernorat: "Mahdia", latitude: 35.5047, longitude: 11.0622, aliases: ["mehdia", "el mahdia", "mahdiya"] },
  { name: "Djerba", gouvernorat: "Médenine", latitude: 33.8076, longitude: 10.8451, aliases: ["jerba", "djerba houmt souk", "houmt souk", "midoun", "djerba midoun", "jirba"] },
  { name: "Zarzis", gouvernorat: "Médenine", latitude: 33.5039, longitude: 11.1122, aliases: ["jarjis", "zarzes", "zerzis"] },
  { name: "Tozeur", gouvernorat: "Tozeur", latitude: 33.9197, longitude: 8.1335, aliases: ["touzeur", "tozer", "twzr"] },
  { name: "Bizerte", gouvernorat: "Bizerte", latitude: 37.2744, longitude: 9.8739, aliases: ["binzart", "bizerta", "banzart"] },
  { name: "Sfax", gouvernorat: "Sfax", latitude: 34.7406, longitude: 10.7603, aliases: ["safakes", "sfaks", "safaqis"] },
  { name: "Kairouan", gouvernorat: "Kairouan", latitude: 35.6781, longitude: 10.0963, aliases: ["kairouane", "9airouan", "el kairouan", "kayrawan"] },
  { name: "Aïn Draham", gouvernorat: "Jendouba", latitude: 36.7833, longitude: 8.6833, aliases: ["ain draham", "ain drahem", "3in draham"] },
  { name: "Tabarka", gouvernorat: "Jendouba", latitude: 36.9544, longitude: 8.7581, aliases: ["tabarca", "tbarka"] },
  { name: "Gabès", gouvernorat: "Gabès", latitude: 33.8815, longitude: 10.0982, aliases: ["gabes", "9abes", "gabis"] },
  { name: "Hammam Sousse", gouvernorat: "Sousse", latitude: 35.8608, longitude: 10.6033, aliases: ["7ammam sousse", "hamam sousse"] },
  { name: "Ben Arous", gouvernorat: "Ben Arous", latitude: 36.7531, longitude: 10.2189, aliases: ["benarous", "bin arous"] },
  // Chefs-lieux de l'intérieur et du Sud + Douz (porte du Sahara) — couverture
  // nationale : sans eux, « Kébili », « Douz », « Tataouine »… étaient traités
  // comme des villes inconnues et n'ouvraient même pas l'élargissement.
  { name: "Béja", gouvernorat: "Béja", latitude: 36.7256, longitude: 9.1817, aliases: ["beja", "baja"] },
  { name: "Gafsa", gouvernorat: "Gafsa", latitude: 34.425, longitude: 8.7842, aliases: ["gafsa", "9afsa", "qafsa", "gabsa"] },
  { name: "Kasserine", gouvernorat: "Kasserine", latitude: 35.1676, longitude: 8.8365, aliases: ["kasrine", "9asserine", "kaserine"] },
  { name: "Kébili", gouvernorat: "Kébili", latitude: 33.705, longitude: 8.969, aliases: ["kebili", "9bili", "9ebili", "kbili"] },
  { name: "Douz", gouvernorat: "Kébili", latitude: 33.4662, longitude: 9.0203, aliases: ["duz", "dooz", "douz sahara"] },
  { name: "Le Kef", gouvernorat: "Le Kef", latitude: 36.1822, longitude: 8.7148, aliases: ["el kef", "kef", "lkef", "kaf"] },
  { name: "La Manouba", gouvernorat: "La Manouba", latitude: 36.8101, longitude: 10.0972, aliases: ["manouba", "mannouba", "manuba"] },
  { name: "Sidi Bouzid", gouvernorat: "Sidi Bouzid", latitude: 35.0382, longitude: 9.4849, aliases: ["sidi bou zid", "bouzid", "sidibouzid"] },
  { name: "Siliana", gouvernorat: "Siliana", latitude: 36.088, longitude: 9.3708, aliases: ["selyana", "silyana", "sliana"] },
  { name: "Tataouine", gouvernorat: "Tataouine", latitude: 32.9297, longitude: 10.4518, aliases: ["tatawin", "tataween", "tatouine"] },
  { name: "Zaghouan", gouvernorat: "Zaghouan", latitude: 36.4028, longitude: 10.1425, aliases: ["zaghwan", "zaghouen", "zghouan"] },
];

/**
 * Normalisation translittération arabe/latin :
 * minuscules, accents retirés, chiffres-lettres arabes convertis
 * (7→h, 9→k/q, 3→a, 5→kh, 8→gh, 2→a), lettres doublées réduites.
 */
export function normalizeSearch(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/7/g, "h")
    .replace(/9/g, "k")
    .replace(/5/g, "kh")
    .replace(/3/g, "a")
    .replace(/8/g, "gh")
    .replace(/2/g, "a")
    .replace(/[^a-z\s-]/g, "")
    .replace(/[\s-]+/g, " ")
    .replace(/(.)\1+/g, "$1");
}

/** Index alias normalisé → nom canonique de ville. */
const cityIndex = new Map<string, string>();
for (const city of CITIES) {
  cityIndex.set(normalizeSearch(city.name), city.name);
  for (const alias of city.aliases) {
    cityIndex.set(normalizeSearch(alias), city.name);
  }
}
// « q » et « k » sont interchangeables dans les translittérations.
for (const [key, value] of [...cityIndex.entries()]) {
  if (key.includes("q")) cityIndex.set(key.replace(/q/g, "k"), value);
}

/** Résout une saisie libre vers une ville canonique (ou null). */
export function resolveCity(input: string): string | null {
  const normalized = normalizeSearch(input);
  if (!normalized) return null;
  const exact = cityIndex.get(normalized);
  if (exact) return exact;
  // Tolérance : préfixe (« hamam » → Hammamet) à partir de 3 caractères.
  if (normalized.length >= 3) {
    for (const [key, value] of cityIndex.entries()) {
      if (key.startsWith(normalized) || normalized.startsWith(key)) return value;
    }
  }
  return null;
}

export function getCity(name: string): City | undefined {
  return CITIES.find((c) => c.name === name);
}

/**
 * Ville connue la plus proche de coordonnées arbitraires (distance euclidienne
 * sur lat/lng — suffisant à l'échelle nationale). Sert à rattacher une adresse
 * géocodée (Photon) ou un repère déplacé à l'une des 24 villes du référentiel,
 * pour que `city`/`gouvernorat` (indexés, requis par la recherche) restent
 * toujours cohérents.
 */
export function nearestCity(latitude: number, longitude: number): City {
  let best = CITIES[0];
  let bestDist = Infinity;
  for (const city of CITIES) {
    const dLat = city.latitude - latitude;
    const dLng = city.longitude - longitude;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}

/**
 * Villes voisines d'une ville canonique, triées par proximité — même
 * gouvernorat d'abord (lien naturel : Hammamet ↔ Nabeul), puis distance
 * croissante. La longitude est pondérée par cos(latitude) pour rapprocher
 * la distance euclidienne de la distance réelle à l'échelle du pays.
 * Sert à proposer un élargissement quand une ville n'a aucune annonce
 * (« rien à Hammamet → essayez Nabeul, Sousse ») sans faire sortir
 * l'utilisateur du site. Renvoie [] si la ville n'est pas au référentiel.
 */
export function nearbyCities(name: string, limit = 6): City[] {
  const origin = getCity(name);
  if (!origin) return [];
  const cosLat = Math.cos((origin.latitude * Math.PI) / 180);
  return CITIES.filter((c) => c.name !== origin.name)
    .map((c) => {
      const dLat = c.latitude - origin.latitude;
      const dLng = (c.longitude - origin.longitude) * cosLat;
      return {
        city: c,
        sameGouvernorat: c.gouvernorat === origin.gouvernorat ? 0 : 1,
        dist: dLat * dLat + dLng * dLng,
      };
    })
    .sort((a, b) => a.sameGouvernorat - b.sameGouvernorat || a.dist - b.dist)
    .slice(0, limit)
    .map((s) => s.city);
}

/**
 * Suggestions de villes pour l'autocomplétion — tolérantes à la
 * translittération (« dje » → Djerba, « 7am » → Hammamet, « soussa » → Sousse).
 * Priorité aux préfixes du nom canonique, puis aux alias, puis aux
 * correspondances partielles.
 */
export function suggestCities(input: string, limit = 6): City[] {
  const q = normalizeSearch(input);
  // Filtre dès le 1er caractère (le champ vide affiche déjà toutes les villes).
  if (q.length < 1) return [];

  const scored = new Map<string, { city: City; score: number }>();
  const consider = (city: City, score: number) => {
    const existing = scored.get(city.name);
    if (!existing || existing.score < score) scored.set(city.name, { city, score });
  };

  for (const city of CITIES) {
    const name = normalizeSearch(city.name);
    if (name.startsWith(q)) consider(city, 3);
    else if (city.aliases.some((a) => normalizeSearch(a).startsWith(q))) consider(city, 2);
    else if (name.includes(q)) consider(city, 1);
  }

  return [...scored.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.city.name.length - b.city.name.length ||
        a.city.name.localeCompare(b.city.name, "fr")
    )
    .slice(0, limit)
    .map((s) => s.city);
}
