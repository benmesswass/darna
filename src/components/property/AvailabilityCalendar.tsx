"use client";

import { useMemo, useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    date
  );
}

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calendrier de disponibilité (lecture seule) : les dates réservées
 * ou bloquées par l'hôte apparaissent barrées.
 */
export function AvailabilityCalendar({ unavailable }: { unavailable: string[] }) {
  const fr = useT();
  const [offset, setOffset] = useState(0);
  const unavailableSet = useMemo(() => new Set(unavailable), [unavailable]);

  const months = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    return [0, 1].map((i) => {
      const first = new Date(base.getFullYear(), base.getMonth() + offset + i, 1);
      const daysInMonth = new Date(
        first.getFullYear(),
        first.getMonth() + 1,
        0
      ).getDate();
      // Lundi = 0
      const startWeekday = (first.getDay() + 6) % 7;
      return { first, daysInMonth, startWeekday };
    });
  }, [offset]);

  const today = toIso(new Date());

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 2))}
          disabled={offset === 0}
          className="rounded-full px-3 py-1 text-sm font-bold text-darna disabled:opacity-30"
          aria-label="Mois précédents"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(4, o + 2))}
          disabled={offset >= 4}
          className="rounded-full px-3 py-1 text-sm font-bold text-darna disabled:opacity-30"
          aria-label="Mois suivants"
        >
          →
        </button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {months.map(({ first, daysInMonth, startWeekday }) => (
          <div key={first.toISOString()}>
            <p className="mb-2 text-center text-sm font-semibold capitalize text-darna">
              {monthLabel(first)}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {WEEKDAYS.map((d, i) => (
                <span key={`${d}-${i}`} className="py-1 font-semibold text-ink/40">
                  {d}
                </span>
              ))}
              {Array.from({ length: startWeekday }).map((_, i) => (
                <span key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const date = new Date(first.getFullYear(), first.getMonth(), i + 1);
                const iso = toIso(date);
                const isUnavailable = unavailableSet.has(iso);
                const isPast = iso < today;
                return (
                  <span
                    key={iso}
                    className={`rounded-lg py-1.5 ${
                      isPast
                        ? "text-ink/25"
                        : isUnavailable
                          ? "bg-ink/10 text-ink/35 line-through"
                          : "bg-darna/5 font-medium text-darna"
                    }`}
                  >
                    {i + 1}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-darna/5 ring-1 ring-darna/20" />
          {fr.property.jourLibre}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-ink/10" />
          {fr.property.legende}
        </span>
      </div>
    </div>
  );
}
