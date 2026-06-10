"use client";

import { useActionState, useRef, useState } from "react";
import {
  createPropertyAction,
  type PropertyFormState,
} from "@/actions/properties";
import { fr } from "@/lib/i18n/fr";
import { generateDescription } from "@/lib/description";
import { AMENITIES } from "@/lib/constants";
import { CITIES } from "@/lib/geo";
import { SparklesIcon } from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";
const labelClass = "text-sm font-semibold text-ink/70";

export function PropertyForm() {
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(
    createPropertyAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState("SEJOUR");
  const [coords, setCoords] = useState<{ lat: string; lng: string }>({
    lat: "36.8065",
    lng: "10.1815",
  });
  const [description, setDescription] = useState("");

  const priceLabel =
    type === "SEJOUR"
      ? fr.annonceForm.prixNuit
      : type === "LOCATION"
        ? fr.annonceForm.prixMois
        : fr.annonceForm.prixVente;

  function onCityChange(cityName: string) {
    const city = CITIES.find((c) => c.name === cityName);
    if (city) {
      setCoords({ lat: String(city.latitude), lng: String(city.longitude) });
    }
  }

  /** Compose la description depuis les champs saisis — templates, zéro API. */
  function onGenerate() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const generated = generateDescription({
      title: String(data.get("title") ?? "").trim() || "Ce bien",
      type: String(data.get("type") ?? "SEJOUR"),
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

      <label className="block space-y-1.5">
        <span className={labelClass}>{fr.annonceForm.titre}</span>
        <input
          name="title"
          type="text"
          required
          minLength={8}
          maxLength={120}
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
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            <option value="SEJOUR">{fr.annonceForm.typeSejour}</option>
            <option value="LOCATION">{fr.annonceForm.typeLocation}</option>
            <option value="VENTE">{fr.annonceForm.typeVente}</option>
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{priceLabel}</span>
          <input name="price" type="number" required min={10} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.ville}</span>
          <select
            name="city"
            required
            defaultValue="Tunis"
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
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.adresse}</span>
          <input name="address" type="text" maxLength={160} className={inputClass} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.surface}</span>
          <input name="surface" type="number" min={10} className={inputClass} />
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>{fr.annonceForm.pieces}</span>
          <input name="rooms" type="number" min={1} max={30} className={inputClass} />
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
              className={inputClass}
            />
          </label>
        ) : null}
      </div>

      <fieldset className="space-y-1.5">
        <legend className={labelClass}>
          {fr.annonceForm.coordonnees}{" "}
          <span className="font-normal text-ink/40">
            — {fr.annonceForm.coordonneesAide}
          </span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            name="latitude"
            type="number"
            step="0.0001"
            required
            value={coords.lat}
            onChange={(e) => setCoords((c) => ({ ...c, lat: e.target.value }))}
            aria-label={fr.annonceForm.latitude}
            className={inputClass}
          />
          <input
            name="longitude"
            type="number"
            step="0.0001"
            required
            value={coords.lng}
            onChange={(e) => setCoords((c) => ({ ...c, lng: e.target.value }))}
            aria-label={fr.annonceForm.longitude}
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className={labelClass}>{fr.annonceForm.equipements}</legend>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => (
            <label
              key={a}
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-darna/15 has-[:checked]:bg-darna has-[:checked]:text-white"
            >
              <input type="checkbox" name="amenities" value={a} className="sr-only" />
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
        disabled={pending}
        className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60 sm:w-auto sm:px-10"
      >
        {pending ? fr.common.chargement : fr.annonceForm.publier}
      </button>
    </form>
  );
}
