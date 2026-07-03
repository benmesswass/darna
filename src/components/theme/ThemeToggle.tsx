"use client";

import { useEffect, useState } from "react";
import { THEME_COOKIE, type ThemeChoice } from "@/lib/theme";
import { SunIcon, MoonIcon } from "@/components/icons";

const OPTIONS: { value: ThemeChoice; Icon: typeof SunIcon }[] = [
  { value: "light", Icon: SunIcon },
  { value: "dark", Icon: MoonIcon },
];

function applyTheme(theme: ThemeChoice) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

/** Bascule clair/sombre — persistée en cookie, lue côté serveur au prochain chargement. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  return (
    <div
      role="group"
      aria-label="Thème"
      className="hidden items-center rounded-full bg-white/10 p-0.5 sm:flex"
    >
      {OPTIONS.map(({ value, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setTheme(value);
            applyTheme(value);
          }}
          aria-pressed={theme === value}
          aria-label={value === "dark" ? "Thème sombre" : "Thème clair"}
          className={
            theme === value
              ? "flex h-7 w-7 items-center justify-center rounded-full bg-surface text-heading"
              : "flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:text-white"
          }
        >
          <Icon width={15} height={15} />
        </button>
      ))}
    </div>
  );
}
