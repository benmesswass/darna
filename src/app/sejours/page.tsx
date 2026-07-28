import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { stayEnabled } from "@/lib/modes";
import {
  searchSejours,
  toMapMarkers,
  type SejoursSearchParams,
  type ListingWithPhoto,
} from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyMap } from "@/components/map/PropertyMap";
import { SplitView } from "@/components/search/SplitView";
import { Pagination } from "@/components/search/Pagination";
import { CityAutocomplete } from "@/components/search/CityAutocomplete";
import { SearchDateRange } from "@/components/search/SearchDateRange";
import { SortSelect } from "@/components/search/SortSelect";
import { AutoSubmitCheckbox } from "@/components/search/AutoSubmitCheckbox";
import { PriceRangeFilter } from "@/components/search/PriceRangeFilter";
import { AmenitiesFilter } from "@/components/search/AmenitiesFilter";
import { SaveSearchButton } from "@/components/search/SaveSearchButton";
import { parseAmenitiesParam, STAY_KINDS } from "@/lib/constants";
import { SectionHero } from "@/components/layout/SectionHero";
import { getCityWeather, getCityForecast } from "@/lib/weather";
import { WeatherBanner } from "@/components/search/WeatherBanner";
import { SearchIcon, UsersIcon } from "@/components/icons";
import { AnimatedGrid } from "@/components/ui/AnimatedGrid";

export const metadata: Metadata = {
  title: frMeta.nav.sejours,
  description: frMeta.home.verticalSejoursDesc,
};

export default async function SejoursPage({
  searchParams,
}: {
  searchParams: Promise<SejoursSearchParams>;
}) {
  // Verticale Séjours désactivée par config → la route n'existe pas (404).
  if (!stayEnabled()) notFound();

  const fr = await getT();
  const params = await searchParams;
  const { results, resolvedCity, unknownCity, total, page, pageSize, sort, suggestions } =
    await searchSejours(params);
  const sessionUser = await getSessionUser();
  const favCtx = await getFavoriteContext(sessionUser?.id);
  // Météo de la ville recherchée : actuelle + prévision sur la période demandée
  // (live Open-Meteo si activé, sinon repli saisonnier — toujours une valeur).
  const [weather, forecast] = resolvedCity
    ? await Promise.all([
        getCityWeather(resolvedCity),
        params.arrivee ? getCityForecast(resolvedCity, params.arrivee, params.depart) : null,
      ])
    : [null, null];

  // CTA « devenir hôte » : connecté (quel que soit son rôle) → droit au
  // formulaire, dont la garde redirige un VOYAGEUR vers /dashboard/devenir-hote
  // (§L8.1, rôle non choisi à l'inscription) ; sinon inscription puis retour
  // ici après connexion (callbackUrl).
  const newListingPath = "/dashboard/annonces/nouvelle";
  const hostCtaHref = sessionUser
    ? newListingPath
    : `/inscription?callbackUrl=${encodeURIComponent(newListingPath)}`;

  // Dates recherchées propagées : nom de dossier par défaut = mois d'ARRIVÉE
  // (pas le mois courant), et transmission des dates au lien de la fiche détail.
  const dateQuery = (() => {
    const qs = new URLSearchParams();
    if (params.arrivee) qs.set("arrivee", params.arrivee);
    if (params.depart) qs.set("depart", params.depart);
    const s = qs.toString();
    return s ? `?${s}` : "";
  })();

  const markers = toMapMarkers(results);

  // Nombre de nuits recherché (dates valides) → affiché en coût total par carte.
  const nightsSearched = (() => {
    if (!params.arrivee || !params.depart) return 0;
    const ci = Date.parse(`${params.arrivee}T00:00:00.000Z`);
    const co = Date.parse(`${params.depart}T00:00:00.000Z`);
    if (Number.isNaN(ci) || Number.isNaN(co)) return 0;
    const n = Math.round((co - ci) / 86_400_000);
    return n > 0 ? n : 0;
  })();

  // Élargissement : annonces des villes proches/populaires à afficher quand la
  // ville cherchée est vide (suggestions non-null ⇒ il y a toujours ≥1 annonce).
  const suggestionListings = results.length === 0 && suggestions ? suggestions.listings : [];
  const showSuggestions = suggestionListings.length > 0;
  const suggestionMarkers = toMapMarkers(suggestionListings);

  // Lien d'élargissement : garde dates + voyageurs, change la ville, page 1.
  const suggestionHref = (city: string) => {
    const qs = new URLSearchParams();
    qs.set("ville", city);
    if (params.arrivee) qs.set("arrivee", params.arrivee);
    if (params.depart) qs.set("depart", params.depart);
    if (params.voyageurs) qs.set("voyageurs", params.voyageurs);
    return `/sejours?${qs.toString()}`;
  };

  const listingGrid = (items: ListingWithPhoto[]) => (
    <AnimatedGrid
      key={items.map((p) => p.id).join(",")}
      className="grid gap-5 sm:grid-cols-2"
    >
      {items.map((p) => (
        <PropertyCard
          key={p.id}
          property={p}
          favorite={favoritePropFor(favCtx, p.id, params.arrivee)}
          query={dateQuery}
          nights={nightsSearched || undefined}
        />
      ))}
    </AnimatedGrid>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionHero
        variant="sejours"
        title={fr.nav.sejours}
        description={fr.home.verticalSejoursDesc}
        siteName={fr.meta.siteName}
        imageSrc="/images/sejours-hero.jpg"
        // Cadrage de la photo : "center" | "top" | "bottom" | "center 30%"…
        imagePosition="center 60%"
      />

      {/* Barre de recherche ville + dates + voyageurs — flotte sur le bas du
          hero (chevauchement) puis colle au scroll. */}
      <form
        method="GET"
        className="relative -mt-8 rounded-3xl bg-surface p-4 shadow-lg ring-1 ring-darna/10 sm:-mt-12 lg:z-[1040]"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">
            {fr.search.ouAllezVous}
          </span>
          <CityAutocomplete
            defaultValue={params.ville ?? ""}
            placeholder={fr.search.villePlaceholder}
            inputClassName="w-full rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <SearchDateRange
          defaultCheckIn={params.arrivee}
          defaultCheckOut={params.depart}
          fieldClassName="w-full rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
        />
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-muted">
            <UsersIcon width={13} height={13} />
            {fr.search.voyageurs}
          </span>
          <input
            type="number"
            name="voyageurs"
            min={1}
            max={20}
            defaultValue={params.voyageurs ?? ""}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 self-end rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-darna-light"
        >
          <SearchIcon width={16} height={16} />
          {fr.common.rechercher}
        </button>
        </div>

        {/* Filtres avancés sur UNE ligne : prix (min–max fusionnés dans un seul
            champ) + cases de confiance (re-soumission auto au changement). */}
        <div className="mt-3 flex flex-wrap items-start gap-x-5 gap-y-3">
          <PriceRangeFilter
            defaultMin={params.prixMin}
            defaultMax={params.prixMax}
            defaultArrivee={params.arrivee}
            defaultDepart={params.depart}
          />
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">
              {fr.search.chambresMin}
            </span>
            <select
              name="chambres"
              defaultValue={params.chambres ?? ""}
              className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            >
              <option value="">{fr.search.indifferent}</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}+
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted">
              {fr.search.typeBien}
            </span>
            <select
              name="typeBien"
              defaultValue={params.typeBien ?? ""}
              className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            >
              <option value="">{fr.search.indifferent}</option>
              {STAY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <AutoSubmitCheckbox
            name="verifie"
            label={fr.badges.verifieRemote}
            defaultChecked={params.verifie === "1"}
          />
          <AutoSubmitCheckbox
            name="certifie"
            label={fr.badges.verifieOnSite}
            defaultChecked={params.certifie === "1"}
          />
          <AmenitiesFilter selected={parseAmenitiesParam(params.equipements)} />
        </div>
      </form>

      {resolvedCity && weather ? (
        <WeatherBanner
          city={resolvedCity}
          current={weather}
          forecast={forecast}
          arrivee={params.arrivee}
          depart={params.depart}
        />
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-heading">
            {fr.search.resultats(total)}
          </span>
          {resolvedCity ? (
            <span className="rounded-full bg-darna/10 px-2.5 py-0.5 text-xs font-medium text-heading">
              {resolvedCity}
            </span>
          ) : null}
          {resolvedCity && sessionUser ? (
            <SaveSearchButton
              ville={resolvedCity}
              prixMin={params.prixMin}
              prixMax={params.prixMax}
            />
          ) : null}
        </div>
        {results.length > 0 ? (
          <SortSelect basePath="/sejours" params={params} value={sort} />
        ) : null}
      </div>

      <div className="mt-4">
        {results.length > 0 ? (
          <SplitView list={listingGrid(results)} map={<PropertyMap markers={markers} />} />
        ) : showSuggestions && suggestions ? (
          <div className="space-y-5">
            {/* Bandeau d'élargissement : on transforme le cul-de-sac en rebond
                en montrant directement des annonces proches. Le CTA hôte est
                intégré ICI (haut de zone, visible sans scroller) plutôt qu'en
                bas sous les cartes. */}
            <div className="rounded-2xl bg-darna/5 p-4 ring-1 ring-darna/10">
              <p className="text-base font-semibold text-heading">
                {resolvedCity
                  ? fr.search.aucuneAnnonceVille(resolvedCity)
                  : fr.search.aucunResultatTitre}
              </p>
              <p className="mt-1 text-sm text-body/70">
                {suggestions.kind === "nearby"
                  ? fr.search.elargiProximiteIntro
                  : fr.search.elargirPopulaire}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.cities.map((s) => (
                  <Link
                    key={s.city}
                    href={suggestionHref(s.city)}
                    className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-heading ring-1 ring-darna/15 transition hover:bg-darna hover:text-white"
                  >
                    {fr.search.voirToutVille(s.city, s.count)}
                  </Link>
                ))}
              </div>
              {resolvedCity ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-darna/10 pt-3 text-sm">
                  <span className="text-body/70">{fr.search.hoteAbsentTitre(resolvedCity)}</span>
                  <Link
                    href={hostCtaHref}
                    className="inline-flex items-center gap-1 font-semibold text-heading hover:underline"
                  >
                    {fr.search.hoteCtaBouton}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              ) : null}
            </div>
            <SplitView
              list={listingGrid(suggestionListings)}
              map={<PropertyMap markers={suggestionMarkers} />}
            />
          </div>
        ) : (
          <EmptyState
            unknownCity={unknownCity}
            query={params.ville}
            resolvedCity={resolvedCity}
            hostCtaHref={hostCtaHref}
          />
        )}
      </div>

      {results.length > 0 ? (
        <Pagination
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/sejours"
          params={params}
        />
      ) : null}
    </div>
  );
}

async function EmptyState({
  unknownCity,
  query,
  resolvedCity,
  hostCtaHref,
}: {
  unknownCity: boolean;
  query?: string;
  resolvedCity: string | null;
  hostCtaHref: string;
}) {
  const fr = await getT();
  return (
    <div className="rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
      <p className="text-lg font-semibold text-heading">
        {resolvedCity
          ? fr.search.aucuneAnnonceVille(resolvedCity)
          : `${fr.search.aucunResultatTitre}${unknownCity && query ? ` — « ${query} »` : ""}`}
      </p>
      {resolvedCity ? (
        <>
          {/* Ville connue mais vide partout : pas de cartes à montrer, donc
              l'amorçage de l'offre devient l'action principale, bien visible. */}
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            {fr.search.hoteAbsentDesc(resolvedCity)}
          </p>
          <Link
            href={hostCtaHref}
            className="mt-4 inline-flex items-center justify-center rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-darna-light"
          >
            {fr.search.hoteCtaBouton}
          </Link>
        </>
      ) : (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          {fr.search.aucunResultatDesc}
        </p>
      )}
    </div>
  );
}
