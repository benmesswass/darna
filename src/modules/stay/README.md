# `stay` — verticale SÉJOUR (type Airbnb)

Funnel transactionnel : **Rechercher → Réserver → Payer** (séquestre Konnect réel
ou simulé). Réservation instantanée, calendrier de disponibilités, prix/nuit,
frais de service, avis adossés à un séjour terminé.

Peut importer `@/modules/core` et l'infra partagée (`src/lib`, `src/components`).
**Ne doit jamais importer `@/modules/immo`** (règle ESLint) — le partage passe par `core`.

Contenu actuel :
- `listing/StayDetail.tsx` — fiche séjour ; compose `core/ListingDetail` avec le
  calendrier, la capacité, les frais de service et le CTA « Réserver ».
