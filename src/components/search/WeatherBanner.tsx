import { getLocale, getT } from "@/lib/i18n/server";
import type { CityWeather, CityForecast, WeatherCondition } from "@/lib/weather";
import { SunIcon, CloudIcon, CloudRainIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/** Couleur de l'icône météo (soleil doré, nuage gris, pluie bleue). */
const ICON_COLOR: Record<WeatherCondition, string> = {
  clear: "#f4b740",
  clouds: "#9bb4c7",
  rain: "#4aa3e0",
};

function WeatherIcon({
  condition,
  size,
}: {
  condition: WeatherCondition;
  size: number;
}) {
  const style = { color: ICON_COLOR[condition] };
  if (condition === "clear") return <SunIcon width={size} height={size} style={style} />;
  if (condition === "rain") return <CloudRainIcon width={size} height={size} style={style} />;
  return <CloudIcon width={size} height={size} style={style} />;
}

/**
 * Bannière météo de la page séjours : grande, lumineuse (dégradé ciel → sable)
 * pour donner envie de partir. Affiche la météo ACTUELLE de la ville et, si des
 * dates sont recherchées, la PRÉVISION agrégée (min/max + tendance) sur la
 * période. Composant serveur (icônes SVG + i18n via getT) — aucune interaction.
 */
export async function WeatherBanner({
  city,
  current,
  forecast,
  arrivee,
  depart,
}: {
  city: string;
  current: CityWeather | null;
  forecast: CityForecast | null;
  arrivee?: string;
  depart?: string;
}) {
  if (!current && !forecast) return null;
  const fr = await getT();
  const locale = await getLocale();
  const intl = INTL_LOCALE[locale] ?? "fr-FR";

  const conditionLabel = (condition: WeatherCondition) =>
    condition === "clear"
      ? fr.destination.meteoClear
      : condition === "rain"
        ? fr.destination.meteoRain
        : fr.destination.meteoClouds;

  const fmtShort = (iso?: string) =>
    iso
      ? new Intl.DateTimeFormat(intl, { day: "numeric", month: "short" }).format(
          new Date(`${iso}T00:00:00`)
        )
      : "";
  const rangeLabel =
    arrivee && depart ? fr.booking.sejourDates(fmtShort(arrivee), fmtShort(depart)) : null;

  return (
    <div
      className="mt-5 flex flex-col gap-3 rounded-2xl p-3.5 ring-1 ring-darna/10 sm:flex-row sm:items-center sm:justify-between sm:p-4"
      style={{ background: "linear-gradient(110deg, #eaf4fb 0%, #fbf3e0 100%)" }}
    >
      {/* Météo actuelle */}
      {current ? (
        <div className="flex items-center gap-3">
          <WeatherIcon condition={current.condition} size={34} />
          <div>
            <p className="text-2xl font-bold leading-none text-darna">{current.tempC}°</p>
            <p className="mt-0.5 text-xs font-medium text-ink/65">
              {fr.destination.meteoActuelle} · {city} · {conditionLabel(current.condition)}
              {current.source === "seasonal" ? ` · ${fr.destination.meteoMoyenneSaison}` : ""}
            </p>
          </div>
        </div>
      ) : null}

      {/* Prévision sur la période recherchée */}
      {forecast && rangeLabel ? (
        <div className="rounded-xl bg-white/70 px-3.5 py-2.5 ring-1 ring-darna/10">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">
            {fr.destination.meteoSejour}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-base font-bold text-darna">
            <WeatherIcon condition={forecast.condition} size={18} />
            {forecast.tempMin}–{forecast.tempMax}°
            <span className="text-xs font-medium text-ink/55">
              {conditionLabel(forecast.condition)}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] text-ink/50">
            {rangeLabel}
            {forecast.source === "seasonal" ? ` · ${fr.destination.meteoMoyenneSaison}` : ""}
          </p>
        </div>
      ) : null}
    </div>
  );
}
