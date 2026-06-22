import { getT } from "@/lib/i18n/server";
import { CheckIcon, StarIcon } from "@/components/icons";
import { daysSincePublication } from "@/lib/listings";
import { BadgeTooltip } from "./BadgeTooltip";

/** Badge « À la une » — mise en avant payante, distincte du badge Vérifié. */
export async function FeaturedBadge({ small = false }: { small?: boolean }) {
  const fr = await getT();
  return (
    <BadgeTooltip
      label={fr.badges.alaUne}
      description={fr.badges.alaUneTooltip}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-400 font-bold text-darna-dark shadow-sm ${
          small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <StarIcon
          width={small ? 11 : 13}
          height={small ? 11 : 13}
          className="fill-current"
        />
        {fr.badges.alaUne}
      </span>
    </BadgeTooltip>
  );
}

export async function VerifiedBadge({
  small = false,
  level = null,
  verifierName,
  verifiedAt,
}: {
  small?: boolean;
  level?: string | null;
  verifierName?: string | null;
  verifiedAt?: Date | null;
}) {
  const fr = await getT();

  if (level === "ON_SITE") {
    const dateStr = verifiedAt
      ? verifiedAt.toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
      : null;
    return (
      <BadgeTooltip
        label={fr.badges.verifieOnSite}
        description={fr.property.verifieOnSiteTooltip}
        criteria={fr.property.verifieOnSiteCriteres}
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-amber-400 bg-amber-50 font-bold text-amber-800 shadow-md ${
            small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
          }`}
        >
          <span className={small ? "text-[11px]" : "text-sm"}>🏅</span>
          <span>
            {fr.badges.verifieOnSite}
            {!small && verifierName && dateStr ? (
              <span className="ms-1 font-normal opacity-70">
                · {fr.property.verifiePar(verifierName)} · {dateStr}
              </span>
            ) : null}
          </span>
        </span>
      </BadgeTooltip>
    );
  }

  if (level === "REMOTE") {
    const dateStr = verifiedAt
      ? verifiedAt.toLocaleDateString("fr-TN", { day: "numeric", month: "long", year: "numeric" })
      : null;
    return (
      <BadgeTooltip
        label={fr.badges.verifieRemote}
        description={fr.property.verifieRemoteTooltip}
        criteria={fr.property.verifieRemoteCriteres}
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border-2 border-blue-300 bg-blue-50 font-semibold text-blue-800 shadow-sm ${
            small ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
          }`}
        >
          <span className={small ? "text-[11px]" : "text-sm"}>🛡️</span>
          <span>
            {fr.badges.verifieRemote}
            {!small && verifierName && dateStr ? (
              <span className="ms-1 font-normal opacity-70">
                · {fr.property.verifiePar(verifierName)} · {dateStr}
              </span>
            ) : null}
          </span>
        </span>
      </BadgeTooltip>
    );
  }

  // Fallback : ancien badge générique (vérification sans niveau)
  return (
    <BadgeTooltip
      label={fr.badges.verifie}
      description={fr.property.verifieTooltip}
    >
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-sand font-semibold text-darna-dark ${
          small ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
      >
        <CheckIcon width={small ? 11 : 13} height={small ? 11 : 13} strokeWidth={3} />
        {fr.badges.verifie}
      </span>
    </BadgeTooltip>
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
  if (status === "ACTIVE") return null;
  if (status === "EN_ATTENTE_VALIDATION") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
        {fr.badges.enAttenteValidation}
      </span>
    );
  }
  const STATUS_LABELS: Record<string, string> = {
    LOUE: fr.badges.loue,
    VENDU: fr.badges.vendu,
    EXPIREE: fr.badges.expiree,
  };
  return (
    <span className="inline-flex items-center rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
