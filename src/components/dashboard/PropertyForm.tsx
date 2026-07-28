"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import {
  createPropertyAction,
  updatePropertyAction,
  type PropertyFormState,
} from "@/actions/properties";
import { useT } from "@/components/i18n/LocaleProvider";
import { PhotoDropzone } from "./PhotoDropzone";
import { generateDescription } from "@/lib/description";
import {
  AMENITIES,
  CANCEL_POLICIES,
  PROPERTY_TYPES,
  STAY_KINDS,
  type PropertyType,
} from "@/lib/constants";
import { CITIES, getCity, nearestCity, resolveCity } from "@/lib/geo";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { LocationPicker } from "@/components/map/LocationPicker";
import type { AddressSuggestion } from "@/actions/geocode";
import {
  SparklesIcon,
  MapPinIcon,
  RulerIcon,
  DoorIcon,
  UsersIcon,
  CloseIcon,
  ShieldIcon,
} from "@/components/icons";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none transition-all duration-200 focus:border-darna focus:ring-4 focus:ring-darna/10 disabled:opacity-60";
const labelClass = "text-sm font-semibold text-body/70";

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
  stayKind: string | null;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
  cancelPolicy: string;
  cashPaymentEnabled: boolean;
};

/** Formulaire d'annonce — création (sans `initial`) ou modification (avec). */
export function PropertyForm({
  initial,
  // Types proposés à la création : restreints aux verticales activées (cf.
  // src/lib/modes.ts), calculés côté serveur par la page. Défaut : tous.
  allowedTypes = [...PROPERTY_TYPES],
  // Préremplissage depuis le simulateur de revenus public (GROWTH_ROADMAP.md
  // §G1, ?ville=&type=) — jamais utilisé en édition (initial prime toujours).
  defaultCity,
  defaultType,
}: {
  initial?: PropertyFormInitial;
  allowedTypes?: PropertyType[];
  defaultCity?: string;
  defaultType?: PropertyType;
}) {
  const fr = useT();
  const isEdit = Boolean(initial);
  const [state, action, pending] = useActionState<PropertyFormState, FormData>(
    isEdit ? updatePropertyAction : createPropertyAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<string>(
    initial?.type ??
      (defaultType && allowedTypes.includes(defaultType) ? defaultType : undefined) ??
      allowedTypes[0] ??
      "SEJOUR"
  );
  const [cityName, setCityName] = useState(initial?.city ?? defaultCity ?? "Tunis");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initial?.latitude ?? 36.8065,
    lng: initial?.longitude ?? 10.1815,
  });
  const [description, setDescription] = useState(initial?.description ?? "");
  // Vide à la création : l'hôte DOIT choisir (champ essentiel). En édition,
  // on préremplit avec la politique déjà enregistrée.
  const [cancelPolicy, setCancelPolicy] = useState(initial?.cancelPolicy ?? "");
  // Idem pour le type de bien séjour (F5 roadmap).
  const [stayKind, setStayKind] = useState(initial?.stayKind ?? "");
  // Paiement sur place (Rail 2, PAIEMENT_SUR_PLACE_ROADMAP.md §PSP2). L'acceptation
  // des CGU hôte n'est redemandée que si ce n'était pas déjà activé au chargement
  // (le serveur ne pose l'horodatage QUE sur la transition false → true de toute
  // façon — cf. resolveCashPayment — ceci n'est qu'un confort d'affichage).
  const wasCashPaymentEnabled = initial?.cashPaymentEnabled ?? false;
  const [cashPaymentEnabled, setCashPaymentEnabled] = useState(wasCashPaymentEnabled);
  const [cashTermsAccepted, setCashTermsAccepted] = useState(false);
  // URLs d'aperçu des photos sélectionnées (création), dans l'ordre choisi.
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  // Instantané des champs au moment d'ouvrir l'aperçu (null = aperçu fermé).
  const [preview, setPreview] = useState<{
    title: string;
    price: number;
    surface: number | null;
    rooms: number | null;
    maxGuests: number | null;
    amenities: string[];
  } | null>(null);

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

  /** Valide le formulaire puis ouvre l'aperçu avant publication (création). */
  function openPreview() {
    const form = formRef.current;
    if (!form || !form.reportValidity()) return; // déclenche la validation native
    const data = new FormData(form);
    setPreview({
      title: String(data.get("title") ?? "").trim(),
      price: Number(data.get("price")) || 0,
      surface: Number(data.get("surface")) || null,
      rooms: Number(data.get("rooms")) || null,
      maxGuests: Number(data.get("maxGuests")) || null,
      amenities: data.getAll("amenities").map(String),
    });
  }

  // Libellés d'affichage pour l'aperçu.
  const typeLabel =
    type === "SEJOUR"
      ? fr.annonceForm.typeSejour
      : type === "LOCATION"
        ? fr.annonceForm.typeLocation
        : fr.annonceForm.typeVente;
  const priceSuffix =
    type === "SEJOUR" ? fr.common.parNuit : type === "LOCATION" ? fr.common.parMois : "";
  const gouvernorat = getCity(cityName)?.gouvernorat;

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
          <PhotoDropzone onPhotosChange={setPhotoUrls} />
        </div>
      ) : null}

      <label className="block space-y-1.5">
        <span className={labelClass}>
          {fr.annonceForm.titre} <span className="text-red-600">*</span>
        </span>
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
            {allowedTypes.includes("SEJOUR") ? (
              <option value="SEJOUR">{fr.annonceForm.typeSejour}</option>
            ) : null}
            {allowedTypes.includes("LOCATION") ? (
              <option value="LOCATION">{fr.annonceForm.typeLocation}</option>
            ) : null}
            {allowedTypes.includes("VENTE") ? (
              <option value="VENTE">{fr.annonceForm.typeVente}</option>
            ) : null}
          </select>
          {isEdit ? (
            <span className="block text-xs text-body/40">
              {fr.annonceForm.typeNonModifiable}
            </span>
          ) : null}
        </label>
        <label className="block space-y-1.5">
          <span className={labelClass}>
            {priceLabel} <span className="text-red-600">*</span>
          </span>
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
          <span className={labelClass}>
            {fr.annonceForm.ville} <span className="text-red-600">*</span>
          </span>
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
            <span className={labelClass}>
              {fr.annonceForm.capacite} <span className="text-red-600">*</span>
            </span>
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

      {type === "SEJOUR" ? (
        <fieldset className="space-y-2">
          <legend className={labelClass}>
            {fr.annonceForm.typeBien} <span className="text-red-600">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {STAY_KINDS.map((k) => (
              <label
                key={k}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm ring-1 ring-darna/15 has-[:checked]:bg-darna has-[:checked]:text-white"
              >
                <input
                  type="radio"
                  name="stayKind"
                  value={k}
                  required
                  checked={stayKind === k}
                  onChange={(e) => setStayKind(e.target.value)}
                  className="sr-only"
                />
                {k}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {type === "SEJOUR" ? (
        <fieldset className="space-y-3 rounded-2xl bg-cream/50 p-4 ring-1 ring-darna/15">
          <p className="flex items-center gap-1.5 text-sm font-bold text-heading">
            <ShieldIcon width={16} height={16} />
            {fr.annonceForm.politiqueAnnulation}
            <span className="text-red-600">*</span>
          </p>
          <p className="text-xs leading-relaxed text-body/55">
            {fr.annonceForm.politiqueAnnulationAide}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {CANCEL_POLICIES.map((p) => {
              const selected = cancelPolicy === p;
              return (
                <label
                  key={p}
                  className={`flex cursor-pointer flex-col gap-1 rounded-xl border bg-surface p-3.5 transition ${
                    selected
                      ? "border-darna ring-2 ring-darna/30"
                      : "border-darna/15 hover:border-darna/40"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cancelPolicy"
                      value={p}
                      required
                      checked={selected}
                      onChange={(e) => setCancelPolicy(e.target.value)}
                      className="h-4 w-4 accent-darna"
                    />
                    <span className="text-sm font-bold text-body">
                      {fr.property.cancelPolicy[p]}
                    </span>
                  </span>
                  <span className="ps-6 text-xs leading-relaxed text-body/60">
                    {fr.property.cancelPolicyDesc[p]}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {type === "SEJOUR" ? (
        <fieldset className="space-y-3 rounded-2xl bg-cream/50 p-4 ring-1 ring-darna/15">
          {!wasCashPaymentEnabled ? (
            <div className="rounded-xl bg-surface p-3.5 ring-1 ring-darna/10">
              <p className="text-xs font-bold text-heading">
                {fr.annonceForm.cashPaymentExplicationTitre}
              </p>
              <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                {[
                  [fr.annonceForm.cashPaymentBloc1Titre, fr.annonceForm.cashPaymentBloc1Desc],
                  [fr.annonceForm.cashPaymentBloc2Titre, fr.annonceForm.cashPaymentBloc2Desc],
                  [fr.annonceForm.cashPaymentBloc3Titre, fr.annonceForm.cashPaymentBloc3Desc],
                  [fr.annonceForm.cashPaymentBloc4Titre, fr.annonceForm.cashPaymentBloc4Desc],
                ].map(([titre, desc], i) => (
                  <div key={i} className="rounded-lg bg-cream/70 p-2.5">
                    <p className="text-xs font-semibold text-heading">{titre}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-body/60">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              name="cashPaymentEnabled"
              value="true"
              checked={cashPaymentEnabled}
              onChange={(e) => setCashPaymentEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-darna"
            />
            <span>
              <span className="block text-sm font-bold text-heading">
                {fr.annonceForm.cashPaymentTitre}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-body/55">
                {fr.annonceForm.cashPaymentAide}
              </span>
            </span>
          </label>
          {cashPaymentEnabled && !wasCashPaymentEnabled ? (
            <label className="ms-6 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                name="cashTermsAccepted"
                value="true"
                required
                checked={cashTermsAccepted}
                onChange={(e) => setCashTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-darna"
              />
              <span className="text-xs text-body/70">
                {fr.annonceForm.cashTermsPrefix}{" "}
                <Link
                  href="/cgu-hote"
                  target="_blank"
                  className="font-semibold text-darna underline hover:text-darna-light"
                >
                  {fr.pagesLegales.cguHoteTitre}
                </Link>
              </span>
            </label>
          ) : null}
        </fieldset>
      ) : null}

      <fieldset className="space-y-1.5">
        <legend className={labelClass}>
          {fr.annonceForm.localisation}{" "}
          <span className="font-normal text-body/40">
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
              className="flex cursor-pointer items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-sm ring-1 ring-darna/15 has-[:checked]:bg-darna has-[:checked]:text-white"
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
          <span className={labelClass}>
            {fr.annonceForm.description} <span className="text-red-600">*</span>
          </span>
          <button
            type="button"
            onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-full bg-darna/10 px-3.5 py-1.5 text-xs font-bold text-heading transition hover:bg-darna hover:text-white"
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
        <p className="text-xs text-body/40">{fr.annonceForm.genererDescriptionAide}</p>
      </div>

      {isEdit ? (
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {pending ? fr.common.chargement : fr.annonceForm.enregistrerModifs}
        </button>
      ) : (
        <>
          {/* En création : on passe par un aperçu avant la publication réelle. */}
          <button
            type="button"
            onClick={openPreview}
            disabled={photoUrls.length === 0}
            className="w-full rounded-xl bg-darna px-5 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-10"
          >
            {fr.annonceForm.apercuPublier}
          </button>
          {photoUrls.length === 0 ? (
            <p className="text-xs font-medium text-body/50">{fr.annonceForm.photoRequise}</p>
          ) : null}
        </>
      )}

      {/* Aperçu avant publication : tel que l'annonce apparaîtra aux voyageurs. */}
      {preview ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={fr.annonceForm.apercuTitre}
          // z très élevé : la carte Leaflet pose ses panes/contrôles jusqu'à
          // ~z-1000 dans le contexte d'empilement racine — il faut passer au-dessus.
          className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-surface shadow-xl">
            <div className="flex items-start justify-between gap-3 border-b border-darna/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-bold text-heading">{fr.annonceForm.apercuTitre}</h3>
                <p className="mt-0.5 text-xs text-body/55">{fr.annonceForm.apercuAide}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                aria-label={fr.common.annuler}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-body/60 transition hover:bg-cream hover:text-heading"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Galerie */}
              {photoUrls.length > 0 ? (
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-darna/10">
                    <Image
                      src={photoUrls[0]}
                      alt={preview.title}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, 640px"
                      className="object-cover"
                    />
                    <span className="absolute start-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-heading">
                      {typeLabel}
                    </span>
                  </div>
                  {photoUrls.length > 1 ? (
                    <div className="mt-2 grid grid-cols-5 gap-2">
                      {photoUrls.slice(1).map((url) => (
                        <div
                          key={url}
                          className="relative aspect-square overflow-hidden rounded-lg bg-darna/10"
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            unoptimized
                            sizes="120px"
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* Titre + localisation */}
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-body">{preview.title}</h4>
                <p className="flex items-center gap-1 text-sm text-body/60">
                  <MapPinIcon width={15} height={15} />
                  {cityName}
                  {gouvernorat ? `, ${gouvernorat}` : ""}
                </p>
                {address ? <p className="text-sm text-body/50">{address}</p> : null}
              </div>

              {/* Caractéristiques */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-body/60">
                {preview.surface ? (
                  <span className="flex items-center gap-1.5">
                    <RulerIcon width={15} height={15} />
                    {fr.property.surface(preview.surface)}
                  </span>
                ) : null}
                {preview.rooms ? (
                  <span className="flex items-center gap-1.5">
                    <DoorIcon width={15} height={15} />
                    {fr.property.pieces(preview.rooms)}
                  </span>
                ) : null}
                {type === "SEJOUR" && preview.maxGuests ? (
                  <span className="flex items-center gap-1.5">
                    <UsersIcon width={15} height={15} />
                    {fr.property.capacite(preview.maxGuests)}
                  </span>
                ) : null}
              </div>

              {/* Prix */}
              <p className="text-2xl font-bold text-heading">
                {preview.price.toLocaleString("fr-FR")} TND
                {priceSuffix ? (
                  <span className="ms-1 text-sm font-medium text-body/55">{priceSuffix}</span>
                ) : null}
              </p>

              {/* Équipements */}
              {preview.amenities.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-body/70">
                    {fr.annonceForm.equipements}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {preview.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-full bg-cream px-3 py-1 text-xs font-medium text-body ring-1 ring-darna/10"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Description */}
              <p className="whitespace-pre-line text-sm leading-relaxed text-body/75">
                {description}
              </p>
            </div>

            <div className="space-y-3 border-t border-darna/10 px-6 py-4">
              {state?.error ? (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
                >
                  {state.error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-xl px-5 py-3 text-sm font-bold text-body/70 transition hover:bg-cream"
                >
                  {fr.annonceForm.continuerEdition}
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-xl bg-darna px-6 py-3 text-sm font-bold text-white transition hover:bg-darna-light disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? fr.common.chargement : fr.annonceForm.confirmerPublier}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
