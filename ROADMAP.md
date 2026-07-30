# Darna — ROADMAP UNIQUE

> **Fichier unique de pilotage du projet.** Remplace et consolide TOUTES les
> roadmaps précédentes (`LANCEMENT`, `PRIORITES`, `GROWTH`, `CROISSANCE`,
> `QA`, `PAIEMENT_SUR_PLACE`, `MONETISATION_IMMO`, `TEST_AUTOMATION`,
> `INFRA`, `TODO-BETA`, `TODO-PRODUCTION`, `AUDIT_V1/V2`), supprimées le
> 2026-07-28 après récolte exhaustive de leurs items encore ouverts.
> L'historique git les conserve si besoin.
>
> **Objectif unique : mettre Darna en production, avec solidité technique,
> fonctionnelle et légale.** Tout ce qui n'y contribue pas est en phase 7+.
>
> Écrit pour être **autoporteur** : une session Claude (y compris un modèle
> moins capable, y compris une session neuve sans contexte) doit pouvoir
> exécuter n'importe quelle tâche sans relire d'autre document ni ré-arbitrer
> une décision. Références de fond conservées : `docs/INFRASTRUCTURE.md`
> (procédures de déploiement/rollback/restauration) et `CLAUDE.md`
> (conventions de code).

---

## 0. Comment cette roadmap s'utilise (règles de session — À LIRE EN PREMIER)

1. **« suivant » / « enchaîne » / « prochaine étape » = la PREMIÈRE tâche non
   cochée en partant du haut** (phase 1 → phase 8, dans l'ordre du fichier).
   Ne jamais choisir une tâche plus loin parce qu'elle semble plus facile ou
   plus intéressante. Ne jamais improviser une tâche absente de ce fichier.
2. **Une tâche = une branche = une PR.** Jamais de push direct sur `main`.
   Après le push : ouvrir la PR (`mcp__github__create_pull_request`).
3. **Une tâche bloquée sur Wassim (🧑) se saute** : la signaler dans la
   réponse, puis passer à la suivante exécutable. Ne jamais rester bloqué.
4. **Cocher dans la même PR que la livraison** : passer le statut à `✅` et
   noter le numéro de PR. Une roadmap qui dérive de la réalité est pire
   qu'une absence de roadmap.
5. **Règle anti-oubli (balayage d'impact)** : toute tâche qui modifie une
   règle transverse (montant, taux, promesse produit, modèle de données,
   wording d'une garantie) doit, DANS LA MÊME PR : corriger toutes les
   surfaces impactées (code, UI, i18n ×3, e-mails, seed, tests, e2e, k6),
   mettre à jour les documents qui décrivent l'ancienne règle (`CLAUDE.md`,
   `README.md`, ce fichier), et finir par un grep de clôture prouvant qu'il
   ne reste aucun résidu. Un résidu non justifié = tâche NON terminée.
6. **Livraison** (règle absolue, cf. `CLAUDE.md`) : chaque tâche codée finit
   par un **rapport de test** + des **captures** (`SendUserFile`) quand une UI
   est concernée + un bloc **« Comment tester »** avec les commandes exactes
   (dont `git fetch origin` → `git checkout <branche>` → `git pull`) et le
   parcours pas-à-pas avec les comptes démo exacts (mdp `darna2026`).
7. **Merge** : jamais sans (a) rapport de test validé par Wassim, (b) accord
   explicite de Wassim, (c) CI verte — sauf en mode orchestration autonome
   explicitement activé (cf. `CLAUDE.md`), qui autorise le merge automatique
   dès que (c) est vrai et que la tâche vient de CE fichier.
8. **Coup d'arrêt** : si une tâche révèle une ambiguïté produit, un choix
   d'architecture non tranché ici, ou touche au paiement/sécurité/schéma
   au-delà de ce qui est écrit → s'arrêter et demander à Wassim. Ne jamais
   trancher seul sur ces sujets.
9. **Ne jamais** : réintroduire un séquestre/détention de fonds (cf. §2),
   supprimer un test pour faire passer la CI, coder un faux appel API,
   ajouter une dépendance lourde sans nécessité, écrire une chaîne en dur
   (i18n dans les 3 dictionnaires), utiliser du SQL brut.

---

## 1. État des lieux au 2026-07-28 (vérifié, pas déclaratif)

**Ce qui existe et fonctionne** (~46 000 lignes de source, 905 tests verts) :
recherche translittérée + carte Leaflet, annonces double-verticale
(séjour/immo) avec vérification humaine Wakil, réservation transactionnelle
(hold 15 min, anti-double-booking SERIALIZABLE), paiement Konnect réel
optionnel, messagerie interne anti-bypass, annulations voyageur ET hôte,
garantie non-conformité, indemnité no-show, avis garantis par le schéma,
KYC (OTP e-mail/SMS/WhatsApp, CIN chiffrée AES-256-GCM), monétisation
(frais 10 %, boost, abonnements agence, crédits de vérification), crédits
parrainage/bienvenue avec ledger append-only, RGPD (consentement CNIL,
export, suppression/anonymisation, purges), i18n FR/EN/AR + RTL, PWA,
5 jobs planifiés, monitoring câblé (health, Sentry, alertes), dashboards
admin, SEO complet.

**Contrôles exécutés le 2026-07-28** : `tsc` 0 erreur · `lint` 0 erreur
(2 warnings) · **905 tests unitaires verts** · `build` OK sans base ·
couverture **61,25 % statements / 54,49 % branches**.

**Ce qui manque — le cœur de cette roadmap** :
- ❌ **Aucun déploiement.** Zéro environnement en ligne, zéro utilisateur
  réel, zéro annonce réelle. Le produit n'a jamais tourné hors du poste dev.
- ❌ **CI rouge sur 100 % des runs** depuis l'épuisement du quota GitHub
  Actions (22/07, reset ~31/07) : la pyramide CI n'a jamais tourné en vert,
  et **les 10 suites e2e + 2 suites API n'ont pas été exécutées depuis une
  semaine**, pendant laquelle le modèle de paiement, l'auth, le RGPD, les
  tokens visuels et un service worker ont changé. Angle mort fonctionnel.
- ❌ **Aucune validation juridique** du modèle économique (flux, TVA, CGU).
- ❌ Couverture sous les cibles ; pas de gate ; pas de secret scanning ;
  pas de protection de branche.
- ⚠️ **326 kB de JS partagé** (page `/sejours` : 364 kB) sur un marché
  mobile-first à data chère.

**Le déséquilibre à corriger** : 28 PR mergées en 32 h côté code, zéro item
humain débloqué côté lancement. Le produit est très en avance sur
l'entreprise. Cette roadmap inverse la priorité.

---

## 2. Décisions gravées — NE JAMAIS ROUVRIR sans arbitrage explicite de Wassim

**Modèle économique V1 « commission-only »** (2026-07-27) :
- Darna n'encaisse en ligne **QUE ses propres frais de service : 10 % du
  loyer**, ajoutés au-dessus du prix hôte (l'hôte touche 100 % de son prix).
  Exemple : séjour 1 000 TND → voyageur paie 100 TND en ligne (réservation
  confirmée) + 1 000 TND en cash à l'hôte à l'arrivée.
- **Aucun fonds de tiers ne transite jamais par Darna.** C'est ce qui la
  garde hors du champ des services de paiement (loi 2016-48/BCT) — à
  confirmer par W4. Les états `escrow` du schéma sont conservés **inertes**
  (réactivables en V2), aucune écriture nouvelle dessus.
- **Remboursement des frais** : FLEXIBLE jusqu'à J-2 · MODÉRÉE J-7 ·
  STRICTE non remboursable · **toujours 100 %** si annulation hôte ou
  non-conformité signalée < 24 h après le check-in.
- **Garantie no-show hôte** : indemnité = 100 % des frais encaissés,
  plafonnée à 3/hôte/mois, versée en crédits Darna (revenu propre de Darna,
  jamais l'argent du voyageur).
- **Rail 2 (`SUR_PLACE`, zéro paiement en ligne)** : possible uniquement si
  l'hôte l'active, avec acceptation manuelle + KYC CIN vérifié ; commission
  facturée à l'hôte a posteriori (`HostInvoice`, échéance 14 j, impayé →
  annonces masquées). Pas d'indemnité no-show sur ce rail.
- **Paiement 100 % en ligne (séquestre réel) = V2**, conditionné à W4.

**Architecture & infra** (détail dans `docs/INFRASTRUCTURE.md`) :
Vercel (app + Cron) · Neon PostgreSQL (pooler + directUrl) · Upstash Redis ·
Cloudflare R2 (`STORAGE_MODE=s3`) · Resend (e-mail) · Konnect (paiement).
Deux environnements : **staging** (sandbox, seedé, jamais indexé) et
**production** (données réelles, jamais de seed).

**Principes de code** : monolithe modulaire core/stay/immo (pas de split
physique) · Server Actions plutôt qu'API routes · zod + autorisation serveur
sur chaque mutation · prix recalculés serveur · zéro SQL brut · zéro
librairie UI lourde · i18n dans les 3 dictionnaires · CSP par nonce ·
**« zéro cron pour l'ÉTAT (lazy-expiry), un scheduler pour les ACTIONS
SORTANTES »** (`/api/jobs/tick`).

---

## 3. ⛔ Bloqué sur Wassim (aucune ligne de code ne peut les débloquer)

| # | Action | Débloque | Pourquoi c'est critique |
|---|---|---|---|
| W1 | Créer les comptes free tier : **Vercel, Neon, Upstash, Cloudflare R2, Resend** et coller les variables (checklist pas-à-pas dans `docs/INFRASTRUCTURE.md` §4) | P1.3 → tout | Le goulot d'étranglement unique du projet |
| W2 | **Domaine** : `darna.tn` (registrar tunisien, délai) — fallback `.com`/`.co`. Ne PAS bloquer staging dessus (`*.vercel.app` suffit) | P1.8 | `SITE_URL` définitif avant indexation/HSTS |
| W3 | **Dépôt public ou runner self-hosted** — le quota Actions est la cause racine de la CI rouge. Recommandation : public (aucun secret commité, atout crédibilité) | P1.2 | Sans ça, le problème revient chaque mois |
| W4 | **Avocat d'affaires tunisien** — brief en 5 points : (a) le modèle commission-only n'est pas un service de paiement, (b) TVA sur les frais, (c) validation des CGU réécrites, (d) statut fiscal de la location saisonnière, (e) cadrage du séquestre V2 | P3 → argent réel | Tout le modèle repose sur une hypothèse non validée |
| W5 | **Clés Turnstile réelles** (Cloudflare, widget Managed, gratuit) | P1.8 | Les clés de test valident tout et ne protègent RIEN |
| W6 | **Projet Google Cloud OAuth** (écran de consentement + client ID/secret) | P1.8 | Code livré, inactif sans clés |
| W7 | **Terrain** : 10 conversations propriétaires (Hammamet–Nabeul–Sousse), 20-30 annonces réelles, 1-2 Wakils | P6 | Le seul travail que le code ne peut pas faire |
| W8 | **Projet Sentry** (free tier) + DSN, **webhook d'alertes** (Telegram/Discord), **UptimeRobot** | P1.5 | Code livré, aveugle sans destinataire |

---

# PHASE 1 — METTRE EN LIGNE (P0 — rien d'autre ne compte)

> Aucune tâche des phases 2 à 8 ne doit être entamée tant que la phase 1
> n'est pas terminée, **sauf** si toutes ses tâches restantes sont bloquées
> sur Wassim — auquel cas passer à la phase 2 et revenir dès déblocage.

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P1.1 | Rattrapage e2e/API en local (angle mort d'une semaine) | P0 | ✅ PR #230 |
| P1.2 | CI verte de bout en bout (+ ⛔ W3) | P0 | ❌ (d fait, PR #231 — a/b/c attendent le quota) |
| P1.3 | Déploiement **staging** (⛔ W1) | P0 | ❌ 🧑 |
| P1.4 | Smoke tests contre staging + correctifs prod-only | P0 | ❌ (après P1.3) |
| P1.5 | Brancher les yeux : Sentry, alertes, uptime (⛔ W8) | P0 | ❌ 🧑 |
| P1.6 | Drill de restauration de backup + vérif du cron réel | P0 | ❌ (après P1.3) |
| P1.7 | Démo scriptée FR + AR/RTL + vidéo 3 min | P0 | ❌ (après P1.4) |
| P1.8 | Passage en **production** (⛔ W2/W5/W6) | P0 | ❌ 🧑 |

### P1.1 — Rattrapage e2e/API

**Pourquoi** : 28 PR ont été mergées sans qu'aucune suite e2e/API ne tourne
(CI au quota). Le paiement, l'auth, le RGPD, les tokens de contraste et un
service worker ont changé entretemps. Probabilité élevée qu'au moins une
régression fonctionnelle soit passée.

**Étapes** : démarrer Postgres local (`docker start darna-db` ou la commande
de `.env.example`), `npx prisma migrate reset --force` (applique + seed),
`npx playwright install --with-deps chromium`, puis `npm run test:e2e` et
`npm run test:api`. Corriger **tout** échec — chacun est une régression du
sprint du 27-28/07, pas un test à assouplir. Porter une attention
particulière à : `02-booking-payment-review` (modèle commission-only),
`05-cash-payment-noshow` (Rail 2 + indemnité), `01-auth` (rôle supprimé à
l'inscription + OAuth), `10-a11y` (gate `color-contrast` réactivé), et
l'impact éventuel du service worker PWA sur les parcours.

**Ne PAS faire** : désactiver un test, retirer une assertion, ou exclure une
règle axe pour faire passer la suite.

**Acceptation** : 10 suites e2e + 2 suites API vertes en local, rapport de
test détaillé + captures des parcours corrigés.

### P1.2 — CI verte de bout en bout

**Pourquoi** : les 30 derniers runs `ci.yml` sont en échec (job `fast` sans
logs = jamais démarré, quota épuisé). Le mode orchestration autonome n'est
pas légitime sans filet.

**Étapes** : (a) rappeler W3 à Wassim (dépôt public = minutes illimitées, ou
runner self-hosted) ; (b) après le reset du quota (~31/07) ou le déblocage
W3, déclencher un run **complet** (niveau 1 `fast` + niveau 2 `full` via le
label `ready-to-merge`) sur `main` et corriger jusqu'au vert ; (c) vérifier
que `nightly.yml` (semgrep + ZAP + k6 + Lighthouse) tourne et lire son
premier rapport ; (d) ajouter le **gate de couverture cliquet** dans
`vitest.config.ts` au niveau actuel + 2 points (63 % lines / 56 % branches)
appliqué au job `full` — effet cliquet, la couverture ne peut plus régresser.

**Acceptation** : un run vert sur `main`, gate de couverture actif, rapport
nightly lu et ses éventuels findings ouverts en tâches ici (phase 2).

**État au 2026-07-29** : (a) fait — rappel ci-dessous ; (d) **fait** (PR
#231) : seuils remplacés par couverture réelle mesurée (61,25 % stmt /
54,53 % branches / 57,67 % fn / 63,01 % lignes) moins ~1 pt de marge —
lines 62 / statements 60 / functions 56 / branches 53 — les anciens seuils
(43/41/36/35) ne protégeaient plus rien depuis longtemps. (b)/(c) **encore
bloqués** : les 19 derniers runs `ci.yml`/`nightly.yml` échouent tous en
2-11 s sans logs (rejet immédiat par quota, vérifié aussi sur `main` et des
branches sans rapport avec le projet en cours) — confirmé non résolu au
29/07, à réessayer après le 31/07 ou dès W3 débloqué. 🧑 **Rappel à
Wassim (W3)** : dépôt public (aucun secret commité, vérifié) ou runner
self-hosted — sans ça le problème revient chaque mois.

### P1.3 — Déploiement staging 🧑

**Bloqué sur W1** (création de comptes et collage de secrets — non codable).

> 📖 **GUIDE PAS-À-PAS COMPLET : `docs/INFRASTRUCTURE.md` §7.** Ouvrir ce
> document dès qu'on attaque cette tâche et le suivre **dans l'ordre, sans
> improviser** : liens d'inscription, réglages exacts de chaque service,
> tableaux des variables à poser, checklists à cocher, et les 3 pièges
> connus. Rôle de Claude sur cette tâche : dérouler ce guide avec Wassim,
> répondre à ses blocages, vérifier `/api/health` à la fin — puis enchaîner
> sur P1.4. Ne pas réécrire le guide dans la conversation : y renvoyer.

**Découpage en 2 paliers** (détaillé dans le guide) — ne pas attendre d'avoir
tout pour faire le palier 1 :
- **Palier 1 — 30-45 min, 2 comptes** (Vercel + Neon) : le site est **en
  ligne, seedé et partageable**. Tous les autres services ont un défaut démo
  sûr, l'app démarre sans eux.
- **Palier 2 — 1-2 h, 3 comptes de plus** (Upstash, R2, Resend, + Konnect
  sandbox) : uploads de photos, rate limiting multi-instance, e-mails,
  paiement, jobs. Sans lui le staging n'est pas fidèle.

**Deux arbitrages de coût que cette tâche fait remonter** (à valider par
Wassim, ils sortent de la contrainte « zéro service payant » qui visait le
développement, pas l'exploitation) :
1. **Le cron Vercel Hobby ne s'exécute qu'une fois par jour** alors que
   `vercel.json` demande `*/15 * * * *` → la relance d'abandon (P7/G6)
   arriverait jusqu'à 24 h trop tard. Solution retenue : cron externe gratuit
   (cron-job.org) appelant `/api/jobs/tick` avec `Authorization: Bearer
   <CRON_SECRET>`. Alternative : Vercel Pro.
2. **Le plan Hobby interdit l'usage commercial** → **Vercel Pro (~20 $/mois)
   sera nécessaire en P1.8**. Premier coût fixe réel du projet.

**Rappel des points qui se ratent** : `DIRECT_URL` distinct du pooler pour
les migrations · `TRUSTED_PROXY=true` · `CRON_SECRET` posé (sinon les 5 jobs
ne tournent jamais, en silence) · `STORAGE_MODE=s3` (le disque local ne
survit pas au serverless) · staging jamais indexé (`robots.ts` bascule sur
`SITE_URL`, qui doit donc différer de `https://darna.tn`) · `prisma migrate
deploy` (jamais `migrate dev`) puis `db seed` en staging **uniquement** ·
redeploy Vercel après tout ajout de variables.

**Acceptation** : `curl https://<staging>/api/health` → 200 avec `db` et
`redis` OK ; page d'accueil qui charge ; aucun avertissement `[env]` au boot.

### P1.4 — Smoke staging + correctifs prod-only

**Étapes** : exécuter la suite e2e contre staging (base URL Playwright
dédiée), puis parcourir manuellement ce que les tests ne couvrent pas :
CSP+HTTPS réels (aucune violation en console), cookies `Secure`/`HttpOnly`/
`SameSite`, **webhook Konnect en chemin NOMINAL** (jamais testé — Konnect ne
peut pas joindre localhost ; c'est la première vraie validation du paiement),
service worker PWA (installation, pas de HTML périmé servi), OAuth Google si
W6 débloqué, upload d'image vers R2, e-mail Resend réellement reçu.

**Acceptation** : rapport détaillé + captures ; chaque écart corrigé ou
ouvert en tâche ici.

### P1.5 — Brancher les yeux 🧑 (W8)

Le code est livré (`/api/health`, Sentry câblé, `notifyObservability`). Il
manque les destinataires : créer le projet Sentry et poser `SENTRY_DSN`,
créer le canal d'alertes et poser `OBSERVABILITY_WEBHOOK_URL`, brancher
UptimeRobot sur `/` et `/api/health` (5 min). Puis **vérifier qu'une erreur
volontaire remonte bien** dans Sentry et qu'une alerte métier arrive dans le
canal — un monitoring non testé n'est pas un monitoring.

### P1.6 — Drill de restauration + vérification du cron

**Étapes** : (a) restaurer un snapshot Neon de staging vers une base neuve
et démarrer l'app dessus — un backup jamais restauré est une hypothèse, pas
un backup ; (b) vérifier dans `AuditLog` qu'un `JOB_TICK` apparaît toutes
les 15 min (le contrôle qu'on oublie systématiquement : si `CRON_SECRET`
manque, les 5 jobs — réconciliation Konnect, relance d'abandon, rappels de
factures, purges RGPD — ne tournent jamais en silence) ; (c) documenter le
résultat dans `docs/INFRASTRUCTURE.md`.

### P1.7 — Démo scriptée + vidéo

**Pourquoi** : 46 000 lignes que personne ne sait raconter. Une démo
improvisée sur un produit dense échoue.

**Étapes** : dérouler et documenter LE parcours canonique sur staging, en FR
puis en **AR/RTL**, sur téléphone : recherche « 7ammamet » → carte → annonce
vérifiée → réservation → paiement des frais (Konnect sandbox) → messagerie →
avis → dashboard admin analytics. Livrer `docs/DEMO_SCRIPT.md` + captures +
vidéo 3 min. Corriger uniquement ce qui casse CE chemin.

### P1.8 — Production 🧑 (W2/W5/W6)

Même procédure que P1.3 avec : **jamais de seed**, clés Konnect réelles,
Turnstile réel (W5), OAuth Google réel (W6), `SITE_URL` = domaine final
(W2), `KYC_ENC_KEY` posé et jamais partagé avec staging. Post-déploiement :
rejouer la checklist de release (§Annexe B).

---

# PHASE 2 — SOLIDITÉ TECHNIQUE AVANT DE VRAIS UTILISATEURS (P0/P1)

> Consolidé depuis `TODO-BETA.md` et `QA_ROADMAP.md`, **dédupliqué contre le
> code réel du 2026-07-28** : les items déjà satisfaits (reset mot de passe,
> HMAC webhook, annulation/remboursement, Playwright, semgrep, ZAP, k6,
> politique d'auto-réservation, max photos, purge AuditLog, RGPD, contraste)
> ont été retirés. Ne subsiste que ce qui est **réellement ouvert**.

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P2.1 | Secret scanning (`gitleaks`) en CI + hook pre-commit | P0 | ✅ PR #232 |
| P2.2 | Protection de branche sur `main` | P0 | ❌ 🧑 (réglage GitHub) |
| P2.3 | Batch tests sécurité web : CSRF/SameSite, open redirect, SSRF, XSS stocké, headers, bypass de rate limit | P0 | ✅ PR #233 |
| P2.4 | Batch tests auth/session : flags de cookie, expiration, JWT altéré/`alg:none`/expiré, backoff progressif | P0 | ❌ 🧑 (backoff progressif seul — reste fait dans PR #234) |
| P2.5 | Projet de tests **d'intégration** sur Postgres éphémère (concurrence réelle) | P1 | ✅ PR #235 |
| P2.6 | Batch tests base : contraintes uniques, cascades FK, atomicité transactionnelle | P1 | ✅ PR #236 |
| P2.7 | Durcissement upload : strip EXIF + ré-encodage, tests polyglotte/magic bytes | P1 | ✅ PR #237 |
| P2.8 | Turnstile sur les formulaires publics restants (contact, wakil) | P1 | ✅ PR #238 |
| P2.9 | Fuzzing des entrées de server actions (payloads excessifs/imbriqués) | P2 | ✅ PR #239 |
| P2.10 | Couverture ≥ 85 % sur les modules critiques | P1 | ✅ PR #240+#241+#242 (périmètre nommé — global 80 % non atteint, voir note) |

### P2.1 — Secret scanning
Job CI `gitleaks` (action officielle) sur push + PR, et hook local optionnel.
Aucun secret n'est commité aujourd'hui (vérifié) — le but est d'empêcher le
premier. **Acceptation** : un secret factice introduit dans une branche de
test fait échouer le job.

### P2.2 — Protection de branche 🧑
Réglage GitHub (Settings → Branches) : `main` protégée, checks `fast` +
`full` obligatoires, historique linéaire. Aujourd'hui rien n'empêche un push
direct sur `main` — la règle n'existe que dans `CLAUDE.md`, pas dans l'outil.

### P2.3 — Batch tests sécurité web
Un fichier de tests par thème, tous listés dans l'ancien `TODO-BETA` :
- **CSRF/SameSite** : un POST cross-site vers une server action est rejeté.
- **Open redirect** : `safeCallbackUrl` (`src/actions/auth.ts`) rejette les
  domaines externes.
- **SSRF** : les sorties HTTP (Konnect, Resend, Meta, géocodage) sont
  épinglées sur des hôtes en liste blanche.
- **XSS stocké** : titre/description/avis/message sont encodés en sortie ;
  test de régression CSP sur `src/middleware.ts`.
- **Headers** : HSTS, `X-Frame-Options: DENY`, `nosniff`, nonce CSP présents.
- **Bypass de rate limit** : `x-forwarded-for` forgé est ignoré quand
  `TRUSTED_PROXY` est absent.

**Fait (PR #233)** : `safeCallbackUrl` vit en réalité dans `src/lib/redirect.ts`
(texte ci-dessus imprécis — `src/actions/auth.ts` ne fait que l'importer).
CSRF et Open redirect étaient déjà entièrement couverts par
`tests/api/security-regressions.spec.ts` (aucun doublon ajouté). SSRF
complété pour Konnect/Resend/Meta WhatsApp (même fichier, même patron de
capture `global.fetch` que le test géocodage déjà là) — les 4 intégrations
épinglent leur hôte en dur ou via variable d'env serveur, jamais depuis une
entrée utilisateur. Headers : nouveau `tests/api/security-headers.spec.ts`
(HSTS/XFO/nosniff/Referrer-Policy/Permissions-Policy de `next.config.ts`, via
une vraie requête HTTP) + `tests/middleware-csp.test.ts` (directives CSP et
fraîcheur du nonce — sert aussi de régression CSP pour le thème XSS). XSS
stocké : `tests/no-dangerous-html.test.ts` (garde-fou statique — aucun
`dangerouslySetInnerHTML` hors l'exception `JsonLd.tsx`) +
`tests/components/reviews-list.test.tsx` (preuve DOM qu'un commentaire/nom
contenant `<script>`/`<img onerror>` reste du texte inerte). Bypass de rate
limit : nouveau `tests/rate-limit-clientip.test.ts` (`clientIp()` — aucun test
existant n'exerçait un vrai en-tête forgé, tous mockaient `next/headers` à
vide ou remplaçaient `clientIp` elle-même).

### P2.4 — Batch tests auth/session
Flags de cookie (HttpOnly/Secure/SameSite) · expiration de session
(`maxAge`) · invalidation au changement de mot de passe (`tokenVersion`,
déjà implémenté — le tester) · JWT altéré, `alg:none`, expiré → rejetés ·
**backoff progressif** au-delà de la fenêtre fixe de 15 min de
`src/lib/rate-limit.ts`. Ajouter aussi la **matrice de permissions**
rôle × server action si `tests/permissions-gates.test.ts` ne la couvre pas
intégralement (le vérifier avant d'écrire du doublon).

**État au 2026-07-29 (PR #234)** :
- **Cookie/JWT** : fait. `tests/e2e/01-auth.spec.ts` — cookie
  `authjs.session-token` vérifié empiriquement (login réel via curl avant
  d'écrire le test) : `HttpOnly`, `SameSite=Lax`, `Path=/`, expiration
  ~30 j (défaut Auth.js v5, aucune config `cookies` personnalisée dans
  `src/lib/auth.ts` — comportement du framework, figé ici comme
  régression). Pas de `Secure` observé : normal en HTTP local, Auth.js
  l'ajoute automatiquement (+ préfixe `__Secure-`) dès qu'il détecte
  HTTPS, non testable dans ce sandbox. JWT altéré : Auth.js v5 chiffre
  la session (JWE, pas juste signée) — pas d'équivalent direct à
  l'attaque classique `alg:none` (rien à décoder sans la clé). Testé
  l'équivalent réel : un cookie corrompu (octets finaux altérés) →
  redirection propre vers `/connexion`, jamais une erreur serveur ou un
  accès accordé (vérifié empiriquement en curl avant d'écrire le test
  aussi). Expiration : couverte par la même assertion `maxAge`.
- **tokenVersion** : déjà entièrement couvert par
  `tests/session-token-version.test.ts` (6 cas) — rien ajouté, doublon
  évité.
- **Matrice de permissions** : investiguée en profondeur (agent dédié,
  10 fichiers d'actions lus intégralement + 6 scannés). Verdict : **aucune
  faille trouvée**. Les 6 fichiers sans gate nommé
  (`auth.ts`, `destination.ts`, `geocode.ts`, `listing-activity.ts`,
  `onboarding.ts`, `wakil.ts`) sont légitimement publics/pré-auth ; la
  review Wakil (sensible) est bien gate-ée par `requireAdmin()` dans
  `admin.ts`, pas dans `wakil.ts` (juste une question d'organisation de
  fichiers). L'invariant CLAUDE.md « propriété vérifiée en base » tient
  partout : `requireOwnProperty()` (`properties.ts`, déjà couvert par
  `tests/property-idor.test.ts`) + contrôles inline `ownerId`/`guestId`/
  `hostId === user.id` dans `bookings.ts` (déjà couvert par
  `tests/booking-idor.test.ts`, 11 cas), `host-invoices.ts`,
  `messages.ts`. Rien ajouté : la matrice existe déjà, fédérée entre
  plusieurs fichiers `*-idor.test.ts` plutôt que centralisée dans
  `permissions-gates.test.ts` (qui ne teste que les 4 fonctions de garde
  elles-mêmes, pas leur usage par action — les deux niveaux sont
  couverts, juste dans des fichiers séparés). Note hors-scope (pas un
  trou d'autorisation) : `searchAddressAction` (`geocode.ts`) n'a aucun
  rate limiting, contrairement à toutes les autres actions publiques —
  item de durcissement coût/abus, à ouvrir séparément si besoin.
- **Backoff progressif** : ⛔ **non fait, arbitrage produit nécessaire**.
  Aucune implémentation existante (`grep backoff` ne trouve que cette
  ligne de roadmap), aucun paramètre spécifié (courbe de montée, plafond,
  condition de reset) — une implémentation nécessite un choix produit
  que la roadmap ne tranche pas. Demandé à Wassim séparément.

### P2.5 — Tests d'intégration sur Postgres réel
Aujourd'hui `tests/integration/booking-concurrency.integration.test.ts` est
**skippé**. Créer un projet Vitest dédié qui tourne contre un Postgres
éphémère (service CI existant ou Testcontainers) et y promouvoir : la
concurrence de double-réservation (vraies transactions parallèles), la
course paiement + réservation simultanée, l'expiration du hold de 15 min qui
libère le créneau, l'intégrité du prix (le serveur ignore le total client).
**Acceptation** : le skip disparaît, le job tourne dans le niveau 2 de la CI.

**Fait (PR #235)** : correction du diagnostic d'abord — le fichier
existant n'était pas réellement « skippé » (`describe.runIf(DB_ENABLED)`
le faisait déjà tourner dès que `DATABASE_URL` est défini, y compris dans
le job `full` qui a toujours eu un service Postgres). Le vrai manque était
l'ABSENCE d'un projet Vitest dédié (les 3 nouveaux scénarios demandés) et
l'ambiguïté du mécanisme `runIf`. Troisième projet `integration` ajouté à
`vitest.config.ts` (`tests/integration/**/*.integration.test.ts`, exclu du
projet `node` pour ne jamais tourner deux fois), `npm run test:integration`
pour l'invoquer seul. Aucun changement CI nécessaire : `npm run
test:coverage` (déjà dans le job `full`, déjà avec un service Postgres)
inclut désormais ce projet automatiquement — confirmé en local (coverage
inchangée, légèrement remontée : 61,33/54,69/57,67/63,10 %).
Les 3 scénarios promus : course paiement (webhook vs retour user —
`settleKonnectBooking` appelé 2× en parallèle, une seule confirmation, un
seul jeu de notifications) ; expiration paresseuse du hold (un hold
`EN_ATTENTE` expiré n'empêche pas une nouvelle réservation sur les mêmes
dates, prouve l'invariant « zéro cron pour l'état ») ; intégrité du prix
(prix/total injectés dans le `FormData` sans aucun effet sur le montant
persisté). **Flakiness trouvée et corrigée en cours de route** : les 2
fichiers d'intégration exécutés en parallèle (comportement par défaut
Vitest) pouvaient se contentionner mutuellement au niveau moteur (abandon
de sérialisation P2034 sur une transaction sans rapport avec l'autre
fichier) — confirmé non reproductible en isolation, uniquement dans la
suite complète. `fileParallelism: false` sur le seul projet `integration`
(vraies transactions Postgres, contrairement à `node`/`jsdom` où Prisma
est mocké) : 3 runs complets consécutifs stables après le fix.

### P2.6 — Batch tests base
Contraintes uniques (`email`, `cinHash`, `slug`, `paymentRef`,
`Review.bookingId`, `Favorite[userId,propertyId]`) · cascades et `SetNull`
(supprimer un utilisateur, un dossier de favoris) · atomicité (création de
réservation, réordonnancement de photos). Ces tests protègent des invariants
qui ne se voient qu'en base — à écrire dans le projet P2.5.

**Fait (PR #236)** : `tests/integration/db-constraints.integration.test.ts`
(projet `integration` de P2.5, VRAI Postgres) — 11 tests. Contraintes
uniques : `User.email`, `User.cinHash`, `Property.slug`,
`Booking.paymentRef`, `Review.bookingId`, `Favorite[userId,propertyId]`
(P2002 attendu sur le doublon). Cascades/SetNull : supprimer un hôte
supprime ses annonces, supprimer un voyageur supprime ses réservations
(`onDelete: Cascade`) ; supprimer un dossier de favoris déclasse ses
favoris sans les supprimer (`onDelete: SetNull`). Atomicité :
réordonnancement de photos (`setCoverPhotoAction`) laisse des positions
consécutives/uniques après coup + preuve directe qu'un `$transaction`
batch échoue TOUT ENTIER si une seule étape est invalide (aucune mise à
jour partielle ne persiste). Création de réservation déjà couverte par
P2.5 (course/expiration/prix), pas dupliquée ici.

### P2.7 — Durcissement upload
Aucun strip EXIF aujourd'hui (vérifié : rien dans `storage.ts` /
`image-compress.ts`) : une photo d'annonce peut donc publier les
coordonnées GPS du domicile de l'hôte. Ré-encoder à l'upload (supprime EXIF
et neutralise les polyglottes), et tester le rejet des fichiers à magic
bytes incohérents / surdimensionnés. La limite de 8 photos existe déjà
(`MAX_PHOTOS_PER_PROPERTY`) — juste la couvrir par un test.

**Fait (PR #237)** : `readValidatedImage()` (`src/lib/storage.ts`) décode
puis ré-encode chaque image via `sharp` après la vérif de magic bytes —
supprime EXIF/GPS (jamais de `.withMetadata()`), neutralise tout octet
superflu après les données image valides (polyglotte), et rejette en plus
un buffer aux magic bytes valides mais non décodable. `sharp` était déjà
une dépendance directe (ajoutée incidemment via PR #235) — première
utilisation réelle ici, aucun changement `package.json`. Tests :
EXIF/GPS prouvé supprimé après ré-encodage, payload polyglotte prouvé
neutralisé, buffer non décodable rejeté, borne `MAX_PHOTOS_PER_PROPERTY`
couverte dans `addPhotosAction`. Vérifié aussi en conditions réelles
(serveur `next dev` + Playwright ad hoc) : upload d'une vraie photo à EXIF
GPS embarqué via `/dashboard/annonces/[id]/modifier`, comparaison directe
du fichier écrit sur disque par le serveur — EXIF bien absent du fichier
stocké.

### P2.8 — Turnstile sur contact et wakil
Le CAPTCHA n'est câblé que sur inscription/connexion
(`src/components/auth/`). Les formulaires publics de contact d'annonce et de
candidature Wakil sont ouverts au spam — mêmes composants, même helper
`verifyTurnstile()` fail-closed.

**Fait (PR #238)** : `verifyTurnstile()` câblé dans `createContactRequestAction`
(`src/actions/contact.ts`) et `applyWakilAction` (`src/actions/wakil.ts`),
même ordre que l'auth (rate-limit → CAPTCHA → écriture). `TurnstileWidget`
ajouté dans `ContactForm.tsx`/`WakilForm.tsx` via une prop `captchaSiteKey`
calculée côté serveur (`ImmoContactSection.tsx`, `devenir-wakil/page.tsx`),
même pattern que `connexion`/`inscription`. Dual-mode inchangé : rien de
visible sans `CAPTCHA_MODE=turnstile`. CSP déjà conditionnée globalement
dans `middleware.ts`, aucun changement requis. Tests : 4 nouveaux
(succès/rejet avant écriture) dans `tests/contact-action.test.ts` et
`tests/wakil-action.test.ts`. Vérifié aussi en conditions réelles
(captures avant/après démo + mode actif) : CSP élargie et widget injecté
au bon endroit du DOM confirmés ; rendu visuel final du challenge
Cloudflare non capturable dans ce sandbox (`challenges.cloudflare.com`
bloqué par le proxy sortant de l'environnement — hors code applicatif).

### P2.9 — Fuzzing des server actions
Pour chaque action mutante : payload invalide, champs requis manquants,
chaînes/tableaux surdimensionnés, structures imbriquées. Vérifier que zod
rejette proprement et que l'erreur reste générique (aucune stack, aucune PII).

**Fait (PR #239)** : survol exhaustif préalable (23 fichiers `src/actions/*.ts`,
84 fonctions `*Action`) — patron déjà uniforme partout (`schema.safeParse()` →
message générique fixe), **aucune fuite trouvée** (aucun `err.message`/stack/
`parsed.error` renvoyé au client ; les rares `throw err` retombent sur le
digest générique de Next.js en prod, hors périmètre applicatif). Plutôt que
dupliquer ce patron déjà uniforme sur les 84 fonctions, fuzzing ciblé sur un
échantillon représentatif couvrant les 4 dimensions + le seul vrai gap
détecté (champ fichier NON zod) : `saveSearchAction` (ville manquante,
`prixMin` avec structure imbriquée injectée en chaîne), `blockDatesAction`
(propertyId manquant, date malformée, `reason` > 120), `updatePropertyAction`
(tableau `amenities` invalide/surdimensionné — seule vraie cible « tableau »
du schéma), `updateProfileAction` (nom manquant/> 100, téléphone imbriqué),
`sendMessageAction` (bookingId manquant/imbriqué, message > 2000),
`updateAvatarAction` (champ `avatar` NON zod — valeur non-File, File vide,
champ absent). 23 tests nouveaux dans 3 nouveaux fichiers
(`tests/saved-search-action.test.ts`, `tests/properties-fuzzing.test.ts`,
`tests/profile-fuzzing.test.ts`) + 3 ajoutés à `tests/messages-action.test.ts`
(mocks déjà en place). Le reste des ~84 actions suit un patron identique et
vérifié pattern-matché lors du survol — pas dupliqué action par action ici.

### P2.10 — Couverture des modules critiques
Cible **85 %** sur `payments`, `bookings`, `auth`, `crypto`, `otp`,
`rate-limit`, `storage`, `session`, plus les 5 jobs de `src/lib/jobs/` et le
flux de suppression/anonymisation RGPD (il touche une vingtaine de relations
— une erreur y est irréversible). Global visé : 80 %. Monter le gate cliquet
de P1.2 au fur et à mesure.

**Fait (1ʳᵉ tranche, PR #240)** : `storage.ts` (36,66 % → 98,33 % lignes —
les deux drivers disque/S3 n'avaient aucune couverture directe, seule
`readValidatedImage()` l'était), `rate-limit.ts` (60,41 % → 95,83 % lignes —
`incrementWindowedCounter()` n'avait aucune couverture, ni le repli
in-memory sur erreur Redis), `crypto.ts` (75 % → 100 % fonctions —
`isEncryptionEnabled`/`ensureEncrypted`/`hashResetToken` non testés). Gate
cliquet remonté à 65/63/59/56 (mesure réelle 66,04/64,26/60,11/57,34 %
moins ~1 pt de marge). **Reste** : `src/actions/auth.ts` (73,86 %, à
reprendre) ; `src/lib/auth.ts`/`google-auth.ts` (0 % — raison
architecturale documentée dans la PR #240, pas un oubli : c'est la
config NextAuth elle-même, exercée en réalité par les e2e Playwright
contre un vrai serveur, invisible du coverage Vitest qui n'instrumente
que le code exécuté DANS le process Vitest ; refactorer `authorize()` en
fonction exportée séparément pour la rendre unit-testable serait un
chantier à part, pas tranché ici) ; `bookings`/`otp`/`session`/jobs
individuels déjà à 100 % avant même cette tranche, rien à faire ; flux
RGPD (account-export/delete-account) pas encore mesuré isolément ; global
encore loin de 80 % (64,26 % stmt).

**Fait (2ᵉ tranche, PR #241)** : `src/actions/auth.ts` (73,86 % → 95,45 %
lignes) — `loginAction()` n'avait aucune couverture Vitest (seulement des
mocks côté composant + des e2e Playwright réels, invisibles du coverage
v8) : nouveau `tests/login-action.test.ts` (validation, CAPTCHA, calcul
de la destination de redirection avec `@/lib/redirect` NON mocké,
`AuthError` → générique, erreur non-`AuthError` laissée passer). Branche
« rate limit dépassé » ajoutée à `registerAction`/
`requestPasswordResetAction`/`resetPasswordAction` (jamais testée avant,
toujours mockée à `true`). Gate cliquet remonté à 66/64/60/57 (mesure
réelle 66,73/64,92/60,48/58,22 % moins ~1 pt). **Reste identique** :
`src/lib/auth.ts`/`google-auth.ts` (0 %, raison architecturale
inchangée) ; flux RGPD pas mesuré isolément ; global encore loin de 80 %
(64,92 % stmt).

**Fait (3ᵉ tranche, PR #242)** : `src/actions/profile.ts` — c'est le
fichier qui porte le flux RGPD cité par P2.10 ; vérifié en premier que
le chemin irréversible (`deleteAccountAction`/`becomeHostAction`) était
déjà à 100 % (`tests/delete-account-action.test.ts`/
`tests/become-host-action.test.ts` existants) — le vrai trou était
`updateProfileAction`/`updateAvatarAction`/`removeAvatarAction`
(profil/avatar, pas le chemin sensible), 74,25 % → 99 % lignes. Nouveau
`tests/profile-update.test.ts` (recalcul `phoneVerified` seulement si le
numéro change, rate limit avatar, échec de validation upload,
remplacement avatar + suppression best-effort de l'ancien fichier,
no-op silencieux si pas de photo). Gate cliquet remonté à 67/65/60/58
(mesure réelle 67,48/65,64/60,67/58,78 % moins ~1 pt).

**Clos (arbitrage Wassim, 2026-07-29)** : à ce stade, les 8 modules
nommés + les 5 jobs + le flux RGPD sont tous ≥ 85 % (la plupart à
100 %) — seul `src/lib/auth.ts`/`google-auth.ts` reste à 0 %, exclu
pour la raison architecturale documentée plus haut (config NextAuth,
exercée uniquement par les e2e Playwright, invisible du coverage
Vitest). Le « global visé 80 % » du ticket n'est PAS atteint
(65,64 % stmt) — combler cet écart demanderait de tester des fichiers
hors du périmètre « modules critiques » nommé (composants UI, etc.),
un chantier à portée ouverte distinct. Wassim a tranché : clore P2.10
sur le périmètre nommé plutôt que d'élargir indéfiniment. Un futur
chantier de couverture globale, s'il est repris, devrait être une
tâche roadmap séparée avec son propre périmètre explicite plutôt qu'un
prolongement de P2.10.

---

# PHASE 3 — SOLIDITÉ LÉGALE (P0 avant le premier dinar réel)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P3.1 | ⛔ W4 — avis juridique (flux, TVA, CGU, fiscalité, V2) | P0 | ❌ 🧑 |
| P3.2 | Intégrer les conclusions de W4 (CGU, affichage TVA, mentions) | P0 | ❌ (après P3.1) |
| P3.3 | Versionnement des CGU + traçabilité de l'acceptation | P1 | ❌ (CGU hôte fait, PR #253 — CGU générale hors scope, voir note) |
| P3.4 | Revue de périmètre PCI + politique de rétention/rotation CIN | P1 | ✅ PR #254 |
| P3.5 | Intégrité du journal d'audit (anti-altération) | P2 | ✅ PR #255 |

### P3.1 🧑
Envoyer le brief en 5 points (§3, W4). Non bloquant pour un staging en mode
sandbox ; **bloquant absolu avant tout encaissement réel**.

### P3.2
Selon la réponse : ajuster l'affichage des frais (TVA incluse ou non — ça
change le prix affiché et la facturation dès la première réservation),
corriger les clauses des CGU / CGU hôte, compléter les mentions légales
(forme juridique, matricule fiscal, éditeur). Appliquer la règle anti-oubli
(§0.5) : ce changement est transverse.

### P3.3
Aujourd'hui l'acceptation des CGU hôte est horodatée
(`cashTermsAcceptedAt`) mais **la version acceptée n'est pas tracée** : en
cas de litige, impossible de prouver ce que l'hôte a accepté. Ajouter un
numéro de version aux CGU/CGU hôte et le stocker à l'acceptation ; imposer
une ré-acceptation quand la version change.

**Fait pour la CGU hôte (PR #253)** : investigation préalable a montré que
« CGU / CGU hôte » recouvrait deux chantiers de taille très différente —
la CGU hôte (paiement cash) avait déjà un mécanisme d'acceptation
(`cashTermsAcceptedAt` sur `Property`) à qui il suffisait d'ajouter une
version ; la CGU générale du site (`/cgu`) n'a **aucun** mécanisme
d'acceptation aujourd'hui (page statique, jamais cochée à l'inscription)
— la versionner exigerait de construire ce mécanisme de zéro et de
trancher le sort des comptes existants (backfill silencieux ou
ré-acceptation forcée), un vrai chantier produit distinct. Question posée
explicitement à Wassim : périmètre limité à la CGU hôte, CGU générale
non traitée.

Implémenté : `Property.cashTermsVersion` (migration avec backfill à 1
pour les acceptations déjà enregistrées — elles ont accepté le texte
ACTUEL, qui EST la version 1, donc aucun hôte existant n'est forcé de
ré-accepter immédiatement), `CURRENT_CASH_TERMS_VERSION` dans
`src/lib/config.ts` (à incrémenter au prochain changement de contenu),
`resolveCashPayment()` force la ré-acceptation quand le mode est déjà
actif mais la version stockée est obsolète (pas seulement sur la
transition false→true comme avant). Bug latent corrigé au passage : le
ProductEvent `CASH_PAYMENT_ENABLED` partait sur toute pose de
`cashTermsAcceptedAt` y compris une ré-acceptation — aurait faussé le
taux d'adoption (§L5.7 discipline IN4) une fois la ré-acceptation
possible ; isolé via un nouveau champ `isNewActivation`.

**Reste** : CGU générale (site entier) — non planifiée ici, à traiter
comme un futur point roadmap séparé si Wassim le priorise, avec son
propre arbitrage sur les comptes existants.

### P3.4
Confirmer par écrit qu'aucune donnée de carte ne touche jamais Darna
(paiement hébergé Konnect) — document d'une page, demandé par tout
partenaire. Documenter la durée de conservation de la CIN chiffrée, qui y
accède, et **tester une rotation de `KYC_ENC_KEY`** (procédure jamais
éprouvée : si la clé fuit, il faut savoir la changer sans perdre les données).

**Fait (PR #254)** : `docs/SECURITE_DONNEES.md` (référencé depuis
`CLAUDE.md`) couvre les trois volets. Périmètre PCI confirmé en lisant le
code (`src/lib/konnect.ts` : `initKonnectPayment()` ne manipule que
`payUrl`/`paymentRef`, jamais de données de carte). Rétention/accès CIN
documentés en identifiant le SEUL chemin de code qui déchiffre
(`src/app/contrat/[id]/page.tsx`, accès restreint propriétaire/auteur de
la demande). Rotation `KYC_ENC_KEY` : `scripts/rotate-kyc-key.ts` écrit
ET testé (pas seulement documenté) contre une base locale avec une CIN
chiffrée manufacturée — rotation réussie vérifiée via le vrai
`decryptSensitive()`/`hashCin()`, dry-run vérifié sans écriture, échec
avec une mauvaise clé vérifié sans corruption (échec net, aucune CIN
loguée). Runbook §3 documente l'ordre impératif des étapes (la rotation
doit terminer intégralement avant que l'environnement de prod ne bascule
sur la nouvelle clé, `KYC_ENC_KEY` servant à la fois de clé ET de poivre
pour `cinHash`). Testé uniquement en local — aucune base de production
accessible depuis cet environnement, limite documentée explicitement
dans le runbook.

### P3.5
Le journal d'audit est la preuve en cas de litige ou de contrôle. Le rendre
détectablement inaltérable (par exemple un chaînage de hachage par
enregistrement) pour les événements financiers et d'identité.

**Fait (PR #255)** : chaînage SHA-256 (`hash`/`prevHash`) sur
`CHAINED_ACTIONS` (`src/lib/audit.ts`) — paiements, réservations, factures
hôte, crédits, remboursements, vérifications KYC/CIN/téléphone/e-mail,
vérification d'annonce, promotion Wakil, suspension/réactivation/
suppression de compte. Écritures concurrentes protégées par
compare-and-swap (`updateMany`, même idiome que `settleKonnectBooking`),
zéro SQL brut. **Deux bugs réels trouvés via un test de charge à 25
écritures vraiment concurrentes contre Postgres réel** (pas de simples
mocks) : (1) effet troupeau sans jitter entre les tentatives de CAS — 3/25
échouaient même après 20 tentatives, corrigé ; (2) le script de
vérification triait par `createdAt` au lieu de suivre les liens
`prevHash`/`hash` — produisait de fausses alertes de rupture sous
concurrence réelle, corrigé avant tout usage. `scripts/backfill-audit-
chain.ts` (historique) et `scripts/verify-audit-chain.ts` (lecture seule,
exit 1 si rupture) testés de bout en bout, y compris une altération
manuelle directe d'une ligne détectée avec précision. Détail complet :
`docs/SECURITE_DONNEES.md` §4.

**Phase 3 close ici** pour tout ce qui ne dépend pas de Wassim — P3.1
(brief W4) et P3.2 (intégration des conclusions) restent ⛔🧑, bloquants
avant tout encaissement réel mais non bloquants pour la suite du
développement.

---

# PHASE 4 — PERFORMANCE & MOBILE (P1 — avant toute acquisition)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P4.1 | Analyse de bundle et réduction du JS partagé | P1 | ❌ (motion + Leaflet traités, PR #256 — bundler/i18n reportés par choix de Wassim) |
| P4.2 | Budget Lighthouse **bloquant** | P2 | ❌ (mesuré, non actionné par choix de Wassim — voir note) |
| P4.3 | Session de test sur device réel (FR + AR/RTL) | P1 | ❌ 🧑 |

### P4.1
Mesuré le 2026-07-28 : **326 kB de JS partagé**, `/sejours` à 364 kB — sur
un marché mobile-first > 90 % à data chère, c'est plusieurs secondes avant
le premier contenu, sur la page la plus critique du funnel.
**Étapes** : brancher `@next/bundle-analyzer` et mesurer AVANT de décider.
Suspects à confirmer : la librairie `motion` (4 composants seulement — des
animations CSS suffiraient probablement, cohérent avec la contrainte « zéro
librairie UI lourde »), l'embarquement simultané des 3 dictionnaires côté
client (seule la locale active devrait l'être), et la confirmation que
Leaflet reste bien hors du bundle initial.
**Acceptation** : rapport chiffré avant/après ; cible < 200 kB partagé.

**Fait (PR #256)** : les 3 suspects nommés, tous investigués et chiffrés
(pas estimés). **Leaflet** déjà correctement en import dynamique
`ssr:false` — confirmé hors bundle initial, rien à faire. **`motion`**
retiré entièrement (4 usages simples réécrits en CSS pur +
`IntersectionObserver`, `useRevealOnScroll.ts`) — gain réel mesuré sur
les pages qui l'utilisaient : `/sejours` 364→326 kB, `/hote/[id]`
355→317 kB, `/immobilier` 359→322 kB (mais **pas** sur le chiffre
« partagé par toutes les pages », motion n'en faisait pas partie).
**i18n** (fr/en/ar bundlés ensemble, ~390 Ko de source) confirmé comme
contributeur réel du JS partagé — tentative de correctif par rendu
conditionnel serveur de 3 `LocaleProviderFr/En/Ar` : hypothèse fausse
(vérifiée sur deux builds réels, Turbopack et webpack), le chunking
Next.js se décide au build, pas par requête, donc une branche
conditionnée par une valeur runtime (cookie) ne se découpe pas
statiquement — refactor annulé proprement, aucune régression mais aucun
gain. Un vrai correctif exigerait un chargement async (Suspense, risque
de flash sur ~100 composants clients) ou des URLs par locale (routage
plus large) — soumis à Wassim.

**Découverte hors périmètre** : sous Turbopack (config actuelle),
326 kB partagé ; le MÊME code compilé en webpack classique ne fait que
191 kB (déjà sous la cible 200 kB) — le choix du bundler est le levier
le plus important pour ce ticket, plus que le code applicatif.

**Tranché par Wassim (2026-07-30)** : rester sur Turbopack pour
l'instant (webpack ralentirait probablement les builds CI/Vercel) et ne
pas lancer le chantier i18n maintenant (limite documentée, à reprendre
si le poids de page devient un problème mesuré). Le JS partagé reste
donc à 326 kB — cible < 200 kB **non atteinte**, décision produit
assumée plutôt qu'un chantier supplémentaire non demandé.

`@next/bundle-analyzer` branché (`ANALYZE=true npm run build`) pour
rejouer la mesure facilement si repris plus tard.

### P4.2
Rendre bloquant le job Lighthouse (aujourd'hui informatif, `nightly.yml`) :
LCP < 2,5 s en mobile throttlé sur `/`, `/sejours` et une page annonce.

**Mesuré (2026-07-30, build prod local, mobile throttlé simulé)** avant de
rendre quoi que ce soit bloquant : les 3 pages échouent LARGEMENT la
cible aujourd'hui — Accueil LCP 4,61 s, Recherche 4,53 s, Annonce
4,12 s (CLS bon, 0.000 partout). Très probablement lié au même poids JS
que P4.1 (326 Ko partagé, cf. note P4.1) — rendre le check bloquant
maintenant l'aurait fait échouer immédiatement sans qu'aucun travail de
perf n'ait encore été fait. **Tranché par Wassim (2026-07-30)** :
cohérent avec sa décision P4.1, ne pas rendre bloquant pour l'instant —
Lighthouse reste informatif (`nightly.yml`, comportement inchangé). À
reprendre en même temps que le chantier bundle si/quand repriorisé.

### P4.3 🧑
Un Android milieu de gamme, en 4G, parcours complet FR puis AR/RTL, PWA
installée depuis l'écran d'accueil. Jamais fait. Rapport + captures.

---

# PHASE 5 — OPÉRATIONS & FIABILITÉ (P1)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P5.1 | Runbook opérationnel « jour 1 » | P1 | ✅ PR #260 |
| P5.2 | Balayage d'intégrité des données (job) | P1 | ✅ PR #262 |
| P5.3 | Tests de dégradation gracieuse (Redis/Konnect/Resend down) | P1 | ✅ PR #263 |
| P5.4 | Budget d'erreur + seuils d'alerte | P2 | ❌ |
| P5.5 | Gate de sécurité des migrations | P2 | ❌ |
| P5.6 | Scan d'image/dépendances + SBOM | P2 | ❌ |

### P5.1
`docs/RUNBOOK.md` : que faire si un paiement échoue, si une facture hôte
reste impayée, si le cron ne tourne plus, si une alerte tombe la nuit, si le
site est down, comment faire un rollback (renvoi vers
`docs/INFRASTRUCTURE.md` §5). Public : Wassim en tant qu'opérateur unique.
Une réponse « je regarde le matin » est acceptable — mais elle doit être
écrite.

**Fait (PR #260)** : chaque section vérifiée contre le comportement réel du
code (pas rédigée de mémoire) — notamment que le modèle commission-only
rend un échec de paiement Konnect sans conséquence sur l'hébergement
(la réservation expire d'elle-même), que le traitement des factures hôte
impayées est déjà entièrement automatique, et — honnêteté assumée — qu'il
n'existe aujourd'hui aucune alerte qui réveillerait Wassim la nuit
(⛔ W8 non tranché).

### P5.2
Job ajouté à `/api/jobs/tick` : détecte les incohérences silencieuses
(réservation sans annonce, `escrow` orphelin, facture sans réservation, FK
pendante, crédit dont le ledger ne somme pas au solde du wallet) et alerte
via `notifyObservability`. Sur un produit financier, une corruption
silencieuse coûte plus cher qu'une panne visible.

**Fait (PR #262)** : 5ᵉ job (`data-integrity-check`), lecture seule.
Vérifié en lisant le schéma que toutes les FK couvertes sont déjà
appliquées par Postgres/Prisma (`onDelete: Cascade`) — un résultat non
nul signale donc une manipulation hors application ou un bug de
migration, jamais un chemin d'usage normal. `notifyObservability` du
ticket ne correspond à aucune fonction existante — utilisé le
mécanisme réel (`captureError`). Ledger de crédits vérifié contre
`CreditWallet.balance = SUM(CreditTransaction.amount)`
(`VerificationWallet` exclu, pas de ledger associé par design).
Requêtes testées contre la base locale réelle en plus des mocks (0
incohérence sur données saines).

### P5.3
Tester que l'app survit à : Redis indisponible (le rate limiting doit
retomber en mémoire sans planter), Konnect en timeout (la réservation reste
`EN_ATTENTE`, aucune confirmation fantôme), Resend en erreur (l'action
métier réussit quand même, l'e-mail est journalisé comme échoué).

**Fait (PR #263)** : les 3 scénarios investigués individuellement. Redis
et Resend étaient déjà couverts (Redis depuis P2.10 ; Resend dans
plusieurs flux existants, vérifié qu'ils couvrent bien les DEUX exigences
— résout sans exception ET journalise l'échec, pas seulement l'un des
deux). Konnect en timeout était le seul trou réel : le code
(`startKonnectPaymentAction`) gérait déjà correctement le cas, juste
jamais testé — 2 tests ajoutés. Aucun changement de code applicatif,
seule la couverture manquait.

### P5.4
Définir les seuils qui déclenchent une alerte : taux de 5xx, pic d'échecs
d'authentification, taux d'échec de paiement, job qui ne tourne plus depuis
1 h. Brancher sur le canal W8.

### P5.5
Une migration destructive (DROP/ALTER de colonne) ne doit pas passer sans
approbation explicite : job CI qui détecte les mots-clés destructifs dans
`prisma/migrations/` et exige un label sur la PR.

### P5.6
`npm audit --audit-level=high` est déjà dans la CI. Ajouter la génération
d'un SBOM et un scan de vulnérabilités (Trivy) pour la chaîne
d'approvisionnement.

---

# PHASE 6 — TERRAIN & PREMIERS UTILISATEURS (business — dès staging en ligne)

| # | Tâche | Prio | Statut |
|---|---|---|---|
| P6.1 | ⛔ W7 — 10 conversations propriétaires, 5 annonces réelles | P0 | ❌ 🧑 |
| P6.2 | Élaguer la surface visible au lancement (flags) | P1 | ❌ |
| P6.3 | Intégrer les objections terrain en tâches produit | P1 | ❌ (après P6.1) |
| P6.4 | Recruter et former 1-2 Wakils réels | P1 | ❌ 🧑 |
| P6.5 | Conformité comme argument commercial (page diaspora) | P2 | ❌ |

### P6.1 🧑
Argumentaire prêt (`docs/ARGUMENTAIRE_HOTE.md`), simulateur de revenus en
ligne. Poser à chacun la question qui valide le modèle : « le voyageur vous
paie tout à l'arrivée, Darna prend 10 % que le voyageur paie en plus — ça
vous va ? ». **Noter les objections mot pour mot** : c'est la donnée la plus
précieuse du projet.

### P6.2
Le produit porte 4 mécanismes de monétisation, 3 systèmes de crédits et
2 rails de paiement, pour zéro utilisateur. Masquer **derrière un flag**
(jamais supprimer) ce qui n'est pas nécessaire au lancement : boost payant,
abonnements agence, packs de crédits de vérification — on ne vend pas de la
visibilité sur une place vide. Garder visible : frais 10 %, vérification
(gratuite au lancement), garanties. Réversible en une variable.

### P6.3
Transformer les objections de P6.1 en tâches ici, priorisées. C'est la
première fois que la roadmap sera alimentée par le réel plutôt que par
l'analyse.

### P6.5
Darna a l'export RGPD, l'effacement, la conformité CNIL, la CIN chiffrée —
un différenciateur fort pour la diaspora française, totalement absent du
discours. Une section « vos données » sur `/diaspora` : une heure de travail.

---

# PHASE 7 — CROISSANCE (🧊 GELÉE — conditions de dégel strictes)

> **Le gel se lève UNIQUEMENT quand les TROIS conditions sont vraies :**
> **(a)** l'URL de production répond en HTTPS et `/api/health` est OK,
> **(b)** ≥ 20 annonces réelles vérifiées en base de production,
> **(c)** ≥ 5 réservations réelles abouties.
> Tant qu'une seule manque, « suivant / enchaîne » ne propose QUE des tâches
> des phases 1 à 6 (ou un correctif) — **jamais** une tâche de cette phase.
> Ce verrou existe parce que construire des features growth sans utilisateur
> est invérifiable et a déjà coûté des semaines au projet.

Au dégel, **reprioriser à la lumière des données réelles** avant d'exécuter :

| # | Tâche | Prio | Origine |
|---|---|---|---|
| P7.1 | **CR2** — fin du parrainage hôte (dépense du crédit sur vérif/boost/abonnement ; détection et crédit déjà livrés PR #192) | P1 | CROISSANCE |
| P7.2 | **CR5** — dashboard admin d'exposition crédits (passif financier, alerte de seuil) | P1 | CROISSANCE |
| P7.3 | **PM3** — promo Darna côté plateforme (remise imputée sur `serviceFee`, prix hôte intouché) | P1 | CROISSANCE |
| P7.4 | **PM4** — dashboard d'aide à la décision pour PM3 (villes sans réservation à 30 j) | P2 | CROISSANCE |
| P7.5 | **G3** — « Suggérer un logement » (lead voyageur → annonce vérifiée) | P2 | GROWTH |
| P7.6 | **G7** — fidélité voyageur cumulative (généralise le token de réduction signé) | P2 | GROWTH |
| P7.7 | **CR6** — leviers de rentabilité (breakage, auto-financement, dégressivité) | P2 | CROISSANCE |
| P7.8 | **MI5** — monétisation réelle du lead financement | P2 | MONETISATION ⛔ partenariat bancaire |
| P7.9 | **WhatsApp transactionnel** (confirmations, relances, messages) — l'infra Meta est déjà câblée pour l'OTP et le scheduler existe | P1 | AUDIT_V3 |
| P7.10 | **Indice Darna → pages SEO programmatiques + rapport presse** | P1 | AUDIT_V3 |
| ~~PSP9~~ | ~~Tarification différenciée par rail~~ — **CLOS le 2026-07-28 : sans objet** dans le modèle commission-only (les deux rails coûtent le même total au voyageur, le no-show est traité par l'indemnité) | — | PAIEMENT_SUR_PLACE |

---

# PHASE 8 — DETTE & HORIZON LOINTAIN (P2/P3 — jamais avant la traction)

| # | Tâche | Prio | Note |
|---|---|---|---|
| P8.1 | Migration **Next.js 16** + eslint-config-next 16 | P2 | Fait remonter ~38 erreurs « Rules of React » sur ~30 fichiers — chantier dédié, pas un bump |
| P8.2 | Migration **Prisma 7** | P2 | `prisma.config.ts` + adapter — vraie migration |
| P8.3 | TypeScript 7 + ESLint 10 | P3 | Bloqué en amont (`typescript-eslint` ne supporte pas TS7) — revoir périodiquement |
| P8.4 | **NextAuth v5 stable** (aujourd'hui `5.0.0-beta.32`) | P2 | Figer la version ; retester toute la matrice auth à chaque bump |
| P8.5 | KYC documentaire réel (OCR + liveness) + tests anti-fraude d'identité | P2 | Nécessaire avant du volume, pas avant le lancement |
| P8.6 | Litiges / chargeback / remboursement partiel | P2 | Surface réduite par commission-only (exposition max = les frais) |
| P8.7 | MFA / step-up auth, gestion des sessions concurrentes, « déconnexion partout » | P3 | Over-engineering au stade actuel |
| P8.8 | WAF / rate limiting global en façade | P2 | Quand le trafic public le justifie |
| P8.9 | Antivirus sur uploads, CDN cache-control/intégrité | P3 | — |
| P8.10 | SLO formels, tracing distribué, canary/blue-green, chaos | P3 | Explicitement hors scope seed (cf. analyse) |
| P8.11 | Pentest externe annuel | P2 | Avant une levée ou du volume réel |
| P8.12 | Snapshots visuels (carte/annonce/RTL) | P3 | Jamais priorisé, assumé |
| P8.13 | Vault de secrets + runbook de rotation | P3 | Les variables Vercel suffisent aujourd'hui |
| P8.14 | Séquestre réel **V2** (paiement 100 % en ligne diaspora) | P2 | ⛔ Conditionné à W4 + partenaire/agrément. Les états `escrow` sont conservés pour ça |

---

## Annexe A — Checklist de revue de code (à appliquer à chaque PR)

**Sécurité** — aucun secret dans le diff, aucune clé en `NEXT_PUBLIC_` ·
autorisation serveur sur chaque mutation (rôle + propriété vérifiée en base)
· zod avec champs explicites (pas d'assignation de masse) · zéro SQL brut,
zéro `dangerouslySetInnerHTML` (seule exception : `JsonLd.tsx`) · montants
et états recalculés serveur · rate limiting sur toute action sensible ·
journal d'audit sur toute action sensible · messages d'erreur génériques sur
auth/paiement · sortie HTTP sur hôte épinglé (anti-SSRF).

**Qualité** — fonctions à but unique · aucune duplication de garde ·
nommage cohérent avec le voisinage · clés i18n ajoutées dans **les trois**
dictionnaires · tests ajoutés/mis à jour · nouvelle feature visible =
`ProductEvent` émis dans la même PR.

**Performance** — pas de N+1 (`include`/`select`, batch) · requêtes de liste
sur un index (`@@index` pour tout nouveau filtre/tri) · cache et
invalidation cohérents.

**Architecture** — frontières `core`/`stay`/`immo` respectées (jamais de
champ de paiement dans `ImmoDetails`) · Server Action plutôt qu'API route ·
dette signalée par une entrée dans ce fichier (phase 8), jamais un TODO muet.

## Annexe B — Checklist de release (avant chaque mise en production)

- [ ] Tous les gates CI verts sur le commit déployé (`fast` + `full`).
- [ ] Suites e2e et API vertes contre staging.
- [ ] Aucune vulnérabilité haute/critique nouvelle ; scan de secrets propre.
- [ ] Nouvelles variables d'environnement documentées dans `.env.example`,
      validées par `src/lib/env.ts`, et posées dans l'environnement cible.
- [ ] Invariants du mode production posés : `KYC_ENC_KEY`, `CRON_SECRET`,
      `TRUSTED_PROXY=true`, config S3, clés Konnect, Turnstile réel.
- [ ] **Backup pris juste avant** toute migration ; migration relue pour
      opérations destructives ; plan de retour arrière écrit.
- [ ] `prisma migrate deploy` validé sur staging d'abord.
- [ ] Monitoring et alertes actifs (Sentry, uptime, webhook métier).
- [ ] Procédure de rollback connue et à un clic (`docs/INFRASTRUCTURE.md` §5).
- [ ] Smoke post-déploiement : connexion, réservation, paiement sandbox,
      OTP KYC, `/api/health`, présence d'un `JOB_TICK` récent.

## Annexe C — Où trouver quoi

| Besoin | Fichier |
|---|---|
| Quoi faire ensuite | **ce fichier** |
| Conventions de code, workflow PR, identité git | `CLAUDE.md` |
| **Créer les comptes et déployer, pas à pas (P1.3)** | **`docs/INFRASTRUCTURE.md` §7** |
| Déployer, faire un rollback, restaurer un backup, matrice d'env | `docs/INFRASTRUCTURE.md` |
| Argumentaire de recrutement d'hôtes | `docs/ARGUMENTAIRE_HOTE.md` |
| Parcours de démonstration | `docs/DEMO_SCRIPT.md` (créé en P1.7) |
| Runbook d'exploitation | `docs/RUNBOOK.md` (créé en P5.1) |
| Vitrine du projet | `README.md` |
| Comptes de démonstration | `CREDENTIALS.md` (non commité, mdp `darna2026`) |

## Annexe D — Renvois historiques présents dans les commentaires de code

Le code contient ~340 commentaires du type « cf. `CROISSANCE_ROADMAP.md`
§PM1 » : ils documentent **l'origine** d'une fonctionnalité et sont
volontairement conservés (les réécrire produirait un diff massif et risqué
pour zéro valeur fonctionnelle). **Ces fichiers n'existent plus — ne pas
chercher à les ouvrir.** Table de correspondance :

| Préfixe rencontré | Chantier d'origine | Ce que ça désigne |
|---|---|---|
| `§L1` … `§L10` | LANCEMENT_ROADMAP | Mise en production V1 : CI, scheduler, modèle commission-only, RGPD, OAuth, PWA (livré, 2026-07/08) |
| `§PM0` … `§PM5` | CROISSANCE_ROADMAP | Promos hôte (prix promo, badge, nudge) |
| `§CR0` … `§CR6` | CROISSANCE_ROADMAP | Crédits parrainage/bienvenue (wallet, ledger, checkout) |
| `§G1` … `§G10` | GROWTH_ROADMAP | Acquisition/rétention : simulateur, complétude, Super-Hôte, signaux, mur de confiance |
| `§IN0` … `§IN4` | INSTRUMENTATION_ROADMAP | Événements produit (`ProductEvent`), funnel, dashboards |
| `§MI0` … `§MI6` | MONETISATION_IMMO_ROADMAP | Boost « à la une », abonnements agence, crédits de vérification, lead financement |
| `§PSP0` … `§PSP9` | PAIEMENT_SUR_PLACE_ROADMAP | Rail 2 (cash intégral), `HostInvoice`, recouvrement |
| `§AH1` … `§AH5`, `§AHC1` … `§AHC8` | ANNULATION_HOTE(_CORRECTIFS) | Annulation à l'initiative de l'hôte, relogement, geste commercial |
| `§F1` … `§F9`, `§D1` … `§D8` | FEATURES / DESIGN_ROADMAP | Fonctionnalités et animations livrées (avis hôte, alertes, notifications, transitions) |
| `§PR1` … `§PR5` | Chantier fondateur | Wakil, verticales, vérification e-mail |

Pour toute tâche NOUVELLE, ne jamais créer un nouveau préfixe : utiliser la
numérotation de ce fichier (`§P2.3`, `§P5.1`…).

---

_Créé le 2026-07-28 à partir de l'audit CTO V3 et de l'état vérifié du code
(905 tests verts, couverture 61 %, CI au quota, aucun déploiement). Remplace
toutes les roadmaps antérieures. Règle de maintenance : cocher ici dans la
même PR que la livraison — une roadmap qui dérive du code est un piège pour
la session suivante._
