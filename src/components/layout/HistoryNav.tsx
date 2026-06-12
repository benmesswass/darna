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

interface NavigationApi extends EventTarget {
  canGoBack?: boolean;
  canGoForward?: boolean;
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

  // Synchronise l'état des boutons à chaque changement de page.
  useEffect(() => {
    const nav = getNavigationApi();
    if (nav) {
      let cancelled = false;
      // `currententrychange` peut être émis de façon synchrone pendant le
      // `history.replaceState` que Next exécute dans un useInsertionEffect ;
      // on diffère le setState (queueMicrotask) pour ne pas planifier une mise
      // à jour depuis cette phase, ce que React interdit.
      const sync = () => {
        queueMicrotask(() => {
          if (cancelled) return;
          setCanBack(Boolean(nav.canGoBack));
          setCanForward(Boolean(nav.canGoForward));
        });
      };
      sync();
      nav.addEventListener("currententrychange", sync);
      return () => {
        cancelled = true;
        nav.removeEventListener("currententrychange", sync);
      };
    }

    // Repli sans Navigation API.
    if (!poppedRef.current) {
      // Navigation « avant » (push) : plus d'historique futur.
      sessionStorage.removeItem(FORWARD_FLAG);
    }
    poppedRef.current = false;
    setCanBack(window.history.length > 1);
    setCanForward(sessionStorage.getItem(FORWARD_FLAG) === "1");

    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [pathname]);

  const goBack = useCallback(() => {
    if (!getNavigationApi()) sessionStorage.setItem(FORWARD_FLAG, "1");
    router.back();
  }, [router]);

  const goForward = useCallback(() => {
    router.forward();
  }, [router]);

  // Deux boutons indépendants, ancrés sous l'en-tête sticky (h-16) avec une
  // marge : « précédent » côté start (gauche en LTR, droite en RTL), « suivant »
  // côté end. En arabe la disposition se reflète, comme les flèches du navigateur.
  const buttonClass =
    "no-print accent-transition fixed top-20 z-[1000] flex items-center gap-1.5 rounded-full border border-black/5 bg-cream/90 px-3.5 py-2 text-sm font-semibold text-darna shadow-lg backdrop-blur disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-darna/10";

  return (
    <>
      <button
        type="button"
        onClick={goBack}
        disabled={!canBack}
        aria-label={fr.nav.precedent}
        title={fr.nav.precedent}
        className={`${buttonClass} start-4`}
      >
        <ChevronLeftIcon width={18} height={18} className="rtl:rotate-180" />
        <span className="hidden sm:inline">{fr.nav.precedent}</span>
      </button>

      <button
        type="button"
        onClick={goForward}
        disabled={!canForward}
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
    </>
  );
}
