# `src/modules` — monolithe modulaire

Trois modules, une seule base de code et une seule base de données. Le but :
**un split physique futur (déploiements ou DB séparés par verticale) doit être un
changement de configuration/déploiement, pas une réécriture.**

```
core/   Cœur partagé : annonce de base, photos, carte, avis, favoris, KYC,
        Wakil, dashboard, i18n. Ne connaît AUCUNE verticale.
stay/   Verticale SÉJOUR (type Airbnb) : réservation, calendrier, escrow.
immo/   Verticale IMMO (type SeLoger) : LOCATION + VENTE + TERRAIN. Contact /
        demande de visite. JAMAIS de paiement en ligne.
```

## Règle de dépendance (durcie par ESLint)

- `stay` **ne doit pas** importer `immo` ; `immo` **ne doit pas** importer `stay`.
- `core` **ne dépend d'aucune** verticale.
- Les deux verticales **peuvent** importer `core`.
- L'infra transverse (`src/lib`, `src/components`) reste neutre et partagée.

Le mélange entre verticales passe **toujours** par `core`. La règle est appliquée
par `no-restricted-imports` dans `eslint.config.mjs` — toute violation casse le lint.
