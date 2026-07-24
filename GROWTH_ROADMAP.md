# Darna — Growth produit : Roadmap

> **Référence permanente de ce chantier.** Décidé en session produit du
> 2026-07-21, à la demande de Wassim : « des idées fonctionnelles dans Darna
> — pas du marketing extérieur — pour promouvoir la plateforme, pousser les
> hôtes à publier, et surtout les voyageurs à réserver sur Darna », sur un
> horizon de 6 mois. **10 leviers uniquement fonctionnels** (aucune campagne
> publicitaire, aucun contenu éditorial) — compagnon de `FEATURES_ROADMAP.md`
> (fonctionnel général), `DESIGN_ROADMAP.md`, `QA_ROADMAP.md` et
> `INSTRUMENTATION_ROADMAP.md` (mesure — voir dépendance ci-dessous).
>
> **Cadrage : le goulot d'étranglement documenté est l'OFFRE, pas la
> demande** (`.agents/product-marketing.md` : *« le goulot d'étranglement est
> l'OFFRE, pas la demande »* pour Hammamet–Nabeul–Sousse). La liste ci-dessous
> est pondérée en conséquence (4 leviers offre / hôtes en premier) tout en
> couvrant les 4 leviers demande / voyageurs explicitement demandés par
> Wassim (« **surtout** les voyageurs »).
>
> **Recoupement avec `AUDIT_V1.md`** (audit investisseur du 2026-06-24, sur un
> commit **antérieur** à la plupart des chantiers déjà livrés depuis — la
> majorité de son « MUST HAVE » P0/P1 est désormais `✅` : reset mot de passe,
> payout Konnect réel, signature HMAC webhook, messagerie, annulation/
> remboursement, filtres avancés F4/F5, alertes de recherche F7). Deux entrées
> de son « TOP 20 » restent pertinentes et **non couvertes ailleurs** :
> item **#18 « Programme de parrainage diaspora »** (→ G9 ci-dessous) et item
> **#7 « Relance de panier abandonné »** (→ G6 ci-dessous, absent de mon
> brainstorm initial, ajouté après relecture de l'audit).
>
> **Dépendance : `INSTRUMENTATION_ROADMAP.md` (IN0-IN4, non démarré).** Aucun
> des KPI listés ci-dessous n'est mesurable sans elle — `AUDIT_V1.md`
> confirme : *« Funnel analytics produit (events, cohortes) | 🔴 Absent —
> aucune instrumentation produit »*. **IN0 (fondations `ProductEvent`, ~1j)
> devrait démarrer avant ou en parallèle du premier lot de ce chantier.**
> Chaque tâche ci-dessous précise l'événement `ProductEvent` qui la mesure —
> à ajouter **dans la même PR** que la tâche (même discipline que IN4/
> `AuditAction`), pas après coup.
>
> **Ce qui existe déjà et qu'il ne faut pas réinventer :**
> - `VerifiedBadge` (`src/components/property/Badges.tsx`) affiche déjà
>   « Vérifié par {Wakil} · {date} » — mais **seulement en mode non-`small`**
>   (fiche détail `ListingDetail.tsx`). `PropertyCard.tsx` (résultats de
>   recherche) appelle le badge en mode `small` sans date → c'est le vrai trou
>   que couvre G8, pas une réécriture du badge.
> - `HomeHero` (`src/app/page.tsx:27-49`) affiche déjà `verifiedCount`
>   (annonces vérifiées actives, calcul north-star) en page d'accueil. G10
>   n'invente pas ce chiffre, il le met en contexte (objectif 500) et ajoute
>   le fil des dernières vérifications, qui n'existe pas.
> - `src/lib/rebooking-discount.ts` (`signRebookingDiscount`) : patron de
>   token signé HMAC, usage unique, anti-tampering, déjà testé (`QA_ROADMAP.md`
>   D12) — à **généraliser**, pas dupliquer, pour G7 et G9.
> - `claimFreeFeaturedBoostAction` (`src/actions/properties.ts`, MI4) : rail
>   de boost gratuit déjà construit pour le palier Pro — G4 réutilise
>   exactement ce mécanisme avec un critère de mérite plutôt que d'abonnement.
> - `computeMarketIndex()` (`src/lib/market.ts`, sert `/prix-du-marche`) :
>   agrégats de prix réels par ville déjà calculés — G1 les réutilise, n'en
>   recalcule pas.
> - `ContactReveal`/`RevealedContactCard` (`src/components/booking/`) :
>   mécanisme de masquage/révélation du contact déjà en place — G6 (ancienne
>   version « rappel garantie ») a été retiré du périmètre au profit de la
>   relance panier abandonné (impact plus direct, validé par l'audit), mais
>   ce composant reste le point d'ancrage naturel si ce levier est repris plus
>   tard.
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅`, noter le(s) fichier(s)/PR. Ne jamais laisser
> ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (goulot d'étranglement documenté) `P1` (fort impact) `P2` (utile).

---

## 1. Faire grossir l'offre (hôtes) — le goulot d'étranglement documenté

| # | Tâche | Prio | Statut | KPI phare | Détail |
|---|-------|------|--------|-----------|--------|
| G1 | Simulateur « Combien pourriez-vous gagner sur Darna ? » — formulaire public (ville + type + capacité) → fourchette de revenus, basée sur les prix réels déjà en base | P1 | ✅ PR #191 | Simulation → inscription hôte (`SIMULATOR_USED` câblé ; `signupSource` non fait — 1ère touche d'acquisition différée à `CROISSANCE_ROADMAP.md` §CR0, cf. `PRIORITES_ROADMAP.md`, aucun modèle d'attribution consommateur pour l'instant) | `/combien-gagner` (`src/app/combien-gagner`, `RevenueSimulatorForm`). `estimateRevenue()` (`src/lib/market.ts`) réutilise **uniquement** l'agrégat déjà mémoïsé de `computeMarketIndex()` (5 min) — aucune nouvelle requête. SEJOUR : nuitée moyenne ville × 30 × occupation 35-60 % (`SIMULATOR_OCCUPANCY_LOW`/`SUMMER_OCCUPANCY_RATE`). LOCATION/VENTE : TND/m² moyen du gouvernorat × surface saisie, bande ±15 % (`SIMULATOR_ESTIMATE_BAND`). `capacity` jamais utilisé dans le calcul (pas de ventilation par capacité dans l'indice) — sert seulement à préremplir le CTA, jamais de chiffre gonflé. Ville sans données réelles → suggestion de villes proches (`nearbyCities()`), jamais un chiffre inventé. CTA « Publier mon annonce » pré-rempli ville/type : `/inscription?role=HOTE&callbackUrl=...` si anonyme, directement `/dashboard/annonces/nouvelle?ville=&type=` si déjà hôte connecté (`PropertyForm` accepte `defaultCity`/`defaultType`). i18n fr/en/ar. Tests : `tests/market-simulator.test.ts`. Vérifié en Playwright (Postgres local, compte `hote@darna.tn`) : fourchette correcte pour Hammamet/Tunis, fallback villes proches pour Kasserine, CTA anonyme → inscription et CTA hôte connecté → formulaire pré-rempli. |
| G2 | Barre de complétude d'annonce + relances actives (in-app + email) sur les brouillons/annonces incomplètes | P1 | ✅ | Taux brouillon → `ACTIVE` vérifiée ; délai médian création→vérification | `src/lib/listing-completeness.ts` (`computeListingCompleteness`) : score dérivé — jamais stocké — sur 3 critères (**pas 4** : « calendrier » retiré du périmètre initial, aucun signal complet/incomplet clair sur les dates bloquées) : ≥5 photos (`COMPLETENESS_MIN_PHOTOS`, reprend `AUDIT_V1.md` Top 20 #12), description ≥150 caractères, ≥3 équipements — seuils provisoires documentés comme tels. Indicateur affiché sur `/dashboard/annonces` (barre + liste des critères manquants), masqué dès que l'annonce est complète. Relance : nouveau type `ANNONCE_INCOMPLETE` (`notification-center.ts`, `ensureIncompleteListingNotifications`), même idiome exact que `ensureExpiringSoonNotifications` (F9) — détection paresseuse au sondage `/api/notifications`, dédup par index unique partiel (migration `20260722000000_add_incomplete_listing_notification`), délai de grâce `LISTING_INCOMPLETE_NUDGE_DAYS` (3j) avant la première relance, ne cible que les annonces encore « en jeu » (`EN_ATTENTE_VALIDATION`/`ACTIVE`). **Email non ajouté** (in-app uniquement pour cette itération — pas de `sendXxxEmail` dédié comme pour `HOST_INVOICE_RELANCE`, à réévaluer si le canal in-app seul s'avère insuffisant). i18n fr/en/ar. Tests : `tests/listing-completeness.test.ts`, `tests/incomplete-listing-notification.test.ts` (11 tests). Vérifié en Playwright (Postgres local, compte `agence@darna.tn`) : indicateur visible avec le bon score et les bons critères manquants sur plusieurs annonces réelles (1/3, 2/3), masqué sur les annonces déjà complètes. |
| G3 | « Suggérer un logement » — un voyageur signale un bien pas encore sur Darna, récompensé si l'annonce est publiée et vérifiée sous 60 jours | P2 | ❌ | Leads/mois ; taux lead → annonce vérifiée ; CAC hôte comparé | Nouveau modèle léger `HostLead` (ville, contact, `referredByUserId`, statut) + rate limiting (pattern `ContactRequest`). Récompense : token de réduction généralisé depuis `rebooking-discount.ts`. Retourne la demande contre le goulot d'étranglement de l'offre. |
| G4 | Défi saisonnier « Hôte Zéro Faille » — badge Super-Hôte trimestriel + boost offert | P2 | ✅ | Hôtes badgés/trimestre ; rétention badgés vs non-badgés ; CTR annonces badgées | `src/lib/super-host.ts` (`isSuperHost`, `superHostBoostClaimEligible`) : critère 100 % dérivé — jamais stocké — de la note **blended** (`blendedRatingStats`, §AHC7, avis + pénalité d'annulation hôte) sur la fenêtre glissante `HOST_CANCELLATION_SIGNAL_DAYS` (90j, réutilisée telle quelle plutôt qu'un second concept de fenêtre) + `User.suspended`. Une annulation hôte fait déjà chuter la moyenne blended à elle seule → pas de critère d'annulation séparé. Échantillon minimum 3 avis (`SUPER_HOST_MIN_REVIEWS`, provisoire) pour éviter qu'un avis unique suffise. Récompense : nouvelle action `claimSuperHostBoostAction` (`src/actions/properties.ts`), miroir de `claimFreeFeaturedBoostAction` (MI4) mais **ouverte à HOTE et AGENCE** (pas réservée à l'abonnement Pro) — une réclamation par fenêtre glissante (`User.superHostBoostClaimedAt`, migration `20260721154056_add_super_host_boost_claim`), pas de concept de "cycle". Badge affiché sur `/hote/[id]` (`SuperHostBadge`, `Badges.tsx`) ; bandeau de réclamation sur `/dashboard/annonces/[id]/a-la-une`, cumulable avec le boost MI4 (raisons indépendantes). i18n fr/en/ar. Tests : `tests/super-host.test.ts`, `tests/super-host-boost-claim.test.ts` (20 tests — IDOR, non-bypass mérite/fenêtre/suspension, course concurrente, ouverture HOTE+AGENCE, cas nominal). Vérifié en Playwright (Postgres local, compte `hote@darna.tn`, hôte réellement qualifié par les données seedées) : badge visible sur la fiche hôte → réclamation du boost → `featuredUntil` prolongé de 30j → bandeau bascule en « déjà réclamé » → rail payant toujours disponible en dessous. |

## 2. Faire réserver les voyageurs SUR Darna

| # | Tâche | Prio | Statut | KPI phare | Détail |
|---|-------|------|--------|-----------|--------|
| G5 | Signaux de dynamique en temps réel sur la fiche annonce (consultations, dernière réservation) | P2 | ✅ PR #194 | A/B CTR « Réserver » avec/sans signal (mesure manuelle — pas d'infra A/B dans le projet, le split existe naturellement selon les annonces qui atteignent le seuil) | `Property.viewCount` dénormalisé (migration `20260724145942_add_property_view_count`), incrémenté par `recordListingViewAction` (`src/actions/listing-activity.ts`) UNE SEULE FOIS par visiteur grâce à la contrainte unique `PropertyView(propertyId, anonId)` — anti-inflation, y compris contre un visiteur qui rafraîchit ou un script. `computeListingActivitySignal` (`src/lib/listing-activity.ts`) masque le compteur sous `LISTING_ACTIVITY_MIN_VIEWS` (3, provisoire) et la dernière réservation au-delà de `LISTING_ACTIVITY_RECENT_BOOKING_DAYS` (30j) — jamais de chiffre gonflé. « Dernière réservation » réservé à SEJOUR (LOCATION/VENTE = mise en relation, pas de réservation). Affiché sous le prix, avant le CTA, sur `ListingDetail.tsx` (noyau partagé séjour/immo). i18n fr/en/ar. Tests : `tests/listing-activity.test.ts`, `tests/listing-activity-action.test.ts`. Vérifié en Playwright (Postgres local) : 3 visiteurs distincts → compteur affiché, un même visiteur qui recharge → pas de double comptage, réservation du jour → « Réservée aujourd'hui ». |
| G6 | **Relance de réservation abandonnée** — un hold `EN_ATTENTE` qui expire sans paiement déclenche une relance (in-app + email) | **P1** | ❌ | Taux de reprise après relance ; réservations récupérées/mois | `AUDIT_V1.md` Top 20 #7. Absent de mon brainstorm initial — ajouté après relecture de l'audit, c'est un des leviers de conversion les plus standards et les mieux documentés du secteur (« relance de panier abandonné »). **Tension architecturale à trancher avec Wassim** : le hold expire par détection paresseuse (jamais de cron, cf. `Booking.status = "EN_ATTENTE"` + `expiresAt`, 15 min) — une relance efficace doit partir peu après l'abandon, pas seulement à la prochaine interaction fortuite. Question ouverte : accepter une exception ponctuelle au principe "zéro cron" pour ce cas précis (même arbitrage que la question `darna-vid` posée dans `INSTRUMENTATION_ROADMAP.md`), ou détection paresseuse au prochain login. Mesuré par `BOOKING_STARTED` sans `BOOKING_CREATED` correspondant (déjà prévu par `INSTRUMENTATION_ROADMAP.md` IN1). |
| G7 | Programme de fidélité voyageur — crédit cumulatif dès la 3ᵉ réservation confirmée | P2 | ❌ | Taux de réservation N+1 ; LTV moyenne voyageur | Généralise `signRebookingDiscount` (token signé, usage unique, anti-tampering déjà testé) au-delà du cas « réservation annulée par l'hôte ». Le vrai risque de désintermédiation se joue à la 2ᵉ réservation (contact déjà échangé), pas la première. |
| G8 | Fraîcheur de vérification visible dans les **résultats de recherche** (pas seulement la fiche détail) | P2 | ✅ | CTR selon fraîcheur de vérification (< 30 j vs plus ancien) | PR #165 — `verifiedAt`/`verifierName` câblés sur `PropertyCard.tsx` via `VerifiedBadge`, révélés en tooltip (nouveau slot `meta` sur `BadgeTooltip`) uniquement en mode `small`, pour ne pas dupliquer l'affichage inline déjà présent en fiche détail. `listingCardInclude` étendu avec la relation `verifiedBy`. Mesure du KPI CTR reportée à une itération future (hors périmètre wiring). |

## 3. Boucles transverses (promotion de la plateforme elle-même)

| # | Tâche | Prio | Statut | KPI phare | Détail |
|---|-------|------|--------|-----------|--------|
| G9 | ~~Parrainage bidirectionnel (voyageur→voyageur, hôte→hôte)~~ | **P1** | ✅ | — | **Doublon détecté par `PRIORITES_ROADMAP.md`** : écrit en parallèle de `CROISSANCE_ROADMAP.md` (CR0-CR2), même fonctionnalité. CR0-CR2 est la version aboutie (wallet dédié + ledger + montants tranchés + plafonds) — G9 est retiré de la queue de ce fichier. **Voir CR0-CR2 (`CROISSANCE_ROADMAP.md`)** pour la spec et le suivi. `AUDIT_V1.md` Top 20 #18 reste couvert, via cet autre chantier. |
| G10 | Mur de la confiance en direct — objectif 500 annonces vérifiées rendu public | P2 | ✅ | Clics compteur → recherche/inscription hôte | PR #167. Nouvelle section pleine largeur sous le `HomeHero` (`src/app/page.tsx`) : barre de progression vers l'objectif north-star (`VERIFIED_LISTINGS_TARGET = 500`, `src/lib/constants.ts`) + fil des 5 dernières vérifications (`getRecentVerifications`, `src/lib/listings.ts` — sélectionne uniquement `id`/`city`/`verifiedAt`, zéro donnée personnelle). Masquée tant qu'aucune annonce n'est encore vérifiée. `fr`/`en`/`ar` (`src/lib/i18n/`). Tests : `tests/recent-verifications.test.ts`. |

---

## Exécution (prioritisée) — séquencement sur 6 mois

**Mois 1 (quasi gratuit, la donnée existe déjà) :** ✅ G8 (PR #165), ✅ G10 (PR #167), ✅ G4.
**Mois 2 (attaque le goulot d'étranglement offre) :** ✅ G2, ✅ G1 (PR #191).
**Mois 3 :** G3 (a besoin d'un flux voyageur déjà établi pour générer des leads).
**Mois 4 :** ~~G9~~ — voir CR0-CR2 (`CROISSANCE_ROADMAP.md`).
**Mois 5 :** G6 (bloqué, arbitrage Wassim), ✅ G5 (PR #194).
**Mois 6 :** G7.

Voir aussi `PRIORITES_ROADMAP.md` (dispatch multi-session) pour l'ordre de
lancement réel entre plusieurs sessions en parallèle — ce séquencement par
mois reste la référence produit, `PRIORITES_ROADMAP.md` l'opérationnalise.

Ordre indicatif, ajustable selon capacité dev. Chaque tâche reste indépendante
et livrable séparément (une PR par tâche, même discipline que
`FEATURES_ROADMAP.md`/`MONETISATION_IMMO_ROADMAP.md`).

---

_Voir aussi `INSTRUMENTATION_ROADMAP.md` (prérequis mesure), `FEATURES_ROADMAP.md`,
`DESIGN_ROADMAP.md`, `QA_ROADMAP.md`, `AUDIT_V1.md` (audit source des items
recoupés #7/#18)._
