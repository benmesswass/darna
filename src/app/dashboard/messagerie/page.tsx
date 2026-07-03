import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { listConversations } from "@/lib/messages";
import { formatDateShortFr } from "@/lib/format";
import { MailIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.messages.hubTitre };

/**
 * Espace « Messagerie » centralisé : toutes les conversations de l'utilisateur
 * (réservations dont il est voyageur ou hôte), la plus récente d'abord, avec une
 * pastille de non-lus par fil. Chaque ligne ouvre le fil existant
 * `/reservation/[id]/messages` (qui marque alors les messages comme lus).
 */
export default async function MessageriePage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const conversations = await listConversations(user.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-heading">{fr.messages.hubTitre}</h1>
      <p className="mt-1 text-sm text-body/60">{fr.messages.hubSousTitre}</p>

      {conversations.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-surface px-4 py-12 text-center ring-1 ring-darna/10">
          <MailIcon width={28} height={28} className="mx-auto text-heading/40" />
          <p className="mt-3 text-sm text-body/55">{fr.messages.hubVide}</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-2.5">
          {conversations.map((c) => (
            <li key={c.bookingId}>
              <Link
                href={`/reservation/${c.bookingId}/messages`}
                className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-darna/10 transition hover:ring-darna/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-heading">
                  <MailIcon width={18} height={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-heading">{c.otherName}</span>
                    <span className="shrink-0 text-[11px] text-body/45">
                      {formatDateShortFr(c.lastAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-body/55">
                    {c.propertyTitle}
                  </span>
                  <span
                    className={`mt-1 block truncate text-sm ${
                      c.unread > 0 ? "font-semibold text-body" : "text-body/60"
                    }`}
                  >
                    {c.lastMine ? `${fr.messages.vous} : ` : ""}
                    {c.lastBody}
                  </span>
                </span>
                {c.unread > 0 ? (
                  <span className="ms-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-darna px-1.5 text-[10px] font-bold text-white">
                    {c.unread}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
