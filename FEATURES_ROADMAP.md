# Darna — Features Roadmap

> **Référence permanente.** Ce document liste les fonctionnalités manquantes ou
> incomplètes de Darna comparées à une plateforme de réservation en ligne
> mature (Airbnb/Booking-like), établies lors de la revue produit du
> 2026-07-01. Compagnon de `DESIGN_ROADMAP.md` (UI/UX) et `QA_ROADMAP.md`
> (qualité/sécurité).
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Ne jamais laisser
> ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (gap de confiance/rétention majeur) `P1` (fort impact) `P2` (utile) `P3` (nice-to-have).

---

## 1. Confiance & réputation

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F1 | Avis bidirectionnels (hôte → voyageur, pas seulement voyageur → annonce) | P1 | ✅ | Nouveau modèle `GuestReview` (`prisma/schema.prisma`, migration `20260702120000_add_guest_review`) : avis hôte→voyageur, un par réservation. `submitGuestReviewAction` (`src/actions/bookings.ts`), `GuestReviewForm`/`GuestReviewDisplay` (`src/components/booking/`) branchés dans `src/app/dashboard/reservations/page.tsx` (formulaire côté hôte pour un séjour terminé, affichage lecture seule côté voyageur). Page profil voyageur `/voyageur/[id]` ajoutée ensuite (`getTravelerProfile` dans `src/lib/traveler-profile.ts`) : note agrégée + avis `GuestReview` reçus, gatée serveur (accessible seulement à un hôte ayant reçu ce voyageur — jamais indexée, `noindex` + exclue du sitemap, contrairement à `/hote/[id]`). Nom du voyageur cliquable depuis `RevealedContactCard.tsx` côté hôte. |
| F2 | Sous-notes d'avis (propreté, communication, conformité à l'annonce, rapport qualité/prix) en plus de la note globale | P2 | ✅ | 4 nouveaux champs sur `Review` (migration `20260702200000_add_review_subratings`, backfill depuis `rating` pour l'historique). `rating` reste calculé serveur (moyenne arrondie), jamais saisi à part (`submitReviewAction`). `ReviewForm.tsx` (4 pickers), `ReviewsList.tsx` (répartition agrégée + détail par avis). Scope volontairement limité à `Review` (voyageur→annonce) — `GuestReview` (F1) inchangé. |
| F3 | Fiche hôte publique (annonces du même hôte, ancienneté, note moyenne, taux de réponse) | P1 | ✅ | PR #73. Page `/hote/[id]` (`getHostProfile` dans `src/lib/listings.ts`) : annonces actives, ancienneté, note moyenne agrégée, badge KYC. Lien depuis `ListingDetail.tsx` (masqué si `anonymizeOwner`). **Taux de réponse non inclus** (hors scope de cette PR — reste à faire si jugé utile). |

## 2. Recherche & découverte

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F4 | Filtre par équipements (wifi, piscine, climatisation…) sur la recherche séjours | P1 | ✅ | PR #72. `parseAmenitiesParam` (`src/lib/constants.ts`), filtre dans `searchSejours` (`src/lib/listings.ts`), `AmenitiesFilter` (`src/components/search/AmenitiesFilter.tsx`) branché sur `/sejours`. |
| F5 | Filtre chambres / capacité voyageurs / type de bien sur la recherche séjours | P2 | ✅ | Capacité voyageurs était déjà filtrable. Ajout : filtre « chambres min » (`Property.rooms`) et **nouveau champ** `StayDetails.kind` (migration `20260702150000_add_stay_kind`, valeurs `STAY_KINDS` dans `src/lib/constants.ts`) — sélection à la création (`PropertyForm.tsx`), affiché en caractéristique (`StayDetail.tsx`) et filtrable dans `searchSejours` (`src/lib/listings.ts`) via les selects `/sejours`. |
| F6 | Section "annonces similaires" en fin de fiche annonce | P1 | ✅ | `getSimilarListings` (`src/lib/listings.ts`, même ville + même type) branché en pleine largeur en fin de `ListingDetail.tsx` (masqué si rien de comparable). |
| F7 | Alertes de recherche sauvegardée (email quand une annonce matche ville/dates/budget) | P2 | ✅ | Nouveau modèle `SavedSearch` (migration `20260702190000_add_saved_search`, ville + budget). `src/lib/saved-search.ts` : déclenché à **l'événement** (`verifyPropertyAction`, quand l'annonce devient active), jamais par cron. `SaveSearchButton` sur `/sejours`, page `/dashboard/alertes` (liste + suppression). Alerte in-app (réutilise F9) + e-mail. **Sans dates** (volontaire — une annonce tout juste publiée n'a quasiment jamais de réservation, le filtre dates n'apporterait rien à ce stade). |

## 3. Partage & rétention

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F8 | Bouton "Partager" (lien copié + WhatsApp) sur la fiche annonce | P1 | ✅ | PR #74. `ShareButton` (`src/components/property/ShareButton.tsx`) : `navigator.share` natif sinon menu Copier le lien / WhatsApp, branché sur `ListingDetail.tsx`. |
| F9 | Centre de notifications in-app générique (au-delà des messages) | P2 | ✅ | Nouveau modèle `Notification` (migration `20260702170000_add_notification`, `src/lib/notification-center.ts`) : réservation confirmée/annulée, avis reçu (les deux sens), annonce bientôt expirée (détection paresseuse dédupliquée par index unique partiel, pas de cron). `NotificationBell` (`src/components/notifications/`) dans le Header, distinct de `MessagesNotifier`. |

## 4. Parcours réservation

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F10 | Vérifier/exposer clairement un flux d'annulation self-service côté voyageur dans le dashboard | P1 | ✅ | **Déjà livré avant cette roadmap** (PR #56) : `CancelBookingButton` (`src/components/booking/CancelBookingButton.tsx`) est bien branché dans `src/app/dashboard/reservations/page.tsx` pour toute réservation `CONFIRMEE` (confirmation + calcul du remboursement via `computeBookingRefund`). Entrée corrigée après vérification — aucun code écrit ici. |

---

## Exécution (prioritisée)

**Maintenant (P0/P1) :**
1. ✅ F4 — filtre équipements (PR #72).
2. ✅ F3 — fiche hôte publique (PR #73).
3. ✅ F8 — bouton Partager (PR #74).
4. ✅ F6 — annonces similaires.
5. ✅ F10 — annulation self-service (déjà livré, PR #56 — vérifié).
6. ✅ F1 — avis bidirectionnels.

**Ensuite (P2) :**
7. ✅ F5 — filtres chambres/capacité/type.
8. ✅ F9 — centre de notifications in-app.
9. ✅ F7 — alertes de recherche sauvegardée.
10. ✅ F2 — sous-notes d'avis.

**Toutes les tâches de `FEATURES_ROADMAP.md` sont désormais livrées.** Voir `DESIGN_ROADMAP.md` et `QA_ROADMAP.md` pour les prochaines priorités produit.

---

_Voir aussi `DESIGN_ROADMAP.md` (UI/UX/animations), `QA_ROADMAP.md`
(qualité/sécurité) et `PAIEMENT_SUR_PLACE_ROADMAP.md` (chantier dédié :
paiement 100 % sur place + commission facturée à l'hôte pour le marché
local tunisien)._
