"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, CloseIcon, StarIcon } from "@/components/icons";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { blendedRatingStats, HOST_CANCELLATION_RATING } from "@/lib/rating";
import type { HostCancellationEntry, ReviewItem } from "./ReviewsSection";

type SortKey = "recent" | "old" | "high" | "low";

/**
 * Item unifié du flux d'avis : un vrai avis noté, ou une entrée SYSTÈME
 * « annulé par l'hôte » (§AHC7) — traitée comme un avis à 1/5 de partout
 * (moyenne, histogramme, filtre par note, tri) mais jamais attribuée à un
 * voyageur : « auteur » = Darna, dates exactes du séjour annulé.
 */
type FeedItem =
  | { kind: "avis"; createdAt: string; rating: number; review: ReviewItem }
  | { kind: "annulation"; createdAt: string; rating: number; entry: HostCancellationEntry };

/** Nombre d'avis affichés par défaut avant « Afficher plus » (partout dans Darna). */
const PAGE_SIZE = 3;

/** Mapping locale interne → tag BCP-47 pour le formatage des dates. */
const LOCALE_TAG: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "ar-TN",
};

function Stars({
  rating,
  size = 14,
  tone = "text-sand",
}: {
  rating: number;
  size?: number;
  tone?: string;
}) {
  return (
    <span className={`flex gap-0.5 ${tone}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          width={size}
          height={size}
          fill={n <= rating ? "currentColor" : "none"}
          className={n <= rating ? "" : "text-subtle"}
        />
      ))}
    </span>
  );
}

/**
 * Liste d'avis avec récap (note moyenne + histogramme) et filtres modernes.
 * Tout le filtrage/tri est fait côté client : les avis sont déjà chargés,
 * donc l'interaction est instantanée et sans rechargement.
 */
export function ReviewsList({
  reviews,
  cancellations = [],
}: {
  reviews: ReviewItem[];
  cancellations?: HostCancellationEntry[];
}) {
  const fr = useT();
  const locale = useLocale();
  const [sort, setSort] = useState<SortKey>("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // §AHC7 (décision produit du 2026-07-08) : chaque annulation hôte compte
  // comme une note automatique de 1/5 dans la moyenne/l'histogramme AFFICHÉS
  // — dissuasif réel, pas cosmétique. Les sous-notes (propreté, communication…)
  // restent calculées sur les VRAIS avis uniquement : une annulation n'a pas
  // de sous-critères à noter.
  const { average, counts, total } = useMemo(
    () => blendedRatingStats(reviews, cancellations.length),
    [reviews, cancellations.length]
  );
  const realCount = reviews.length;
  const subAverages = useMemo(() => {
    if (realCount === 0) return null;
    let proprete = 0;
    let communication = 0;
    let conformite = 0;
    let qualitePrix = 0;
    for (const r of reviews) {
      proprete += r.proprete;
      communication += r.communication;
      conformite += r.conformite;
      qualitePrix += r.qualitePrix;
    }
    return {
      proprete: proprete / realCount,
      communication: communication / realCount,
      conformite: conformite / realCount,
      qualitePrix: qualitePrix / realCount,
    };
  }, [reviews, realCount]);

  const visible = useMemo<FeedItem[]>(() => {
    const reviewItems: FeedItem[] = reviews.map((review) => ({
      kind: "avis",
      createdAt: review.createdAt,
      rating: review.rating,
      review,
    }));
    const cancellationItems: FeedItem[] = cancellations.map((entry) => ({
      kind: "annulation",
      createdAt: entry.cancelledAt,
      rating: HOST_CANCELLATION_RATING,
      entry,
    }));

    const merged = ratingFilter
      ? [...reviewItems, ...cancellationItems].filter((i) => i.rating === ratingFilter)
      : [...reviewItems, ...cancellationItems];

    const byDate = (a: FeedItem, b: FeedItem) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    merged.sort((a, b) => {
      switch (sort) {
        case "old":
          return -byDate(a, b);
        case "high":
          return b.rating - a.rating || byDate(a, b);
        case "low":
          return a.rating - b.rating || byDate(a, b);
        default:
          return byDate(a, b);
      }
    });
    return merged;
  }, [reviews, cancellations, ratingFilter, sort]);

  // Revient à PAGE_SIZE quand le filtre/tri change — sinon un "Afficher plus"
  // gardé ouvert sur l'ancien filtre resterait ouvert sur le nouveau, incohérent.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [ratingFilter, sort]);

  const shown = visible.slice(0, visibleCount);
  const remaining = visible.length - shown.length;

  if (total === 0) {
    return (
      <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-darna/10">
        {fr.property.aucunAvis}
      </p>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "fr-FR", {
    month: "long",
    year: "numeric",
  });
  // Dates EXACTES du séjour annulé (pas juste le mois) — §AHC7, sur demande.
  const dayFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-4">
      {/* Récap : note moyenne + histogramme cliquable (filtre par note). Les
          annulations hôte (§AHC7) sont incluses dans `total`, donc toujours
          affiché dès qu'il y a au moins une entrée (avis réel ou système). */}
      {total > 0 ? (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-darna/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
              <span className="text-4xl font-bold leading-none text-heading">
                {average.toFixed(1)}
                <span className="text-base font-semibold text-subtle">/5</span>
              </span>
              <div>
                <Stars rating={Math.round(average)} size={16} />
                <p className="mt-1 text-xs text-muted">{fr.property.nbAvis(total)}</p>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = counts[star - 1];
                const pct = total ? Math.round((count / total) * 100) : 0;
                const active = ratingFilter === star;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingFilter(active ? null : star)}
                    aria-pressed={active}
                    aria-label={fr.property.filtreParNote(star)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-1.5 py-0.5 transition hover:bg-cream ${
                      active ? "bg-cream" : ""
                    }`}
                  >
                    <span className="flex w-9 items-center justify-end gap-0.5 text-xs font-medium text-muted">
                      {star}
                      <StarIcon
                        width={11}
                        height={11}
                        fill="currentColor"
                        className="text-sand"
                      />
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-darna/10">
                      <span
                        className="absolute inset-y-0 start-0 rounded-full bg-sand transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-6 text-end text-xs tabular-nums text-muted">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sous-notes (F2) : moyenne par critère, sur l'ensemble des avis. */}
          {subAverages ? (
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-darna/10 pt-4 sm:grid-cols-4">
              {(
                [
                  [fr.property.sousNoteProprete, subAverages.proprete],
                  [fr.property.sousNoteCommunication, subAverages.communication],
                  [fr.property.sousNoteConformite, subAverages.conformite],
                  [fr.property.sousNoteQualitePrix, subAverages.qualitePrix],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="text-sm font-bold text-heading">{value.toFixed(1)}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Barre d'outils : filtre actif + tri */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-[2.25rem] items-center">
          {ratingFilter ? (
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-darna/10 py-1.5 pe-2 ps-3 text-xs font-medium text-heading transition hover:bg-darna/15"
            >
              {fr.property.filtreParNote(ratingFilter)}
              <CloseIcon width={13} height={13} />
            </button>
          ) : (
            <span className="text-xs text-muted">{fr.property.filtreToutes}</span>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold">{fr.property.trierPar}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2 text-sm font-medium text-body outline-none transition focus:border-darna"
          >
            <option value="recent">{fr.property.triRecents}</option>
            <option value="old">{fr.property.triAnciens}</option>
            <option value="high">{fr.property.triMeilleures}</option>
            <option value="low">{fr.property.triMoins}</option>
          </select>
        </label>
      </div>

      {/* Liste filtrée / triée */}
      {visible.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-muted ring-1 ring-darna/10">
          {fr.property.aucunAvisFiltre}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shown.map((item) =>
            item.kind === "annulation" ? (
              // §AHC7 — même gabarit qu'un avis réel (auteur/date/étoiles/
              // commentaire), pour peser dans le flux comme un vrai 1/5, mais
              // « auteur » = Darna (jamais attribué à un voyageur) et carte
              // teintée en rouge en permanence — ne se fond jamais dans les
              // vrais avis, même triée/mélangée parmi eux.
              <li
                key={`annulation-${item.entry.id}`}
                className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">
                      <AlertTriangleIcon width={16} height={16} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-red-800">Darna</p>
                      <p className="text-xs text-red-700/70">
                        {dateFmt.format(new Date(item.entry.cancelledAt))}
                        {" · "}
                        <span className="font-medium text-red-800">
                          {fr.property.avisSystemeLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Stars rating={HOST_CANCELLATION_RATING} tone="text-red-600" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-red-800/90">
                  {fr.property.avisSystemeAnnulationHote(
                    dayFmt.format(new Date(item.entry.checkIn)),
                    dayFmt.format(new Date(item.entry.checkOut))
                  )}
                </p>
              </li>
            ) : (
              <li
                key={item.review.id}
                className="rounded-2xl bg-surface p-5 ring-1 ring-darna/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-darna text-sm font-bold text-white">
                      {item.review.authorName.charAt(0)}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-body">
                        {item.review.authorName}
                      </p>
                      <p className="text-xs text-muted">
                        {dateFmt.format(new Date(item.review.createdAt))}
                        {" · "}
                        <span className="font-medium text-heading">
                          {fr.property.avisVerifie}
                        </span>
                      </p>
                    </div>
                  </div>
                  <Stars rating={item.review.rating} />
                </div>
                {/* Annonce concernée — uniquement en contexte multi-annonces
                    (fiche hôte agrégeant plusieurs biens). */}
                {item.review.property ? (
                  <Link
                    href={`/annonce/${item.review.property.slug}`}
                    className="mt-2 inline-block text-xs font-medium text-heading hover:underline"
                  >
                    {item.review.property.title}
                  </Link>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-body/80">
                  {item.review.comment}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-darna/5 pt-2.5 text-xs text-muted">
                  <span>
                    {fr.property.sousNoteProprete}{" "}
                    <b className="text-body/70">{item.review.proprete}/5</b>
                  </span>
                  <span>
                    {fr.property.sousNoteCommunication}{" "}
                    <b className="text-body/70">{item.review.communication}/5</b>
                  </span>
                  <span>
                    {fr.property.sousNoteConformite}{" "}
                    <b className="text-body/70">{item.review.conformite}/5</b>
                  </span>
                  <span>
                    {fr.property.sousNoteQualitePrix}{" "}
                    <b className="text-body/70">{item.review.qualitePrix}/5</b>
                  </span>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setVisibleCount(visible.length)}
          className="mt-4 w-full rounded-2xl bg-surface py-3 text-sm font-semibold text-heading ring-1 ring-darna/10 transition hover:bg-cream"
        >
          {fr.property.afficherPlusAvis(remaining)}
        </button>
      ) : visible.length > PAGE_SIZE ? (
        <button
          type="button"
          onClick={() => setVisibleCount(PAGE_SIZE)}
          className="mt-4 w-full rounded-2xl bg-surface py-3 text-sm font-semibold text-heading ring-1 ring-darna/10 transition hover:bg-cream"
        >
          {fr.property.afficherMoinsAvis}
        </button>
      ) : null}
    </div>
  );
}
