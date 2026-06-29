import { redirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateShortFr } from "@/lib/format";
import { MESSAGE_FLAG_ESCALATION_THRESHOLD } from "@/lib/config";

/**
 * Signalements anti-bypass (ADMIN) : messages dans lesquels des coordonnées ont
 * été détectées et masquées. Permet de repérer les tentatives de passage hors
 * plateforme et les récidivistes (escaladés au-delà du seuil).
 */
export default async function SignalementsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  // Réservé aux administrateurs (le layout admin laisse aussi passer les wakils).
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [flagged, counts] = await Promise.all([
    prisma.message.findMany({
      where: { flagged: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        sender: { select: { name: true, email: true } },
        booking: { select: { id: true, property: { select: { title: true } } } },
      },
    }),
    prisma.message.groupBy({
      by: ["senderId"],
      where: { flagged: true },
      _count: { senderId: true },
    }),
  ]);

  const totalBySender = new Map(counts.map((c) => [c.senderId, c._count.senderId]));

  return (
    <div>
      <h3 className="text-lg font-bold text-darna">{fr.admin.signalementsTitre}</h3>
      <p className="mt-1 text-sm text-ink/60">{fr.admin.signalementsSousTitre}</p>

      {flagged.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-white p-10 text-center ring-1 ring-darna/10">
          <p className="text-sm text-ink/60">{fr.admin.signalementsVide}</p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {flagged.map((m) => {
            const total = totalBySender.get(m.senderId) ?? 1;
            const escalated = total >= MESSAGE_FLAG_ESCALATION_THRESHOLD;
            return (
              <li
                key={m.id}
                className="rounded-2xl bg-white p-4 text-start ring-1 ring-darna/10"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{m.sender.name}</span>
                  <span className="text-xs text-ink/50">{m.sender.email}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      escalated
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {escalated
                      ? fr.admin.signalementsEscalade(total)
                      : fr.admin.signalementsCompte(total)}
                  </span>
                  <span className="ms-auto text-xs text-ink/45">
                    {formatDateShortFr(m.createdAt)}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-ink/80">“{m.body}”</p>
                <Link
                  href={`/reservation/${m.booking.id}/messages`}
                  className="mt-1 inline-block text-xs font-semibold text-darna underline"
                >
                  {m.booking.property.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
