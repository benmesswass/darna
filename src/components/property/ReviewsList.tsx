"use client";

import { useMemo, useState } from "react";
import { CloseIcon, StarIcon } from "@/components/icons";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { ReviewItem } from "./ReviewsSection";

type SortKey = "recent" | "old" | "high" | "low";

/** Mapping locale interne → tag BCP-47 pour le formatage des dates. */
const LOCALE_TAG: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ar: "ar-TN",
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex gap-0.5 text-sand" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          width={size}
          height={size}
          fill={n <= rating ? "currentColor" : "none"}
          className={n <= rating ? "" : "text-ink/20"}
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
export function ReviewsList({ reviews }: { reviews: ReviewItem[] }) {
  const fr = useT();
  const locale = useLocale();
  const [sort, setSort] = useState<SortKey>("recent");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  const total = reviews.length;

  const { average, counts } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 → 1 étoile, index 4 → 5 étoiles
    let sum = 0;
    for (const r of reviews) {
      counts[r.rating - 1]++;
      sum += r.rating;
    }
    return { average: total ? sum / total : 0, counts };
  }, [reviews, total]);

  const visible = useMemo(() => {
    const filtered = ratingFilter
      ? reviews.filter((r) => r.rating === ratingFilter)
      : reviews.slice();
    const byDate = (a: ReviewItem, b: ReviewItem) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    filtered.sort((a, b) => {
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
    return filtered;
  }, [reviews, ratingFilter, sort]);

  if (total === 0) {
    return (
      <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-ink/60 ring-1 ring-darna/10">
        {fr.property.aucunAvis}
      </p>
    );
  }

  const dateFmt = new Intl.DateTimeFormat(LOCALE_TAG[locale] ?? "fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mt-4">
      {/* Récap : note moyenne + histogramme cliquable (filtre par note) */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-darna/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
            <span className="text-4xl font-bold leading-none text-darna">
              {average.toFixed(1)}
              <span className="text-base font-semibold text-ink/40">/5</span>
            </span>
            <div>
              <Stars rating={Math.round(average)} size={16} />
              <p className="mt-1 text-xs text-ink/55">{fr.property.nbAvis(total)}</p>
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
                  <span className="flex w-9 items-center justify-end gap-0.5 text-xs font-medium text-ink/60">
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
                  <span className="w-6 text-end text-xs tabular-nums text-ink/50">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barre d'outils : filtre actif + tri */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-[2.25rem] items-center">
          {ratingFilter ? (
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className="inline-flex items-center gap-1.5 rounded-full bg-darna/10 py-1.5 pe-2 ps-3 text-xs font-medium text-darna transition hover:bg-darna/15"
            >
              {fr.property.filtreParNote(ratingFilter)}
              <CloseIcon width={13} height={13} />
            </button>
          ) : (
            <span className="text-xs text-ink/50">{fr.property.filtreToutes}</span>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-ink/60">
          <span className="font-semibold">{fr.property.trierPar}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2 text-sm font-medium text-ink outline-none transition focus:border-darna"
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
        <p className="mt-4 rounded-2xl bg-white p-5 text-sm text-ink/60 ring-1 ring-darna/10">
          {fr.property.aucunAvisFiltre}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {visible.map((review) => (
            <li
              key={review.id}
              className="rounded-2xl bg-white p-5 ring-1 ring-darna/10"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-darna text-sm font-bold text-white">
                    {review.authorName.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {review.authorName}
                    </p>
                    <p className="text-xs text-ink/50">
                      {dateFmt.format(new Date(review.createdAt))}
                      {" · "}
                      <span className="font-medium text-darna">
                        {fr.property.avisVerifie}
                      </span>
                    </p>
                  </div>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink/80">
                {review.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
