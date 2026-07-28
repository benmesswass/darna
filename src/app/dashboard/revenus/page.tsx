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
 * Revenus de l'hôte (lecture seule) — modèle commission-only (LANCEMENT_
 * ROADMAP.md §L5.1) : Darna ne détient ni ne verse plus jamais le loyer, réglé
 * en espèces à l'arrivée directement par le voyageur. Cette page récapitule le
 * loyer NET de l'hôte (`totalPrice - serviceFee`, jamais les frais Darna —
 * réglés en ligne par le voyageur en Rail 1/ESCROW, ou facturés après coup à
 * l'hôte en Rail 2/SUR_PLACE via HostInvoice, mécanique inchangée) : déjà
 * encaissé (séjour terminé) ou à venir (à l'arrivée). Réservé aux
 * annonceurs (hôte / agence).
 */
export default async function RevenusPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Bascule paresseuse CONFIRMEE → TERMINEE une fois le séjour passé. Le volet
  // séquestre de cette même fonction est désormais inerte (§L5.1) : plus rien
  // ne pose escrow EN_SEQUESTRE, cf. src/lib/bookings.ts.
  await completeElapsedBookings();

  const bookings = await prisma.booking.findMany({
    where: {
      property: { ownerId: user.id },
      // Seules les réservations réellement actées comptent : CONFIRMEE (frais
      // réglés, séjour à venir) ou TERMINEE (séjour passé). On exclut les
      // EN_ATTENTE (pas encore payées) et les ANNULEE.
      status: { in: ["CONFIRMEE", "TERMINEE"] },
    },
    select: {
      id: true,
      status: true,
      paymentMode: true,
      totalPrice: true,
      serviceFee: true,
      checkIn: true,
      checkOut: true,
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

  const netLoyer = (b: (typeof bookings)[number]) => b.totalPrice - b.serviceFee;

  const totalEncaisse = bookings
    .filter((b) => b.status === "TERMINEE")
    .reduce((sum, b) => sum + netLoyer(b), 0);
  const totalAVenir = bookings
    .filter((b) => b.status === "CONFIRMEE")
    .reduce((sum, b) => sum + netLoyer(b), 0);
  const total = totalEncaisse + totalAVenir;
  // Frais Darna déjà réglés EN LIGNE par les voyageurs (Rail 1/ESCROW
  // uniquement — en Rail 2/SUR_PLACE l'hôte les doit encore à Darna via
  // HostInvoice, purement informatif, jamais compté dans le loyer ci-dessus).
  const totalFraisEnLigne = bookings
    .filter((b) => b.paymentMode === "ESCROW")
    .reduce((sum, b) => sum + b.serviceFee, 0);

  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
        <CoinsIcon width={20} height={20} className="text-sand" />
        {fr.dashboard.revenusTitre}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        {fr.dashboard.revenusSousTitre}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard label={fr.dashboard.revenusTotal} value={formatTndServer(total)} emphasis />
        <SummaryCard
          label={fr.dashboard.revenusEnAttente}
          value={formatTndServer(totalAVenir)}
        />
        <SummaryCard label={fr.dashboard.revenusVerse} value={formatTndServer(totalEncaisse)} />
      </div>

      {totalFraisEnLigne > 0 ? (
        <p className="mt-3 text-xs text-muted">
          {fr.dashboard.revenusFraisInfo(formatTndServer(totalFraisEnLigne))}
        </p>
      ) : null}

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-heading">{fr.dashboard.revenusAucun}</p>
          <p className="mt-1 text-sm text-muted">{fr.dashboard.revenusAucunCta}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => {
            const encaisse = b.status === "TERMINEE";
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
                      encaisse ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {encaisse ? fr.dashboard.revenusBadgeVerse : fr.dashboard.revenusBadgeEnAttente}
                  </span>
                  <Link
                    href={`/annonce/${b.property.slug}`}
                    className="mt-1.5 block truncate font-semibold text-body hover:text-heading"
                  >
                    {b.property.title}
                  </Link>
                  <p className="text-sm text-muted">
                    {b.property.city} · {fr.dashboard.reservePar(b.guest.name)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {encaisse
                      ? fr.dashboard.revenusVerseApres(formatDateShortFr(b.checkOut))
                      : fr.dashboard.revenusAEncaisserLe(formatDateShortFr(b.checkIn))}
                  </p>
                </div>

                <p className="shrink-0 text-lg font-bold text-heading">
                  {formatTndServer(netLoyer(b))}
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
      <p className={`text-xs font-semibold ${emphasis ? "text-white/80" : "text-muted"}`}>
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold ${emphasis ? "text-white" : "text-heading"}`}>
        {value}
      </p>
    </div>
  );
}
