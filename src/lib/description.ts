/**
 * Génération de description par templates de phrases — aucune API IA.
 * Fonction pure, utilisable côté client (bouton « Générer la description »).
 */

export type DescriptionInput = {
  title: string;
  type: string; // SEJOUR | LOCATION | VENTE
  city: string;
  address?: string;
  surface?: number;
  rooms?: number;
  maxGuests?: number;
  amenities: string[];
  price?: number;
};

/** Choix déterministe d'une variante selon la saisie (pas d'aléatoire). */
function pick<T>(variants: T[], seedText: string): T {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash * 31 + seedText.charCodeAt(i)) % 9973;
  }
  return variants[hash % variants.length];
}

function joinFr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0].toLowerCase();
  const lower = items.map((i) => i.toLowerCase());
  return `${lower.slice(0, -1).join(", ")} et ${lower[lower.length - 1]}`;
}

export function generateDescription(input: DescriptionInput): string {
  const sentences: string[] = [];
  const seed = `${input.title}${input.city}`;

  // 1. Phrase d'accroche selon le type d'annonce.
  const intros: Record<string, string[]> = {
    SEJOUR: [
      `Posez vos valises à ${input.city} : ${input.title.toLowerCase()} vous attend pour un séjour sans mauvaise surprise.`,
      `Envie d'une parenthèse à ${input.city} ? ${input.title} est prêt à vous accueillir.`,
      `À ${input.city}, ce logement de vacances combine confort et emplacement.`,
    ],
    LOCATION: [
      `À louer à ${input.city} : ${input.title.toLowerCase()}, disponible dès maintenant.`,
      `Installez-vous à ${input.city} : ce bien à la location réunit l'essentiel du quotidien.`,
      `Belle opportunité de location à ${input.city}, dans un secteur recherché.`,
    ],
    VENTE: [
      `À vendre à ${input.city} : ${input.title.toLowerCase()}, une opportunité à étudier de près.`,
      `Projet d'achat à ${input.city} ? Ce bien mérite une visite.`,
      `Investissement ou résidence principale : ce bien à ${input.city} coche les deux cases.`,
    ],
  };
  sentences.push(pick(intros[input.type] ?? intros.LOCATION, seed));

  // 2. Localisation précise si renseignée.
  if (input.address) {
    sentences.push(
      pick(
        [
          `Situé ${input.address.match(/^\d/) ? "au" : "à"} ${input.address}, à proximité immédiate des commodités.`,
          `L'adresse — ${input.address} — place tout à portée de main.`,
        ],
        seed + "adr"
      )
    );
  }

  // 3. Surface, pièces, capacité.
  const sizeParts: string[] = [];
  if (input.surface) sizeParts.push(`${input.surface} m²`);
  if (input.rooms) sizeParts.push(`${input.rooms} pièce${input.rooms > 1 ? "s" : ""}`);
  if (input.type === "SEJOUR" && input.maxGuests) {
    sizeParts.push(`jusqu'à ${input.maxGuests} voyageur${input.maxGuests > 1 ? "s" : ""}`);
  }
  if (sizeParts.length > 0) {
    sentences.push(
      pick(
        [
          `Le bien offre ${joinFr(sizeParts)}, des volumes bien pensés au quotidien.`,
          `Comptez ${joinFr(sizeParts)} : de quoi vivre à l'aise.`,
        ],
        seed + "taille"
      )
    );
  }

  // 4. Équipements.
  if (input.amenities.length > 0) {
    const list = joinFr(input.amenities.slice(0, 5));
    sentences.push(
      pick(
        [
          `Côté confort : ${list}.`,
          `Vous profiterez notamment de ${list}.`,
        ],
        seed + "equip"
      )
    );
  }

  // 5. Conclusion confiance — la signature Darna.
  const outros: Record<string, string[]> = {
    SEJOUR: [
      "Réservez en toute sérénité : prix transparent, paiement protégé par le séquestre Darna.",
      "Calendrier à jour et paiement sécurisé : ce que vous voyez est ce que vous réservez.",
    ],
    LOCATION: [
      "Visite sur rendez-vous via Darna — aucun frais de visite, jamais.",
      "Contactez le propriétaire directement depuis l'annonce, sans intermédiaire douteux.",
    ],
    VENTE: [
      "Dossier et visite organisés via Darna pour une transaction en toute confiance.",
      "Prix affiché négociable directement avec le vendeur via Darna.",
    ],
  };
  sentences.push(pick(outros[input.type] ?? outros.LOCATION, seed + "fin"));

  return sentences.join(" ");
}
