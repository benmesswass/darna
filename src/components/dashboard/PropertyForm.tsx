"use client";

import { useActionState, useRef, useState } from "react";
import {
  createPropertyAction,
  updatePropertyAction,
  type PropertyFormState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";
import { PhotoDropzone } from "./PhotoDropzone";
import { generateDescription } from "@/lib/description";
import { AMENITIES } from "@/lib/constants";
import { CITIES, getCity, nearestCity, resolveCity } from "@/lib/geo";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { LocationPicker } from "@/components/map/LocationPicker";
import type { AddressSuggestion } from "@/actions/geocode";
import { SparklesIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna disabled:opacity-60";
const labelClass = "text-sm font-semibold text-ink/70";

export type PropertyFormInitial = {
  id: string;
  title: string;
  type: string;
  price: number;
  city: string;
  address: string;
  surface: number | null;
  rooms: number | null;
  maxGuests: number | null;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
};

/** Formulaire d'annonce — création (sans `initial`) ou modification (avec). */
export function PropertyForm({ initial }: { initial?: PropertyFormInitial }) {
  const fr = useT();
  const isEdit = Boolean(initial);
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(
    isEdit ? updatePropertyAction : createPropertyAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState(initial?.type ?? "SEJOUR");
  const [cityName, setCityName] = useState(initial?.city ?? "Tunis");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initial?.latitude ?? 36.8065,
    lng: initial?.longitude ?? 10.1815,
  });
  const [description, setDescription] = useState(initial?.description ?? "");
  // Nombre de photos sélectionnées (création) — au moins une requise.
  const [photoCount, setPhotoCount] = useState(0);

  const priceLabel =
    type === "SEJOUR"
      ? fr.annonceForm.prixNuit
      : type === "LOCATION"
        ? fr.annonceForm.prixMois
        : fr.annonceForm.prixVente;

  // Choix d'une ville → recentre le repère sur son centre (filet de sécurité
  // si l'autocomplétion d'adresse est indisponible).
  function onCityChange(name: string) {
    setCityName(name);
    const city = getCity(name);
    if (city) setCoords({ lat: city.latitude, lng: city.longitude });
  }

  // Sélection d'une suggestion d'adresse → coordonnées + ville rattachée.
  function onAddressSelect(s: AddressSuggestion) {
    setAddress(s.label);
    setCoords({ lat: s.latitude, lng: s.longitude });
    setCityName(resolveCity(s.city) ?? nearestCity(s.latitude, s.longitude).name);
  }

  // Repère déplacé / carte cliquée → la ville suit l'emplacement (cohérence
  // city/gouvernorat, dont dépendent la recherche et les index).
  function onPinMove(lat: number, lng: number) {
    setCoords({ lat, lng });
    setCityName(nearestCity(lat, lng).name);
  }

  /** Compose la description depuis les champs saisis — templates, zéro API. */
  function onGenerate() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const generated = generateDescription({
      title: String(data.get("title") ?? "").trim() || "Ce bien",
      type,
      city: String(data.get("city") ?? ""),
      address: String(data.get("address") ?? "").trim() || undefined,
      surface: Number(data.get("surface")) || undefined,
      rooms: Number(data.get("rooms")) || undefined,
      maxGuests: Number(data.get("maxGuests")) || undefined,
      amenities: data.getAll("amenities").map(String),
      price: Number(data.get("price")) || undefined,
    });
    setDescription(generated);
  }

  return (
    <form ref={formRef} action={action} className="space-y-5">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}

      {initial ? <input type="hidden" name="propertyId" value={initial.id} /> : null}

      {/* Photos en tête (création) : premier critère de confiance, on les met
          en avant. En édition, c'est le PhotoManager qui gère les photos. */}
      {!isEdit ? (
        <div className="rounded-2xl bg-cream/40 p-4 ring-1 ring-darna/10">
          <PhotoDropzone onCountChange={setPhotoCount} />
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className={labelClass}>{fr.annonceForm.titre}</span>
        <input
          name="title"
          type="text"
          required
          minLength={8}
          maxLength={120}
          defaultValue={initial?.title ?? ""}
          placeholder={fr.annonceForm.titrePlaceholder}
          className={inputClass}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.type}</span>
          <select
            name="type"
            value={type}
            disabled={isEdit}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="SEJOUR">{fr.annonceForm.typeSejour}</option>
            <option value="LOCATION">{fr.annonceForm.typeLocation}</option>
            <option value="VENTE">{fr.annonceForm.typeVente}</option>
          </select>
          {isEdit ? (
            <span className="block text-xs text-ink/40">
              {fr.annonceForm.typeNonModifiable}
            </span>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{priceLabel}</span>
          <input
            name="price"
            type="number"
            required
            min={10}
            defaultValue={initial?.price ?? ""}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.ville}</span>
          <select
            name="city"
            required
            value={cityName}
            onChange={(e) => onCityChange(e.target.value)}
            className={inputClass}
          >
            {CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.gouvernorat})
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.adresse}</span>
          <AddressAutocomplete
            value={address}
            onValueChange={setAddress}
            onSelect={onAddressSelect}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.surface}</span>
          <input
            name="surface"
            type="number"
            min={10}
            defaultValue={initial?.surface ?? ""}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.pieces}</span>
          <input
            name="rooms"
            type="number"
            min={1}
            max={30}
            defaultValue={initial?.rooms ?? ""}
            className={inputClass}
          />
        </label>
        {type === "SEJOUR" ? (
          <label className="block space-y-1.5">
            <span className={labelClass}>{fr.annonceForm.capacite}</span>
            <input
              name="maxGuests"
              type="number"
              required
              min={1}
              max={30}
              defaultValue={initial?.maxGuests ?? ""}
              className={inputClass}
            />
          </label>
        ) : null}
      </div>

      <fieldset className="space-y-1.5">
        <legend className={labelClass}>
          {fr.annonceForm.localisation}{" "}
          <span className="font-normal text-ink/40">
            — {fr.annonceForm.repereAide}
          </span>
        </legend>
        <div className="h-64 w-full overflow-hidden rounded-xl border border-darna/15">
          <LocationPicker lat={coords.lat} lng={coords.lng} onChange={onPinMove} />
        </div>
        <input type="hidden" name="latitude" value={coords.lat} />
        <input type="hidden" name="longitude" value={coords.lng} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={labelClass}>{fr.annonceForm.equipements}</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-darna/15 has-[:checked]:bg-darna has-[:checked]:text-white"
            >
              <input
                type="checkbox"
                name="amenities"
                value={a}
                defaultChecked={initial?.amenities.includes(a) ?? false}
                className="sr-only"
              />
              {a}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={labelClass}>{fr.annonceForm.description}</span>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-full bg-darna/10 px-3.5 py-1.5 text-xs font-bold text-darna transition hover:bg-darna hover:text-white"
            title={fr.annonceForm.genererDescriptionAide}
          >
            <SparklesIcon width={14} height={14} />
            {fr.annonceForm.genererDescription}
          </button>
        </div>
        <textarea
          name="description"
          required
          minLength={40}
          maxLength={4000}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-ink/40">{fr.annonceForm.genererDescriptionAide}</p>
      </div>

      <button
        type="submit"
        disabled={pending || (!isEdit && photoCount === 0)}
        className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending
          ? fr.common.chargement
          : isEdit
            ? fr.annonceForm.enregistrerModifs
            : fr.annonceForm.publier}
      </button>
      {!isEdit && photoCount === 0 ? (
        <p className="text-xs font-medium text-ink/50">{fr.annonceForm.photoRequise}</p>
      ) : null}
    </form>
  );
}
