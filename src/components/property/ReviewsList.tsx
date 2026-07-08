"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, CloseIcon, StarIcon } from "@/components/icons";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import type { HostCancellationEntry, ReviewItem } from "./ReviewsSection";

type SortKey = "recent" | "old" | "high" | "low";

/**
 * Item unifié du flux d'avis : un vrai avis noté, ou une entrée SYSTÈME
 * « annulé par l'hôte » (§AHC7). Les entrées système n'ont pas de note — donc
 * exclues du tri/filtre par note (elles n'apparaissent que triées par date,
 * jamais sous un filtre « X étoiles » ni un tri « meilleures/moins bonnes »).
 */
type FeedItem =
  | { kind: "avis"; createdAt: string; review: ReviewItem }
  | { kind: "annulation"; createdAt: string; entry: HostCancellationEntry };

/** Nombre d'avis affichés par défaut avant « Afficher plus » (partout dans Darna). */
const PAGE_SIZE = 3;

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
          className={n <= rating ? "" : "text-body/20"}
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

  // Stats (moyenne, histogramme, sous-notes) TOUJOURS calculées sur les vrais
  // avis uniquement (§AHC7) : une entrée système « annulé par l'hôte » n'a pas
  // de note et ne doit jamais fausser la moyenne affichée/le rating serveur.
  const total = reviews.length;

  const { average, counts, subAverages } = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // index 0 → 1 étoile, index 4 → 5 étoiles
    let sum = 0;
    let proprete = 0;
    let communication = 0;
    let conformite = 0;
    let qualitePrix = 0;
    for (const r of reviews) {
      counts[r.rating - 1]++;
      sum += r.rating;
      proprete += r.proprete;
      communication += r.communication;
      conformite += r.conformite;
      qualitePrix += r.qualitePrix;
    }
    return {
      average: total ? sum / total : 0,
      counts,
      subAverages: total
        ? {
            proprete: proprete / total,
            communication: communication / total,
            conformite: conformite / total,
            qualitePrix: qualitePrix / total,
          }
        : null,
    };
  }, [reviews, total]);

  const visible = useMemo<FeedItem[]>(() => {
    const filteredReviews = ratingFilter
      ? reviews.filter((r) => r.rating === ratingFilter)
      : reviews.slice();
    const reviewItems: FeedItem[] = filteredReviews.map((review) => ({
      kind: "avis",
      createdAt: review.createdAt,
      review,
    }));

    // Les entrées système n'ont pas de note : elles n'apparaissent QUE dans le
    // flux chronologique non filtré (jamais sous un filtre « X étoiles » ni un
    // tri par note, où leur absence de note n'aurait pas de sens).
    const includeCancellations = !ratingFilter && (sort === "recent" || sort === "old");
    const cancellationItems: FeedItem[] = includeCancellations
      ? cancellations.map((entry) => ({ kind: "annulation", createdAt: entry.cancelledAt, entry }))
      : [];

    const merged = [...reviewItems, ...cancellationItems];
    const byDate = (a: FeedItem, b: FeedItem) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    merged.sort((a, b) => {
      switch (sort) {
        case "old":
          return -byDate(a, b);
        case "high":
          return (
            (b.kind === "avis" ? b.review.rating : 0) -
              (a.kind === "avis" ? a.review.rating : 0) || byDate(a, b)
          );
        case "low":
          return (
            (a.kind === "avis" ? a.review.rating : 0) -
              (b.kind === "avis" ? b.review.rating : 0) || byDate(a, b)
          );
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

  if (total === 0 && cancellations.length === 0) {
    return (
      <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-body/60 ring-1 ring-darna/10">
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
      {/* Récap : note moyenne + histogramme cliquable (filtre par note).
          Masqué si zéro vrai avis (une entrée système seule n'a pas de note
          à récapituler) — §AHC7. */}
      {total > 0 ? (
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-darna/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-1.5">
              <span className="text-4xl font-bold leading-none text-heading">
                {average.toFixed(1)}
                <span className="text-base font-semibold text-body/40">/5</span>
              </span>
              <div>
                <Stars rating={Math.round(average)} size={16} />
                <p className="mt-1 text-xs text-body/55">{fr.property.nbAvis(total)}</p>
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
                    <span className="flex w-9 items-center justify-end gap-0.5 text-xs font-medium text-body/60">
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
                    <span className="w-6 text-end text-xs tabular-nums text-body/50">
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
                  <p className="text-xs text-body/55">{label}</p>
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
            <span className="text-xs text-body/50">{fr.property.filtreToutes}</span>
          )}
        </div>

        <label className="flex items-center gap-2 text-xs text-body/60">
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
        <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-body/60 ring-1 ring-darna/10">
          {fr.property.aucunAvisFiltre}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shown.map((item) =>
            item.kind === "annulation" ? (
              // §AHC7 — entrée SYSTÈME, jamais une carte d'avis noté : pas
              // d'auteur, pas d'étoiles, ton neutre/factuel (pas un jugement).
              <li
                key={`annulation-${item.entry.id}`}
                className="flex items-start gap-3 rounded-2xl bg-red-50 p-5 ring-1 ring-red-100"
              >
                <AlertTriangleIcon
                  width={18}
                  height={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {fr.property.avisSystemeAnnulationHote(
                      dateFmt.format(new Date(item.entry.cancelledAt))
                    )}
                  </p>
                  <p className="mt-1 text-xs text-red-700/70">
                    {fr.property.avisSystemeLabel}
                  </p>
                </div>
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
                      <p className="text-xs text-body/50">
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
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-darna/5 pt-2.5 text-xs text-body/50">
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
