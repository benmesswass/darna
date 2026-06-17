# `core` — cœur partagé

Tout ce qui est commun aux deux verticales : modèle d'annonce de base, photos,
carte/géo, avis, favoris, auth/KYC, Wakil, dashboard, i18n, coque de fiche.

**Ne connaît aucune verticale.** `core` ne doit jamais importer `@/modules/stay`
ni `@/modules/immo` (règle ESLint). Le code spécifique à un funnel vit dans la
verticale correspondante et compose les briques de `core`.

Contenu actuel :
- `listing/ListingDetail.tsx` — coque partagée de la fiche annonce, avec slots
  pour les sections propres à chaque verticale.
- `listing/Caracteristique.tsx` — caractéristique unitaire (icône + libellé).
- `listing/types.ts` — types partagés de la fiche (`ListingData`, viewer, favoris).
