# Darna — Croissance (crédits & promos) : Roadmap

> **Référence permanente de ce chantier.** Décidé en session produit du
> 2026-07-21 : faire grandir Darna sur les deux faces du marché (voyageurs ET
> hôtes, l'hôte étant la ressource rare / north-star) via deux leviers
> financiers distincts — un programme de crédits façon « parrainage » (comme
> les sites de réservation) et des promos sur les logements (côté hôte et
> côté Darna). Contrainte de départ posée par Wassim : **pas grave si ces
> leviers ne sont pas rentables au lancement, mais ils doivent le devenir à
> terme** — chaque mécanisme ci-dessous est donc conçu avec un plafond
> d'exposition financière strict dès le premier jour, jamais un coût ouvert.
>
> **Principe non négociable, réutilisé partout dans ce chantier** : aucune
> remise (crédit ou promo) ne peut jamais réduire ce que l'hôte touche
> (`subtotal` = prix hôte × nuits). Le pire cas possible est que Darna
> renonce à 100 % de sa commission (`serviceFee`, 8 % de `subtotal`) sur une
> réservation donnée — jamais un centime de perte réelle. C'est exactement
> le principe déjà appliqué par `RebookingDiscount`
> (`src/lib/rebooking-discount.ts` / `src/actions/bookings.ts` :
> `totalPrice = Math.max(subtotal, fullTotalPrice - discount)`) — ce
> chantier le généralise plutôt que de le réinventer.
>
> **Ce qui existe déjà et qu'il ne faut pas réinventer :** `VerificationWallet`
> (solde crédité paresseusement, `MONETISATION_IMMO_ROADMAP.md` §MI3) est le
> patron du `CreditWallet` ci-dessous. `Property.featuredUntil` (boost « à
> la une ») est le patron du prix promo hôte (§PM0). Le centre de
> notifications paresseux, **sans cron**, dédupliqué par index unique
> partiel (`ensureExpiringSoonNotifications`,
> `src/lib/notification-center.ts`) est le patron du nudge promo (§PM2). Le
> Yield Advisor (`src/lib/yield.ts`, `avgNightCity`) fournit déjà le prix
> moyen par ville réutilisé dans ce même nudge.
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Compagnon de
> `FEATURES_ROADMAP.md`, `QA_ROADMAP.md`, `MONETISATION_IMMO_ROADMAP.md` —
> ne jamais laisser ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (fondation bloquante) `P1` (fort impact) `P2` (utile) `P3` (nice-to-have).

> **Montants et seuils : des hypothèses de lancement, pas des mesures**
> (même honnêteté que `MONETISATION_IMMO_ROADMAP.md` — Darna n'a aujourd'hui
> aucune donnée réelle sur ces mécanismes). À ajuster dès les premiers
> résultats.

---

## Partie 1 — Programme de crédits (parrainage & bienvenue)

Deux circuits d'acquisition (voyageurs = liquidité de la demande, hôtes =
ressource rare / north-star) + un crédit de bienvenue générique.

| # | Tâche | Prio | Statut | Détail |
|---|---|---|---|---|
| CR0 | Fondations : modèle `CreditWallet` (solde TND, créé paresseusement comme `VerificationWallet`) + `CreditTransaction` (ledger : montant, motif, expiration, résa/filleul liés) + `User.referralCode` (unique) / `User.referredById` (auto-relation, posée une seule fois, jamais modifiable) | P0 | ✅ | PR #187. Migration `20260724122228_add_credit_wallet_foundations`. Motifs : `BIENVENUE_PARRAINAGE` \| `BIENVENUE_SPONTANE` \| `PARRAINAGE_FILLEUL_TERMINE` \| `UTILISATION_RESERVATION` \| `UTILISATION_SERVICE_HOTE` \| `EXPIRATION` \| `AJUSTEMENT_ADMIN`. Chaque crédit expire 6 mois après émission (`CREDIT_VALIDITY_DAYS`, levier de rentabilité, cf. CR6). Primitives génériques `creditBalance`/`issueCredit`/`spendCredit`/`ensureReferralCode`/`findUserByReferralCode` (`src/lib/credits.ts`) — aucune règle métier (montants/plafonds/déclencheurs), réutilisées par CR1-CR3. Tests : `tests/credits.test.ts`. |
| CR1 | Parcours voyageur : page « Mes crédits », bouton « Parrainer » (réutilise `ShareButton.tsx`, F8), application du solde au checkout | P0 | ✅ | PR #188. Filleul : **+15 TND** (`REFERRAL_SIGNUP_BONUS_TND`) immédiat à l'inscription via lien/code (`?ref=CODE`, `src/actions/auth.ts`) — jamais bloquant si l'émission échoue. Page `/dashboard/credits` : solde, code/lien de parrainage, bouton « Parrainer » (`ShareButton` étendu avec `message`/`label`/`context`), historique. Checkout (`src/actions/bookings.ts`) : case à cocher opt-in, `computeCreditApplication` (pure, `src/lib/credits.ts`) plafonne à 30 % du total ET au reste-à-couvrir (`totalPrice - subtotal`) — jamais sous `serviceFee` ni le prix hôte, cumulable avec `RebookingDiscount`. Dépense atomiquement couplée à la transaction de réservation (`spendCredit(…, tx)`). Tests : `tests/credits.test.ts`, `tests/auth-referral.test.ts`, `tests/booking-credit-application.test.ts`, `tests/components/share-button.test.tsx`. Vérifié en direct (inscription avec code → +15 TND visible → case à cocher au checkout → total réduit en direct).|
| CR2 | Parrainage hôte, débloqué à la 1ère annonce vérifiée `ACTIVE` + 1ère résa confirmée de l'hôte parrainé | P1 | ❌ | **+40 TND** au parrain (≈ 2× `HOST_VERIFICATION_PRICE_TND`), crédité quand le filleul atteint **`TERMINEE`** — pas `CONFIRMEE` (ferme la boucle réserver-puis-annuler pour toucher le crédit quand même). Dépensable sur vérification Wakil / boost à la une / abonnement — réutilise `VerificationCreditOrder`/`FeaturedOrder`/`Subscription` tels quels, **zéro nouveau rail de paiement**. Plafond : 5 filleuls récompensés par an et par compte. |
| CR3 | Crédit de bienvenue générique (sans parrain) | P2 | ❌ | **+10 TND**, réservé aux comptes téléphone vérifié (anti-fake-account, réutilise le gate KYC existant). Jamais cumulé avec le crédit filleul (CR1) — un compte ne touche que l'un ou l'autre. |
| CR4 | QA/sécurité transverse — **à livrer AVEC chaque phase ci-dessus, pas à la fin** (même règle que MI6/PSP7) | P0 | ✅ | PR #189. IDOR : couvert par construction (`issueCredit`/`spendCredit` ne prennent jamais un `userId` fourni par le client, toujours `user.id` de la session). Idempotence de l'émission filleul : couvert par construction (un seul appel possible, à la création du compte). Non-bypass du plancher `serviceFee` à la dépense : `computeCreditApplication` (testé, §CR1). Rate-limit consommation de code de parrainage : héritée de `assertRateLimit("inscription")` existante ; génération (`ensureReferralCode`) lazy/idempotente, aucune surface d'abus. **Expiration effective** : `CreditTransaction.remainingAmount` (par émission, décrémenté FIFO à chaque dépense) + `sweepExpiredCredits` (purge paresseuse avant toute lecture/dépense, même principe que `clearExpiredFeatured` — aucun cron) — une émission expirée non consommée devient inutilisable, journalisée `EXPIRATION`. Migration `20260724135044_add_credit_remaining_amount`. **Restitution au remboursement** : `refundCreditForBooking` (motif `REMBOURSEMENT_RESERVATION_ANNULEE`, idempotent) hooké en best-effort dans `cancelBookingAction`/`hostCancelBookingAction` — ne bloque jamais une annulation déjà actée. Modèle de ledger (FIFO + purge paresseuse plutôt que reconstruction complète à la volée) validé par Wassim avant implémentation (choix architectural non tranché par la roadmap). Tests : `tests/credits.test.ts`, `tests/booking-credit-refund.test.ts`. |
| CR5 | Dashboard admin : exposition totale en cours (passif financier), alerte si le volume mensuel émis dépasse un seuil configurable | P1 | ❌ | Pour piloter consciemment le « pas grave si pas rentable » plutôt qu'un burn non surveillé. |
| CR6 | Leviers de rentabilité long terme | P2 | ❌ | Breakage (l'expiration à 6 mois récupère le crédit jamais consommé) ; auto-financement (indexer le budget crédits sur un % de la commission encaissée plutôt qu'un coût fixe) ; dégressivité pilotée par un seul paramètre config (comme `FREE_VERIFICATION_CREDITS`, déjà révisé 3→1) ; tapering du volet hôte (CR2) une fois proche du north-star (500 annonces vérifiées actives). |

## Partie 2 — Promos sur les logements

Deux mécanismes, risque financier très différent : côté hôte (zéro risque
par construction), côté Darna (plafonné mathématiquement à **~7,4 %** de
réduction affichée, jamais plus, sauf mode hybride).

| # | Tâche | Prio | Statut | Détail |
|---|---|---|---|---|
| PM0 | Fondations promo hôte : `Property.promoPrice` (TND, doit être < `price`, validé serveur) + `Property.promoUntil` (mêmes principes que `featuredUntil` — lazy, jamais de cron) | P0 | ✅ | PR #169. Migration `20260721152611_add_property_promo`. `setPropertyPromoAction`/`clearPropertyPromoAction` (`src/actions/properties.ts`) : réservé aux annonces vérifiées `ACTIVE`, `promoPrice` toujours < `price` (revalidé serveur), `promoUntil` borné à 365 jours. `effectiveNightlyPrice`/`isPropertyPromoActive` (`src/lib/listings.ts`) : à la réservation, `subtotal` se calcule sur `promoPrice` si `promoUntil > now` ET l'annonce toujours vérifiée (re-vérifié à CHAQUE réservation, pas seulement à la pose de la promo) — branché dans `createBookingAction`/`quoteBookingAction`. Fondation uniquement : l'UI dashboard + badge arrivent avec PM1. Tests : `tests/property-promo.test.ts`, `tests/booking-promo-price.test.ts`. |
| PM1 | UI hôte : définir/retirer une promo sur une annonce (dashboard) + badge « Promo -X % » sur `PropertyCard.tsx`/`ListingDetail.tsx` | P0 | ✅ | PR #172. Page dédiée `/dashboard/annonces/[id]/promo` (mêmes conventions que `a-la-une`) + `PropertyPromoForm.tsx` (client, `useActionState` sur `setPropertyPromoAction`) + bouton retrait (`clearPropertyPromoAction`). `PromoBadge` (`Badges.tsx`) et `PromoPrice` (nouveau, prix barré + prix promo — jamais de prix fabriqué) branchés sur `PropertyCard.tsx`, `ListingDetail.tsx` (les 2 emplacements prix) et le tableau de bord `dashboard/annonces`. Réservé aux annonces vérifiées `ACTIVE` **et `vertical === "STAY"`** (une vente/location n'a pas de « prix par nuit » — bug remonté par Wassim après le 1er merge, corrigé dans la même PR : `canManagePromo = canSetPromo \|\| promoActive` pour garder une promo héritée retirable). Le devis live et la page de paiement affichent le vrai `nightlyPrice` en chiffres au lieu du libellé générique « Prix par nuit ». Testé en direct (Playwright + Postgres réel) : pose → badge/prix barré visibles sur dashboard/fiche/recherche → retrait → état propre ; annonce Vente avec promo héritée → retrait seul disponible. |
| PM2 | Nudge automatique : `ensurePromoSuggestionNotifications` (même idiome que `ensureExpiringSoonNotifications`, **aucun cron**) | P1 | ❌ | Déclencheur : annonce `ACTIVE` vérifiée depuis > 14 jours ET zéro résa `CONFIRMEE` dans les 21 prochains jours. Message : nuits vides + comparaison au prix moyen ville (réutilise `computeYield`/`avgNightCity`). Gain affiché = « ce que rapporte une nuit vendue en plus », **jamais un total prédit** (aucune donnée de conversion mesurée à ce jour). Dédup par `href` bucketé par mois (`?promo=2026-07`) → au plus un rappel par annonce par mois, même index unique partiel que l'existant. |
| PM3 | Promo Darna (campagne plateforme, prix hôte intouché) | P1 | ❌ | Mécanisme **distinct** de PM0 : le prix hôte (`subtotal`) reste inchangé, la remise s'impute uniquement sur `serviceFee` — même principe que `RebookingDiscount`, généralisé à un objet `PromoCampaign` (filtre ville/gouvernorat/vertical, taux plafonné en config à ≤ 7,4 %, dates de validité, activée par un admin). Budget/portée toujours décidés consciemment par Wassim — jamais de déclenchement automatique d'une dépense réelle. |
| PM4 | Dashboard admin d'aide à la décision pour PM3 | P2 | ❌ | Par ville : % d'annonces vérifiées actives sans résa confirmée sur 30 jours — objective le « quand » d'une campagne plutôt que deviner. Même esprit que le Yield Advisor, vue agrégée par zone. |
| PM5 | QA/sécurité transverse — **à livrer AVEC chaque phase** (même règle que CR4) | P0 | ✅ | Confirmé 2026-07-24 (passe de vérification, aucun nouveau code) : les 3 items applicables à PM0/PM1 sont déjà couverts par `tests/property-promo.test.ts` — `promoPrice` toujours < `price` non-bypass serveur, promo refusée sur annonce non vérifiée/non ACTIVE, IDOR sur la définition ET le retrait (`requireOwnProperty`). Les 2 items restants (« campagne Darna (PM3) jamais sous le plancher `subtotal` », « non-bypass du plafond de taux ~7,4 % ») portent sur PM3, pas encore construit — à livrer avec PM3 lui-même (même règle transverse), pas un trou de PM0/PM1. |

## Exécution (prioritisée)

**Quick win (zéro risque, aucune dépendance) :**
1. ✅ PM0 — fondations promo hôte.
2. ✅ PM1 — UI hôte + badge.

**Fondations crédits :**
3. ✅ CR0 — modèle de données.
4. ✅ CR1 — parcours voyageur (parrainage).

**QA transverse dès le début (pas en fin de chantier) :**
5. ✅ CR4 (crédits, PR #189) / ✅ PM5 (promos, confirmé 2026-07-24 — items PM3 reportés à PM3 lui-même).

**Extensions :**
6. ❌ PM2 — nudge automatique (dépend de PM0/PM1 livrés).
7. ❌ CR2 — parrainage hôte (dépend de CR0).
8. ❌ CR3 — crédit de bienvenue spontané.

**Campagnes & pilotage (après validation des fondations) :**
9. ❌ PM3 — promo Darna.
10. ❌ CR5 / PM4 — dashboards d'exposition/décision.

**Continu :**
11. ❌ CR6 — leviers de rentabilité long terme, à revisiter une fois des données réelles disponibles.

---

_Voir aussi `MONETISATION_IMMO_ROADMAP.md` (patron `VerificationWallet`/
`FeaturedOrder` réutilisé ici), `FEATURES_ROADMAP.md` (F8 `ShareButton`, F9
centre de notifications), `QA_ROADMAP.md` (section dédiée à ajouter dès
CR4/PM5 livrés)._
