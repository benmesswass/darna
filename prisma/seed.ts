/**
 * Seed Darna — données réalistes du marché tunisien.
 * Lancement : npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getCity } from "../src/lib/geo";
import { buildPropertySlug } from "../src/lib/slug";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysFromNow = (n: number) => new Date(now.getTime() + n * DAY);

const PLACEHOLDERS = [
  "p-villa",
  "p-mer",
  "p-medina",
  "p-oasis",
  "p-marina",
  "p-sable",
  "p-nuit",
  "p-corail",
];

// Nombre de photos générées par annonce (showcase de la galerie immersive).
const PHOTOS_PER_PROPERTY = 8;

// Légendes de démonstration par position de photo (galerie immersive).
// Les positions sans entrée restent sans légende (cas mixte volontaire).
const PHOTO_CAPTIONS = [
  "Séjour lumineux ouvert sur la terrasse",
  "Vue dégagée depuis le bien",
  "Cuisine équipée moderne",
  "Chambre parentale spacieuse",
  "Salle de bain rénovée",
];

type SeedProperty = {
  title: string;
  type: "SEJOUR" | "LOCATION" | "VENTE";
  city: string;
  price: number;
  surface?: number;
  rooms?: number;
  maxGuests?: number;
  verified: boolean;
  status?: string;
  publishedDaysAgo: number;
  /** Jours de mise en avant « à la une » restants (démo du placement payant). */
  featuredDaysLeft?: number;
  address?: string;
  amenities: string[];
  description: string;
  /** Décalage GPS pour ne pas empiler les marqueurs d'une même ville. */
  jitter: [number, number];
  owner: "hote" | "agence" | "hote2";
};

const PROPERTIES: SeedProperty[] = [
  // ---------- SÉJOURS (nuitée 80–400 TND) ----------
  {
    title: "Villa avec piscine et vue mer",
    type: "SEJOUR",
    city: "Hammamet",
    price: 380,
    surface: 220,
    rooms: 5,
    maxGuests: 8,
    verified: true,
    publishedDaysAgo: 3,
    featuredDaysLeft: 4,
    address: "Hammamet Nord, zone touristique",
    amenities: ["Piscine", "Climatisation", "Wifi", "Vue mer", "Parking", "Jardin"],
    description:
      "Grande villa lumineuse à 300 m de la plage, piscine privée entourée de bougainvilliers, cuisine entièrement équipée et terrasse ombragée pour les soirées d'été. Idéale pour deux familles.",
    jitter: [0.012, 0.008],
    owner: "hote",
  },
  {
    title: "Studio cosy dans la médina",
    type: "SEJOUR",
    city: "Hammamet",
    price: 95,
    surface: 38,
    rooms: 1,
    maxGuests: 2,
    verified: true,
    publishedDaysAgo: 7,
    address: "Médina de Hammamet",
    amenities: ["Climatisation", "Wifi", "Proche plage"],
    description:
      "Studio rénové au cœur de la médina, à deux pas de la kasbah et de la plage. Parfait pour un couple : calme, charme de la pierre apparente et toit-terrasse partagé.",
    jitter: [-0.004, 0.003],
    owner: "hote2",
  },
  {
    title: "Maison d'hôtes traditionnelle",
    type: "SEJOUR",
    city: "Sidi Bou Saïd",
    price: 260,
    surface: 140,
    rooms: 3,
    maxGuests: 6,
    verified: true,
    publishedDaysAgo: 1,
    featuredDaysLeft: 6,
    address: "Rue Habib Thameur",
    amenities: ["Wifi", "Terrasse", "Vue mer", "Climatisation"],
    description:
      "Maison bleue et blanche typique avec patio andalou, à cinq minutes du café des Délices. Vue imprenable sur le golfe de Tunis depuis la terrasse. Petit-déjeuner tunisien offert le premier matin.",
    jitter: [0.002, -0.002],
    owner: "hote",
  },
  {
    title: "Appartement vue sur le port",
    type: "SEJOUR",
    city: "La Marsa",
    price: 180,
    surface: 85,
    rooms: 3,
    maxGuests: 4,
    verified: false,
    publishedDaysAgo: 12,
    address: "Marsa Plage",
    amenities: ["Climatisation", "Wifi", "Ascenseur", "Proche plage"],
    description:
      "Appartement moderne au 4e étage avec balcon filant, à 50 m de la corniche de La Marsa. Trois pièces climatisées, résidence sécurisée avec parking.",
    jitter: [0.003, 0.005],
    owner: "hote2",
  },
  {
    title: "Dar de charme avec patio",
    type: "SEJOUR",
    city: "Djerba",
    price: 320,
    surface: 180,
    rooms: 4,
    maxGuests: 7,
    verified: true,
    publishedDaysAgo: 5,
    address: "Erriadh, près de Djerbahood",
    amenities: ["Piscine", "Wifi", "Jardin", "Climatisation", "Parking"],
    description:
      "Houch djerbien restauré dans les règles de l'art : murs chaulés, menzel traditionnel, piscine au sel et palmeraie privée. À dix minutes des plages de la Seguia.",
    jitter: [0.01, -0.015],
    owner: "hote",
  },
  {
    title: "Appartement pieds dans l'eau",
    type: "SEJOUR",
    city: "Sousse",
    price: 150,
    surface: 70,
    rooms: 2,
    maxGuests: 4,
    verified: true,
    publishedDaysAgo: 9,
    address: "Boujaafar, front de mer",
    amenities: ["Climatisation", "Wifi", "Vue mer", "Ascenseur"],
    description:
      "Deux-pièces rénové face à la plage de Boujaafar : vue mer depuis le salon, accès direct à la promenade. Commerces, cafés et médina accessibles à pied.",
    jitter: [0.001, 0.002],
    owner: "hote2",
  },
  {
    title: "Villa familiale proche marina",
    type: "SEJOUR",
    city: "Monastir",
    price: 240,
    surface: 160,
    rooms: 4,
    maxGuests: 8,
    verified: false,
    publishedDaysAgo: 18,
    address: "Route de la Falaise",
    amenities: ["Piscine", "Parking", "Climatisation", "Jardin", "Wifi"],
    description:
      "Villa de plain-pied avec grand jardin clôturé, barbecue et piscine pour enfants. À cinq minutes en voiture de la marina et du ribat de Monastir.",
    jitter: [0.006, 0.004],
    owner: "hote",
  },
  {
    title: "Maison de pêcheur rénovée",
    type: "SEJOUR",
    city: "Mahdia",
    price: 130,
    surface: 90,
    rooms: 3,
    maxGuests: 5,
    verified: true,
    publishedDaysAgo: 2,
    address: "Quartier du vieux port",
    amenities: ["Wifi", "Terrasse", "Proche plage", "Cuisine équipée"],
    description:
      "Maison blanche aux volets bleus à 100 m de la plage la plus fine de Tunisie. Terrasse sur le toit avec vue sur le cimetière marin et la presqu'île.",
    jitter: [0.002, -0.003],
    owner: "hote2",
  },
  {
    title: "Lodge des palmiers",
    type: "SEJOUR",
    city: "Tozeur",
    price: 110,
    surface: 65,
    rooms: 2,
    maxGuests: 3,
    verified: true,
    publishedDaysAgo: 14,
    address: "Route de la palmeraie",
    amenities: ["Climatisation", "Wifi", "Jardin", "Parking"],
    description:
      "Bungalow en briques de Tozeur au milieu de la palmeraie, à dix minutes du centre. Idéal pour rayonner vers Chebika, Ong Jmal et le Chott el Jérid.",
    jitter: [0.004, 0.006],
    owner: "hote",
  },
  {
    title: "Penthouse marina et golf",
    type: "SEJOUR",
    city: "El Kantaoui",
    price: 400,
    surface: 130,
    rooms: 3,
    maxGuests: 6,
    verified: true,
    publishedDaysAgo: 4,
    address: "Marina El Kantaoui",
    amenities: ["Piscine", "Vue mer", "Climatisation", "Wifi", "Ascenseur", "Parking"],
    description:
      "Dernier étage avec terrasse panoramique sur la marina. Piscine de résidence, golf 36 trous à 5 minutes, restaurants au pied de l'immeuble.",
    jitter: [0.001, -0.001],
    owner: "agence",
  },
  {
    title: "Chambre d'hôtes au cœur des montagnes",
    type: "SEJOUR",
    city: "Aïn Draham",
    price: 80,
    surface: 30,
    rooms: 1,
    maxGuests: 2,
    verified: false,
    publishedDaysAgo: 22,
    address: "Col des Ruines",
    amenities: ["Chauffage", "Wifi", "Jardin"],
    description:
      "Chambre douillette dans une maison forestière au milieu des chênes-lièges. Cheminée, brouillard matinal et randonnées vers les cascades — la Tunisie verte.",
    jitter: [0.003, 0.002],
    owner: "hote2",
  },
  {
    title: "Riad face à la forteresse",
    type: "SEJOUR",
    city: "Kélibia",
    price: 175,
    surface: 110,
    rooms: 3,
    maxGuests: 6,
    verified: true,
    publishedDaysAgo: 6,
    address: "Route du Fort",
    amenities: ["Wifi", "Terrasse", "Proche plage", "Climatisation", "Cuisine équipée"],
    description:
      "Maison d'architecte face au fort byzantin, à 400 m de la plage el Mansoura et son eau cristalline. Grandes chambres voûtées et cour intérieure au citronnier.",
    jitter: [-0.003, 0.004],
    owner: "hote",
  },

  // ---------- LOCATIONS LONGUE DURÉE (600–2500 TND/mois) ----------
  {
    title: "S+2 lumineux près du TGM",
    type: "LOCATION",
    city: "La Marsa",
    price: 1450,
    surface: 95,
    rooms: 3,
    verified: true,
    publishedDaysAgo: 4,
    address: "Marsa Ville, près de la station TGM",
    amenities: ["Climatisation", "Ascenseur", "Parking", "Cuisine équipée"],
    description:
      "S+2 de standing au 2e étage d'une résidence calme : double séjour, cuisine aménagée, deux salles d'eau. À cinq minutes à pied du TGM et des commerces de Marsa Ville.",
    jitter: [-0.002, -0.004],
    owner: "agence",
  },
  {
    title: "S+1 meublé quartier Ennasr",
    type: "LOCATION",
    city: "Ariana",
    price: 850,
    surface: 60,
    rooms: 2,
    verified: false,
    publishedDaysAgo: 10,
    address: "Ennasr 2",
    amenities: ["Climatisation", "Ascenseur", "Cuisine équipée"],
    description:
      "S+1 meublé avec goût au cœur d'Ennasr 2 : résidence récente, cuisine américaine équipée, proche cafés, salles de sport et commodités. Libre immédiatement.",
    jitter: [0.005, 0.003],
    owner: "agence",
  },
  {
    title: "Duplex avec jardin aux Berges du Lac",
    type: "LOCATION",
    city: "Tunis",
    price: 2500,
    surface: 170,
    rooms: 4,
    verified: true,
    publishedDaysAgo: 2,
    featuredDaysLeft: 5,
    address: "Les Berges du Lac 2",
    amenities: ["Jardin", "Parking", "Climatisation", "Cuisine équipée", "Chauffage"],
    description:
      "Duplex S+3 avec jardin privatif de 80 m² dans une résidence gardée du Lac 2. Prestations haut de gamme, double parking sous-sol, proche écoles internationales et ambassades.",
    jitter: [0.025, 0.06],
    owner: "agence",
  },
  {
    title: "S+2 vue mer à Corniche",
    type: "LOCATION",
    city: "Bizerte",
    price: 950,
    surface: 100,
    rooms: 3,
    verified: true,
    publishedDaysAgo: 8,
    address: "Corniche de Bizerte",
    amenities: ["Vue mer", "Climatisation", "Ascenseur"],
    description:
      "Bel S+2 traversant avec vue dégagée sur la Méditerranée, à deux pas de la corniche. Immeuble bien entretenu, syndic actif, idéal jeune couple.",
    jitter: [0.002, 0.005],
    owner: "hote2",
  },
  {
    title: "Studio étudiant proche faculté",
    type: "LOCATION",
    city: "Sousse",
    price: 600,
    surface: 35,
    rooms: 1,
    verified: false,
    publishedDaysAgo: 15,
    address: "Cité Erriadh, près du campus",
    amenities: ["Wifi", "Cuisine équipée"],
    description:
      "Studio fonctionnel à dix minutes à pied de la faculté de médecine : kitchenette, salle d'eau rénovée, charges comprises. Dossier étudiant accepté avec garant.",
    jitter: [-0.008, -0.006],
    owner: "hote2",
  },
  {
    title: "S+3 familial à Sahloul",
    type: "LOCATION",
    city: "Sousse",
    price: 1300,
    surface: 140,
    rooms: 4,
    verified: true,
    publishedDaysAgo: 5,
    address: "Sahloul 4",
    amenities: ["Climatisation", "Parking", "Ascenseur", "Cuisine équipée"],
    description:
      "Grand S+3 dans le quartier prisé de Sahloul : trois chambres, double séjour, deux salles de bains. Proche cliniques, écoles et centre commercial.",
    jitter: [-0.015, -0.02],
    owner: "agence",
  },
  {
    title: "Maison de village avec cour",
    type: "LOCATION",
    city: "Nabeul",
    price: 750,
    surface: 110,
    rooms: 3,
    verified: false,
    publishedDaysAgo: 20,
    address: "Dar Chaabane El Fehri",
    amenities: ["Jardin", "Parking", "Cuisine équipée"],
    description:
      "Maison de plain-pied avec cour carrelée et citronniers, dans un quartier calme de Dar Chaabane. Deux chambres, grand salon, cuisine indépendante.",
    jitter: [0.01, 0.012],
    owner: "hote",
  },
  {
    title: "S+1 neuf centre-ville",
    type: "LOCATION",
    city: "Sfax",
    price: 700,
    surface: 65,
    rooms: 2,
    verified: true,
    publishedDaysAgo: 11,
    address: "Avenue 14 Janvier",
    amenities: ["Climatisation", "Ascenseur"],
    description:
      "S+1 jamais habité dans un immeuble neuf du centre : finitions soignées, double vitrage, place de parking en option. Proche commerces et administrations.",
    jitter: [0.003, -0.002],
    owner: "agence",
  },

  // ---------- VENTES (150 000 – 1 200 000 TND) ----------
  {
    title: "Villa d'architecte vue panoramique",
    type: "VENTE",
    city: "Sidi Bou Saïd",
    price: 1200000,
    surface: 320,
    rooms: 6,
    verified: true,
    publishedDaysAgo: 6,
    featuredDaysLeft: 3,
    address: "Hauteurs de Sidi Bou Saïd",
    amenities: ["Piscine", "Jardin", "Vue mer", "Parking", "Climatisation", "Chauffage"],
    description:
      "Villa signée sur trois niveaux dominant le golfe de Tunis : volumes traversants, piscine à débordement, suite parentale avec terrasse. Titre foncier bleu, prête à vivre.",
    jitter: [-0.003, -0.004],
    owner: "agence",
  },
  {
    title: "Appartement S+2 vue mer",
    type: "VENTE",
    city: "La Marsa",
    price: 520000,
    surface: 105,
    rooms: 3,
    verified: true,
    publishedDaysAgo: 9,
    address: "Corniche de La Marsa",
    amenities: ["Vue mer", "Ascenseur", "Parking", "Climatisation"],
    description:
      "S+2 en étage élevé avec vue mer frontale : séjour ouvert sur balcon, deux chambres, salle de bains marbre. Résidence avec gardien, à 100 m de la plage.",
    jitter: [0.006, 0.001],
    owner: "agence",
  },
  {
    title: "Maison à rénover dans la médina",
    type: "VENTE",
    city: "Tunis",
    price: 280000,
    surface: 150,
    rooms: 5,
    verified: false,
    publishedDaysAgo: 25,
    address: "Médina de Tunis, près de Dar Lasram",
    amenities: ["Terrasse"],
    description:
      "Dar traditionnelle avec patio central et chambres en enfilade, à restaurer entièrement. Beaux plafonds peints d'origine, toit-terrasse avec vue sur la Zitouna. Fort potentiel maison d'hôtes.",
    jitter: [-0.002, 0.001],
    owner: "hote",
  },
  {
    title: "S+3 neuf aux Jardins de Carthage",
    type: "VENTE",
    city: "Carthage",
    price: 680000,
    surface: 145,
    rooms: 4,
    verified: true,
    publishedDaysAgo: 3,
    address: "Jardins de Carthage",
    amenities: ["Ascenseur", "Parking", "Climatisation", "Chauffage", "Cuisine équipée"],
    description:
      "S+3 haut standing dans une résidence neuve des Jardins de Carthage : 145 m², triple orientation, cuisine équipée Miele, deux places de parking et cave.",
    jitter: [0.004, 0.003],
    owner: "agence",
  },
  {
    title: "Terrain constructible bord de mer",
    type: "VENTE",
    city: "Kélibia",
    price: 350000,
    surface: 600,
    verified: false,
    publishedDaysAgo: 17,
    address: "Route d'El Mansoura",
    amenities: [],
    description:
      "Terrain plat de 600 m² à 250 m de la plage el Mansoura, titre foncier individuel, COS 0,4. Eau, électricité et assainissement en bordure. Constructible R+2.",
    jitter: [0.005, -0.002],
    owner: "hote2",
  },
  {
    title: "Appartement S+1 idéal investisseur",
    type: "VENTE",
    city: "Monastir",
    price: 195000,
    surface: 58,
    rooms: 2,
    verified: true,
    publishedDaysAgo: 13,
    address: "Zone touristique Skanes",
    amenities: ["Piscine", "Ascenseur", "Climatisation", "Proche plage"],
    description:
      "S+1 meublé dans une résidence avec piscine à Skanes, à 5 minutes de l'aéroport. Historique locatif saisonnier solide — rendement brut constaté de 7 %. Syndic en place.",
    jitter: [-0.012, 0.018],
    owner: "agence",
  },
  {
    title: "Maison djerbienne avec menzel",
    type: "VENTE",
    city: "Djerba",
    price: 450000,
    surface: 200,
    rooms: 4,
    verified: true,
    publishedDaysAgo: 8,
    address: "Mellita",
    amenities: ["Jardin", "Terrasse", "Parking"],
    description:
      "Authentique menzel djerbien sur un terrain arboré de 1 000 m² : coupoles blanchies, oliviers centenaires, puits traditionnel. Restauré avec matériaux d'origine, habitable immédiatement.",
    jitter: [-0.02, 0.03],
    owner: "hote",
  },

  // ---------- Cas particuliers : fraîcheur des données ----------
  {
    title: "Appartement S+2 (annonce expirée)",
    type: "LOCATION",
    city: "Tunis",
    price: 1100,
    surface: 90,
    rooms: 3,
    verified: false,
    publishedDaysAgo: 45, // expirée depuis 15 jours — exclue des résultats
    address: "El Menzah 6",
    amenities: ["Climatisation"],
    description:
      "S+2 à El Menzah 6, proche commodités. Cette annonce a dépassé ses 30 jours de validité : elle n'apparaît plus dans les résultats de recherche.",
    jitter: [0.015, -0.01],
    owner: "hote2",
  },
  {
    title: "Studio meublé centre (déjà loué)",
    type: "LOCATION",
    city: "Tunis",
    price: 780,
    surface: 40,
    rooms: 1,
    verified: true,
    status: "LOUE",
    publishedDaysAgo: 12,
    address: "Lafayette",
    amenities: ["Climatisation", "Ascenseur"],
    description:
      "Studio meublé à Lafayette, loué via Darna en quelques jours. Statut « Loué » : il n'encombre plus les résultats de recherche.",
    jitter: [0.007, 0.004],
    owner: "agence",
  },
  {
    title: "Villa avec piscine (vendue)",
    type: "VENTE",
    city: "Hammamet",
    price: 890000,
    surface: 260,
    rooms: 5,
    verified: true,
    status: "VENDU",
    publishedDaysAgo: 20,
    address: "Hammamet Sud",
    amenities: ["Piscine", "Jardin", "Parking"],
    description:
      "Villa avec piscine à Hammamet Sud, vendue via Darna. Statut « Vendu » : les acheteurs ne perdent plus leur temps sur des biens partis.",
    jitter: [-0.018, -0.012],
    owner: "agence",
  },
];

async function main() {
  console.log("Nettoyage de la base…");
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.contactRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.property.deleteMany();
  await prisma.wakilApplication.deleteMany();
  await prisma.user.deleteMany();

  console.log("Création des utilisateurs…");
  const passwordHash = await bcrypt.hash("darna2026", 12);

  const [voyageur, hote, agence, hote2, voyageuse2, voyageur3] = await Promise.all([
    prisma.user.create({
      data: {
        email: "voyageur@darna.tn",
        passwordHash,
        name: "Yassine Trabelsi",
        phone: "+216 22 345 678",
        role: "VOYAGEUR",
      },
    }),
    prisma.user.create({
      data: {
        email: "hote@darna.tn",
        passwordHash,
        name: "Leïla Ben Salem",
        phone: "+216 98 123 456",
        role: "HOTE",
        phoneVerified: true,
        kycStatus: "VERIFIE",
        cin: "08123456",
      },
    }),
    prisma.user.create({
      data: {
        email: "agence@darna.tn",
        passwordHash,
        name: "Agence Carthage Immobilier",
        phone: "+216 71 860 200",
        role: "AGENCE",
        phoneVerified: true,
        kycStatus: "VERIFIE",
        cin: "00112233",
      },
    }),
    prisma.user.create({
      data: {
        email: "sami@darna.tn",
        passwordHash,
        name: "Sami Gharbi",
        phone: "+216 55 778 899",
        role: "HOTE",
        kycStatus: "NON_VERIFIE",
      },
    }),
    prisma.user.create({
      data: {
        email: "amira@darna.tn",
        passwordHash,
        name: "Amira Bouazizi",
        phone: "+216 29 001 122",
        role: "VOYAGEUR",
      },
    }),
    prisma.user.create({
      data: {
        email: "karim@darna.tn",
        passwordHash,
        name: "Karim Jlassi",
        phone: "+216 52 663 314",
        role: "VOYAGEUR",
      },
    }),
  ]);

  const owners = { hote, agence, hote2 } as const;

  console.log("Création des annonces…");
  const created: { id: string; type: string; title: string; price: number }[] = [];

  for (let i = 0; i < PROPERTIES.length; i++) {
    const p = PROPERTIES[i];
    const cityRef = getCity(p.city);
    if (!cityRef) throw new Error(`Ville inconnue dans le seed : ${p.city}`);

    const publishedAt = daysAgo(p.publishedDaysAgo);
    const expiresAt = new Date(publishedAt.getTime() + 30 * DAY);
    const suffix = String(100 + i);

    const property = await prisma.property.create({
      data: {
        slug: buildPropertySlug(p.title, p.city, suffix),
        title: p.title,
        description: p.description,
        type: p.type,
        status: p.status ?? "ACTIVE",
        verified: p.verified,
        price: p.price,
        surface: p.surface ?? null,
        rooms: p.rooms ?? null,
        maxGuests: p.maxGuests ?? null,
        city: cityRef.name,
        gouvernorat: cityRef.gouvernorat,
        address: p.address ?? null,
        latitude: cityRef.latitude + p.jitter[0],
        longitude: cityRef.longitude + p.jitter[1],
        amenities: p.amenities.join("|"),
        publishedAt,
        expiresAt,
        featuredUntil: p.featuredDaysLeft
          ? new Date(Date.now() + p.featuredDaysLeft * DAY)
          : null,
        ownerId: owners[p.owner].id,
        photos: {
          create: Array.from({ length: PHOTOS_PER_PROPERTY }, (_, n) => ({
            url: `/placeholders/${PLACEHOLDERS[(i + n) % PLACEHOLDERS.length]}.svg`,
            alt: `${p.title} — photo ${n + 1}`,
            // Légendes de démonstration : la galerie immersive les affiche en overlay.
            caption: PHOTO_CAPTIONS[n] ?? null,
            position: n,
          })),
        },
      },
    });
    created.push({ id: property.id, type: p.type, title: p.title, price: p.price });
  }

  const sejours = created.filter((p) => p.type === "SEJOUR");

  console.log("Création des réservations passées et avis…");
  // Avis : chaque avis est rattaché à une réservation TERMINEE (FK obligatoire).
  const reviewSeeds: {
    property: number; // index dans `sejours`
    guest: typeof voyageur;
    daysAgoCheckIn: number;
    nights: number;
    rating: number;
    comment: string;
  }[] = [
    { property: 0, guest: voyageur, daysAgoCheckIn: 40, nights: 7, rating: 5, comment: "La villa est exactement conforme aux photos — piscine impeccable, hôte aux petits soins. Le badge « Vérifié » n'est pas un gadget." },
    { property: 0, guest: voyageuse2, daysAgoCheckIn: 75, nights: 5, rating: 4, comment: "Très belle maison, plage proche. Petit bémol sur la pression de l'eau, mais séjour réussi." },
    { property: 2, guest: voyageuse2, daysAgoCheckIn: 30, nights: 3, rating: 5, comment: "Vue inoubliable sur le golfe depuis la terrasse. Le patio est encore plus beau qu'en photo." },
    { property: 2, guest: voyageur3, daysAgoCheckIn: 90, nights: 4, rating: 5, comment: "Accueil chaleureux, petit-déjeuner délicieux, emplacement parfait à Sidi Bou. On reviendra." },
    { property: 4, guest: voyageur, daysAgoCheckIn: 60, nights: 6, rating: 5, comment: "Le houch est magnifique, la piscine au sel très agréable. Paiement sous séquestre rassurant du début à la fin." },
    { property: 5, guest: voyageur3, daysAgoCheckIn: 25, nights: 4, rating: 4, comment: "Emplacement imbattable face à Boujaafar. Appartement propre, literie correcte." },
    { property: 7, guest: voyageuse2, daysAgoCheckIn: 50, nights: 2, rating: 5, comment: "Maison pleine de charme et plage de Mahdia sublime. Tout était conforme à l'annonce." },
    { property: 8, guest: voyageur, daysAgoCheckIn: 100, nights: 3, rating: 4, comment: "Très bon point de chute pour explorer le Sud. Climatisation efficace, hôte arrangeant." },
    { property: 11, guest: voyageur3, daysAgoCheckIn: 35, nights: 5, rating: 5, comment: "El Mansoura à 5 minutes à pied, maison superbe. La transparence des prix fait du bien." },
  ];

  for (const r of reviewSeeds) {
    const target = sejours[r.property];
    const checkIn = daysAgo(r.daysAgoCheckIn);
    const checkOut = new Date(checkIn.getTime() + r.nights * DAY);
    const serviceFee = Math.round(target.price * r.nights * 0.08);

    const booking = await prisma.booking.create({
      data: {
        propertyId: target.id,
        guestId: r.guest.id,
        checkIn,
        checkOut,
        guests: 2,
        nightlyPrice: target.price,
        serviceFee,
        totalPrice: target.price * r.nights + serviceFee,
        status: "TERMINEE",
        escrow: "LIBERE",
      },
    });

    await prisma.review.create({
      data: {
        bookingId: booking.id,
        propertyId: target.id,
        authorId: r.guest.id,
        rating: r.rating,
        comment: r.comment,
      },
    });
  }

  console.log("Réservations à venir et indisponibilités…");
  // Réservation confirmée à venir pour le voyageur démo (visible dans « Mes réservations »).
  const villaHammamet = sejours[0];
  const nights = 5;
  const fee = Math.round(villaHammamet.price * nights * 0.08);
  await prisma.booking.create({
    data: {
      propertyId: villaHammamet.id,
      guestId: voyageur.id,
      checkIn: daysFromNow(20),
      checkOut: daysFromNow(20 + nights),
      guests: 4,
      nightlyPrice: villaHammamet.price,
      serviceFee: fee,
      totalPrice: villaHammamet.price * nights + fee,
      status: "CONFIRMEE",
      escrow: "EN_SEQUESTRE",
    },
  });

  // Périodes bloquées par les hôtes sur quelques séjours.
  await prisma.availability.createMany({
    data: [
      { propertyId: sejours[0].id, startDate: daysFromNow(34), endDate: daysFromNow(41) },
      { propertyId: sejours[2].id, startDate: daysFromNow(10), endDate: daysFromNow(17) },
      { propertyId: sejours[4].id, startDate: daysFromNow(5), endDate: daysFromNow(12) },
      { propertyId: sejours[9].id, startDate: daysFromNow(15), endDate: daysFromNow(22) },
    ],
  });

  console.log("Demandes de contact et candidature Wakil…");
  const locationMarsa = created.find((p) => p.title === "S+2 lumineux près du TGM");
  if (locationMarsa) {
    await prisma.contactRequest.create({
      data: {
        propertyId: locationMarsa.id,
        senderId: voyageur.id,
        name: voyageur.name,
        email: voyageur.email,
        phone: voyageur.phone ?? "",
        message:
          "Bonjour, je cherche un S+2 à La Marsa pour début du mois prochain. Serait-il possible de visiter ce week-end ?",
      },
    });
  }

  await prisma.wakilApplication.create({
    data: {
      name: "Nadia Mansouri",
      email: "nadia.mansouri@example.tn",
      phone: "+216 24 556 677",
      city: "Sousse",
      motivation:
        "Agent immobilier depuis cinq ans à Sousse, je connais chaque quartier. L'idée d'un réseau de vérification terrain est exactement ce qui manque au marché.",
    },
  });

  const counts = {
    utilisateurs: await prisma.user.count(),
    annonces: await prisma.property.count(),
    photos: await prisma.photo.count(),
    reservations: await prisma.booking.count(),
    avis: await prisma.review.count(),
  };
  console.log("Seed terminé :", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
