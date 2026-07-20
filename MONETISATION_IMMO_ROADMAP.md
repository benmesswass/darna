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
> une » (`Property.featuredUntil`, `FEATURED_PRICE_TND = 29` TND/mois,
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
| MI1 | Modèle de données abonnement pro : `Subscription` (userId, plan, status, currentPeriodEnd) + paliers `AGENCY_PLANS` dans `constants.ts` (nb d'annonces actives incluses, prix) | P0 | ✅ | Modèle `Subscription` (migration `20260716120524_add_subscription`, une ligne par utilisateur, `EXPIRE` dérivé jamais stocké — même principe que `HostInvoice`/`FeaturedOrder`). Trois paliers dans `src/lib/constants.ts` — **Starter** (3 annonces, 50 TND/mois), **Standard** (10 annonces, 100 TND/mois), **Pro** (30 annonces, 200 TND/mois) — **prix PROVISOIRES, non confrontés à une vraie agence**, revus à la baisse le 2026-07-16 par rapport à l'hypothèse initiale (palier unique à 250 TND, jugée trop chère pour une plateforme encore en construction de confiance sur le marché tunisien). Page `/dashboard/abonnement` affiche les 3 paliers en cartes sélectionnables ; la modale/notification de quota atteint (§MI2) recommande le palier le moins cher qui couvrirait réellement le besoin (`cheapestPlanForQuota`, `src/lib/subscriptions.ts`), jamais un palier insuffisant. Tests : `agency-plans.test.ts`, cas `cheapestPlanForQuota` dans `subscriptions.test.ts`. |
| MI2 | Limite du nombre d'annonces actives selon abonnement (ou absence d'abonnement = palier gratuit limité) + page dashboard de souscription/renouvellement (lien de paiement Konnect ponctuel, même patron que `HostInvoice`/PSP4-PSP5 : pas d'abonnement récurrent auto-débité, Konnect ne le supporte pas nativement) | P0 | ✅ | `Subscription.paymentRef` (migration `20260716140000_add_subscription_payment_ref` — ligne UNIQUE réutilisée à chaque cycle, contrairement à `FeaturedOrder`/`HostInvoice` : l'idempotence webhook/retour repose donc sur `paymentRef` remis à `null` au règlement, pas sur `status`, cf. `src/lib/subscription-payments.ts`). Limite dérivée (jamais stockée) dans `src/lib/subscriptions.ts` (`activeListingsLimit`, `FREE_TIER_LISTINGS_LIMIT = 3` — provisoire) — appliquée au SEUL point où une annonce devient `ACTIVE` : `verifyPropertyAction` (`src/actions/admin.ts`), pas à la création (une annonce `EN_ATTENTE_VALIDATION` ne compte pas encore dans le quota). Page `/dashboard/abonnement` (nav réservée aux comptes `AGENCE`) branchée sur les deux modes (réel/mock comme MI0), avec pitch honnête (coût ramené à l'annonce incluse, nombre d'annonces en attente débloquées par la souscription — jamais d'urgence artificielle). **Double signal à l'agence quand le quota est atteint** : (a) modale informative (PAS un blocage) juste après la création d'une annonce si le quota est déjà dépassé (`QuotaReachedModal`, `src/components/dashboard/QuotaReachedModal.tsx`, déclenchée par `createPropertyAction`) ; (b) notification in-app (`ANNONCE_LIMITE_ABONNEMENT`, `notifyAgencyQuotaReached`) quand un admin/wakil tente ensuite — et échoue — à vérifier cette annonce (l'agence n'a sinon aucun autre moyen de le savoir, seul l'admin voyait l'erreur auparavant). Tests : `subscriptions.test.ts`, `subscription-payments.test.ts`, `subscription-payment-access.test.ts`, `subscription-webhook.test.ts`, `notification-quota.test.ts`, + cas ajoutés à `admin.test.ts` (517 tests suite complète). `QA_ROADMAP.md` §6.3 ajouté. Vérifié en Playwright bout en bout (Postgres local) : création d'annonce au-delà du quota → modale immédiate avec les bons chiffres → refus admin → notification reçue (cloche) → pitch complet sur `/dashboard/abonnement`, cf. rapport de test. |
| MI3 | Vérification Wakil payante — **régime DIFFÉRENT par rôle** (décision finale Wassim du 2026-07-20, remplace l'hypothèse initiale du 2026-07-17 ci-dessous) | P1 | ✅ | **HOTE (particulier) : AUCUNE vérification gratuite, paiement À L'UNITÉ obligatoire AVANT chaque vérification** (`HOST_VERIFICATION_PRICE_TND = 20` TND, `src/lib/config.ts` — **prix PROVISOIRE**), jamais de lot. **AGENCE : `FREE_VERIFICATION_CREDITS = 1` gratuite À VIE** (réduit de 3 à 1 le 2026-07-20), **+ bonus ponctuel de 3 crédits à la 1re activation du palier Starter** (`AGENCY_PLANS[].verificationCreditsBonus`, générique — non nul seulement pour Starter ; accordé UNE SEULE FOIS, jamais aux renouvellements, cf. `Subscription.starterBonusGranted`, migration `20260720071438_add_subscription_starter_bonus`), puis achat d'un lot prépayé (`VERIFICATION_CREDIT_PACKS` : 10 vérifs/40 TND, 25 vérifs/90 TND — **prix PROVISOIRES**) — **jamais de paiement à l'unité pour une agence** (régime volontairement différent du HOTE). Les deux régimes partagent le MÊME solde (`VerificationWallet`, migration `20260717151955_add_verification_credits`, matérialisée paresseusement — absence de ligne = solde initial dépendant du rôle via `freeVerificationCreditsFor(role)`, `src/lib/verification-credits.ts`) et le MÊME modèle d'achat (`VerificationCreditOrder`, miroir `FeaturedOrder` — une ligne par achat, y compris pour le paiement HOTE à l'unité, credits=1 fixe). Consommation atomique (`consumeVerificationCredit(userId, role)`) branchée dans `verifyPropertyAction` (`src/actions/admin.ts`), pour LES DEUX rôles désormais — après le check de quota d'annonces AGENCE-only (§MI2) et avant l'activation réelle. **Un crédit consommé couvre l'annonce À VIE** (correction Wassim du 2026-07-20 : « une fois il a payé l'annonce reste vérifiée sans devoir repayer... c'est un crédit = une annonce vérifiée à vie ») — `Property.verificationCreditSpentAt` (`DateTime?`, migration `20260720084214_add_property_verification_credit_spent`) marque la consommation de façon PERMANENTE par annonce, jamais réinitialisé ; `verifyPropertyAction` ne consomme donc plus jamais de crédit pour la même annonce, y compris après `unverifyPropertyAction` (retrait de badge) ou `republishPropertyAction` (republication après expiration à `LISTING_LIFETIME_DAYS`). Solde épuisé → refus + notification différenciée par rôle (`ANNONCE_CREDITS_VERIF_EPUISES`/`notifyAgencyOutOfVerificationCredits` → `/dashboard/abonnement` pour l'agence ; `ANNONCE_VERIF_PAIEMENT_REQUIS`/`notifyHostVerificationPaymentRequired` → `/dashboard/annonces` pour le particulier). UI : section crédits sur `/dashboard/abonnement` (agence) ; bouton "Payer la vérification" par annonce non vérifiée sur `/dashboard/annonces` (HOTE, `src/actions/host-verification-payments.ts`, `HostVerificationPayButton`) — réutilise le webhook `verification-credit-webhook` existant (générique, indifférent au rôle). Règlement `settleVerificationCreditOrder` (`src/lib/verification-credit-payments.ts`, miroir `settleFeaturedOrder`). Tests : `verification-credits.test.ts`, `verification-credit-payments.test.ts`, `verification-credit-payment-action.test.ts`, `host-verification-payments.test.ts`, cas bonus Starter dans `subscription-payments.test.ts`/`subscription-payment-access.test.ts`, + cas HOTE/AGENCE dans `admin.test.ts` — dont 2 régressions dédiées à la couverture à vie (republication AGENCE et HOTE après expiration, solde à 0, zéro re-consommation) (566 tests suite complète). `QA_ROADMAP.md` §6.4 ajouté. Vérifié en preview (Postgres local), cas par cas : HOTE bloqué→paie (démo)→vérifié ; AGENCE 1 gratuit épuisé→bloqué→Starter souscrit (+3 crédits)→vérifié ; couverture à vie confirmée en DB + navigateur : annonce payée puis expirée→republiée→re-vérifiée par un Wakil SANS re-débit (`verificationCreditSpentAt` préservé, solde wallet inchangé). |
| MI4 | Pack visibilité inclus dans le palier Pro (boost « à la une » offert par cycle, réutilise MI0) — décisions Wassim du 2026-07-20 : **palier Pro existant** (pas de nouveau palier « Agence+ »), **1 boost/mois, NON cumulable** (remis à zéro à chaque règlement, jamais reporté) | P2 | ✅ | `AGENCY_PLANS[].freeBoostPerCycle` (`src/lib/constants.ts`, générique — non nul seulement pour Pro, même patron que `verificationCreditsBonus` de MI3). `Subscription.freeBoostUsedAt` (`DateTime?`, migration `20260720120305_add_subscription_free_boost`) — remis à `null` à CHAQUE règlement réussi (souscription initiale ET renouvellement, démo comme réel) dans `settleSubscriptionPayment`/`subscribeAgencyPlanAction` : un nouveau cycle = un nouveau boost disponible. `hasUnclaimedFreeBoost()` (`src/lib/subscriptions.ts`, pure, réutilisée serveur + UI). Nouvelle action `claimFreeFeaturedBoostAction` (`src/actions/properties.ts`) : IDOR (`requireOwnProperty`), rôle AGENCE, palier+cycle éligibles, consommation atomique (`updateMany` conditionné `freeBoostUsedAt: null`, même patron course que partout ailleurs), prolonge `Property.featuredUntil` de `FEATURED_DURATION_DAYS` — **rail totalement indépendant de Konnect** (disponible que Konnect soit actif ou non, aucun `FeaturedOrder`, aucun argent). UI sur `/dashboard/annonces/[id]/a-la-une` : bandeau vert dédié si boost réclamable, note grise si déjà consommé ce cycle — le rail payant (Konnect réel ou mock démo) reste disponible en dessous dans tous les cas (boost supplémentaire sur une autre annonce). i18n fr/en/ar. Tests : `agency-plans.test.ts`, `subscriptions.test.ts` (`hasUnclaimedFreeBoost`), `subscription-payments.test.ts`/`subscription-payment-access.test.ts` (reset à chaque règlement), `tests/free-boost-claim.test.ts` (IDOR, non-bypass rôle/palier/cycle, course concurrente, cas nominal — 9 tests). `QA_ROADMAP.md` §6.5 ajouté. Vérifié en Playwright (Postgres local) : avant tout abonnement → pas de bandeau ; abonnement Pro inséré → bandeau vert visible ; clic → redirection + `featuredUntil` prolongé (annonce visible « à la une » sur `/dashboard/annonces`) ; revisite → bandeau disparu, note « déjà utilisé » affichée, rail payant toujours accessible. |
| MI5 | Apport d'affaires financement : modèle `FinancingLead` (simulation crédit demandée depuis une fiche immo) + export/dashboard admin pour un partenaire bancaire, commission au succès facturée à la banque | P2 | ⏸️ | **Bloqué tant qu'aucun partenariat bancaire n'est signé** — le code (capture du lead) peut être fait en amont, mais la monétisation réelle dépend d'une convention externe hors scope de ce dépôt. |
| MI6 | QA/sécurité : tests idempotence paiement boost, IDOR abonnement (un hôte ne peut pas payer/voir l'abonnement d'un autre), non-bypass des limites d'annonces actives ; mise à jour `QA_ROADMAP.md` | P0 | 🔧 | Transverse — à livrer avec chaque phase concernée, pas uniquement à la fin (même règle que PSP7). MI0 (`QA_ROADMAP.md` §6.2), MI2 (§6.3), MI3 (§6.4, y compris `tests/verification-credit-webhook.test.ts`) et MI4 (§6.5) livrées. Reste à couvrir au fur et à mesure de MI5 (bloqué côté partenariat, cf. ligne MI5). |

## Exécution (prioritisée)

**Quick win (avant tout le reste, zéro prérequis externe) :**
1. ✅ MI0 — paiement réel sur le boost existant.

**Fondations abonnement pro :**
2. ✅ MI1 — modèle de données + paliers (tarif provisoire).
3. ✅ MI2 — limite + page de souscription.

**Extensions (après fondations) :**
4. ✅ MI3 — vérification Wakil payante.
5. ✅ MI4 — pack visibilité agence (palier Pro, 1 boost offert/mois non cumulable).

**Partenariat externe (hors code pur) :**
6. ⏸️ MI5 — apport d'affaires financement.

**Transverse :**
7. 🔧 MI6 — QA/sécurité, à chaque phase. Portions MI0 (`QA_ROADMAP.md` §6.2), MI2 (`QA_ROADMAP.md` §6.3), MI3 (`QA_ROADMAP.md` §6.4, dont le test webhook dédié `verification-credit-webhook.test.ts`) et MI4 (`QA_ROADMAP.md` §6.5) livrées ; ne reste que MI5, bloqué côté partenariat externe (pas de code à couvrir tant qu'il n'est pas entamé).

---

## Chiffrage — combien ce modèle peut rapporter à Darna

**Méthode et limite assumée.** Ce ne sont **pas** des chiffres mesurés — Darna
n'a aujourd'hui aucun revenu immobilier, donc il n'y a rien à extrapoler
depuis un historique réel. Ce sont des **projections construites à partir
d'une donnée réelle du code** (`FEATURED_PRICE_TND = 29` TND/mois, déjà
en prod côté mock) et d'hypothèses de volume **explicites, modifiables,
et à valider** — notamment via les objectifs business déjà posés par les
investisseurs (`.agents/product-marketing.md` : 100 annonces vérifiées
réelles court terme, 500 annonces vérifiées actives = north-star). Le taux
d'attachement au boost (15 %) est un ordre de grandeur inspiré des portails
classifieds comparables (Mubawab/Tayara) — **pas un chiffre sourcé**, à
confirmer par un vrai test commercial avant de le considérer acquis.

**Tarifs revus à la baisse le 2026-07-16** (décision de Wassim, après
première mise en ligne de MI2) : les 250 TND/mois du palier unique initial
ont été jugés trop chers pour le marché tunisien tant que Darna construit
encore sa confiance/son réseau — mieux vaut un ticket d'entrée accessible
pour les toutes premières agences que d'anchorer haut sans donnée réelle.
Trois paliers de lancement (`AGENCY_PLANS`, `src/lib/constants.ts`) :
**Starter** 50 TND/mois (3 annonces), **Standard** 100 TND/mois
(10 annonces), **Pro** 200 TND/mois (30 annonces) — toujours
**provisoires**, à confirmer avec de vraies agences à Hammamet/Nabeul/
Sousse avant de les considérer acquis.

### Hypothèses de volume (3 horizons)

| Horizon | Annonces immo actives | Agences abonnées | Vérifications pro payantes/mois | Dossiers financement signés/mois |
|---|---|---|---|---|
| **Pilote (M+3)** | 100 *(objectif investisseurs déjà posé)* | 10 | 5 | 1 |
| **Ramp (M+12)** | 200 *(= 40 % des 500 annonces vérifiées actives, north-star)* | 30 | 20 | 4 |
| **Scale (M+24)** | 600 *(hypothèse ×3 sur 12 mois supplémentaires)* | 90 | 60 | 12 |

### Revenu mensuel par flux (TND)

| Flux | Prix unitaire | Pilote (M+3) | Ramp (M+12) | Scale (M+24) |
|---|---|---|---|---|
| Boost « à la une » (MI0), attachement 15 %/mois | 29 TND | 100 × 15 % × 29 = **435** | 200 × 15 % × 29 = **870** | 600 × 15 % × 29 = **2 610** |
| Abonnement agence (MI1/MI2), palier moyen pondéré (Standard) | ~100 TND/mois | 10 × 100 = **1 000** | 30 × 100 = **3 000** | 90 × 100 = **9 000** |
| Vérification Wakil payante pro (MI3) | 40 TND | 5 × 40 = **200** | 20 × 40 = **800** | 60 × 40 = **2 400** |
| Apport d'affaires financement (MI5) | 300 TND/dossier | 1 × 300 = **300** | 4 × 300 = **1 200** | 12 × 300 = **3 600** |
| **Total mensuel** | | **1 935 TND** (~570 EUR) | **5 870 TND** (~1 725 EUR) | **17 610 TND** (~5 180 EUR) |
| **Total annualisé** | | **~23 200 TND/an** | **~70 400 TND/an** | **~211 300 TND/an** |

*(Conversion EUR indicative au taux `EUR_TO_TND = 3.4` déjà utilisé dans le
code, `src/lib/config.ts` — c'est un affichage, jamais le montant réellement
encaissé, qui reste en TND comme le reste de Darna.)*

### Lecture de ces chiffres

- **Le flux le plus rapide à activer (MI0) est aussi le plus petit** (435 à
  2 610 TND/mois) — logique, c'est un achat d'impulsion à ticket unitaire
  faible. Son intérêt est ailleurs : zéro coût de développement additionnel,
  premier euro réel encaissé sur l'immobilier, et il **valide en vrai**
  l'appétit à payer avant d'investir sur l'abonnement pro (MI1/MI2), qui
  porte ~50 % du total à tous les horizons (contre 65-70 % avec l'ancien
  tarif unique à 250 TND — le prix d'entrée plus accessible réduit
  mécaniquement le poids de ce flux, en échange d'une adoption espérée plus
  large côté agences).
- **L'abonnement agence reste le flux dominant et le plus incertain** — les
  trois paliers de lancement (Starter 50 TND/3 annonces, Standard
  100 TND/10 annonces, Pro 200 TND/30 annonces) n'ont toujours **pas** été
  confrontés à une vraie agence tunisienne. C'est le chiffre à valider en
  premier : quelques appels à des agences à Hammamet/Nabeul/Sousse pour
  tester ces trois prix donneraient un signal réel en une semaine, sans code.
- **MI5 (financement) dépend d'un partenariat externe non encore signé** —
  son chiffre (300-3 600 TND/mois) est donc conditionnel, pas un acquis de
  roadmap produit.
- À l'échelle Scale (M+24), ~211 300 TND/an reste **un complément**, pas un
  pivot de modèle : à comparer à la commission `SERVICE_FEE_RATE = 8 %` déjà
  en place sur `stay` (revenu par réservation, pas par annonce) pour juger
  l'ordre de grandeur relatif une fois que le volume de réservations séjour
  sera lui-même mesuré en production.

---

## Prompts Claude Code

> Un seul prompt prêt à l'emploi ci-dessous (MI0, zéro prérequis externe) —
> conservé pour référence. MI1 à MI4 sont faits (cf. tableau ci-dessus), sans
> prompt dédié rédigé à l'avance (implémentés directement en session, comme
> MI1-MI3). Rien à préparer pour MI5 : bloqué tant qu'aucun partenariat
> bancaire n'est signé (hors code).

### Prompt MI0 — Paiement réel sur le boost « à la une »

```
Contexte : MONETISATION_IMMO_ROADMAP.md, ligne MI0. Lis d'abord ce fichier
en entier, puis src/actions/properties.ts (featureListingAction, autour de
la ligne 407) et src/app/dashboard/annonces/[id]/a-la-une/page.tsx —
aujourd'hui le boost "à la une" (Property.featuredUntil, FEATURED_PRICE_TND
= 29 TND/mois) est un paiement 100% mock : featureListingAction applique
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
