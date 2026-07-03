"use client";

import { useState, useEffect, useRef } from "react";
import { Price } from "@/components/currency/Price";
import { useT } from "@/components/i18n/LocaleProvider";

function computeNights(arrivee: string, depart: string): number {
  if (!arrivee || !depart) return 0;
  const ci = Date.parse(`${arrivee}T00:00:00.000Z`);
  const co = Date.parse(`${depart}T00:00:00.000Z`);
  if (Number.isNaN(ci) || Number.isNaN(co)) return 0;
  const n = Math.round((co - ci) / 86_400_000);
  return n > 0 ? n : 0;
}

export function PriceRangeFilter({
  defaultMin,
  defaultMax,
  defaultArrivee,
  defaultDepart,
}: {
  defaultMin?: string;
  defaultMax?: string;
  defaultArrivee?: string;
  defaultDepart?: string;
}) {
  const fr = useT();
  const [min, setMin] = useState(defaultMin ?? "");
  const [max, setMax] = useState(defaultMax ?? "");
  const [nights, setNights] = useState(() =>
    computeNights(defaultArrivee ?? "", defaultDepart ?? "")
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const form = containerRef.current?.closest("form");
    if (!form) return;

    const update = () => {
      const arrivee =
        (form.elements.namedItem("arrivee") as HTMLInputElement | null)?.value ?? "";
      const depart =
        (form.elements.namedItem("depart") as HTMLInputElement | null)?.value ?? "";
      setNights(computeNights(arrivee, depart));
    };

    form.addEventListener("change", update);
    form.addEventListener("input", update);
    return () => {
      form.removeEventListener("change", update);
      form.removeEventListener("input", update);
    };
  }, []);

  const allIn = (perNight: number) => perNight * nights;

  const minN = Number(min) > 0 ? Number(min) : null;
  const maxN = Number(max) > 0 ? Number(max) : null;
  const showEquiv = nights > 0 && (minN !== null || maxN !== null);

  const inputClass =
    "w-16 bg-transparent text-sm outline-none placeholder:text-body/30";

  return (
    <div ref={containerRef} className="flex flex-col gap-1">
      <div className="flex items-center gap-2 rounded-xl border border-darna/15 bg-cream px-3 py-2 focus-within:border-darna">
        <span className="whitespace-nowrap text-xs font-semibold text-body/50">
          {fr.search.prix} {fr.common.parNuit} ({fr.common.tnd})
        </span>
        <input
          type="number"
          name="prixMin"
          min={0}
          step={10}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder={fr.search.min}
          aria-label={`${fr.search.prixMin} (${fr.common.tnd})`}
          className={inputClass}
        />
        <span aria-hidden className="text-body/30">–</span>
        <input
          type="number"
          name="prixMax"
          min={0}
          step={10}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder={fr.search.max}
          aria-label={`${fr.search.prixMax} (${fr.common.tnd})`}
          className={inputClass}
        />
      </div>

      {showEquiv ? (
        <p className="text-xs text-body/50">
          {fr.search.equivSejour(nights)}{" "}
          {minN !== null && maxN !== null ? (
            <span className="font-semibold text-body/70">
              <Price amount={allIn(minN)} /> – <Price amount={allIn(maxN)} />
            </span>
          ) : minN !== null ? (
            <span className="font-semibold text-body/70">
              ≥ <Price amount={allIn(minN)} />
            </span>
          ) : (
            <span className="font-semibold text-body/70">
              ≤ <Price amount={allIn(maxN!)} />
            </span>
          )}
        </p>
      ) : null}
    </div>
  );
}
