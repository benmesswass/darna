"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { hostCancelBookingAction } from "@/actions/bookings";
import { hostCancelBlockDays } from "@/lib/config";
import { useT } from "@/components/i18n/LocaleProvider";
import { CloseIcon } from "@/components/icons";

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
              aria-label={fr.dashboard.annulerReservationHote}
              className="fixed inset-0 z-[2000] flex items-center justify-center bg-ink/60 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <div className="w-full max-w-md rounded-2xl bg-surface p-5 text-start shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-red-900">
                    {fr.dashboard.hostCancelAvertissementHumain}
                  </p>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={fr.common.annuler}
                    className="shrink-0 text-body/50 hover:text-heading"
                  >
                    <CloseIcon width={16} height={16} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-red-800">
                  {fr.dashboard.hostCancelAvertissement(blockDays, suspensionDays)}
                </p>
                {state?.error ? (
                  <p className="mt-2 text-xs font-medium text-red-600">{state.error}</p>
                ) : null}
                <form action={action} className="mt-4 flex justify-end gap-2">
                  <input type="hidden" name="bookingId" value={bookingId} />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-darna/15 px-3.5 py-2 text-xs font-semibold text-heading hover:bg-cream"
                  >
                    {fr.dashboard.annulerAnnuler}
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
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
