# Darna — Infrastructure : staging + production

> Référence opérationnelle du déploiement (aucune tâche ici : les tâches
> vivent dans `ROADMAP.md`). Ce fichier est la
> référence unique pour déployer Darna hors de la démo locale — architecture,
> variables d'environnement par environnement, procédures de déploiement/
> rollback/restauration, et la checklist pas-à-pas pour les actions humaines
> (L6.2, marquées 🧑 WASSIM). `CLAUDE.md` y renvoie déjà.

## 1. Architecture (décisions tranchées — ne pas rouvrir)

| Brique | Service | Pourquoi |
|---|---|---|
| Hébergement app | **Vercel** | Le projet est déjà 100 % compatible (App Router, middleware CSP par nonce, `.vercel` gitignoré) et Vercel Cron porte le scheduler (§L3). Alternatives Railway/Fly notées, non retenues (Cron natif + DX + free tier). |
| Base de données | **Neon** (PostgreSQL) | `DATABASE_URL` = pooler (PgBouncer, transaction mode), `DIRECT_URL` = connexion directe pour les migrations — `schema.prisma` et `.env.example` documentent déjà exactement ce split. Backups PITR (point-in-time recovery) inclus dès le tier gratuit. |
| Rate limiting + cache distribués | **Upstash Redis** | Indispensable dès que l'app tourne en plusieurs instances serverless : le repli mémoire de `src/lib/rate-limit.ts` est PAR INSTANCE, donc quasi inopérant en multi-instance (chaque instance a son propre compteur). |
| Stockage images | **Cloudflare R2** (`STORAGE_MODE=s3`) | Compatible API S3 via `aws4fetch` (déjà en dépendance) — egress gratuit, contrairement à AWS S3. Le mode `local` (disque) ne survit pas à un déploiement serverless (chaque invocation peut tourner sur une instance différente, aucun disque partagé). |
| E-mail transactionnel | **Resend** (`EMAIL_PROVIDER=resend`) | Déjà codé (`src/lib/mailer.ts`), aucune autre intégration nécessaire. |
| Paiement | **Konnect** | Décision produit antérieure (`CLAUDE.md` §Paiement Konnect) — sandbox pour staging, clés réelles pour prod. |

Aucune de ces décisions n'est à rouvrir sans un nouvel arbitrage explicite de
Wassim — ce tableau reflète des choix déjà faits, pas des options à comparer.

## 2. Deux environnements

| | **Staging** | **Production** |
|---|---|---|
| Domaine | ex. `staging.darna.tn` ou `darna-staging.vercel.app` | `darna.tn` |
| Base de données | Neon, projet/branche dédiée, **seedée** (`prisma db seed`) | Neon, projet dédié, **jamais de seed** — données réelles uniquement |
| `PAYMENT_MODE` | `konnect` avec les clés **sandbox** Konnect | `konnect` avec les clés **réelles** |
| `KYC_MODE` | `demo` (pas de vrai SMS à consommer en test) ou `production` selon ce qui est testé | `production` |
| `CAPTCHA_MODE` | `off` ou clés Turnstile de **test** | `turnstile` avec les clés **réelles** (⛔ W5) |
| Indexation moteurs | **Jamais indexé** — `robots.ts` renvoie `disallow: "/"` dès que `SITE_URL` ≠ `https://darna.tn` (code, §5.4 ci-dessous) | Indexé normalement |
| `TRUSTED_PROXY` | `true` (Vercel est déjà un proxy de confiance) | `true` (obligatoire — le boot échoue sinon dès qu'un mode réel est actif, cf. `src/lib/env.ts`) |
| `CRON_SECRET` | posé (valeur dédiée, jamais partagée avec prod) | posé (valeur dédiée) |
| `KYC_ENC_KEY` | posé si `KYC_MODE=production` | posé, **jamais partagé avec staging** |

Chaque variable **secrète** (tokens, clés API, `AUTH_SECRET`, `CRON_SECRET`,
`KYC_ENC_KEY`) doit avoir une valeur **différente** entre staging et
production — un secret partagé entre les deux annule l'isolement (une fuite
staging compromet la prod).

## 3. Variables d'environnement — matrice complète

Référence exhaustive : `.env.example` (tenu à jour à chaque nouvelle
variable — toute variable ajoutée au code doit y être documentée dans la
même PR). Résumé par obligation :

**Toujours requises** (le boot échoue sans elles, tous environnements) :
`DATABASE_URL`, `AUTH_SECRET` (≥ 32 caractères, généré via
`openssl rand -base64 32`, **jamais réutilisé entre environnements**).

**Requises dès qu'un mode réel est actif** (`PAYMENT_MODE=konnect` /
`KYC_MODE=production` / `STORAGE_MODE=s3`) : `CRON_SECRET` (≥ 32
caractères), et en production réelle (`NODE_ENV=production` + mode réel)
`TRUSTED_PROXY="true"`.

**Requises par mode spécifique** (voir `.env.example` pour le détail complet
de chaque bloc) :
- `PAYMENT_MODE=konnect` → `KONNECT_API_KEY`, `KONNECT_RECEIVER_WALLET_ID`
- `KYC_MODE=production` → `KYC_ENC_KEY`, `SMS_PROVIDER` (+ identifiants Twilio si `SMS_PROVIDER=twilio`)
- `STORAGE_MODE=s3` → `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
- `CAPTCHA_MODE=turnstile` → `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `EMAIL_PROVIDER=resend` → `RESEND_API_KEY`
- `OTP_PROVIDER=meta-whatsapp` → jeton + phone id Meta (voir `.env.example`)
- `SENTRY_DSN` → doit être posé avec `NEXT_PUBLIC_SENTRY_DSN` (même valeur, les deux ensemble ou aucun) — ⛔ W8, DSN pas encore obtenu

**Optionnelles, avec repli sûr** : `REDIS_URL` (repli mémoire mono-instance
si absent — **à poser en prod dès la première instance**, le repli n'est
adapté qu'au dev local), `DIRECT_URL` (retombe sur `DATABASE_URL` si
absent), `OBSERVABILITY_WEBHOOK_URL`, `SITE_URL` (défaut
`http://localhost:3000`).

Toute config invalide (mode réel actif sans ses clés, Sentry à moitié posé,
etc.) fait échouer le **démarrage** du serveur (`src/lib/env.ts`, validé par
`src/instrumentation.ts`) — jamais un démarrage dégradé silencieux.

## 4. Procédure de déploiement (Vercel)

1. **Projet Vercel** : importer le repo GitHub `benmesswass/darna`. Vercel
   détecte Next.js automatiquement (build command `next build --turbopack`,
   déjà dans `package.json`).
2. **Variables d'environnement** : les poser dans Vercel → Project Settings →
   Environment Variables, **séparément pour `Preview` (staging) et
   `Production`** — jamais la même valeur de secret des deux côtés (cf. §2).
   Le scheduler n'utilise **pas** le Cron natif Vercel (retiré de
   `vercel.json`, cf. « piège n°1 » ci-dessous — bloquait le déploiement
   entier sur le plan Hobby) : c'est le cron externe (cron-job.org) qui doit
   envoyer lui-même `Authorization: Bearer $CRON_SECRET`, à configurer
   explicitement côté cron-job.org (pas d'injection automatique comme
   l'aurait fait Vercel Cron).
3. **Neon** : créer un projet Neon, copier `DATABASE_URL` (pooler,
   `?pgbouncer=true&connection_limit=10&pool_timeout=20&sslmode=require`) et
   `DIRECT_URL` (connexion directe, port 5432) dans les variables Vercel.
4. **Première migration** : `npx prisma migrate deploy` contre la base Neon
   (depuis un poste avec `DATABASE_URL`/`DIRECT_URL` pointés dessus — jamais
   `migrate dev` en prod, qui peut générer une migration interactive).
   Staging seulement : `npx prisma db seed` ensuite.
5. **Domaine** : attacher le domaine (staging : sous-domaine dédié ou domaine
   Vercel par défaut ; prod : `darna.tn`) dans Vercel → Project Settings →
   Domains. HTTPS est automatique (Vercel gère les certificats).
6. **Déployer** : push sur la branche liée au projet Vercel (typiquement
   `main` → production, PR → preview automatique = staging de facto pour
   review). Vérifier le build dans l'onglet Deployments avant de considérer
   le déploiement terminé.
7. **Vérification post-déploiement** : `curl https://<domaine>/api/health`
   (§L4.1) doit répondre 200 ; vérifier dans les logs Vercel qu'aucun
   avertissement `[env]` inattendu n'apparaît au boot (cf. §3).

## 5. Procédure de rollback (Vercel)

Vercel conserve chaque déploiement comme immuable et instantanément
réactivable :
1. Vercel → Project → Deployments → repérer le dernier déploiement **sain**
   (précédent celui posant problème).
2. Menu `⋯` → **Promote to Production** (ou `Instant Rollback` si proposé) —
   bascule le trafic de production sur ce déploiement en quelques secondes,
   sans nouveau build.
3. **Le rollback ne touche jamais la base de données** : si le déploiement
   fautif a appliqué une migration Prisma, le rollback applicatif seul ne
   l'annule pas — évaluer si la migration est rétrocompatible avec l'ancien
   code avant de rollback (une migration additive — nouvelle colonne
   nullable/table — est presque toujours sûre ; une migration destructive
   — colonne supprimée/renommée — ne l'est pas, corriger en avant plutôt que
   rollback dans ce cas).
4. Une fois la cause corrigée, redéployer normalement (§4.6) — le
   déploiement fautif reste visible dans l'historique, jamais supprimé.

## 6. Procédure de restauration de backup (Neon PITR)

Neon retient l'historique complet (point-in-time recovery) sur une fenêtre
dépendant du tier (vérifier la durée exacte dans Neon → Project → Settings →
Backup/Restore au moment de l'exécuter). Procédure :
1. Neon Console → Project → **Restore** (ou `Branches` → créer une branche
   à partir d'un timestamp passé — Neon restaure via branchement
   copy-on-write, jamais de destruction de la branche actuelle).
2. Choisir soit un timestamp précis, soit un point juste avant l'incident.
3. Neon crée une **nouvelle branche** de la base à cet instant — la branche
   `main` de production n'est PAS modifiée automatiquement.
4. Vérifier les données sur cette branche (connexion temporaire avec son
   propre `DATABASE_URL` de branche).
5. Bascule effective : soit reset `main` vers l'état restauré via l'action
   Neon dédiée, soit repointer `DATABASE_URL`/`DIRECT_URL` de Vercel vers la
   nouvelle branche (plus sûr — ne détruit pas l'état incidenté, réversible).
6. **À TESTER UNE FOIS EN CONDITIONS RÉELLES** dès que le projet Neon staging
   existe (🧑 WASSIM, §7 ci-dessous, item S5) — cette procédure est écrite
   d'après la documentation Neon mais n'a pas encore été exécutée sur ce
   projet ; la valider une fois avant d'en dépendre en cas d'incident réel.

## 7. Guide pas-à-pas W1 → P1.3 (🧑 WASSIM — actions humaines)

> **C'est LE document à ouvrir quand on attaque `ROADMAP.md` §P1.3.** Rien
> ici n'est codable par Claude (création de comptes, cartes, choix de
> domaine). Écrit pour être suivi en cliquant, dans l'ordre, sans rien
> improviser. Les intitulés exacts des écrans peuvent varier légèrement avec
> le temps chez ces fournisseurs — la logique reste la même.
>
> **Découpage en deux paliers** : le palier 1 met Darna en ligne en 30-45 min
> avec seulement 2 comptes ; le palier 2 rend le staging fidèle. Ne pas
> attendre d'avoir tout pour faire le palier 1 — tous les autres services ont
> un défaut démo sûr et l'app démarre sans eux.

### PALIER 1 — Darna en ligne (30-45 min, 2 comptes)

**Étape 1 — Compte Vercel (3 min).** https://vercel.com/signup → « Continue
with GitHub » (compte `benmesswass`). Ne pas encore créer le projet.

**Étape 2 — Base Neon (5 min).** https://console.neon.tech/signup → GitHub →
*Create project* : nom `darna-staging`, Postgres 16, région **AWS
eu-central-1 (Frankfurt)** (la plus proche de la Tunisie et de la France).
L'écran *Connection Details* propose deux chaînes via un sélecteur — il faut
**les deux** :
- **Pooled** (l'hôte contient `-pooler`) → deviendra `DATABASE_URL`
- **Direct** (même hôte **sans** `-pooler`) → deviendra `DIRECT_URL`

Prisma a besoin des deux : le pooler pour l'app, la connexion directe pour
les migrations (le pooler en mode transaction ne sait pas les exécuter).
Ajouter à la fin de la chaîne **pooled uniquement** :
`&pgbouncer=true&connection_limit=10&pool_timeout=20`

**Étape 3 — Générer `AUTH_SECRET` (30 s).** `openssl rand -base64 32` sur
le poste local. Valeur **jamais réutilisée** ailleurs (ni prod, ni local).

**Étape 4 — Créer le projet Vercel (5 min).** https://vercel.com/new →
*Import Git Repository* → `benmesswass/darna`. Vercel détecte Next.js seul
(ne rien changer aux commandes). **Avant de cliquer Deploy**, déplier
*Environment Variables* et poser ces 5 lignes :

| Nom | Valeur |
|---|---|
| `DATABASE_URL` | chaîne **pooled** (étape 2, paramètres inclus) |
| `DIRECT_URL` | chaîne **direct** (étape 2) |
| `AUTH_SECRET` | résultat de l'étape 3 |
| `SITE_URL` | `https://darna-staging.vercel.app` (ajuster au nom réel donné par Vercel) |
| `TRUSTED_PROXY` | `true` |

⚠️ `SITE_URL` doit être **différent** de `https://darna.tn` : c'est ce qui
déclenche le `noindex` automatique du staging (`src/app/robots.ts`). Ne
jamais mettre le domaine de production ici.

**Étape 5 — Créer les tables et les données de démo (5 min).** Depuis le
poste local, **sans toucher au `.env`** — préfixer la commande en ligne avec
les deux valeurs Neon (évite d'oublier de les poser ET d'oublier de les
retirer ensuite) :

```
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma migrate deploy
DATABASE_URL="<pooled>" DIRECT_URL="<direct>" npx prisma db seed
```

**Toujours `migrate deploy`, jamais `migrate dev`** sur une base distante
(`migrate dev` peut générer une migration interactive et réécrire
l'historique). ⚠️ Piège vécu (2026-07-30) : sans le préfixe inline, la
commande retombe **silencieusement** sur le `.env` local (`localhost:5432`),
sans erreur — Neon reste vide et l'app affiche une erreur générique une fois
déployée. Toujours vérifier la ligne `Datasource "db": ... at "<host>"`
affichée par Prisma avant de continuer : elle doit montrer l'hôte Neon, pas
`localhost`.

**Étape 6 — Vérifier (2 min).**

```
curl https://darna-staging.vercel.app/api/health
```

Attendu : JSON avec `ok: true` et `db` OK. Puis ouvrir l'URL au navigateur :
page d'accueil avec les annonces seedées, connexion possible avec
`voyageur@darna.tn` / `darna2026`. **À ce stade Darna existe en ligne et le
lien est partageable.**

### PALIER 2 — Staging fidèle (1-2 h, 3 comptes de plus)

Sans ce palier, trois choses ne marchent pas : les **uploads de photos** (le
disque serverless est éphémère, chaque invocation peut tourner ailleurs), le
**rate limiting** multi-instance (le repli mémoire est par instance), et les
**e-mails**.

**Étape 7 — Upstash Redis (10 min).** https://console.upstash.com → GitHub →
*Create Database* : nom `darna-staging`, type **Regional**, région
`eu-central-1`. Copier l'URL au format `rediss://…` (section *Connect* →
Redis/ioredis) — **surtout pas** l'URL REST. → `REDIS_URL`.

**Étape 8 — Cloudflare R2 (20 min).** https://dash.cloudflare.com → menu
**R2** (une carte bancaire est demandée pour activer R2, **rien n'est
facturé** sous 10 Go).
1. *Create bucket* → `darna-staging-uploads`.
2. *Manage R2 API Tokens* → *Create API token*, permission **Object Read &
   Write**, limité à ce bucket. Copier l'Access Key ID et la Secret Access
   Key (affichée **une seule fois**).
3. L'endpoint figure sur la page du bucket :
   `https://<account_id>.r2.cloudflarestorage.com`.
4. Bucket → *Settings* → *Public access* → activer le domaine `r2.dev` et
   copier l'URL publique (sinon les photos ne s'afficheront pas).

| Nom | Valeur |
|---|---|
| `STORAGE_MODE` | `s3` |
| `S3_ENDPOINT` | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_BUCKET` | `darna-staging-uploads` |
| `S3_ACCESS_KEY_ID` | Access Key ID |
| `S3_SECRET_ACCESS_KEY` | Secret Access Key |
| `S3_REGION` | `auto` |
| `S3_PUBLIC_URL` | URL publique `r2.dev` |

⚠️ **Seuils gratuits R2 à surveiller** : 10 Go stockage, 1M opérations
Class A (écritures/uploads), 10M Class B (lectures/affichage) par mois —
au-delà, facturation automatique sur la carte enregistrée (pas de plafond
dur, pas de reconfirmation). Vérifié le 2026-07-30 : très largement
suffisant pour un staging à trafic humain/interne (336 photos seedées,
non indexé donc pas de bots). **Repasser sur ces chiffres dès que le
trafic devient réel** — passage en production (§P1.8) ou terrain (phase 6,
`ROADMAP.md`) — dans le dashboard Cloudflare → *Storage & databases* → *R2*
→ `darna-staging-uploads` (stats d'usage affichées en haut de la page).

**Étape 9 — Resend (10 min).** https://resend.com/signup → *API Keys* →
*Create API Key*. Sans domaine vérifié, Resend n'envoie **que vers l'adresse
du compte** — suffisant et sans risque pour du staging.

| Nom | Valeur |
|---|---|
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | `re_…` |
| `EMAIL_FROM` | `Darna <onboarding@resend.dev>` |

**Étape 10 — Activer les 5 jobs planifiés (5 min).** `openssl rand -base64
32` → `CRON_SECRET`. **Sans cette variable, les 5 jobs ne tournent jamais**,
et en silence : pas de réconciliation Konnect, pas de relance d'abandon, pas
de rappel de facture hôte, pas de purge RGPD. Voir aussi le piège n°1
ci-dessous : sur le plan gratuit, poser la variable ne suffit pas.

**Étape 11 — Konnect sandbox (15 min, recommandé).**
https://sandbox.konnect.network → compte marchand sandbox → clé API +
`receiverWalletId`.

| Nom | Valeur |
|---|---|
| `PAYMENT_MODE` | `konnect` |
| `KONNECT_API_KEY` | clé sandbox |
| `KONNECT_RECEIVER_WALLET_ID` | wallet id |
| `KONNECT_API_URL` | `https://api.sandbox.konnect.network/api/v2` |
| `KONNECT_WEBHOOK_SECRET` | nouveau `openssl rand -base64 32` |

C'est **la première occasion de valider le webhook Konnect en chemin
nominal** : impossible en local, Konnect ne peut pas joindre `localhost`
(seul le filet `?konnect=success` y est exercé).

> Après tout ajout de variables : Vercel → *Deployments* → menu `⋯` du
> dernier déploiement → **Redeploy**. Les variables ne s'appliquent qu'au
> build suivant.

### Les 3 pièges qui coûtent des heures

1. **Le cron Vercel Hobby ne se contente pas de s'exécuter en retard — il
   bloque le déploiement ENTIER.** Découvert le 2026-07-30 (statut Vercel
   sur PR #263, corrigé en PR #264) : un
   `vercel.json` déclarant `*/15 * * * *` fait échouer **tout déploiement**
   sur le plan Hobby (« Hobby accounts are limited to daily cron jobs »,
   pas juste « le job tournera en retard » comme on l'avait d'abord estimé).
   `vercel.json` a donc été **supprimé** (plus aucun cron natif Vercel) — la
   seule source de vérité du scheduling est désormais le cron externe
   gratuit (https://cron-job.org) appelant toutes les 15 min
   `https://<domaine>/api/jobs/tick` avec l'en-tête
   `Authorization: Bearer <CRON_SECRET>` **posé explicitement côté
   cron-job.org** (Vercel n'injecte plus rien automatiquement, puisque ce
   n'est plus lui qui appelle). Vercel Pro règlerait aussi la limite native,
   mais n'est plus nécessaire pour le scheduling — seulement pour le point 2
   ci-dessous (usage commercial).
2. **Le plan Hobby de Vercel interdit l'usage commercial.** Sans risque pour
   du staging, mais la production de Darna est commerciale : prévoir **Vercel
   Pro (~20 $/mois)** au moment de `ROADMAP.md` §P1.8. C'est le **premier
   coût fixe réel du projet** — la contrainte « zéro service payant » du
   projet visait le développement, pas l'exploitation.
3. **Ne jamais `prisma migrate dev` sur une base distante**, et **jamais de
   seed en production** (uniquement staging). Voir étape 5.

### Checklist de suivi

**Palier 1 (W1 — met le site en ligne)**
- [ ] Compte Vercel
- [ ] Projet Neon `darna-staging` + les deux chaînes de connexion
- [ ] `AUTH_SECRET` généré
- [ ] Projet Vercel créé avec les 5 variables
- [ ] `migrate deploy` + `db seed` exécutés contre Neon
- [ ] `/api/health` répond 200 et la page d'accueil s'affiche

**Palier 2 (staging fidèle)**
- [ ] Upstash Redis → `REDIS_URL`
- [ ] Cloudflare R2 → 7 variables `S3_*` + `STORAGE_MODE=s3`
- [ ] Resend → `EMAIL_PROVIDER`/`RESEND_API_KEY`/`EMAIL_FROM`
- [ ] `CRON_SECRET` posé **et** cron externe branché (piège n°1)
- [ ] Konnect sandbox → 5 variables
- [ ] Redeploy effectué après le dernier ajout de variables

**Production (P1.8, plus tard — ⛔ W2/W5/W6)**
- [ ] Projet Neon `darna-production` séparé (jamais une branche du staging)
- [ ] Tous les secrets **régénérés** (jamais la valeur du staging)
- [ ] **Aucun seed** — données réelles uniquement
- [ ] Domaine `darna.tn` attaché + `SITE_URL` mis à jour (⛔ W2)
- [ ] Clés Turnstile RÉELLES (⛔ W5) — les clés de test valident tout
- [ ] Clés Konnect RÉELLES (le sandbox reste sur staging)
- [ ] Google OAuth réel (⛔ W6)
- [ ] `KYC_ENC_KEY` posé, jamais partagé avec staging
- [ ] Plan Vercel Pro (piège n°2)
- [ ] Test de restauration Neon exécuté au moins une fois (§6, `ROADMAP.md` §P1.6)

Une fois le palier 1 terminé : passer à **P1.4** (`ROADMAP.md`) — smoke tests
Playwright contre staging.

## 8. Notes techniques (découvertes en écrivant cette roadmap)

- **`next build` ET la base de données** : `src/app/sitemap.ts` interroge
  Prisma (annonces actives). Testé empiriquement : sans `export const
  dynamic = "force-dynamic"`, Next.js tente de **prérendre `/sitemap.xml`
  statiquement PENDANT `next build`** — si la base est injoignable à cet
  instant précis (cold start Neon, réseau, etc.), **le build entier échoue**
  (`Export encountered an error on /sitemap.xml/route`, reproduit dans ce
  bac à sable). Corrigé (cette PR) : `sitemap.ts` est maintenant rendu à la
  demande, jamais figé au build — cohérent aussi avec le fait qu'une annonce
  expirée (30 jours, `activeListingWhere()`) doit sortir du sitemap sans
  attendre un redéploiement. `robots.ts` reste statique (aucun accès DB) et
  n'a pas ce risque.
- **`robots.ts` — noindex conditionnel** : ajouté (cette PR). Tant que
  `SITE_URL` ≠ `https://darna.tn` exactement (staging, preview, localhost),
  `robots.txt` renvoie `disallow: "/"` — aucune donnée de démo ne doit
  jamais être indexée par un moteur de recherche.
- **`vercel.json`** : **supprimé** (2026-07-30, §3 piège n°1 — le cron natif
  qu'il portait bloquait tout déploiement sur le plan Hobby). Aucun fichier
  de config nécessaire : Vercel déduit tout (build command, output) du
  framework Next.js détecté automatiquement. Le scheduler (§L3.1) tourne
  désormais exclusivement via le cron externe cron-job.org. Aucune
  configuration `functions`/`regions` nécessaire au lancement (à revisiter
  si la latence Vercel↔Neon devient un problème mesuré — choisir la région
  Vercel la plus proche de la région Neon choisie, pas avant).
