# Darna — Roadmap LANCEMENT : de la démo locale à la première production

> **Chantier actif prioritaire** (décision Wassim du 2026-07-27, sur la base
> d'`AUDIT_V2.md`). Objectif : une première version de démonstration **en
> production réelle** — solide, crédible, démontrable — en maximisant l'impact
> à temps de dev limité.
>
> **Ce fichier est autoporteur.** Il est écrit pour qu'une session Claude
> future (y compris avec un modèle moins capable) puisse exécuter chaque tâche
> **sans relire l'audit ni ré-arbitrer les choix** : chaque tâche liste le
> pourquoi, les décisions DÉJÀ TRANCHÉES (ne pas les rouvrir), les fichiers
> concernés, les étapes, ce qu'il ne faut PAS faire, et les critères
> d'acceptation. En cas de doute réel non couvert ici : s'arrêter et demander
> à Wassim (règle « coup d'arrêt » de CLAUDE.md), ne jamais improviser sur le
> paiement, la sécurité ou le schéma.

## Comment utiliser ce fichier

- Une tâche = une session = une PR (mêmes conventions que les autres
  roadmaps : branche feature, jamais de push sur `main`, rapport de test +
  captures Playwright pour toute tâche UI, bloc « Comment tester », i18n dans
  les TROIS dictionnaires, mise à jour de `QA_ROADMAP.md` si une surface
  sensible change, et cocher ✅ ici + noter la PR **dans la même PR**).
- **Ordre d'exécution = ordre des sections L1 → L10.** Les tâches d'une même
  section s'enchaînent une par une. « suivant » / « enchaîne » sur ce chantier
  = première tâche non cochée dans l'ordre.
- Les items marqués **🧑 WASSIM** demandent une action humaine (création de
  compte, paiement, terrain, juridique) : Claude prépare tout ce qui est
  préparable (docs, scripts, code), signale précisément quoi faire, et passe à
  la tâche codable suivante sans bloquer.
- Priorités : `P0` (conditionne la mise en ligne) · `P1` (avant ouverture à de
  vrais utilisateurs) · `P2` (avant toute campagne d'acquisition).

### 🔒 Règle anti-oubli — balayage d'impact obligatoire (demande Wassim, 2026-07-27)

Toute tâche de ce chantier qui modifie une **règle transverse** (modèle de
paiement, montant, taux, promesse produit, wording d'une garantie) n'est
JAMAIS cochée ✅ sur la seule livraison de son périmètre nominal. Elle doit,
**dans la même PR** :
1. Dérouler la **checklist d'impact** de sa section (pour le modèle de
   paiement : §L5.8) et corriger CHAQUE surface listée — code, UI, i18n ×3,
   e-mails, seed, tests, e2e, k6.
2. Mettre à jour les **documents qui décrivent l'ancienne règle** :
   `CLAUDE.md`, `README.md`, `AUDIT_V2.md`, les roadmaps concernées
   (`PAIEMENT_SUR_PLACE_ROADMAP.md`, `CROISSANCE_ROADMAP.md`…),
   `.agents/product-marketing.md`.
3. Exécuter les **greps de clôture** de la checklist : un résidu non justifié
   (hors commentaire explicitement marqué « V2 ») = tâche NON terminée.
Un trou découvert APRÈS coup s'ajoute immédiatement à la checklist de la
section concernée (comme L5.8 l'a été), jamais corrigé en silence sans trace.

## 🧊 GEL DES FEATURES GROWTH (décision actée, 2026-07-27)

**Tant que ce chantier n'est pas clos**, aucune nouvelle tâche des vagues 4-5
de `PRIORITES_ROADMAP.md` (PM2, PM3, CR5, G7, CR6, fin de CR2) ni aucune
feature produit hors de ce fichier ne doit être lancée — y compris en mode
orchestration autonome. Raison (AUDIT_V2 §R2) : chaque feature growth
construite sans utilisateur réel est invérifiable et ajoute de la surface à
maintenir ; l'effort bascule sur la mise en ligne. Exceptions : G6 (relance
d'abandon) est intégrée ici (L3.3) car son blocage architectural est levé par
ce chantier ; un bugfix sur l'existant reste toujours autorisé.

## 💰 Modèle de paiement V1 — décisions actées (Wassim, 2026-07-27)

Ces décisions sont **tranchées** — aucune session ne les rouvre (spec complète
en §L5) :

1. **Commission-only** : Darna n'encaisse en ligne QUE ses propres frais de
   service — **10 % du loyer, ajoutés au-dessus du prix hôte** (l'hôte touche
   100 % de son prix, en cash à l'arrivée). Aucun fonds de tiers ne transite
   jamais par Darna → hors du champ des services de paiement (à confirmer W4).
   Exemple : séjour 1 000 TND → voyageur paie 100 TND en ligne (confirmation
   instantanée) + 1 000 TND cash à l'hôte ; Darna garde 100 TND.
2. **Remboursement des frais** : FLEXIBLE = remboursables jusqu'à J-2 ·
   MODÉRÉE = J-7 · STRICTE = non remboursables · **toujours 100 %** si
   annulation hôte ou non-conformité signalée < 24 h après le check-in.
3. **Garantie no-show hôte** : indemnité = **100 % des frais encaissés**,
   plafonnée, versée sur le revenu propre de Darna (jamais l'argent du
   voyageur).
4. **Paiement 100 % en ligne (séquestre réel) = V2**, conditionné à l'avis
   juridique W4 — les états `escrow` du schéma sont conservés inertes,
   réactivables sans migration.
5. **Voyageur 100 % cash (zéro paiement en ligne)** : c'est le Rail 2
   existant (`SUR_PLACE`), inchangé — possible UNIQUEMENT si l'hôte l'a activé
   (`cashPaymentEnabled`), avec acceptation manuelle de l'hôte + KYC CIN
   vérifié, commission facturée à l'hôte a posteriori (`HostInvoice`). Pas
   d'indemnité no-show sur ce rail (rien d'encaissé pour la financer ;
   l'hôte l'a choisi en connaissance).

## ⛔ Bloqué sur Wassim (à débloquer en parallèle des tâches codables)

| # | Action | Nécessaire pour | Détail |
|---|---|---|---|
| W1 | Créer les comptes : **Vercel** (app), **Neon** (PostgreSQL), **Upstash** (Redis), **Cloudflare R2** (S3), **Resend** (e-mail) — tous en free tier | L6 | Choix déjà tranchés, cf. L6.1. Renseigner les secrets dans Vercel (staging + prod), jamais dans le dépôt |
| W2 | Domaine : viser `darna.tn` (registrar tunisien, délais) avec fallback `darna-immo.com`/`.co` si blocage | L6 | `SITE_URL` doit être définitif avant l'ouverture publique (SEO, HSTS, webhook Konnect) |
| W3 | Décision : **rendre le dépôt public** (minutes Actions illimitées gratuites) ou rester privé | L2 | Recommandation AUDIT_V2 : public (aucun secret commité, `CREDENTIALS.md` gitignoré, atout crédibilité). L2 fonctionne dans les deux cas |
| W4 | **Consultation avocat d'affaires tunisien** — périmètre mis à jour (modèle commission-only) : (a) confirmer que n'encaisser QUE ses propres frais + facturer la commission Rail 2 à l'hôte n'est PAS un service de paiement (loi 2016-48/BCT), (b) TVA sur les frais de service, (c) CGU : clauses remboursement des frais / garantie non-conformité / indemnité no-show / litige loyer bilatéral, (d) statut fiscal de la location saisonnière, (e) cadrage du futur séquestre V2 (agrément ou partenaire) | L5, V2 | La dépense au meilleur ROI du projet (AUDIT_V2 §R3). Quelques centaines de TND |
| W5 | Clés **Turnstile réelles** (dashboard Cloudflare, widget Managed, gratuit) | L6 | Les clés de test actuelles valident tout et ne protègent RIEN (cf. TODO-PRODUCTION) |
| W6 | Créer le projet **Google Cloud OAuth** (écran de consentement + client ID/secret) | L8 | Gratuit, 15 min. Le code L8 se développe et se teste avant avec des clés de dev |
| W7 | **Terrain** : liste de 30 hôtes cibles (Hammamet–Nabeul–Sousse), premières vraies annonces, premier candidat Wakil | L10 | Le seul travail que le code ne peut pas faire — c'est l'actif défendable |
| W8 | Créer le projet **Sentry** (free tier) et fournir le DSN | L4 | Le code L4 se prépare avant, s'active dès le DSN posé |

---

## L1 — Vérité documentaire (P0 — quick win, à faire en premier)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L1.1 | Réécrire `README.md` pour refléter le produit réel | P0 | ✅ PR d'ouverture du chantier |
| L1.2 | Bandeau de péremption sur `AUDIT_V1.md` (✅ PR d'ouverture) + archivage des roadmaps closes dans `docs/archive/` (✅) | P0 | ✅ PR #200 |

### L1.1 — README

**Pourquoi** : le README actuel annonce « Prisma + SQLite », « interface en
français uniquement », « photos placeholders », « aucune clé API » — tout est
périmé et **sous-vend** le produit. C'est le document le plus lu par un tiers
(investisseur, candidat, partenaire).

**Étapes** : réécrire `README.md` : stack réelle (Next.js 15, TypeScript
strict, Tailwind 4, Prisma/**PostgreSQL**, NextAuth, zod, Redis optionnel,
Konnect optionnel, S3 optionnel, trilingue FR/EN/AR RTL) ; fonctionnalités
réelles (messagerie, annulations, paiement sur place, monétisation,
crédits, instrumentation, dashboards admin) ; limites honnêtes (payout
manuel — cf. L5, EUR statique, KYC sans provider doc) ; lancement local
inchangé ; lien démo en ligne dès que L6 est fait. Garder le tableau
positionnement (il est bon). **Ne PAS** : inventer des features, promettre un
séquestre automatique.

**Acceptation** : plus aucune mention de SQLite / « français uniquement » /
« aucune clé API » ; un lecteur externe comprend l'état réel en 3 minutes.

### L1.2 — Archivage

**Étapes** : (a) bandeau en tête d'`AUDIT_V1.md` : « ⚠️ État au 2026-06-24,
largement dépassé — voir `AUDIT_V2.md` » ; (b) créer `docs/archive/`, y
déplacer les roadmaps 100 % closes (`ANNULATION_HOTE_ROADMAP.md`,
`ANNULATION_HOTE_CORRECTIFS_ROADMAP.md`, `FEATURES_ROADMAP.md`,
`DESIGN_ROADMAP.md`, `INSTRUMENTATION_ROADMAP.md`) avec un en-tête « clos
le … » ; (c) corriger toute référence cassée (grep les noms de fichiers dans
`*.md` et `CLAUDE.md`). **Ne PAS** archiver `QA_ROADMAP.md`,
`TODO-BETA/PRODUCTION` (vivants), ni les roadmaps avec items ouverts
(GROWTH, CROISSANCE, PAIEMENT_SUR_PLACE, MONETISATION_IMMO,
TEST_AUTOMATION). Mettre à jour les chemins dans `CLAUDE.md` (§Roadmaps).

---

## L2 — CI de nouveau automatique (P0)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L2.1 | Pyramide de jobs CI (rapide sur push, lourd à la demande, sécurité en nightly) | P0 | ✅ PR #201 |

**Pourquoi** : quota Actions épuisé le 22/07 → `ci.yml` en dispatch-only →
le filet de tests ne protège plus (rituel manuel de ~20 min/merge, qui sera
sauté). Même après le reset du 31/07, l'ancien découpage re-brûlera le quota
en 3 semaines. Le mode orchestration autonome N'EST PAS sain sans CI.

**Décisions tranchées** :
- **Niveau 1 (chaque push/PR)** : un job `fast` = `npm run lint` +
  `npx tsc --noEmit` + `vitest run` (sans coverage) — cible < 5 min avec
  cache npm (`actions/setup-node` + `cache: npm`).
- **Niveau 2 (avant merge)** : job `full` = coverage + build + audit + e2e +
  api — déclenché par `workflow_dispatch` OU par le label de PR
  `ready-to-merge` (`pull_request: types: [labeled]` + condition sur le nom
  du label). La règle de merge devient : merge uniquement si `fast` ET `full`
  verts sur le commit de tête.
- **Niveau 3 (nightly, `schedule: cron "0 3 * * *"`)** : semgrep + ZAP
  baseline + k6 smoke — sur `main` uniquement.
- `paths-ignore: ["**/*.md", "docs/**"]` sur les niveaux 1-2 (une grosse part
  des PR du projet sont des PR de roadmap : zéro CI consommée pour ça).
- Budget : ~4 min × pushes + full à la demande ≈ tenable sous 2000 min/mois
  même en privé. Si W3 = dépôt public : minutes illimitées, garder quand même
  la pyramide (vitesse de feedback).

**Fichiers** : `.github/workflows/ci.yml` (refonte), `zap-baseline.yml` et
`perf.yml` (fusion dans le nightly ou déclencheur schedule), `CLAUDE.md`
(remplacer la section « ⏳ Exception temporaire CI » par le nouveau
fonctionnement — elle est caduque dès L2.1 mergée).

**Ne PAS faire** : supprimer des tests pour aller plus vite ; réactiver
build+e2e sur chaque push ; laisser la section CI temporaire dans CLAUDE.md.

**Acceptation** : un push de branche déclenche `fast` automatiquement ; un
label `ready-to-merge` déclenche `full` ; le nightly existe ; CLAUDE.md à jour.

---

## L3 — Socle scheduler + premiers jobs (P0 — prérequis de L4, L5, L7)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L3.1 | Socle `/api/jobs/tick` (Vercel Cron, secret, idempotence, audit) | P0 | ✅ PR #202 |
| L3.2 | Job : réconciliation Konnect↔local | P0 | ✅ PR #203 |
| L3.3 | Job : relance de réservation abandonnée (G6, GROWTH_ROADMAP) | P1 | ✅ PR #204 |
| L3.4 | Job : rappels automatiques de factures hôte (PSP5) | P2 | ✅ PR #205 |

### L3.1 — Socle

**Pourquoi / décision d'architecture actée** : le principe « zéro cron » du
projet est AMENDÉ (décision 2026-07-27) en : **« zéro cron pour l'ÉTAT
(lazy-expiry conservée partout), un scheduler pour les ACTIONS SORTANTES »**
(envoyer un e-mail/notification, comparer avec un système externe, purger des
lignes). La lazy-expiry existante (`expiresAt`, `featuredUntil`, `promoUntil`,
crédits FIFO, retard de facture dérivé) ne change PAS et ne doit PAS être
réécrite en jobs. Documenter cet amendement dans `CLAUDE.md` (§Stack et
contraintes) dans la même PR — sinon une session future « corrigera » le
scheduler en croyant appliquer la convention.

**Décisions tranchées** :
- Véhicule : **Vercel Cron** (gratuit, inclus hobby) → `vercel.json` avec
  `{"crons": [{"path": "/api/jobs/tick", "schedule": "*/15 * * * *"}]}`.
- Route `src/app/api/jobs/tick/route.ts` (GET) protégée par
  `CRON_SECRET` (env, validé par `src/lib/env.ts` fail-fast si un mode réel
  est actif ; Vercel envoie `Authorization: Bearer ${CRON_SECRET}`
  automatiquement quand la variable existe). 401 sinon. En dev/local : appel
  manuel `curl` (documenter dans `.env.example`).
- Chaque job = fonction pure dans `src/lib/jobs/<nom>.ts`, **idempotente**
  (rejouable sans double effet — même discipline que les settlements),
  résultat loggé via `logStructured` + `AuditLog` (action `JOB_TICK`), erreurs
  attrapées job par job (un job qui échoue n'empêche pas les autres).
- Pas de verrou distribué au départ (le cron Vercel ne se chevauche pas à
  15 min pour des jobs de quelques secondes) — noter dans le code que si un
  job devient long, ajouter un verrou Redis `SET NX PX`.

**Tests** : unitaires par job (idempotence = appeler deux fois, vérifier un
seul effet) + test du 401 sans secret.

### L3.2 — Réconciliation Konnect

**Pourquoi** : TODO-PRODUCTION « Reconciliation job: detect Konnect↔local
state drift; alert; never silent loss » — c'est la garantie « zéro perte de
fonds » de la promesse séquestre.

**Étapes** : pour chaque `Booking`/`HostInvoice`/`FeaturedOrder`/
`Subscription`/`VerificationCreditOrder` avec `paymentRef` non null et statut
local encore en attente depuis > 30 min : appeler `getKonnectPayment()` ; si
Konnect dit « payé » mais local dit « en attente » → appeler le settlement
idempotent existant correspondant (`settleKonnectBooking`,
`settleFeaturedOrder`, etc.) et logger `warn` (drift rattrapé) ; si
impossible à régler → alerte via `notifyObservability`
(`src/lib/observability.ts`). Ne JAMAIS marquer payé sans revérification du
montant (les settlements existants le font déjà — les réutiliser, ne pas
réécrire).

**Ne PAS faire** : de nouveau code de règlement ; toucher aux webhooks.

### L3.3 — Relance d'abandon (G6)

**Pourquoi** : P1 de `GROWTH_ROADMAP.md`, gelé sur l'arbitrage « zéro cron »
— levé par L3.1. Levier de conversion le plus documenté du secteur.

**Étapes** : job qui sélectionne les `Booking` `status="EN_ATTENTE"` avec
`expiresAt` dépassé depuis < 24 h, sans relance déjà envoyée → une
`Notification` in-app (nouveau type `RESERVATION_ABANDONNEE`, index unique
partiel comme les types existants, cf. commentaire du modèle `Notification`)
+ e-mail via `src/lib/mailer.ts` avec lien direct vers l'annonce. Marquage
anti-double-envoi : l'existence de la Notification du type pour ce
`href`/booking SUFFIT (pas de nouveau champ sur Booking). i18n ×3. Émettre le
`ProductEvent` `BOOKING_ABANDON_REMINDED` (discipline IN4).
KPI (mesure ultérieure) : reprise après relance via `BOOKING_STARTED`/
`BOOKING_CREATED` existants. Cocher G6 dans `GROWTH_ROADMAP.md` (même PR).

### L3.4 — Rappels factures (PSP5)

Job : `HostInvoice` `EN_ATTENTE` avec `dueAt` proche (< 3 j) ou dépassé →
notifications `FACTURE_BIENTOT_DUE`/`FACTURE_EN_RETARD` (types et index
uniques partiels EXISTENT déjà, migration `20260707170000…` — le job ne fait
que déclencher ce que la lecture paresseuse déclenchait au petit bonheur).
Cocher la partie « relances automatiques » de PSP5 dans
`PAIEMENT_SUR_PLACE_ROADMAP.md`.

---

## L4 — Monitoring & observabilité de production (P1)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L4.1 | Endpoint `/api/health` + monitoring d'uptime | P1 | ✅ PR #206 — reste 🧑 WASSIM : brancher UptimeRobot/Better Stack |
| L4.2 | Sentry (erreurs serveur + client) compatible CSP nonce | P1 | ✅ code prêt (PR #208) — activation ⛔ W8 |
| L4.3 | Alertes métier via `OBSERVABILITY_WEBHOOK_URL` | P1 | ✅ PR #207 — reste 🧑 WASSIM : créer le webhook + poser la variable |

**L4.1** : route GET `src/app/api/health/route.ts` → `{ ok, db, redis, mode }`
(un `SELECT 1` Prisma, un `PING` Redis si configuré, le mode paiement actif —
JAMAIS de secret ni de version détaillée dans la réponse). 🧑 WASSIM :
brancher UptimeRobot/Better Stack (free) sur `/` et `/api/health`, alerte
e-mail/Telegram.

**L4.2 — décisions tranchées** : `@sentry/nextjs`, activé seulement si
`SENTRY_DSN` défini (défaut démo sûr, comme tous les modes) ; utiliser
`tunnelRoute` (proxy first-party, ex. `/monitoring`) pour rester compatible
CSP par nonce et adblockers — NE PAS élargir la CSP à des domaines tiers si le
tunnel suffit ; `tracesSampleRate: 0.1` max (free tier) ; scrubber : jamais de
CIN/e-mail/téléphone dans les breadcrumbs (configurer `beforeSend`).

**L4.3** : brancher `notifyObservability` sur les événements critiques s'il ne
l'est pas déjà : `konnect.webhook_bad_signature`, échec de settlement, spike
d'échecs de connexion (compteur fenêtré simple via rate-limit lib), échec d'un
job L3. 🧑 WASSIM : créer le webhook (canal Telegram/Slack/Discord perso) et
poser `OBSERVABILITY_WEBHOOK_URL` en staging/prod.

---

## L5 — Bascule « commission-only » : Darna n'encaisse QUE ses frais (P0)

> **Remplace l'ancien chantier « payout manuel outillé »** (décision Wassim du
> 2026-07-27, cf. §Modèle de paiement en tête de fichier). Il n'y a PLUS de
> payout du loyer à outiller : Darna ne détient plus jamais l'argent de
> l'hôte. Ce chantier bascule le produit vers ce modèle, de bout en bout.

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L5.1 | Prix & paiement : frais 10 %, paiement en ligne = frais uniquement | P0 | ✅ PR #209 |
| L5.2 | Politiques d'annulation portées sur les FRAIS + écran admin « Remboursements dus » | P0 | ✅ PR #211 |
| L5.3 | Garantie non-conformité : signalement < 24 h → remboursement des frais | P0 | ✅ PR #212 |
| L5.4 | Garantie no-show hôte : indemnité 100 % des frais, plafonnée | P1 | ✅ PR #213 |
| L5.5 | Refonte wording : « zéro acompte au propriétaire » (i18n ×3 + e-mails + CGU + README) | P0 | ✅ PR #214 |
| L5.6 | ⛔ W4 — avis juridique (périmètre mis à jour, voir tableau ⛔) | P0 | ❌ 🧑 WASSIM |
| L5.7 | Pédagogie hôte Rail 2 : contrat clair sur la facturation des 10 % + cadrage gagnant-gagnant | P0 | ✅ PR #215 |
| L5.8 | **Checklist d'impact commission-only** (balayage exhaustif, clôture du chantier L5) | P0 | ✅ PR #216 |

**Contexte complet pour session future** : l'ancien modèle encaissait via
Konnect un acompte `max(10 %, commission)` — donc de l'argent appartenant à
l'hôte — sur le wallet Darna, sans API de virement sortant ni de
remboursement (vérifié, cf. CLAUDE.md §AHC8 : ne jamais coder de faux appel).
Détenir des fonds de tiers = services de paiement (loi 2016-48, BCT) = ce
qu'on refuse d'être en V1. Le nouveau modèle supprime le problème à la
racine : **chaque dinar encaissé en ligne appartient à Darna**. Le revenu ne
change pas (Darna n'a jamais gagné plus que ses frais) ; il monte même de
8 % → 10 %.

### L5.1 — Prix & paiement

**Décisions tranchées** :
- `SERVICE_FEE_RATE` : `0.08` → `0.10` (`src/lib/config.ts`). Les frais
  restent calculés sur le **subtotal** (loyer = nuitée × nuits, après promo
  hôte éventuelle) et ajoutés AU-DESSUS — l'hôte touche 100 % de son prix.
- `computeDepositAmount` retourne désormais **exactement `serviceFee`**
  (supprimer le plancher `DEPOSIT_MIN_RATE` 10 % du total — c'est lui qui
  créait la détention de fonds de tiers). `clampPayAmount` : le montant en
  ligne devient FIXE = `serviceFee` (plus de choix « payer plus ») —
  simplifier `DepositPayment.tsx` en conséquence (plus de curseur/choix de
  montant : un seul montant affiché, les frais).
- La confirmation reste **instantanée** au paiement des frais (comportement
  actuel inchangé) ; le gating contact (`src/lib/contact-reveal.ts` :
  CONFIRMEE + fin de fenêtre d'annulation gratuite) reste valable tel quel.
- Les états `escrow` du schéma sont **conservés mais inertes** (aucune
  suppression, aucun nouveau code dessus) — réactivables en V2. L'UI ne doit
  plus jamais parler de « séquestre » (cf. L5.5). Le mode
  `PAYMENT_MODE=demo` simule le paiement des FRAIS (plus un faux séquestre).
- **Crédits & gestes commerciaux ne peuvent réduire QUE l'argent de Darna** :
  `computeCreditApplication` (crédits CR1) et la réduction de re-réservation
  (`rebooking-discount.ts`) doivent se replafonner sur `serviceFee` (jamais
  sur le loyer, que Darna ne touche plus). Revoir `CREDIT_CHECKOUT_CAP_RATE`
  en conséquence (le plafond 30 % du total n'a plus de sens — nouveau
  plafond : 100 % des frais). Mettre à jour `CROISSANCE_ROADMAP.md` si des
  montants y sont documentés.
- Rail 2 `SUR_PLACE` : **inchangé** (acceptation hôte, KYC CIN,
  `HostInvoice`). Seule évolution mécanique : la commission facturée à
  l'hôte suit le nouveau taux de 10 %.

**Tests** : frais = 10 % du subtotal ; acompte = frais exactement ; clamp
fixe ; crédits plafonnés aux frais ; réduction re-réservation plafonnée aux
frais ; Rail 2 inchangé ; mise à jour des tests existants qui encodent 8 %
ou l'acompte 10 %-du-total (`deposit.test.ts`, `bookings.test.ts`,
`booking-credit-application.test.ts`…).

### L5.2 — Annulation & remboursements (sur les frais) ✅ PR #211

**Décisions tranchées, confirmées avec Wassim le 2026-07-27 (question posée
sur l'ambiguïté du texte initial ci-dessous)** : les politiques portent
désormais sur les FRAIS (le loyer n'étant jamais versé d'avance, il n'y a
plus rien d'autre à rembourser) — **les fenêtres/seuils restent EXACTEMENT
INCHANGÉS** (FLEXIBLE = J-1, MODÉRÉE = J-5, FERME = J-30 puis 50 % à J-7,
STRICTE = 50 % à J-14 — **FERME conservée**, une 4e politique toujours
sélectionnable par les hôtes, absente par oubli du texte initial) : seule
l'assiette change, jamais les seuils. `src/lib/cancellation.ts` simplifié :
`computeBookingRefund` (carve-out commission séparé) supprimé —
`computeRefund` s'applique directement sur `amountPaid` (qui EST déjà les
frais depuis §L5.1, jamais le loyer ; vaut 0 en Rail 2 SUR_PLACE → jamais
rien à rembourser dans ce cas, cohérent).

Comme l'API Konnect n'a pas de remboursement programmatique, le
remboursement des frais reste un règlement **ADMIN manuel** :
`/dashboard/admin/remboursements` liste les réservations avec `refundAmount`
non null et `refundPaidAt` null (nouveau champ `Booking.refundPaidAt
DateTime?`) — deux actions ADMIN-only idempotentes (AuditLog
`REFUND_MARKED`) : `creditRefundAction` (crédit Darna, **préféré**,
instantané, crédite + marque réglé dans la MÊME transaction) et
`markRefundPaidAction` (virement manuel, fallback). `creditRefundAction`
utilise un motif de crédit **distinct**, `REMBOURSEMENT_FRAIS_ANNULATION`
(pas `REMBOURSEMENT_RESERVATION_ANNULEE` comme envisagé initialement — ce
dernier motif existant sert à restituer un crédit DÉPENSÉ par le voyageur
§CR4, une opération différente ; réutiliser le même motif aurait cassé
l'idempotence de l'un ou l'autre sur une même réservation touchée par les
deux mécanismes). Statut visible côté voyageur sur `/dashboard/reservations`
(« Remboursement en cours » tant que `refundPaidAt` est null, « Remboursé »
une fois réglé).

**Tests** : fenêtres par politique (inchangées) ; assiette = `amountPaid`
(jamais le loyer) ; idempotence des deux actions de règlement ; non-collision
de motif avec §CR4. QA_ROADMAP §6.6 « Refund test suite ». Vérifié en
conditions réelles (Postgres local, Playwright : annulation voyageur →
190 TND affichés → créditation admin → wallet crédité, ligne disparue du
tableau de bord admin, statut voyageur passé à « Remboursé »).

### L5.3 — Garantie non-conformité (la promesse de confiance V1) ✅ PR #212

**Décisions tranchées** : bouton « Signaler un problème à l'arrivée » sur la
réservation, disponible de `checkIn` à `checkIn + 24 h`, réservé au voyageur
de la réservation (authz serveur) : motif libre + catégorie (zod), un seul
signalement par réservation. Le signalement N'EST PAS un remboursement
automatique : il ouvre un dossier visible dans l'admin (statut
RECU/VALIDE/REJETE), l'admin valide → `refundAmount` = 100 % des frais →
circuit L5.2. Notification hôte + voyageur (types existants du centre de
notifications). Émettre le `ProductEvent` correspondant (discipline IN4).
Darna n'arbitre QUE ses propres frais (exposition max = 10 % du séjour) —
le litige sur le loyer reste bilatéral hôte↔voyageur (CGU, cf. L5.5).

**Tests** : fenêtre 24 h ; unicité ; IDOR ; flux admin ; audit. Implémenté via
un nouveau modèle `NonConformityReport` (`bookingId` unique, statut
RECU/VALIDE/REJETE, même patron que `WakilApplication`) plutôt que des champs
sur `Booking` — `validateNonConformityReportAction` pose
`Booking.refundAmount` ET fait passer le dossier à VALIDE dans LA MÊME
transaction (même principe que `creditRefundAction`, §L5.2). Garde
additionnelle découverte en implémentant : `cancelBookingAction` refuse
désormais l'annulation « libre choix » du voyageur si un dossier de
non-conformité existe déjà (quel que soit son statut) — sinon elle
écraserait silencieusement un `refundAmount` déjà validé par un admin avec
le résultat de `computeRefund` (quasi toujours 0 % puisque le check-in est
alors déjà passé). QA_ROADMAP §6.7. Vérifié en conditions réelles (Postgres
local, Playwright : signalement voyageur → dossier visible sur
`/dashboard/admin/non-conformite` → validation admin → 266 TND apparaissent
sur `/dashboard/admin/remboursements` → statut voyageur passé à
« Signalement validé » + « Remboursement de 266 TND en cours », notifications
hôte (SIGNALEMENT_RECU) et voyageur (SIGNALEMENT_VALIDE) posées en base).

### L5.4 — Garantie no-show hôte (P1 — peut suivre le lancement de peu) ✅ PR #213

**Décisions tranchées** : si le voyageur ne se présente pas (réservation
CONFIRMEE, non annulée, no-show déclaré par l'hôte entre `checkIn` et
`checkIn + 48 h`, un seul par réservation), Darna verse à l'hôte une
indemnité = **100 % des frais encaissés** sur cette réservation — sur le
REVENU PROPRE de Darna (jamais un transfert de l'argent du voyageur : c'est
ce qui rend le mécanisme légalement anodin, c'est une indemnité
contractuelle). **Plafond anti-abus : 3 indemnités par hôte par mois
glissant** (constante, provisoire — à ajuster sur données réelles).
Versement par défaut **en crédits Darna** (`CreditWallet`, nouveau motif
`INDEMNITE_NO_SHOW` à ajouter à `CREDIT_TRANSACTION_MOTIFS`, dépensables sur
boost/vérifications/abonnement — la dépense côté hôte existe déjà, motif
`UTILISATION_SERVICE_HOTE`) ; virement manuel en option sur demande. Le
no-show déclaré alimente la suspension progressive voyageur existante
(`BOOKING_NO_SHOW` est déjà un motif de `SuspensionReason`). Frais du
voyageur non remboursés dans ce cas (cohérent L5.2).

**Tests** : fenêtre ; unicité ; plafond mensuel ; crédit émis via
`issueCredit` (atomique, ledger) ; suspension voyageur ; IDOR. Nouvelle
action `claimNoShowIndemnityAction` (`src/actions/bookings.ts`), DISTINCTE de
`reportNoShowAction` (Rail 2 SUR_PLACE, sans indemnité — inchangée) : rail
ESCROW uniquement. Idempotence portée par le nouveau champ
`Booking.noShowIndemnityClaimedAt` — PAS le statut seul, qui peut aussi
devenir TERMINEE via la complétion paresseuse normale d'un séjour
(`completeElapsedBookings`) dans la même fenêtre de 48 h pour un court
séjour, sans rapport avec un no-show (bloquerait sinon à tort une
réclamation légitime). Réclamation + crédit + suspension voyageur posés dans
LA MÊME transaction (`applySuspension` accepte un client transactionnel).
QA_ROADMAP §6.8. Vérifié en conditions réelles (Postgres local, Playwright :
hôte déclare un no-show sur une résa ESCROW confirmée → 190 TND crédités
immédiatement, visibles sur `/dashboard/credits` — historique
`INDEMNITE_NO_SHOW` — voyageur suspendu avec motif `BOOKING_NO_SHOW`).

### L5.5 — Refonte wording : « Zéro acompte au propriétaire » ✅ PR #214

**Pourquoi** : `src/lib/i18n/fr.ts` promet aujourd'hui la garde des fonds
(« Votre argent est protégé » l.31, « Darna le conserve … et ne le verse à
l'hôte qu'après votre départ » l.1247, « bloqué en séquestre » l.1300,
e-mails l.989/1017, blocs confiance l.67-69, 536, 580, 1245-1252, 1266,
1339, 1394, 1690, 1801…). TOUT ce champ lexical doit disparaître — il décrit
le modèle V2, pas la V1 — au profit de la nouvelle promesse, qui est le
message anti-arnaque le plus radical du marché :

> **« Ne versez jamais d'acompte à un propriétaire. Sur Darna, vous ne payez
> en ligne que les frais de réservation — remboursés si l'annonce n'est pas
> conforme. Le séjour se règle sur place, dans un logement vérifié
> physiquement, auprès d'un hôte à l'identité vérifiée. »**

**Étapes** : hero home (« Votre argent est protégé » → « Zéro acompte au
propriétaire ») ; blocs confiance ; checkout (« frais de service, seul
paiement en ligne — le séjour se règle sur place ») ; e-mails de
confirmation ; dashboard hôte (« le voyageur a payé les frais Darna, il
vous règle à l'arrivée ; garantie no-show incluse ») ; CGU (les clauses
« mise en relation »/« intermédiaire » l.1780/1813 deviennent VRAIES —
ajouter les clauses : remboursement des frais, garantie non-conformité,
indemnité no-show, litige loyer bilatéral) ; page `/diaspora` (l.1690 :
retirer la promesse séquestre, la remplacer par « vous ne risquez que les
frais » + mention V2 à venir) ; `README.md` §Limites ; **les trois
dictionnaires** (`fr`/`en`/`ar`), captures avant/après des pages touchées.
`aucunFraisCache` (« Aucun autre frais ne vous sera demandé. Jamais. »)
reste vrai et doit rester affiché — le total sur place est annoncé dès le
récap.

**Ne PAS faire** : garder un seul écran qui parle encore de séquestre/fonds
conservés (grep exhaustif `séquestre|sequestre|protégé|conserve` sur les 3
dictionnaires en fin de tâche) ; toucher aux clés `metadata`/SEO autrement
que via `frMeta` (convention projet).

**Implémenté** : les 4 greps de clôture de §L5.8 tournés vides (hors 2
commentaires de code justifiés, dormants, décrivant le mécanisme `escrow`
gardé inerte pour la V2 — `dashboard/reservations/page.tsx`,
`dashboard/revenus/page.tsx`). `meta.description` (SEO, `frMeta`) corrigée
dans `fr.ts` uniquement, conformément à la convention. Bug de correction
adjacent découvert en balayant la page de paiement :
`commissionNonRemboursable` décrivait encore l'ancien carve-out commission
(`computeBookingRefund`, supprimé en §L5.2) au lieu du remboursement uniforme
par palier de politique — renommée `remboursementFraisPolitique` et
réécrite. E-mails de confirmation enrichis d'une répartition frais
payés/solde cash/total (`booking.amountPaid` ajouté au payload, absent
avant). CGU : nouvelle §5 « Remboursements et garanties » entre l'ancienne
§4 et §5, renumérotation 5→9. Plusieurs clés dont le NOM restait
« séquestre »/« versement » alors que leur VALEUR était déjà correcte ont
été renommées par cohérence (`sequestreExplication`→
`paiementFraisExplication`, `acompteSequestreInfo`→`contactRevelationInfo`,
`revenusVersementPrevu`→`revenusAEncaisserLe`). Vérifié en conditions
réelles (Playwright) : accueil (hero + bloc confiance « Zéro acompte au
propriétaire »), CGU (§5 + renumérotation), `/diaspora`, badge
« Confirmée — frais réglés » sur `/dashboard/reservations`.

### L5.7 — Pédagogie hôte Rail 2 : le contrat des 10 % doit être limpide (demande Wassim, 2026-07-27) ✅ PR #215

**Pourquoi** : en Rail 2, l'hôte encaisse TOUT (loyer + les 10 % de frais
inclus dans le total voyageur) puis doit reverser les 10 % à Darna. La
mécanique est entièrement codée (PSP4-PSP8 : facture par réservation, lien
Konnect, échéance `HOST_INVOICE_DUE_DAYS` = 14 j, rappels J-3/retard,
masquage des annonces en cas d'impayé, suspension admin) mais elle n'est
**expliquée nulle part à l'hôte AVANT qu'il s'engage**. Un hôte surpris par
une facture = un impayé + un hôte perdu ; un hôte qui a compris le
gagnant-gagnant = un payeur volontaire.

**Décision de facturation (tranchée)** : la facture reste **par réservation**
en V1 (modèle existant, testé, encaissement rapide, trivial à comprendre :
« 1 réservation = 1 facture de 10 % ») — PAS de facture mensuelle consolidée
maintenant : au volume de lancement (1-3 résas SUR_PLACE/hôte/mois, rail
minoritaire cf. §0bis de `PAIEMENT_SUR_PLACE_ROADMAP.md`), la consolidation
ajoute de la complexité (un `paymentRef` pour N factures casse le modèle
1-paiement-1-facture) pour un gain nul. En revanche le dashboard PRÉSENTE
les factures **regroupées par mois** avec total mensuel (pure présentation,
zéro changement de modèle). Réévaluer la vraie facture mensuelle consolidée
quand des hôtes dépassent ~5 factures/mois (noter alors une tâche dédiée).

**Étapes** :
1. **Écran d'activation du paiement sur place** (le toggle existant avec
   acceptation des CGU hôte — `cashTermsAcceptedAt`, ne PAS casser le
   non-bypass testé par `tests/cash-payment-terms-bypass.test.ts`) : refonte
   pédagogique en 4 blocs AVANT la case à cocher —
   (a) *Comment vous êtes payé* : le voyageur vous règle TOUT à l'arrivée,
   loyer + frais Darna inclus dans son total ;
   (b) *Comment vous nous payez* : une facture de 10 % par réservation
   terminée, payable en ligne en 2 minutes (carte, e-DINAR, Flouci) depuis
   « Mes factures », échéance 14 jours ;
   (c) *Si vous ne payez pas* : rappels automatiques, puis vos annonces
   sont masquées des recherches jusqu'au règlement (et suspension possible)
   — dit sans détour, AVANT l'engagement ;
   (d) *Pourquoi c'est gagnant-gagnant* : chaque réservation via Darna vous
   apporte un voyageur à l'identité CIN vérifiée, un avis authentique
   impossible à obtenir hors plateforme (contrainte de schéma) qui monte
   votre classement, le badge Vérifié, la garantie anti-no-show du rail
   standard, et l'accès aux voyageurs diaspora.
2. **`/dashboard/factures`** : en-tête explicatif (les mêmes 4 points en
   condensé) + regroupement par mois + total du mois en cours.
3. **E-mail à la GÉNÉRATION de la facture** (il n'existe que les e-mails
   J-3 et retard — ajouter celui de création dans `src/lib/notifications.ts`,
   même patron) : montant, réservation concernée, échéance, lien de paiement
   direct, rappel du « pourquoi » en une phrase.
4. **Page CGU hôte** (`/cgu-hote`) : aligner les clauses sur le modèle 10 %
   et l'échéance/conséquences ci-dessus (cohérence L5.5).
5. i18n ×3, `ProductEvent` sur l'activation (discipline IN4), captures
   avant/après (activation + factures), tests (e-mail de création, rendu
   groupé par mois — aucune logique de règlement ne change).

**Ne PAS faire** : modifier `HostInvoice`/`settleHostInvoice`/le webhook
(rien ne change dans la mécanique de paiement) ; adoucir le point (c) — la
clarté sur les conséquences EST la demande produit ; inventer une remise ou
un barème non validé.

**Implémenté** : les 4 blocs pédagogiques (a-d) insérés dans
`PropertyForm.tsx`, AVANT la case à cocher, gated sur `!wasCashPaymentEnabled`
(même garde que la sous-case CGU existante — n'apparaît qu'avant la première
activation, jamais sur les re-sauvegardes). `resolveCashPayment`/
`cashTermsAcceptedAt` et le non-bypass testé par
`tests/cash-payment-terms-bypass.test.ts` inchangés. `/dashboard/factures` :
en-tête explicatif condensé (4 puces) + regroupement par mois de création
(tri dominant `createdAt desc` pour des mois strictement chronologiques,
jamais entrelacés par statut) + total par mois via `<Price>`. Nouvel e-mail
`sendHostInvoiceGeneratedEmail` (même patron que les 3 e-mails HostInvoice
existants), déclenché une seule fois dans `acceptCashBookingAction` juste
après la transaction claim+HostInvoice (id de la facture récupéré du
tuple `$transaction([...])`, jusque-là ignoré). CGU hôte (`/cgu-hote`) : §2
rend le taux de 10 % explicite et corrige l'imprécision « la commission ne
transite jamais par la plateforme » (fausse depuis que Konnect règle les
frais — seul le LOYER ne transite jamais par Darna) ; §3 rend le délai de 14
jours explicite (échéance = fin de séjour + 14 j, comme le code) ; §4 ajoute
la mention des rappels automatiques et de la suspension possible. i18n ×3.
`ProductEvent` `CASH_PAYMENT_ENABLED` émis aux deux points d'appel
(`createPropertyAction`/`updatePropertyAction`), gated sur
`cashPayment.cashTermsAcceptedAt` truthy (donc uniquement sur une vraie
transition false→true, jamais sur une resauvegarde) — testé explicitement
dans `tests/cash-payment-terms-bypass.test.ts`. Vérifié en conditions
réelles (Postgres local, Playwright) : activation du paiement sur place sur
une annonce (explainer visible → case cochée → CGU sous-case → soumission),
acceptation d'une demande SUR_PLACE réelle (nouvelle HostInvoice créée dans
la transaction, e-mail déclenché), `/dashboard/factures` avec 3 factures
seedées sur 2 mois distincts (regroupement + totaux corrects : Juillet 2026
228 TND / Juin 2026 114 TND), `/cgu-hote` avec le nouveau contenu.

### L5.8 — Checklist d'impact commission-only (AUCUN OUBLI — clôture de L5)

> Application de la règle anti-oubli (en-tête de ce fichier) au changement de
> modèle de paiement. Chaque item est vérifié/corrigé par la tâche L5.x qui
> touche sa surface, et la TOTALITÉ est re-balayée par cette tâche de clôture
> avant de marquer le chantier L5 ✅. Les items déjà corrigés dans la PR
> d'ouverture (#198) sont notés — les autres restent à faire pendant L5.

**Code — logique (L5.1/L5.2/L5.4)** :
- [x] `src/lib/config.ts` : `SERVICE_FEE_RATE` 0.10 ; `DEPOSIT_MIN_RATE`
      supprimé ; `computeDepositAmount` = serviceFee ; `clampPayAmount` figé ;
      `CREDIT_CHECKOUT_CAP_RATE` remplacé (plafond = 100 % des frais). — L5.1
- [x] `REBOOKING_DISCOUNT_RATE`/`REBOOKING_DISCOUNT_CAP_TND` (0.1 / 150 TND —
      **dépassent désormais les frais d'une résa** : 10 % du total > frais) :
      replafonner la réduction sur les frais de la nouvelle réservation
      (`src/lib/rebooking-discount.ts`), sinon Darna promet plus qu'elle
      n'encaisse. — L5.1
- [x] `src/actions/bookings.ts` : `depositAmount`, preview/devis,
      `startKonnectPaymentAction` (montant initié = frais uniquement). — L5.1
- [x] `src/lib/payments.ts` : `settleKonnectBooking` (montant attendu = frais) ;
      `confirmPaymentAction` (démo) simule le paiement des FRAIS. — L5.1
- [x] `src/lib/cancellation.ts` : assiette `refundAmount` = `amountPaid`
      (= les frais depuis §L5.1, jamais le loyer), fenêtres/seuils par
      politique INCHANGÉS (FLEXIBLE J-1, MODÉRÉE J-5, FERME J-30/J-7,
      STRICTE J-14) — `computeBookingRefund` (carve-out commission séparé,
      devenu inutile) supprimé, `computeRefund` s'applique directement sur
      `amountPaid`. — L5.2, PR #211
- [x] `src/lib/credits.ts` (`computeCreditApplication`) : plafonné aux frais. — L5.1
- [x] Transitions `escrow` : plus AUCUNE écriture depuis l'UI/actions (états
      inertes, commentaire « V2 » posé) ; `src/lib/host-invoicing.ts` :
      rien à changer (le montant copie `serviceFee`, suit les 10 %). — L5.1

**Code — UI (L5.1/L5.5)** :
- [x] `src/components/booking/DepositPayment.tsx` : plus de choix de montant —
      un montant fixe (les frais) — fait (PR #209). Bandeau de confiance
      « paiement protégé/séquestre » de la page de paiement
      (`sequestreExplication`→`paiementFraisExplication`,
      `acompteSequestreInfo`→`contactRevelationInfo`, renommées + réécrites) et
      `commissionNonRemboursable`→`remboursementFraisPolitique` (texte
      corrigé : décrivait encore l'ancien carve-out commission supprimé en
      §L5.2). — L5.5, PR #214
- [x] Page paiement `src/app/reservation/[id]/paiement` + `KonnectPayButton` —
      partie L5.1 (montant fixe, `payAmount` retiré) faite (PR #209) ; partie
      wording séquestre réécrite. — L5.5, PR #214
- [x] `src/components/property/PropertyCard.tsx` : importe `SERVICE_FEE_RATE`
      — vérifié, calcule déjà correctement sur le nouveau taux, aucun
      changement de code nécessaire. — L5.1
- [x] Récap de réservation : `aucunFraisCache` conservé (vérifié, toujours
      affiché), total sur place affiché dès le premier écran
      (`totalSejour`/`soldeArrivee`, inchangés depuis L5.1). — L5.5
- [x] **`/dashboard/revenus` : respec complète** — « En attente de versement »
      / « Versé » resémantisés en loyer NET « à encaisser à l'arrivée » /
      « déjà encaissé » (statut CONFIRMEE/TERMINEE, plus l'escrow devenu sans
      objet) + ligne frais Darna déjà réglés. Bénéfice annexe : les
      réservations Rail 2 (jamais `EN_SEQUESTRE`) y apparaissent désormais. — L5.1, PR #209
      (clé `revenusVersementPrevu`→`revenusAEncaisserLe` renommée — L5.5, PR #214)
- [x] Badges de statut réservation : « Confirmée — paiement protégé »
      (`fr.ts` l.536) → « Confirmée — frais réglés » (équivalents en/ar). — L5.5, PR #214
- [x] `/diaspora`, home hero + blocs confiance, page annonce
      (`paiementFraisExplication`, `paiementTitre`, `paiementConfirmeDetail`,
      `modeEscrowAide`). — L5.5, PR #214
- [x] `/combien-gagner` + Yield Advisor + simulateur (`market-simulator`) :
      vérifié — aucun calcul n'affiche de « net de commission », dans le
      nouveau modèle l'hôte touche 100 % de son prix. — L5.5, PR #214

**Contenus, e-mails, docs (L5.5/L5.7)** :
- [x] Les TROIS dictionnaires (`fr`/`en`/`ar`) : champ lexical
      séquestre/protégé/conservé/versement — greps de clôture vides. — L5.5, PR #214
- [x] E-mails transactionnels (confirmation voyageur + nouvelle résa hôte,
      réécrits avec répartition frais payés/solde cash/total) ;
      `src/lib/notification-text.ts` vérifié — aucune mention séquestre. — L5.5, PR #214
- [x] CGU : §4 réécrite (commission-only) + nouvelle §5 « Remboursements et
      garanties » (remboursement des frais, garantie non-conformité, garantie
      no-show, litige loyer bilatéral — sections renumérotées 5→9) ;
      confidentialité vérifiée (aucune mention séquestre résiduelle). — L5.5,
      PR #214.
- [x] `/cgu-hote` : §2/§3/§4 alignées sur le modèle 10 % (taux explicite,
      imprécision « ne transite jamais » corrigée, échéance 14 j explicite,
      rappels + suspension possible mentionnés). — L5.7, PR #215
- [x] **`CLAUDE.md` §« Paiement Konnect »** : décrivait encore le flux séquestre
      — réécrit pour commission-only (header + contenu), avec la V2 en note
      explicite. §Stack (l.51, « Le séquestre a deux modes ») corrigé aussi. — L5.5, PR #214
- [x] `README.md` — fait dans la PR #198 (séquestre retiré, modèle V1 décrit) ;
      2 mentions résiduelles trouvées et corrigées en L5.5 (promesse 3 temps
      « Votre argent est protégé », ligne « acompte minimum en ligne »). — PR #214
- [x] `.agents/product-marketing.md` : promesse séquestre → « zéro acompte au
      propriétaire » (3 mentions corrigées : produit V0, promesse 3 temps,
      différenciateur « Séquestre » remplacé). — L5.5, PR #214
- [x] `PAIEMENT_SUR_PLACE_ROADMAP.md` §0 : décrivait encore `max(10 % du
      total, serviceFee)` — note « périmé depuis L5.1 » ajoutée, formule
      corrigée en `serviceFee`. — L5.8
- [x] `CROISSANCE_ROADMAP.md` (CR1) : décrivait encore un plafond de crédit à
      30 % du total — corrigé en `CREDIT_CHECKOUT_CAP_RATE` (100 % des frais
      restants depuis §L5.1), avec la valeur périmée notée pour mémoire. — L5.8
- [x] `AUDIT_V2.md` §R3 — fait dans la PR #198.

**Données & tests (chaque L5.x + clôture)** :
- [x] `prisma/seed.ts` : réservations seedées (montants, `depositAmount`,
      états `escrow`, réservations démo « versées »). — L5.1, PR #209
- [x] Tests unitaires encodant 8 % / acompte 10 %-du-total :
      `deposit.test.ts`, `bookings.test.ts`, `payments.test.ts`,
      `cancellation.test.ts`, `booking-credit-application.test.ts`,
      `booking-promo-price.test.ts`, `rebooking-discount.test.ts`,
      `cash-booking.test.ts`, `contact-reveal.test.ts` (+ tout test qui
      calcule un total). — **PR #209 : tout fait sauf `cancellation.test.ts`**
      (`bookings.test.ts`/`cash-booking.test.ts`/`contact-reveal.test.ts`
      vérifiés inchangés à raison — leurs scénarios ne dépendent pas du
      taux) ; `cancellation.test.ts` fait avec le fichier qu'il teste — L5.2,
      PR #211 (+ nouveau `admin-refunds.test.ts` pour les deux actions admin).
- [x] `tests/e2e` (parcours réservation/paiement) + `tests/api` — exécutés
      réellement en local (pas seulement relus) : **26/26 `tests/e2e` verts**.
      `tests/api` : **bug réel trouvé et corrigé** — `playwright.api.config.ts`
      active `PAYMENT_MODE=konnect` sans jamais poser `CRON_SECRET`, or
      `src/lib/env.ts` l'exige dès qu'un mode réel est actif depuis §L3.1/L4.2
      (PR #208, 2026-07-27) : le serveur de test refusait de démarrer
      (`Variables d'environnement invalides`) — donc le job CI `api` était
      cassé pour TOUTES les PR depuis #208 (soit #209→#215), masqué par le
      quota GitHub Actions épuisé sur la même période (jamais un run réel pour
      révéler l'échec). Corrigé par l'ajout d'un `CRON_SECRET` factice
      (≥ 32 caractères) au `webServer.env`. Une fois démarré : **12/13 verts**
      — 1 flake intermittent (`webhook-konnect.spec.ts`, rejeu idempotent)
      reproduit uniquement sous charge concurrente `next dev`/Turbopack
      (100 % stable isolé, `--workers=1`), jamais lié au modèle commission-only
      (logique déjà couverte, déterministe, par `tests/payments.test.ts`) —
      absorbé par le retry CI existant (`retries: process.env.CI ? 1 : 0`),
      non bloquant. Aucune donnée de fixture (`nightlyPrice`/`serviceFee`/
      `totalPrice`) trouvée dépendante d'un taux périmé dans une assertion
      réelle (une valeur `serviceFee: 20` sur un total de 400 TND traîne dans
      `global-setup.ts`/`webhook-konnect.spec.ts` — pas 10 % exactement, mais
      aucun test n'en dépend, laissée telle quelle). — L5.8, PR #216
- [x] `tests/perf` (k6 `booking-load*`/`search*`) : relu intégralement —
      aucun montant/taux figé (`booking-load-verify.ts` ne vérifie qu'un
      COMPTE de réservations actives, pas de montant ; `search-seed.ts` génère
      des prix de recherche arbitraires, sans lien avec `serviceFee`). `k6`
      non installé dans ce bac à sable → non exécutable ici (cohérent avec sa
      place au niveau 3 de la pyramide CI, `nightly.yml`, hors porte de merge
      d'une PR). — L5.8, PR #216

**Greps de clôture (obligatoires, résultat vide ou justifié « V2 »)** :
```
grep -rn "séquestre\|sequestre\|escrow" src/components src/app src/lib/i18n
grep -rin "protégé par Darna\|protected by Darna\|payout\|versement" src/lib/i18n
grep -rn "0\.08\|8 %" src
grep -rn "DEPOSIT_MIN_RATE\|CREDIT_CHECKOUT_CAP_RATE" src
npx tsc --noEmit
```
(+ la suite de tests complète, évidemment.)

**Ré-exécutés à la clôture (L5.8, PR #216)** : les 4 greps ci-dessus tournent
identiques à l'état déjà vérifié en L5.5/PR #214 (2 commentaires de code
justifiés `escrow`/« séquestre libéré » décrivant le mécanisme V2 inerte,
1 faux positif `0.08` sur une animation Framer Motion, `CREDIT_CHECKOUT_CAP_RATE`
en usage actif correct + `DEPOSIT_MIN_RATE` mentionné une fois dans un
commentaire disant explicitement qu'il n'existe plus) — rien de nouveau
depuis. `npx tsc --noEmit` et `npm run lint` clean. **Chantier L5 clos** :
tous les items ✅ (L5.6 reste ⛔ 🧑 WASSIM, hors périmètre codable).

---

## L6 — Infrastructure : staging + production (P0)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L6.1 | `INFRA_ROADMAP.md` réel + configuration du dépôt pour Vercel | P0 | ✅ PR #217 |
| L6.2 | ⛔ W1/W2 — provisionner comptes + domaine, déployer staging puis prod | P0 | ❌ 🧑 WASSIM (checklist fournie par L6.1) |
| L6.3 | Smoke tests Playwright contre staging + correctifs prod-only | P0 | ❌ (après L6.2) |

**Décisions d'hébergement tranchées (ne pas rouvrir)** :
- **Vercel** pour l'app : le projet est déjà 100 % compatible (App Router,
  middleware CSP, `.vercel` gitignoré) et Vercel Cron porte L3. Alternative
  Railway/Fly notée mais NON retenue (Cron + DX + free tier).
- **Neon** pour PostgreSQL : `DATABASE_URL` = pooler, `DIRECT_URL` = direct —
  le schéma et `.env.example` documentent déjà exactement ce split. Backups
  PITR inclus.
- **Upstash Redis** (rate limiting distribué — indispensable en serverless :
  le fallback mémoire de `src/lib/rate-limit.ts` est quasi inopérant
  multi-instance).
- **Cloudflare R2** pour `STORAGE_MODE=s3` (compatible S3 via `aws4fetch`
  déjà en dépendance, egress gratuit).
- **Resend** : `EMAIL_PROVIDER=resend` (déjà codé).
- **Deux environnements** : `staging` (Konnect **sandbox**, `KYC_MODE=demo`,
  seed démo, Turnstile clés test, robots `noindex`) et `production` (données
  réelles uniquement — PAS de seed —, Turnstile clés réelles ⛔ W5,
  `TRUSTED_PROXY=true`, `KYC_ENC_KEY` posé, `CRON_SECRET` posé).

**L6.1 (codable maintenant)** : écrire `INFRA_ROADMAP.md` (architecture,
matrice des variables d'env par environnement — reprendre la liste complète
de `.env.example` —, procédure de déploiement, procédure de rollback Vercel,
procédure de restauration de backup Neon À TESTER UNE FOIS, checklist
pas-à-pas pour W1/W2 cliquable par un humain) ; ajouter `vercel.json` (crons
L3) ; vérifier que `next build` passe sans DB au build OU documenter la
variable de build (le sitemap lit la DB — vérifier le comportement et le
documenter) ; robots/noindex conditionnel staging (`SITE_URL` ≠ prod).
`CLAUDE.md` référence déjà `INFRA_ROADMAP.md` — la référence redevient vraie.

**Implémenté** : `INFRA_ROADMAP.md` écrit (architecture, matrice de variables
par environnement, procédures déploiement/rollback/restauration Neon,
checklist W1/W2 pas-à-pas). `CLAUDE.md` §Roadmaps produit référence
maintenant `INFRA_ROADMAP.md` (vérifié : il ne le référençait PAS encore
malgré ce que ce paragraphe supposait — corrigé). `vercel.json` déjà présent
(crons §L3.1), rien à ajouter au lancement (Vercel déduit le reste du
framework détecté). **Bug réel trouvé et corrigé en testant `next build`
pour de vrai** (base injoignable) : `src/app/sitemap.ts` faisait planter le
build ENTIER en tentant de se prérendre statiquement avec un accès DB —
corrigé par `export const dynamic = "force-dynamic"` (cohérent avec le
besoin métier : une annonce expirée doit sortir du sitemap sans attendre un
redéploiement). `next build` avec DB injoignable reproduit AVANT le fix
(échec confirmé) puis vérifié après (50/50 pages générées, aucun accès DB).
`robots.ts` : noindex conditionnel ajouté (`disallow: "/"` tant que
`SITE_URL` ≠ `https://darna.tn` exactement) + `tests/robots.test.ts` (3 cas :
staging, localhost, production). — L6.1, PR #217

**L6.3** : une fois staging en ligne : dérouler la suite e2e existante contre
staging (`PLAYWRIGHT_BASE_URL` ou config dédiée), corriger ce que la prod
révèle (CSP+HTTPS réels, cookies `Secure`, webhook Konnect sandbox enfin
joignable de bout en bout — vérifier le chemin NOMINAL webhook, pas seulement
le filet `?konnect=success`). Rapport + captures obligatoires.

---

## L7 — RGPD / ePrivacy pour la cible diaspora (P1)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L7.1 | Mise en conformité `darna-vid` (régime « exemption mesure d'audience » CNIL) | P1 | ✅ PR #218 |
| L7.2 | Purges de rétention automatisées (job L3) | P1 | ✅ PR #218 |
| L7.3 | Export des données + suppression de compte | P1 | ✅ export PR #219, suppression PR #220 |

**Pourquoi** : cible marketing n°1 = diaspora **France** = utilisateurs
RGPD/CNIL. Or le bandeau actuel (`src/components/legal/CookieConsent.tsx`)
est purement informatif — « Accepter » et « Refuser » écrivent le même cookie
et ne changent RIEN — pendant que le middleware pose `darna-vid` à tout
visiteur pour alimenter `ProductEvent`/`PropertyView` (mesure d'audience).
Un « Refuser » sans effet est pire que pas de bandeau : c'est une déclaration
inexacte, l'inverse du positionnement honnêteté.

**Décision tranchée (option a — préserver l'instrumentation)** : viser le
régime d'**exemption de consentement « mesure d'audience » de la CNIL** plutôt
que le consentement bloquant : finalité strictement limitée à la mesure
interne (pas de recoupement, pas de tiers, pas de cross-site — c'est déjà le
cas : première partie, zéro script tiers), durée de vie du cookie ≤ 13 mois,
rétention des données ≤ 25 mois. Le bandeau redevient alors honnête en
version INFORMATIVE (un seul bouton « OK » + lien confidentialité), à
condition que L7.2 rende les durées vraies.

**L7.1** : `darna-vid` posé avec `Max-Age` 13 mois (vérifier
`src/middleware.ts`) ; bandeau simplifié en informatif exact (retirer le faux
« Refuser », i18n ×3) ; page `/confidentialite` réécrite pour décrire la
réalité : `darna-vid` (finalité, durée), `ProductEvent` (25 mois), AuditLog
(sécurité, durée L7.2), CIN chiffrée, Konnect, Resend, droits + contact.

**L7.2 (jobs L3)** : purge `ProductEvent` > 25 mois ; purge `AuditLog`
> 13 mois (le TODO-PRODUCTION exige ≥ 90 j de rétention sécurité — 13 mois
les respecte largement) ; purge `PropertyView` > 13 mois (la dédup de
`viewCount` perd juste sa mémoire au-delà — acceptable, décision actée) ;
purge `PasswordResetToken`/`OtpChallenge` expirés. Tests d'idempotence.
Cocher les lignes correspondantes de `QA_ROADMAP.md`/`TODO-PRODUCTION.md`.

**Implémenté (L7.1+L7.2 livrées ensemble — indissociables : la page
confidentialité aurait fait une promesse non tenue sans le job qui la rend
vraie, exactement le défaut du bandeau « Refuser » corrigé ici)** :
`darna-vid` déjà à 365 j (`src/middleware.ts`, vérifié conforme ≤ 13 mois,
test de régression ajouté). `CookieConsent.tsx` : bandeau informatif à bouton
unique (« Refuser » retiré — il ne changeait jamais rien, cf. grep : aucun
lecteur du cookie de consentement dans tout le code), clé i18n `refuser`
supprimée des 3 dictionnaires. `/confidentialite` réécrite (§2 Données
collectées, §3 Finalités, §4 Base légale, §5 Cookies, §6 Conservation) pour
distinguer explicitement cookies strictement nécessaires vs mesure d'audience
exemptée (CNIL), avec durées réelles. Nouveau job `retention-purge`
(`src/lib/jobs/retention-purge.ts`, enregistré dans le runner §L3.1) :
`ProductEvent` 25 mois, `PropertyView` 13 mois (décision produit, pas une
contrainte CNIL — la dédup de `viewCount` n'a pas besoin de plus),
`AuditLog` 13 mois (régime sécurité distinct, ≥ 90 j TODO-PRODUCTION
largement respectés), `PasswordResetToken`/`OtpChallenge` purgés dès
expiration — chaque entité isolée (une erreur n'empêche pas les autres).
`QA_ROADMAP.md` §6.9 ajoutée. — L7.1+L7.2, PR #218

**L7.3** : server action « Exporter mes données » (JSON : profil, annonces,
réservations, avis, messages envoyés, mouvements de crédits — PAS les données
d'autrui : les messages REÇUS n'incluent que le corps, pas les métadonnées de
l'expéditeur au-delà du nom) + « Supprimer mon compte » (page profil,
confirmation par mot de passe, re-auth) : suppression du User — les cascades
et `SetNull` du schéma ont été CONÇUS pour survivre à ça (vérifier
notamment : ledger crédits `SetNull`, AuditLog `SetNull` conservé pour la
sécurité — le documenter dans la page confidentialité). Blocage si
réservation active non terminée. AuditLog `ACCOUNT_DELETED` (sans PII).
Tests : IDOR, cascade complète, blocage résa active.

**Implémenté — export (PR #219)** : `GET /api/account/export` (session
requise, jamais un `userId` client) télécharge un JSON — profil (jamais
`cin`/`cinHash`, chiffrés, ne doivent jamais ressortir en clair même vers
leur titulaire), annonces, réservations (voyageur), avis (rédigés + reçus),
messages (envoyés en entier ; REÇUS : corps + nom de l'expéditeur seulement,
jamais son id/e-mail), mouvements de crédits. Logique extraite dans
`src/lib/account-export.ts` (testable sans HTTP, même patron que
`settleKonnectBooking`). Lien « Exporter mes données » sur `/dashboard/profil`.
Vérifié en conditions réelles (Postgres local, Playwright) : téléchargement
réel réussi pour un compte voyageur (9 réservations, 3 messages), aucune
donnée d'autrui au-delà du nom, `cin` absent.

**Décidé par Wassim** (question posée après la vérification empirique de
chaque `onDelete` du schéma, qui a confirmé que `Booking.guestId` et
`HostInvoice.booking`/`HostInvoice.hostId` sont en **Cascade** — un VOYAGEUR
supprimant son compte aurait sinon effacé, en cascade transitive, les
factures de commission d'un HÔTE) : **anonymiser plutôt que supprimer**.

**Implémenté — suppression (PR #220)** : implémentation plus simple que les 3
options envisagées ci-dessus — **jamais de `prisma.user.delete()`**.
`deleteAccountAction` (`src/actions/profile.ts`) fait un scrub en place de la
ligne `User` existante (name/email/phone/image/cin/cinHash → valeurs
anonymisées, `passwordHash` → hash inutilisable, `kycStatus` →
`NON_VERIFIE`, `deletedAt` posé, `tokenVersion` incrémenté). Conséquence :
**aucune migration de cascade n'était nécessaire** —
`Booking`/`HostInvoice`/`Review` gardent leur ligne intacte puisqu'elle n'est
jamais supprimée, donc les `onDelete: Cascade` identifiés plus haut ne se
déclenchent jamais. Réutilise 2 mécanismes existants plutôt que d'en inventer
un nouveau : `tokenVersion` (même invalidation de session que
`changePasswordAction`) et `expiresAt` (les annonces encore actives de l'hôte
sont délistées immédiatement via le filtre `activeListingWhere()` existant,
jamais un nouveau statut). Blocage si réservation active (voyageur OU hôte
via ses annonces, `status notIn [ANNULEE, TERMINEE]`) ; re-authentification
par mot de passe ; ancien avatar effacé du disque (best-effort) ;
`ACCOUNT_DELETED` journalisé (succès et échec de mot de passe) ; déconnexion
(`signOut`) en fin de flux. `/confidentialite` (fr/en/ar, §8 « Vos droits »)
documente désormais explicitement l'exception RGPD art. 17§3 et le
téléchargement JSON en libre-service. Nouvelle migration
`20260728100000_add_user_deleted_at` (`User.deletedAt`). 9 tests dédiés
(`tests/delete-account-action.test.ts` : re-auth, rate limit, blocage
réservation active, anonymisation exacte des champs, délistage des annonces,
effacement avatar, audit, déconnexion) + suite complète (883 tests) vérifiée
en conditions réelles (Postgres local, Playwright).

---

## L8 — Friction d'entrée : inscription sans rôle + Google OAuth (P1)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L8.1 | Supprimer le choix de rôle à l'inscription (« Devenir hôte » a posteriori) | P1 | ✅ PR #221 |
| L8.2 | Provider Google OAuth (NextAuth) | P1 | ✅ code prêt (PR #222) — activation ⛔ W6 |

**L8.1 — décisions tranchées** : tout nouveau compte naît `VOYAGEUR` (défaut
schéma déjà en place) ; le formulaire d'inscription perd le sélecteur de
rôle ; nouvelle server action `becomeHostAction` (upgrade VOYAGEUR→HOTE, ou
→AGENCE via un choix à CE moment-là) appelée depuis une page « Devenir hôte »
/ le dashboard ; les gates existants par rôle ne changent PAS ; un compte
HOTE/AGENCE existant ne change pas. Mass-assignment : le rôle reste
évidemment hors des champs zod du profil (règle QA existante). Mesure :
émettre `ROLE_UPGRADED` (ProductEvent) ; le funnel d'inscription IN1 mesurera
l'effet. i18n ×3, captures avant/après.

**Implémenté (PR #221)** : `registerSchema` perd `role` (le compte hérite du
défaut `VOYAGEUR` du schéma) ; `RegisterForm` perd le `<select>` rôle.
`becomeHostAction` (`src/actions/profile.ts`) : réservée aux `VOYAGEUR`
(pas de rétrogradation/changement latéral HOTE↔AGENCE↔ADMIN), rate-limitée,
journalise `PROFILE_UPDATED` (audit) + `ROLE_UPGRADED` (ProductEvent),
redirige vers `callbackUrl` (validé via `safeCallbackUrl`) ou
`/dashboard/annonces` par défaut. Nouvelle page `/dashboard/devenir-hote`
(garde : redirige un compte déjà HOTE/AGENCE/ADMIN) + composant
`BecomeHostForm` (choix Hôte/Agence). Nav dashboard : lien « Devenir hôte »
pour tout compte non-annonceur (`src/lib/dashboard-nav.ts`). La garde
existante de `/dashboard/annonces/nouvelle` (VOYAGEUR → redirection) pointe
désormais vers `/dashboard/devenir-hote?callbackUrl=...` au lieu d'un
cul-de-sac (`/dashboard/reservations`) ; les 2 CTA « devenir hôte » public
(`sejours/page.tsx`, `RevenueSimulatorForm.tsx`) simplifiés : connecté → va
droit au formulaire d'annonce (la garde ci-dessus gère un VOYAGEUR), sinon
inscription sans rôle pré-sélectionné. 9 tests dédiés
(`tests/become-host-action.test.ts`) + 3 tests existants mis à jour
(inscription sans champ rôle). Vérifié en conditions réelles (Postgres
local, Playwright) : formulaire d'inscription sans champ rôle, nav VOYAGEUR
correcte, bascule VOYAGEUR→HOTE et →AGENCE confirmées en base
(`ProductEvent`/`AuditLog`), gate `/dashboard/annonces/nouvelle` →
`devenir-hote` → retour au formulaire après bascule (callbackUrl round-trip),
compte déjà HOTE redirigé hors de `/dashboard/devenir-hote`.

**L8.2 — décisions tranchées** :
- Provider **Google uniquement** (pas de Facebook/Apple à ce stade).
- Migration : `User.passwordHash` devient **nullable** ; le login credentials
  REJETTE explicitement un compte à `passwordHash null` avec le message
  générique habituel (anti-énumération) ; l'inscription credentials reste
  inchangée.
- **Liaison de comptes** : autoriser la liaison automatique par e-mail
  UNIQUEMENT pour Google (Google vérifie la propriété de l'e-mail — le
  scénario de takeover « attaquant contrôlant un compte Google avec l'e-mail
  de la victime » est impossible par construction). Documenter ce raisonnement
  en commentaire. Un compte créé via Google a `emailVerified=true` d'office.
- `tokenVersion` : inchangé (les JWT continuent de fonctionner) ; « changer le
  mot de passe » masqué pour les comptes sans mot de passe (proposer « définir
  un mot de passe » plus tard — HORS scope L8, ne pas le construire).
- Rate limiting : le flux OAuth passe par Google, pas par `authorize` — ne pas
  essayer de le rate-limiter côté Darna.
- Tests : matrice login (credentials OK, credentials sur compte Google-only →
  générique, Google nouveau compte, Google e-mail existant → liaison),
  `tokenVersion` inchangé, mass-assignment. QA_ROADMAP : section auth mise à
  jour. E2E : le flux Google réel n'est pas automatisable simplement — mock au
  niveau du provider en test, parcours réel vérifié manuellement en staging.

**Implémenté (PR #222)** : `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` opt-in
(`src/lib/env.ts`, exigées ensemble), `isGoogleAuthEnabled()`
(`src/lib/google-auth.ts`). Migration `passwordHash` nullable
(`20260728103500_user_password_hash_nullable`). `src/lib/auth.ts` : provider
Google enregistré seulement si activé, `authorize()` (credentials) rejette
désormais `!user.passwordHash` avec le MÊME traitement anti-énumération
qu'un compte inconnu (délai constant, message générique), `trustHost: true`
(requis pour la redirection OAuth derrière un proxy), `signIn` callback qui
substitue l'id Darna réel à l'id Google avant `jwt()`. Logique de
liaison/création extraite dans `src/lib/google-account-linking.ts`
(`resolveGoogleUser`) — même raison que `login-failure-tracking.ts` :
importer `next-auth` dans un test unitaire échoue systématiquement, donc
toute logique testable doit vivre hors de `auth.ts`. `SessionUser` gagne
`hasPassword` (jamais le hash lui-même) ; `changePasswordAction` et
`deleteAccountAction` (`src/actions/profile.ts`) gèrent le cas
`passwordHash null` (formulaire de mot de passe masqué côté UI pour
`changePasswordAction` ; `deleteAccountAction` n'exige plus de mot de passe
pour un compte Google-only — la session authentifiée suffit). Bouton
« Continuer avec Google » sur connexion/inscription (`GoogleButton` dans
`AuthForms.tsx`, nouvelle action `signInWithGoogleAction`), rendu
uniquement si `isGoogleAuthEnabled()`. 14 tests dédiés
(`tests/google-account-linking.test.ts` ×5, cas Google-only ajoutés à
`tests/delete-account-action.test.ts` et `tests/profile-password.test.ts`)
+ suite complète (127 fichiers / 898 tests) verte. **Non vérifiable en
conditions réelles sans vraies clés Google (⛔ W6)** : vérifié que
`isGoogleAuthEnabled()` retourne bien `false` sans clés (bouton absent,
comportement actuel préservé à l'identique) et que le bouton apparaît
correctement avec des clés factices posées temporairement (redirection
`/api/auth/signin/google` déclenchée, échoue ensuite chez Google faute de
vraies clés — attendu). Le flux Google bout-en-bout réel reste à vérifier
manuellement une fois W6 posé.

---

## L9 — Mobile réel : contraste WCAG, PWA, budget perf (P2)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L9.1 | Chantier tokens de contraste + réactivation du gate axe `color-contrast` | P2 | ❌ |
| L9.2 | PWA minimale (manifest + SW de cache statique) | P2 | ❌ |
| L9.3 | Budget perf Lighthouse (nightly) + session device réel | P2 | ❌ (device 🧑 WASSIM) |

**L9.1** : la spec existe déjà dans `TODO-PRODUCTION.md` §Accessibility :
recalibrer `--color-body` / l'échelle d'opacité dans `src/app/globals.css`
pour que `text-body/60`-équivalent atteigne ≥ 4.5:1 sur `#faf7f1` et blanc,
et `text-white/50`-équivalent ≥ 4.5:1 sur le footer sombre ; puis réactiver
`color-contrast` dans le gate bloquant de `tests/e2e/10-a11y.spec.ts`.
Approche : introduire des tokens sémantiques (`text-muted`, `text-subtle`) et
remplacer mécaniquement les variantes d'opacité — PAS de retouche
composant par composant à l'œil. Captures avant/après sur ~6 pages clés
(règle projet), lumière ET sombre si le thème sombre existe.

**L9.2 — décisions tranchées** : manifest (nom, icônes 192/512 générées
depuis le logo, `display: standalone`, thème sable) + service worker MINIMAL :
cache-first sur `/_next/static` et icônes, network-first sur les pages,
JAMAIS de cache sur `/api` ni les server actions. Pas de mode offline. Le SW
doit être servi avec le bon scope et ne pas casser la CSP (pas de
`unsafe-eval`).

**L9.3** : job nightly Lighthouse CI (mobile, throttling) sur `/`, `/sejours`,
une page annonce — seuils : LCP < 2.5 s, CLS < 0.1 (warning, pas bloquant au
début). Session device réel (Android milieu de gamme, 4G) : parcours complet
FR puis AR/RTL — rapport écrit + captures.

---

## L10 — GTM : offre réelle + kit de démo (P1 — majoritairement 🧑 WASSIM)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| L10.1 | Script de démo investisseur/partenaire + vidéo 3 min | P1 | ❌ (après L6) |
| L10.2 | Argumentaire hôte (one-pager) autour du simulateur G1 + Yield Advisor | P1 | ❌ |
| L10.3 | ⛔ W7 — 20-30 annonces réelles vérifiées, 1-2 Wakils réels | P0 (business) | ❌ 🧑 WASSIM |

**L10.1** : dérouler et documenter LE parcours montré à un tiers : recherche
translittérée (« 7ammamet ») → carte → annonce vérifiée → réservation →
paiement Konnect sandbox → messagerie → avis → dashboard admin analytics —
en FR puis en AR/RTL, sur staging, au téléphone. Corriger uniquement ce qui
casse CE chemin. Livrer : `docs/DEMO_SCRIPT.md` + captures + vidéo.

**L10.2** : document/print (pas une nouvelle feature !) que Wassim peut
montrer à un hôte : simulateur de revenus, vérification gratuite au lancement
(`FREE_VERIFICATION_CREDITS`), « vous touchez 100 % de votre prix, le
voyageur paie nos frais », garantie no-show, zéro commission immo. S'appuyer
sur `.agents/product-marketing.md` (mis à jour par L5.8).

---

## Récapitulatif des priorités

- **P0 (conditionnent la mise en ligne)** : L1 → L2 → L3.1/L3.2 → L5.1/L5.2/L5.3/L5.5/L5.7/L5.8 → L6 (+ W1-W5)
- **P1 (avant de vrais utilisateurs)** : L3.3 → L4 → L5.4 → L7 → L8 → L10.1/L10.2 (+ W4 impérativement avant tout argent réel)
- **P2 (avant campagne d'acquisition)** : L3.4 → L9

## Pointeur de continuation

**⏳ EN ATTENTE** — À la clôture de ce chantier (toutes phases ✅ et mise en
production effective), passer ce pointeur à **➡️ ACTIF** vers
`PRIORITES_ROADMAP.md` : le **gel des features growth est alors levé**, et
« suivant » / « enchaîne » reprend la queue des vagues 4-5 (PM2, PM3, CR5,
G7, CR6, fin de CR2) — en les repriorisant d'abord à la lumière des premières
données réelles (c'est tout l'intérêt d'avoir lancé avant de continuer à
construire).

---

_Créé le 2026-07-27 à partir d'`AUDIT_V2.md` (audit CTO complet — y lire les
justifications détaillées de chaque décision). Même discipline que les autres
roadmaps : cocher ici + dans `PRIORITES_ROADMAP.md` dans la même PR que la
livraison._
