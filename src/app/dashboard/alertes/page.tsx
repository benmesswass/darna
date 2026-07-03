import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { deleteSavedSearchAction } from "@/actions/saved-search";
import { TrashIcon } from "@/components/icons";

export default async function AlertesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const searches = await prisma.savedSearch.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  function budgetLabel(prixMin: number | null, prixMax: number | null): string {
    if (prixMin && prixMax) return fr.dashboard.alerteBudget(prixMin, prixMax);
    if (prixMin) return fr.dashboard.alerteBudgetMin(prixMin);
    if (prixMax) return fr.dashboard.alerteBudgetMax(prixMax);
    return fr.dashboard.alerteBudgetLibre;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-heading">{fr.dashboard.alertesTitre}</h2>

      {searches.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface p-8 text-center text-sm text-body/60 ring-1 ring-darna/10">
          {fr.dashboard.alertesAucune}
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {searches.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 ring-1 ring-darna/10"
            >
              <div>
                <p className="font-semibold text-body">{s.city}</p>
                <p className="text-sm text-body/60">
                  {budgetLabel(s.prixMin, s.prixMax)}
                </p>
              </div>
              <form action={deleteSavedSearchAction}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  aria-label={fr.dashboard.alerteSupprimer}
                  title={fr.dashboard.alerteSupprimer}
                  className="rounded-lg p-2 text-body/40 transition hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon width={16} height={16} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
