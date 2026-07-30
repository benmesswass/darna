# Darna — Runbook opérationnel « jour 1 »

> Référence de fond (ROADMAP.md §P5.1) — aucune tâche ici. Public : Wassim,
> opérateur unique du produit. Objectif : que faire dans les situations qui
> arriveront tôt ou tard, sans avoir à relire le code sous pression. Une
> réponse « je regarde le matin » est acceptable pour beaucoup de ces
> situations — l'important est qu'elle soit écrite ici, pas improvisée.
>
> Pour le déploiement, le rollback Vercel et la restauration Neon :
> `docs/INFRASTRUCTURE.md` (§5 rollback, §6 restauration) reste la référence
> — ce fichier n'y touche pas, il couvre les situations métier du quotidien.

## 1. Un paiement échoue

**Rappel du modèle** (`CLAUDE.md` §Paiement Konnect) : Konnect ne règle que
les frais de service Darna (~10 % du loyer), jamais le loyer lui-même
(réglé en espèces à l'arrivée). Donc un paiement Konnect qui échoue ne
bloque **jamais** l'hébergement du voyageur — seuls les frais Darna ne sont
pas perçus pour cette réservation.

**Ce qui se passe automatiquement, sans intervention** : une réservation
reste `EN_ATTENTE` jusqu'au paiement des frais. Si le paiement Konnect
échoue, est abandonné, ou que le voyageur ferme l'onglet — la réservation
expire **d'elle-même 15 minutes après sa création** (lazy-expiry, aucun
état à nettoyer manuellement, aucune facture fantôme). Aucune action
requise dans la majorité des cas.

**Quand s'inquiéter** : plusieurs échecs à la suite, ou une réservation
confirmée qui reste bloquée en attente malgré un paiement visiblement passé
côté Konnect. Deux causes possibles :
- **Clé API expirée/révoquée** (`KONNECT_API_KEY`) — vérifier sur le
  dashboard Konnect que la clé sandbox/prod est toujours active.
- **Le webhook n'est jamais arrivé** (réseau, Konnect down un instant) — le
  job `konnect-reconciliation` (tourne toutes les 15 min via `/api/jobs/
  tick`) est le filet de sécurité *fait pour ce cas exact* : il détecte les
  paiements Konnect aboutis dont l'état local n'a jamais été mis à jour, et
  les rattrape automatiquement (idempotent, `settleKonnectBooking`). **Si
  ce job tourne, un paiement réellement passé chez Konnect ne reste jamais
  bloqué plus de 15 minutes** — cf. §3 si le cron lui-même est en cause.

**Vérifier manuellement un paiement suspect** : `getKonnectPayment()`
(`src/lib/konnect.ts`) contre le `paymentRef` stocké sur `Booking.paymentRef`
donne l'état réel côté Konnect, à comparer à `Booking.status` en base.

## 2. Une facture hôte reste impayée

**Ce qui se passe automatiquement** : dès qu'une `HostInvoice` dépasse son
échéance (`dueAt`), l'hôte concerné est immédiatement affecté (dérivé à
chaque lecture, `hasOverdueHostInvoice()` — pas de job, pas de champ à
synchroniser) :
- Ses annonces disparaissent de la recherche (`activeListingWhere()`).
- Aucune nouvelle réservation n'est acceptable sur ses annonces, même par
  lien direct (`hasOverdueHostInvoice()` dans `createBookingAction`).
- Un bandeau d'avertissement s'affiche dans son tableau de bord.
- Le job `host-invoice-reminder` (toutes les 15 min) lui envoie un rappel
  (notification + e-mail), déduplication par index unique — pas de spam.

**Dès que la facture est réglée, tout redevient normal instantanément** —
aucune action de votre part à ce stade.

**Si l'hôte ne paie toujours pas malgré la relance** : `/dashboard/admin/
factures` — bouton de relance manuelle, puis bouton de **suspension
manuelle** (`suspendHostForInvoiceAction`) si nécessaire. Réutilise le
mécanisme de suspension progressive standard (3 j → 14 j → indéfinie).
Décision produit du 2026-07-07 : pas de palier spécifique aux impayés,
même échelle que les autres motifs de suspension.

## 3. Le cron ne tourne plus

**Symptômes** : les rappels de facture/relance n'arrivent plus, la
réconciliation Konnect ne rattrape plus les paiements manqués (cf. §1), la
purge de rétention RGPD ne s'exécute plus (`/confidentialite` fait alors
une promesse non tenue — cf. §L7.2).

**Vérifier** : dashboard Vercel → Cron Jobs → dernière exécution de
`/api/jobs/tick` et son statut. `vercel.json` le programme toutes les
15 min.

**Déclencher manuellement** (utile pour tester ou rattraper un trou) :
```
curl -H "Authorization: Bearer $CRON_SECRET" https://darna.tn/api/jobs/tick
```
`CRON_SECRET` doit être identique à la valeur posée dans les variables
d'environnement Vercel du projet. La réponse liste chaque job avec son
statut individuel (`{ name, ok, detail | error }`) — un job qui échoue
n'empêche jamais les autres de tourner (isolation par job,
`runJobList()`).

**Si un job précis échoue systématiquement** : l'erreur est capturée par
`captureError()` (log structuré + Sentry si configuré) sans jamais casser
les autres jobs — regarder les logs Vercel Functions pour `job.tick.failure`
avec le nom du job concerné.

## 4. Une alerte tombe la nuit

**État actuel, à lire honnêtement** : il n'existe aujourd'hui **aucune
notification push** (SMS/Slack/PagerDuty) qui vous réveillerait. Les
erreurs sont journalisées en JSON structuré (`console.error`, visibles dans
les logs Vercel Functions) et, si `OBSERVABILITY_WEBHOOK_URL` est défini,
relayées vers un webhook — mais ce canal n'est pas branché à ce jour (⛔
W8, cf. `ROADMAP.md` P5.4). **Concrètement : vous ne serez pas réveillé
automatiquement pour l'instant.** « Je regarde le matin » n'est pas
seulement acceptable, c'est actuellement le mode de fonctionnement réel —
tant que W8 n'est pas tranché, ne pas se fier à une alerte qui n'existe
pas.

**Le matin (ou dès que vous voyez un problème)** : dashboard Vercel →
Functions → Logs, filtrer sur `"level":"error"`. Sentry si `SENTRY_DSN`
est configuré (§L4.2). `/api/health` pour un check rapide de disponibilité.

## 5. Le site est down

Cf. `docs/INFRASTRUCTURE.md` §5 (rollback Vercel — chaque déploiement est
immuable et instantanément réactivable) et §6 (restauration Neon, PITR).
Ne pas dupliquer la procédure ici — ce fichier renvoie, il ne réexplique
pas.

**Premier réflexe avant de conclure à une panne applicative** : vérifier
que ce n'est pas Neon (cold start possible) ou Vercel lui-même (statut sur
leurs pages de statut respectives) avant de rollback un déploiement qui
n'y est pour rien.

## 6. Rollback

Cf. `docs/INFRASTRUCTURE.md` §5. Même remarque : référence unique, pas de
duplication.
