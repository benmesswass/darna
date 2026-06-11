# Darna — conventions du projet

## Identité git / GitHub (règle absolue)

Projet **personnel** de Wassim. Tout commit, push et opération GitHub se fait avec `benmesswass@gmail.com` / compte GitHub `benmesswass` — **jamais** l'identité DiliTrust (`wassim.ben-messaoud@dilitrust.com` / `dt-wassim-ben-messaoud`). Avant tout push : vérifier `git config user.email` et `gh auth status`. Ne pas « simplifier » l'URL du remote (`https://benmesswass@github.com/...`) : le `~/.netrc` de la machine contient un token du compte pro qu'elle neutralise.

## Stack et contraintes

- Next.js 15 App Router + TypeScript strict + Tailwind 4 + Prisma/**PostgreSQL** + NextAuth credentials + zod.
- Base dev locale : conteneur Docker `darna-db` (postgres:16-alpine, user/db/mdp `darna`) — commande dans `.env.example` ; migrations via `npx prisma migrate dev`.
- **Zéro service payant, zéro clé API, zéro SQL brut, aucune librairie UI lourde.** OTP/séquestre/EUR sont des mocks assumés.
- Server Actions plutôt qu'API routes. Leaflet uniquement en import dynamique `ssr: false`.
- « Enums » String contraints par `src/lib/constants.ts` + zod (héritage SQLite, conservé pour la souplesse).
- Sécurité ajoutée : CSP par nonce (`src/middleware.ts`), audit trail (`src/lib/audit.ts` + modèle `AuditLog`), réservations EN_ATTENTE expirant à 15 min, transaction anti double-réservation.

## Fichiers clés (carte des composants)

- **Carte / map (Leaflet)** : `src/components/map/PropertyMap.tsx` (wrapper, import dynamique `ssr: false`) → `src/components/map/MapInner.tsx` (rendu réel). C'est *la carte*.
- **Carte annonce / vignette** : `src/components/property/PropertyCard.tsx`.
- Géo & translittération villes : `src/lib/geo.ts` (`resolveCity()`). Constantes/« enums » : `src/lib/constants.ts`. CSP nonce : `src/middleware.ts`. Audit : `src/lib/audit.ts`.
- i18n : `src/lib/i18n/server.ts` (`getT`), `src/components/i18n/LocaleProvider.tsx` (`useT`), dictionnaires `src/lib/i18n/{fr,en,ar}.ts`.

## i18n

Site trilingue **fr / en / ar** (arabe = derja tunisienne en écriture arabe, littéraire pour le juridique ; `dir="rtl"` + police Cairo automatiques). Locale dans le cookie `darna-locale`, sélecteur dans le Header. Jamais de chaîne en dur ; convention : `const fr = await getT()` (`src/lib/i18n/server.ts`) dans les composants serveur et server actions, `const fr = useT()` (`src/components/i18n/LocaleProvider.tsx`) dans les composants client — on garde le nom `fr` et les clés françaises. Toute nouvelle clé s'ajoute dans **les trois** dictionnaires (`fr.ts` définit le type `Dictionary`). Exception : les blocs `metadata`/SEO restent en français canonique via `import { fr as frMeta } from "@/lib/i18n/fr"`. CSS : classes logiques uniquement (`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`/`text-start`), jamais `pl-`/`left-`… Les libellés métier (équipements…) sont stockés en français tels quels en base.

## Sécurité (invariants à préserver)

- zod sur chaque server action mutante ; autorisation serveur sur chaque mutation (propriété vérifiée en base, jamais confiance au client).
- Prix toujours recalculés côté serveur. Messages d'erreur auth génériques. Rate limiting dans `authorize` (un seul point).
- Pas de `dangerouslySetInnerHTML` — unique exception encadrée : `src/components/seo/JsonLd.tsx`.

## Règles métier clés

- Une annonce expire à 30 jours (`expiresAt`) ; expirée ou status ≠ ACTIVE → exclue des recherches ET du sitemap.
- Un avis exige une réservation confirmée/terminée (FK obligatoire `Review.bookingId` + contrôle dans l'action).
- Recherche tolérante à la translittération : passer par `resolveCity()` de `src/lib/geo.ts` (« 7ammamet » → Hammamet).
- North-star produit : **annonces vérifiées actives** (réseau Wakil = l'actif défendable).

## Marketing

Contexte de positionnement dans `.agents/product-marketing.md` (lu par les skills de `.claude/skills/`). Message : « Le logement vérifié », cible prioritaire diaspora France, focus géo Hammamet–Nabeul–Sousse.

## Commandes

`npm run dev` · `npx prisma db push && npx prisma db seed` (reset démo) · `npx tsc --noEmit` · `npm run lint`. Comptes démo dans `CREDENTIALS.md` (mdp `darna2026`).
