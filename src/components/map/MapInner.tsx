"use client";

import { useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMarker } from "./types";

// Centre par défaut : Tunisie.
const TUNISIA_CENTER: [number, number] = [35.6, 9.9];

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
    if (markers.length === 0) return null;
    return L.latLngBounds(markers.map((m) => [m.latitude, m.longitude])).pad(0.25);
  }, [markers]);

  return (
    <MapContainer
      {...(bounds && markers.length > 1
        ? { bounds }
        : {
            center:
              markers.length === 1
                ? ([markers[0].latitude, markers[0].longitude] as [number, number])
                : TUNISIA_CENTER,
            zoom: markers.length === 1 ? 13 : 6,
          })}
      scrollWheelZoom
      className="h-full w-full"
    >
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
