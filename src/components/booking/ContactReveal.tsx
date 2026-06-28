import { getT } from "@/lib/i18n/server";
import { formatDateFr } from "@/lib/format";
import { LockIcon } from "@/components/icons";
import { RevealedContactCard } from "@/components/booking/RevealedContactCard";
import type { ContactGate } from "@/lib/contact-reveal";

/**
 * Rend le contact d'une réservation selon le gating anti-bypass :
 *  • `revealed` → carte des coordonnées de l'autre partie ;
 *  • `locked`   → encart « coordonnées débloquées le <date> » (fin de la
 *                 période d'annulation gratuite) ;
 *  • `null`     → rien.
 *
 * Les données proviennent EXCLUSIVEMENT de getRevealedContacts /
 * contactRevealState (gating serveur) — ce composant ne fait que présenter.
 */
export async function ContactReveal({
  contacts,
  className,
}: {
  contacts: ContactGate;
  className?: string;
}) {
  if (!contacts) return null;

  if (contacts.state === "revealed") {
    return <RevealedContactCard contacts={contacts} className={className} />;
  }

  const fr = await getT();
  const isGuestViewer = contacts.viewer === "guest";

  return (
    <div
      className={`rounded-2xl bg-cream p-4 text-start ring-1 ring-darna/10 ${className ?? ""}`}
    >
      <p className="flex items-center gap-2 text-sm font-bold text-darna">
        <LockIcon width={15} height={15} className="shrink-0" />
        {isGuestViewer
          ? fr.booking.contactLockedTitreHote
          : fr.booking.contactLockedTitreVoyageur}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {fr.booking.contactDebloqueLe(formatDateFr(contacts.revealAt))}
      </p>
      <p className="mt-1 text-xs text-ink/60">{fr.booking.contactLockedAide}</p>
    </div>
  );
}
