# Darna — Priorités & dispatch multi-session : Roadmap maîtresse

> Document de pilotage transverse, généré le 2026-07-21. Consolide et priorise
> les tâches ouvertes de `GROWTH_ROADMAP.md`, `CROISSANCE_ROADMAP.md`,
> `INSTRUMENTATION_ROADMAP.md`, `PAIEMENT_SUR_PLACE_ROADMAP.md`,
> `MONETISATION_IMMO_ROADMAP.md`, `TEST_AUTOMATION_ROADMAP.md` et
> `QA_ROADMAP.md`. **Ne remplace aucun de ces fichiers** — chacun reste la
> référence détaillée (specs, fichiers concernés, tests) pour sa tâche. Celui-ci
> répond à une seule question : **par quoi commencer, et qu'est-ce qui peut
> tourner en parallèle dans des sessions séparées ?**

## Comment l'utiliser

- Une ligne = une tâche = une session Claude Code dédiée. Donner l'ID (ex.
  « IN1 ») + le fichier source à la session : elle y trouve la spec complète.
- **Ne jamais paralléliser deux tâches du même chantier** (convention
  existante « à enchaîner un par un ») — une seule session à la fois par
  fichier `*_ROADMAP.md`.
- Entre chantiers différents, parallélisable **sauf mention contraire**
  ci-dessous (⚠️ = risque de conflit de fichier identifié).
- Dès qu'une tâche est livrée : cocher ✅ ici **et** dans le fichier roadmap
  source (même règle que le reste du projet) — sinon ce fichier dérive et
  devient trompeur pour la prochaine session qui le lit.

## 🔔 Correction apportée avant priorisation

**Doublon G9 / CR0-CR2.** `GROWTH_ROADMAP.md` (G9, parrainage bidirectionnel)
et `CROISSANCE_ROADMAP.md` (CR0-CR2, même fonctionnalité) ont été écrits en
parallèle, chacun ignorant l'autre. CR0-CR2 est la version aboutie (wallet
dédié + ledger + montants tranchés + plafonds) — **G9 est retiré de la queue
ci-dessous**. Première session qui touche `GROWTH_ROADMAP.md` : remplacer la
ligne G9 par `✅ Voir CR0-CR2 (CROISSANCE_ROADMAP.md)`.

## ⛔ Bloqué sur toi, pas sur du code (hors dispatch dev)

| Item | Roadmap | Attend |
|---|---|---|
| **PSP9** | `PAIEMENT_SUR_PLACE_ROADMAP.md` | Ton arbitrage tarification en ligne/sur place — corrigé le 2026-07-24 : PR #157 (mergée) n'a documenté QUE la question ouverte, aucun code PSP9 n'existe, rien à merger — tout reste à écrire une fois l'arbitrage tranché |
| **MI5** | `MONETISATION_IMMO_ROADMAP.md` | Partenariat bancaire externe non signé — le lead-capture (modèle `FinancingLead`) peut être codé en amont si tu veux avancer sans attendre |

## 🔧 Dette dépendances (ni bloqué sur toi, ni du code produit)

Revue complète des PR Dependabot faite le 2026-07-24 (12/17 mergées). Détail
technique complet dans `TEST_AUTOMATION_ROADMAP.md` §11 — 5 PR fermées
(`@dependabot ignore this major version`), pas perdues :

| Item | Roadmap source | Nature du blocage |
|---|---|---|
| Next.js 16 + eslint-config-next 16 | TEST_AUTOMATION §11 | Fixable (migration `eslint.config.mjs` identifiée) mais fait remonter 38 erreurs "Rules of React" sur ~30 fichiers — chantier dédié, pas un bump |
| Prisma 7 | TEST_AUTOMATION §11 | Vrai chantier de migration (schema → `prisma.config.ts` + adapter) |
| TypeScript 7 + ESLint 10 seuls | TEST_AUTOMATION §11 | Bloqué en amont (`typescript-eslint` ne supporte pas encore TS7) — rien à faire, revoir périodiquement |

## ✅ Chantiers clos ou quasi (rien d'urgent)

- `ANNULATION_HOTE_ROADMAP.md` + `ANNULATION_HOTE_CORRECTIFS_ROADMAP.md` — 100 %, clos 2026-07-08
- `FEATURES_ROADMAP.md` — 100 %
- `DESIGN_ROADMAP.md` — 100 %
- `PAIEMENT_SUR_PLACE_ROADMAP.md` — PSP0-PSP7 ✅ (virement bancaire et ClicToPay explicitement écartés), ne reste que PSP9 (bloqué, voir ci-dessus)
- `MONETISATION_IMMO_ROADMAP.md` — MI0-MI4/MI6 ✅, ne reste que MI5 (bloqué, voir ci-dessus)
- `TEST_AUTOMATION_ROADMAP.md` — Phases 1-4 ✅ complètes. Phase 5 : k6/axe/ZAP ✅ livrés, ne reste qu'un optionnel jamais priorisé (snapshots visuels carte/annonce/RTL, P3)

---

## Queue d'exécution priorisée

### Vague 1 — lancer maintenant, en parallèle (pas de dépendance entre elles)

| # | Tâche | Prio source | Roadmap | Note |
|---|---|---|---|---|
| 1 | **IN1** — Funnel de découverte (`SEARCH_PERFORMED`, `BOOKING_STARTED`) | P1 | INSTRUMENTATION | ✅ PR #164 |
| 2 | **G8** — Fraîcheur de vérification en résultats de recherche | P2 | GROWTH | ✅ PR #165 |
| 3 | **G10** — Mur de la confiance en direct (home) | P2 | GROWTH | ✅ PR #167 |
| 4 | **G4** — Défi « Hôte Zéro Faille » | P2 | GROWTH | ✅ PR #170 |
| 5 | **PM0** — Fondations promo hôte (`promoPrice`/`promoUntil`) | P0 | CROISSANCE | ✅ PR #169 |

✅ Risque de conflit PM1/G8 sur `PropertyCard.tsx`/`Badges.tsx` évité par le
séquencement en vagues séparées, comme prévu. Le conflit réel rencontré au
merge de PM1 (#172) était sur `src/lib/i18n/{fr,en,ar}.ts` avec G4 (#170, clés
`superHote*` vs `promo*` au même endroit) — résolu en gardant les deux, aucune
ligne en litige.

### Vague 2 — après la vague 1 (dépendances directes)

| # | Tâche | Prio source | Roadmap | Dépend de |
|---|---|---|---|---|
| 6 | **PM1** — UI hôte promo + badge | P0 | CROISSANCE | ✅ PR #172 |
| 7 | **CR0** — Fondations crédits (`CreditWallet`/`CreditTransaction`/`referralCode`) | P0 | CROISSANCE | ✅ PR #187 |
| 8 | **IN2** — Adoption features (`SIMULATOR_USED`, `SHARE_CLICKED`, `SAVED_SEARCH_CREATED`, `MAP_INTERACTED`) | P1 | INSTRUMENTATION | ✅ PR #173 — 1ère touche d'acquisition (`ref`/UTM) différée à `CROISSANCE_ROADMAP.md` §CR0 (aucun consommateur avant le vrai modèle d'attribution) |
| 9 | **G2** — Barre de complétude d'annonce | P1 | GROWTH | ✅ PR #179 |
| 10 | **G1** — Simulateur de revenus | P1 | GROWTH | ❌ pas commencé — corrigé le 2026-07-24 : confondu à tort avec PR #179 (qui ne couvrait que G2), aucun code trouvé (`GROWTH_ROADMAP.md` le montre bien `❌`) |

### Vague 3

| # | Tâche | Prio source | Roadmap | Dépend de |
|---|---|---|---|---|
| 11 | **CR1** — Parcours voyageur crédits (page, application au checkout) | P0 | CROISSANCE | ✅ PR #188 |
| 12 | **CR4 / PM5** — QA transverse crédits + promos | P0 | CROISSANCE | ✅ CR4 PR #189 — PM5 (promos) reste à confirmer, probablement déjà couvert par les tests PM0/PM1 existants |
| 13 | **IN3** — Panneaux dashboard admin (funnel/adoption) | P1 | INSTRUMENTATION | IN1 + IN2 (données à afficher) |
| 14 | **G3** — « Suggérer un logement » | P2 | GROWTH | Flux voyageur établi (post G1/G2) |

### Vague 4 — extensions

| # | Tâche | Prio source | Roadmap | Dépend de |
|---|---|---|---|---|
| 15 | **PM2** — Nudge promo automatique | P1 | CROISSANCE | PM0/PM1 |
| 16 | **CR2** — Parrainage hôte | P1 | CROISSANCE | CR0 |
| 17 | **CR3** — Crédit de bienvenue spontané | P2 | CROISSANCE | CR0 |
| 18 | **G6** — Relance de réservation abandonnée | P1 | GROWTH | Tension « zéro cron » à trancher avec toi (voir fichier source) |
| 19 | **G5** — Signaux de dynamique temps réel | P2 | GROWTH | IN1 (`BOOKING_STARTED` pour mesurer) |

### Vague 5 — campagnes, pilotage, rétention long terme

| # | Tâche | Prio source | Roadmap | Dépend de |
|---|---|---|---|---|
| 20 | **PM3** — Promo Darna (campagne plateforme) | P1 | CROISSANCE | Fondations validées (PM0-PM2) |
| 21 | **CR5 / PM4** — Dashboards exposition/décision | P1/P2 | CROISSANCE | CR0-CR3/PM0-PM3 |
| 22 | **G7** — Fidélité voyageur cumulative | P2 | GROWTH | Historique de réservations réel |
| 23 | **CR6** — Leviers de rentabilité long terme | P2 | CROISSANCE | Données réelles disponibles |
| 24 | **IN4** — Discipline continue (checklist `QA_ROADMAP.md`) | P2 | INSTRUMENTATION | Process, pas du code — à adopter dès IN1 livré |

### Optionnel / opportuniste (pas de fenêtre imposée)

- **Snapshots visuels** (carte/annonce/RTL) — `TEST_AUTOMATION_ROADMAP.md` Phase 5, P3, jamais priorisé
- **MI5 lead-capture** — `MONETISATION_IMMO_ROADMAP.md`, code amont possible avant partenariat signé

## Toile de fond permanente

`QA_ROADMAP.md` — 52 items ouverts, surtout du hardening pour des
fonctionnalités pas encore construites (reset mot de passe, vrai KYC, export
RGPD…) ou des tests de sécurité génériques (CSRF, cookies, session). Pas un
chantier à dispatcher en soi — tirer les items pertinents au fur et à mesure
qu'une tâche ci-dessus touche la même surface (ex. CR4/PM5 doivent y ajouter
leur propre section, comme fait pour MI0/MI2/MI3/MI4).

---

_Généré le 2026-07-21 à partir de l'état des roadmaps sur `main` (post #159,
#160, #161, #162). À maintenir : cocher ici en même temps que dans le fichier
source._
