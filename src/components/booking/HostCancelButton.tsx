"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { hostCancelBookingAction } from "@/actions/bookings";
import { hostCancelBlockDays } from "@/lib/config";
import { useT } from "@/components/i18n/LocaleProvider";
import { AlertTriangleIcon, CloseIcon } from "@/components/icons";

interface Props {
  bookingId: string;
  /** ISO string — sert à calculer le palier de blocage AFFICHÉ (informatif,
   * l'action revérifie tout côté serveur à partir de la date réelle). */
  checkIn: string;
  /** Jours de la PROCHAINE suspension si l'hôte confirme (null = indéfinie,
   * au-delà du dernier palier) — calculé serveur depuis suspensionCount. */
  suspensionDays: number | null;
}

const DAY_MS = 86_400_000;

/**
 * Annulation à l'initiative de l'hôte (ANNULATION_HOTE_ROADMAP.md §AH1/AH5)
 * — vraie modale (portail vers document.body, comme ImageGalleryModal),
 * pas un panneau inline : le message d'avertissement est trop long pour
 * cohabiter avec le reste de la carte réservation sans la déformer.
 */
export function HostCancelButton({ bookingId, checkIn, suspensionDays }: Props) {
  const fr = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [state, action, pending] = useActionState(hostCancelBookingAction, undefined);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (state?.success) {
    return <p className="text-xs font-semibold text-emerald-700">{state.success}</p>;
  }

  const daysUntilCheckIn = (new Date(checkIn).getTime() - Date.now()) / DAY_MS;
  const blockDays = hostCancelBlockDays(daysUntilCheckIn);

  const consequences = [
    fr.dashboard.hostCancelConsequenceRemboursement,
    fr.dashboard.hostCancelConsequenceBlocage(blockDays),
    fr.dashboard.hostCancelConsequenceSuspension(suspensionDays),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-300 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
      >
        {fr.dashboard.annulerReservationHote}
      </button>

      {open && mounted
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={fr.dashboard.hostCancelModalTitre}
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
                  className="absolute end-5 top-5 text-subtle hover:text-heading"
                >
                  <CloseIcon width={18} height={18} />
                </button>

                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangleIcon width={28} height={28} className="text-red-600" />
                </div>

                <h3 className="mt-4 text-xl font-bold text-heading">
                  {fr.dashboard.hostCancelModalTitre}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body/70">
                  {fr.dashboard.hostCancelAvertissementHumain}
                </p>

                <div className="mt-5 rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                    {fr.dashboard.hostCancelConsequencesTitre}
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {consequences.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 text-sm text-red-900">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {state?.error ? (
                  <p className="mt-3 text-xs font-medium text-red-600">{state.error}</p>
                ) : null}

                <form action={action} className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-darna/15 px-4 py-2.5 text-sm font-semibold text-heading hover:bg-cream"
                  >
                    {fr.dashboard.annulerAnnuler}
                  </button>
                  <input type="hidden" name="bookingId" value={bookingId} />
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {pending ? "…" : fr.dashboard.annulerConfirm}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
