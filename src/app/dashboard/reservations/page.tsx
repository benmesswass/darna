import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { fr } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";

const STATUS_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  CONFIRMEE: "bg-emerald-100 text-emerald-800",
  ANNULEE: "bg-red-100 text-red-700",
  TERMINEE: "bg-darna/10 text-darna",
};

export default async function MesReservationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const bookings = await prisma.booking.findMany({
    where: { guestId: user.id },
    include: {
      property: {
        select: {
          slug: true,
          title: true,
          city: true,
          photos: { orderBy: { position: "asc" }, take: 1 },
        },
      },
      review: { select: { id: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.mesReservations}</h2>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-darna">
            {fr.dashboard.aucuneReservation}
          </p>
          <p className="mt-1 text-sm text-ink/60">{fr.dashboard.aucuneReservationCta}</p>
          <Link
            href="/sejours"
            className="mt-5 inline-block rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
          >
            {fr.brand.ctaSejours}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="flex flex-col gap-4 rounded-3xl bg-white p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center"
            >
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
                {b.property.photos[0] ? (
                  <Image
                    src={b.property.photos[0].url}
                    alt={b.property.title}
                    fill
                    sizes="144px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[b.status] ?? "bg-cream text-ink"}`}
                >
                  {fr.dashboard.statutReservation[b.status] ?? b.status}
                </span>
                <p className="mt-1.5 truncate font-semibold text-ink">
                  {b.property.title}
                </p>
                <p className="text-sm text-ink/60">
                  {b.property.city} ·{" "}
                  {fr.booking.sejourDates(
                    formatDateShortFr(b.checkIn),
                    formatDateShortFr(b.checkOut)
                  )}
                </p>
                <p className="mt-0.5 text-sm">
                  <Price amount={b.totalPrice} className="font-bold text-darna" />
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/annonce/${b.property.slug}`}
                  className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-darna hover:bg-darna/5"
                >
                  {fr.dashboard.voirAnnonce}
                </Link>
                {b.status === "EN_ATTENTE" ? (
                  <Link
                    href={`/reservation/${b.id}/paiement`}
                    className="rounded-xl bg-sand px-3.5 py-2 text-center text-xs font-bold text-darna-dark hover:bg-sand-light"
                  >
                    {fr.booking.continuerPaiement}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
