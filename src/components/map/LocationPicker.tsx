"use client";

import dynamic from "next/dynamic";
import { useT } from "@/components/i18n/LocaleProvider";

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
const LocationPickerInner = dynamic(() => import("./LocationPickerInner"), {
  ssr: false,
  loading: () => <MapLoading />,
});

/** Sélecteur d'emplacement : carte avec repère déplaçable + clic-pour-placer. */
export function LocationPicker(props: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return <LocationPickerInner {...props} />;
}
