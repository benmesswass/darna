"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Repère « maison » (DivIcon) : évite d'embarquer les images d'icône Leaflet,
// comme les marqueurs prix. Ancré en son centre → la position EST le point.
const pinIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: '<div class="darna-pin"></div>',
});

/** Recentre la carte quand les coordonnées changent depuis l'extérieur
 *  (sélection d'une adresse, changement de ville). */
function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 14));
  }, [map, lat, lng]);
  return null;
}

/** Clic sur la carte → déplace le repère à l'endroit cliqué. */
function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerInner({
  lat,
  lng,
  onChange,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer center={[lat, lng]} zoom={14} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={lat} lng={lng} />
      <ClickToPlace onPick={onChange} />
      <Marker
        position={[lat, lng]}
        icon={pinIcon}
        draggable
        eventHandlers={{
          dragend(e) {
            const pos = (e.target as L.Marker).getLatLng();
            onChange(pos.lat, pos.lng);
          },
        }}
      />
    </MapContainer>
  );
}
