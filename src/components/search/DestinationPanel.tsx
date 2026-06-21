"use client";

import Image from "next/image";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import type { DestinationPreview } from "@/lib/destination";
import type { WeatherCondition } from "@/lib/weather";
import {
  SunIcon,
  CloudIcon,
  CloudRainIcon,
  ShieldIcon,
  MapPinIcon,
  ArrowRightIcon,
} from "@/components/icons";

/**
 * Colonne « inspiration destination » de la modale de recherche : météo du
 * moment, logements réellement disponibles, recommandations cliquables et
 * alternatives proches. Objectif = garder le voyageur sur Darna et le pousser à
 * finir sa recherche. Purement présentation : reçoit le DTO déjà calculé par
 * `destinationPreviewAction` (aucune logique métier ici).
 */
export function DestinationPanel({
  loading,
  data,
}: {
  loading: boolean;
  data: DestinationPreview | null;
}) {
  const fr = useT();

  function weatherIcon(condition: WeatherCondition) {
    if (condition === "clear") return <SunIcon width={16} height={16} />;
    if (condition === "rain") return <CloudRainIcon width={16} height={16} />;
    return <CloudIcon width={16} height={16} />;
  }
  function weatherLabel(condition: WeatherCondition) {
    if (condition === "clear") return fr.destination.meteoClear;
    if (condition === "rain") return fr.destination.meteoRain;
    return fr.destination.meteoClouds;
  }

  const title = data?.resolvedCity ?? fr.destination.destinationsPopulaires;
  const showVoirTout = data?.resolvedCity && data.availableCount > 0;

  return (
    <div className="flex h-full flex-col gap-4 rounded-3xl bg-cream/60 p-5 ring-1 ring-darna/10 sm:p-6">
      {loading ? (
        <div className="flex flex-1 flex-col gap-3" aria-busy="true">
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-darna/10" />
          <div className="h-4 w-2/3 animate-pulse rounded-full bg-darna/10" />
          <div className="mt-2 h-16 animate-pulse rounded-2xl bg-darna/10" />
          <div className="h-16 animate-pulse rounded-2xl bg-darna/10" />
          <span className="sr-only">{fr.destination.chargement}</span>
        </div>
      ) : !data ? null : (
        <>
          {/* En-tête : destination + météo */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-lg font-bold text-darna">
                <MapPinIcon width={16} height={16} className="shrink-0 text-darna/60" />
                <span className="truncate">{title}</span>
              </p>
            </div>
            {data.weather ? (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-darna ring-1 ring-darna/10">
                {weatherIcon(data.weather.condition)}
                {data.weather.tempC}°
                <span className="text-xs font-medium text-ink/55">
                  {weatherLabel(data.weather.condition)}
                </span>
              </span>
            ) : null}
          </div>

          {/* Logements disponibles (ville résolue) ou message d'absence */}
          {data.resolvedCity ? (
            data.availableCount > 0 ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <ShieldIcon width={15} height={15} className="shrink-0" />
                {fr.destination.logementsDispo(data.availableCount)}
              </p>
            ) : (
              <p className="text-sm font-medium text-ink/60">{fr.destination.aucunIci}</p>
            )
          ) : null}

          {/* Recommandations cliquables */}
          {data.recommendations.length > 0 ? (
            <div className="flex flex-col gap-2">
              {data.recommendations.map((reco) => (
                <Link
                  key={reco.slug}
                  href={`/annonce/${reco.slug}`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-2 ring-1 ring-darna/10 transition hover:ring-darna/30"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-darna/10">
                    {reco.imageUrl ? (
                      <Image
                        src={reco.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-darna/40">
                        <MapPinIcon width={18} height={18} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {reco.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-xs text-ink/55">
                      <span className="font-semibold text-darna">{reco.priceLabel}</span>
                      {reco.verified ? (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700">
                          <ShieldIcon width={12} height={12} />
                          {fr.destination.verifie}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {showVoirTout ? (
            <Link
              href={`/sejours?ville=${encodeURIComponent(data.resolvedCity!)}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-darna hover:underline"
            >
              {fr.destination.voirTout(data.availableCount)}
              <ArrowRightIcon width={14} height={14} />
            </Link>
          ) : null}

          {/* Alternatives / destinations populaires (cross-discovery) */}
          {data.alternatives.length > 0 ? (
            <div className="mt-auto border-t border-darna/10 pt-3">
              <p className="mb-2 text-xs font-medium text-ink/55">
                {data.resolvedCity
                  ? fr.destination.autreDestination
                  : fr.destination.destinationsPopulaires}
              </p>
              <div className="flex flex-wrap gap-2">
                {data.alternatives.map((alt) => (
                  <Link
                    key={alt.city}
                    href={`/sejours?ville=${encodeURIComponent(alt.city)}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink ring-1 ring-darna/15 transition hover:ring-darna/40"
                  >
                    {alt.city} · {alt.count}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
