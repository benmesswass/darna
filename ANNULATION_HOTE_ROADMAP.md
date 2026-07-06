# Darna — Annulation à l'initiative de l'hôte : Roadmap

> **Référence permanente de ce chantier.** Aujourd'hui, `cancelBookingAction`
> (`src/actions/bookings.ts`) ne permet qu'au **voyageur** d'annuler sa propre
> réservation (`booking.guestId !== user.id` → refus). Aucun mécanisme
> n'existe côté hôte. Décidé en session produit du 2026-07-06, après étude
> des politiques Airbnb/Vrbo/Booking.com (annulation hôte toujours
> remboursée intégralement au voyageur côté marché, pénalité croissante côté
> hôte, recouvrement par masquage plutôt que prélèvement automatique — aucune
> des trois plateformes ne débite un compte bancaire hôte directement).
>
> **Décisions produit actées (session du 2026-07-06) :**
> 1. **Remboursement voyageur** : toujours intégral, quelle que soit la
>    `cancelPolicy` de l'annonce — c'est l'hôte qui rompt, pas le voyageur.
> 2. **Base de la pénalité hôte** : **% du prix total du séjour**
>    (`totalPrice`), pas de la commission Darna seule — sinon aucun pouvoir
>    dissuasif face à un hôte qui trouverait un locataire plus rémunérateur.
> 3. **Mécanisme de recouvrement** : **aucun prélèvement automatique
>    possible** — Darna n'a aucun système de payout vers l'hôte
>    (`escrow: LIBERE` est un simple label en base, cf. `src/lib/bookings.ts`,
>    aucun virement réel n'est jamais déclenché). La pénalité est donc une
>    **facture ponctuelle par incident**, sur le modèle exact de `HostInvoice`
>    déjà conçu pour la commission Rail 2 (`PAIEMENT_SUR_PLACE_ROADMAP.md`) :
>    un lien de paiement Konnect à régler, recouvrement par **masquage des
>    annonces** si impayé — jamais de débit forcé.
> 4. **Sanction de compte** : suspension **progressive dès la 1ère
>    annulation** (réutilise `suspensionCount`/`suspendedUntil`,
>    `SUSPENSION_DURATIONS_DAYS` — mêmes champs que l'anti-bypass messagerie,
>    pas de nouveau mécanisme). Contrairement au anti-bypass (seuil de 4
>    signalements avant la 1ère suspension), une annulation hôte est un
>    manquement direct et non ambigu : pas de tolérance avant sanction.
> 5. **Libre-service, pas de motif obligatoire ni de revue admin** : le
>    bouton d'annulation reste toujours disponible côté hôte (comme
>    Airbnb/Vrbo) — la pénalité financière + la suspension progressive sont
>    le seul garde-fou. Pas de file d'attente de modération à construire
>    (Darna n'a pas d'équipe support).
> 6. **Geste commercial** : réduction ponctuelle liée à LA suggestion de
>    relogement envoyée au voyageur (token signé, usage unique) — pas de
>    nouveau modèle de crédit générique réutilisable sur n'importe quelle
>    réservation (scope volontairement réduit pour cette première version).
>
> **Chevauchement avec `PAIEMENT_SUR_PLACE_ROADMAP.md` :** ce chantier livre,
> en généralisé, l'équivalent des phases **PSP4** (règlement facture hôte via
> Konnect) et **PSP6** (masquage annonces si facture en retard) de ce
> document — qui restaient ❌ non commencées. Une fois ce chantier mergé,
> cocher PSP4/PSP6 dans `PAIEMENT_SUR_PLACE_ROADMAP.md` en pointant vers les
> PR de ce chantier, plutôt que de les reconstruire en double lors du
> chantier cash.
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Ne jamais
> laisser ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (bloquant pour livrer le chantier) `P1` (fort impact) `P2` (nice-to-have).

---

## Barème de pénalité proposé (à ajuster si besoin lors de la revue)

Indépendant de la `cancelPolicy` de l'annonce (c'est une pénalité, pas une
politique d'annulation voyageur) — calqué sur le barème Airbnb à 3 paliers,
en jours avant `checkIn` :

| Délai avant check-in au moment de l'annulation | Pénalité (% de `totalPrice`) |
|---|---|
| ≥ 30 jours | 10 % |
| 7 à 30 jours | 25 % |
| < 7 jours (ou après le check-in — no-show hôte) | 50 % |

**Plancher** : la pénalité ne descend jamais sous `serviceFee` (la commission
que Darna aurait perçue) — Darna ne doit jamais être perdant sur une
annulation hôte par rapport à un séjour honoré normalement.

---

## Ce qui existe déjà (ne pas réinventer)

- `computeBookingRefund`/`computeRefund` (`src/lib/cancellation.ts`) :
  calcul du remboursement voyageur — **réutilisable tel quel** en forçant
  `refundRate = 1` (remboursement intégral, cf. décision produit n°1), pas
  besoin de dupliquer la logique de calcul de montant.
- `suspensionCount`/`suspendedUntil`, `SUSPENSION_DURATIONS_DAYS`,
  `src/lib/suspension.ts` : mécanisme de suspension progressive déjà
  fonctionnel (anti-bypass messagerie) — réutiliser tel quel pour la
  décision produit n°4, ne pas dupliquer.
- `HostInvoice` (modèle Prisma), `HOST_INVOICE_STATUSES`
  (`src/lib/constants.ts`) : structure de facturation par incident déjà
  posée pour la commission Rail 2 — à **généraliser** (nouveau champ
  `reason`), pas remplacer.
- `AuditLog`/`logAudit` (`src/lib/audit.ts`), `Notification`/centre de
  notifications (`src/lib/notification-center.ts`) : mêmes patrons à
  réutiliser pour tracer l'annulation et notifier le voyageur.
- `getSimilarListings` (`src/lib/listings.ts`, F6) : proche mais
  insuffisant (pas de filtre dates/capacité/prix) — sert de modèle de style,
  pas de base de code à étendre telle quelle (nouvelle fonction dédiée).
- `blockingBookingOverlap` (`src/actions/bookings.ts`, privée au module) :
  logique de conflit de dates déjà écrite — à exporter pour la réutiliser
  dans le filtre de disponibilité des suggestions de relogement.

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| AH0 | Modèle de données : généraliser `HostInvoice` (`reason`), nouveau champ traçant l'annulation hôte sur `Booking` | P0 | ❌ | `prisma/schema.prisma` + migration |
| AH1 | Server action `hostCancelBookingAction` : remboursement intégral voyageur, calcul + facturation de la pénalité, suspension progressive, audit log, notification | P0 | ❌ | `src/actions/bookings.ts` |
| AH2 | Suggestions de relogement : `getRebookingSuggestions` (ville, capacité, prix, disponibilité réelle) | P0 | ❌ | `src/lib/listings.ts` |
| AH3 | Réduction ponctuelle liée à la suggestion (token signé, usage unique) | P1 | ❌ | nouveau `src/lib/rebooking-discount.ts`, branché sur `createBookingAction` |
| AH4 | UI hôte (bouton + pénalité prévisionnelle avant confirmation) et UI voyageur (notification + suggestions + réduction) | P0 | ❌ | `src/app/dashboard/reservations/page.tsx`, nouveau composant `HostCancelButton`, page/section de notification dédiée |
| AH5 | Règlement de la `HostInvoice` (pénalité ET commission Rail 2 au passage) : lien Konnect ponctuel + webhook + page retour | P0 | ❌ | `src/lib/host-invoicing.ts`, `src/app/api/payments/konnect/host-invoice-webhook/route.ts` — généralise PSP4 |
| AH6 | Dashboard hôte « Factures » + recouvrement par masquage si impayé | P1 | ❌ | `src/app/dashboard/factures/page.tsx`, `hasOverdueHostInvoice`, filtre dans `searchSejours` — généralise PSP5/PSP6 |
| AH7 | Durcissement sécurité/QA : idempotence, IDOR, non-bypass (dates falsifiées, double annulation, token de réduction rejouable) + mise à jour `QA_ROADMAP.md` | P0 | ❌ | Nouvelle surface sensible (argent + réputation) — obligatoire avant merge final |

## Exécution (prioritisée)

1. ❌ AH0 — modèle de données.
2. ❌ AH1 — action d'annulation hôte (cœur du chantier : remboursement + pénalité + suspension).
3. ❌ AH2 — moteur de suggestions.
4. ❌ AH3 — réduction ponctuelle.
5. ❌ AH4 — UI des deux côtés.
6. ❌ AH5 — règlement Konnect de la facture (généralise PSP4).
7. ❌ AH6 — dashboard factures + masquage (généralise PSP5/PSP6).
8. ❌ AH7 — tests + QA_ROADMAP.md.

---

## Prompts Claude Code (à enchaîner un par un)

> Copier-coller un prompt par session, dans l'ordre, une fois la phase
> précédente mergée. `CLAUDE.md` est chargé automatiquement (règles PR,
> i18n, tests, « Comment tester »). Travailler sur une branche dédiée à ce
> chantier tant que la PR n'est pas mergée (règle CLAUDE.md : pas de nouvelle
> branche pour une amélioration sur une PR déjà ouverte).

### Prompt AH0 — Modèle de données

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md — lis ce
fichier en entier d'abord, en particulier les "Décisions produit actées" et
le barème de pénalité proposé.

Dans prisma/schema.prisma :
- Ajoute HostInvoice.reason String @default("COMMISSION") — nouvelle enum
  HOST_INVOICE_REASONS = ["COMMISSION", "PENALITE_ANNULATION"] dans
  src/lib/constants.ts. Le cas "COMMISSION" correspond à l'usage Rail 2 déjà
  prévu (PAIEMENT_SUR_PLACE_ROADMAP.md), "PENALITE_ANNULATION" à ce chantier.
- Ajoute sur Booking : cancelledByHostAt DateTime? et
  hostCancelPenaltyRate Int? (taux appliqué en centièmes, ex. 10/25/50 —
  traçabilité de quel palier a été appliqué, indépendant de toute
  recalcul futur du barème).

Génère la migration (npx prisma migrate dev --name add_host_cancellation).
Vérifie que prisma/seed.ts tourne toujours sans modification obligatoire.

Coche AH0 dans ANNULATION_HOTE_ROADMAP.md (✅, fichier/migration). Commit +
push. Bloc "Comment tester" habituel (CLAUDE.md).
```

### Prompt AH1 — Action d'annulation hôte

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH1). AH0 mergé — vérifie que HostInvoice.reason et les deux champs sur
Booking existent avant de commencer. Lis aussi cancelBookingAction existant
(src/actions/bookings.ts) pour le patron à suivre (idempotence, IDOR,
transaction).

Nouvelle server action hostCancelBookingAction(bookingId) dans
src/actions/bookings.ts :

1. Autorisation : vérifie que l'appelant est bien property.ownerId de la
   réservation (IDOR) et que status === "CONFIRMEE" (pas déjà
   TERMINEE/ANNULEE).
2. Calcule le délai en jours entre maintenant et checkIn. Applique le
   barème de ANNULATION_HOTE_ROADMAP.md (10 % / 25 % / 50 % de totalPrice
   selon les seuils ≥30j / 7-30j / <7j-ou-après-checkin), avec un plancher
   à serviceFee (Math.max(penalite, serviceFee)). Arrondis le montant en
   TND (Math.round), documente le calcul dans un commentaire.
3. Transaction Prisma : passe le booking à ANNULEE, cancelledAt = now,
   cancelledByHostAt = now, hostCancelPenaltyRate = le taux appliqué,
   refundAmount = totalPrice (remboursement TOUJOURS intégral, décision
   produit n°1 — réutilise computeBookingRefund en forçant le taux à 1
   plutôt que dupliquer le calcul de montant). Crée dans la MÊME
   transaction une HostInvoice(reason: "PENALITE_ANNULATION", amount: le
   montant de pénalité calculé, dueAt: now + 7 jours, bookingId, hostId).
4. Suspension progressive : incrémente suspensionCount de l'hôte et pose
   suspendedUntil via la fonction déjà existante dans src/lib/suspension.ts
   (même patron que l'anti-bypass messagerie — ne duplique pas la logique
   de calcul de durée).
5. logAudit HOST_CANCELLED_BOOKING (bookingId, penaltyAmount, penaltyRate).
6. Notification voyageur (centre de notifications existant, nouveau
   NotificationType RESERVATION_ANNULEE_PAR_HOTE) — le lien de cette
   notification sera complété en AH3 avec les suggestions de relogement
   (pour l'instant, pointe simplement vers /sejours, AH3 le remplacera).
7. E-mail de remboursement en parallèle (patron non-bloquant existant,
   voir sendBookingConfirmationEmail).

Tests unitaires : le voyageur ne peut PAS appeler cette action sur sa
propre réservation (IDOR inverse) ; un hôte ne peut pas l'appeler sur la
réservation d'un autre hôte ; le montant de pénalité est bien recalculé
serveur quel que soit ce qu'envoie le client (pas de champ "montant" côté
formulaire) ; double appel = la 2e tentative échoue proprement (déjà
ANNULEE) sans double pénalité ni double suspension.

Coche AH1. Commit + push. Bloc "Comment tester" avec un compte hôte + une
réservation CONFIRMEE identifiée dans le seed, à des délais différents
avant check-in si possible pour couvrir plusieurs paliers.
```

### Prompt AH2 — Suggestions de relogement

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH2). Indépendant de AH1 (peut être fait en parallèle ou avant).

Exporte blockingBookingOverlap depuis src/actions/bookings.ts (retire le
"function" privé, exporte-la — vérifie qu'aucun autre changement de
comportement n'est introduit).

Nouvelle fonction getRebookingSuggestions dans src/lib/listings.ts :

  getRebookingSuggestions(
    booking: { id: string; propertyId: string; city: string; guests: number;
               checkIn: Date; checkOut: Date; pricePerNight: number },
    take = 4
  ): Promise<ListingWithPhoto[]>

Critères : activeListingWhere() existant, même city, capacite >= guests,
pricePerNight entre 0.8x et 1.2x (bande ±20 %) du prix de la réservation
annulée, id != propertyId annulée, ET aucune réservation bloquante sur les
mêmes dates (réutilise blockingBookingOverlap exportée — la propriété ne
doit PAS avoir de booking qui chevauche checkIn/checkOut). Trie par écart de
prix croissant (le plus proche du prix payé d'abord) puis par note moyenne
si tu as cette info facilement disponible dans listingCardInclude, sinon
laisse l'ordre par écart de prix seul.

Teste manuellement (script ou test unitaire) que la propriété annulée
elle-même n'apparaît jamais, et qu'une propriété avec une réservation
CONFIRMEE qui chevauche les dates est bien exclue.

Coche AH2. Commit + push. Bloc "Comment tester".
```

### Prompt AH3 — Réduction ponctuelle liée à la suggestion

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH3). AH1 et AH2 mergés.

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
  champ ou table minimale à toi de choisir — le plus simple est un champ
  rebookingDiscountUsedFor sur le Booking annulé, pointant vers le nouveau
  bookingId une fois utilisé), que guestId correspond bien au voyageur
  concerné par l'annulation d'origine. Retourne le montant de réduction ou
  null si invalide/déjà utilisé.

Branche dans createBookingAction (src/actions/bookings.ts) : si un
paramètre de réduction est présent (query param sur le lien de
notification, à transmettre jusqu'au formulaire de réservation), applique
la réduction sur le prix AVANT calcul du serviceFee (la réduction ampute le
prix payé par le voyageur, pas la commission Darna — documente ce choix).

UI : le lien envoyé dans la notification voyageur (complète AH1 point 6)
pointe vers l'annonce suggérée avec le token en query param ; un bandeau
sur la page de réservation affiche "Réduction Darna appliquée : -X TND" si
le token est valide.

Tests : un token ne peut pas être réutilisé deux fois ; un token signé pour
le voyageur A ne peut pas être utilisé par le voyageur B ; un token expiré
(ajoute une expiration raisonnable, ex. 30 jours) est rejeté.

Coche AH3. Commit + push. Bloc "Comment tester".
```

### Prompt AH4 — UI des deux côtés

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH4). AH1-AH3 mergés.

Côté hôte : nouveau composant HostCancelButton (src/components/booking/),
même patron que CancelBookingButton.tsx existant (confirmation avant
soumission, affiche le montant de pénalité PRÉVISIONNEL calculé côté client
à partir du même barème que hostCancelBookingAction — recalcul strictement
informatif, l'action revérifie tout serveur). Branché dans
src/app/dashboard/reservations/page.tsx, colonne d'actions à droite (même
alignement que le reste de cette page, cf. PR mergée du profil voyageur),
visible uniquement pour une réservation CONFIRMEE.

Côté voyageur : la notification RESERVATION_ANNULEE_PAR_HOTE (posée en AH1)
doit maintenant pointer vers une page/section listant les suggestions de
relogement (AH2) avec le lien à réduction (AH3) sur chacune — décide du
meilleur emplacement (nouvelle route dédiée vs section sur /sejours avec
un paramètre) et documente ton choix.

i18n dans les trois dictionnaires (fr/en/ar) pour tous les nouveaux
libellés (confirmation d'annulation hôte, montant de pénalité affiché,
message de notification, bandeau de réduction).

Coche AH4. Commit + push. Bloc "Comment tester" complet couvrant le
parcours hôte annule → voyageur reçoit notification → clique suggestion →
réduction visible → réserve.
```

### Prompt AH5 — Règlement Konnect de la facture (généralise PSP4)

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH5). Généralise la phase PSP4 de PAIEMENT_SUR_PLACE_ROADMAP.md (jamais
commencée) pour les DEUX reasons de HostInvoice (COMMISSION ET
PENALITE_ANNULATION), pas seulement la pénalité.

Crée src/lib/host-invoicing.ts, en miroir de src/lib/payments.ts
(settleKonnectBooking) : settleHostInvoice(ref: { invoiceId } |
{ paymentRef }), NON "use server", idempotente via updateMany({ where:
{ status: "EN_ATTENTE" } }), revérifie le montant reçu côté Konnect
(getKonnectPayment) avant de passer HostInvoice.status à PAYEE + paidAt.

Server action payHostInvoiceAction : vérifie hostId de l'appelant (IDOR),
initialise un paiement Konnect (initKonnectPayment, amountTND =
invoice.amount), webhook signé (réutilise signKonnectWebhook/
verifyKonnectWebhook de src/lib/konnect.ts tel quel).

Route webhook src/app/api/payments/konnect/host-invoice-webhook/route.ts,
miroir de src/app/api/payments/konnect/webhook/route.ts (GET,
?iid=<invoiceId>&sig=..., même garde de signature + rate limit).

Coche AH5. Coche AUSSI PSP4 dans PAIEMENT_SUR_PLACE_ROADMAP.md en pointant
vers cette PR (note explicite : livré dans le cadre du chantier annulation
hôte, généralisé aux deux reasons). Commit + push. Bloc "Comment tester"
(rappelle que sans KONNECT_API_KEY local, le test se limite au mode démo).
```

### Prompt AH6 — Dashboard factures + masquage (généralise PSP5/PSP6)

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH6). Généralise PSP5/PSP6 de PAIEMENT_SUR_PLACE_ROADMAP.md. AH0-AH5 mergés.

1. src/app/dashboard/factures/page.tsx : liste des HostInvoice de l'hôte
   connecté (reason, montant, réservation liée, échéance, statut), bouton
   "Payer" (payHostInvoiceAction). Badge "EN RETARD" dérivé à l'affichage
   (status EN_ATTENTE && dueAt < now) — jamais stocké.
2. hasOverdueHostInvoice(hostId) : filtre Prisma relationnel (pas de champ
   dénormalisé), branché dans searchSejours (src/lib/listings.ts) pour
   exclure les annonces d'un hôte avec facture en retard, ET dans
   createBookingAction pour refuser toute nouvelle réservation sur ces
   annonces (message clair).
3. Bannière dans le dashboard hôte si facture en retard, lien vers
   /dashboard/factures.

i18n dans les trois dictionnaires. Test : une annonce redevient
visible/réservable immédiatement après règlement (pas de délai de
propagation, pas de cron).

Coche AH6. Coche AUSSI PSP5/PSP6 dans PAIEMENT_SUR_PLACE_ROADMAP.md (note :
livré dans le cadre du chantier annulation hôte). Commit + push. Bloc
"Comment tester".
```

### Prompt AH7 — Durcissement sécurité/QA

```
Contexte : chantier "annulation hôte" de ANNULATION_HOTE_ROADMAP.md (ligne
AH7, phase finale). AH0-AH6 mergés. Lis QA_ROADMAP.md en entier avant de
commencer — nouvelle surface sensible (argent + réputation + suspension de
compte), couverte par la règle de ce fichier sur les surfaces sensibles.

Tests à ajouter (patron D1-D7 déjà établi dans QA_ROADMAP.md) :
- IDOR : hostCancelBookingAction, payHostInvoiceAction, page
  /dashboard/factures — un hôte B ne peut ni annuler ni payer/voir les
  factures d'un hôte A.
- Non-bypass : le taux de pénalité est bien recalculé serveur (impossible
  de forcer un taux plus bas depuis le client) ; un voyageur ne peut pas
  déclencher hostCancelBookingAction ; un token de réduction ne peut être
  consommé qu'une fois, que par le bon voyageur, et expire correctement.
- Idempotence : double annulation, double règlement de facture, double
  webhook.
- Recouvrement : la visibilité d'une annonce suit exactement l'état réel
  de la facture, sans race condition entre le calcul "en retard" et un
  paiement concurrent.
- Suspension : suspensionCount s'incrémente correctement à chaque
  annulation hôte, la durée suit bien SUSPENSION_DURATIONS_DAYS.

Mets à jour QA_ROADMAP.md (nouvelle section, modèle sur l'existant pour
HostInvoice/settleKonnectBooking).

Mets à jour ANNULATION_HOTE_ROADMAP.md : coche AH7, et si toutes les phases
sont ✅, ajoute une ligne de conclusion. Commit + push. Rapport de test
complet (CLAUDE.md, règle "Workflow PR" point 3) couvrant le parcours
complet : hôte annule → pénalité facturée → voyageur remboursé + suggestions
reçues → réduction appliquée sur une nouvelle réservation → facture réglée
→ suspension purgée à son terme.
```
