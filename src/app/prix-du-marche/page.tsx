import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import type { Dictionary } from "@/lib/i18n";
import { computeMarketIndex, type M2Row, type NightRow } from "@/lib/market";
import { formatTndServer } from "@/lib/format";

export const metadata: Metadata = {
  title: frMeta.prixMarche.titre,
  description: frMeta.prixMarche.sousTitre,
};

// Agrégats recalculés à chaque requête : l'indice vit avec la base.
export const dynamic = "force-dynamic";

export default async function PrixDuMarchePage() {
  const fr = await getT();
  const { vente, location, nights } = await computeMarketIndex();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-darna">{fr.prixMarche.titre}</h1>
      <p className="mt-2 max-w-2xl text-ink/60">{fr.prixMarche.sousTitre}</p>

      <div className="mt-8 space-y-10">
        <IndexTable
          fr={fr}
          title={fr.prixMarche.venteTitre}
          headerLabel={fr.prixMarche.gouvernorat}
          headerValue={fr.prixMarche.prixM2}
          rows={vente.map((r) => ({ ...r, value: r.avgPerM2 }))}
          barColor="bg-darna"
        />
        <IndexTable
          fr={fr}
          title={fr.prixMarche.locationTitre}
          headerLabel={fr.prixMarche.gouvernorat}
          headerValue={fr.prixMarche.loyerM2}
          rows={location.map((r) => ({ ...r, value: r.avgPerM2 }))}
          barColor="bg-darna-light"
        />
        <IndexTable
          fr={fr}
          title={fr.prixMarche.sejourTitre}
          headerLabel={fr.prixMarche.ville}
          headerValue={fr.prixMarche.nuitee}
          rows={nights.map((r) => ({ ...r, value: r.avgNight }))}
          barColor="bg-sand"
        />
      </div>

      <section className="mt-12 rounded-3xl bg-white p-6 ring-1 ring-darna/10">
        <h2 className="text-lg font-bold text-darna">{fr.prixMarche.methodologie}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          {fr.prixMarche.methodologieTexte}
        </p>
      </section>
    </div>
  );
}

type Row = (M2Row | NightRow) & { value: number };

/** Tableau + barres horizontales en CSS pur — aucune librairie graphique. */
function IndexTable({
  fr,
  title,
  headerLabel,
  headerValue,
  rows,
  barColor,
}: {
  fr: Dictionary;
  title: string;
  headerLabel: string;
  headerValue: string;
  rows: Row[];
  barColor: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-darna/10">
      <h2 className="text-lg font-bold text-darna">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60">{fr.prixMarche.aucuneDonnee}</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-start text-xs font-semibold uppercase tracking-wide text-ink/40">
              <th className="pb-2">{headerLabel}</th>
              <th className="pb-2 text-end">{headerValue}</th>
              <th className="hidden pb-2 ps-6 sm:table-cell" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-darna/5">
                <td className="py-2.5 font-medium text-ink">
                  {row.label}
                  <span className="ms-2 text-xs font-normal text-ink/40">
                    {fr.prixMarche.annonces(row.count)}
                  </span>
                </td>
                <td className="py-2.5 text-end font-bold text-darna">
                  {formatTndServer(row.value)}
                </td>
                <td className="hidden py-2.5 ps-6 sm:table-cell" style={{ width: "40%" }}>
                  <div className="h-2.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className={`h-full rounded-full ${barColor}`}
                      style={{ width: `${Math.max(6, Math.round((row.value / max) * 100))}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
