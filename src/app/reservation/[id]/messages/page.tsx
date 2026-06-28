import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { stayEnabled } from "@/lib/modes";
import { formatDateShortFr } from "@/lib/format";
import { MessageComposer } from "@/components/booking/MessageComposer";
import { LockIcon } from "@/components/icons";

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
      guestId: true,
      property: { select: { ownerId: true, title: true, slug: true } },
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

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/reservations"
        className="text-sm font-semibold text-darna hover:underline"
      >
        ← {fr.dashboard.mesReservations}
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-darna">{fr.messages.titre}</h1>
      <p className="mt-1 text-sm text-ink/60">{booking.property.title}</p>

      {/* Bandeau de sécurité : coordonnées masquées tant que la réservation
          n'est pas ferme (anti-bypass). */}
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-cream px-4 py-3 text-xs font-medium text-darna-dark">
        <LockIcon width={15} height={15} className="mt-0.5 shrink-0" />
        {fr.messages.banniere}
      </p>

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
                  {m.flagged ? ` · ${fr.messages.masque}` : ""}
                </span>
              </div>
            );
          })
        )}
      </div>

      {isOpen ? (
        <MessageComposer bookingId={booking.id} />
      ) : (
        <p className="mt-4 rounded-2xl bg-sand-light/50 px-4 py-3 text-sm font-medium text-darna-dark">
          {fr.messages.indisponible}
        </p>
      )}
    </div>
  );
}
