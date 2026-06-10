import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  markPropertyClosedAction,
  republishPropertyAction,
} from "@/actions/properties";
import { StatusBadge, TypeBadge, VerifiedBadge } from "@/components/property/Badges";
import { Price } from "@/components/currency/Price";

export default async function MesAnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{ creee?: string; modifiee?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  const { creee, modifiee } = await searchParams;

  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const nowMs = Date.now();

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.mesAnnonces}</h2>

      {creee ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {fr.annonceForm.annonceCreee}
        </p>
      ) : null}
      {modifiee ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {fr.annonceForm.annonceModifiee}
        </p>
      ) : null}

      {properties.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-darna">
            {fr.dashboard.aucuneAnnonce}
          </p>
          <p className="mt-1 text-sm text-ink/60">{fr.dashboard.aucuneAnnonceCta}</p>
          <Link
            href="/dashboard/annonces/nouvelle"
            className="mt-5 inline-block rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
          >
            {fr.dashboard.creerAnnonce}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {properties.map((p) => {
            const isExpired = p.expiresAt.getTime() < nowMs;
            const effectiveExpired = isExpired && p.status === "ACTIVE";
            const daysLeft = Math.ceil(
              (p.expiresAt.getTime() - nowMs) / (24 * 60 * 60 * 1000)
            );
            const canClose =
              p.status === "ACTIVE" && (p.type === "LOCATION" || p.type === "VENTE");
            const canRepublish = p.status !== "ACTIVE" || isExpired;

            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-3xl bg-white p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
                  {p.photos[0] ? (
                    <Image
                      src={p.photos[0].url}
                      alt={p.photos[0].alt}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <TypeBadge type={p.type} />
                    {p.verified ? <VerifiedBadge small /> : null}
                    <StatusBadge status={effectiveExpired ? "EXPIREE" : p.status} />
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-ink">{p.title}</p>
                  <p className="text-sm text-ink/60">
                    {p.city} ·{" "}
                    <Price amount={p.price} className="font-semibold text-darna" />
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      effectiveExpired
                        ? "font-semibold text-red-600"
                        : daysLeft <= 7
                          ? "font-semibold text-amber-600"
                          : "text-ink/50"
                    }`}
                  >
                    {fr.dashboard.expireDans(daysLeft)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                  <Link
                    href={`/dashboard/annonces/${p.id}/modifier`}
                    className="rounded-xl bg-darna px-3.5 py-2 text-center text-xs font-semibold text-white hover:bg-darna-light"
                  >
                    {fr.annonceForm.modifierTitre}
                  </Link>
                  <Link
                    href={`/annonce/${p.slug}`}
                    className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-darna hover:bg-darna/5"
                  >
                    {fr.dashboard.voirAnnonce}
                  </Link>
                  {canClose ? (
                    <form action={markPropertyClosedAction}>
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink/80"
                      >
                        {p.type === "VENTE"
                          ? fr.dashboard.marquerVendu
                          : fr.dashboard.marquerLoue}
                      </button>
                    </form>
                  ) : null}
                  {canRepublish ? (
                    <form action={republishPropertyAction}>
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-sand px-3.5 py-2 text-xs font-bold text-darna-dark hover:bg-sand-light"
                      >
                        {fr.dashboard.republier}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
