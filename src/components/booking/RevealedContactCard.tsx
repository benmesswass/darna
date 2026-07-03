import { getT } from "@/lib/i18n/server";
import { UserIcon, MailIcon, WhatsAppIcon } from "@/components/icons";
import { toWhatsAppNumber } from "@/components/property/PropertyCtas";
import type { RevealedContacts } from "@/lib/contact-reveal";

/**
 * Carte des coordonnées RÉVÉLÉES (hôte ↔ voyageur), affichée uniquement après
 * confirmation de la réservation. Les données proviennent EXCLUSIVEMENT de
 * `getRevealedContacts` (gating serveur) — ce composant ne fait que présenter.
 */
export async function RevealedContactCard({
  contacts,
  className,
}: {
  contacts: RevealedContacts;
  className?: string;
}) {
  const fr = await getT();
  const { viewer, counterpart } = contacts;
  const isGuestViewer = viewer === "guest";

  return (
    <div
      className={`rounded-2xl bg-surface p-5 text-start ring-1 ring-emerald-200 ${className ?? ""}`}
    >
      <p className="text-sm font-bold text-heading">
        {isGuestViewer ? fr.booking.contactHoteTitre : fr.booking.contactVoyageurTitre}
      </p>
      <p className="mt-0.5 text-xs text-body/60">
        {isGuestViewer ? fr.booking.contactHoteAide : fr.booking.contactVoyageurAide}
      </p>

      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <UserIcon width={15} height={15} className="shrink-0 text-heading" />
          <dt className="sr-only">{fr.booking.contactNom}</dt>
          <dd className="font-semibold text-body">{counterpart.name}</dd>
        </div>
        <div className="flex items-center gap-2">
          <MailIcon width={15} height={15} className="shrink-0 text-heading" />
          <dt className="sr-only">{fr.booking.contactEmail}</dt>
          <dd>
            <a href={`mailto:${counterpart.email}`} className="font-medium text-heading underline">
              {counterpart.email}
            </a>
          </dd>
        </div>
        {counterpart.phone ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <dt className="sr-only">{fr.booking.contactTelephone}</dt>
            <dd>
              <a href={`tel:${counterpart.phone}`} className="font-medium text-heading underline">
                {counterpart.phone}
              </a>
            </dd>
            <a
              href={`https://wa.me/${toWhatsAppNumber(counterpart.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#128C7E] underline"
            >
              <WhatsAppIcon width={15} height={15} />
              {fr.property.whatsapp}
            </a>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
