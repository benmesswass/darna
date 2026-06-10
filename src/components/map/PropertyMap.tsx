"use client";

import dynamic from "next/dynamic";
import { fr } from "@/lib/i18n/fr";
import type { MapMarker } from "./types";

// Leaflet manipule `window` : chargement exclusivement côté client.
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-darna/5 text-sm text-ink/50">
      {fr.search.chargementCarte}
    </div>
  ),
});

export function PropertyMap({ markers }: { markers: MapMarker[] }) {
  return <MapInner markers={markers} />;
}
