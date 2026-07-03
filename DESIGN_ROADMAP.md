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
| D1 | Installer une lib d'animation légère (`framer-motion`/`motion`) | P0 | ✅ | `motion` (npm), via `LazyMotion`+`domAnimation` (~15 Ko) plutôt que le bundle complet — voir `src/components/ui/AnimatedGrid.tsx`. |
| D2 | Fade + slide au montage des grilles de résultats (`stagger` sur `PropertyCard`) | P0 | ✅ | `AnimatedGrid` (`src/components/ui/AnimatedGrid.tsx`) branché sur les grilles de `src/app/sejours/page.tsx` et `src/app/immobilier/page.tsx`. `key` dérivée des ids affichés pour rejouer l'anim à chaque changement de page/filtre. `MotionConfig reducedMotion="user"` respecte `prefers-reduced-motion` (suppression du slide, le fade reste — comportement standard de la lib). |
| D3 | Généraliser `Skeleton.tsx` à toutes les zones de données dynamiques (grille filtrée, dashboard revenus, messagerie) | P1 | ✅ | Grille filtrée déjà couverte (`SearchPageSkeleton`). Ajout de `RevenusSkeleton`/`MessagerieSkeleton` (`src/components/ui/Skeleton.tsx`) + `loading.tsx` dédiés sur `/dashboard/revenus` et `/dashboard/messagerie` (remplacent le fallback générique hérité de `/dashboard/loading.tsx`). Scope volontairement limité aux 2 pages nommées par cette tâche — les autres sous-pages dashboard (annonces, réservations, admin…) restent sur le fallback générique, à traiter au cas par cas si jugé utile. |
| D4 | Optimiser les 2 images hero (compression + WebP/AVIF, cible <150 Ko chacune) | P1 | ✅ | Sources recompressées (`sharp`, mozjpeg, résolution **d'origine conservée** — ces photos sont aussi utilisées en plein écran `sizes="100vw"` par `HomeHero.tsx`, réduire la largeur aurait créé un agrandissement visible sur grand écran/Retina) : `sejours-hero.jpg` 770→209 Ko, `immobilier-hero.jpg` 584→129 Ko, sans perte visible. Cible <150 Ko atteinte pour l'immobilier ; dépassée légèrement pour le séjour (ciel en dégradé, plus sensible à la compression) — arbitrage volontaire en faveur du zéro régression visuelle plutôt que le chiffre exact. `next.config.ts` : `images.formats` inclut désormais `avif` (avant : WebP seul) — négociation de format confirmée par `Content-Type` de retour de `/_next/image`. |
| D5 | État de succès animé (check qui se dessine / micro-célébration) sur réservation confirmée, annonce publiée, avis publié | P1 | ✅ | Nouveau `SuccessCheck` (`src/components/ui/SuccessCheck.tsx`, `motion`) : cercle qui « pop » (spring) + trait qui se dessine (`pathLength`). Branché sur les 4 écrans de succès existants : paiement confirmé (`/reservation/[id]/paiement`), annonce publiée (`/dashboard/annonces?creee=1`), avis voyageur→annonce (`ReviewForm`) et avis hôte→voyageur (`GuestReviewForm`, F1). |
| D6 | Retravailler/remplacer les SVG placeholders plats (dégradé, grain léger, ou gradient animé subtil) | P2 | ❌ | `public/placeholders/p-*.svg`. |

## 2. Chantiers moyens

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| D7 | Page/carte "profil hôte" avec effet de présence (photo, badge vérifié, note, annonces) | P1 | ✅ | `AnimatedGrid` (déjà utilisé en D2) réutilisé sur `/hote/[id]` : en-tête (avatar/nom + badges) et grille d'annonces entrent en fondu/glissement à l'ouverture. |
| D8 | Carrousel "annonces similaires" en fin de fiche, avec léger effet de scroll horizontal | P1 | ✅ | `SimilarListingsCarousel` (`src/components/property/`) : scroll-snap CSS natif (pas de lib externe — suffisant pour 4 cartes max) + boutons précédent/suivant (desktop) + fondu d'entrée au scroll (`whileInView`). Branché sur `ListingDetail.tsx`. |
| D9 | Micro-interactions de formulaire (validation live animée, focus states plus expressifs) sur les formulaires clés (réservation, inscription, publication d'annonce) | P2 | ✅ | Focus enrichi (bague animée `focus:ring-4`) sur `inputClass` partagé de `AuthForms.tsx` et `PropertyForm.tsx`. Validation live sur l'inscription/reset mot de passe (`AuthForms.tsx`) : règle « 8 caractères » avec check animé (`LiveRuleHint`), erreur de correspondance de confirmation animée en direct (avant tout submit), via `usePasswordMatch()` (les champs restent non contrôlés). Compteur voyageurs de `BookingPanel.tsx` (`/annonce/[slug]/reserver`) : boutons +/- avec retour de pression (`active:scale-90`) + chiffre qui « pop » à chaque changement (réutilise le keyframe existant `darna-loop-pop`). |

## 3. Second cercle

| # | Tâche | Prio | Statut | Détail |
|---|-------|------|--------|--------|
| D10 | Mode sombre | P3 | ❌ | Quasi inexistant actuellement (1 occurrence `dark:` résiduelle). |
| D11 | Scroll-reveal sur les sections de la page d'accueil (trust, stats, diaspora/wakil) | P2 | ✅ | Nouveau `ScrollRevealGrid` (`src/components/ui/ScrollRevealGrid.tsx`, `motion`) — même mécanique de stagger que `AnimatedGrid` (D2) mais déclenchée par `whileInView`/`viewport.once` plutôt qu'au montage. Branché sur la grille « La confiance est le produit » et la grille « prix du marché / diaspora / wakil » de `src/app/page.tsx`. Au passage : icônes de la grille « prix du marché / diaspora / wakil » remises au même badge circulaire coloré (`bg-darna`/`text-sand`) que la grille « confiance » juste au-dessus — les icônes nues détonnaient visuellement à côté d'une section avec des badges pleins. |

---

## Exécution (prioritisée)

**Maintenant (P0/P1) :**
1. ✅ D1 — installer la lib d'animation.
2. ✅ D2 — animation des grilles de résultats.
3. ✅ D4 — optimisation des heros.
4. ✅ D3 — skeletons généralisés.
5. ✅ D5 — feedback de succès animé.
6. ✅ D7 / D8 — profil hôte + annonces similaires (couplés aux tâches fonctionnelles F3/F6).

**Ensuite (P2/P3) :**
7. ✅ D9 — micro-interactions formulaires.
8. ✅ D11 — scroll-reveal accueil.
9. D6 — placeholders retravaillés.
10. D10 — mode sombre.

---

_Voir aussi `FEATURES_ROADMAP.md` (fonctionnel) et `QA_ROADMAP.md` (qualité/sécurité)._
