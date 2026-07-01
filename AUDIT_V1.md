# DARNA — AUDIT PRODUIT V1

**Audit commandé en vue d'un tour de Seed — revue produit/UX/technique indépendante.**

> Panel : ex-VP Product Airbnb · ex-Head of Product Booking.com · ex-Head of Design Airbnb · ex-Marketplace Growth Director · UX Researcher (travel) · expert paiement/trust&safety · expert marchés émergents Afrique du Nord (Tunisie).
>
> Méthode : revue du code réel (schéma Prisma, server actions, libs, pages, middleware, tests). **Aucune fonctionnalité n'est créditée sans preuve dans le code.** Les éléments mockés, incomplets ou absents sont signalés explicitement.
>
> Date : 2026-06-24 · Branche auditée : `claude/funny-cannon-3if2ta` · Commit de tête : `d848203`.

---

## RÉSUMÉ EXÉCUTIF (TL;DR investisseur)

Darna n'est **pas** un projet étudiant. C'est un MVP d'une qualité d'ingénierie nettement supérieure à la médiane des seed que je vois passer : Next.js 15 / TypeScript strict, architecture en verticales avec feature-flags, transactions PostgreSQL SERIALIZABLE anti-double-booking, OTP haché + TTL, CIN chiffrée AES-256-GCM, rate-limiting distribué Redis, audit trail, CSP par nonce, i18n trilingue FR/EN/AR avec RTL, séquestre Konnect réel optionnel, **26 fichiers de tests**, et deux documents de durcissement (`TODO-BETA.md`, `TODO-PRODUCTION.md`) qui montrent une rare lucidité sur ce qui manque.

**Mais** — et c'est ce qui détermine l'investabilité — la valeur d'un marketplace ne se mesure pas en qualité de code. Elle se mesure en **liquidité** (offre × demande qui transacte) et en **défendabilité**. Sur ces axes, Darna est aujourd'hui une **promesse de produit**, pas un produit prouvé :

1. **Le « séquestre » n'en est pas un.** L'argent Konnect arrive directement sur le wallet Darna ; la « libération » à l'hôte est un simple flag en base (`escrow: "LIBERE"`), **sans aucun virement réel vers l'hôte**. Il n'existe aucun système de payout. C'est le cœur de la proposition de valeur (« votre argent est protégé ») et il est, à ce jour, **non implémenté côté flux financier**.
2. **L'offre ne peut pas scaler.** Toute annonce naît `EN_ATTENTE_VALIDATION` et n'est visible qu'après vérification **manuelle** par un admin/Wakil. C'est un excellent argument de confiance et un **goulot d'étranglement opérationnel** qui plafonne mécaniquement la croissance de l'offre à la capacité humaine du réseau Wakil.
3. **Pas de messagerie, pas d'annulation/remboursement, pas de reset mot de passe, pas d'app mobile.** Trois briques attendues d'un marketplace de logement et une faille auth opérationnelle.
4. **OTP démo, EUR statique, KYC sans provider réel.** Assumés comme mocks, mais ce sont des mocks sur le chemin critique de la confiance.

**Verdict court : investable en pré-seed/seed sur la *qualité d'exécution de l'équipe* et la pertinence du positionnement « confiance » sur un marché (Tunisie) réellement cassé — pas sur la traction produit, qui n'existe pas encore.** Voir Phase 10.

---

# PHASE 1 — INVENTAIRE PRODUIT

Statut : ✅ implémenté & réel · 🟡 implémenté mais mock/partiel · 🔴 absent/annoncé.

## Guest Features (Voyageur)
| Feature | Statut | Complétude | Production-ready ? |
|---|---|---|---|
| Inscription e-mail/mot de passe + rôle | ✅ | 90% | Oui (manque reset MDP) |
| Recherche séjours (ville/dates/voyageurs) | ✅ | 90% | Oui |
| Recherche tolérante translittération (`7ammamet`→Hammamet) | ✅ | 95% | Oui — différenciant réel |
| Vue liste + carte Leaflet/OSM marqueurs prix | ✅ | 90% | Oui |
| Suggestions d'élargissement (villes proches si 0 résultat) | ✅ | 90% | Oui — excellent pour rétention |
| Page annonce (galerie, équipements, carte, avis, bloc confiance) | ✅ | 90% | Oui |
| Favoris + dossiers (« Monastir, Juin 2026 ») | ✅ | 85% | Oui |
| Réservation (hold 15 min, anti-double-booking) | ✅ | 90% | Oui (manque annulation) |
| Devis live côté serveur (récap dynamique) | ✅ | 90% | Oui |
| Bascule devise TND/EUR diaspora | 🟡 | 70% | Taux **statique 3,4** codé en dur — UI only |
| Avis (uniquement après réservation confirmée) | ✅ | 95% | Oui — contrainte au niveau schéma |
| Messagerie hôte↔voyageur | 🔴 | 0% | Absente (seul un formulaire de contact one-shot existe) |
| Reset mot de passe | 🔴 | 0% | Absent (listé TODO-BETA) |
| Annulation / remboursement | 🔴 | 0% | Absent |

## Host Features (Hôte / Agence)
| Feature | Statut | Complétude | Prod-ready ? |
|---|---|---|---|
| Création annonce (séjour/location/vente) + upload photos | ✅ | 90% | Oui |
| Générateur de description (templates FR, pas d'IA) | ✅ | 80% | Oui (basique mais honnête) |
| Édition annonce, gestion photos (cover, légende, ordre) | ✅ | 90% | Oui |
| Calendrier de blocage de dates (+ note privée) | ✅ | 90% | Oui |
| Marquer loué/vendu, republier (+30j) | ✅ | 90% | Oui |
| Mise en avant « à la une » (boost payant) | 🟡 | 70% | Paiement **mock** (49 TND, pas de débit réel) |
| Yield Advisor (saisonnier vs longue durée) | ✅ | 75% | Calcul réel depuis la base, hypothèses statiques |
| Dashboard demandes de contact | ✅ | 85% | Oui |
| Payout / réception des fonds | 🔴 | 0% | **Absent — bloquant** (cf. Phase 5) |

## Booking Features
| Feature | Statut | Note |
|---|---|---|
| Hold EN_ATTENTE 15 min + expiration paresseuse | ✅ | Élégant, sans cron |
| Transaction SERIALIZABLE anti-double-booking | ✅ | Niveau pro |
| Prix recalculé serveur (jamais confiance client) | ✅ | Correct |
| Cycle de vie auto (CONFIRMEE→TERMINEE→escrow LIBERE) | 🟡 | Flag en base, pas de mouvement d'argent |
| Annulation, no-show, litige | 🔴 | Absents |

## Search Features
| Feature | Statut | Note |
|---|---|---|
| Filtres séjours (ville/dates/voyageurs/capacité) | ✅ | Sur table satellite StayDetails |
| Filtres immo (transaction/gouvernorat/prix/surface/pièces) | ✅ | Corrects |
| Pagination (PAGE_SIZE 24) | ✅ | OK |
| Tri (à la une → vérifié → récent) | ✅ | Cohérent |
| Indice de prix `/prix-du-marche` | ✅ | Barres CSS, données réelles |
| Filtres avancés (équipements, note, type de bien, carte-as-filter) | 🔴 | Absents — recherche pauvre vs Airbnb/Booking |

## Payment Features
| Feature | Statut | Note |
|---|---|---|
| Séquestre simulé (mode démo) | 🟡 | Flag DB, marqué `demo: true` |
| Konnect réel (init + webhook + page retour) | ✅ | Code solide, idempotent, montant revérifié serveur |
| Conversion TND→millimes | ✅ | Correcte |
| Webhook signature HMAC | 🔴 | **Absente** — repose sur opacité du payment_ref + re-fetch Konnect |
| Payout vers l'hôte / vrai séquestre tiers | 🔴 | **Absent — c'est LE trou** |
| Remboursement / chargeback | 🔴 | Absent |
| Cash à l'arrivée (attente marché TN) | 🔴 | Absent |

## Trust & Safety
| Feature | Statut | Note |
|---|---|---|
| Vérification annonce (badge Vérifié Darna REMOTE/ON_SITE) | ✅ | Workflow admin/Wakil réel |
| Vérification e-mail (OTP) | 🟡 | Resend optionnel, sinon code à l'écran |
| Vérification téléphone (OTP SMS/WhatsApp) | 🟡 | Twilio/Meta câblés, démo = code à l'écran |
| KYC CIN (chiffrée, hash unique inter-comptes) | 🟡 | Pas de provider doc/liveness réel |
| Gate réservation (e-mail + tél vérifiés) | ✅ | Backstop serveur |
| Audit trail (login/booking/paiement…) | ✅ | Complet |
| Anti-énumération, rate-limit, CSP nonce, headers | ✅ | Niveau pro |
| Anti-fraude documentaire / synthetic identity | 🔴 | Absent |

## Messaging
| Feature | Statut |
|---|---|
| Formulaire de contact one-shot (immo) → ContactRequest | ✅ |
| Inbox / fil de discussion bidirectionnel | 🔴 Absent |

## Notifications
| Feature | Statut |
|---|---|
| E-mail OTP (inscription, vérif) | 🟡 mock par défaut |
| Notification admin nouvelle annonce | ✅ (e-mail) |
| Notifications transactionnelles voyageur/hôte (confirmation, rappel séjour, payout) | 🔴 Absentes |
| Push / WhatsApp transactionnel | 🔴 Absent |

## Administration
| Feature | Statut |
|---|---|
| Back-office vérif annonces | ✅ |
| Gestion candidatures Wakil (RECUE/ENTRETIEN/ACCEPTÉE/REFUSÉE) | ✅ |
| Promotion Wakil, soft-delete | ✅ |
| Dashboard métriques admin (GMV, conversion, fraude) | 🔴 Absent |

## Analytics
| Feature | Statut |
|---|---|
| Stats accueil (annonces vérifiées, villes, avis) | ✅ basique |
| Observabilité erreurs (JSON + webhook optionnel) | ✅ |
| Funnel analytics produit (events, cohortes) | 🔴 Absent — aucune instrumentation produit |

## Other
| Feature | Statut |
|---|---|
| i18n FR/EN/AR + RTL + police Cairo | ✅ Remarquable |
| SEO (sitemap, robots, JSON-LD, metadata) | ✅ |
| Mode diaspora `/diaspora` | 🟡 conversion UI statique |
| Devenir Wakil (candidature) | ✅ |
| Contrat de bail pré-rempli (immo) | ✅ impression |
| App mobile native | 🔴 Absente (web responsive uniquement) |

---

# PHASE 2 — SCORING DES FEATURES

### Réservation (hold + anti-double-booking)
**Score : 16/20.** Forces : transaction SERIALIZABLE, hold 15 min, expiration paresseuse, prix serveur. Faiblesses : pas d'annulation, pas de gestion no-show, retry P2034 mentionné mais non implémenté. Risques : sans politique d'annulation, premier litige = ticket support manuel. Priorité : **P1**.

### Paiement / séquestre
**Score : 8/20.** Forces : intégration Konnect propre, idempotente, montant revérifié, séparation démo/réel sans ambiguïté. Faiblesses **graves** : (a) aucun payout vers l'hôte — le « séquestre » est un flag ; (b) pas de signature webhook ; (c) pas de remboursement. Risque : la promesse centrale (« argent protégé ») n'est pas tenue financièrement. Priorité : **P0**.

### Vérification annonces (Vérifié Darna / Wakil)
**Score : 15/20.** Forces : workflow réel, 2 niveaux (REMOTE/ON_SITE), traçabilité (qui/quand), règle « propriétaire vérifié requis ». Faiblesse : 100% manuel → ne scale pas. Risque : goulot. Priorité : **P1** (semi-automatiser).

### KYC (téléphone + CIN)
**Score : 11/20.** Forces : OTP haché/TTL/tentatives, CIN chiffrée + hash unique, distinction VERIFIE/DEMO_VERIFIE irréprochable. Faiblesse : pas de provider doc/liveness ; en démo, tout est à l'écran. Priorité : **P1**.

### Recherche & découverte
**Score : 13/20.** Forces : translittération, suggestions d'élargissement, carte. Faiblesses : pas de filtres équipements/note, pas de tri par prix/pertinence, pas de « carte comme filtre ». Priorité : **P1**.

### Avis
**Score : 17/20.** Avis impossible sans réservation confirmée, garanti **au niveau du schéma** (FK obligatoire + unique). C'est mieux que beaucoup de concurrents. Faiblesse : pas de réponse de l'hôte, pas de modération. Priorité : **P2**.

### i18n / RTL
**Score : 18/20.** Trilingue réel, RTL automatique, classes logiques. Rare à ce stade. Priorité : **P2** (maintenir).

### Favoris / dossiers
**Score : 15/20.** Bien pensé pour la diaspora qui compare. Priorité : **P2**.

### Yield Advisor / Indice de prix
**Score : 13/20.** Acquisition d'offre maligne (outil pour convaincre l'hôte). Hypothèses statiques (occupation 60%). Priorité : **P2**.

### Mise en avant payante
**Score : 9/20.** Monétisation présente mais paiement mock. Priorité : **P2**.

### Messagerie
**Score : 3/20.** Quasi inexistante. Un marketplace logement sans fil de discussion est un trou produit majeur. Priorité : **P1**.

### Auth / sessions
**Score : 12/20.** Solide (bcrypt 12, anti-timing, rate-limit, anti-énumération) mais **pas de reset mot de passe** = blocage opérationnel garanti. Priorité : **P0** sur le reset.

---

# PHASE 3 — AUDIT UX (par flux)

## Registration — 13/20
- **Frictions** : choix de rôle dès l'inscription (VOYAGEUR/HOTE/AGENCE) force une décision prématurée — Airbnb laisse tout le monde entrer puis devenir hôte plus tard.
- **Manque** : pas de vérification e-mail bloquante claire post-inscription (le code est émis mais le mock l'affiche). Onboarding « vérifications » présent (bon point).
- **Conversion killer** : demander le rôle avant d'avoir montré de la valeur.

## Login — 12/20
- **Faille** : **pas de “mot de passe oublié”**. C'est le premier ticket support de tout produit. Inacceptable pour un lancement public.
- Bon : messages d'erreur génériques, rate-limit.

## Password recovery — 0/20
- **Absent.** Bloquant avant tout lancement.

## Property search — 14/20
- Forces : translittération, carte, suggestions d'élargissement (anti cul-de-sac).
- Manques : filtres équipements/note/prix-slider, tri utilisateur, sauvegarde de recherche, alertes.

## Filters — 11/20
- Immo correct ; séjours pauvre (pas d'équipements, pas de fourchette de prix visible côté séjour). En-dessous des standards Booking.

## Property page — 16/20
- Excellente : galerie lightbox, bloc confiance explicite, carte, avis vérifiés, encart sticky prix+hôte. Manque : pas de calendrier de prix dynamique, pas de « ce que disent les voyageurs » résumé, pas de politique d'annulation affichée (car inexistante).

## Booking flow — 14/20
- Hold 15 min clair, récap transparent (zéro frais caché = argument fort). Manque : pas d'indication du compte à rebours du hold côté UI sur toute la page, pas de relance panier abandonné.

## Checkout / Payment — 9/20
- Mode démo : bouton « payer la simulation » honnête. Mode Konnect : redirection propre. **Mais** : page de retour repose sur un filet `?konnect=success` (nécessaire en local) ; en prod sans webhook signé, surface d'abus. Surtout : aucun reçu, aucune facture, aucun e-mail de confirmation transactionnel.

## Host listing creation — 15/20
- Très complet (carte picker, géocodage, générateur de description, photos). Friction : 1 photo minimum seulement (devrait pousser à 5+ pour la qualité de l'offre). Pas de prévisualisation avant publication.

## User profile — 13/20
- Profil, avatar, changement MDP, assistant vérifications. Correct. Pas de gestion de sessions/déconnexion partout.

## Mobile experience — 13/20
- Tailwind responsive (`sm:`/`lg:`) appliqué partout, menu mobile dédié, carte en import dynamique. **Mais** : audité au niveau du code, pas testé sur device ; pas de PWA, pas d'app native. Sur un marché **mobile-first à >90%** comme la Tunisie, c'est un risque produit, pas juste cosmétique.

---

# PHASE 4 — AUDIT DESIGN

- **Hiérarchie visuelle** : claire, identité couleur par verticale (séjour/immo), badges de confiance lisibles. **15/20**.
- **Architecture de l'information** : home explique la double verticale, sépare confiance/diaspora/wakil. Bonne. **15/20**.
- **Lisibilité** : bonne, palette sable/darna cohérente, police Cairo en arabe.
- **Accessibilité** : `aria-label`, `role="alert"`, focus-visible présents — au-dessus de la moyenne, mais pas d'audit a11y formel.
- **Cohérence** : composants réutilisés (Badges, Price, PropertyCard), classes logiques RTL. Excellente.
- **Responsive** : présent dans le code (non testé device).
- **Signaux de confiance** : très travaillés (blocs vérification, badge démo distinct). Point fort différenciant.
- **Modernité** : rounded-3xl, ring, shadow — esthétique 2024/2025 crédible.

**Accepté par…**
- **Airbnb ?** Non en l'état (densité d'info, micro-interactions, design system mûr manquants), mais la direction est bonne.
- **Booking.com ?** Non (Booking est dense/agressif conversion ; Darna est plus épuré — pas un défaut).
- **Une startup VC-backed ?** **Oui.** Le design ne sera pas ce qui fait échouer la levée.

**Score design global : 15/20.**

---

# PHASE 5 — AUDIT TRUST & SAFETY

| Dimension | État | Score |
|---|---|---|
| Vérification utilisateur | OTP + CIN chiffrée + hash unique | Bon (mock provider) |
| Vérification téléphone | Twilio/WhatsApp câblés, démo écran | Moyen |
| WhatsApp / OTP flows | Meta Cloud API + repli SMS | Bon design |
| Vérification hôte/annonce | Manuelle Wakil, 2 niveaux | Fort mais non-scalable |
| Prévention fraude/scam | Audit trail + gate + unicité CIN | Partiel |
| Faux listings | Vérif manuelle obligatoire avant ACTIVE | Fort |
| Sécurité paiement | Konnect re-vérifié serveur | Moyen (**pas de HMAC webhook**) |
| **Vrai séquestre / protection des fonds** | **Flag DB, pas de payout réel** | **Faible — critique** |
| RGPD | Audit trail, rétention recommandée 90j (non automatisée), pas d'export/effacement | Faible |
| Privacy | CIN chiffrée, secrets jamais NEXT_PUBLIC_ | Bon |

**Trust features manquantes (liste) :**
1. **Payout réel à l'hôte + séquestre tiers véritable** (sinon la promesse est marketing).
2. Signature HMAC du webhook Konnect.
3. Reset mot de passe + invalidation de sessions.
4. KYC documentaire réel (liveness, OCR CIN).
5. Remboursement / litige / chargeback.
6. RGPD : export données, droit à l'effacement, purge audit automatisée, consentement cookies.
7. Anti-bot (CAPTCHA) sur contact/inscription/wakil.
8. Modération avis + signalement d'annonce.
9. Détection de drift Konnect↔local (réconciliation).

**Score Trust & Safety : 10/20.** (Excellente intention et primitives de sécurité ; mais la *protection financière*, qui EST le produit, n'est pas opérationnelle, et le RGPD est embryonnaire.)

> Note : l'équipe **documente elle-même** ces trous dans `TODO-BETA.md`/`TODO-PRODUCTION.md`. C'est un signal positif fort sur la maturité de l'équipe, mais ça ne change pas l'état actuel du produit.

---

# PHASE 6 — BENCHMARK INDUSTRIE

| Feature | Darna | Airbnb | Booking | Vrbo/Expedia | Verdict Darna |
|---|---|---|---|---|---|
| Recherche ville/dates/voyageurs | ✅ | ✅ | ✅ | ✅ | **Competitive** |
| Translittération arabe/latin | ✅ | ❌ | ❌ | ❌ | **Excellent** (local moat) |
| Carte interactive | ✅ | ✅ | ✅ | ✅ | **Competitive** |
| Filtres avancés (équipements, prix slider, note) | 🔴 partiel | ✅ | ✅ | ✅ | **Basic** |
| Calendrier de prix dynamique | 🔴 | ✅ | ✅ | ✅ | **Missing** |
| Messagerie hôte↔voyageur | 🔴 | ✅ | ✅ | ✅ | **Missing** |
| Paiement en ligne | 🟡 Konnect | ✅ | ✅ | ✅ | **Basic** |
| Séquestre / protection des fonds | 🔴 flag | ✅ | ✅ | ✅ | **Missing (réel)** |
| Annulation / remboursement | 🔴 | ✅ | ✅ | ✅ | **Missing** |
| Avis vérifiés | ✅ (schéma) | ✅ | ✅ | ✅ | **Competitive/Excellent** |
| Vérification d'identité | 🟡 | ✅ | ✅ | ✅ | **Basic** |
| Vérification terrain (Wakil) | ✅ | ❌ | ❌ | ❌ | **Excellent** (différenciant) |
| Multilingue + RTL | ✅ | ✅ | ✅ | ✅ | **Competitive** (fort localement) |
| App mobile native | 🔴 | ✅ | ✅ | ✅ | **Missing** |
| Notifications transactionnelles | 🔴 | ✅ | ✅ | ✅ | **Missing** |
| Tarification dynamique / Smart Pricing | 🟡 Yield Advisor | ✅ | ✅ | ✅ | **Basic** |
| Immobilier longue durée + vente | ✅ | ❌ | ❌ | ❌ | **Excellent** (deux marchés en un) |

**Lecture** : Darna gagne là où les géants ne jouent pas (translittération, vérification terrain, immo+séjour combinés, arabe/RTL) et perd partout sur les fondamentaux transactionnels (messagerie, séquestre réel, annulation, notifications, mobile natif). C'est cohérent avec une thèse « local trust marketplace », à condition de combler les fondamentaux avant de scaler.

---

# PHASE 7 — TUNISIA MARKET FIT

**Réalités du marché tunisien :**
- Mobile-first >90%, data parfois chère → légèreté et PWA comptent.
- Méfiance massive (Tayara/Marketplace = arnaques aux acomptes) → la confiance EST l'argument d'achat. Darna vise juste.
- WhatsApp = canal de communication dominant. Darna l'a compris (OTP WhatsApp), mais ne l'utilise PAS pour la communication transactionnelle hôte↔voyageur (manque).
- Paiement : carte bancaire peu répandue, **e-DINAR / wallet / cash** dominants. Konnect couvre wallet/bank_card/e-DINAR ✅. **Mais le cash-à-l'arrivée reste l'attente n°1** et n'est pas modélisé.
- Diaspora (France surtout) = pouvoir d'achat + besoin de confiance à distance → cible prioritaire pertinente, favoris/dossiers et mode EUR bien vus.

## Features OBLIGATOIRES avant lancement Tunisie
1. **Reset mot de passe** (sinon support saturé jour 1).
2. **Payout réel hôte + séquestre opérationnel** OU repositionnement honnête du discours « séquestre ».
3. **Notifications transactionnelles** (confirmation réservation, rappel, par e-mail **et WhatsApp**).
4. **Messagerie** hôte↔voyageur (au minimum asynchrone).
5. **Politique d'annulation/remboursement** basique.
6. **Signature webhook Konnect**.
7. **Test réel sur device mobile** + parcours arabe RTL de bout en bout.

## Features IMPORTANTES après lancement
- Cash-à-l'arrivée encadré (avec garantie/caution).
- KYC documentaire réel (anti-faux Wakil/faux hôte).
- Filtres de recherche avancés + alertes de recherche (diaspora).
- Réconciliation paiement + dashboard admin GMV/fraude.
- RGPD (export/effacement) — surtout pour la diaspora UE.

## Features INUTILES pour l'instant (ne pas faire — tueurs de vélocité)
- App mobile native (PWA suffit pour 12-18 mois).
- MFA/step-up auth, device revocation.
- Tarification dynamique ML, A/B testing avancé, multi-devise réelle.
- Microservices / split physique des verticales (l'archi le permet déjà, ne pas le faire avant le besoin).
- Tracing distribué, chaos engineering, SLO formels (over-engineering au stade seed).

---

# PHASE 8 — REVENUE & BUSINESS MODEL

**Monétisation présente dans le code :**
- **Frais de service 8%** sur séjours (`SERVICE_FEE_RATE = 0.08`) — affichés, transparents. Crédible.
- **Boost « à la une » 49 TND/7j** — paiement mock aujourd'hui.

**Évaluation :**
- **Modèle de commission** : 8% take rate est raisonnable (Airbnb ~14-16% combiné, Booking ~15%). Marge de hausse. Mais **aucun revenu réel ne transite** : sans payout ni paiement boost réel, le take rate est théorique. **Score sous-jacent faible tant que le flux n'existe pas.**
- **Liquidité du marketplace** : **non prouvée**. La base est seedée (30 annonces démo). Zéro signal de demande réelle, zéro transaction réelle. C'est le risque n°1.
- **Acquisition d'offre** : intelligente (réseau Wakil + Yield Advisor + Indice de prix comme aimants hôtes). Mais coûteuse en humain (vérif manuelle).
- **Acquisition de demande** : SEO solide (sitemap/JSON-LD/i18n), positionnement diaspora clair. Pas de boucle virale ni de moteur d'acquisition prouvé.

**Risques business :**
1. **Chicken-and-egg** classique aggravé par la vérif manuelle (l'offre ne peut pas affluer librement).
2. **Désintermédiation** : sans messagerie ni paiement réellement contraint, hôtes et voyageurs peuvent transacter hors plateforme (fléau de tout marketplace TN). La gate « vérifié pour réserver » aide peu si le contact se fait hors-ligne.
3. **Dépendance opérationnelle** au réseau Wakil (qualité, fraude interne, coût).
4. **Régulation paiement/escrow** en Tunisie (BCT) : opérer un vrai séquestre peut exiger un agrément — non traité.

**Score viabilité business : 9/20.** Le *modèle* est sain et bien pensé ; la *preuve* (liquidité, revenu réel, défense contre la désintermédiation) est entièrement à faire.

---

# PHASE 9 — ROADMAP DE PRIORISATION

## MUST HAVE AVANT LANCEMENT PUBLIC
| Item | Impact | Effort | Priorité |
|---|---|---|---|
| Reset mot de passe + invalidation session | Élevé | Faible | **P0** |
| Payout hôte + séquestre opérationnel (ou repositionner le discours) | Critique | Élevé | **P0** |
| Signature HMAC webhook Konnect | Élevé (sécu argent) | Faible | **P0** |
| Notifications transactionnelles e-mail + WhatsApp | Élevé | Moyen | **P0** |
| Politique d'annulation/remboursement minimale | Élevé | Moyen | **P1** |
| Test device mobile + parcours AR/RTL complet | Élevé | Faible | **P1** |
| Consentement cookies + politique confidentialité + ToS | Moyen (légal) | Faible | **P1** |

## MUST HAVE AVANT LES 100 PREMIÈRES RÉSERVATIONS
| Item | Impact | Effort | Prio |
|---|---|---|---|
| Messagerie hôte↔voyageur (asynchrone) | Élevé | Moyen | **P1** |
| Instrumentation funnel (events, conversion) | Élevé | Faible | **P1** |
| Filtres de recherche avancés + tri | Moyen | Moyen | **P1** |
| Réconciliation Konnect↔local + dashboard GMV admin | Élevé | Moyen | **P1** |
| Anti-bot (CAPTCHA) sur formulaires publics | Moyen | Faible | **P2** |
| Reçu / facture de réservation | Moyen | Faible | **P2** |

## MUST HAVE AVANT 1 000 RÉSERVATIONS
| Item | Impact | Effort | Prio |
|---|---|---|---|
| Semi-automatisation de la vérification d'annonce (file, scoring, photos) | Élevé (scaling offre) | Élevé | **P1** |
| KYC documentaire réel (OCR/liveness) | Élevé | Moyen | **P1** |
| RGPD : export + droit à l'effacement + purge audit | Élevé (UE/diaspora) | Moyen | **P1** |
| Litiges / chargeback / no-show | Élevé | Élevé | **P2** |
| Pricing dynamique guidé (au-delà du Yield Advisor) | Moyen | Moyen | **P3** |
| Cash-à-l'arrivée encadré | Élevé (TN fit) | Moyen | **P2** |

## MUST HAVE AVANT EXPANSION INTERNATIONALE
| Item | Impact | Effort | Prio |
|---|---|---|---|
| Multi-devise/paiement réel par marché + conformité locale | Élevé | Élevé | **P1** |
| App mobile / PWA durcie | Moyen | Élevé | **P2** |
| Multi-passerelles paiement (au-delà Konnect) | Élevé | Élevé | **P2** |
| SRE : SLO, tracing, on-call, backups testés | Moyen | Élevé | **P3** |
| Pentest externe annuel + SAST/DAST en CI | Élevé | Moyen | **P2** |

---

# PHASE 10 — VERDICT INVESTISSEUR

## Investirais-je sur le seul produit actuel ?

**Pas sur le produit seul. Oui sur l'équipe + le produit + le marché, en pré-seed/seed, avec des jalons clairs.**

**Pourquoi pas sur le produit seul :** un marketplace se valorise sur la liquidité et le revenu réel. Darna n'a **aucune transaction réelle**, une base seedée, pas de payout, pas de messagerie, pas d'annulation. La proposition de valeur centrale — la protection des fonds — n'est pas opérationnelle financièrement. Sur la grille « produit prouvé », c'est un *non*.

**Pourquoi oui malgré tout :**
1. **Qualité d'exécution exceptionnelle pour le stade.** Le code, les tests (26 suites), la sécurité, l'i18n/RTL, l'architecture en verticales et la **lucidité documentée** (`TODO-BETA`/`TODO-PRODUCTION`) prouvent une équipe technique capable d'exécuter vite et proprement. C'est rare et c'est ce qu'on finance en seed.
2. **Positionnement juste sur un marché réellement cassé.** « Le logement vérifié » répond à une douleur tunisienne authentique (arnaques Tayara/Marketplace). La translittération arabe, la vérification terrain (Wakil) et le combo séjour+immo sont des différenciants locaux que les géants n'adressent pas.
3. **Moat plausible** : le réseau Wakil + le stock d'annonces vérifiées actives est un actif défendable *si* l'exécution opérationnelle suit.

**Condition d'investissement (term-sheet) :** financer le passage de « démo brillante » à « 100 transactions réelles avec payout opérationnel et zéro perte de fonds », avec tranches débloquées sur jalons (payout réel + 50 transactions + rétention hôte). Le risque est l'exécution *go-to-market*, pas la capacité technique.

## Scores globaux

| Axe | Score |
|---|---|
| **Produit** | **12/20** |
| **UX** | **13/20** |
| **Design** | **15/20** |
| **Trust** | **10/20** |
| **Market Fit** | **14/20** |
| **Startup Readiness** | **11/20** |

---

## TOP 20 — Améliorations à plus fort impact sur réservations & revenu

1. **Implémenter un vrai payout hôte + séquestre opérationnel** (le produit tient cette promesse ou il ment). *Le plus haut levier de confiance et de revenu.*
2. **Reset mot de passe** — sinon attrition et support dès J1.
3. **Notifications transactionnelles e-mail + WhatsApp** (confirmation, rappel séjour, payout) — réduit l'anxiété, augmente la conversion et la rétention.
4. **Messagerie hôte↔voyageur** — sans elle, les utilisateurs partent sur WhatsApp et désintermédient.
5. **Politique d'annulation/remboursement claire et affichée** — lever le frein n°1 à la première réservation.
6. **Signature HMAC du webhook Konnect** — sécuriser l'argent avant tout trafic réel.
7. **Compte à rebours du hold + relance de panier abandonné** — récupère des réservations perdues.
8. **Filtres de recherche avancés + tri par prix/pertinence** — améliore la découverte donc la conversion.
9. **Alertes de recherche sauvegardée** (surtout diaspora) — ramène la demande, crée l'habitude.
10. **Instrumentation funnel produit** — sans mesure, aucune optimisation de conversion possible.
11. **Reçu/facture de réservation** — confiance + utile pour la diaspora.
12. **Pousser 5+ photos minimum + score qualité d'annonce** — meilleures annonces = meilleure conversion.
13. **Semi-automatiser la vérification d'annonce** — débloque la croissance de l'offre (donc des réservations).
14. **Cash-à-l'arrivée encadré (avec caution)** — débloque le segment qui refuse de payer en ligne.
15. **Calendrier de prix + Smart Pricing guidé** — remplit les nuits creuses, augmente le GMV.
16. **Réponses de l'hôte aux avis + modération** — renforce la preuve sociale.
17. **Onboarding sans choix de rôle prématuré** (devenir hôte plus tard) — réduit la friction d'inscription.
18. **Programme de parrainage diaspora** — boucle d'acquisition à coût marginal faible.
19. **Dashboard admin GMV/conversion/fraude + réconciliation Konnect** — pilotage du marketplace.
20. **Test mobile réel + PWA installable + parcours AR/RTL complet** — capter le trafic mobile-first tunisien.

---

*Fin de l'audit V1. Honnête par construction : les forces d'ingénierie sont réelles et au-dessus du marché seed ; les manques transactionnels et la liquidité non prouvée sont tout aussi réels. La différence entre une démo impressionnante et une entreprise se joue maintenant sur l'exécution go-to-market et la mise en production du flux financier.*
