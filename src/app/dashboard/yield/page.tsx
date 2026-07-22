import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { computeYield } from "@/lib/yield";
import { formatTndServer } from "@/lib/format";
import { SparklesIcon } from "@/components/icons";
import { getAnonId, logProductEvent } from "@/lib/product-events";

export default async function YieldAdvisorPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    select: { id: true, title: true, city: true, gouvernorat: true, type: true },
    orderBy: { createdAt: "desc" },
  });

  const analyses = await Promise.all(
    properties.map(async (p) => ({
      property: p,
      analysis: await computeYield(p.city, p.gouvernorat),
    }))
  );

  // Instrumentation produit (INSTRUMENTATION_ROADMAP.md §IN2) — uniquement si
  // l'hôte a réellement quelque chose à analyser (sinon l'état vide n'est pas
  // un usage réel du simulateur).
  if (properties.length > 0) {
    await logProductEvent({
      event: "SIMULATOR_USED",
      userId: user.id,
      anonId: await getAnonId(),
      metadata: {
        propertyCount: properties.length,
        recommendations: analyses.map((a) => a.analysis.recommendation),
      },
    });
  }

  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
        <SparklesIcon width={20} height={20} className="text-sand" />
        {fr.yieldAdvisor.titre}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-body/60">{fr.yieldAdvisor.sousTitre}</p>

      {analyses.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface p-8 text-center text-sm text-body/60 ring-1 ring-darna/10">
          {fr.yieldAdvisor.aucunBien}
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {analyses.map(({ property, analysis }) => {
            const max = Math.max(
              analysis.saisonnierMensuel ?? 0,
              analysis.longueDureeMensuel ?? 0,
              1
            );
            const reco =
              analysis.recommendation === "SAISONNIER"
                ? fr.yieldAdvisor.recoSaisonnier
                : analysis.recommendation === "LONGUE_DUREE"
                  ? fr.yieldAdvisor.recoLongueDuree
                  : analysis.recommendation === "EQUIVALENT"
                    ? fr.yieldAdvisor.recoEquivalent
                    : fr.yieldAdvisor.donneesInsuffisantes;

            return (
              <li
                key={property.id}
                className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10"
              >
                <p className="font-semibold text-body">{property.title}</p>
                <p className="text-sm text-body/50">
                  {property.city}, {property.gouvernorat}
                </p>

                <div className="mt-4 space-y-3">
                  <BarRow
                    label={fr.yieldAdvisor.saisonnier}
                    detail={
                      analysis.avgNightCity
                        ? fr.yieldAdvisor.saisonnierDetail(analysis.avgNightCity)
                        : fr.yieldAdvisor.donneesInsuffisantes
                    }
                    value={analysis.saisonnierMensuel}
                    max={max}
                    color="bg-sand"
                  />
                  <BarRow
                    label={fr.yieldAdvisor.longueDuree}
                    detail={
                      analysis.avgRentGouvernorat
                        ? fr.yieldAdvisor.longueDureeDetail(analysis.avgRentGouvernorat)
                        : fr.yieldAdvisor.donneesInsuffisantes
                    }
                    value={analysis.longueDureeMensuel}
                    max={max}
                    color="bg-darna"
                  />
                </div>

                <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm font-medium text-darna-dark">
                  {reco}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BarRow({
  label,
  detail,
  value,
  max,
  color,
}: {
  label: string;
  detail: string;
  value: number | null;
  max: number;
  color: string;
}) {
  const width = value ? Math.max(6, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-body/80">{label}</span>
        <span className="text-sm font-bold text-heading">
          {value ? `${formatTndServer(value)} / mois` : "—"}
        </span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-cream">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-1 text-xs text-body/50">{detail}</p>
    </div>
  );
}
