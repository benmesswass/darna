import { getT } from "@/lib/i18n/server";
import { FinancingLeadForm } from "@/components/property/FinancingLeadForm";
import type { ListingData, ListingViewer } from "@/modules/core/listing/types";

/**
 * Apport d'affaires financement (MONETISATION_IMMO_ROADMAP.md §MI5) — VENTE
 * uniquement. Capture du lead pour un futur partenaire bancaire ; aucune
 * simulation de mensualité calculée par Darna (aucune donnée réelle pour
 * la fonder honnêtement — contrairement à /combien-gagner, §G1).
 */
export async function FinancingLeadSection({
  property,
  user,
}: {
  property: ListingData;
  user: ListingViewer;
}) {
  const fr = await getT();

  return (
    <section id="financement">
      <h2 className="text-xl font-bold text-heading">{fr.financement.titre}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">{fr.financement.sousTitre}</p>
      <div className="mt-4 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <FinancingLeadForm
          propertyId={property.id}
          defaults={{
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
          }}
        />
      </div>
    </section>
  );
}
