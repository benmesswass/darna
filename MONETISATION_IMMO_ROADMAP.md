# Darna — Monétisation de la verticale Immobilier : Roadmap

> **Référence permanente de ce chantier.** Décidé en session produit du
> 2026-07-16, suite au constat que la verticale `immo` (location longue
> durée + vente + terrain, `src/modules/immo/README.md`) ne génère
> aujourd'hui **aucun revenu** — c'est un funnel de mise en relation gratuit
> (recherche → contact/visite → bail), avec l'invariant produit **« jamais
> de paiement en ligne dans ce module »** qui reste intouché par ce chantier.
>
> **Contrainte réglementaire posée en amont (à valider avec un avocat
> d'affaires / expert-comptable tunisien avant toute activation en
> production réelle, même logique que `PAIEMENT_SUR_PLACE_ROADMAP.md`) :**
> l'intermédiation immobilière rémunérée **au pourcentage d'une
> transaction** (courtage classique — commission sur un loyer ou un prix de
> vente signé) est une activité réglementée en Tunisie (carte professionnelle
> d'agent immobilier). Ce chantier **exclut donc volontairement** tout
> success-fee assis sur une transaction immobilière tant que Darna n'a pas
> de statut d'agence agréée ou de partenariat avec des agences qui le sont
> déjà. Les 4 flux retenus ci-dessous (boost, abonnement pro, vérification
> payante, apport d'affaires bancaire) sont ceux qui **ne nécessitent pas**
> ce statut — modèle "portail d'annonces" (Mubawab/SeLoger), pas modèle
> "agence".
>
> **Ce qui existe déjà et qu'il ne faut pas réinventer :** le boost « à la
> une » (`Property.featuredUntil`, `FEATURED_PRICE_TND = 49` TND/semaine,
> `src/lib/config.ts`) est **déjà entièrement construit** — modèle de
> données, UI (`src/app/dashboard/annonces/[id]/a-la-une/page.tsx`), action
> serveur (`featureListingAction`, `src/actions/properties.ts`) — mais le
> paiement est un **mock assumé** (`fr.alaUne.mockInfo`), exactement comme
> l'était le séquestre avant l'intégration Konnect. C'est donc le point de
> départ naturel de ce chantier : brancher un vrai paiement dessus est le
> quick win le plus rapide, et il s'applique aux DEUX verticales (`Property`
> est un modèle partagé stay/immo) sans code UI nouveau.
>
> Le rôle `User.role = "AGENCE"` existe déjà (inscription, permissions,
> dashboard — cf. `src/lib/constants.ts`, `src/actions/auth.ts`) mais n'a
> aujourd'hui aucune limite ni palier associé : c'est le point d'ancrage
> naturel pour l'abonnement professionnel (MI1/MI2).
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Compagnon de
> `FEATURES_ROADMAP.md`, `DESIGN_ROADMAP.md`, `QA_ROADMAP.md`,
> `PAIEMENT_SUR_PLACE_ROADMAP.md` — ne jamais laisser ce fichier dériver de
> l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR) · `⏸️` bloqué (prérequis business/légal hors code).
- **Priorité :** `P0` (bloquant pour un premier revenu réel) `P1` (fort impact) `P2` (nice-to-have / dépend d'un partenariat externe).

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| **MI0** | **Brancher un paiement Konnect réel sur le boost « à la une » existant** (remplacer le mock de `featureListingAction`), pour les deux verticales | **P0** | ✅ | Nouveau modèle `FeaturedOrder` (migration `20260716105454_add_featured_order`), `settleFeaturedOrder` (`src/lib/featured-payments.ts`, miroir de `settleHostInvoice`), `startFeaturedOrderPaymentAction` (`src/actions/properties.ts`), webhook dédié `src/app/api/payments/konnect/featured-webhook/route.ts`, `FeaturedPayButton` (`src/components/dashboard/FeaturedPayButton.tsx`), page `/dashboard/annonces/[id]/a-la-une` branchée sur les deux modes (réel si Konnect actif, mock sinon — `featureListingAction` gardée en fallback démo, désormais gatée `!isKonnectEnabled()`). i18n (3 dictionnaires). Tests : `featured-payments.test.ts`, `featured-payment-idor.test.ts`, `featured-webhook.test.ts` (23 tests). `QA_ROADMAP.md` §6.2 ajouté. Vérifié en Playwright (démo + branche erreur Konnect avec clé factice, cf. rapport de test). |
| MI1 | Modèle de données abonnement pro : `User.subscriptionPlan`/`subscriptionUntil` (dérivé, même esprit que `Property.featuredUntil` — pas de statut stocké séparément, pas de table `Subscription` dédiée) + paliers `AGENCY_PLANS` dans `constants.ts` (nb d'annonces actives incluses, prix) | P0 | ✅ | Migration `20260716135242_add_agency_subscription`. `AGENCY_PLANS` (`src/lib/constants.ts` : Starter 29 TND/5 annonces, Pro 79 TND/20, Agence+ 149 TND/illimité). Prix Starter décidé par Wassim (session du 2026-07-16) ; Pro/Agence+ proposés par Claude, ajustables. Volontairement **sans logique ni UI** (pas de helper de lecture, pas d'enforcement, pas de paiement) — posés ensemble en MI2 pour éviter du code mort entre les deux phases. |
| MI2 | Limite du nombre d'annonces actives selon abonnement (ou absence d'abonnement = palier gratuit limité) + page dashboard de souscription/renouvellement (lien de paiement Konnect ponctuel, même patron que `HostInvoice`/PSP4-PSP5 : pas d'abonnement récurrent auto-débité, Konnect ne le supporte pas nativement) | P0 | ❌ | Dépend de MI1. |
| MI3 | Vérification Wakil payante pour les comptes `AGENCE` (garder la 1ère vérification gratuite pour particuliers ; payante en volume/renouvellement pour les pros) | P1 | ⏸️ | Dépend de la capacité réelle du réseau Wakil à absorber du volume payant sans dégrader le délai — à confirmer avec Wassim avant de coder un prix. |
| MI4 | Pack visibilité inclus dans le palier « Agence+ » (X boosts « à la une » offerts/mois, réutilise MI0) | P2 | ❌ | Dépend de MI0 + MI1. |
| MI5 | Apport d'affaires financement : modèle `FinancingLead` (simulation crédit demandée depuis une fiche immo) + export/dashboard admin pour un partenaire bancaire, commission au succès facturée à la banque | P2 | ⏸️ | **Bloqué tant qu'aucun partenariat bancaire n'est signé** — le code (capture du lead) peut être fait en amont, mais la monétisation réelle dépend d'une convention externe hors scope de ce dépôt. |
| MI6 | QA/sécurité : tests idempotence paiement boost, IDOR abonnement (un hôte ne peut pas payer/voir l'abonnement d'un autre), non-bypass des limites d'annonces actives ; mise à jour `QA_ROADMAP.md` | P0 | ❌ | Transverse — à livrer avec chaque phase concernée, pas uniquement à la fin (même règle que PSP7). |

## Exécution (prioritisée)

**Quick win (avant tout le reste, zéro prérequis externe) :**
1. ✅ MI0 — paiement réel sur le boost existant.

**Fondations abonnement pro (prix décidés) :**
2. ✅ MI1 — modèle de données + paliers.
3. ❌ MI2 — limite + page de souscription.

**Extensions (après fondations) :**
4. ⏸️ MI3 — vérification Wakil payante.
5. ❌ MI4 — pack visibilité agence.

**Partenariat externe (hors code pur) :**
6. ⏸️ MI5 — apport d'affaires financement.

**Transverse :**
7. 🔧 MI6 — QA/sécurité, à chaque phase. Portion MI0 livrée (`QA_ROADMAP.md` §6.2) ; reste à couvrir au fur et à mesure de MI1-MI5.

---

## Chiffrage — combien ce modèle peut rapporter à Darna

**Méthode et limite assumée.** Ce ne sont **pas** des chiffres mesurés — Darna
n'a aujourd'hui aucun revenu immobilier, donc il n'y a rien à extrapoler
depuis un historique réel. Ce sont des **projections construites à partir
de données réelles** (`FEATURED_PRICE_TND = 49` TND/semaine, déjà en prod
côté mock ; grille `AGENCY_PLANS` ci-dessous, prix décidés par Wassim) et
d'hypothèses de volume **explicites, modifiables, et à valider** —
notamment via les objectifs business déjà posés par les investisseurs
(`.agents/product-marketing.md` : 100 annonces vérifiées réelles court
terme, 500 annonces vérifiées actives = north-star).

### Grille tarifaire abonnement pro (`AGENCY_PLANS`, MI1) — décidée le 2026-07-16

| Palier | Prix | Annonces actives incluses | Décision |
|---|---|---|---|
| **Starter** | **29 TND/mois** | 5 | **Tranché par Wassim** — prix d'entrée volontairement bas pour lever la friction de la première conversion payante. |
| **Pro** | 79 TND/mois | 20 | Proposé par Claude, validé par Wassim comme point de départ — **ajustable**, pas encore confronté à une vraie agence. |
| **Agence+** | 149 TND/mois | Illimité + inclut des boosts « à la une » (MI4) | Idem — ajustable. |

Le taux d'attachement au boost (15 %/mois) reste, comme avant, un ordre de
grandeur inspiré des portails classifieds comparables (Mubawab/Tayara) —
**pas un chiffre sourcé**.

### Hypothèses de volume (3 horizons)

| Horizon | Annonces immo actives | Agences abonnées (répartition Starter / Pro / Agence+) | Vérifications pro payantes/mois | Dossiers financement signés/mois |
|---|---|---|---|---|
| **Pilote (M+3)** | 100 *(objectif investisseurs déjà posé)* | 10 (7 / 2 / 1) | 5 | 1 |
| **Ramp (M+12)** | 200 *(= 40 % des 500 annonces vérifiées actives, north-star)* | 30 (12 / 12 / 6) | 20 | 4 |
| **Scale (M+24)** | 600 *(hypothèse ×3 sur 12 mois supplémentaires)* | 90 (30 / 40 / 20) | 60 | 12 |

Répartition volontairement décalée vers Starter au Pilote (prix d'entrée bas
= plus facile à vendre en premier) puis vers Pro/Agence+ à mesure que les
agences font grossir leur portefeuille d'annonces.

### Revenu mensuel par flux (TND)

| Flux | Détail | Pilote (M+3) | Ramp (M+12) | Scale (M+24) |
|---|---|---|---|---|
| Boost « à la une » (MI0), attachement 15 %/mois | 49 TND/semaine | 100 × 15 % × 49 = **735** | 200 × 15 % × 49 = **1 470** | 600 × 15 % × 49 = **4 410** |
| Abonnement agence (MI1/MI2) | 7×29+2×79+1×149 / 12×29+12×79+6×149 / 30×29+40×79+20×149 | **510** | **2 190** | **7 010** |
| Vérification Wakil payante pro (MI3) | 40 TND | 5 × 40 = **200** | 20 × 40 = **800** | 60 × 40 = **2 400** |
| Apport d'affaires financement (MI5) | 300 TND/dossier | 1 × 300 = **300** | 4 × 300 = **1 200** | 12 × 300 = **3 600** |
| **Total mensuel** | | **1 745 TND** (~515 EUR) | **5 660 TND** (~1 665 EUR) | **17 420 TND** (~5 125 EUR) |
| **Total annualisé** | | **~20 900 TND/an** | **~67 900 TND/an** | **~209 000 TND/an** |

*(Conversion EUR indicative au taux `EUR_TO_TND = 3.4` déjà utilisé dans le
code, `src/lib/config.ts` — c'est un affichage, jamais le montant réellement
encaissé, qui reste en TND comme le reste de Darna.)*

### Lecture de ces chiffres

- **Le prix d'entrée à 29 TND/mois change franchement l'échelle vs la première
  version de ce chiffrage** (qui supposait ~250 TND/mois de moyenne pondérée,
  sans grille réelle) : le total abonnement passe de 2 500/7 500/22 500 TND
  à 510/2 190/7 010 TND selon l'horizon — un choix cohérent pour maximiser le
  nombre d'agences qui signent tôt (preuve de traction), au prix d'un panier
  moyen plus faible tant que le mix ne bascule pas vers Pro/Agence+.
- **Le flux le plus rapide à activer (MI0) redevient comparable à l'abonnement
  au Pilote** (735 vs 510 TND/mois) — c'est le boost, pas l'abonnement, qui
  porte le plus au démarrage ; l'abonnement ne prend l'avantage qu'à partir du
  Ramp, une fois le mix de paliers plus mûr.
- **Pro (79 TND) et Agence+ (149 TND) restent à confronter au marché réel** —
  seul Starter est une décision ferme de Wassim ; quelques appels à des
  agences à Hammamet/Nabeul/Sousse permettraient de confirmer ou ajuster ces
  deux paliers avant de les considérer acquis (les montants sont de simples
  constantes dans `constants.ts`, triviales à corriger après coup).
- **MI5 (financement) dépend d'un partenariat externe non encore signé** —
  son chiffre (300-3 600 TND/mois) est donc conditionnel, pas un acquis de
  roadmap produit.
- À l'échelle Scale (M+24), ~209 000 TND/an reste **un complément**, pas un
  pivot de modèle : à comparer à la commission `SERVICE_FEE_RATE = 8 %` déjà
  en place sur `stay` (revenu par réservation, pas par annonce) pour juger
  l'ordre de grandeur relatif une fois que le volume de réservations séjour
  sera lui-même mesuré en production.

---

## Prompts Claude Code

> Un seul prompt prêt à l'emploi pour l'instant (MI0, zéro prérequis
> externe). Les prompts MI1+ seront rédigés une fois les prix agence validés
> par Wassim (cf. §Chiffrage) — inutile de coder des montants en dur non
> confirmés.

### Prompt MI0 — Paiement réel sur le boost « à la une »

```
Contexte : MONETISATION_IMMO_ROADMAP.md, ligne MI0. Lis d'abord ce fichier
en entier, puis src/actions/properties.ts (featureListingAction, autour de
la ligne 407) et src/app/dashboard/annonces/[id]/a-la-une/page.tsx —
aujourd'hui le boost "à la une" (Property.featuredUntil, FEATURED_PRICE_TND
= 49 TND/semaine) est un paiement 100% mock : featureListingAction applique
l'effet métier immédiatement, sans passer par Konnect.

Objectif : brancher un vrai paiement Konnect, en miroir de l'existant pour
les séjours (startKonnectPaymentAction dans src/actions/bookings.ts +
settleKonnectBooking dans src/lib/payments.ts + le webhook
src/app/api/payments/konnect/webhook/route.ts) — NE PAS dupliquer la logique
Konnect elle-même (src/lib/konnect.ts reste inchangé, isKonnectEnabled()
continue de piloter le fallback démo/réel).

1. Nouvelle action startFeaturedListingPaymentAction (src/actions/
   properties.ts ou nouveau fichier à ton jugement) : vérifie la propriété
   du bien (requireOwnProperty), l'éligibilité (ACTIVE, non expirée — même
   check que featureListingAction actuel), initialise un paiement Konnect
   via initKonnectPayment (amount = tndToMillimes(FEATURED_PRICE_TND)),
   stocke la référence quelque part (nouveau champ ou table légère — à toi
   de juger le plus simple : un featuredPaymentRef sur Property, ou une
   table dédiée si tu préfères garder Property propre), renvoie payUrl.
2. Fonction settleFeaturedPayment (src/lib/listings.ts ou nouveau fichier,
   PAS "use server", même raison que settleKonnectBooking) : idempotente,
   revérifie le montant reçu via getKonnectPayment, puis applique EXACTEMENT
   la même logique de prolongation que featureListingAction actuelle (cumul
   depuis featuredUntil restant si futur, sinon depuis maintenant).
3. Webhook dédié (GET, en miroir du webhook réservation/host-invoice, même
   garde de signature signKonnectWebhook/verifyKonnectWebhook, même rate
   limit) qui appelle settleFeaturedPayment.
4. Page /dashboard/annonces/[id]/a-la-une : remplace le bouton qui appelle
   featureListingAction directement par un bouton qui déclenche
   startFeaturedListingPaymentAction puis redirige côté client vers payUrl
   (même patron que KonnectPayButton.tsx). Supprime l'affichage
   fr.alaUne.mockInfo (n'est plus vrai) UNIQUEMENT quand Konnect est actif
   (isKonnectEnabled()) — garde le fallback mock intact (featureListingAction
   existante, inchangée) quand Konnect n'est pas configuré, exactement comme
   le reste de Darna bascule démo/réel.
5. i18n : nouvelles chaînes dans les trois dictionnaires si besoin.

Sécurité : IDOR (un hôte ne peut pas payer le boost d'une annonce qui n'est
pas la sienne), idempotence du webhook (double paiement ne double pas la
durée), non-bypass (impossible de forcer featuredUntil sans paiement validé
quand Konnect est actif). Ajoute les tests correspondants.

Coche MI0 dans MONETISATION_IMMO_ROADMAP.md (fichiers/PR). Commit + push.
Bloc "Comment tester" (règle CLAUDE.md) : préciser que sans KONNECT_API_KEY
configuré en local, le parcours réel Konnect ne peut être vérifié qu'en
mode démo (featureListingAction existante reste le chemin testable), et
donner le compte hôte démo adéquat (prisma/seed.ts) propriétaire d'une
annonce ACTIVE pour tester le flux.
```
