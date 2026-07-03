export const THEME_COOKIE = "darna-theme";
export type ThemeChoice = "light" | "dark";

export function isThemeChoice(value: string | undefined): value is ThemeChoice {
  return value === "light" || value === "dark";
}

/**
 * Exécuté avant l'hydratation (enfant texte de `<script>`, pas de
 * dangerouslySetInnerHTML — statique, aucune entrée utilisateur). Ne fait
 * quelque chose que si aucun choix explicite n'a été enregistré : bascule sur
 * la préférence système pour éviter un flash clair sur un OS en mode sombre.
 * Si un cookie existe déjà, le serveur a rendu la bonne classe sur <html> —
 * ce script est alors un no-op.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )darna-theme=([^;]*)/);if(!m){var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}}catch(e){}})();`;
