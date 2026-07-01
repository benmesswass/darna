# Darna — Design Roadmap

> **Référence permanente.** Ce document liste les manques de design/UI/UX de
> Darna établis lors de la revue produit du 2026-07-01 : le site est jugé
> **pratique et cohérent mais statique**, sans mouvement ni texture — pas un
> problème de palette/typo, un manque de retour visuel et d'émotion. Compagnon
> de `FEATURES_ROADMAP.md` (fonctionnel) et `QA_ROADMAP.md` (qualité/sécurité).
>
> **Règle de maintenance :** dès qu'une tâche est livrée (mergée), cocher la
> case, passer son statut à `✅` et noter le(s) fichier(s)/PR. Ne jamais laisser
> ce fichier dériver de l'état réel du code.

- **Légende statut :** `❌` pas commencé · `🔧` en cours · `✅` fait (préciser fichier/PR).
- **Priorité :** `P0` (perçu immédiatement par tout visiteur) `P1` (fort impact) `P2` (utile) `P3` (nice-to-have).

---

## Constat de départ

- **Zéro librairie d'animation** dans `package.json` (ni framer-motion, ni gsap, ni équivalent). Tout le mouvement du site tient dans des `hover:`/`transition` Tailwind basiques (translate/scale/shadow au survol des cartes).
- La seule vraie idée d'animation "produit" existante est bien pensée mais isolée au hero : crossfade des deux photos + pastille glissante de nav (`nav-pill`, `accent-transition` dans `src/app/globals.css`).
- Un seul composant `Skeleton.tsx` (`src/components/ui/Skeleton.tsx`), utilisé à 3 endroits seulement (`loading.tsx` de `/immobilier`, `/sejours`, `/dashboard`).
- Placeholders d'annonces en SVG plats (`public/placeholders/p-*.svg`) — sans dégradé/texture, renforcent l'effet "maquette".
- Heros non optimisés : `public/images/sejours-hero.jpg` (770 Ko) et `immobilier-hero.jpg` (584 Ko), JPG bruts sans variante WebP/AVIF.
- Aucun feedback animé de succès (réservation confirmée, annonce publiée, avis envoyé) au-delà du strict nécessaire.
- Aucun mode sombre (une seule occurrence résiduelle de `dark:` dans tout le repo).

---

## 1. Quick wins (1 lib, gains immédiats, peu de risque)

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| D1 | Installer une lib d'animation légère (`framer-motion`/`motion`) | P0 | ❌ | Prérequis aux tâches D2-D5. |
| D2 | Fade + slide au montage des grilles de résultats (`stagger` sur `PropertyCard`) | P0 | ❌ | `src/components/property/PropertyCard.tsx`, grilles dans `src/app/sejours/page.tsx` / `src/app/immobilier/page.tsx`. |
| D3 | Généraliser `Skeleton.tsx` à toutes les zones de données dynamiques (grille filtrée, dashboard revenus, messagerie) | P1 | ❌ | `src/components/ui/Skeleton.tsx` — actuellement 3 usages seulement. |
| D4 | Optimiser les 2 images hero (compression + WebP/AVIF, cible <150 Ko chacune) | P1 | ❌ | `public/images/sejours-hero.jpg`, `public/images/immobilier-hero.jpg`, rendu via `src/components/layout/HomeHero.tsx`. |
| D5 | État de succès animé (check qui se dessine / micro-célébration) sur réservation confirmée, annonce publiée, avis publié | P1 | ❌ | Flux dans `src/actions/bookings.ts`, `src/actions/properties.ts`, `ReviewForm`. |
| D6 | Retravailler/remplacer les SVG placeholders plats (dégradé, grain léger, ou gradient animé subtil) | P2 | ❌ | `public/placeholders/p-*.svg`. |

## 2. Chantiers moyens

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| D7 | Page/carte "profil hôte" avec effet de présence (photo, badge vérifié, note, annonces) | P1 | ❌ | Lié à F3 de `FEATURES_ROADMAP.md` — combine gain fonctionnel + design. |
| D8 | Carrousel "annonces similaires" en fin de fiche, avec léger effet de scroll horizontal | P1 | ❌ | Lié à F6 de `FEATURES_ROADMAP.md` (`embla-carousel` ou équivalent léger). |
| D9 | Micro-interactions de formulaire (validation live animée, focus states plus expressifs) sur les formulaires clés (réservation, inscription, publication d'annonce) | P2 | ❌ | `src/components/booking/`, `src/app/inscription/`, `src/app/dashboard/annonces/nouvelle/`. |

## 3. Second cercle

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| D10 | Mode sombre | P3 | ❌ | Quasi inexistant actuellement (1 occurrence `dark:` résiduelle). |
| D11 | Scroll-reveal sur les sections de la page d'accueil (trust, stats, diaspora/wakil) | P2 | ❌ | `src/app/page.tsx` — sections actuellement statiques au scroll. |

---

## Exécution (prioritisée)

**Maintenant (P0/P1) :**
1. D1 — installer la lib d'animation.
2. D2 — animation des grilles de résultats.
3. D4 — optimisation des heros.
4. D3 — skeletons généralisés.
5. D5 — feedback de succès animé.
6. D7 / D8 — profil hôte + annonces similaires (couplés aux tâches fonctionnelles F3/F6).

**Ensuite (P2/P3) :**
7. D9 — micro-interactions formulaires.
8. D11 — scroll-reveal accueil.
9. D6 — placeholders retravaillés.
10. D10 — mode sombre.

---

_Voir aussi `FEATURES_ROADMAP.md` (fonctionnel) et `QA_ROADMAP.md` (qualité/sécurité)._
