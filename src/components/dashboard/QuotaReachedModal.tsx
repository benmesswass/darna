"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon, CoinsIcon } from "@/components/icons";

type Props = {
  utilisees: number;
  limite: number;
  recommendedLabel: string;
  recommendedListings: number;
  recommendedPrice: number;
};

/**
 * Modale informative (PAS un blocage) affichée à l'agence juste après la
 * création d'une annonce, quand son quota d'annonces actives est déjà
 * atteint (MONETISATION_IMMO_ROADMAP.md §MI2) — plutôt que de la laisser
 * découvrir le blocage seulement quand un admin/wakil échouera à vérifier
 * cette annonce plus tard (cf. verifyPropertyAction + notifyAgencyQuotaReached,
 * qui couvre ce même cas côté notification in-app). Vraie modale (portail),
 * même patron que HostCancelButton — mais informative, jamais destructive :
 * ton neutre/amber, pas d'urgence artificielle, un seul CTA clair.
 *
 * S'ouvre automatiquement (pas de déclencheur utilisateur) : le parent ne la
 * rend que lorsque le paramètre `quotaAtteint=1` est présent dans l'URL de
 * retour de création — jamais reconstruite sans ce signal serveur.
 */
export function QuotaReachedModal({
  utilisees,
  limite,
  recommendedLabel,
  recommendedListings,
  recommendedPrice,
}: Props) {
  const fr = useT();
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={fr.abonnement.modalTitre}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-surface p-7 text-start shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={fr.common.annuler}
          className="absolute end-5 top-5 text-body/40 hover:text-heading"
        >
          <CloseIcon width={18} height={18} />
        </button>

        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <CoinsIcon width={26} height={26} className="text-amber-600" />
        </div>

        <h3 className="mt-4 text-xl font-bold text-heading">{fr.abonnement.modalTitre}</h3>
        <p className="mt-2 text-sm leading-relaxed text-body/70">
          {fr.abonnement.modalTexte(utilisees, limite)}
        </p>
        <p className="mt-3 text-xs font-medium text-body/50">
          {fr.abonnement.modalRecommandation(recommendedLabel, recommendedListings, recommendedPrice)}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl border border-darna/15 px-4 py-2.5 text-sm font-semibold text-heading hover:bg-cream"
          >
            {fr.abonnement.modalPlusTard}
          </button>
          <Link
            href="/dashboard/abonnement"
            className="rounded-xl bg-amber-400 px-4 py-2.5 text-center text-sm font-bold text-darna-dark hover:bg-amber-300"
          >
            {fr.abonnement.modalCta}
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
