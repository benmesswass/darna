import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { stayEnabled } from "@/lib/modes";
import { formatDateShortFr, formatDateFr } from "@/lib/format";
import { MessageComposer } from "@/components/booking/MessageComposer";
import { isSuspended } from "@/lib/suspension";
import { CONTACT_MASK } from "@/lib/message-scan";
import { contactRevealState } from "@/lib/contact-reveal";
import type { CancelPolicy } from "@/lib/constants";
import { LockIcon, ChevronLeftIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.messages.titre };

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  if (!stayEnabled()) notFound();

  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      checkIn: true,
      guestId: true,
      property: { select: { ownerId: true, cancelPolicy: true, title: true, slug: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, body: true, flagged: true, createdAt: true, senderId: true },
      },
    },
  });

  // Autorisation : seul le voyageur ou l'hôte de la réservation accède au fil.
  const viewer: "guest" | "host" | null =
    !booking
      ? null
      : user.id === booking.guestId
        ? "guest"
        : user.id === booking.property.ownerId
          ? "host"
          : null;
  if (!booking || !viewer) notFound();

  const isOpen = booking.status === "CONFIRMEE" || booking.status === "TERMINEE";
  const otherLabel = viewer === "guest" ? fr.messages.hote : fr.messages.voyageur;
  // Réservation ferme → l'échange de coordonnées est libre (plus de masquage).
  const firm =
    contactRevealState(
      booking.status,
      booking.checkIn,
      booking.property.cancelPolicy as CancelPolicy
    ).state === "revealed";

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/reservations"
        className="inline-flex items-center gap-1.5 rounded-full border border-darna/15 px-3.5 py-1.5 text-sm font-semibold text-darna transition hover:bg-darna/5"
      >
        <ChevronLeftIcon width={15} height={15} className="shrink-0 rtl:rotate-180" />
        {fr.dashboard.mesReservations}
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-darna">{fr.messages.titre}</h1>
      <p className="mt-1 text-sm text-ink/60">{booking.property.title}</p>

      {/* Bandeau de sécurité : coordonnées masquées tant que la réservation
          n'est pas ferme (anti-bypass). */}
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-darna-dark">
        <LockIcon width={15} height={15} className="mt-0.5 shrink-0" />
        {firm ? fr.messages.banniereLibre : fr.messages.banniere}
      </p>

      {!firm ? (
        <details className="mt-2 rounded-2xl bg-white px-4 py-3 text-start ring-1 ring-darna/10">
          <summary className="cursor-pointer text-xs font-bold text-darna">
            {fr.messages.pourquoiTitre}
          </summary>
          <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink/70">
            <li>• {fr.messages.pourquoi1}</li>
            <li>• {fr.messages.pourquoi2}</li>
            <li>• {fr.messages.pourquoi3}</li>
            <li>• {fr.messages.pourquoi4}</li>
          </ul>
          <p className="mt-2 text-xs font-semibold text-darna">
            {fr.messages.pourquoiConclusion}
          </p>
        </details>
      ) : null}

      <div className="mt-5 space-y-3">
        {booking.messages.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-ink/50 ring-1 ring-darna/10">
            {fr.messages.vide}
          </p>
        ) : (
          booking.messages.map((m) => {
            const mine = m.senderId === user.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine
                      ? "bg-darna text-white"
                      : "bg-white text-ink ring-1 ring-darna/10"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                </div>
                <span className="mt-1 px-1 text-[11px] text-ink/45">
                  {mine ? fr.messages.vous : otherLabel} ·{" "}
                  {formatDateShortFr(m.createdAt)}
                  {m.body.includes(CONTACT_MASK) ? ` · ${fr.messages.masque}` : ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {isSuspended(user) ? (
        <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
          {user.suspendedUntil
            ? fr.messages.compteSuspenduJusqu(formatDateFr(user.suspendedUntil))
            : fr.messages.compteSuspendu}
        </p>
      ) : isOpen ? (
        <MessageComposer bookingId={booking.id} />
      ) : (
        <p className="mt-4 rounded-2xl bg-sand-light/50 px-4 py-3 text-sm font-medium text-darna-dark">
          {fr.messages.indisponible}
        </p>
      )}
    </div>
  );
}
