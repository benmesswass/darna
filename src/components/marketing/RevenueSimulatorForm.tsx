"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { simulateRevenueAction, type SimulatorState } from "@/actions/simulator";
import { useT } from "@/components/i18n/LocaleProvider";
import { CITIES, nearbyCities } from "@/lib/geo";
import { type PropertyType } from "@/lib/constants";
import { formatTndServer } from "@/lib/format";
import { SparklesIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-darna focus:ring-4 focus:ring-darna/10";
const labelClass = "text-sm font-semibold text-body/70";

/**
 * Simulateur public de revenus (GROWTH_ROADMAP.md §G1) — formulaire ville +
 * type + capacité/surface → fourchette de revenus (estimateRevenue, aucune
 * nouvelle requête lourde, cf. src/lib/market.ts). CTA final pré-rempli vers
 * la création d'annonce (inscription si visiteur anonyme).
 */
export function RevenueSimulatorForm({
  allowedTypes,
  isLoggedIn,
}: {
  allowedTypes: PropertyType[];
  isLoggedIn: boolean;
}) {
  const fr = useT();
  const [state, formAction, pending] = useActionState<SimulatorState, FormData>(
    simulateRevenueAction,
    undefined
  );
  const [type, setType] = useState<PropertyType>(allowedTypes[0] ?? "SEJOUR");
  const [cityName, setCityName] = useState(CITIES[0]?.name ?? "Tunis");

  const result = state?.status === "success" ? state.result : null;
  const error = state?.status === "error" ? state.error : null;

  const publishHref = isLoggedIn
    ? `/dashboard/annonces/nouvelle?ville=${encodeURIComponent(result?.city ?? cityName)}&type=${type}`
    : `/inscription?callbackUrl=${encodeURIComponent(
        `/dashboard/annonces/nouvelle?ville=${result?.city ?? cityName}&type=${type}`
      )}`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={formAction} className="space-y-4 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.simulateur.ville}</span>
          <select
            name="city"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            className={inputClass}
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.gouvernorat})
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.simulateur.type}</span>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as PropertyType)}
            className={inputClass}
          >
            {allowedTypes.includes("SEJOUR") ? (
              <option value="SEJOUR">{fr.annonceForm.typeSejour}</option>
            ) : null}
            {allowedTypes.includes("LOCATION") ? (
              <option value="LOCATION">{fr.annonceForm.typeLocation}</option>
            ) : null}
            {allowedTypes.includes("VENTE") ? (
              <option value="VENTE">{fr.annonceForm.typeVente}</option>
            ) : null}
          </select>
        </label>

        {type === "SEJOUR" ? (
          <label className="block space-y-1.5">
            <span className={labelClass}>{fr.simulateur.voyageurs}</span>
            <input name="capacity" type="number" min={1} max={30} className={inputClass} />
            <span className="block text-xs text-subtle">{fr.simulateur.voyageursAide}</span>
          </label>
        ) : (
          <label className="block space-y-1.5">
            <span className={labelClass}>{fr.simulateur.surface}</span>
            <input name="surface" type="number" min={10} max={2000} className={inputClass} />
            <span className="block text-xs text-subtle">
              {fr.simulateur.surfaceRequisePourEstimation}
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {pending ? fr.common.chargement : fr.simulateur.cta}
        </button>

        {error ? (
          <p className="text-sm font-medium text-red-600">
            {error === "rate_limited" ? fr.common.tropDeTentatives : fr.common.champsRequis}
          </p>
        ) : null}
      </form>

      <div className="rounded-3xl bg-cream p-6 ring-1 ring-darna/10">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-muted">
            <SparklesIcon width={28} height={28} className="text-sand" />
            <p className="max-w-xs text-sm">{fr.simulateur.sousTitre}</p>
          </div>
        ) : !result.estimate.matched && result.estimate.sampleSize > 0 ? (
          // Gouvernorat/ville avec des données réelles, mais surface non saisie
          // (LOCATION/VENTE) : le problème n'est pas la zone, pas la peine de
          // suggérer une ville voisine.
          <div className="space-y-3">
            <p className="font-semibold text-body">
              {fr.simulateur.surfaceRequisePourEstimation}
            </p>
          </div>
        ) : !result.estimate.matched ? (
          <div className="space-y-3">
            <p className="font-semibold text-body">{fr.simulateur.aucuneDonnee}</p>
            <p className="text-sm text-muted">{fr.simulateur.villesProches}</p>
            <ul className="flex flex-wrap gap-2">
              {nearbyCities(result.city, 3).map((c) => (
                <li key={c.name}>
                  <button
                    type="button"
                    onClick={() => setCityName(c.name)}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-darna-dark ring-1 ring-darna/15 transition hover:bg-sand"
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-heading">
                {result.estimate.unit === "NUITEE"
                  ? fr.simulateur.resultatNuiteeTitre
                  : result.estimate.unit === "LOYER_MENSUEL"
                    ? fr.simulateur.resultatLocationTitre
                    : fr.simulateur.resultatVenteTitre}
              </h3>
              <p className="mt-2 text-3xl font-bold text-darna-dark">
                {formatTndServer(result.estimate.monthlyLow ?? 0)} –{" "}
                {formatTndServer(result.estimate.monthlyHigh ?? 0)}
                {result.estimate.unit !== "PRIX_VENTE" ? (
                  <span className="ms-1 text-base font-semibold text-muted">
                    {fr.simulateur.parMois}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-muted">{fr.simulateur.echantillon(result.estimate.sampleSize)}</p>
            </div>

            <Link
              href={publishHref}
              className="inline-flex w-full items-center justify-center rounded-full bg-darna px-6 py-3 text-sm font-bold text-white transition hover:bg-darna-light"
            >
              {fr.simulateur.ctaPublier}
            </Link>
            <p className="text-center text-xs text-subtle">{fr.simulateur.ctaPublierAide}</p>
          </div>
        )}
      </div>
    </div>
  );
}
