"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";

const CONSENT_COOKIE = "darna-cookie-consent";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 jours

function hasSeenBanner(): boolean {
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`));
}

function recordSeen() {
  document.cookie = `${CONSENT_COOKIE}=seen; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

/**
 * Bandeau d'INFORMATION cookies — pas de recueil de consentement
 * (LANCEMENT_ROADMAP.md §L7.1, régime d'exemption CNIL « mesure d'audience » :
 * `darna-vid` a une finalité strictement limitée à la mesure interne, sans
 * croisement ni tiers, donc pas de consentement à recueillir). Un bouton
 * unique : il n'y a jamais eu de vrai choix « accepter/refuser » à proposer
 * — un faux bouton « refuser » sans effet serait une déclaration inexacte,
 * l'exact défaut que cette refonte corrige.
 */
export function CookieConsent() {
  const fr = useT();
  const [visible, setVisible] = useState(false);

  // Rendu uniquement côté client après vérification du cookie → pas de flash
  // pour les utilisateurs ayant déjà vu le bandeau, pas de mismatch d'hydratation.
  useEffect(() => {
    if (!hasSeenBanner()) setVisible(true);
  }, []);

  if (!visible) return null;

  const close = () => {
    recordSeen();
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
            onClick={close}
            className="rounded-xl bg-sand px-4 py-2 text-sm font-semibold text-darna-dark hover:brightness-105"
          >
            {fr.cookieConsent.accepter}
          </button>
        </div>
      </div>
    </div>
  );
}
