"use client";

import { useState, type ReactNode } from "react";
import { fr } from "@/lib/i18n/fr";
import { MapPinIcon } from "@/components/icons";

/**
 * Vue liste + carte : côte à côte sur desktop, bascule liste/carte sur mobile.
 * Les deux panneaux restent rendus côté serveur (passés en children).
 */
export function SplitView({ list, map }: { list: ReactNode; map: ReactNode }) {
  const [mobileView, setMobileView] = useState<"liste" | "carte">("liste");

  return (
    <div className="relative">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className={mobileView === "carte" ? "hidden lg:block" : ""}>{list}</div>
        <div
          className={`${
            mobileView === "liste" ? "hidden lg:block" : ""
          } h-[70vh] overflow-hidden rounded-3xl ring-1 ring-darna/10 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]`}
        >
          {map}
        </div>
      </div>

      {/* Bascule mobile flottante */}
      <div className="fixed inset-x-0 bottom-5 z-[1000] flex justify-center lg:hidden">
        <button
          type="button"
          onClick={() => setMobileView((v) => (v === "liste" ? "carte" : "liste"))}
          className="inline-flex items-center gap-2 rounded-full bg-darna px-5 py-2.5 text-sm font-semibold text-white shadow-xl"
        >
          <MapPinIcon width={16} height={16} />
          {mobileView === "liste" ? fr.search.voirCarte : fr.search.voirListe}
        </button>
      </div>
    </div>
  );
}
