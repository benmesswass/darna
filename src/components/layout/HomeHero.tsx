"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { CityAutocomplete } from "@/components/search/CityAutocomplete";
import { SearchDateRange } from "@/components/search/SearchDateRange";
import {
  BuildingIcon,
  PalmIcon,
  SearchIcon,
  UsersIcon,
} from "@/components/icons";

type Mode = "sejours" | "immobilier";

type Stats = { verified: number; cities: number; reviews: number };

/**
 * Hero « double mode » de l'accueil (Version A : onglets segmentés). Les deux
 * verticales sont des PAIRS : l'onglet actif métamorphose la recherche, la
 * couleur d'ambiance et le message. Séjours = mer/sable ; Immobilier = blanc +
 * cobalt de Sidi Bou Saïd + frise. Respecte les feature flags (un seul onglet
 * si une verticale est désactivée). Aucune chaîne en dur (cf. useT).
 */
export function HomeHero({
  stayEnabled,
  immoEnabled,
  gouvernorats,
  popularCities,
  stats,
}: {
  stayEnabled: boolean;
  immoEnabled: boolean;
  gouvernorats: readonly string[];
  popularCities: string[];
  stats: Stats;
}) {
  const fr = useT();
  const [mode, setMode] = useState<Mode>(stayEnabled ? "sejours" : "immobilier");
  const isSej = mode === "sejours";
  const showTabs = stayEnabled && immoEnabled;

  // Palette d'ambiance par verticale (couleurs validées).
  const t = isSej
    ? {
        bg: "#17708a", // turquoise mer (même famille bleue que le header)
        text: "#ffffff",
        kicker: "#f2dcae", // sable clair
        accent: "#f4d9a0", // sable (chiffres) = combine sable + mer
        btnBg: "#e8b85e", // sable doré = pop plage
        btnText: "#3a2a08",
      }
    : {
        bg: "#f4f8fd", // blanc cassé
        text: "#10314f",
        kicker: "#15539e",
        accent: "#15539e", // cobalt Sidi Bou Saïd
        btnBg: "#15539e",
        btnText: "#ffffff",
      };

  const fieldStyle =
    "rounded-xl bg-white px-3 py-2.5 text-sm text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-current";
  const labelStyle = "mb-1 block text-xs font-semibold";

  function Tab({ m, icon, label, sub }: { m: Mode; icon: ReactNode; label: string; sub: string }) {
    const active = mode === m;
    return (
      <button
        type="button"
        onClick={() => setMode(m)}
        aria-pressed={active}
        className="flex flex-1 items-center gap-4 rounded-2xl border-2 px-6 py-5 text-start transition"
        style={
          active
            ? { background: t.btnBg, color: t.btnText, borderColor: t.btnBg }
            : {
                background: "transparent",
                color: t.text,
                borderColor: isSej ? "rgba(255,255,255,.3)" : "rgba(16,49,79,.25)",
              }
        }
      >
        <span style={{ fontSize: 0 }} aria-hidden>
          {icon}
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-bold">{label}</span>
          <span className="block text-sm opacity-80">{sub}</span>
        </span>
      </button>
    );
  }

  return (
    <section
      className="accent-transition relative overflow-hidden"
      style={{ background: t.bg, color: t.text }}
    >
      {/* Toile de fond photo — mêmes visuels que les catalogues (continuité de
          marque). Les deux sont empilées et se fondent (crossfade) selon
          l'onglet actif. */}
      <Image
        src="/images/sejours-hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={`object-cover transition-opacity duration-500 ${
          isSej ? "opacity-100" : "opacity-0"
        }`}
      />
      <Image
        src="/images/immobilier-hero.jpg"
        alt=""
        fill
        sizes="100vw"
        className={`object-cover transition-opacity duration-500 ${
          isSej ? "opacity-0" : "opacity-100"
        }`}
      />
      {/* Voile thématique : fort à gauche (lisibilité du texte) → plus clair à
          droite (la photo respire dans la zone sans texte). */}
      <div
        aria-hidden
        className="accent-transition absolute inset-0"
        style={{
          background: isSej
            ? "linear-gradient(100deg, rgba(13,22,30,.72) 0%, rgba(13,22,30,.52) 45%, rgba(13,22,30,.20) 100%)"
            : "linear-gradient(100deg, rgba(244,248,253,.96) 0%, rgba(244,248,253,.82) 42%, rgba(244,248,253,.45) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold" style={{ color: t.kicker }}>
          {fr.footer.baseline}
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {isSej ? fr.home.verticalSejoursTitle : fr.home.verticalImmobilierTitle}
        </h1>
        <p className="mt-3 max-w-xl text-base opacity-80">
          {isSej ? fr.home.verticalSejoursDesc : fr.home.verticalImmobilierDesc}
        </p>

        {/* Onglets de verticale (égalité de poids) — masqués si une seule active */}
        {showTabs ? (
          <div className="mt-7">
            <p className="mb-2 text-sm font-semibold" style={{ color: t.kicker }}>
              {fr.home.heroQuestion}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1.5">
                <Tab
                  m="sejours"
                  icon={<PalmIcon width={28} height={28} />}
                  label={fr.nav.sejours}
                  sub={fr.home.tabSejoursSub}
                />
                <p className="px-1 text-xs leading-snug opacity-65">
                  {fr.home.tabSejoursDesc}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Tab
                  m="immobilier"
                  icon={<BuildingIcon width={28} height={28} />}
                  label={fr.nav.immobilier}
                  sub={fr.home.tabImmoSub}
                />
                <p className="px-1 text-xs leading-snug opacity-65">
                  {fr.home.tabImmoDesc}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Recherche qui se métamorphose selon la verticale active */}
        <div className="mt-5 rounded-3xl bg-white/95 p-3 shadow-2xl shadow-black/10 sm:p-4">
          {isSej ? (
            <form method="GET" action="/sejours" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <label className="block">
                <span className={labelStyle} style={{ color: "#0c5f6e" }}>
                  {fr.search.ouAllezVous}
                </span>
                <CityAutocomplete
                  placeholder={fr.search.villePlaceholder}
                  inputClassName={`w-full ${fieldStyle}`}
                />
              </label>
              <SearchDateRange
                fieldClassName={`w-full ${fieldStyle}`}
                labelClassName="block"
                labelTextClassName={`${labelStyle} flex items-center gap-1`}
                labelStyle={{ color: "#0c5f6e" }}
              />
              <label className="block">
                <span className={`${labelStyle} flex items-center gap-1`} style={{ color: "#0c5f6e" }}>
                  <UsersIcon width={13} height={13} />
                  {fr.search.voyageurs}
                </span>
                <input type="number" name="voyageurs" min={1} max={20} className={`w-full ${fieldStyle}`} />
              </label>
              <button
                type="submit"
                className="flex items-center justify-center gap-2 self-end rounded-xl px-5 py-2.5 text-sm font-bold"
                style={{ background: t.btnBg, color: t.btnText }}
              >
                <SearchIcon width={16} height={16} />
                {fr.common.rechercher}
              </button>
            </form>
          ) : (
            <form method="GET" action="/immobilier" className="grid gap-3">
              <div className="flex w-fit rounded-full bg-cream p-1 ring-1 ring-black/5">
                <label className="cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold text-ink/70 has-[:checked]:bg-[#15539e] has-[:checked]:text-white">
                  <input type="radio" name="transaction" value="location" defaultChecked className="sr-only" />
                  {fr.search.louer}
                </label>
                <label className="cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold text-ink/70 has-[:checked]:bg-[#15539e] has-[:checked]:text-white">
                  <input type="radio" name="transaction" value="vente" className="sr-only" />
                  {fr.search.acheter}
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto]">
                <label className="block">
                  <span className={labelStyle} style={{ color: "#15539e" }}>
                    {fr.search.gouvernorat}
                  </span>
                  <select name="gouvernorat" defaultValue="" className={`w-full ${fieldStyle}`}>
                    <option value="">{fr.search.tousGouvernorats}</option>
                    {gouvernorats.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={labelStyle} style={{ color: "#15539e" }}>
                    {fr.search.prixMax} ({fr.common.tnd})
                  </span>
                  <input type="number" name="prixMax" min={0} step={50} className={`w-full ${fieldStyle}`} />
                </label>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 self-end rounded-xl px-5 py-2.5 text-sm font-bold"
                  style={{ background: t.btnBg, color: t.btnText }}
                >
                  <SearchIcon width={16} height={16} />
                  {fr.common.rechercher}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Destinations rapides (séjours uniquement) */}
        {isSej ? (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="opacity-60">{fr.home.villesPopulaires}</span>
            {popularCities.map((city) => (
              <Link
                key={city}
                href={`/sejours?ville=${encodeURIComponent(city)}`}
                className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1 font-medium transition hover:border-sand hover:bg-sand hover:text-darna-dark"
              >
                {city}
              </Link>
            ))}
          </div>
        ) : null}

        {/* Preuves chiffrées, calculées en direct */}
        <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-4 border-t pt-6" style={{ borderColor: isSej ? "rgba(255,255,255,.12)" : "rgba(16,49,79,.12)" }}>
          {[
            { value: stats.verified, label: fr.home.statsAnnoncesVerifiees },
            { value: stats.cities, label: fr.home.statsVilles },
            { value: stats.reviews, label: fr.home.statsAvis },
          ].map(({ value, label }) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-3xl font-bold sm:text-4xl" style={{ color: t.accent }}>
                {value}
              </dd>
              <dd className="mt-1 text-xs leading-snug opacity-60 sm:text-sm">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
