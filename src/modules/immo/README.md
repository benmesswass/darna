# `immo` — verticale IMMO (type SeLoger)

LOCATION longue durée + VENTE (neuf / ancien) + TERRAIN. Funnel de mise en
relation : **Rechercher → Contacter / Demander une visite** (formulaire + WhatsApp),
infos de financement, génération de bail (location). Recherche par critères
(type de bien, surface, pièces, budget, neuf/ancien, terrain constructible…).

**Invariant absolu : JAMAIS de paiement en ligne dans ce module.**

Peut importer `@/modules/core` et l'infra partagée (`src/lib`, `src/components`).
**Ne doit jamais importer `@/modules/stay`** (règle ESLint) — le partage passe par `core`.

Contenu actuel :
- `listing/ImmoDetail.tsx` — fiche immo ; compose `core/ListingDetail` avec la
  section contact et le CTA « Contacter ».
- `listing/ImmoContactSection.tsx` — contact direct (formulaire + WhatsApp).
