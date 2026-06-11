"use client";

import dynamic from "next/dynamic";
import { useT } from "@/components/i18n/LocaleProvider";
import type { MapMarker } from "./types";

/** Placeholder localisé : composant dédié, car `dynamic()` vit au niveau module. */
function MapLoading() {
  const fr = useT();
  return (
    <div className="flex h-full w-full items-center justify-center bg-darna/5 text-sm text-ink/50">
      {fr.search.chargementCarte}
    </div>
  );
}

// Leaflet manipule `window` : chargement exclusivement côté client.
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export function PropertyMap({ markers }: { markers: MapMarker[] }) {
  return <MapInner markers={markers} />;
}
