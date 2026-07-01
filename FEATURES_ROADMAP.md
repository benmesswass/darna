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
| F1 | Avis bidirectionnels (hôte → voyageur, pas seulement voyageur → annonce) | P1 | ❌ | Modèle `Review` (`prisma/schema.prisma:334`) est à sens unique (`bookingId @unique`). Ajouter une deuxième relation ou un modèle `GuestReview` distinct. |
| F2 | Sous-notes d'avis (propreté, communication, conformité à l'annonce, rapport qualité/prix) en plus de la note globale | P2 | ❌ | `Review.rating` est un entier unique. `ReviewForm`/`ReviewsList` (`src/components/property/`) à étendre. |
| F3 | Fiche hôte publique (annonces du même hôte, ancienneté, note moyenne, taux de réponse) | P1 | ✅ | PR #73. Page `/hote/[id]` (`getHostProfile` dans `src/lib/listings.ts`) : annonces actives, ancienneté, note moyenne agrégée, badge KYC. Lien depuis `ListingDetail.tsx` (masqué si `anonymizeOwner`). **Taux de réponse non inclus** (hors scope de cette PR — reste à faire si jugé utile). |

## 2. Recherche & découverte

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F4 | Filtre par équipements (wifi, piscine, climatisation…) sur la recherche séjours | P1 | ✅ | PR #72. `parseAmenitiesParam` (`src/lib/constants.ts`), filtre dans `searchSejours` (`src/lib/listings.ts`), `AmenitiesFilter` (`src/components/search/AmenitiesFilter.tsx`) branché sur `/sejours`. |
| F5 | Filtre chambres / capacité voyageurs / type de bien sur la recherche séjours | P2 | ❌ | `maxGuests`/`rooms` existent en base, absents des query params de recherche. |
| F6 | Section "annonces similaires" en fin de fiche annonce | P1 | ❌ | Aucune requête de biens comparables (même ville/type) dans `ListingDetail.tsx`. |
| F7 | Alertes de recherche sauvegardée (email quand une annonce matche ville/dates/budget) | P2 | ❌ | Fonctionnalité à créer de zéro (modèle + cron/job + email). |

## 3. Partage & rétention

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F8 | Bouton "Partager" (lien copié + WhatsApp) sur la fiche annonce | P1 | ✅ | PR #74. `ShareButton` (`src/components/property/ShareButton.tsx`) : `navigator.share` natif sinon menu Copier le lien / WhatsApp, branché sur `ListingDetail.tsx`. |
| F9 | Centre de notifications in-app générique (au-delà des messages) | P2 | ❌ | `MessagesNotifier` (`src/components/messages/MessagesNotifier.tsx`) ne couvre que la messagerie ; rien pour statut réservation changé, avis reçu, annonce bientôt expirée. |

## 4. Parcours réservation

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| F10 | Vérifier/exposer clairement un flux d'annulation self-service côté voyageur dans le dashboard | P1 | ❌ | `cancellation.test.ts` existe côté tests mais aucun bouton "Annuler ma réservation" identifié dans `src/app/dashboard/reservations/`. À confirmer puis exposer en UI si le flux serveur existe déjà. |

---

## Exécution (prioritisée)

**Maintenant (P0/P1) :**
1. ✅ F4 — filtre équipements (PR #72).
2. ✅ F3 — fiche hôte publique (PR #73).
3. ✅ F8 — bouton Partager (PR #74).
4. F6 — annonces similaires.
5. F10 — vérifier/exposer l'annulation self-service.
6. F1 — avis bidirectionnels.

**Ensuite (P2) :**
7. F5 — filtres chambres/capacité/type.
8. F9 — centre de notifications in-app.
9. F7 — alertes de recherche sauvegardée.
10. F2 — sous-notes d'avis.

---

_Voir aussi `DESIGN_ROADMAP.md` (UI/UX/animations) et `QA_ROADMAP.md` (qualité/sécurité)._
