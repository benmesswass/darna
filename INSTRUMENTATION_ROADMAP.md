# Darna — Instrumentation produit (analytics & funnel)

> **Référence permanente de ce chantier.** Origine : `AUDIT_V1.md` (revue du
> 2026-07-01), section Analytics — « Funnel analytics produit (events,
> cohortes) | 🔴 Absent — aucune instrumentation produit » — repris en item
> **P1** de la priorisation « MUST HAVE AVANT LES 100 PREMIÈRES RÉSERVATIONS »
> (impact Élevé, effort Faible) et en **#10 du Top 20** des leviers de
> conversion/revenu. Chantier **transverse** : prérequis à la mesure de tout
> KPI produit (activation, conversion par étape, adoption fonctionnalité)
> avant le plan de lancement à 6 mois — sans lui, aucun de ces KPI n'est
> mesurable en pratique.
>
> **Précision sur le constat de l'audit.** Le diagnostic « absent » n'est vrai
> qu'à moitié. `src/lib/analytics.ts` + `/dashboard/admin/analytics` (522
> lignes) calculent déjà un vrai tableau de bord fondateur — north-star
> (annonces vérifiées actives, GMV réelle vs démo, réservations confirmées),
> répartition par verticale, acquisition (inscriptions/jour, rôle, pays), un
> **funnel de réservation**, une **rétention/cohortes d'activation** par mois
> d'inscription, et le réseau Wakil. Mais tout est **entièrement dérivé de
> l'état des tables existantes** (`User`, `Booking`, `Property`) — calculé à
> la volée, aucun service payant. Le vrai trou : **aucun événement
> d'interaction n'est jamais écrit nulle part.** Le funnel actuel démarre au
> premier `Booking` créé ; tout ce qui précède — et qui détermine la
> conversion — est invisible : recherche effectuée, annonce consultée,
> formulaire de réservation ouvert puis abandonné, simulateur utilisé,
> partage cliqué, alerte créée. C'est précisément ce que vise l'audit, et
> c'est ce trou que corrige ce chantier — pas reconstruire ce qui existe déjà.
>
> **Décision d'architecture.** Étendre le *pattern* `AuditLog`/
> `src/lib/audit.ts` (écriture async, silencieuse en échec, métadonnées JSON)
> **sans réutiliser la table**. `AuditLog` reste un journal de **sécurité** :
> volume faible, actions sensibles et majoritairement authentifiées, consulté
> pour enquête (`recentEvents` de `getFounderAnalytics`), rétention/purge
> encore ouverte (`QA_ROADMAP.md` : « AuditLog purge ≥90 days (RGPD) | ❌ »).
> Y déverser des événements produit à fort volume et majoritairement
> **anonymes** (avant inscription) polluerait le signal sécurité et
> compliquerait encore la purge à venir. Un modèle **sibling** `ProductEvent`
> porte les événements produit, avec son propre cycle de vie. Zéro service
> payant, zéro nouvelle dépendance : Postgres + Prisma, agrégé à la volée
> exactement comme `getFounderAnalytics()` aujourd'hui.
>
> **Contraintes préservées :** pas de cron — écriture à l'événement, purge
> différée au mécanisme (encore à construire) de `QA_ROADMAP.md` plutôt que
> d'en inventer un séparé ; aucune librairie de charts — les nouveaux
> panneaux réutilisent le rendu `StatCard`/barres CSS déjà dans
> `/dashboard/admin/analytics/page.tsx` ; aucune donnée envoyée à un tiers ;
> minimum de PII (pas d'IP stockée dans `ProductEvent`, contrairement à
> `AuditLog` — non nécessaire au périmètre V1, voir IN0).
>
> **Règle de maintenance.** Dès qu'une phase est livrée, cocher `✅`, noter le
> fichier/PR. Toute nouvelle fonctionnalité produit visible utilisateur ajoute
> son événement **dans la même PR** — même discipline que `AuditAction` pour
> les surfaces sensibles (voir IN4). Ne jamais laisser ce fichier dériver de
> l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (fondations bloquantes, coût quasi nul) · `P1` (fort impact, conforme au calibrage de l'audit) · `P2` (produit / process).

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| IN0 | Fondations : modèle `ProductEvent` + module `logProductEvent` + id visiteur anonyme | **P0** | ✅ | PR #160 — `ProductEvent` (migration `20260721082024_add_product_event`), `src/lib/product-events.ts`, cookie `darna-vid` (`src/middleware.ts`), `LISTING_VIEWED` câblé sur `ListingDetail.tsx`. `trackEvent` (client) déféré à IN2 — voir détail. |
| IN1 | Funnel de découverte : recherche → vue annonce → début réservation | P1 | ✅ | PR #164 — `SEARCH_PERFORMED` câblé sur `searchSejours` (`resultCount` y compris 0), `BOOKING_STARTED` câblé sur la page `/annonce/[slug]/reserver`. `LISTING_VIEWED` déjà couvert par IN0. |
| IN2 | Adoption des fonctionnalités déjà livrées (simulateur, partage, alertes, carte) + 1ère touche d'acquisition | P1 | ✅ | PR #171 — `SIMULATOR_USED` (Yield Advisor), `SHARE_CLICKED` (3 canaux), `SAVED_SEARCH_CREATED`, `MAP_INTERACTED` (drag + zoom, throttlé session). Server Action `trackEvent` enfin construite (2 vrais appelants client). 1ère touche d'acquisition **différée** — voir détail. |
| IN3 | Panneaux funnel/adoption dans le dashboard admin existant | P1 | ❌ | — |
| IN4 | Discipline continue : entrée checklist de revue `QA_ROADMAP.md` | P2 | ❌ | — |

**Ordre d'exécution recommandé :** IN0 (prérequis, ~1j) → IN1 → IN2 → IN3 →
IN4. IN3 peut être découpé pour livrer un premier panneau dès la fin d'IN1 si
Wassim veut voir les données arriver avant la fin du chantier.

---

## Détail par tâche

### IN0 — [P0] Fondations

**Constat.** Rien n'écrit d'événement produit aujourd'hui. `logAudit`
(`src/lib/audit.ts:81`) est le seul point d'écriture d'événements du code, et
sa table/son enum `AuditAction` sont scopés sécurité (voir décision
d'architecture ci-dessus) — les y ajouter serait le mauvais outil pour ce job.

**Décision.**
- Nouveau modèle Prisma `ProductEvent` (migration dédiée), volontairement
  minimal — pas de champ spéculatif :
  - `id String @id @default(cuid())`
  - `event String` — voir `ProductEventName` (union TS fermée dans
    `src/lib/product-events.ts`, même convention que `AuditAction`)
  - `anonId String?` — id visiteur (cookie first-party), corrèle un parcours
    avant inscription
  - `userId String?` + relation `User? @relation(onDelete: SetNull)` (même
    pattern que `AuditLog`) ; back-relation `productEvents ProductEvent[]`
    sur `User`
  - `metadata String @default("{}")` — JSON stringifié
  - `createdAt DateTime @default(now())`
  - Index `[event, createdAt]` (requêtes funnel), `[anonId]`, `[userId]`,
    `[createdAt]` (purge future)
  - **Volontairement absents à ce stade :** `ip` (pas de besoin V1, minimise
    la surface PII) ; `path`/pageview générique (V1 = événements métier
    nommés avec contexte dans `metadata`, pas de tracking de page brute) ;
    `sessionId` (une session peut se dériver après coup de `anonId` + écart
    de temps si jamais utile — pas de colonne dédiée tant que rien ne la
    consomme).
- `src/lib/product-events.ts` : `logProductEvent()` avec **exactement** le
  contrat de `logAudit` — try/catch, `console.error` en échec, ne bloque
  jamais l'appelant.
- Cookie `darna-vid` (id anonyme aléatoire, 1 an, `httpOnly`), posé par
  `src/middleware.ts` — **pas** à côté de `darna-locale` comme envisagé
  initialement : `darna-locale` s'est avéré posé **côté client**
  (`document.cookie` dans `LanguageSwitcher.tsx`), un mécanisme différent et
  impropre ici. `darna-vid` doit exister dès la **toute première page vue**
  (avant toute hydratation client) pour ne pas perdre le début du parcours —
  d'où le choix du middleware (Edge, avant rendu). Fonctionnel, premier-parti,
  aucun partage tiers, aucun croisement publicitaire.
- Un seul événement câblé pour valider le pipe de bout en bout :
  `LISTING_VIEWED` sur `src/modules/core/listing/ListingDetail.tsx` (le point
  d'entrée le plus consulté, partagé par les deux verticales STAY/IMMO) —
  uniquement pour les annonces **actives** (exclut la prévisualisation par
  son propre hôte pendant `EN_ATTENTE_VALIDATION`).

**Périmètre réduit à l'implémentation.** La Server Action `trackEvent`
(événements **purement client** sans action serveur existante — clic
partage, interaction carte) est **déférée à IN2** plutôt que construite ici :
avec `PRODUCT_EVENT_NAMES` limité à `LISTING_VIEWED` (server-only) dans
cette PR, `trackEvent` n'aurait eu **aucun appelant réel** — contraire à la
discipline que ce chantier impose lui-même (§IN4, « pas de code en avance
sur la fonctionnalité qui le justifie »). Elle arrive avec `SHARE_CLICKED`
en IN2, son premier vrai appelant.

**Décision (Wassim, 2026-07-21) :** cookie `darna-vid` posé dès IN0, sans
attendre la bannière consentement cookies — périmètre first-party strict
(pas de fingerprinting, pas d'IP stockée, pas de croisement tiers).

**Tests.** `tests/product-events.test.ts` (5) : `logProductEvent` écrit
anonId/userId/metadata sérialisée, normalise les valeurs absentes, et
n'expose jamais d'exception à l'appelant (échec DB simulé) ; `getAnonId` lit
le cookie ou renvoie `null`. `tests/middleware-visitor-cookie.test.ts` (4) :
pose un UUID valide si absent, stable si déjà valide, régénère si mal formé,
toujours `httpOnly`. **Vérifié en direct** (Postgres local + seed + `npm run
dev`) : visite réelle d'une fiche annonce active → cookie posé + ligne
`ProductEvent` correcte ; 2ᵉ visite → cookie stable, même `anonId` corrèle
les deux vues ; fiche expirée → aucun événement.

### IN1 — [P1] Funnel de découverte

**Constat.** `bookingFunnel` (`getFounderAnalytics()`,
`src/lib/analytics.ts:111-120`) démarre à `Booking` créé. Rien ne mesure la
perte **avant** : nombre de recherches, nombre de vues d'annonce, nombre de
débuts de réservation abandonnés avant soumission — exactement la « perte
top-of-funnel » que l'audit reproche.

**Décision — événements :**
- `SEARCH_PERFORMED` — ville/dates/filtres actifs + nombre de résultats,
  y compris `resultCount: 0`. Câblé dans `searchSejours`
  (`src/lib/listings.ts`), sur les deux chemins de retour (ville inconnue et
  résultats réels).
- `LISTING_VIEWED` — déjà couvert par IN0 (repris tel quel).
- `BOOKING_STARTED` — câblé dans
  `src/app/annonce/[slug]/reserver/page.tsx` (Server Component), **pas** dans
  `BookingPanel.tsx` lui-même. **Correction à l'implémentation** :
  `BookingPanel` constitue la totalité du contenu de cette route dédiée — il
  n'y a pas d'« ouverture » de panel séparée à observer côté client,
  l'arrivée sur la page EST l'ouverture. Émis au même point que
  `LISTING_VIEWED` (Server Component, donc pas de Server Action `trackEvent`
  nécessaire ici non plus), exclu pour l'hôte propriétaire (`isOwner`, garde
  déjà existante pour l'affichage) — distinct du `Booking` `EN_ATTENTE` créé
  par `createBookingAction`, qui ne capture que les tentatives allées
  jusqu'au bout.
- Ensemble, ces trois événements + le funnel existant donnent la chaîne
  complète : recherche → vue annonce → début réservation → réservation
  confirmée.

**Tests.** `tests/listings.test.ts` (3) : `searchSejours` écrit
`SEARCH_PERFORMED` avec `resultCount: 0` sur ville inconnue (sans requêter la
DB), le vrai `resultCount` sur une recherche avec résultats, et associe
l'utilisateur connecté quand une session existe. **Vérifié en direct**
(Postgres jetable isolé + migrations + seed + `npm run dev`) : recherche
réelle avec résultats (`resultCount: 3`) et sans résultat (`resultCount: 0`,
ville inconnue) → ligne `ProductEvent` correcte dans les deux cas ; visite
connectée d'une page de réservation → `BOOKING_STARTED` avec le bon
`userId`/`propertyId`/`vertical`. L'écart `BOOKING_STARTED` sans
`BOOKING_CREATED` correspondant (mesure de l'abandon) est une propriété
**analytique** de la chaîne complète, pas un test unitaire isolé — à
observer une fois des données réelles accumulées (cf. IN3).

### IN2 — [P1] Adoption des fonctionnalités existantes + 1ère touche d'acquisition

**Constat.** F4 à F9 de `FEATURES_ROADMAP.md` (filtres, fiche hôte, partage,
notifications, alertes de recherche) sont tous `✅` livrés — et **aucun n'a de
mesure d'usage**. Idem pour le Yield Advisor
(`src/app/dashboard/yield/page.tsx`, `src/lib/yield.ts`), en production
depuis un moment. Impossible aujourd'hui de savoir si ces investissements
sont utilisés.

**Décision — événements :**
- `SIMULATOR_USED` — câblé dans `src/app/dashboard/yield/page.tsx` (Server
  Component, comme `LISTING_VIEWED`/`SIMULATOR_USED`), `propertyCount` +
  `recommendations` (tableau des recommandations retournées par
  `computeYield`) en metadata. **Ajusté à l'implémentation** : la page
  n'a pas de champ « ville/gouvernorat » saisi par l'hôte — l'analyse porte
  automatiquement sur toutes ses annonces. Logué uniquement si
  `properties.length > 0` (un état vide n'est pas un usage réel).
- `SAVED_SEARCH_CREATED` — câblé dans `saveSearchAction`
  (`src/actions/saved-search.ts`, Server Action déjà existante), après la
  création réussie uniquement (jamais sur doublon/validation échouée).
- `SHARE_CLICKED` et `MAP_INTERACTED` sont **purement client**
  (`ShareButton.tsx` : `navigator.share`/clipboard/lien WhatsApp ;
  `MapInner.tsx` : Leaflet, `ssr:false`) — premiers vrais appelants de la
  Server Action `trackEvent` déférée depuis IN0 :
  `src/actions/track-event.ts`, catalogue restreint
  (`CLIENT_EVENT_NAMES`, sous-ensemble de `PRODUCT_EVENT_NAMES` — un
  événement server-only comme `BOOKING_STARTED` reste impossible à forger
  depuis le client), `zod`, `metadata` plafonnée (2 Ko), rate-limitée
  (`src/lib/rate-limit.ts`, clé `anonId`/IP).
  - `SHARE_CLICKED` : canal capturé (`native`/`copy`/`whatsapp`), jamais
    loggé sur annulation du partage natif (`AbortError`). Appel
    fire-and-forget (non-awaité) — accepté de perdre l'événement WhatsApp si
    la navigation coupe la requête en vol, même logique best-effort que le
    reste du chantier.
  - `MAP_INTERACTED` : **correction à l'implémentation** — écouter
    `zoomstart`/`movestart` (comme envisagé initialement) aurait déclenché
    un faux positif à **chaque** chargement de page, Leaflet émettant ces
    événements aussi pour le `setView`/`fitBounds` **programmatique** déjà
    fait par `AutoResize` au montage. Écoute `dragstart` (jamais émis
    programmatiquement) + clic réel sur les boutons de zoom (mêmes nœuds DOM
    que `ZoomFocusFix`). Throttle via `sessionStorage` (pas de cookie dédié)
    — une session peut traverser plusieurs cartes (résultats de recherche
    PUIS fiche annonce) sans compter plusieurs événements.

**Périmètre réduit à l'implémentation : 1ère touche d'acquisition
(`?ref=`/UTM) différée**, pas construite dans cette PR. Contrairement aux 4
événements ci-dessus, elle n'a **aucun consommateur concret aujourd'hui** (le
programme de parrainage diaspora n'existe pas encore) et sa plomberie est
plus intrusive qu'il n'y paraît : le seul point où **toute** page d'atterrissage
peut être captée est le middleware (Edge) — qui n'a **pas accès à Prisma**
(la même contrainte qui a façonné le cookie `darna-vid` en IN0). Une capture
correcte demanderait un cookie dédié + une lecture différée par le premier
événement serveur, pour un gain nul tant que rien ne consomme la donnée.
À construire **avec** `CROISSANCE_ROADMAP.md` §CR0 (fondations
`referralCode`), qui définira le vrai modèle d'attribution — même discipline
que la note ci-dessous sur `REFERRAL_SIGNUP`.

**Note.** `REFERRAL_SIGNUP` et `LISTING_COMPLETION_VIEWED` — cités en exemple
dans la discussion d'origine — ne sont **pas** dans ce chantier : ils
mesurent des fonctionnalités qui n'existent pas encore (programme de
parrainage, score de complétion d'annonce). Règle proposée pour IN4:
l'événement s'ajoute **dans la même PR** que la fonctionnalité qui le
justifie, jamais en avance sur du code qui n'existe pas.

**Tests.** `tests/track-event.test.ts` (7) : catalogue client restreint
(rejette `BOOKING_STARTED`), rejet metadata surdimensionnée/entrée invalide,
résolution userId/anonId serveur, rate-limit (clé anonId puis repli IP).
`tests/components/share-button.test.tsx` (4) : les 3 canaux + non-mesure sur
annulation native. `tests/saved-search-events.test.ts` (3) : événement sur
succès uniquement. Pas de test unitaire pour `MapInner`/Yield Advisor —
même précédent que `PropertyMap` (Leaflet mocké en jsdom, `tests/components/
property-map.test.tsx`) et que `ListingDetail` en IN0 : validés par smoke
test réel plutôt que simulés. **Vérifié en direct** (Postgres local + seed +
`npm run dev`, compte `hote@darna.tn`) : Yield Advisor (13 annonces) →
`SIMULATOR_USED` correct ; recherche Hammamet + création d'alerte →
`SAVED_SEARCH_CREATED` correct ; fiche annonce → partage « Copier le lien »
→ `SHARE_CLICKED` (`channel: copy`) ; carte — clic zoom **et** drag (testés
séparément) → `MAP_INTERACTED` ; une 2ᵉ interaction dans la même session ne
duplique pas l'événement (throttle vérifié).

### IN3 — [P1] Panneaux dans le dashboard admin existant

**Constat.** `/dashboard/admin/analytics` est déjà le pilote unique de
Wassim (admin-only, `force-dynamic`, rendu `StatCard`/barres CSS sans lib de
charts). Pas de raison d'en construire un second.

**Décision.** Étendre `getFounderAnalytics()` — ou ajouter un
`getFunnelAnalytics()` séparé si le fichier devient trop chargé (à trancher
à l'implémentation, seuil indicatif ~600-700 lignes) — avec : conversion
recherche → vue → début → confirmation (même pattern visuel que l'existant) ;
compteurs d'adoption (simulateur, partages, alertes créées vs déclenchées) ;
répartition des sources d'acquisition (`ref`/UTM). Même garde admin-only,
même agrégation Prisma à la volée.

**Tests.** Rendu de page avec données de seed ; aucune régression sur les
sections déjà livrées (north-star, funnel réservation, cohortes, Wakil).

### IN4 — [P2] Discipline continue

**Décision.** Ajouter une ligne à la checklist de revue de code de
`QA_ROADMAP.md` : toute nouvelle fonctionnalité produit visible utilisateur
ajoute son (ses) événement(s) `ProductEvent` dans la même PR — même exigence
que celle qui protège déjà `AuditLog` sur les surfaces sensibles. Sans cette
discipline, ce chantier redevient un instantané qui se périme aussitôt livré
— constat déjà vrai aujourd'hui pour F4 à F9.

---

## Catalogue d'événements V1 (résumé)

| Événement | Phase | Déclencheur | Anonyme possible ? |
|---|---|---|---|
| `SEARCH_PERFORMED` | IN1 | Recherche sur `/sejours` | Oui |
| `LISTING_VIEWED` | IN0/IN1 | Fiche annonce (`ListingDetail.tsx`) | Oui |
| `BOOKING_STARTED` | IN1 | Ouverture de `BookingPanel` | Non (connexion requise pour réserver) |
| `SIMULATOR_USED` | IN2 | Yield Advisor (`/dashboard/yield`) | Non (page dashboard connectée) |
| `SHARE_CLICKED` | IN2 | `ShareButton` | Oui |
| `SAVED_SEARCH_CREATED` | IN2 | `SaveSearchButton` | Non (nécessite un compte) |
| `MAP_INTERACTED` | IN2 | `MapInner`/`PropertyMap` | Oui |

---

## Questions ouvertes (arbitrage Wassim)

1. Cookie `darna-vid` dès IN0, ou après la bannière consentement cookies
   (`QA_ROADMAP.md`, encore `❌`) ?
2. Fenêtre de rétention par défaut de `ProductEvent` — proposition : aligner
   sur ce qui sera décidé pour la purge `AuditLog` (`QA_ROADMAP.md`) plutôt
   que deux politiques distinctes.
3. `analytics.ts` étendu en place, ou nouveau fichier séparé pour les
   panneaux funnel (IN3) ? Dépend de la taille du fichier au moment de coder.

## Effort estimé

IN0 ~0,5-1 j · IN1 ~1 j · IN2 ~0,5-1 j · IN3 ~0,5-1 j · IN4 négligeable
→ **~3-4 jours** pour tout le P0/P1, cohérent avec le calibrage effort
« Faible » de `AUDIT_V1.md`.

---

**Statut du chantier : IN0 (#160), IN1 (#164) et IN2 (#171) livrés — IN3/IN4
restants.** Chantier transverse, indépendant de la chaîne `ANNULATION_HOTE_*`
(déjà entièrement traversée) — ne s'y substitue pas et ne doit pas interrompre
un P0 déjà en cours ailleurs. IN3 (panneaux funnel/adoption dans le dashboard
admin existant) a maintenant de vraies données à afficher (funnel complet
IN1 + adoption IN2) — c'est la suite naturelle.
