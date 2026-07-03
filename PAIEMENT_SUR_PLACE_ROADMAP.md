# Darna — Paiement sur place (cash local) : Roadmap

> **Référence permanente de ce chantier.** Décidé en session produit du
> 2026-07-03 : garder le séquestre Konnect (acompte + solde, cf.
> `src/lib/config.ts`) comme mode **par défaut** — c'est lui qui sert la cible
> prioritaire diaspora (paiement carte). On ajoute un **second mode, en option
> hôte** : paiement 100 % sur place en cash, pour les réservations locales
> tunisiennes dont les voyageurs n'ont pas de carte adaptée au paiement en
> ligne. Dans ce mode, Darna ne touche jamais l'argent du séjour — sa
> commission est **facturée à l'hôte après coup** et réglée via un lien de
> paiement Konnect ponctuel, avec masquage des annonces en cas d'impayé comme
> seul levier de recouvrement (modèle proche de Booking.com, cf. discussion du
> 2026-07-03).
>
> **Prérequis bloquant hors code (Wassim, avant toute activation en
> production réelle) :** structure juridique tunisienne assujettie à la TVA
> (matricule fiscal) + validation de la formulation des CGU hôte et du régime
> de facturation par un avocat d'affaires / expert-comptable tunisien. Le code
> ci-dessous peut être développé et testé en amont (mode démo, comme le reste
> de Darna), mais `HostInvoice`/facturation réelle ne doit pas s'activer en
> production sans ce feu vert. Voir aussi la note KONNECT_API_KEY existante
> pour l'aiguillage démo/réel dans `src/lib/konnect.ts`.
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Compagnon de
> `FEATURES_ROADMAP.md`, `DESIGN_ROADMAP.md`, `QA_ROADMAP.md` — ne jamais
> laisser ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (bloquant pour livrer le mode) `P1` (fort impact) `P2` (nice-to-have).

---

## 0. Ce qui existe déjà (ne pas réinventer)

Darna a **déjà** un mécanisme d'acompte partiel qui garantit la commission
Darna même quand le solde est payé cash à l'arrivée :

- `Booking.depositAmount` = acompte minimum dû en ligne = `max(10 % du total,
  serviceFee)` (`src/lib/config.ts:computeDepositAmount`) — la commission
  Darna y est **toujours** entièrement contenue.
- `Booking.amountPaid` = montant réellement choisi par le voyageur entre
  `depositAmount` et `totalPrice` (`clampPayAmount`, reborné serveur).
- Le solde (`totalPrice - amountPaid`) est déjà payable en cash à l'arrivée —
  UI dans `src/components/booking/DepositPayment.tsx`.

**Ce qui manque et fait l'objet de ce chantier :** un mode où le voyageur
paie **zéro** en ligne (pas même l'acompte), pour les hôtes/voyageurs sans
carte du tout. C'est le seul cas où la commission Darna doit être recouvrée
**après coup, auprès de l'hôte**, puisqu'aucun paiement ne transite par
Konnect à la réservation.

## Question produit ouverte (à trancher avant PSP3)

**Confirmation de la réservation sans paiement en ligne :** aujourd'hui,
`EN_ATTENTE → CONFIRMEE` est toujours déclenché par un paiement réussi. Sans
paiement, il faut un autre déclencheur. Deux options :

1. **Confirmation instantanée** (recommandé pour un MVP) : la réservation est
   directement créée `CONFIRMEE` si les dates sont libres (la garde
   anti-double-booking `SERIALIZABLE` existante suffit) — cohérent avec le
   comportement actuel où tout paiement réussi confirme automatiquement, sans
   étape d'acceptation hôte.
2. **Acceptation manuelle hôte** (plus sûr contre le no-show, mais nouveau
   concept absent du flux actuel — l'hôte devrait accepter/refuser chaque
   demande dans une fenêtre de temps, avec notification + nouvel état
   intermédiaire). Plus de travail, à réserver pour une itération P2 si le
   no-show s'avère un problème réel en usage.

Ce document part sur l'option 1 par défaut ; à confirmer avec Wassim avant
PSP3 si un changement de direction est préféré.

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| PSP1 | Modèle de données : `Property.cashPaymentEnabled`/`cashTermsAcceptedAt`, `Booking.paymentMode`, nouveau modèle `HostInvoice` | P0 | ❌ | Migration Prisma + constantes `src/lib/constants.ts` |
| PSP2 | CGU hôte (page légale) + toggle opt-in sur `PropertyForm.tsx` + consentement horodaté | P0 | ❌ | Bloquant avant d'exposer le mode à qui que ce soit |
| PSP3 | Flux de réservation sans paiement en ligne : confirmation instantanée, `escrow: AUCUN`, génération de la `HostInvoice` | P0 | ❌ | `src/actions/bookings.ts`, UI dédiée (remplace `DepositPayment` pour ce mode) |
| PSP4 | Règlement de la facture hôte : lien de paiement Konnect ponctuel + webhook + page retour, idempotent | P0 | ❌ | Mirror de `src/lib/payments.ts`/`settleKonnectBooking` |
| PSP5 | Dashboard hôte « Factures » : liste, statut, bouton payer | P1 | ❌ | `src/app/dashboard/factures/page.tsx` |
| PSP6 | Levier de recouvrement : détection facture en retard + masquage des annonces de l'hôte tant qu'impayée | P1 | ❌ | Détection paresseuse (pas de cron), cf. `clearExpiredFeatured()` pour le patron |
| PSP7 | Durcissement sécurité/QA : tests idempotence/IDOR/non-bypass + mise à jour `QA_ROADMAP.md` | P0 | ❌ | Nouvelle surface paiement sensible — obligatoire avant merge final |

## Exécution (prioritisée)

**Fondations (bloquant, dans l'ordre) :**
1. ❌ PSP1 — modèle de données.
2. ❌ PSP2 — CGU hôte + opt-in (rien n'est exposé sans ça).
3. ❌ PSP3 — réservation sans paiement en ligne.

**Facturation :**
4. ❌ PSP4 — règlement facture hôte (lien Konnect + webhook).
5. ❌ PSP5 — dashboard hôte Factures.

**Recouvrement & robustesse :**
6. ❌ PSP6 — masquage annonces si impayé.
7. ❌ PSP7 — tests + QA_ROADMAP.md (à faire progressivement à chaque phase, pas uniquement à la fin — chaque prompt ci-dessous l'inclut déjà pour sa portion).

---

## Prompts Claude Code (à enchaîner un par un)

> Copier-coller un prompt par session, dans l'ordre, une fois la phase
> précédente mergée. Chaque prompt est autonome — `CLAUDE.md` est chargé
> automatiquement par la session (règles PR, i18n, tests, « Comment
> tester », etc.), inutile de les répéter. Travailler sur la branche
> `claude/airbnb-cash-payment-model-xco95m` (déjà ouverte) tant que la PR
> n'est pas mergée — ne pas créer de nouvelle branche (règle CLAUDE.md).

### Prompt PSP1 — Modèle de données

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(section "Phases", ligne PSP1) — lis ce fichier en entier d'abord.

Ajoute au schéma Prisma (prisma/schema.prisma) :
- Property.cashPaymentEnabled Boolean @default(false) — opt-in hôte.
- Property.cashTermsAcceptedAt DateTime? — horodatage acceptation CGU hôte
  (posé uniquement quand cashPaymentEnabled passe à true).
- Booking.paymentMode String @default("ESCROW") — nouvelle "enum" à ajouter
  dans src/lib/constants.ts : PAYMENT_MODES = ["ESCROW", "SUR_PLACE"].
- Nouveau modèle HostInvoice : id, bookingId (String @unique, FK Booking
  onDelete Cascade), hostId (FK User onDelete Cascade), amount (Int, TND —
  copié de Booking.serviceFee au moment de la génération), status (String
  @default("EN_ATTENTE") — nouvelle enum HOST_INVOICE_STATUSES =
  ["EN_ATTENTE", "PAYEE", "EN_RETARD"] dans constants.ts), paymentRef
  (String? @unique, référence Konnect), dueAt (DateTime), paidAt (DateTime?),
  createdAt. Index @@index([hostId, status]) et @@index([status, dueAt]).
  Ajoute la back-relation hostInvoices HostInvoice[] sur User.

Génère la migration (npx prisma migrate dev --name add_cash_payment_mode).
Mets à jour prisma/seed.ts si besoin pour rester cohérent (pas obligatoire
de seeder des HostInvoice à ce stade, juste vérifier que le seed tourne
toujours).

Coche PSP1 dans PAIEMENT_SUR_PLACE_ROADMAP.md (✅, fichier/migration
concernés) une fois fait. Commit + push sur la branche
claude/airbnb-cash-payment-model-xco95m. Termine par le bloc "Comment
tester" habituel (CLAUDE.md).
```

### Prompt PSP2 — CGU hôte + opt-in

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP2). PSP1 (modèle de données) doit déjà être mergé — vérifie que
Property.cashPaymentEnabled/cashTermsAcceptedAt et Booking.paymentMode
existent dans prisma/schema.prisma avant de commencer.

1. Page légale CGU hôte (nouvelle route, ex. src/app/cgu-hote/page.tsx) :
   taux de commission applicable (même SERVICE_FEE_RATE que le mode escrow,
   src/lib/config.ts), fait générateur (réservation confirmée), délai de
   paiement de la facture, sanction en cas de non-paiement (masquage des
   annonces — cf. PSP6). Rédige un contenu clair mais signale explicitement
   dans le texte "sous réserve de validation juridique" — ce n'est pas un
   contrat final, juste le texte affiché en attendant la validation avocat/
   expert-comptable mentionnée dans PAIEMENT_SUR_PLACE_ROADMAP.md.
2. Toggle "Accepter les réservations payées sur place (cash)" dans
   PropertyForm.tsx, visible uniquement pour les annonces SEJOUR. Activer le
   toggle exige de cocher une case "J'ai lu et j'accepte les CGU hôte" (lien
   vers /cgu-hote) — pose cashTermsAcceptedAt côté serveur à l'activation,
   jamais confiance au client.
3. i18n : toutes les nouvelles chaînes dans les TROIS dictionnaires
   (src/lib/i18n/{fr,en,ar}.ts).

Coche PSP2 dans PAIEMENT_SUR_PLACE_ROADMAP.md une fois fait. Commit + push
sur claude/airbnb-cash-payment-model-xco95m. Bloc "Comment tester" avec le
parcours hôte (compte démo hôte adéquat depuis prisma/seed.ts) pour activer
le toggle et voir la page CGU.
```

### Prompt PSP3 — Réservation sans paiement en ligne

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP3, + section "Question produit ouverte" en tête de fichier — lis-la,
elle tranche pour la confirmation INSTANTANÉE par défaut, sans étape
d'acceptation hôte ; si tu penses que l'autre option est préférable, pose la
question à Wassim avant d'implémenter plutôt que de trancher seul).
PSP1 + PSP2 doivent être mergés.

Dans src/actions/bookings.ts, createBookingAction doit maintenant : si la
propriété a cashPaymentEnabled=true ET que le voyageur a choisi le mode
SUR_PLACE (nouveau champ de formulaire sur la page réservation), créer la
réservation DIRECTEMENT en status CONFIRMEE (dans la même transaction
SERIALIZABLE anti-double-booking existante — pas besoin d'EN_ATTENTE/
expiresAt puisqu'il n'y a pas de fenêtre de paiement à attendre), avec
paymentMode: "SUR_PLACE", escrow: "AUCUN", amountPaid: 0, depositAmount: 0,
paidAt: now. Génère dans la foulée (même transaction si possible) la
HostInvoice liée : amount = serviceFee de la réservation, status
EN_ATTENTE, dueAt = à définir (propose une valeur raisonnable, ex. checkOut
+ 14 jours, et signale-la clairement comme un paramètre business à confirmer
avec Wassim plutôt que de la considérer figée).

Le mode ESCROW existant (createBookingAction actuel, DepositPayment.tsx,
confirmPaymentAction, startKonnectPaymentAction) ne doit RIEN changer de
comportement — c'est un branchement additif, pas une réécriture.

UI : sur la page annonce/réservation, si cashPaymentEnabled, proposer un
choix explicite entre les deux modes avec un récapitulatif clair ("0 TND en
ligne, X TND dus en cash à l'hôte à l'arrivée, réservation confirmée
immédiatement" vs le récap acompte existant). Nouveau composant plutôt que
de complexifier DepositPayment.tsx.

i18n dans les trois dictionnaires. Ajoute les tests D-style (cf. patron
QA_ROADMAP.md D1-D7) : le mode SUR_PLACE ne doit jamais pouvoir contourner
le calcul serveur du serviceFee, et une propriété avec cashPaymentEnabled=
false doit refuser toute tentative de réservation en mode SUR_PLACE même si
le client envoie ce champ.

Coche PSP3 dans PAIEMENT_SUR_PLACE_ROADMAP.md. Commit + push. Bloc "Comment
tester" avec un compte voyageur + une annonce dont l'hôte a activé le cash
(à créer/identifier depuis le seed si besoin).
```

### Prompt PSP4 — Règlement de la facture hôte

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP4). PSP1-PSP3 mergés, des HostInvoice EN_ATTENTE existent.

Crée src/lib/host-invoicing.ts, en miroir de src/lib/payments.ts
(settleKonnectBooking) : une fonction settleHostInvoice(ref: { invoiceId }
| { paymentRef }) NON "use server" (même raison que settleKonnectBooking :
pas d'endpoint RPC client), idempotente via updateMany({ where: { status:
"EN_ATTENTE" } }), qui revérifie le montant reçu côté Konnect
(getKonnectPayment, réutilise src/lib/konnect.ts tel quel) avant de passer
HostInvoice.status à PAYEE + paidAt.

Nouvelle server action payHostInvoiceAction (src/actions/ — nouveau fichier
ou ajout à bookings.ts, à toi de juger le meilleur emplacement) : vérifie
que l'appelant est bien hostId de la facture (IDOR), initialise un paiement
Konnect via initKonnectPayment (réutilise le client existant tel quel,
amountTND = invoice.amount), avec un webhook signé. Réutilise
signKonnectWebhook/verifyKonnectWebhook de src/lib/konnect.ts tel quel (ces
fonctions signent une string générique, pas spécifiquement un bookingId —
elles conviennent donc aussi pour signer un invoiceId).

Nouvelle route webhook dédiée src/app/api/payments/konnect/host-invoice-
webhook/route.ts, en miroir de src/app/api/payments/konnect/webhook/
route.ts (GET, ?iid=<invoiceId>&sig=..., même garde de signature + rate
limit, appelle settleHostInvoice). Page de retour (filet de sécurité dev
local comme pour les réservations) : réutilise ou étend la page où l'hôte
initie le paiement (?konnect=success).

Coche PSP4. Commit + push. Bloc "Comment tester" avec le compte hôte
concerné et le flux sandbox Konnect (rappelle si KONNECT_API_KEY n'est pas
configuré en local, préciser que le test se limite au mode démo).
```

### Prompt PSP5 — Dashboard hôte Factures

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP5). PSP1-PSP4 mergés.

Nouvelle page src/app/dashboard/factures/page.tsx (lien dans la nav du
dashboard hôte existant) : liste des HostInvoice de l'hôte connecté (le
plus simple d'abord : status, montant, réservation liée, date d'échéance),
avec bouton "Payer" (déclenche payHostInvoiceAction → redirige vers payUrl
Konnect, même patron que KonnectPayButton.tsx pour les réservations).
Distingue visuellement EN_ATTENTE / PAYEE / EN_RETARD.

i18n dans les trois dictionnaires. Notification in-app (réutilise le centre
de notifications existant, src/lib/notification-center.ts) quand une
nouvelle facture est générée pour un hôte.

Coche PSP5. Commit + push. Bloc "Comment tester" avec le compte hôte et une
facture EN_ATTENTE générée via une réservation SUR_PLACE créée au préalable.
```

### Prompt PSP6 — Levier de recouvrement

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP6). PSP1-PSP5 mergés.

Détection PARESSEUSE (pas de cron — cf. le patron clearExpiredFeatured()
dans src/lib/listings.ts ou la dédup des notifications d'expiration
d'annonce) : une HostInvoice EN_ATTENTE dont dueAt est dépassée est
considérée EN_RETARD au moment de la lecture (recalcul à la volée, pas de
job planifié).

Ajoute une fonction hasOverdueHostInvoice(hostId) et branche-la : (a) dans
searchSejours (src/lib/listings.ts) pour exclure des résultats de recherche
les annonces ACTIVE dont l'hôte a une facture en retard — même logique que
le filtre EXPIREE actuel ; (b) dans createBookingAction pour refuser toute
NOUVELLE réservation (escrow ou sur place) sur une propriété dont l'hôte a
une facture en retard, avec message clair. Bannière visible dans le
dashboard hôte ("vos annonces sont masquées tant que la facture X n'est pas
réglée", lien direct vers /dashboard/factures).

i18n dans les trois dictionnaires. Ajoute un test qui prouve qu'une annonce
redevient visible/réservable immédiatement après règlement de la facture
(pas de délai de propagation).

Coche PSP6. Commit + push. Bloc "Comment tester" avec un compte hôte ayant
une facture EN_RETARD (à forcer via seed/DB si besoin pour le test) —
vérifier que ses annonces disparaissent de /sejours puis réapparaissent
après règlement simulé.
```

### Prompt PSP7 — Durcissement sécurité/QA

```
Contexte : chantier "paiement sur place" de PAIEMENT_SUR_PLACE_ROADMAP.md
(ligne PSP7, phase finale). PSP1-PSP6 mergés. Lis aussi QA_ROADMAP.md en
entier avant de commencer — ce chantier introduit une nouvelle surface de
paiement sensible, ce qui est explicitement couvert par la règle du fichier
("A PR that introduces a sensitive surface... without updating this file
should be blocked in review").

Ajoute les tests manquants, en suivant le patron D1-D7 déjà établi dans
QA_ROADMAP.md §3 :
- Idempotence de settleHostInvoice (double règlement, double webhook) —
  même patron que payments.test.ts pour settleKonnectBooking.
- IDOR : un hôte B ne peut pas payer/voir la HostInvoice d'un hôte A
  (payHostInvoiceAction, page /dashboard/factures).
- Non-bypass : un voyageur ne peut pas forcer paymentMode=SUR_PLACE sur une
  propriété dont cashPaymentEnabled=false (déjà mentionné en PSP3, vérifie
  la couverture) ; un hôte ne peut pas contourner cashTermsAcceptedAt en
  activant le toggle sans passer par le flux serveur.
- Recouvrement : la propriété redevient invisible/réservable au bon moment
  (couvre PSP6), sans race condition entre le calcul "en retard" et un
  paiement concurrent.
- Webhook host-invoice : même garde de signature que le webhook réservation
  (réutilise verifyKonnectWebhook), teste le rejet sans signature valide.

Mets à jour QA_ROADMAP.md : ajoute une section (ou des lignes dans les
tableaux existants, à ton jugement selon la structure du fichier) pour
HostInvoice — modèle sur le §6 "Payment test suite" existant pour
settleKonnectBooking.

Mets à jour PAIEMENT_SUR_PLACE_ROADMAP.md : coche PSP7, et si toutes les
phases sont ✅, ajoute une ligne de conclusion comme celle en fin de
FEATURES_ROADMAP.md. Commit + push. Rapport de test complet (CLAUDE.md
règle "Workflow PR" point 3) avant de proposer le merge final de toute la
PR — c'est la dernière phase, donc le rapport doit couvrir l'ensemble du
parcours cash de bout en bout (activation hôte → réservation → facture →
paiement → recouvrement), pas seulement PSP7.
```
