import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { immoEnabled } from "@/lib/modes";
import { GOUVERNORATS } from "@/lib/geo";
import {
  searchImmobilier,
  toMapMarkers,
  type ImmobilierSearchParams,
} from "@/lib/listings";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext, favoritePropFor } from "@/lib/favorites";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyMap } from "@/components/map/PropertyMap";
import { SplitView } from "@/components/search/SplitView";
import { Pagination } from "@/components/search/Pagination";
import { SortSelect } from "@/components/search/SortSelect";
import { AutoSubmitCheckbox } from "@/components/search/AutoSubmitCheckbox";
import { SectionHero } from "@/components/layout/SectionHero";
import { GouvernoratAutocomplete } from "@/components/search/GouvernoratAutocomplete";
import { SearchIcon } from "@/components/icons";
import { AnimatedGrid } from "@/components/ui/AnimatedGrid";

export const metadata: Metadata = {
  title: frMeta.nav.immobilier,
  description: frMeta.home.verticalImmobilierDesc,
};

export default async function ImmobilierPage({
  searchParams,
}: {
  searchParams: Promise<ImmobilierSearchParams>;
}) {
  // Verticale Immo désactivée par config → la route n'existe pas (404).
  if (!immoEnabled()) notFound();

  const fr = await getT();
  const params = await searchParams;
  const { results, transaction, total, page, pageSize, sort } =
    await searchImmobilier(params);
  const favCtx = await getFavoriteContext((await getSessionUser())?.id);

  const markers = toMapMarkers(results);

  const isVente = transaction === "VENTE";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <SectionHero
        variant="immobilier"
        title={fr.nav.immobilier}
        description={fr.home.verticalImmobilierDesc}
        siteName={fr.meta.siteName}
        imageSrc="/images/immobilier-hero.jpg"
        // Cadrage de la photo : "center" | "top" | "bottom" | "center 30%"…
        imagePosition="center 40%"
      />

      {/* Barre de recherche — flotte sur le bas du hero puis colle au scroll. */}
      <form
        method="GET"
        className="relative -mt-8 rounded-3xl bg-white p-4 shadow-lg ring-1 ring-darna/10 sm:-mt-12 lg:z-[1040]"
      >
        {/* Onglets Louer / Acheter */}
        <div className="flex w-fit rounded-full bg-cream p-1 ring-1 ring-darna/10">
          <label
            className={`cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold ${
              !isVente ? "bg-darna text-white" : "text-ink/60"
            }`}
          >
            <input
              type="radio"
              name="transaction"
              value="location"
              defaultChecked={!isVente}
              className="sr-only"
            />
            {fr.search.louer}
          </label>
          <label
            className={`cursor-pointer rounded-full px-5 py-1.5 text-sm font-semibold ${
              isVente ? "bg-darna text-white" : "text-ink/60"
            }`}
          >
            <input
              type="radio"
              name="transaction"
              value="vente"
              defaultChecked={isVente}
              className="sr-only"
            />
            {fr.search.acheter}
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              {fr.search.gouvernorat}
            </span>
            <GouvernoratAutocomplete
              options={GOUVERNORATS}
              defaultValue={params.gouvernorat ?? ""}
              placeholder={fr.search.tousGouvernorats}
              inputClassName="w-full rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              {fr.search.prixMin} ({fr.common.tnd})
            </span>
            <input
              type="number"
              name="prixMin"
              min={0}
              step={isVente ? 10000 : 50}
              defaultValue={params.prixMin ?? ""}
              className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              {fr.search.prixMax} ({fr.common.tnd})
            </span>
            <input
              type="number"
              name="prixMax"
              min={0}
              step={isVente ? 10000 : 50}
              defaultValue={params.prixMax ?? ""}
              className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              {fr.search.surfaceMin}
            </span>
            <input
              type="number"
              name="surfaceMin"
              min={0}
              defaultValue={params.surfaceMin ?? ""}
              className="rounded-xl border border-darna/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-darna"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              {fr.search.piecesMin}
            </span>
            <select
              name="pieces"
              defaultValue={params.pieces ?? ""}
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
          <button
            type="submit"
            className="flex items-center justify-center gap-2 self-end rounded-xl bg-darna px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-darna-light"
          >
            <SearchIcon width={16} height={16} />
            {fr.common.rechercher}
          </button>
        </div>

        {/* Filtre confiance : niveau de vérification (cases indépendantes,
            re-soumission auto au changement). */}
        <div className="mt-3 flex flex-wrap items-center gap-4">
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
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-darna">
          {fr.search.resultats(total)}
        </span>
        {results.length > 0 ? (
          // L'immo n'a jamais d'avis (un avis exige une réservation) → pas de
          // tri par note proposé ici.
          <SortSelect
            basePath="/immobilier"
            params={params}
            value={sort}
            sorts={["recommande", "prix-asc", "prix-desc", "recent"]}
          />
        ) : null}
      </div>

      <div className="mt-4">
        {results.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-darna/10">
            <p className="text-lg font-semibold text-darna">
              {fr.search.aucunResultatTitre}
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
              {fr.search.aucunResultatDesc}
            </p>
          </div>
        ) : (
          <SplitView
            list={
              <AnimatedGrid
                key={results.map((p) => p.id).join(",")}
                className="grid gap-5 sm:grid-cols-2"
              >
                {results.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    favorite={favoritePropFor(favCtx, p.id)}
                  />
                ))}
              </AnimatedGrid>
            }
            map={<PropertyMap markers={markers} />}
          />
        )}
      </div>

      <Pagination
        page={page}
        total={total}
        pageSize={pageSize}
        basePath="/immobilier"
        params={params}
      />
    </div>
  );
}
