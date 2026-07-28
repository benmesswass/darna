# Darna — دارنا

**« Notre maison », en toute confiance.**

Darna est une plateforme web pour le marché immobilier tunisien, combinant deux verticales sur un socle unique :

- **Séjours** (type Airbnb) : location touristique — calendrier, recherche ville/dates/voyageurs, réservation confirmée en ligne (frais de service uniquement, le séjour se règle sur place), messagerie intégrée, avis de vrais voyageurs, annulation encadrée.
- **Immobilier** (type SeLoger) : location longue durée et vente — filtres prix/surface/pièces/gouvernorat, contact direct propriétaire/agence, contrat de bail pré-rempli, lead financement.

## Le positionnement : la confiance est le produit

> *Ce que vous voyez existe. Le prix affiché est le prix payé. Zéro acompte au propriétaire.*

| Faille du marché | Réponse Darna |
|---|---|
| Arnaques aux acomptes, photos volées (Tayara) | Badge « Vérifié Darna » (réseau Wakil, vérification humaine, 2 niveaux REMOTE/ON_SITE) + **zéro acompte au propriétaire** : seuls les frais Darna se paient en ligne (remboursés si l'annonce n'est pas conforme), le séjour se règle sur place |
| Annonces périmées jamais nettoyées (Mubawab) | **Expiration automatique à 30 jours**, badge fraîcheur, « Marquer loué/vendu » en 1 clic |
| Avis inventés ou absents | Un avis est **impossible sans réservation confirmée** (contrainte au niveau du schéma) |
| Contournement de la plateforme | Messagerie interne avec masquage des coordonnées, frais de réservation fixes en ligne, suspension progressive |
| Pas de carte, pas d'arabe | Carte Leaflet/OSM à marqueurs prix, **site trilingue FR / EN / AR (derja) avec RTL automatique** |

## Fonctionnalités actuelles

**Voyageur** — recherche tolérante à la translittération (« 7ammamet » → Hammamet), vue liste + carte, filtres, favoris avec dossiers, réservation transparente (hold 15 min, anti-double-réservation SERIALIZABLE, prix recalculés serveur), frais de service payés en ligne via **Konnect** (optionnel) — le séjour se règle sur place — ou réservation 100 % cash si l'hôte l'a activée, annulation avec politiques (flexible/modérée/stricte), messagerie hôte↔voyageur, avis à sous-notes, alertes de recherche sauvegardée, centre de notifications, crédits de bienvenue/parrainage, mode diaspora TND/EUR.

**Hôte / Agence** — création d'annonce complète (photos avec upload + compression, carte, générateur de description), calendrier de blocage, promos, mise en avant payante, Yield Advisor, barre de complétude, badge Super-Hôte au mérite, tableau de revenus, annulation hôte encadrée (blocage progressif), abonnements agence, crédits de vérification Wakil, avis hôte→voyageur.

**Plateforme** — vérification d'annonces par le réseau Wakil (back-office admin complet), KYC (OTP e-mail/SMS/WhatsApp, CIN chiffrée AES-256-GCM avec unicité par hash), Indice Darna des prix (`/prix-du-marche`), simulateur public de revenus, instrumentation produit (funnel + adoption) avec dashboards admin, SEO complet (sitemap, JSON-LD, slugs), reset mot de passe, CAPTCHA Turnstile (dual-mode).

## Sécurité

zod sur chaque server action mutante · autorisation serveur sur chaque mutation · zéro SQL brut · prix toujours recalculés serveur · bcrypt coût 12 + anti-énumération · rate limiting Redis (fallback mémoire) · CSP par nonce · audit trail complet · webhook de paiement auto-signé HMAC · CIN chiffrée au repos · ledger de crédits append-only · invalidation de session au changement de mot de passe.

Détail des contrôles restant à ajouter avant ouverture publique : `ROADMAP.md` (phases 2 et 3).

## Modes démo ↔ production

L'app démarre **sans aucune clé** avec des défauts démo sûrs ; chaque mode réel exige sa configuration complète, validée au boot (fail-fast) :

| Mode | Démo (défaut) | Réel |
|---|---|---|
| `PAYMENT_MODE` | paiement des frais simulé | **Konnect** (sandbox gratuit) : init + webhook signé + réconciliation |
| `KYC_MODE` | OTP affiché à l'écran | e-mail Resend, SMS Twilio, WhatsApp Meta Cloud API |
| `STORAGE_MODE` | disque local | S3-compatible (R2…) via `aws4fetch` |
| `CAPTCHA_MODE` | désactivé | Cloudflare Turnstile |

## Lancement local

```bash
npm install
cp .env.example .env        # puis générer AUTH_SECRET : openssl rand -base64 32

docker run -d -p 5432:5432 \
  -e POSTGRES_DB=darna -e POSTGRES_USER=darna -e POSTGRES_PASSWORD=darna \
  --name darna-db postgres:16-alpine

npx prisma migrate dev
npx prisma db seed
npm run dev
```

Vérifications : `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run test:e2e` (Playwright) · `npm run test:api` · `npm run test:perf` (k6).

## Comptes démo

Mot de passe unique : `darna2026` (liste complète dans `CREDENTIALS.md`, non commité).

| Rôle | E-mail |
|---|---|
| Voyageur | `voyageur@darna.tn` |
| Hôte (vérifié) | `hote@darna.tn` |
| Agence | `agence@darna.tn` |

## Limites assumées (état honnête)

- **Pas encore déployé en production** — chantier en cours : `ROADMAP.md` (phase 1).
- **Modèle V1 « commission-only »** (décision 2026-07-27, livrée) : Darna n'encaisse en ligne que ses frais de service (10 % du loyer) ; le loyer se règle 100 % sur place, directement à l'hôte. Aucun fonds de tiers ne transite par Darna. Le paiement intégral en ligne (séquestre réel) est la V2, conditionnée à un avis juridique. Les remboursements de frais restent des virements manuels (l'API Konnect n'a pas d'endpoint de remboursement).
- Conversion EUR d'affichage à taux statique (1 € = 3,4 TND) — le montant débité est toujours en TND.
- KYC sans provider documentaire (pas d'OCR/liveness) ; OTP réel optionnel.
- ⚖️ La location saisonnière tunisienne évolue dans un cadre juridique flou (fiscalité, agrément séquestre BCT) — avis juridique en cours avant tout lancement commercial.

## Documentation & pilotage

- **`ROADMAP.md`** — **fichier unique de pilotage** : état des lieux, décisions gravées, et toutes les tâches en 8 phases (mise en ligne → solidité technique → légal → performance → opérations → terrain → croissance → dette).
- `docs/INFRASTRUCTURE.md` — déploiement, rollback, restauration, matrice d'environnement.
- `docs/ARGUMENTAIRE_HOTE.md` — argumentaire de recrutement d'hôtes.
- `CLAUDE.md` — conventions de développement.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript strict · Tailwind CSS 4 · Prisma + **PostgreSQL** · NextAuth (Auth.js) credentials · zod · Leaflet + OpenStreetMap · Redis (ioredis, optionnel) · Konnect (optionnel) · i18n maison FR/EN/AR + RTL · Vitest + Playwright + k6 + axe + ZAP. Zéro service payant obligatoire.
