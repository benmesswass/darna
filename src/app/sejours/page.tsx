import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { stayEnabled } from "@/lib/modes";
import {
  searchSejours,
  toMapMarkers,
  type SejoursSearchParams,
} from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyMap } from "@/components/map/PropertyMap";
import { SplitView } from "@/components/search/SplitView";
import { Pagination } from "@/components/search/Pagination";
import { CityAutocomplete } from "@/components/search/CityAutocomplete";
import { SearchDateRange } from "@/components/search/SearchDateRange";
import { SectionHero } from "@/components/layout/SectionHero";
import { SearchIcon, UsersIcon } from "@/components/icons";

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
  const { results, resolvedCity, unknownCity, total, page, pageSize } =
    await searchSejours(params);
  const favCtx = await getFavoriteContext((await getSessionUser())?.id);

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
        className="relative -mt-8 grid gap-3 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-darna/10 sm:-mt-12 sm:grid-cols-2 lg:sticky lg:top-[4.5rem] lg:z-[1040] lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
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
        <SearchDateRange
          defaultCheckIn={params.arrivee}
          defaultCheckOut={params.depart}
          fieldClassName="w-full rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
        />
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
          {fr.search.resultats(total)}
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
                  <PropertyCard
                    key={p.id}
                    property={p}
                    favorite={favoritePropFor(favCtx, p.id, params.arrivee)}
                    query={dateQuery}
                  />
                ))}
              </div>
            }
            map={<PropertyMap markers={markers} />}
          />
        )}
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        basePath="/sejours"
        params={params}
      />
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
