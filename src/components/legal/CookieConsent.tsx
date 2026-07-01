"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";

const CONSENT_COOKIE = "darna-cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

function hasConsent(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function recordConsent(value: "accepted" | "refused") {
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/**
 * Bandeau de consentement aux cookies. Darna n'utilise que des cookies
 * strictement nécessaires ; le bandeau informe et mémorise le choix de
 * l'utilisateur (cookie `darna-cookie-consent`). Aucun script tiers, aucun
 * traceur : compatible CSP par nonce.
 */
export function CookieConsent() {
  const fr = useT();
  const [visible, setVisible] = useState(false);

  // Rendu uniquement côté client après vérification du cookie → pas de flash
  // pour les utilisateurs ayant déjà choisi, pas de mismatch d'hydratation.
  useEffect(() => {
    if (!hasConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const close = (value: "accepted" | "refused") => {
    recordConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={fr.cookieConsent.titre}
      className="no-print fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl bg-darna-dark p-5 text-white shadow-xl ring-1 ring-white/10 sm:flex-row sm:items-center sm:gap-5">
        <div className="text-sm">
          <p className="font-semibold">{fr.cookieConsent.titre}</p>
          <p className="mt-1 text-white/70">
            {fr.cookieConsent.message}{" "}
            <Link
              href="/confidentialite"
              className="font-medium text-sand underline hover:text-white"
            >
              {fr.cookieConsent.enSavoirPlus}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => close("refused")}
            className="rounded-xl px-3 py-2 text-sm font-medium text-white/80 ring-1 ring-white/20 hover:bg-white/10"
          >
            {fr.cookieConsent.refuser}
          </button>
          <button
            type="button"
            onClick={() => close("accepted")}
            className="rounded-xl bg-sand px-4 py-2 text-sm font-semibold text-darna-dark hover:brightness-105"
          >
            {fr.cookieConsent.accepter}
          </button>
        </div>
      </div>
    </div>
  );
}
