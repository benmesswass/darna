"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useT } from "@/components/i18n/LocaleProvider";
import { StarIcon, CheckIcon } from "@/components/icons";
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

/**
 * Les boutons de zoom Leaflet sont des `<a href="#">`. Au clic ils prennent le
 * focus ; le navigateur fait alors défiler la page pour amener le lien fraîchement
 * focalisé dans la vue → toute la page « saute » légèrement vers le bas. On annule
 * le focus pris à la souris (`mousedown`) sans toucher au focus clavier (Tab),
 * ce qui supprime le défilement parasite tout en gardant l'accessibilité.
 */
function ZoomFocusFix() {
  const map = useMap();
  useEffect(() => {
    const links = map
      .getContainer()
      .querySelectorAll<HTMLAnchorElement>(".leaflet-control-zoom a");
    const onMouseDown = (e: MouseEvent) => e.preventDefault();
    links.forEach((link) => link.addEventListener("mousedown", onMouseDown));
    return () =>
      links.forEach((link) => link.removeEventListener("mousedown", onMouseDown));
  }, [map]);
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

/** Carte de survol d'un marqueur : photo, titre, ville, note + avis, prix. */
function MarkerCard({
  marker,
  onEnter,
  onLeave,
}: {
  marker: MapMarker;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const fr = useT();
  return (
    <a
      href={`/annonce/${marker.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="block w-56 overflow-hidden rounded-2xl bg-surface text-body no-underline shadow-xl ring-1 ring-darna/10"
    >
      <div className="relative h-28 w-full bg-darna/10">
        {marker.imageUrl ? (
          <Image
            src={marker.imageUrl}
            alt=""
            fill
            sizes="224px"
            className="object-cover"
          />
        ) : null}
        {marker.verified ? (
          <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-heading shadow-sm backdrop-blur">
            <CheckIcon width={11} height={11} />
            {fr.badges.verifie}
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-1 text-sm font-semibold leading-tight">
          {marker.title}
        </p>
        <p className="line-clamp-1 text-xs text-body/55">{marker.city}</p>
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-sm font-bold text-heading">{marker.priceLabel}</span>
          {marker.rating != null ? (
            <span className="flex shrink-0 items-center gap-1 text-xs text-body/70">
              <StarIcon
                width={13}
                height={13}
                fill="currentColor"
                className="text-sand"
              />
              {marker.rating.toFixed(1)}
              <span className="text-body/45">
                · {fr.property.nbAvis(marker.reviewCount)}
              </span>
            </span>
          ) : (
            <span className="shrink-0 text-xs text-body/40">
              {fr.search.sansAvis}
            </span>
          )}
        </div>
      </div>
    </a>
  );
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

  // Survol « avec intention » : un court délai à la sortie laisse le temps
  // d'entrer dans la carte (sinon elle se ferme). Entrer dans la carte annule
  // la fermeture ; en ressortir (souris ailleurs) la replanifie.
  const openLayer = useRef<L.Marker | null>(null);
  const closeTimer = useRef<number | null>(null);
  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      openLayer.current?.closePopup();
      openLayer.current = null;
      closeTimer.current = null;
    }, 220);
  };

  return (
    <MapContainer
      {...(bounds ? { bounds } : { center, zoom })}
      scrollWheelZoom
      className="h-full w-full"
    >
      <AutoResize bounds={bounds} center={center} zoom={zoom} />
      <ZoomFocusFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={priceIcon(marker.priceLabel, marker.verified)}
          eventHandlers={{
            // Survol : popup interactif (atteignable à la souris).
            mouseover: (e) => {
              cancelClose();
              openLayer.current = e.target as L.Marker;
              (e.target as L.Marker).openPopup();
            },
            // Sortie du marqueur : fermeture différée (annulée si on entre
            // dans la carte).
            mouseout: scheduleClose,
          }}
        >
          <Popup
            closeButton={false}
            // autoPan recadre la carte uniquement quand la fiche dépasserait
            // du cadre (marqueur près d'un bord), sinon elle resterait coupée.
            // Padding pour garder une marge confortable autour de la fiche.
            autoPan
            autoPanPadding={[24, 24]}
            offset={[0, -22]}
            className="darna-map-pop"
          >
            <MarkerCard
              marker={marker}
              onEnter={cancelClose}
              onLeave={scheduleClose}
            />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
