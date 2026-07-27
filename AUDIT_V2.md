# DARNA — AUDIT PRODUIT V2

> **Audit CTO/CPO/advisor — état au 2026-07-27, branche `main` (post PR #197).**
> Remplace `AUDIT_V1.md` (2026-06-24) comme état des lieux de référence : la
> quasi-totalité des manques bloquants de V1 (messagerie, reset MDP, annulation,
> HMAC webhook, instrumentation…) sont comblés depuis.
>
> **Document d'analyse uniquement** — le plan d'exécution qui en découle est
> `LANCEMENT_ROADMAP.md` (chantier actif). Ne pas dispatcher de tâches depuis
> ce fichier : toute tâche actionnable vit dans la roadmap, avec sa spec.

---

## RÉSUMÉ EXÉCUTIF

Trois constats structurent tout le reste :

1. **Le produit a largement dépassé l'AUDIT_V1.** En un mois : messagerie
   anti-bypass (scan PII + suspension progressive), reset mot de passe,
   annulation voyageur ET hôte avec politiques, paiement sur place (acompte
   anti-bypass + facturation hôte), webhook Konnect auto-signé HMAC,
   monétisation à 4 étages (commission 8 %, boost 29 TND, abonnements agence,
   packs de crédits de vérification), programme de crédits avec ledger
   append-only, instrumentation produit complète avec dashboards admin.
   ~95 suites de tests unitaires + e2e + API + k6 + axe + ZAP. La qualité
   d'ingénierie est très au-dessus de la médiane seed.

2. **Mais le déséquilibre s'est aggravé.** ~50 PR mergées depuis juin — quasi
   toutes du code. Pendant ce temps : zéro déploiement, zéro utilisateur réel,
   zéro annonce réelle, base 100 % seedée, CI coupée depuis le 22/07 (quota
   GitHub Actions). Le ratio effort-produit / effort-marché est ~100/0.
   Chaque roadmap terminée en a généré deux nouvelles (doublon G9/CR0 déjà
   survenu entre GROWTH et CROISSANCE).

3. **L'objectif déclaré — « une première version de démonstration en
   production » — n'a aucune existence dans le dépôt.** Pas de Dockerfile, pas
   de config d'hébergement, pas de staging, et `INFRA_ROADMAP.md` était
   référencé par CLAUDE.md sans exister. C'est le seul chantier sans roadmap —
   corrigé par `LANCEMENT_ROADMAP.md`.

---

## LES 10 RECOMMANDATIONS (synthèse — spec exécutable dans LANCEMENT_ROADMAP.md)

| Rang | Recommandation | Catégorie | Priorité | Effort | Impact | Quick win |
|---|---|---|---|---|---|---|
| 1 | Mise en production + staging (infra complète) | Infra/DevOps | 🔴 | M | ⭐⭐⭐⭐⭐ | non |
| 2 | Gel des features growth → offre réelle et GTM | Produit/Business | 🔴 | XS (décision) | ⭐⭐⭐⭐⭐ | ✅ |
| 3 | Vérité financière : payout manuel, réconciliation, avis BCT | Business/Juridique | 🔴 | S-M | ⭐⭐⭐⭐⭐ | partiel |
| 4 | CI automatique restaurée (pyramide de jobs) | DevOps/Qualité | 🟠 | S | ⭐⭐⭐⭐ | ✅ |
| 5 | Monitoring prod (Sentry, uptime, alertes paiement) | Monitoring/SRE | 🟠 | S | ⭐⭐⭐⭐ | ✅ |
| 6 | Inscription sans rôle + Google OAuth | UX/Acquisition | 🟠 | M | ⭐⭐⭐⭐ | non |
| 7 | RGPD/ePrivacy réel (darna-vid, rétention, export/effacement) | Juridique/RGPD | 🟠 | M | ⭐⭐⭐ | non |
| 8 | Scheduler minimal (débloque G6, purges, réconciliation) | Architecture | 🟡 | S | ⭐⭐⭐ | ✅ |
| 9 | Mobile réel : PWA, budget perf, contraste WCAG | UX/Perf/A11y | 🟡 | M | ⭐⭐⭐ | non |
| 10 | Vérité documentaire (README périmé, archivage roadmaps) | Documentation | 🟡 | XS-S | ⭐⭐⭐ | ✅ |

### Détail des constats clés par recommandation

**R1 — Production.** Tout est prêt *dans le code* (split pooler/`directUrl`,
`STORAGE_MODE=s3`, Redis, modes fail-fast, `TRUSTED_PROXY`) mais rien n'est
déployé. Le webhook Konnect ne peut pas fonctionner en local : le chemin
nominal du paiement réel n'a jamais été exercé. Toute une classe de bugs
(CSP+HTTPS réels, cookies Secure, latence poolée, cold starts) n'existe qu'en
prod.

**R2 — Gel.** Un arsenal growth complet (parrainage+ledger, promos, Super-Hôte,
simulateur, signaux, complétude, mur de confiance, 3 systèmes de crédits
distincts) a été construit pour zéro utilisateur. Chaque feature growth sans
trafic est invérifiable ; la complexité s'accumule ; l'orchestration autonome
optimise la vitesse de production de code — la mauvaise métrique à ce stade.

**R3 — Finance.** L'argent Konnect reste sur le wallet Darna ; « escrow:
LIBERE » est un flag sans virement ; `/dashboard/revenus` affiche « Awaiting
payout » pour un payout inexistant ; les remboursements sont des écritures
comptables (l'API Konnect n'a AUCUN endpoint de remboursement — vérifié,
cf. CLAUDE.md §AHC8). Question d'agrément BCT (fonds de tiers) non traitée.
La promesse centrale « votre argent est protégé » n'est pas tenue par le flux
financier. Risque existentiel dès le premier dinar réel.
**→ TRANCHÉ le 2026-07-27 (session avec Wassim)** : modèle
**« commission-only »** en V1 — Darna n'encaisse en ligne que ses frais
(10 % du loyer, au-dessus du prix hôte), le loyer se règle 100 % sur place,
zéro fonds de tiers ; garanties de confiance sans détention d'argent
(remboursement des frais par politique, garantie non-conformité 24 h,
indemnité no-show hôte = 100 % des frais plafonnée, pénalités d'annulation
hôte déjà codées) ; le séquestre/paiement intégral en ligne devient la **V2**,
conditionnée à l'avis juridique. Spec exécutable : `LANCEMENT_ROADMAP.md`
§« Modèle de paiement V1 » + §L5.

**R4 — CI.** Quota Actions épuisé le 22/07, `ci.yml` en dispatch-only, rituel
de checks manuels par merge (~20 min) qui sera sauté. Cause racine non résolue :
build+e2e+api+semgrep+ZAP sur chaque push re-brûlera le quota en 3 semaines.

**R5 — Monitoring.** `observability.ts` existe mais rien n'est branché : pas
d'agrégation d'erreurs, pas d'uptime, pas d'alerte paiement/auth. En prod sans
monitoring, les incidents sont découverts par les utilisateurs.

**R6 — Onboarding.** Le choix de rôle VOYAGEUR/HOTE/AGENCE à l'inscription est
un conversion-killer identifié dès AUDIT_V1 (#17), jamais traité. Auth
credentials-only ; « Continuer avec Google » sur mobile est la différence entre
~60 % et ~25 % de complétion pour la cible diaspora.

**R7 — RGPD.** Le bandeau cookies (`CookieConsent.tsx`) est purement
informatif : « Accepter » et « Refuser » produisent le même effet. Or le
middleware pose `darna-vid` à tout visiteur et ce cookie alimente
`ProductEvent`/`PropertyView` — de la mesure d'audience, pas du « strictement
nécessaire ». Pas d'export, pas d'effacement, pas de purge automatisée. Cible
n°1 = diaspora France = utilisateurs RGPD.

**R8 — Scheduler.** Le principe « zéro cron » (lazy-expiry) est parfait pour
de l'ÉTAT, structurellement incapable de produire des ACTIONS SORTANTES
(e-mail de relance, réconciliation externe, purge). Quatre besoins réels sont
bloqués dessus : G6 (relance abandon, P1), purges RGPD, réconciliation
Konnect, rappels de factures (PSP5).

**R9 — Mobile.** Marché tunisien mobile-first >90 %. La règle axe
`color-contrast` est EXCLUE du gate car elle échoue (`text-body/60` → 4.05:1,
systémique, documenté dans TODO-PRODUCTION §Accessibility). Pas de manifest
PWA, pas de test device réel documenté, pas de budget perf front.

**R10 — Docs.** Le README annonce « Prisma + SQLite », « interface en français
uniquement », « photos placeholders », « aucune clé API » — tout est faux
depuis longtemps : il SOUS-VEND massivement le projet. 16 fichiers de
pilotage, un doublon inter-roadmaps déjà survenu, AUDIT_V1 périmé sans bandeau.

---

## LES 3 DÉCISIONS À CONSERVER ABSOLUMENT

1. **Monolithe modulaire + modes fail-fast.** Verticales core/stay/immo
   séparables par tables satellites et flags, modes demo/konnect/s3/production
   validés au boot, défauts toujours sûrs. Bon niveau d'architecture pour ce
   stade : optionnalité maximale sans coût microservices. Ne pas splitter.
2. **Sécurité/intégrité par construction.** zod partout, authz serveur, prix
   recalculés, SERIALIZABLE anti-double-booking, settlements idempotents,
   ledger append-only, CIN chiffrée + hash d'unicité, webhook auto-signé,
   audit trail — le tout testé. Socle de la promesse « confiance ».
3. **Le positionnement et ses moats locaux.** « Le logement vérifié »,
   vérification terrain Wakil, avis garantis par le schéma, translittération,
   trilingue FR/EN/AR RTL. Thèse cohérente sur un marché réellement cassé.

## LES 3 PLUS GROS RISQUES

1. **Cold-start jamais entamé, masqué par la vélocité de code.** Zéro
   utilisateur ; la machine à features donne une sensation de progrès que le
   marché ne récompense pas. Risque n°1, comportemental.
2. **Risque financier/réglementaire du quasi-séquestre.** Fonds de tiers sur
   le wallet Konnect de Darna sans payout ni remboursement programmatique,
   sans clarification BCT ni statut fiscal saisonnier.
3. **Bus factor 1 aggravé par l'orchestration autonome.** Merges autonomes +
   CI coupée + NextAuth beta + dérive documentaire déjà observée : la
   combinaison est le scénario d'accident type.

## LES 3 OPPORTUNITÉS SOUS-EXPLOITÉES

1. **L'Indice Darna comme machine SEO/presse** : pages programmatiques
   « Prix immobilier à {ville} » (socle SEO déjà excellent) + rapport
   trimestriel PDF presse. Position de « source de référence » à prendre,
   gratuite, alignée confiance.
2. **WhatsApp transactionnel** : l'infra Meta Cloud API est déjà câblée (OTP).
   L'étendre aux confirmations/relances/notifications = différenciant majeur
   sur le canal dominant en Tunisie. Combo naturel avec le scheduler (R8).
3. **Le simulateur de revenus (G1) comme aimant hors-plateforme** : landing
   autonome partageable + capture d'e-mail, poussée dans les groupes Facebook
   propriétaires/diaspora = meilleur outil de recrutement d'offre.

---

_Fin de l'audit V2. Le mot de la fin : Darna a un problème rare — le produit
est en avance sur l'entreprise. La qualité d'exécution est celle d'une équipe
financée ; la traction est celle d'une idée sur une serviette. Tout converge
vers un seul mouvement : arrêter d'améliorer la machine, la mettre en contact
avec la réalité. Le code est prêt depuis plus longtemps qu'on ne le pense._
