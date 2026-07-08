# Darna — conventions du projet

## Identité git / GitHub (règle absolue)

Projet **personnel** de Wassim. Tout commit, push et opération GitHub se fait avec `benmesswass@gmail.com` / compte GitHub `benmesswass` — **jamais** l'identité DiliTrust (`wassim.ben-messaoud@dilitrust.com` / `dt-wassim-ben-messaoud`). Avant tout push : vérifier `git config user.email` et `gh auth status`. Ne pas « simplifier » l'URL du remote (`https://benmesswass@github.com/...`) : le `~/.netrc` de la machine contient un token du compte pro qu'elle neutralise.

## Livraison & tests (règle absolue)

À **chaque** modification ou nouveau code livré pour Darna, **TOUJOURS** finir la réponse par un bloc « Comment tester » — **y compris après un simple commit poussé sur une PR déjà ouverte** (pas seulement à l'ouverture initiale de la PR) : le réflexe déclencheur est « je viens de pousser du code », pas « je viens d'ouvrir une PR ». Ce bloc contient les deux :
1. **Les commandes exactes** à lancer (setup migrations/seed si le schéma change, `npm run dev`, `npx tsc --noEmit`, `npm test`, commande de test ciblée…). **Quand le code est sur une branche encore non mergée (PR ouverte), TOUJOURS donner la séquence complète pour récupérer la DERNIÈRE version de CETTE branche** : `git fetch origin` → `git checkout <nom-de-la-branche>` → **`git pull`** (le `git pull` est indispensable si la branche existe déjà en local — sinon Wassim teste un état périmé sans les derniers commits poussés, notamment après des améliorations sur une PR existante) — **avant** `migrate reset` / `npm run dev`. Ne JAMAIS omettre le `git pull`. Donner le nom exact de la branche dans les commandes. **Aucun commentaire à l'intérieur des blocs de commandes** (pas de `#` ni d'annotation en fin de ligne) : les commandes doivent être copiables-collables telles quelles d'un bloc. Mettre toute explication en prose AVANT ou APRÈS le bloc, jamais dedans.
2. **Quoi tester visuellement** : le parcours pas-à-pas dans l'UI (URL de départ, clics, valeurs à saisir, comptes démo) ET le résultat attendu — y compris les cas limites / sécurité quand ils existent. **TOUJOURS donner le compte démo ADÉQUAT pour CHAQUE étape de test : l'e-mail exact ET le mot de passe** (`darna2026`), jamais un compte vague (« un hôte », « le propriétaire »). Quand l'étape dépend d'une donnée seedée (ex. une réservation appartenant à tel hôte/voyageur), donner le compte réel propriétaire de cette donnée — vérifier dans `prisma/seed.ts` qui possède l'annonce/réservation concernée plutôt que de supposer. Comptes démo dans `CREDENTIALS.md` (mdp `darna2026`).

Jamais livrer du code sans dire à Wassim comment le vérifier. Si une migration est ajoutée, donner aussi la commande de mise à jour de la base (et le `migrate reset` pour une base démo).

**Rapport + captures pour CHAQUE tâche codée (règle absolue).** Avant de considérer une tâche codée terminée — pas seulement à la fin d'un chantier ou avant un merge de PR — Claude teste lui-même le parcours concerné (Playwright quand une UI est impliquée) et envoie systématiquement à Wassim, dans le même tour de réponse : (1) un **rapport de test** écrit (ce qui a été testé, comment, résultat obtenu) et (2) des **captures d'écran** via `SendUserFile` illustrant l'état avant/après pertinent. Ne jamais se contenter de décrire le résultat en prose sans capture quand une UI est concernée. Ceci s'applique à toute tâche codée, y compris les tâches intermédiaires d'un chantier multi-PR, pas seulement à la livraison finale.

## Roadmaps produit (règle absolue)

`FEATURES_ROADMAP.md` (fonctionnel) et `DESIGN_ROADMAP.md` (UI/UX/animations) sont la référence permanente des prochaines étapes produit, au même titre que `QA_ROADMAP.md` pour la qualité/sécurité et que les **roadmaps de chantier dédiées** (`ANNULATION_HOTE_ROADMAP.md`, `ANNULATION_HOTE_CORRECTIFS_ROADMAP.md`, `PAIEMENT_SUR_PLACE_ROADMAP.md`…). **Dès que Wassim demande de continuer — « quelle est la prochaine étape / étape suivante / quoi coder ensuite / suivant / enchaîne / on enchaîne »** (toute formulation équivalente, dans n'importe quelle session y compris une toute nouvelle), **TOUJOURS consulter ces fichiers en premier** avant de proposer quoi que ce soit — ne pas re-improviser une liste de tâches de zéro. Proposer les tâches non cochées de priorité la plus haute (`P0`/`P1` d'abord). **Dès qu'une tâche listée dans l'un de ces fichiers est livrée (mergée)**, mettre à jour le fichier correspondant dans la même PR : cocher/passer le statut à `✅` et noter le fichier/la PR concernée — ne jamais laisser ces roadmaps dériver de l'état réel du code.

**Chaînage automatique des roadmaps de chantier (règle absolue).** Un pointeur de continuation en fin de roadmap a **deux états** : **⏳ EN ATTENTE** (chantier pas encore clos) ou **➡️ ACTIF** (chantier terminé, bascule armée). Le basculement ne se produit **que** quand une roadmap de chantier a **toutes ses phases `✅`** ET que son pointeur est passé à **➡️ ACTIF** : « suivant » / « enchaîne » sur ce chantier bascule alors AUTOMATIQUEMENT sur la roadmap pointée et propose sa **première tâche non cochée** (`P0` d'abord), sans redemander à Wassim quel fichier ouvrir. **Tant que le pointeur est ⏳ EN ATTENTE, « suivant » / « enchaîne » reste dans la roadmap courante** et propose sa prochaine phase non cochée — jamais de bascule prématurée. Suivre la chaîne de proche en proche si la roadmap de continuation est elle-même close. **Chaîne configurée :** `ANNULATION_HOTE_ROADMAP.md` ➡️ `ANNULATION_HOTE_CORRECTIFS_ROADMAP.md` ➡️ `FEATURES_ROADMAP.md` / `QA_ROADMAP.md` — **chaîne entièrement traversée** (AH + AHC1→AHC8 tous `✅`, 2026-07-08) : « suivant » / « enchaîne » reprend désormais la priorité la plus haute (`P0`/`P1`) des roadmaps produit/QA générales.

## Workflow PR (règle absolue)

1. **Jamais de push direct sur `main`** — toujours travailler sur une branche feature.
2. **Après chaque push de branche** : ouvrir une Pull Request via `mcp__github__create_pull_request`.
3. **Tests fonctionnels obligatoires avant de proposer le merge** : pour chaque PR ouverte, Claude exécute lui-même les tests fonctionnels nécessaires (pas seulement `tsc`/lint/tests unitaires) — base de données locale, migration/seed si le schéma change, parcours réel de l'app (navigateur/Playwright quand c'est possible) pour le(s) chemin(s) que la PR modifie. Claude donne ensuite à Wassim un **rapport de test** clair (ce qui a été testé, comment, résultat obtenu). **Attendre la validation explicite de Wassim sur ce rapport** avant de considérer la PR prête pour merge.
4. **Surveiller la CI** : attendre que tous les checks GitHub Actions soient verts.
5. **JAMAIS de merge dans `main` sans la validation explicite de Wassim — MÊME SI la CI est verte.** Claude ne merge jamais de lui-même : il pousse la branche, ouvre la PR, fournit le rapport de test (point 3), signale que la CI est verte, et **attend que Wassim dise explicitement « merge »**. Et **JAMAIS de merge même si Wassim approuve TANT QUE la CI n'est pas verte.** Trois conditions cumulatives : (a) rapport de test fourni ET validé par Wassim, (b) validation explicite de Wassim pour le merge, ET (c) CI verte. Merge en squash via `mcp__github__merge_pull_request` (merge_method: "squash") uniquement quand ces conditions sont réunies.
6. **Améliorations sur une PR déjà ouverte** : si une PR existe déjà (ex. #40) et que Wassim demande des améliorations/corrections dessus, **ne PAS créer une nouvelle PR** — pousser les modifications sur la **même branche** (donc la même PR). On ne crée une nouvelle branche/PR que pour un chantier distinct.
7. **Contexte remote** : Claude Code tourne dans un conteneur cloud — il ne peut PAS écrire directement dans le projet PyCharm local de Wassim. Les changements arrivent sur la machine via `git pull` après merge sur `main`.

## Stack et contraintes

- Next.js 15 App Router + TypeScript strict + Tailwind 4 + Prisma/**PostgreSQL** + NextAuth credentials + zod.
- Base dev locale : conteneur Docker `darna-db` (postgres:16-alpine, user/db/mdp `darna`) — commande dans `.env.example` ; migrations via `npx prisma migrate dev`.
- **Zéro service payant obligatoire, zéro SQL brut, aucune librairie UI lourde.** OTP/EUR restent des mocks assumés. Le séquestre a **deux modes** : simulé par défaut (aucune clé) ; réel via **Konnect** dès que `KONNECT_API_KEY` + `KONNECT_RECEIVER_WALLET_ID` sont définis (sandbox gratuit). Aiguillage par `isKonnectEnabled()` — voir « Paiement Konnect » plus bas.
- Server Actions plutôt qu'API routes. Leaflet uniquement en import dynamique `ssr: false`.
- « Enums » String contraints par `src/lib/constants.ts` + zod (héritage SQLite, conservé pour la souplesse).
- Sécurité ajoutée : CSP par nonce (`src/middleware.ts`), audit trail (`src/lib/audit.ts` + modèle `AuditLog`), réservations EN_ATTENTE expirant à 15 min, transaction anti double-réservation.

## Fichiers clés (carte des composants)

- **Carte / map (Leaflet)** : `src/components/map/PropertyMap.tsx` (wrapper, import dynamique `ssr: false`) → `src/components/map/MapInner.tsx` (rendu réel). C'est *la carte*.
- **Carte annonce / vignette** : `src/components/property/PropertyCard.tsx`.
- Géo & translittération villes : `src/lib/geo.ts` (`resolveCity()`). Constantes/« enums » : `src/lib/constants.ts`. CSP nonce : `src/middleware.ts`. Audit : `src/lib/audit.ts`.
- i18n : `src/lib/i18n/server.ts` (`getT`), `src/components/i18n/LocaleProvider.tsx` (`useT`), dictionnaires `src/lib/i18n/{fr,en,ar}.ts`.
- Navigation flottante précédent/suivant (site entier) : `src/components/layout/HistoryNav.tsx`, ancrée `fixed bottom-4 start-4` — délibérément **jamais en haut** (une position en haut chevauche systématiquement le H1 des pages). **Règle durable** : avant d'ajouter/déplacer un contrôle flottant (`fixed`/`sticky`), vérifier qu'il ne recouvre aucun texte ni aucun autre bouton sur les pages concernées (capture d'écran à l'appui) — un seul autre élément flotte en bas sur le site, `MessagesNotifier` (`bottom-4 end-4`), garder les deux sur des côtés opposés.

## i18n

Site trilingue **fr / en / ar** (arabe = derja tunisienne en écriture arabe, littéraire pour le juridique ; `dir="rtl"` + police Cairo automatiques). Locale dans le cookie `darna-locale`, sélecteur dans le Header. Jamais de chaîne en dur ; convention : `const fr = await getT()` (`src/lib/i18n/server.ts`) dans les composants serveur et server actions, `const fr = useT()` (`src/components/i18n/LocaleProvider.tsx`) dans les composants client — on garde le nom `fr` et les clés françaises. Toute nouvelle clé s'ajoute dans **les trois** dictionnaires (`fr.ts` définit le type `Dictionary`). Exception : les blocs `metadata`/SEO restent en français canonique via `import { fr as frMeta } from "@/lib/i18n/fr"`. CSS : classes logiques uniquement (`ps-`/`pe-`/`ms-`/`me-`/`start-`/`end-`/`text-start`), jamais `pl-`/`left-`… Les libellés métier (équipements…) sont stockés en français tels quels en base.

## Sécurité (invariants à préserver)

- zod sur chaque server action mutante ; autorisation serveur sur chaque mutation (propriété vérifiée en base, jamais confiance au client).
- Prix toujours recalculés côté serveur. Rate limiting dans `authorize` (un seul point). Messages d'erreur **connexion** génériques (anti-énumération). Exception assumée : **l'inscription** indique explicitement « un compte existe déjà avec cet e-mail » (UX grand public, choix produit de Wassim), mitigée par le rate limiting + le CAPTCHA optionnel.
- **CAPTCHA dual-mode** (`src/lib/turnstile.ts`, Cloudflare Turnstile) sur inscription + connexion : désactivé par défaut (`off`), actif via `CAPTCHA_MODE=turnstile` (+ `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, complétude garantie au boot par `src/lib/env.ts`). `verifyTurnstile()` est fail-closed et no-op quand désactivé. La CSP n'ouvre `challenges.cloudflare.com` que lorsque le mode est actif (`src/middleware.ts`).
- Pas de `dangerouslySetInnerHTML` — unique exception encadrée : `src/components/seo/JsonLd.tsx`.

## Paiement Konnect (séquestre réel)

- **Client** `src/lib/konnect.ts` (serveur only, lit `KONNECT_API_KEY` — jamais `NEXT_PUBLIC_`) : `isKonnectEnabled()`, `initKonnectPayment()`, `getKonnectPayment()`, `tndToMillimes()`. ⚠️ `amount` en **millimes** (`prixTND × 1000`).
- **Règlement** `src/lib/payments.ts` → `settleKonnectBooking()` : idempotent, revérifie le montant reçu côté serveur, confirme via `updateMany({ where: { status: "EN_ATTENTE" } })` (sûr contre la course webhook↔retour). Volontairement **pas** un `"use server"` (ne pas l'exposer en RPC client).
- **Flux** : `startKonnectPaymentAction` (dans `src/actions/bookings.ts`) initialise le paiement, stocke `Booking.paymentRef`, renvoie `payUrl` → `KonnectPayButton` redirige **côté client** (`window.location`, compat CSP `form-action 'self'`). Confirmation par le **webhook** `src/app/api/payments/konnect/webhook/route.ts` (GET `?payment_ref=…`) ET par la page de retour `?konnect=success` (filet de sécurité indispensable en dev local). Le séquestre simulé (`confirmPaymentAction`) reste le fallback quand Konnect est désactivé.
- Montant réglé **toujours en TND** ; l'affichage EUR diaspora reste une conversion d'UI, jamais le montant débité.
- **Remboursement : mock assumé, y compris en mode Konnect réel (§AHC8).** L'API Konnect publique (sandbox comme prod) n'expose **aucun endpoint de remboursement programmatique** — vérifié sur la doc officielle et le SDK PHP tiers, seuls `init-payment` et `get-payment-details` existent. `refundAmount` posé sur `Booking` (annulation hôte/voyageur) reste donc une **écriture comptable + affichage**, jamais un vrai virement. Konnect actif → l'argent réellement capté reste sur le wallet Darna, remboursement possible uniquement **manuel** (dashboard Konnect / virement) jusqu'à l'arrivée d'une vraie solution (prestataire dédié ou process manuel documenté) avant toute prod payante — ne pas coder de faux appel API en attendant.

## Règles métier clés

- Une annonce expire à 30 jours (`expiresAt`) ; expirée ou status ≠ ACTIVE → exclue des recherches ET du sitemap.
- Un avis exige une réservation confirmée/terminée (FK obligatoire `Review.bookingId` + contrôle dans l'action).
- Recherche tolérante à la translittération : passer par `resolveCity()` de `src/lib/geo.ts` (« 7ammamet » → Hammamet).
- North-star produit : **annonces vérifiées actives** (réseau Wakil = l'actif défendable).

## Marketing

Contexte de positionnement dans `.agents/product-marketing.md` (lu par les skills de `.claude/skills/`). Message : « Le logement vérifié », cible prioritaire diaspora France, focus géo Hammamet–Nabeul–Sousse.

## Commandes

`npm run dev` · `npx prisma db push && npx prisma db seed` (reset démo) · `npx tsc --noEmit` · `npm run lint`. Comptes démo dans `CREDENTIALS.md` (mdp `darna2026`).
