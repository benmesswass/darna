# Darna — Annulation à l'initiative de l'hôte : Roadmap

> 📦 **Archivée le 2026-07-27 — chantier clos à 100 % (AH0→AH7 ✅).** Déplacée
> dans `docs/archive/` (`LANCEMENT_ROADMAP.md` §L1.2) pour garder la racine du
> repo lisible. Conservée pour l'historique — ne plus y ajouter de tâche.
>
> **Référence permanente de ce chantier.** Aujourd'hui, `cancelBookingAction`
> (`src/actions/bookings.ts`) ne permet qu'au **voyageur** d'annuler sa propre
> réservation (`booking.guestId !== user.id` → refus). Aucun mécanisme
> n'existe côté hôte. Décidé en session produit du 2026-07-06, après étude
> des politiques Airbnb/Vrbo/Booking.com (annulation hôte toujours
> remboursée intégralement au voyageur côté marché, pénalité croissante côté
> hôte, recouvrement par masquage plutôt que prélèvement automatique).
>
> **Pivot du 2026-07-06 (2e partie de la session) :** la pénalité
> **financière** (facture `HostInvoice` à régler via Konnect) a été
> **abandonnée** — sur une plateforme naissante sans levier réel pour forcer
> le paiement d'une facture, personne ne la réglerait en pratique. Le seul
> dissuasif retenu est un **blocage temporaire de l'ANNONCE concernée**
> (retirée des résultats de recherche pour une durée croissante selon le
> délai laissé au voyageur), combiné à la suspension progressive de
> **compte** déjà existante. Aucune facturation, aucun lien de paiement,
> aucun nouveau flux Konnect dans ce chantier.
>
> **Décisions produit actées (session du 2026-07-06) :**
> 1. **Remboursement voyageur** : toujours intégral, quelle que soit la
>    `cancelPolicy` de l'annonce — c'est l'hôte qui rompt, pas le voyageur.
> 2. **Dissuasif = blocage temporaire de l'annonce**, pas d'argent. Durée
>    croissante selon le délai avant `checkIn` au moment de l'annulation
>    (barème ci-dessous). Annonce simplement exclue des résultats de
>    recherche pendant la durée du blocage — même idiome que
>    `Property.expiresAt` (date de fin, filtre paresseux, aucun cron).
> 3. **Modale d'avertissement obligatoire avant confirmation** : l'hôte doit
>    voir clairement, AVANT de valider, la durée de blocage qui s'appliquera
>    à CETTE annonce selon le délai restant — pas une surprise après coup.
> 4. **Suspension de compte** : les deux leviers se cumulent dès la
>    **1ère annulation** — blocage de l'annonce concernée ET suspension
>    progressive du compte (réutilise `suspensionCount`/`suspendedUntil`,
>    `SUSPENSION_DURATIONS_DAYS` — mêmes champs que l'anti-bypass
>    messagerie, pas de nouveau mécanisme, pas de seuil de tolérance).
> 5. **Libre-service, pas de motif obligatoire ni de revue admin** : le
>    bouton d'annulation reste toujours disponible côté hôte — le blocage
>    d'annonce + la suspension progressive sont le seul garde-fou. Pas de
>    file d'attente de modération à construire (Darna n'a pas d'équipe
>    support).
> 6. **Geste commercial** : réduction ponctuelle liée à LA suggestion de
>    relogement envoyée au voyageur (token signé, usage unique) — pas de
>    nouveau modèle de crédit générique réutilisable sur n'importe quelle
>    réservation (scope volontairement réduit pour cette première version).
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Ne jamais
> laisser ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (bloquant pour livrer le chantier) `P1` (fort impact) `P2` (nice-to-have).

---

## Barème de blocage d'annonce (à ajuster si besoin lors de la revue)

Indépendant de la `cancelPolicy` de l'annonce (c'est une sanction, pas une
politique d'annulation voyageur) — en jours avant `checkIn` au moment où
l'hôte annule :

| Délai avant check-in au moment de l'annulation | Durée de blocage de l'annonce |
|---|---|
| ≥ 30 jours | 3 jours |
| 7 à 30 jours | 15 jours |
| < 7 jours (ou après le check-in — no-show hôte) | 30 jours |

Pendant le blocage, l'annonce est exclue des résultats de recherche
(`activeListingWhere()`) mais reste éditable par l'hôte (pas de suppression,
juste une invisibilité temporaire — cohérent avec le traitement d'une
annonce `expiresAt` dépassée).

---

## Ce qui existe déjà (ne pas réinventer)

- `computeBookingRefund`/`computeRefund` (`src/lib/cancellation.ts`) :
  calcul du remboursement voyageur — **réutilisable tel quel** en forçant
  `refundRate = 1` (remboursement intégral, décision n°1), pas besoin de
  dupliquer la logique de calcul de montant.
- `suspensionCount`/`suspendedUntil`, `SUSPENSION_DURATIONS_DAYS`,
  `src/lib/suspension.ts` : mécanisme de suspension progressive déjà
  fonctionnel (anti-bypass messagerie) — réutiliser tel quel (décision n°4).
- `Property.expiresAt` + `activeListingWhere()` (`src/lib/listings.ts`) :
  patron exact à suivre pour le blocage temporaire — un champ date de fin,
  un filtre paresseux, **aucun job/cron**.
- `AuditLog`/`logAudit` (`src/lib/audit.ts`), centre de notifications
  (`src/lib/notification-center.ts`) : mêmes patrons à réutiliser pour
  tracer l'annulation et notifier le voyageur.
- `getSimilarListings` (`src/lib/listings.ts`, F6) : proche mais
  insuffisant (pas de filtre dates/capacité/prix) — sert de modèle de
  style, pas de base de code à étendre telle quelle.
- `blockingBookingOverlap` (`src/actions/bookings.ts`, privée au module) :
  logique de conflit de dates déjà écrite — à exporter pour la réutiliser
  dans le filtre de disponibilité des suggestions de relogement.

**Explicitement HORS scope de ce chantier** (pivot du 2026-07-06) :
`HostInvoice`, facturation Konnect, dashboard « Factures » — ces phases
(PSP4/PSP5/PSP6 de `PAIEMENT_SUR_PLACE_ROADMAP.md`) restent un chantier
séparé, non entamé par celui-ci.

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| AH0 | Modèle de données : `Property.cancelBlockedUntil`, traçabilité sur `Booking` (`cancelledByHostAt`, `hostCancelBlockDays`) | P0 | ✅ | Migration `20260706160000_add_host_cancellation`. PR #102 (mergée). |
| AH1 | Server action `hostCancelBookingAction` : remboursement intégral voyageur, calcul + pose du blocage d'annonce, suspension progressive de compte, audit log, notification | P0 | ✅ | `src/actions/bookings.ts` + `hostCancelBlockDays` (`src/lib/config.ts`) + `notifyBookingCancelledByHost` (`src/lib/notification-center.ts`). |
| AH2 | Filtre de recherche : exclure les annonces bloquées (`activeListingWhere()`) + refus direct dans `createBookingAction` | P0 | ✅ | `src/lib/listings.ts`, `src/actions/bookings.ts` |
| AH3 | Suggestions de relogement : `getRebookingSuggestions` — jusqu'à 10, ville d'origine + villes voisines (`nearbyCities`), capacité et dates réellement libres en filtres durs, prix en simple critère de tri (pas de bande ±20 % dure, décision produit du 07/07) | P0 | ✅ | `src/lib/listings.ts`. PR AH3/AH4/AH6 (branche `claude/host-cancellation-ah3`). |
| AH4 | Réduction ponctuelle liée aux suggestions (token signé, usage unique, portable — applicable à N'IMPORTE QUELLE annonce réservée dans les 30 jours, pas seulement celle suggérée) | P1 | ✅ | `src/lib/rebooking-discount.ts`, branché sur `createBookingAction`/`quoteBookingAction`. PR AH3/AH4/AH6 (branche `claude/host-cancellation-ah3`). |
| AH5 | UI hôte : modale d'avertissement (durée de blocage prévisionnelle affichée AVANT confirmation) + bouton d'annulation | P0 | ✅ | `HostCancelButton` (`src/components/booking/`), branché sur `src/app/dashboard/reservations/page.tsx` — livré avec AH1 pour rester testable de bout en bout. |
| AH6 | UI voyageur : notification d'annulation + page listant les suggestions + réduction | P0 | ✅ | `src/app/relogement/[bookingId]/page.tsx` — jusqu'à 10 cartes (`PropertyCard`), calculées à la consultation (pas figées à l'annulation), réduction générée à l'affichage et propagée sur chaque carte. Notification (AH1) pointe vers cette page. PR AH3/AH4/AH6 (branche `claude/host-cancellation-ah3`). |
| AH7 | Durcissement sécurité/QA : idempotence, IDOR, non-bypass (dates falsifiées, double annulation, token de réduction rejouable, contournement du blocage d'annonce) + mise à jour `QA_ROADMAP.md` | P0 | ✅ | `tests/host-cancellation-security.test.ts` (IDOR D8, idempotence D9, palier D10, blocage direct-link D11), `tests/rebooking-discount.test.ts` (token D12). Bug trouvé et corrigé en testant en direct : `quoteBookingAction` ne vérifiait pas `cancelBlockedUntil` (`src/actions/bookings.ts`) — le devis semblait valide, seule la soumission finale refusait. `QA_ROADMAP.md` §3 (D8-D12) et §4.5 mis à jour. |

**Chantier "annulation hôte" — clôture à confirmer par Wassim (pas encore
terminé). Statut des phases dans le tableau ci-dessus.**

> **Suite (2026-07-07) :** l'analyse critique du code livré a relevé un bug
> économique de remboursement + des manques UX/robustesse, regroupés dans un
> sous-chantier de correctifs distinct (`ANNULATION_HOTE_CORRECTIFS_ROADMAP.md`).
>
> **➡️ ACTIF — CONTINUATION : `ANNULATION_HOTE_CORRECTIFS_ROADMAP.md`,
> elle-même close (AHC1→AHC8 tous `✅`, 2026-07-08) et pointant à son tour
> vers `FEATURES_ROADMAP.md` / `QA_ROADMAP.md`.** Le chantier annulation
> hôte (AH + AHC) est entièrement clos. « suivant » / « enchaîne » reprend
> désormais la priorité la plus haute (`P0`/`P1`) des roadmaps produit/QA
> générales. Cf. règle « Chaînage automatique des roadmaps » de `CLAUDE.md`.

## Exécution (prioritisée)

1. ✅ AH0 — modèle de données.
2. ✅ AH1 — action d'annulation hôte (cœur du chantier : remboursement + blocage + suspension).
3. ✅ AH2 — filtre de recherche (annonce bloquée invisible) + refus direct.
4. ✅ AH3 — moteur de suggestions.
5. ✅ AH4 — réduction ponctuelle.
6. ✅ AH5 — UI hôte (modale d'avertissement) — livrée avec AH1.
7. ✅ AH6 — UI voyageur (page de relogement).
8. ✅ AH7 — tests + QA_ROADMAP.md.

---

## Prompts Claude Code (à enchaîner un par un)

> Copier-coller un prompt par session, dans l'ordre, une fois la phase
> précédente mergée. `CLAUDE.md` est chargé automatiquement (règles PR,
> i18n, tests, « Comment tester »). Travailler sur une branche dédiée à ce
> chantier tant que la PR n'est pas mergée (règle CLAUDE.md : pas de
> nouvelle branche pour une amélioration sur une PR déjà ouverte).

### Prompt AH0 — Modèle de données

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md — lis ce
fichier en entier d'abord, en particulier les "Décisions produit actées" et
le barème de blocage proposé. AUCUNE facturation dans ce chantier (pivot du
2026-07-06) — ne touche pas à HostInvoice.

Dans prisma/schema.prisma :
- Ajoute Property.cancelBlockedUntil DateTime? — date de fin du blocage
  temporaire suite à une annulation hôte (null = pas bloquée). Même esprit
  que Property.expiresAt : un champ date, jamais de statut à faire
  basculer par un job.
- Ajoute sur Booking : cancelledByHostAt DateTime? et
  hostCancelBlockDays Int? (nombre de jours de blocage appliqués —
  traçabilité de quel palier a été utilisé, indépendant d'un futur
  changement du barème).

Génère la migration (npx prisma migrate dev --name add_host_cancellation).
Vérifie que prisma/seed.ts tourne toujours sans modification obligatoire.

Coche AH0 dans ANNULATION_HOTE_ROADMAP.md (✅, fichier/migration). Commit +
push. Bloc "Comment tester" habituel (CLAUDE.md).
```

### Prompt AH1 — Action d'annulation hôte

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH1). AH0 mergé — vérifie que Property.cancelBlockedUntil et les deux
champs sur Booking existent avant de commencer. Lis aussi
cancelBookingAction existant (src/actions/bookings.ts) pour le patron à
suivre (idempotence, IDOR, transaction). AUCUNE facturation ici (pivot du
2026-07-06) — pas de HostInvoice.

Nouvelle server action hostCancelBookingAction(bookingId) dans
src/actions/bookings.ts :

1. Autorisation : vérifie que l'appelant est bien property.ownerId de la
   réservation (IDOR) et que status === "CONFIRMEE" (pas déjà
   TERMINEE/ANNULEE).
2. Calcule le délai en jours entre maintenant et checkIn. Applique le
   barème de ANNULATION_HOTE_ROADMAP.md (3j / 15j / 30j de blocage selon
   les seuils ≥30j / 7-30j / <7j-ou-après-checkin).
3. Transaction Prisma : passe le booking à ANNULEE, cancelledAt = now,
   cancelledByHostAt = now, hostCancelBlockDays = le palier appliqué,
   refundAmount = totalPrice (remboursement TOUJOURS intégral, décision
   produit n°1 — réutilise computeBookingRefund en forçant le taux à 1
   plutôt que dupliquer le calcul). Pose Property.cancelBlockedUntil = now
   + le nombre de jours calculé.
4. Suspension progressive de compte : incrémente suspensionCount de
   l'hôte et pose suspendedUntil via la fonction déjà existante dans
   src/lib/suspension.ts (même patron que l'anti-bypass messagerie — ne
   duplique pas la logique de calcul de durée). Se cumule avec le blocage
   d'annonce, ne le remplace pas (décision produit n°4).
5. logAudit HOST_CANCELLED_BOOKING (bookingId, propertyId, blockDays).
6. Notification voyageur (centre de notifications existant, nouveau
   NotificationType RESERVATION_ANNULEE_PAR_HOTE) — le lien de cette
   notification sera complété en AH6 avec les suggestions de relogement
   (pour l'instant, pointe simplement vers /sejours, AH6 le remplacera).
7. E-mail de remboursement en parallèle (patron non-bloquant existant,
   voir sendBookingConfirmationEmail).

Tests unitaires : le voyageur ne peut PAS appeler cette action sur sa
propre réservation (IDOR inverse) ; un hôte ne peut pas l'appeler sur la
réservation d'un autre hôte ; le palier de blocage est bien recalculé
serveur quel que soit ce qu'envoie le client ; double appel = la 2e
tentative échoue proprement (déjà ANNULEE) sans double blocage ni double
suspension.

Coche AH1. Commit + push. Bloc "Comment tester" avec un compte hôte + une
réservation CONFIRMEE identifiée dans le seed, à des délais différents
avant check-in si possible pour couvrir plusieurs paliers.
```

### Prompt AH2 — Filtre de recherche (annonce bloquée invisible)

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH2). AH0-AH1 mergés.

Étends activeListingWhere() dans src/lib/listings.ts pour exclure les
annonces dont cancelBlockedUntil est dans le futur — même esprit que le
filtre expiresAt existant (OR sur cancelBlockedUntil null OU <= now).
Vérifie que cette fonction est bien le SEUL point d'entrée utilisé par
searchSejours et les autres listes publiques (grep les usages), pour ne
pas avoir à dupliquer le filtre ailleurs.

Vérifie/ajoute un encart dans le dashboard hôte (annonces, ou sur la fiche
annonce elle-même) indiquant qu'une annonce est temporairement invisible
suite à une annulation, avec la date de fin — l'hôte ne doit pas découvrir
par hasard que son annonce a disparu des résultats.

Test : une annonce avec cancelBlockedUntil dans le futur n'apparaît plus
dans /sejours ni sur la page hôte publique, puis réapparaît automatiquement
une fois la date passée (pas de délai de propagation, pas de cron).

Coche AH2. Commit + push. Bloc "Comment tester".
```

### Prompt AH3 — Suggestions de relogement

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH3). Indépendant de AH0-AH2 (peut être fait en parallèle ou avant).

Exporte blockingBookingOverlap depuis src/actions/bookings.ts (retire le
"function" privé, exporte-la — vérifie qu'aucun autre changement de
comportement n'est introduit).

Nouvelle fonction getRebookingSuggestions dans src/lib/listings.ts :

  getRebookingSuggestions(
    booking: { id: string; propertyId: string; city: string; guests: number;
               checkIn: Date; checkOut: Date; pricePerNight: number },
    take = 4
  ): Promise<ListingWithPhoto[]>

Critères : activeListingWhere() existant (donc automatiquement, une
annonce elle-même bloquée par AH2 n'apparaît jamais en suggestion), même
city, capacite >= guests, pricePerNight entre 0.8x et 1.2x (bande ±20 %) du
prix de la réservation annulée, id != propertyId annulée, ET aucune
réservation bloquante sur les mêmes dates (réutilise blockingBookingOverlap
exportée). Trie par écart de prix croissant (le plus proche du prix payé
d'abord).

Teste manuellement (script ou test unitaire) que la propriété annulée
elle-même n'apparaît jamais, et qu'une propriété avec une réservation
CONFIRMEE qui chevauche les dates est bien exclue.

Coche AH3. Commit + push. Bloc "Comment tester".
```

### Prompt AH4 — Réduction ponctuelle liée à la suggestion

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH4). AH1 et AH3 mergés.

Nouveau fichier src/lib/rebooking-discount.ts (serveur uniquement, pas
"use server" — même raison que settleKonnectBooking : pas d'endpoint RPC
client) :

- signRebookingDiscount(cancelledBookingId: string, guestId: string):
  string — génère un token signé HMAC (réutilise le même secret dérivé
  d'AUTH_SECRET que KONNECT_WEBHOOK_SECRET, voir src/lib/konnect.ts pour le
  patron de dérivation) encodant cancelledBookingId + guestId + un montant
  de réduction fixe à définir (propose 10 % du prix de la nouvelle
  réservation, plafonné à un montant raisonnable en TND — documente ton
  choix dans un commentaire, c'est un paramètre business à confirmer avec
  Wassim).
- verifyAndConsumeRebookingDiscount(token, guestId, newBookingPropertyId):
  vérifie la signature, que le token n'a pas déjà été consommé (nouveau
  champ rebookingDiscountUsedFor sur le Booking annulé, pointant vers le
  nouveau bookingId une fois utilisé), que guestId correspond bien au
  voyageur concerné par l'annulation d'origine. Retourne le montant de
  réduction ou null si invalide/déjà utilisé.

Branche dans createBookingAction (src/actions/bookings.ts) : si un
paramètre de réduction est présent (query param sur le lien de
notification, à transmettre jusqu'au formulaire de réservation), applique
la réduction sur le prix AVANT calcul du serviceFee (la réduction ampute le
prix payé par le voyageur, pas la commission Darna — documente ce choix,
c'est un coût que Darna absorbe comme geste commercial).

UI : le lien envoyé dans la notification voyageur pointe vers l'annonce
suggérée avec le token en query param ; un bandeau sur la page de
réservation affiche "Réduction Darna appliquée : -X TND" si le token est
valide.

Tests : un token ne peut pas être réutilisé deux fois ; un token signé pour
le voyageur A ne peut pas être utilisé par le voyageur B ; un token expiré
(ajoute une expiration raisonnable, ex. 30 jours) est rejeté.

Coche AH4. Commit + push. Bloc "Comment tester".
```

### Prompt AH5 — UI hôte (modale d'avertissement)

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH5). AH0-AH1 mergés.

Nouveau composant HostCancelButton (src/components/booking/), même patron
que CancelBookingButton.tsx existant MAIS avec une modale d'avertissement
en amont (décision produit n°3) : avant toute soumission, affiche
clairement — recalculé côté client à partir du même barème que
hostCancelBookingAction, à titre INFORMATIF, l'action revérifie tout
serveur — la durée de blocage qui s'appliquera à CETTE annonce précise
selon le délai restant avant checkIn (ex. "Cette annonce sera invisible
sur Darna pendant 30 jours si vous confirmez"), ET un rappel que la
suspension progressive du compte s'applique aussi. Design "danger" clair
(couleur d'alerte, texte explicite) — l'hôte doit comprendre la
conséquence AVANT de cliquer confirmer, pas après.

Branché dans src/app/dashboard/reservations/page.tsx, colonne d'actions à
droite (même alignement que le reste de cette page), visible uniquement
pour une réservation CONFIRMEE.

i18n dans les trois dictionnaires (fr/en/ar) pour tous les nouveaux
libellés (titre/corps de la modale par palier, confirmation, bouton).

Coche AH5. Commit + push. Bloc "Comment tester" couvrant au moins deux
paliers différents (un délai long, un délai court) pour vérifier que le
message de la modale change bien.
```

### Prompt AH6 — UI voyageur

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH6). AH1, AH3, AH4, AH5 mergés.

La notification RESERVATION_ANNULEE_PAR_HOTE (posée en AH1) doit maintenant
pointer vers une page/section listant les suggestions de relogement (AH3)
avec le lien à réduction (AH4) sur chacune — décide du meilleur
emplacement (nouvelle route dédiée vs section sur /sejours avec un
paramètre) et documente ton choix. Message clair : réservation annulée par
l'hôte, remboursement intégral déjà effectué, voici des alternatives
similaires avec une réduction.

i18n dans les trois dictionnaires pour tous les nouveaux libellés.

Coche AH6. Commit + push. Bloc "Comment tester" complet couvrant le
parcours hôte annule → voyageur reçoit notification → clique suggestion →
réduction visible → réserve.
```

### Prompt AH7 — Durcissement sécurité/QA

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH7, phase finale). AH0-AH6 mergés. Lis QA_ROADMAP.md en entier avant de
commencer — nouvelle surface sensible (visibilité d'annonce + réputation +
suspension de compte), couverte par la règle de ce fichier sur les
surfaces sensibles.

Tests à ajouter (patron D1-D7 déjà établi dans QA_ROADMAP.md) :
- IDOR : hostCancelBookingAction — un hôte B ne peut pas annuler une
  réservation sur une annonce d'un hôte A.
- Non-bypass : le palier de blocage est bien recalculé serveur (impossible
  de forcer un palier plus court depuis le client) ; un voyageur ne peut
  pas déclencher hostCancelBookingAction ; un token de réduction ne peut
  être consommé qu'une fois, que par le bon voyageur, et expire
  correctement ; une annonce bloquée reste inaccessible même via un lien
  direct de réservation (createBookingAction doit refuser, pas seulement
  la masquer de la recherche).
- Idempotence : double annulation.
- Suspension : suspensionCount s'incrémente correctement à chaque
  annulation hôte, la durée suit bien SUSPENSION_DURATIONS_DAYS, se cumule
  bien avec le blocage d'annonce sans interférence.

Mets à jour QA_ROADMAP.md (nouvelle section, modèle sur l'existant).

Mets à jour ANNULATION_HOTE_ROADMAP.md : coche AH7, et si toutes les phases
sont ✅, ajoute une ligne de conclusion. Commit + push. Rapport de test
complet (CLAUDE.md, règle "Workflow PR" point 3) couvrant le parcours
complet : hôte annule → modale d'avertissement → annonce bloquée + compte
suspendu → voyageur remboursé + suggestions reçues → réduction appliquée
sur une nouvelle réservation → annonce redevient visible à l'échéance.
```
