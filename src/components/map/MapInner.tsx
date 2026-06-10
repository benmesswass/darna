"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./types";

// Centre par défaut : Tunisie.
const TUNISIA_CENTER: [number, number] = [35.6, 9.9];

/**
 * La carte peut être montée dans un conteneur masqué (bascule liste/carte
 * sur mobile) : quand il devient visible, Leaflet doit recalculer sa taille
 * et recadrer la vue, sinon les tuiles restent grises.
 */
function AutoResize({
  bounds,
  center,
  zoom,
}: {
  bounds: L.LatLngBounds | null;
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();
  const lastWidth = useRef(0);

  useEffect(() => {
    const container = map.getContainer();
    const refit = () => {
      map.invalidateSize();
      if (bounds) map.fitBounds(bounds);
      else map.setView(center, zoom);
    };
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      // Recadre uniquement au passage masqué → visible.
      if (lastWidth.current === 0 && width > 0) refit();
      else if (width > 0) map.invalidateSize();
      lastWidth.current = width;
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map, bounds, center, zoom]);

  return null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function priceIcon(label: string, verified: boolean): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="darna-price-marker${verified ? " darna-price-marker--verified" : ""}">${escapeHtml(label)}</div>`,
  });
}

export default function MapInner({ markers }: { markers: MapMarker[] }) {
  const bounds = useMemo(() => {
    if (markers.length < 2) return null;
    return L.latLngBounds(markers.map((m) => [m.latitude, m.longitude])).pad(0.25);
  }, [markers]);

  const center: [number, number] =
    markers.length === 1
      ? [markers[0].latitude, markers[0].longitude]
      : TUNISIA_CENTER;
  const zoom = markers.length === 1 ? 13 : 6;

  return (
    <MapContainer
      {...(bounds ? { bounds } : { center, zoom })}
      scrollWheelZoom
      className="h-full w-full"
    >
      <AutoResize bounds={bounds} center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={priceIcon(marker.priceLabel, marker.verified)}
        >
          <Popup>
            <Link
              href={`/annonce/${marker.slug}`}
              className="text-sm font-semibold text-darna underline"
            >
              {marker.title}
            </Link>
            <div className="mt-1 text-xs font-bold">{marker.priceLabel}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
