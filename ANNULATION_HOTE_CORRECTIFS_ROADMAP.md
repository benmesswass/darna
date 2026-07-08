# Darna — Annulation hôte : correctifs & durcissement (post-analyse)

> **Référence permanente de ce sous-chantier.** Le chantier initial
> (`ANNULATION_HOTE_ROADMAP.md`, phases AH0→AH7) est **livré et mergé**. Cette
> roadmap regroupe les défauts relevés lors de l'**analyse critique du code du
> 2026-07-07** (relecture experte du workflow d'annulation hôte, benchmark
> Airbnb / Booking.com / Vrbo et marché tunisien). Score de départ du workflow :
> **7/10**. Objectif de ce sous-chantier : lever le **bug économique** de
> remboursement + les **manques UX/robustesse** pour viser ~8.5/10.
>
> **Ne PAS rouvrir `ANNULATION_HOTE_ROADMAP.md`** (marquée terminée) : ce fichier
> est le suivi des correctifs. On code **après** — rien n'est encore commencé.
>
> **Rappel des décisions produit d'origine préservées** (ne pas les casser en
> corrigeant) : remboursement voyageur **intégral** quand l'hôte rompt (mais
> « intégral » = 100 % de l'**encaissé en ligne**, pas plus — c'est tout l'objet
> d'AHC1) ; dissuasif = blocage de visibilité de l'annonce + suspension
> progressive de compte, **pas** de pénalité financière ; libre-service sans
> revue admin ; geste commercial = réduction ponctuelle sur le relogement.
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer le statut à `✅`, noter le(s) fichier(s)/PR, et — si la correction
> touche une surface sensible — mettre à jour `QA_ROADMAP.md`. Ne jamais laisser
> ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (bug/robustesse, à corriger avant toute mise en avant du chantier) · `P1` (manque UX à fort impact) · `P2` (produit / cadrage / nice-to-have).

---

## Phases

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| AHC1 | **Remboursement = `amountPaid`, pas `totalPrice`** (sur-remboursement, cas Rail 2 = remboursement total sur 0 encaissé) | **P0** | ✅ | `src/actions/bookings.ts` (`hostCancelBookingAction` : `refundAmount = amountPaid > 0 ? amountPaid : null`). Tests `tests/host-cancellation-security.test.ts` (ESCROW partiel → refund `amountPaid`, SUR_PLACE `amountPaid` 0 → refund `null`, prépaiement 100 % → refund inchangé). |
| AHC2 | **Annulation hôte atomique** (mutation multi-tables hors transaction → état partiel non récupérable) | **P0** | ✅ | `src/actions/bookings.ts` (cœur booking + property + suspension dans un `$transaction` Serializable ; `applySuspension` accepte un `tx` optionnel — `src/lib/suspension.ts` ; notification/e-mail/audit best-effort hors-tx). Test de rollback sur échec `property.update`. `QA_ROADMAP.md` §3 (D13) mis à jour. |
| AHC3 | **Visibilité hôte du blocage** : encart dashboard + notification (AH2 exigeait l'encart, non livré) | P1 | ✅ | Encart rouge par annonce sur `src/app/dashboard/annonces/page.tsx` (`cancelBlockedUntil > now`, filtre paresseux). Notification hôte `ANNONCE_MASQUEE_ANNULATION` ajoutée à `notifyBookingCancelledByHost` (`src/lib/notification-center.ts` + `notification-text.ts`), href → `/dashboard/annonces`. i18n fr/en/ar. Tests `tests/host-cancel-notification.test.ts`. Vérifié en direct (encart + cloche). |
| AHC4 | **E-mail d'annulation au voyageur** (in-app seul aujourd'hui ; cible diaspora) | P1 | ✅ | `sendBookingCancelledByHostEmail` (`src/lib/notifications.ts`, patron best-effort de `sendBookingConfirmationEmail`) appelé hors-tx dans `hostCancelBookingAction` — montant remboursé (lu en base, §AHC1 : nul en SUR_PLACE) + lien `/relogement/[bookingId]`. Templates e-mail fr/en/ar. Tests `tests/notifications.test.ts` (montant, cas SUR_PLACE, introuvable, non-bloquant). |
| AHC5 | **Réduction affichée = réduction appliquée** (plafond `subtotal` → bandeau parfois trompeur) | P1 | ❌ | `src/actions/bookings.ts:232`, `quoteBookingAction` |
| AHC6 | **Recalibrer le barème + amortir le relogement last-minute** (≥30j → 3j négligeable ; mêmes dates rarement libres) | P2 | ❌ | `src/lib/config.ts:60`, `src/lib/listings.ts:631` |
| AHC7 | **Avis/signal automatique « annulé par l'hôte »** (dissuasif réputationnel, emprunt Airbnb, aligné north-star) | P2 | ❌ | à concevoir |
| AHC8 | **Remboursement réel (Konnect)** + `revalidatePath("/sejours")` | P2 | ❌ | `src/lib/payments.ts`, `hostCancelBookingAction` |

**Ordre d'exécution recommandé :** AHC1 → AHC2 (P0, bugs courts et nets, livrables ensemble) → AHC3 → AHC4 → AHC5 (P1, UX) → AHC6 → AHC7 → AHC8 (P2, produit / cadrage).

---

## Détail par tâche

### AHC1 — [P0] Remboursement : `amountPaid`, pas `totalPrice`

**Constat.** `hostCancelBookingAction` fige `refundAmount: booking.totalPrice`
(`src/actions/bookings.ts:921`). Or le modèle est un **acompte** : le voyageur
ne règle en ligne que `amountPaid` (clampé `[acompte, total]`,
`bookings.ts:478`), le solde `totalPrice − amountPaid` étant dû **en cash à
l'arrivée** (`schema.prisma:302`). Rembourser `totalPrice` rend donc de l'argent
**jamais versé**. Cas flagrant : une résa **Rail 2 `SUR_PLACE`** confirmée a
`amountPaid = 0` (`bookings.ts:1013`) → remboursement du **prix total sur zéro
encaissé**. Incohérent avec l'annulation **voyageur**, qui part correctement de
`amountPaid` (`computeBookingRefund`, `bookings.ts:830`).

**Correctif.** Ajouter `amountPaid` au `select`, puis
`refundAmount: booking.amountPaid > 0 ? booking.amountPaid : null`. Le principe
« intégral » est conservé (100 % de l'**encaissé**, sans amputation par
`cancelPolicy`) — c'est le sens réel de la décision produit n°1.

**Tests.** ESCROW acompte partiel → refund = `amountPaid` ; `SUR_PLACE`
(`amountPaid` 0) → refund `null`/0 ; prépaiement 100 % → refund = `totalPrice`
(comportement inchangé). Étendre `tests/host-cancellation-security.test.ts`.

### AHC2 — [P0] Annulation hôte atomique

**Constat.** `updateMany` (booking) → `property.update` (blocage) →
`applySuspension` → `logAudit` → `notify` s'enchaînent en `await` séquentiels
**hors transaction** (`bookings.ts:913-945`). Un échec après le flip en
`ANNULEE` laisse un **état partiel non récupérable** : la garde d'idempotence
(`status !== "CONFIRMEE"`) fait qu'un rejeu renvoie « annulation impossible » et
n'applique jamais le blocage / la suspension manquants. `createBookingAction`
utilise pourtant un `$transaction` Serializable.

**Correctif.** Envelopper le **cœur critique** (booking + property + pose de
suspension) dans un même `$transaction`. `applySuspension` fait aujourd'hui son
propre find/update/log → soit lui passer un `tx` optionnel, soit isoler la
partie critique et garder **notification + e-mail hors-tx** (effets best-effort,
non critiques). Documenter en commentaire ce qui est dans / hors transaction.

**Tests.** Simuler un échec de `property.update` → la résa ne doit **pas** rester
`ANNULEE` sans blocage (rollback vérifié).

### AHC3 — [P1] Visibilité hôte du blocage d'annonce

**Constat.** `cancelBlockedUntil` n'est surfacé dans **aucun** fichier
`src/app/**` ni `src/components/**` (grep) et l'hôte **n'est pas notifié**. AH2
exigeait pourtant « un encart dans le dashboard hôte… l'hôte ne doit pas
découvrir par hasard que son annonce a disparu ». Aujourd'hui l'annonce sort des
résultats sans **aucun** signal côté hôte.

**Correctif.** (a) Bandeau sur `dashboard/annonces` (et/ou fiche annonce hôte) :
« Annonce temporairement masquée suite à une annulation — réapparaît le JJ/MM »
quand `cancelBlockedUntil > now`. (b) Notification hôte à l'annulation, pointant
vers l'annonce concernée. i18n **fr/en/ar** pour tous les libellés.

**Tests.** Après annulation, l'hôte voit l'encart avec la bonne date de fin ;
l'encart disparaît une fois `cancelBlockedUntil` dépassé (filtre paresseux, pas
de cron).

### AHC4 — [P1] E-mail d'annulation au voyageur

**Constat.** L'annulation ne poste qu'une **notification in-app**
(`bookings.ts:945`). Pour la cible **diaspora France** (réservation des mois à
l'avance, app pas consultée quotidiennement), la perte de logement doit partir
par **e-mail**.

**Correctif.** E-mail non-bloquant (patron `sendBookingConfirmationEmail`) au
voyageur : annulation par l'hôte, montant remboursé, lien vers
`/relogement/[bookingId]`. Garder le pattern « best-effort, ne bloque jamais
l'action ».

**Tests.** Annulation → e-mail envoyé/loggé (mock mail dev), lien de relogement
correct.

### AHC5 — [P1] Réduction affichée = réduction appliquée

**Constat.** La réduction est plafonnée par un floor à `subtotal`
(`bookings.ts:232` : `Math.max(subtotal, fullTotal − discount)`) — elle ne peut
amputer que la commission (8 %). Ex. `subtotal 500 / serviceFee 40` :
`computeRebookingDiscount` renvoie 50 mais le total ne baisse que de **40**. Le
bandeau annonce « -50 TND », le voyageur n'économise que 40.

**Correctif.** Exposer/afficher la réduction **réellement appliquée**
(`fullTotal − total`) plutôt que le brut `computeRebookingDiscount`, dans le
champ `discount` de `quoteBookingAction` (`bookings.ts:410-418`) **et** le
bandeau de la page réservation. Le fond (Darna absorbe, payout du nouvel hôte
protégé par le floor) est correct — seul l'affichage est à aligner.

**Tests.** Cas clampé : le montant du bandeau = différence réelle sur le total.

### AHC6 — [P2] Recalibrer le barème + amortir le relogement last-minute

**Constat.** `≥30j → 3j` de blocage (`config.ts:61`) est négligeable : le barème
ne mord vraiment qu'en dessous de 7 jours. Et les suggestions imposent les
**mêmes dates réellement libres** (`listings.ts:631`) → souvent **vides** en
annulation last-minute, c'est-à-dire quand le relogement est le plus nécessaire.

**Correctif (décision produit à valider avec Wassim).** Revoir le barème (ex.
`≥30j → 7j` ?) et/ou assouplir le relogement : fenêtre de dates ±1–2 j, fallback
« nous vous recontactons », ou élargissement `nearbyCities` à 4–5. Paramètres
business → **ne pas trancher seul**.

**Tests.** Ajuster les tests de barème si les seuils changent.

### AHC7 — [P2] Signal automatique « annulé par l'hôte »

**Constat (benchmark).** Airbnb pose un **avis automatique** sur l'hôte qui
annule — dissuasif réputationnel gratuit, aligné sur la north-star « annonces
vérifiées ». Darna ne trace l'événement qu'en **audit interne** (invisible du
public).

**Correctif (forme à décider).** Signal discret sur la fiche annonce (« X
annulation(s) hôte » ou avis système) — sans sur-punir un cas isolé. Réfléchir à
un seuil / une fenêtre glissante plutôt qu'un affichage brut dès la 1re.

**Tests.** Selon la forme retenue.

### AHC8 — [P2] Remboursement réel (Konnect) + revalidation search

**Constat.** `src/lib/payments.ts` n'a **aucune** fonction de remboursement
(seulement `settleKonnectBooking`, côté capture) : avec Konnect actif, l'argent
encaissé n'est jamais reversé programmatiquement — « mock assumé » cohérent avec
le stade du projet, mais à **cadrer avant toute prod payante** (la promesse
« remboursement intégral » affichée au voyageur n'a sinon pas de contrepartie
réelle). Mineur : `hostCancelBookingAction` ne `revalidatePath("/sejours")` pas
(le filtre paresseux corrige au prochain rendu, mais une page search cachée peut
brièvement montrer l'annonce bloquée).

**Correctif.** (a) Cadrer/implémenter un remboursement Konnect **ou** documenter
explicitement le mock (bannière dev, note `CLAUDE.md`) jusqu'à la prod payante.
(b) Ajouter `revalidatePath("/sejours")` (ou un tag de cache) dans
`hostCancelBookingAction`.

**Tests.** (a) selon décision ; (b) l'annonce disparaît de `/sejours` sans
attendre un autre rendu.

---

## Synthèse de l'analyse (rappel du score)

| Axe | Note | Traité par |
|---|---|---|
| Sécurité / intégrité | 8/10 | AHC2 (atomicité) |
| Correction métier | 6/10 | AHC1 (sur-remboursement) |
| Complétude produit / UX | 6.5/10 | AHC3, AHC4, AHC5 |
| Qualité code / archi | 9/10 | — (déjà excellent) |
| Positionnement concurrentiel | 8/10 | AHC7 |
| **Global** | **7/10 → ~8.5/10 visé** | AHC1-AHC5 = l'essentiel du gain |

---

> **⏳ CONTINUATION EN ATTENTE (à l'achèvement de AHC1→AHC8) : `FEATURES_ROADMAP.md` /
> `QA_ROADMAP.md`** — une fois tous les correctifs `✅`, passer ce pointeur à
> **➡️ ACTIF** ; « suivant » / « enchaîne » reprendra alors la priorité la plus
> haute (`P0`/`P1`) des roadmaps produit/QA générales. Cf. règle « Chaînage
> automatique des roadmaps » de `CLAUDE.md`.
