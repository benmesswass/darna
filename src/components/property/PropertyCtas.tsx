import Link from "next/link";
import { fr } from "@/lib/i18n/fr";
import { WhatsAppIcon } from "@/components/icons";

/** Numéro tunisien → format wa.me (chiffres uniquement, indicatif inclus). */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("216") ? digits : `216${digits}`;
}

export function PropertyCtas({
  slug,
  type,
  title,
  priceLabel,
  ownerPhone,
  active,
}: {
  slug: string;
  type: string;
  title: string;
  priceLabel: string;
  ownerPhone: string | null;
  active: boolean;
}) {
  if (!active) return null;

  if (type === "SEJOUR") {
    return (
      <Link
        href={`/annonce/${slug}/reserver`}
        className="mt-4 block rounded-2xl bg-sand px-5 py-3 text-center text-base font-bold text-darna-dark transition hover:bg-sand-light"
      >
        {fr.property.reserver}
      </Link>
    );
  }

  const whatsappHref = ownerPhone
    ? `https://wa.me/${toWhatsAppNumber(ownerPhone)}?text=${encodeURIComponent(
        fr.property.partagerWhatsapp(title, priceLabel)
      )}`
    : null;

  return (
    <div className="mt-4 space-y-2.5">
      <a
        href="#contact"
        className="block rounded-2xl bg-darna px-5 py-3 text-center text-base font-bold text-white transition hover:bg-darna-light"
      >
        {fr.property.contacter}
      </a>
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#25D366] px-5 py-2.5 text-center text-base font-bold text-[#128C7E] transition hover:bg-[#25D366]/10"
        >
          <WhatsAppIcon width={20} height={20} />
          {fr.property.whatsapp}
        </a>
      ) : null}
    </div>
  );
}
