import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import {
  searchSejours,
  type SejoursSearchParams,
} from "@/lib/listings";
import { markerPriceLabel } from "@/lib/format";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyMap } from "@/components/map/PropertyMap";
import { SplitView } from "@/components/search/SplitView";
import { CityAutocomplete } from "@/components/search/CityAutocomplete";
import { CalendarIcon, SearchIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: frMeta.nav.sejours,
  description: frMeta.home.verticalSejoursDesc,
};

export default async function SejoursPage({
  searchParams,
}: {
  searchParams: Promise<SejoursSearchParams>;
}) {
  const fr = await getT();
  const params = await searchParams;
  const { results, resolvedCity, unknownCity } = await searchSejours(params);

  const markers = results.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    priceLabel: markerPriceLabel(p.price, p.type),
    verified: p.verified,
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-bold text-darna">{fr.nav.sejours}</h1>

      {/* Barre de recherche ville + dates + voyageurs — collante au scroll */}
      <form
        method="GET"
        className="mt-5 grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-darna/10 sm:grid-cols-2 lg:sticky lg:top-[4.5rem] lg:z-[1040] lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:shadow-md"
      >
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink/60">
            {fr.search.ouAllezVous}
          </span>
          <CityAutocomplete
            defaultValue={params.ville ?? ""}
            placeholder={fr.search.villePlaceholder}
            inputClassName="w-full rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <CalendarIcon width={13} height={13} />
            {fr.search.arrivee}
          </span>
          <input
            type="date"
            name="arrivee"
            defaultValue={params.arrivee ?? ""}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
            <CalendarIcon width={13} height={13} />
            {fr.search.depart}
          </span>
          <input
            type="date"
            name="depart"
            defaultValue={params.depart ?? ""}
            className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-ink/60">
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
      </form>

      <div className="mt-4 flex items-center gap-2 text-sm text-ink/60">
        <span className="font-semibold text-darna">
          {fr.search.resultats(results.length)}
        </span>
        {resolvedCity ? (
          <span className="rounded-full bg-darna/10 px-2.5 py-0.5 text-xs font-medium text-darna">
            {resolvedCity}
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        {results.length === 0 ? (
          <EmptyState unknownCity={unknownCity} query={params.ville} />
        ) : (
          <SplitView
            list={
              <div className="grid gap-5 sm:grid-cols-2">
                {results.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            }
            map={<PropertyMap markers={markers} />}
          />
        )}
      </div>
    </div>
  );
}

async function EmptyState({ unknownCity, query }: { unknownCity: boolean; query?: string }) {
  const fr = await getT();
  return (
    <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-darna/10">
      <p className="text-lg font-semibold text-darna">
        {fr.search.aucunResultatTitre}
        {unknownCity && query ? ` — « ${query} »` : ""}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
        {fr.search.aucunResultatDesc}
      </p>
    </div>
  );
}
