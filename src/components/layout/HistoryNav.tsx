"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import { ChevronLeftIcon } from "@/components/icons";

/**
 * Contrôle flottant « Précédent / Suivant » présent sur toutes les pages
 * (monté une seule fois dans le layout racine). Reproduit les boutons
 * précédent/suivant du navigateur via `router.back()` / `router.forward()`.
 *
 * Activation des boutons :
 * - Navigation API (Chrome/Edge) : `canGoBack` / `canGoForward` exacts et
 *   réactifs via l'évènement `currententrychange`.
 * - Repli (Safari/Firefox) : « précédent » dépend de `history.length` ;
 *   « suivant » n'est activé qu'après un retour effectué dans l'onglet, et
 *   réinitialisé dès qu'une navigation « avant » (clic sur un lien) écrase
 *   l'historique futur. On distingue pop (back/forward) de push grâce à
 *   l'évènement `popstate`, qui ne se déclenche que pour les pop.
 *
 * Masqué à l'impression (`no-print`). RTL : les chevrons se retournent.
 */
const FORWARD_FLAG = "darna-can-forward";
// Profondeur in-app suivie en repli (navigateurs sans Navigation API) pour
// savoir si « Précédent » resterait dans le site ou en sortirait.
const DEPTH_KEY = "darna-nav-depth";

interface NavigationApi extends EventTarget {
  canGoBack?: boolean;
  canGoForward?: boolean;
  // Index de l'entrée courante parmi les entrées MÊME ORIGINE (in-app) :
  // 0 = première page du site dans cet onglet → reculer sortirait du site.
  currentEntry?: { index?: number } | null;
}

function getNavigationApi(): NavigationApi | undefined {
  const nav = (window as unknown as { navigation?: NavigationApi }).navigation;
  return nav && "canGoBack" in nav ? nav : undefined;
}

export function HistoryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const fr = useT();
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  // Vrai entre un popstate et la mise à jour du pathname : permet, en repli,
  // de ne pas effacer l'historique « avant » lors d'un back/forward.
  const poppedRef = useRef(false);
  // Premier rendu de la session (page d'entrée) : profondeur in-app = 0.
  const firstRunRef = useRef(true);

  // Synchronise l'état des boutons à chaque changement de page.
  useEffect(() => {
    // La page d'accueil est le PLANCHER de la navigation : on n'y propose
    // jamais de « Précédent ». Depuis toute autre page, le bouton ramène au
    // pire jusqu'à l'accueil (jamais avant, jamais hors du site) — il est donc
    // toujours actif sur une page interne.
    const atHome = pathname === "/";
    setCanBack(!atHome);

    const nav = getNavigationApi();
    if (nav) {
      let cancelled = false;
      // `currententrychange` peut être émis de façon synchrone pendant le
      // `history.replaceState` que Next exécute dans un useInsertionEffect ;
      // on diffère le setState (queueMicrotask) pour ne pas planifier une mise
      // à jour depuis cette phase, ce que React interdit.
      const sync = () => {
        queueMicrotask(() => {
          if (!cancelled) setCanForward(Boolean(nav.canGoForward));
        });
      };
      sync();
      nav.addEventListener("currententrychange", sync);
      return () => {
        cancelled = true;
        nav.removeEventListener("currententrychange", sync);
      };
    }

    // Repli sans Navigation API (Safari/Firefox) : on suit nous-mêmes la
    // profondeur in-app pour savoir si « Précédent » reste dans le site.
    const stored = sessionStorage.getItem(DEPTH_KEY);
    if (firstRunRef.current || stored === null) {
      // Entrée de session : page plancher, aucun historique in-app derrière.
      sessionStorage.setItem(DEPTH_KEY, "0");
    } else if (poppedRef.current) {
      // Back/forward natif : direction indéterminable sans Navigation API,
      // on n'ajuste pas (best effort hors Chrome).
    } else {
      // Navigation « avant » (clic sur un lien) : un cran plus profond, et
      // plus d'historique « futur ».
      sessionStorage.setItem(DEPTH_KEY, String(Number(stored) + 1));
      sessionStorage.removeItem(FORWARD_FLAG);
    }
    firstRunRef.current = false;
    poppedRef.current = false;
    setCanForward(sessionStorage.getItem(FORWARD_FLAG) === "1");

    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);

  const goBack = useCallback(() => {
    const nav = getNavigationApi();
    if (nav) {
      // index in-app > 0 ⇒ il reste de l'historique DANS le site : on recule
      // normalement. index 0 ⇒ on est à l'entrée du site, reculer en sortirait
      // → on retombe sur l'accueil, le plancher.
      if ((nav.currentEntry?.index ?? 0) > 0) router.back();
      else router.push("/");
      return;
    }
    // Repli : profondeur in-app suivie à la main.
    const depth = Number(sessionStorage.getItem(DEPTH_KEY) || "0");
    if (depth > 0) {
      sessionStorage.setItem(DEPTH_KEY, String(depth - 1));
      sessionStorage.setItem(FORWARD_FLAG, "1");
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  // Deux boutons indépendants, ancrés sous l'en-tête sticky (h-16) avec une
  // marge : « précédent » côté start (gauche en LTR, droite en RTL), « suivant »
  // côté end. En arabe la disposition se reflète, comme les flèches du navigateur.
  const buttonClass =
    "no-print accent-transition fixed top-20 z-[1000] flex items-center gap-1.5 rounded-full border border-black/5 bg-cream/90 px-3.5 py-2 text-sm font-semibold text-heading shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-darna/10";

  // Boutons MASQUÉS quand inutilisables (plutôt que grisés) : pas de « Précédent »
  // sur l'accueil, pas de « Suivant » sans historique avant.
  return (
    <>
      {canBack ? (
        <button
          type="button"
          onClick={goBack}
          aria-label={fr.nav.precedent}
          title={fr.nav.precedent}
          className={`${buttonClass} start-4`}
        >
          <ChevronLeftIcon width={18} height={18} className="rtl:rotate-180" />
          <span className="hidden sm:inline">{fr.nav.precedent}</span>
        </button>
      ) : null}

      {canForward ? (
        <button
          type="button"
          onClick={goForward}
          aria-label={fr.nav.suivant}
          title={fr.nav.suivant}
          className={`${buttonClass} end-4`}
        >
          <span className="hidden sm:inline">{fr.nav.suivant}</span>
          <ChevronLeftIcon
            width={18}
            height={18}
            className="rotate-180 rtl:rotate-0"
          />
        </button>
      ) : null}
    </>
  );
}
