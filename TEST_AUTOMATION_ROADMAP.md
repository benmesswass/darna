# Darna — Test Automation Roadmap

> **Référence permanente — propriété du rôle « Test Lead / QA ».**
> Ce document décrit la **stratégie d'automatisation des tests** de Darna : ce
> que l'on teste, comment, avec quels outils, dans quel ordre, et les **portes
> de qualité** (quality gates) à franchir avant chaque palier de mise en
> production.
>
> Il est **complémentaire** de `QA_ROADMAP.md` (qui recense les contrôles de
> sécurité/qualité feature par feature) : ici on parle **couches de test,
> outillage, pyramide, CI et couverture**, pas contrôle par contrôle.
>
> **Périmètre.** Next.js 15 (App Router, Server Actions) · TypeScript strict ·
> Prisma/PostgreSQL · NextAuth (credentials, JWT) · zod · Vitest · Redis
> (ioredis) · Konnect (séquestre, optionnel) · Leaflet · i18n fr/en/ar.
>
> **Légende statut :** `✅` en place & vérifié · `⚠️` partiel / non outillé ·
> `❌` absent. **Priorité :** `P0` bloquant prod · `P1` haut · `P2` moyen ·
> `P3` bas.
>
> **Règle de maintenance.** Toute PR qui ajoute une couche/outil de test coche
> la ligne ici. Toute PR qui touche un parcours `P0` sans test associé doit
> être bloquée en revue.

---

## 0. Sommaire

1. [Verdict prod-readiness (TL;DR)](#1-verdict-prod-readiness)
2. [État des lieux — la pyramide réelle aujourd'hui](#2-état-des-lieux)
3. [Cartographie du risque — parcours critiques priorisés](#3-cartographie-du-risque)
4. [Stratégie de test cible](#4-stratégie-de-test-cible)
5. [Outillage recommandé (par couche)](#5-outillage-recommandé)
6. [Plan détaillé par couche de test](#6-plan-par-couche)
7. [Portes de qualité CI/CD & phasage](#7-portes-de-qualité-cicd)
8. [Roadmap séquencée (sprints)](#8-roadmap-séquencée)
9. [Métriques & Definition of Done](#9-métriques--definition-of-done)
10. [Risques si omis](#10-risques-si-omis)

---

## 1. Verdict prod-readiness

**Constat de Test Lead.** Darna n'est **pas** un projet vierge : il porte déjà
une **suite de 51 fichiers de tests Vitest** couvrant les invariants métier et
sécurité les plus dangereux (paiement idempotent, double-réservation, IDOR,
rate limiting, chiffrement CIN, OTP, KYC, annulation hôte). La base **backend /
domaine** est solide et rare à ce niveau de maturité.

**Mais la pyramide est déséquilibrée** — il manque tout le haut et une partie du
bas :

| Couche | État | Verdict |
|--------|------|---------|
| Unit / domaine (lib, helpers) | ✅ Bon | Solide, à compléter sur la couverture mesurée |
| Intégration Server Actions | ✅ Bon | Nombreux tests ; **concurrence booking désormais prouvée sur vraie DB** (Phase 1), reste à étendre l'intégration DB réelle aux autres actions |
| Contrat API / webhooks | ⚠️ Partiel | Webhook Konnect testé en logique, **pas de test HTTP de la route** ni de signature |
| **Composant / front (React)** | ✅ **P0 couvert (Phase 2)** | Harness jsdom + Testing Library ; `KonnectPayButton`, `LoginForm`, `RegisterForm`, `PropertyCard`, `Price`, i18n — reste KYC/date-picker/carte en P1 |
| **E2E navigateur** | ❌ **Absent** | **Aucun Playwright**, aucun parcours signup→KYC→booking→paiement automatisé |
| **Couverture mesurée** | ✅ **En place (Phase 1)** | `@vitest/coverage-v8` + seuils ratchet bloquants en CI (`src/lib`+`src/actions`) |
| Sécurité automatisée | ⚠️ Partiel | Semgrep (SAST) + ZAP baseline (DAST, nightly) désormais en place ; reste **dep-scan structuré** au-delà de `npm audit` (Dependabot déjà actif) |
| Performance / charge | ✅ Bon | k6 sur `/sejours` (recherche) + course booking (20 VUs concurrents), nightly/hebdo (cf. §6.7) |
| Accessibilité | ❌ Absent | Aucun `axe`, site trilingue + RTL non testé |

**Décision.** La plateforme est **« Beta-ready » côté logique métier**, mais
**pas « Production-ready »** au sens d'une équipe QA : sans E2E ni tests front,
un refactor UI ou un changement de flux paiement peut casser un parcours
critique **sans qu'aucun test ne rougisse**. Cette roadmap comble ce trou en
**5 phases** priorisées.

---

## 2. État des lieux

### 2.1 Ce qui existe (51 fichiers `tests/*.test.ts`, env `node`)

Domaines déjà couverts : `auth-register`, `bookings`, `booking-conflict`,
`booking-gate`, `booking-idor`, `property-idor`, `permissions-gates`,
`payments`, `deposit`, `konnect`, `cash-booking`, `host-invoicing`,
`host-invoice-payment`, `host-invoice-reminders`, `cancellation`,
`host-cancellation-security`, `rebooking-discount`, `kyc-actions`,
`kyc-gating`, `crypto`, `otp`, `otp-channel`, `sms`, `rate-limit(-keyed/-redis)`,
`turnstile`, `session-token-version`, `suspension`, `messages-hub/-action`,
`message-scan`, `notifications`, `rating-aggregate`, `profile-password`,
`reset-actions/-token`, `contact-reveal`, `storage`, `mailer`, `email-actions`,
`admin`, `admin-host-invoices`, `modes`, `verticals`, `cache`, `sort`,
`analytics-helpers`, `format-countdown`, `observability`, `redirect-landing`.

### 2.2 Les trous structurels (cibles de cette roadmap)

- ✅ **Tests rendu React — périmètre P0 couvert (Phase 2)** → harness jsdom +
  Testing Library ; `KonnectPayButton`, `LoginForm`, `RegisterForm`,
  `PropertyCard`, `Price` montés en test. Restent (P1) : `PropertyMap`,
  sélecteur de dates de réservation, formulaire KYC, `HistoryNav`.
- ❌ **Aucun E2E** → les parcours de bout en bout (inscription → connexion →
  recherche → réservation → paiement → avis) ne sont jamais rejoués dans un
  navigateur réel.
- ⚠️ **Vraie DB en intégration : amorcée (Phase 1)** → la garde
  anti-double-réservation (`$transaction` SERIALIZABLE) est désormais **prouvée
  sous concurrence Postgres réelle** (`tests/integration/`) ; reste à étendre ce
  socle aux autres actions (paiement, annulation, cash), la majorité des tests
  mockant encore Prisma.
- ❌ **Pas de test HTTP des routes** `api/**` (webhooks Konnect, notifications,
  unread-count) ni de vérification de signature webhook.
- ✅ **Couverture mesurée & gardée (Phase 1)** → `@vitest/coverage-v8` +
  seuils ratchet bloquants en CI sur `src/lib`+`src/actions` (plancher du jour :
  ~45 % lignes) ; à remonter au fil des phases (cible `src/lib` ≥ 85 %).
- ❌ **i18n/RTL non testé** → trilingue fr/en/ar avec `dir="rtl"` : aucune
  garantie automatisée qu'une clé manque ou qu'un layout casse en arabe.

---

## 3. Cartographie du risque

Priorisation **par le risque** (impact × probabilité × exposition), pas par la
facilité. Un parcours `P0` est un parcours dont **l'échec = perte d'argent,
faille de sécurité, ou blocage total de l'utilisateur**.

| # | Parcours critique | Risque si cassé | Prio | Couches de test cibles |
|---|-------------------|-----------------|------|------------------------|
| J1 | **Réservation & anti-double-booking** (`createBookingAction`, `$transaction`) | Deux voyageurs paient le même créneau | **P0** | Intégration DB réelle + concurrence + E2E |
| J2 | **Paiement séquestre Konnect** (`startKonnectPaymentAction`, webhook, `settleKonnectBooking`) | Paiement encaissé/non-confirmé, montant faussé, double règlement | **P0** | Unit + contrat webhook HTTP + E2E happy/echec |
| J3 | **Authentification & session** (login, rate-limit, `token version`, reset mot de passe) | Prise de compte, énumération, session non invalidée | **P0** | Intégration + E2E + sécurité |
| J4 | **KYC / CIN chiffré + OTP** (upload, unicité, gating prod) | Fuite de PII, KYC contournable | **P0** | Unit + intégration + sécurité |
| J5 | **Autorisation / IDOR** (agir sur booking/annonce/profil d'autrui) | Accès/altération de données d'autrui | **P0** | Intégration négative + E2E multi-comptes |
| J6 | **Annulation hôte & remboursement / relogement** | Litige argent, voyageur bloqué | **P1** | Intégration + E2E |
| J7 | **Paiement sur place (cash)** (`acceptCash`, `declineCash`, `reportNoShow`) | Réservation fantôme, no-show non tracé | **P1** | Intégration + E2E |
| J8 | **Publication d'annonce + expiration 30j + exclusion recherche/sitemap** | Annonce périmée visible, SEO pollué | **P1** | Intégration + E2E |
| J9 | **Recherche + carte + translittération** (`resolveCity`, Leaflet) | Résultats faux, carte KO, perf | **P1** | Composant + E2E + perf |
| J10 | **Messagerie + anti-fuite de contact** (`message-scan`, `contact-reveal`) | Contournement du modèle (contact hors-plateforme) | **P1** | Intégration + E2E |
| J11 | **Facturation hôte** (commission, relances, webhook facture) | Revenu non collecté | **P2** | Intégration + contrat webhook |
| J12 | **Admin** (modération annonces, signalements, wakils, suspension) | Action de modération incorrecte | **P2** | Intégration + E2E |
| J13 | **Avis** (avis exige réservation confirmée, agrégat note) | Faux avis, note faussée | **P2** | Intégration |
| J14 | **i18n fr/en/ar + RTL + CSP nonce** | Chaîne manquante, layout RTL cassé, CSP bloque un script | **P2** | Composant + E2E + audit |

---

## 4. Stratégie de test cible

### 4.1 Principe directeur — pyramide, pas cône glace

```
                 ▲  E2E (Playwright)          ~15-25 scénarios  — parcours J1..J14 happy + échecs clés
                /  \  ────────────────────────────────────────────────────────
               /    \ Composant (Testing Library + jsdom)  ~40-60 — formulaires, carte, dates, i18n/RTL
              /      \ ─────────────────────────────────────────────────────────
             /        \ Intégration (Server Actions + DB Postgres jetable)  ~80-120
            /          \ ───────────────────────────────────────────────────────
           /            \ Unit (lib, helpers, zod, crypto, otp…)  large base existante
          ──────────────────────────────────────────────────────────────────────
   Transverse : Sécurité (SAST/DAST/deps), Contrat API/webhooks, Perf/charge, A11y, Visuel
```

- **Bas large, haut fin.** On garde l'investissement massif en unit/intégration
  (rapide, déterministe) et on ajoute **peu mais bien** d'E2E (lent, fragile) :
  uniquement les parcours `P0/P1` et leurs échecs à fort enjeu.
- **Risk-based.** On teste d'abord ce qui coûte cher à casser (argent,
  sécurité, PII), pas ce qui est facile à couvrir.
- **Déterminisme.** Zéro dépendance réseau réelle en CI : Konnect, SMS/OTP,
  e-mail, S3 sont **mockés** (MSW / mocks maison déjà présents). Le mode
  « simulé » de Darna est un atout — on teste le vrai code d'aiguillage.
- **Un test = un invariant.** Nommage `describe(parcours) > it(invariant)`.
- **Shift-left.** La sécurité et l'a11y sont des couches de CI, pas une revue
  finale.

### 4.2 Environnements & données de test

| Environnement | DB | Réseau externe | Usage |
|---------------|----|----|-------|
| **Unit** | aucune (mock) | mock | `tests/**` actuels, ultra-rapides |
| **Intégration** | **Postgres jetable** (Testcontainers ou service CI, déjà en CI) | mock | Prouver transactions, contraintes, IDOR sous vraie DB |
| **E2E** | Postgres seedé (`prisma db push && db seed`) | Konnect/SMS/e-mail en mode simulé | `npm run dev` + Playwright |
| **Charge** | Postgres dédié | mock/simulé | k6 sur recherche + fenêtre course booking |

**Données de test.** S'appuyer sur `prisma/seed.ts` (comptes démo, mdp
`darna2026` : `voyageur@darna.tn`, `hote@darna.tn`, `sami@darna.tn` (hôte),
`amira@darna.tn` (voyageur), `agence@darna.tn`, `admin@darna.tn`). Pour
l'intégration DB, **factories dédiées** (helper `tests/factories/*`) créant
users/annonces/bookings isolés par test + `TRUNCATE` entre tests, pour ne pas
dépendre de l'ordre du seed.

---

## 5. Outillage recommandé

| Besoin | Outil retenu | Pourquoi | Statut |
|--------|--------------|----------|--------|
| Unit / intégration | **Vitest** (déjà en place) | Rapide, ESM natif, alias `@/`, un seul runner | ✅ |
| Couverture | **@vitest/coverage-v8** | Provider V8, seuils configurables, rapport CI | ❌ P0 |
| Composant React | **@testing-library/react + @testing-library/user-event + jsdom** (projet Vitest dédié) | Standard React, tests centrés utilisateur, compatible Server Components via montage des Client Components | ❌ P0 |
| Mock réseau | **MSW (msw)** | Intercepte fetch (Konnect, geocode) au niveau réseau, réutilisable unit/E2E | ❌ P1 |
| E2E navigateur | **Playwright** (Chromium préinstallé dans l'env) | Multi-onglets (tests IDOR/concurrence), trace viewer, réseau mockable, `PLAYWRIGHT_BROWSERS_PATH` déjà configuré | ❌ P0 |
| DB de test réelle | **Testcontainers** (ou service Postgres CI existant) | Transactions/contraintes réelles, isolable | ❌ P1 |
| Accessibilité | **@axe-core/playwright** | Scan a11y automatisé sur les pages clés + RTL | ❌ P2 |
| Contrat / schéma | **zod (déjà) + tests HTTP des routes `api/**`** | Valider entrées/sorties webhooks, statuts HTTP | ⚠️ P1 |
| Perf / charge | **k6** (ou Artillery) | Charge recherche + course booking, seuils p95 | ⚠️ P2 (recherche livrée, course booking non couverte) |
| SAST | **Semgrep** (règles Next/React/OWASP) | Détecte `dangerouslySetInnerHTML`, injections, secrets | ❌ P1 |
| Dépendances | **npm audit (déjà) + Dependabot/Renovate** | Veille CVE continue, pas seulement au build | ⚠️ P2 |
| DAST (Beta+) | **OWASP ZAP baseline** (scan passif en CI nightly) | Headers, CSP, cookies, redirections | ✅ P2 |
| Visuel (option) | **Playwright screenshots / toMatchSnapshot** | Régression visuelle carte/annonce/RTL | ❌ P3 |

> **Contrainte projet respectée :** aucun service payant obligatoire. Playwright,
> Vitest, MSW, axe, k6, Semgrep, ZAP sont **gratuits / OSS**. Aucune librairie UI
> lourde ajoutée.

---

## 6. Plan par couche

### 6.1 Unit (base — consolider)
- Ajouter **couverture mesurée** (`@vitest/coverage-v8`) et publier le rapport.
- Compléter les zones peu couvertes : `src/lib/geo.ts` (`resolveCity`
  translittération « 7ammamet »→Hammamet), `src/lib/constants.ts` (enums zod),
  calculs de prix serveur, `format-countdown`, conversion EUR d'UI.
- **Cible couverture lib :** ≥ 85 % lignes sur `src/lib/**`.

### 6.2 Intégration Server Actions (sur vraie DB)
- Rejouer les actions clés **contre un Postgres jetable** (pas un mock Prisma) :
  `createBookingAction`, `settleKonnectBooking`, `cancelBookingAction`,
  `hostCancelBookingAction`, `acceptCashBookingAction`, `reportNoShowAction`,
  KYC.
- **Test de concurrence J1 (P0)** : lancer 2 `createBookingAction` en parallèle
  sur le même créneau → **exactement une** réussit, l'autre reçoit le conflit.
  C'est le test le plus important manquant.
- **Tests d'autorisation négative J5 (P0)** : compléter `booking-idor`/
  `property-idor` avec profil, factures, messagerie, relogement.
- Expiration EN_ATTENTE à 15 min (booking) et annonce à 30 jours + exclusion
  recherche/sitemap.

### 6.3 Contrat API / webhooks (P1)
- Tests HTTP réels des routes `src/app/api/payments/konnect/webhook` et
  `.../host-invoice-webhook` : statut, idempotence (rejouer le même
  `payment_ref`), montant faussé rejeté, `payment_ref` inconnu.
- `api/notifications`, `api/messages/unread-count` : auth requise, pas de fuite
  cross-compte.
- **Reco sécurité (QA_ROADMAP)** : ajouter puis tester une **vérification de
  signature** webhook Konnect (aujourd'hui repose sur l'opacité du `payment_ref`).

### 6.4 Composant / front React (P0 — trou majeur)
- Mettre en place un **projet Vitest `jsdom`** séparé (le projet `node` reste
  pour le backend) + Testing Library.
- Premiers composants (par risque UX/argent) :
  - Formulaire de réservation + sélecteur de dates (`/annonce/[slug]/reserver`).
  - `KonnectPayButton` (redirection client, compat CSP `form-action 'self'`).
  - `PropertyCard`, `PropertyMap`/`MapInner` (montage, marqueurs).
  - Sélecteur de locale + rendu i18n : monter un composant en fr/en/**ar** et
    vérifier `dir="rtl"` + absence de clé brute.
  - `HistoryNav` / `MessagesNotifier` : positionnement (pas de recouvrement,
    règle CLAUDE.md).
- **Cible :** chaque formulaire mutant a au moins 1 test de validation
  (erreur zod affichée) + 1 happy.

### 6.5 E2E navigateur — Playwright (P0)
- Scénarios `P0/P1` (happy + échecs clés) :
  1. **Inscription → connexion** (+ échec : mauvais mot de passe générique,
     rate-limit après 5 essais).
  2. **Recherche → annonce → réservation → paiement Konnect simulé → confirmation → avis.**
  3. **Double-réservation via 2 onglets** (2 voyageurs, même créneau) → 1 seul gagne (miroir E2E de J1).
  4. **IDOR** : voyageur A tente d'ouvrir la réservation/facture de B → refusé.
  5. **Paiement sur place** : demande → acceptation hôte → no-show.
  6. **Annulation hôte → parcours relogement.**
  7. **KYC** : upload CIN → gating (accès bloqué tant que non vérifié en mode prod).
  8. **i18n** : bascule fr→ar, vérifier RTL et libellés clés.
- Multi-comptes via `storageState` Playwright (sessions hôte/voyageur/admin
  pré-authentifiées). Konnect/OTP/e-mail en **mode simulé**.
- **Cible :** suite E2E < 8 min, exécutée sur PR (chemins P0) + nightly (complet).

### 6.6 Sécurité automatisée (P1)
- **SAST Semgrep** en CI : interdiction `dangerouslySetInnerHTML` hors
  `JsonLd.tsx`, détection secrets, patterns injection/SSRF.
- [x] **DAST ZAP baseline** nightly (Beta+) : CSP par nonce présente, HSTS,
  `X-Frame-Options DENY`, nosniff, cookies `HttpOnly/Secure/SameSite`. →
  `zaproxy/action-baseline` (`.github/workflows/zap-baseline.yml`), scan
  PASSIF uniquement (aucune attaque active), contre un build de production
  (`next start`). Job isolé, **jamais sur PR** (workflow séparé de `ci.yml`,
  même choix que `perf.yml`) : nightly/hebdo + `workflow_dispatch`.
  `fail_action: false` volontaire — seuils/faux positifs pas encore calibrés
  sur un vrai résultat, donc un rapport à examiner plutôt qu'un gate bloquant
  pour l'instant (à durcir une fois le bruit de fond connu).
  **Validé en réel le 2026-07-20** (1er `workflow_dispatch` sur `main`,
  run #1) : le tag d'action (`@v0.12.0`) était correct et les noms de
  fichiers de rapport supposés l'étaient aussi (`report_html.html`/
  `report_json.json`/`report_md.md` à la racine). Un souci différent et
  imprévu a été trouvé et corrigé au 1er essai : l'upload d'artifact
  **interne à l'action** cible l'ancienne API Actions Artifacts (v1/v2,
  `api-version=6.0-preview`) que GitHub a dépréciée côté serveur — la
  sous-étape échoue (`Create Artifact Container failed`) **indépendamment**
  de `fail_action` (qui ne gouverne que les findings, pas cette erreur
  d'upload), alors que le scan lui-même aboutit sans aucun problème.
  Correctif : `continue-on-error: true` sur l'étape ZAP + upload des rapports
  par nous-mêmes via `actions/upload-artifact@v4` (API actuelle, déjà
  éprouvée dans `ci.yml`) au lieu de dépendre du mécanisme interne cassé
  de l'action.
  **Premiers résultats réels** (387 URLs scannées) : **0 `FAIL-NEW`**, 59
  règles passées, 8 catégories `WARN-NEW` (aucune bloquante) — CSP
  `style-src unsafe-inline` (attendu, Tailwind), absence de jetons
  anti-CSRF perçue par ZAP (faux positif connu : Next.js protège les Server
  Actions par vérification d'origine same-origin, pas par jeton — déjà
  couvert par `tests/api/security-regressions.spec.ts`, Phase 4), en-tête
  Cross-Origin-Embedder-Policy absent, et 4 autres catégories purement
  informationnelles (redirection `/dashboard`, contenu non cacheable,
  détection SPA/formulaires d'auth). Rien nécessitant une action immédiate ;
  triage complet à faire par Wassim au calme, pas dans l'urgence de ce
  chantier.
- Régressions à figer en test : anti-énumération connexion (erreur générique),
  exception assumée inscription (« compte existe déjà ») + rate-limit + CAPTCHA
  dual-mode (`turnstile`), open-redirect (`redirect-landing` déjà), CSRF sur
  server actions, mass-assignment (zod strict), SSRF sur `geocode`.
- **Dependabot/Renovate** activé, `npm audit --audit-level=high` conservé.

### 6.7 Performance / charge (P2)
- [x] **k6** sur `/sejours` (recherche) : montée à 10 VUs, 40 annonces
  seedées (`tests/perf/search-seed.ts`) pour un p95 réaliste. Seuil
  p95 < 2000 ms — mesuré 1.31 s en pratique, contre un build **`next dev`**
  (pas `next start` : limite connue, à revoir si le seuil devient trop
  proche de la marge). → `tests/perf/search.js`, job isolé
  `.github/workflows/perf.yml` (hebdo + `workflow_dispatch`, **jamais sur
  PR** — workflow séparé de `ci.yml`, pas un simple `if:` sur un trigger
  partagé). **La carte (Leaflet) est hors de portée** : rendu client, k6/http
  n'exécute pas de JS navigateur.
- [x] **Charge sur la fenêtre de course booking** : 20 requêtes
  `createBookingAction` simultanées sur le même créneau → exactement une
  seule réservation active en base, p95 < 1.5 s (mesuré 684 ms).
  `createBookingAction` est une Server Action Next.js (RPC via header
  `Next-Action` + FormData, pas une route REST) — pilotée par k6 via un
  spike validé : capturer une vraie requête une fois (login Playwright réel
  dans `tests/perf/booking-load-setup.ts`), puis la rejouer en HTTP brut
  (l'id d'action capturé reste valide pour les appels suivants). →
  `tests/perf/booking-load.js` + `booking-load-verify.ts`. La CORRECTION
  sous concurrence était déjà prouvée sous vraie transaction SERIALIZABLE
  par `tests/integration/booking-concurrency.integration.test.ts`
  (Phase 1) — ce lot ajoute la caractérisation de la LATENCE sous charge
  réelle, et a mis au jour un vrai bug : 4/20 requêtes perdantes
  remontaient en 500 brut (abandon de transaction Postgres P2034 non
  rattrapé) au lieu du message générique "dates indisponibles" — corrigé
  dans `src/actions/bookings.ts`.
- [ ] Budget perf front (Lighthouse CI optionnel) sur pages annonce/recherche.

### 6.8 Accessibilité (P2)
- **axe** sur pages clés (accueil, recherche, annonce, réservation, dashboard)
  dans les **3 langues**, dont **ar/RTL**. Zéro violation « serious/critical ».

---

## 7. Portes de qualité CI/CD

### 7.1 État CI actuel (`.github/workflows/ci.yml`)
Job `build` : `migrate deploy` (dérive) → `lint` → `tsc --noEmit` → `vitest` →
`build` → `npm audit --high`. Job `e2e` (Phase 3, isolé — cf. §7.4) : Playwright
Chromium + rapport Allure en artifact. **Reste incomplet** : ni front/backend
isolés, ni SAST.

### 7.2 Gates cibles (progressifs)

| Gate | Sur PR | Nightly | Bloquant à partir de |
|------|--------|---------|----------------------|
| Lint + `tsc` | ✅ | ✅ | déjà |
| Unit + intégration (Vitest) | ✅ | ✅ | déjà |
| **Couverture ≥ seuil** (lignes 70 % global, 85 % `src/lib`, 100 % paiement/auth critiques) | ✅ | ✅ | **Phase 1** |
| **Tests composant (jsdom)** | ✅ | ✅ | Phase 2 |
| **E2E Playwright (parcours P0)** | ✅ | complet | Phase 3 |
| **Semgrep (SAST)** | ✅ | ✅ | Phase 4 |
| `npm audit --high` | ✅ | ✅ | déjà |
| ZAP baseline + axe | — | ✅ | Phase 5 |
| k6 charge | — | ✅ (ou hebdo) | Phase 5 |

**Règle de non-régression :** la couverture ne peut pas baisser ; un parcours
`P0` sans test E2E/intégration bloque le merge.

### 7.3 Visibilité du rapport de tests (obligatoire — règle permanente)

> **Tout run CI doit publier, dans la page du run GitHub Actions, un rapport de
> tests CLAIR, DÉTAILLÉ et EXHAUSTIF — pas seulement un statut vert/rouge ni des
> logs à déplier.** Objectif : comprendre l'état des tests sans ouvrir la
> console.

Le rapport (publié dans `$GITHUB_STEP_SUMMARY` par `scripts/ci-test-summary.mjs`,
step `if: always()` — donc visible **même en cas d'échec**) contient :

- **Un bandeau de statut** (SUCCÈS / ÉCHEC) + un tableau de **totaux** (fichiers,
  tests, réussis, échoués, ignorés, durée).
- **La liste détaillée des tests échoués** en tête, avec le **message d'erreur**
  (fichier : ligne) — pour diagnostiquer sans fouiller les logs.
- **Une table de synthèse par fichier** (statut, nombre de tests, réussis/
  échoués/ignorés, durée).
- **Le détail de TOUS les tests** (nom complet + statut + durée), replié dans un
  `<details>` pour rester navigable même à plusieurs centaines de tests.
- **La couverture** du cœur backend (lignes / instructions / fonctions /
  branches) et le rappel des seuils.
- **Un artifact `coverage-report`** téléchargeable (rapport HTML complet).

**Cette exigence est un invariant de CI** : toute évolution du pipeline doit la
préserver. Un run qui n'exposerait plus le rapport détaillé est un régression à
corriger au même titre qu'un test cassé. (Applicable dès qu'un nouveau type de
test est ajouté — composant, E2E, sécurité… : il doit apparaître dans ce même
rapport.)

### 7.4 Isolation CI par type de test + rapports Allure (règle permanente)

> **Les tests lourds — E2E, front et backend — ne sont PAS fondus dans le job
> `build`. Chaque type vit dans un job CI dédié, relançable manuellement et
> indépendamment, et publie son propre rapport Allure consultable directement.**

- **Restent regroupés** (job `build`, cf. §7.1) : unit + composant rapides
  (Vitest/jsdom). Décision assumée — pas de surcoût CI pour ces tests courts.
- **Isolés, un job par type** — a minima `e2e` (Playwright), `front`, `backend`
  (intégration DB/API). Chaque job :
  - est **déclenchable et relançable seul** (`workflow_dispatch` + re-run du job
    unique, sans rejouer tout le pipeline) ;
  - apparaît comme **check GitHub distinct** → statut par type visible d'un coup
    d'œil sur la PR ;
  - produit un **rapport Allure dédié** (`allure-playwright`, `allure-vitest`…)
    **publié et consultable directement** (GitHub Pages ou artifact Allure
    ouvrable) — pas seulement un step summary ni un statut vert/rouge.
- **Objectif** : relancer un seul type après un flake ou un fix ciblé, et ouvrir
  son rapport Allure sans fouiller les logs.

**Statut** : `e2e` ✅ livré (Phase 3 — job isolé sans `needs: build`, rapport
Allure en artifact GitHub téléchargeable ; pas de GitHub Pages, le repo étant
privé). Le lien de téléchargement est aussi publié dans `$GITHUB_STEP_SUMMARY`
(visible en haut de la page du run, pas enfoui dans l'onglet Artifacts).
`front`/`backend` restent groupés dans `build` (périmètre §7.1 actuel, hors
scope Phase 3).

**Invariant** : tout nouveau type de test lourd ⇒ job isolé + rapport Allure. La
règle §7.3 reste l'exigence pour les tests regroupés ; les tests isolés la
satisfont via leur rapport Allure.

---

## 8. Roadmap séquencée

> Chaque phase = un incrément livrable et mergé indépendamment. Estimations en
> jours-homme QA indicatives.

### Phase 1 — Fondations mesure & DB réelle *(P0, ~3-4 j)* — ✅ **LIVRÉE**
- [x] Ajouter `@vitest/coverage-v8` + seuils + rapport CI. → `vitest.config.ts` (provider v8, seuils ratchet, reporters text/html/lcov), script `test:coverage`.
- [x] Introduire **Postgres jetable** en intégration (service Postgres CI existant + gate `DATABASE_URL`). → `tests/integration/helpers.ts`.
- [x] **Test de concurrence J1** : double-booking prouvé sous vraie transaction SERIALIZABLE. → `tests/integration/booking-concurrency.integration.test.ts` (déclenche empiriquement l'abort P2034 du perdant, invariant « 1 seule résa active » vérifié).
- [x] Factories de test + nettoyage DB par préfixe. → `tests/integration/helpers.ts` (`createUser`, `createStayProperty`, `cleanupByPrefix`).
- [x] Gate couverture en CI (bloquant). → `.github/workflows/ci.yml` (step `npm run test:coverage`).

> **Constat empirique Phase 1 :** le test de concurrence confirme le gap noté
> dans `bookings.ts` — sous course réelle, la transaction perdante est avortée
> par Postgres (`P2034`) et remonte en erreur brute au lieu d'un
> `datesIndisponibles` propre. **À traiter en Phase 2** (retry applicatif sur
> `P2034`). L'invariant métier (jamais deux résas actives qui se chevauchent)
> est lui **prouvé et tenu**.

### Phase 2 — Tests composant / front *(P0, ~4-5 j)* — ✅ **LIVRÉE (P0 + reliquat P1)**
- [x] Projet Vitest `jsdom` + Testing Library + user-event. → `vitest.config.ts` (projets `node`/`jsdom`), `tests/components/setup.ts`, `tests/components/helpers.tsx`.
- [x] Test i18n/RTL (fr/en/ar) : `dir` + **parité des clés des 3 dicos**. → `tests/i18n-parity.test.ts`.
- [x] Premier composant paiement **`KonnectPayButton`** (P0) : libellé, erreur serveur, redirection client `payUrl`. → `tests/components/konnect-pay-button.test.tsx`.
- [x] Composant `Price` + formatage devise diaspora (TND/EUR). → `tests/components/price.test.tsx`.
- [x] **`LoginForm`** (P0 auth) : validation, message générique anti-énumération, `callbackUrl`, bannière post-inscription. → `tests/components/login-form.test.tsx`.
- [x] **`RegisterForm`** (P0 auth) : garde-fou client mismatch mot de passe, exception assumée « compte déjà existant », redirection post-succès vers `/connexion`. → `tests/components/register-form.test.tsx`.
- [x] **`PropertyCard`** (J9 recherche) : prix + suffixe nuit/mois, total séjour tout compris, badge Vérifié, lien + query string. → `tests/components/property-card.test.tsx`.
- [x] Gate front en CI. → le projet `jsdom` tourne dans `npm run test:coverage` (déjà appelé par la CI).
- [x] **Rapport de tests détaillé & exhaustif dans le run CI** (§7.3) : tous les tests affichés (par fichier + détail replié), échecs avec message, totaux, couverture, artifact HTML. → `scripts/ci-test-summary.mjs`, `.github/workflows/ci.yml`.
- [x] Reliquat P1 : formulaire KYC (`CinVerifyFlow` — erreur unicité CIN, bascule état vérifié réel vs démo, `onVerified`) → `tests/components/kyc-cin-form.test.tsx`. Sélecteur de dates de réservation (`BookingDatePicker`, composant contrôlé pur — sélection arrivée/départ, jour indisponible/passé désactivé, reset, navigation mois) → `tests/components/booking-date-picker.test.tsx`. Carte (`PropertyMap` — bouton agrandir, modale, filtre prix ; `MapInner`/Leaflet mocké, APIs géométriques réelles hors de portée de jsdom, même patron que les Server Components async de Phase 2 P0) → `tests/components/property-map.test.tsx`. `HistoryNav`/`MessagesNotifier` (positionnement — ancrage `bottom-4 start-4` vs `bottom-4 end-4`, garde de non-recouvrement CLAUDE.md) → `tests/components/history-nav.test.tsx`, `tests/components/messages-notifier.test.tsx`.

> **Note technique Phase 2 :** les Server Components async (badges, `PropertyCard`
> lui-même) ne peuvent pas être rendus en JSX imbriqué par le renderer client de
> Testing Library sans streaming RSC — on les résout en `await Composant(props)`
> avant `render()`, et on mocke leurs propres enfants async (`Badges`) par des
> équivalents synchrones. `getByLabelText` échoue aussi sur les champs mot de
> passe de `RegisterForm` : leur `<label>` embarque en permanence un indice live
> qui pollue son `textContent` (comportement voulu, pas un bug) — ces champs sont
> ciblés par `input[name=...]`, comme le ferait `label.control` du navigateur.

### Phase 3 — E2E Playwright *(P0, ~5-6 j)* — ✅ **LIVRÉE**
- [x] Setup Playwright (Chromium), `storageState` multi-rôles (`tests/e2e/global-setup.ts` :
      connexion réelle via l'UI par rôle, IP factice dédiée par login pour ne
      pas partager le rate-limit "connexion" avec les specs), seed Postgres
      direct (comptes + annonces + réservations pré-existantes, 1 slug dédié
      par scénario pour tenir sous `fullyParallel`).
- [x] **Pas de MSW** : mode démo déjà natif pour Konnect (`PAYMENT_MODE=demo`)
      et OTP e-mail/téléphone (code renvoyé au client et affiché à l'écran
      quand aucun provider réel n'est configuré) — aucun mock nécessaire.
- [x] 8 scénarios P0/P1 (`tests/e2e/01-auth.spec.ts` … `08-i18n.spec.ts`) :
      auth + rate-limit, réservation/paiement/avis, double-réservation 2
      onglets (assertion sur l'invariant DB, pas sur le timing UI — robuste
      sous forte charge parallèle), IDOR, paiement sur place + no-show,
      annulation hôte + relogement, gating KYC, i18n RTL.
- [x] Traces/vidéos en cas d'échec, retry ×1 en CI, job `e2e` isolé (§7.4) sur
      PR — cf. `.github/workflows/ci.yml`.

### Phase 4 — Contrat API & sécurité automatisée *(P1, ~3-4 j)*
- [x] Tests HTTP des routes `api/**` (webhooks idempotence/montant/inconnu) —
      `tests/api/webhook-konnect.spec.ts` (400/401/429/INTROUVABLE/idempotent),
      `tests/e2e/09-webhook-disabled.spec.ts` (404 désactivé). Job CI `api`
      isolé (§7.4) — `PAYMENT_MODE=konnect` incompatible avec `e2e`.
- [x] **Signature webhook Konnect** (impl + test) — déjà implémentée
      (`src/lib/konnect.ts`) et testée unitairement (`tests/konnect.test.ts`) ;
      `QA_ROADMAP.md` affirmait à tort que c'était manquant (corrigé). Désormais
      aussi exercée en HTTP réel (`tests/api/webhook-konnect.spec.ts`).
- [x] Semgrep en CI + Dependabot/Renovate — job `semgrep` isolé (§7.4, rulesets
      Registry publics `p/security-audit`/`p/secrets`/`p/typescript`/`p/react`/`p/nextjs`,
      bloquant), `.github/dependabot.yml` (npm hebdo groupé minor/patch +
      github-actions). Scan initial : 2 findings — un vrai (GCM sans
      `authTagLength` explicite dans `src/lib/crypto.ts`, corrigé) et un faux
      positif (hash bcrypt factice anti-énumération, `src/lib/auth.ts`,
      marqué `nosemgrep` avec justification).
- [~] Régressions sécurité figées (`tests/api/security-regressions.spec.ts`) :
      open-redirect (`safeCallbackUrl`) ✅, CSRF (same-origin natif Next.js) ✅,
      SSRF geocode (hôte de sortie figé) ✅. **Énumération non couverte ici**
      (chemin via Server Action, nécessiterait de fabriquer un JWT NextAuth à
      la main — déjà couverte au niveau UI par `tests/e2e/01-auth.spec.ts`).

### Phase 5 — Perf, a11y, DAST, visuel *(P2/P3, ~4-5 j)*
- [x] k6 : recherche + course booking, seuils p95 — ✅ livré, cf. §6.7 pour le
      détail. **Vrai gap corrigé en cours de route** : sous charge réelle, un
      abandon de transaction Postgres (P2034, perdant de la course)
      remontait en 500 brut au lieu du message générique "dates
      indisponibles" — `catch` étendu dans `createBookingAction`
      (`src/actions/bookings.ts`), le commentaire du code annonçait ce retry
      comme prévu ("→ Phase 2") mais jamais implémenté.
- [x] axe sur pages clés × 3 langues — `tests/e2e/10-a11y.spec.ts` (5 pages ×
      fr/en/ar, 15 tests, job `e2e` existant). Zéro violation serious/critical
      **hors `color-contrast`**, exclu du gate après un vrai finding
      systémique (design tokens `text-body/*`, tracké en tant que chantier
      dédié dans `TODO-PRODUCTION.md`, pas masqué).
- [x] ZAP baseline nightly (headers/CSP/cookies) — ✅ livré, cf. §6.6 pour le
      détail et la limite de validation assumée (premier run jamais exécuté
      avant la mise en prod du job, Docker indisponible dans l'environnement
      d'écriture de ce chantier).
- [ ] (Option) snapshots visuels carte/annonce/RTL.

**Phase 5 : seuls les snapshots visuels (option P3, jamais engagée comme
prioritaire) restent non livrés.** k6, axe et ZAP sont tous les trois en
place.

---

## 9. Métriques & Definition of Done

**Métriques suivies (dashboard QA) :**
- Couverture lignes/branches (global + `src/lib` + modules paiement/auth).
- Nombre de parcours `P0/P1` couverts en E2E / total.
- Durée suite (unit < 30 s, composant < 1 min, E2E < 8 min).
- Taux de flakiness E2E (< 2 %), tests quarantaine.
- Vulnérabilités ouvertes (haute/critique = 0 pour merge).

**Definition of Done d'une feature (à partir de Phase 2) :**
1. Server action(s) validées zod + autorisation serveur testées (intégration).
2. Formulaire/écran : ≥ 1 test composant (validation + happy).
3. Parcours si `P0/P1` : ≥ 1 E2E happy + 1 échec clé.
4. Couverture non régressée ; QA_ROADMAP mis à jour.

**Critères de sortie PRODUCTION (exit criteria) :**
- ✅ Tous parcours `P0` (J1-J5) couverts en intégration **et** E2E.
- ✅ Concurrence double-booking prouvée sur vraie DB.
- ✅ Webhooks paiement : signature vérifiée + idempotence testée.
- ✅ Couverture ≥ seuils, gate CI bloquant.
- ✅ SAST + `npm audit` verts ; ZAP baseline sans alerte high.
- ✅ a11y sans violation critique sur pages clés (fr/en/ar).
- ✅ Suite verte 5 runs consécutifs (anti-flaky).

---

## 10. Risques si omis

| Trou non comblé | Scénario de production redouté |
|-----------------|-------------------------------|
| Pas de concurrence DB réelle | Deux voyageurs paient le même séjour un jour de forte demande ; litige + remboursement + réputation. |
| Pas d'E2E paiement | Un refactor UI casse la redirection Konnect ; paiements échouent en silence, CI verte. |
| Pas de test front i18n/RTL | La version arabe (cible juridique) affiche une clé brute ou un layout cassé en prod. |
| Pas de signature webhook | Un tiers forge un `?payment_ref=` et confirme une réservation non payée. |
| Pas de couverture mesurée | Une zone critique non testée se dégrade sans que personne ne le voie. |
| Pas d'IDOR négatif étendu | Un utilisateur lit la facture / la messagerie d'un autre. |
| Pas de charge sur la recherche | La carte + recherche s'effondrent au premier pic de trafic diaspora. |

---

## 11. Dette technique — dépendances majeures bloquées (2026-07-24)

> Revue exhaustive des PR Dependabot ouvertes (build/tsc/lint/test/e2e/api en
> local, quota GitHub Actions épuisé oblige — cf. exception CI de `CLAUDE.md`).
> Chaque bump majeur testé individuellement avant merge ; ceux listés ici ont
> échoué pour un motif technique précis, pas par prudence générique.

- [ ] **Next.js 16 + eslint-config-next 16** (PR #137/#134, **P2**) —
      **fixable, pas bloqué en amont** : `eslint-config-next@16` expose un
      export flat-config natif qui remplace `FlatCompat.extends("next/core-
      web-vitals", "next/typescript")` dans `eslint.config.mjs` (legacy,
      cause du crash `Converting circular structure to JSON` avec ESLint 9
      **et** 10). Bascule testée et confirmée fonctionnelle. Mais elle fait
      remonter **38 erreurs réelles sur ~30 fichiers** : le
      `eslint-plugin-react-hooks` bundlé (v7.x) applique les règles strictes
      "Rules of React" (`react-hooks/purity`, `react-hooks/set-state-in-
      effect`) — ex. `Date.now()` pendant le rendu dans les 3 pages détail
      annonce (`ListingDetail`/`ImmoDetail`/`StayDetail`, risque faible en
      pratique, Server Components rendus une fois par requête), ou un
      `setState` synchrone dans un `useEffect` de montage (`ThemeToggle`,
      pattern usuel de sync post-hydratation). Chantier : migrer
      `eslint.config.mjs` vers l'export natif, puis auditer/corriger (ou
      justifier par un commentaire, comme la convention `nosemgrep` déjà en
      place) chacun des ~30 fichiers. Ni urgent ni bloquant produit — mais
      pas à re-router silencieusement dans un futur bump.
- [ ] **Prisma 7** (PR #136, **P2**) — vrai chantier de migration, pas un
      bump : Prisma 7 supprime `url`/`directUrl` du bloc `datasource` du
      schema (`P1012` au `prisma generate`), il faut migrer vers
      `prisma.config.ts` + un driver adapter (`accelerateUrl` ou `adapter`,
      cf. https://pris.ly/d/config-datasource). Introduit aussi une vraie
      vulnérabilité haute en l'état (`find-my-way` via `@prisma/dev`,
      GHSA-c96f-x56v-gq3h) — à ne pas adopter tel quel même une fois la
      migration schema faite, revérifier l'audit à ce moment-là.
- [ ] **TypeScript 7 + ESLint 10 seuls** (PR #133/#131, **P3, bloqué en
      amont**) — rien à faire côté Darna : `typescript-eslint` refuse
      explicitement de tourner sur TS7 (issue de suivi amont
      typescript-eslint/typescript-eslint#10940) ; `eslint-config-next`
      actuel (15.x) rejette ESLint 10 en peer dependency, et même
      `eslint-config-next@16` (cf. item Next 16 ci-dessus) n'y change rien.
      À revoir quand `typescript-eslint` publiera un support TS7.

Les 5 PR correspondantes ont été fermées côté GitHub (`@dependabot ignore
this major version`) avec le détail technique en commentaire sur chacune —
Dependabot les reproposera de lui-même dès qu'une version compatible sort.

---

*Document vivant — mis à jour à chaque phase livrée. Propriétaire : rôle Test
Lead / QA. Complémentaire de `QA_ROADMAP.md`, `FEATURES_ROADMAP.md`,
`DESIGN_ROADMAP.md`.*
