# Darna — conventions du projet

## Identité git / GitHub (règle absolue)

Projet **personnel** de Wassim. Tout commit, push et opération GitHub se fait avec `benmesswass@gmail.com` / compte GitHub `benmesswass` — **jamais** l'identité DiliTrust (`wassim.ben-messaoud@dilitrust.com` / `dt-wassim-ben-messaoud`). Avant tout push : vérifier `git config user.email` et `gh auth status`. Ne pas « simplifier » l'URL du remote (`https://benmesswass@github.com/...`) : le `~/.netrc` de la machine contient un token du compte pro qu'elle neutralise.

## Stack et contraintes

- Next.js 15 App Router + TypeScript strict + Tailwind 4 + Prisma/SQLite + NextAuth credentials + zod.
- **Zéro service payant, zéro clé API, zéro SQL brut, aucune librairie UI lourde.** OTP/séquestre/EUR sont des mocks assumés.
- Server Actions plutôt qu'API routes. Leaflet uniquement en import dynamique `ssr: false`.
- SQLite ne supporte pas les enums Prisma → « enums » String contraints par `src/lib/constants.ts` + zod.

## i18n

Jamais de chaîne en dur dans les composants : tout passe par `src/lib/i18n/fr.ts` (structure prête pour `ar.ts` + RTL). Les libellés métier (équipements…) sont stockés en français tels quels en base.

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
