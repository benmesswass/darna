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
   Vercel injecte automatiquement `Authorization: Bearer $CRON_SECRET` sur
   les appels Cron : rien à câbler côté `vercel.json` au-delà du `path`.
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

## 7. Checklist W1/W2 (🧑 WASSIM — actions humaines, pas-à-pas)

Rien ici n'est codable par Claude — comptes, paiement, choix de domaine.
Cocher au fur et à mesure ; chaque étape est indépendante sauf dépendance
explicite notée.

**Comptes & domaine (W1)** :
- [ ] Compte Vercel (peut se créer avec le compte GitHub `benmesswass`)
- [ ] Compte Neon (PostgreSQL) — créer DEUX projets : `darna-staging` et `darna-production` (isolation totale, jamais un seul projet avec deux branches partageant les mêmes credentials root)
- [ ] Compte Upstash (Redis) — un projet par environnement, même logique d'isolation
- [ ] Compte Cloudflare (R2 pour le stockage images + Turnstile pour le CAPTCHA, les deux gratuits) — un bucket R2 par environnement
- [ ] Compte Resend (e-mail transactionnel)
- [ ] Domaine `darna.tn` (registrar au choix) — pointer les DNS vers Vercel une fois le projet Vercel créé (Vercel fournit les enregistrements exacts à l'écran Domains)

**Déploiement (W2, dépend de W1)** :
- [ ] Suivre §4 ci-dessus pour staging d'abord (valider que tout fonctionne avant de toucher à la prod)
- [ ] Poser toutes les variables d'environnement staging (§3) dans Vercel → Preview
- [ ] `npx prisma migrate deploy` + `npx prisma db seed` contre Neon staging
- [ ] Vérifier `/api/health` sur le domaine staging
- [ ] Répéter pour production (§4), **sans le seed** — jamais de données de démo en prod
- [ ] Poser les clés Turnstile RÉELLES en production (⛔ W5 déjà noté dans `ROADMAP.md` §3)
- [ ] Poser les clés Konnect RÉELLES en production (sandbox reste sur staging)
- [ ] Une fois staging en ligne : exécuter §6 (test de restauration Neon) au moins une fois

Une fois W1/W2 cochés : passer à **P1.4** (`ROADMAP.md`) — smoke
tests Playwright contre staging.

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
- **`vercel.json`** : ne contient aujourd'hui que le cron `/api/jobs/tick`
  (§L3.1) — c'est suffisant, Vercel déduit le reste (build command, output)
  du framework Next.js détecté automatiquement. Aucune configuration
  `functions`/`regions` supplémentaire nécessaire au lancement (à revisiter
  si la latence Vercel↔Neon devient un problème mesuré — choisir la région
  Vercel la plus proche de la région Neon choisie, pas avant).
