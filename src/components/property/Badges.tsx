import { getT } from "@/lib/i18n/server";
import { CheckIcon } from "@/components/icons";
import { daysSincePublication } from "@/lib/listings";

export async function VerifiedBadge({ small = false }: { small?: boolean }) {
  const fr = await getT();
  return (
    <span
      title={fr.property.verifieTooltip}
      className={`inline-flex items-center gap-1 rounded-full bg-sand font-semibold text-darna-dark ${
        small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <CheckIcon width={small ? 11 : 13} height={small ? 11 : 13} strokeWidth={3} />
      {fr.badges.verifie}
    </span>
  );
}

export async function FreshnessBadge({ publishedAt }: { publishedAt: Date }) {
  const fr = await getT();
  const days = daysSincePublication(publishedAt);
  const label =
    days <= 0
      ? fr.badges.publieAujourdhui
      : days === 1
        ? fr.badges.publieHier
        : fr.badges.publieIlYa(days);
  return (
    <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink/70 ring-1 ring-ink/10">
      {label}
    </span>
  );
}

export async function TypeBadge({ type }: { type: string }) {
  const fr = await getT();
  const TYPE_LABELS: Record<string, string> = {
    SEJOUR: fr.badges.sejour,
    LOCATION: fr.badges.location,
    VENTE: fr.badges.vente,
  };
  return (
    <span className="inline-flex items-center rounded-full bg-darna px-2.5 py-1 text-[11px] font-semibold text-white">
      {TYPE_LABELS[type] ?? type}
    </span>
  );
}

export async function StatusBadge({ status }: { status: string }) {
  const fr = await getT();
  const STATUS_LABELS: Record<string, string> = {
    LOUE: fr.badges.loue,
    VENDU: fr.badges.vendu,
    EXPIREE: fr.badges.expiree,
  };
  if (status === "ACTIVE") return null;
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
