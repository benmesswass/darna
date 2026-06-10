# Darna — دارنا

**« Notre maison », en toute confiance.**

Darna est une plateforme web pour le marché immobilier tunisien, combinant deux verticales sur un socle unique :

- **Séjours** (type Airbnb) : location touristique — calendrier de disponibilité, recherche ville/dates/voyageurs, réservation avec séquestre, avis de vrais voyageurs.
- **Immobilier** (type SeLoger) : location longue durée et vente — filtres prix/surface/pièces/gouvernorat, contact direct propriétaire/agence, contrat de bail pré-rempli.

## Le positionnement : la confiance est le produit

> *Ce que vous voyez existe. Le prix affiché est le prix payé. Votre argent est protégé.*

Darna corrige structurellement les failles du marché tunisien :

| Faille du marché | Réponse Darna |
|---|---|
| Arnaques aux acomptes, photos volées (Tayara) | Badge « Vérifié Darna » (réseau Wakil), paiement sous **séquestre** versé 24 h après le check-in |
| Annonces périmées jamais nettoyées (Mubawab) | **Expiration automatique à 30 jours**, badge fraîcheur, bouton « Marquer loué/vendu » en 1 clic |
| Avis inventés ou absents | Un avis est **impossible sans réservation confirmée** (contrainte au niveau du schéma de base) |
| Pas de carte, pas d'arabe (TunRooms) | Carte Leaflet/OSM à marqueurs prix, i18n centralisée prête pour l'arabe + RTL |

## Lancement

```bash
npm install
cp .env.example .env        # puis générer AUTH_SECRET : openssl rand -base64 32
npx prisma db push          # crée la base SQLite
npx prisma db seed          # 30 annonces réalistes, comptes démo, avis
npm run dev                 # http://localhost:3000
```

Vérifications : `npx tsc --noEmit` et `npm run lint`.

## Comptes démo

| Rôle | E-mail | Mot de passe | Particularités |
|---|---|---|---|
| Voyageur | `voyageur@darna.tn` | `darna2026` | Réservation confirmée à venir, avis publiés |
| Hôte (vérifié) | `hote@darna.tn` | `darna2026` | KYC vérifié, annonces séjours + vente |
| Agence | `agence@darna.tn` | `darna2026` | Annonces location/vente, demande de contact reçue |

## Fonctionnalités V0

- **Recherche tolérante à la translittération** : « 7ammamet », « hamamet » → Hammamet ; « soussa » → Sousse (normalisation + table d'alias, chiffres arabes 7/9/3/5 convertis).
- **Vue liste + carte** Leaflet/OpenStreetMap avec marqueurs prix (import dynamique `ssr: false`).
- **Fraîcheur des données** : annonces expirées (30 j) ou louées/vendues exclues des recherches et du sitemap ; republication en 1 clic (+30 j).
- **Réservation 100 % transparente** : prix/nuit × nuits + frais de service affichés, total TND, « aucun autre frais ne vous sera demandé ».
- **Séquestre simulé** : paiement mock, fonds « versés à l'hôte 24 h après le check-in », Konnect/Flouci annoncés.
- **KYC simulé** : CIN + téléphone, OTP affiché à l'écran (aucun SMS réel), badge « Identité vérifiée ».
- **Yield Advisor** : pour chaque bien, comparaison « saisonnier (nuitée moyenne de la ville × 30 × 60 % d'occupation) vs longue durée (loyer moyen du gouvernorat) », calculée depuis la base.
- **Générateur de description** : composition de phrases FR par templates depuis les champs saisis — aucune API IA.
- **Indice Darna** (`/prix-du-marche`) : prix moyen au m² par gouvernorat (vente, location) et nuitée moyenne par ville, barres CSS pures.
- **Mode diaspora** (`/diaspora`) : bascule globale TND/EUR (taux statique 1 € = 3,4 TND dans `src/lib/config.ts`).
- **Réseau Wakil** (`/devenir-wakil`) : candidature persistée en base.
- **Contrat de bail pré-rempli imprimable** (`@media print`) pour la location longue durée.
- **Contact WhatsApp** pré-rempli (`wa.me`) sur les annonces immobilier.
- **SEO** : metadata dynamiques, JSON-LD schema.org (`Accommodation`, `RealEstateListing`), sitemap.xml, robots.txt, slugs `villa-piscine-hammamet-100`.

## Sécurité V0

- zod sur chaque server action mutante ; Prisma uniquement (zéro SQL brut).
- bcrypt coût 12, messages d'erreur d'authentification génériques.
- Rate limiting en mémoire : 5 tentatives / 15 min / IP (connexion, inscription, OTP, contact).
- Autorisation serveur sur chaque mutation : un hôte ne touche que ses annonces, un voyageur que ses réservations, le contrat de bail n'est visible que par les deux parties.
- Headers : CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- `.env` non commité (`.env.example` fourni).
- Pas de `dangerouslySetInnerHTML`, à **une exception encadrée** : le JSON-LD SEO (`src/components/seo/JsonLd.tsx`), approche officiellement documentée par Next.js — contenu 100 % issu de la base, sérialisé par `JSON.stringify` avec `<` échappé.

## Limites assumées de la V0

- OTP, séquestre et conversion EUR sont des **mocks assumés dans l'interface** — aucun paiement réel, aucune clé API, aucun SMS.
- Photos : placeholders SVG locaux (pas d'upload de fichiers).
- Interface en français uniquement ; les dictionnaires (`src/lib/i18n/`) et `dir` sont prêts pour `ar.ts` + RTL.
- ⚖️ **Note juridique** : la location saisonnière tunisienne évolue dans un vide juridique (statut fiscal, obligations d'enregistrement, encadrement des plateformes). À clarifier avec un conseil local avant tout lancement commercial. Les CGU et mentions légales sont des pages placeholder à rédiger.

## Roadmap V1

1. **Séquestre réel** via Konnect / Flouci (paiement local + carte internationale pour la diaspora).
2. **KYC réel** : vérification CIN + OTP SMS.
3. **pHash anti-photos volées** : détection des images réutilisées depuis d'autres annonces.
4. **Détection de prix aberrants** (signal d'arnaque) à partir de l'Indice Darna.
5. **App Wakil terrain** : visites avec photos géolocalisées et horodatées.
6. **WhatsApp Business API** : notifications réservation/contact.
7. **Version arabe complète** (`ar.ts` + `dir="rtl"`).
8. **Indice Darna trimestriel public** (rapport PDF, presse).
9. **App mobile Capacitor** (réutilisation du front Next.js).
10. **Assurance partenaire** sur les séjours (casse, annulation).

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript strict · Tailwind CSS 4 · Prisma + SQLite · NextAuth (Auth.js) credentials · zod · Leaflet + OpenStreetMap (react-leaflet) · Aucun service payant, aucune clé API.
