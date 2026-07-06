import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateFr, formatDateShortFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { TypeBadge } from "@/components/property/Badges";
import { toWhatsAppNumber } from "@/components/property/PropertyCtas";
import { CashBookingActions } from "@/components/booking/CashBookingActions";
import { PrinterIcon, WhatsAppIcon } from "@/components/icons";

const DAY = 1000 * 60 * 60 * 24;
const nightsBetween = (checkIn: Date, checkOut: Date) =>
  Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / DAY));

export default async function DemandesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Rail 2 (PSP3, retour de test du 2026-07-05) : les demandes de réservation
  // payées sur place, en attente d'une décision de l'hôte, vivent ICI — pas
  // dans « Mes voyageurs » (réservée aux séjours confirmés/en cours/passés).
  // Non expirées uniquement (les expirées basculent ANNULEE paresseusement,
  // même patron que le hold de paiement).
  const cashRequests = await prisma.booking.findMany({
    where: {
      property: { ownerId: user.id },
      status: "EN_ATTENTE_ACCEPTATION",
      expiresAt: { gt: new Date() },
    },
    include: {
      property: {
        select: { slug: true, title: true, city: true, photos: { orderBy: { position: "asc" }, take: 1 } },
      },
      guest: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Demandes de contact (prospects) — formulaire public, surtout utilisé en
  // immobilier (pas de réservation en ligne). Distinctes des demandes de
  // réservation ci-dessus : ici aucune date, aucun montant, aucun engagement.
  const contactRequests = await prisma.contactRequest.findMany({
    where: { property: { ownerId: user.id } },
    include: {
      property: { select: { title: true, slug: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-heading">{fr.dashboard.demandesRecues}</h2>

      {cashRequests.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-base font-bold text-heading">
            {fr.dashboard.demandesCashTitre}
          </h3>
          <p className="mt-0.5 text-xs text-body/55">{fr.dashboard.demandesCashAide}</p>
          <div className="mt-3 space-y-4">
            {cashRequests.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-darna/10 sm:flex-row"
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
                  <p className="font-semibold text-body">
                    {fr.dashboard.demandeDe(b.guest.name)}
                  </p>
                  <Link
                    href={`/annonce/${b.property.slug}`}
                    className="mt-1 block truncate font-semibold text-heading underline"
                  >
                    {b.property.title}
                  </Link>
                  <p className="text-sm text-body/60">
                    {b.property.city} ·{" "}
                    {fr.booking.sejourDates(
                      formatDateShortFr(b.checkIn),
                      formatDateShortFr(b.checkOut)
                    )}{" "}
                    · {fr.booking.nuits(nightsBetween(b.checkIn, b.checkOut))} ·{" "}
                    {fr.property.capacite(b.guests)}
                  </p>
                  <p className="mt-1.5 text-sm">
                    <Price amount={b.totalPrice} className="font-bold text-heading" />
                  </p>
                  <div className="mt-3">
                    <CashBookingActions bookingId={b.id} montantCash={b.totalPrice} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <h3 className="text-base font-bold text-heading">
          {fr.dashboard.demandesContactTitre}
        </h3>
      {contactRequests.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-surface p-8 text-center text-sm text-body/60 ring-1 ring-darna/10">
          {fr.dashboard.aucuneDemande}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {contactRequests.map((c) => (
            <div key={c.id} className="rounded-3xl bg-surface p-5 ring-1 ring-darna/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-body">{fr.dashboard.demandeDe(c.name)}</p>
                <TypeBadge type={c.property.type} />
              </div>
              <p className="mt-1 text-sm text-body/60">
                <Link
                  href={`/annonce/${c.property.slug}`}
                  className="font-medium text-heading underline"
                >
                  {c.property.title}
                </Link>{" "}
                · {formatDateFr(c.createdAt)}
              </p>
              <blockquote className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm italic text-body/80">
                {c.message}
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a href={`mailto:${c.email}`} className="font-medium text-heading underline">
                  {c.email}
                </a>
                <a href={`tel:${c.phone}`} className="font-medium text-heading underline">
                  {c.phone}
                </a>
                <a
                  href={`https://wa.me/${toWhatsAppNumber(c.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#128C7E] underline"
                >
                  <WhatsAppIcon width={15} height={15} />
                  {fr.property.whatsapp}
                </a>
                {c.property.type === "LOCATION" ? (
                  <Link
                    href={`/contrat/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-darna px-3.5 py-1.5 text-xs font-bold text-white hover:bg-darna-light"
                  >
                    <PrinterIcon width={13} height={13} />
                    {fr.dashboard.contratBail}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
