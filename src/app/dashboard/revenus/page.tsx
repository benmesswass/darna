import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { completeElapsedBookings } from "@/lib/bookings";
import { formatTndServer, formatDateShortFr } from "@/lib/format";
import { CoinsIcon } from "@/components/icons";

/**
 * Revenus de l'hôte (lecture seule). Le « payout » est un statut, pas un vrai
 * virement (mock assumé, cohérent avec le reste de Darna) : le paiement du
 * voyageur est protégé (escrow EN_SEQUESTRE) puis libéré (LIBERE) à la fin du
 * séjour par `completeElapsedBookings()`. On agrège ces deux états en
 * « en attente de versement » et « déjà versé ». Aucun montant n'est recalculé
 * côté client. Réservé aux annonceurs (hôte / agence).
 */
export default async function RevenusPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Libération paresseuse du séquestre avant de calculer les totaux : un séjour
  // terminé bascule EN_SEQUESTRE → LIBERE (= versé) au chargement.
  await completeElapsedBookings();

  const bookings = await prisma.booking.findMany({
    where: {
      property: { ownerId: user.id },
      // Seuls les paiements réellement encaissés et protégés comptent comme
      // revenus : EN_SEQUESTRE (à verser) ou LIBERE (versé). On exclut donc les
      // EN_ATTENTE non payées et les ANNULEE (escrow AUCUN).
      escrow: { in: ["EN_SEQUESTRE", "LIBERE"] },
    },
    include: {
      property: {
        select: {
          slug: true,
          title: true,
          city: true,
          photos: { orderBy: { position: "asc" }, take: 1 },
        },
      },
      guest: { select: { name: true } },
    },
    orderBy: { checkOut: "desc" },
  });

  const totalVerse = bookings
    .filter((b) => b.escrow === "LIBERE")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const totalEnAttente = bookings
    .filter((b) => b.escrow === "EN_SEQUESTRE")
    .reduce((sum, b) => sum + b.totalPrice, 0);
  const total = totalVerse + totalEnAttente;

  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
        <CoinsIcon width={20} height={20} className="text-sand" />
        {fr.dashboard.revenusTitre}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-body/60">
        {fr.dashboard.revenusSousTitre}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label={fr.dashboard.revenusTotal} value={formatTndServer(total)} emphasis />
        <SummaryCard
          label={fr.dashboard.revenusEnAttente}
          value={formatTndServer(totalEnAttente)}
        />
        <SummaryCard label={fr.dashboard.revenusVerse} value={formatTndServer(totalVerse)} />
      </div>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-heading">{fr.dashboard.revenusAucun}</p>
          <p className="mt-1 text-sm text-body/60">{fr.dashboard.revenusAucunCta}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => {
            const verse = b.escrow === "LIBERE";
            return (
              <li
                key={b.id}
                className="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center"
              >
                <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-2xl sm:w-28">
                  {b.property.photos[0] ? (
                    <Image
                      src={b.property.photos[0].url}
                      alt={b.property.title}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      verse ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {verse ? fr.dashboard.revenusBadgeVerse : fr.dashboard.revenusBadgeEnAttente}
                  </span>
                  <Link
                    href={`/annonce/${b.property.slug}`}
                    className="mt-1.5 block truncate font-semibold text-body hover:text-heading"
                  >
                    {b.property.title}
                  </Link>
                  <p className="text-sm text-body/60">
                    {b.property.city} · {fr.dashboard.reservePar(b.guest.name)}
                  </p>
                  <p className="mt-0.5 text-xs text-body/50">
                    {verse
                      ? fr.dashboard.revenusVerseApres(formatDateShortFr(b.checkOut))
                      : fr.dashboard.revenusVersementPrevu(formatDateShortFr(b.checkOut))}
                  </p>
                </div>

                <p className="shrink-0 text-lg font-bold text-heading">
                  {formatTndServer(b.totalPrice)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 ring-1 ${
        emphasis ? "bg-darna ring-darna" : "bg-surface ring-darna/10"
      }`}
    >
      <p className={`text-xs font-semibold ${emphasis ? "text-white/80" : "text-body/55"}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold ${emphasis ? "text-white" : "text-heading"}`}>
        {value}
      </p>
    </div>
  );
}
