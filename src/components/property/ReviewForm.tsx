"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { StarIcon } from "@/components/icons";
import { SuccessCheck } from "@/components/ui/SuccessCheck";

/** Un sous-critère noté de 1 à 5 (F2) : propreté, communication, conformité, qualité/prix. */
function SubRatingPicker({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <span className="text-xs font-semibold text-body/60">{label}</span>
      <div className="mt-1 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label} : ${n}/5`}
            className={n <= value ? "text-sand" : "text-body/20"}
          >
            <StarIcon width={18} height={18} fill={n <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    undefined
  );
  const [proprete, setProprete] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [conformite, setConformite] = useState(5);
  const [qualitePrix, setQualitePrix] = useState(5);

  if (state?.success) {
    return (
      <p
        role="status"
        className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
      >
        <SuccessCheck size={32} />
        {state.success}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="mt-4 rounded-2xl bg-surface p-5 ring-1 ring-sand"
    >
      <p className="text-sm font-bold text-heading">{fr.property.publierAvis}</p>
      {state?.error ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <SubRatingPicker
          name="proprete"
          label={fr.property.sousNoteProprete}
          value={proprete}
          onChange={setProprete}
        />
        <SubRatingPicker
          name="communication"
          label={fr.property.sousNoteCommunication}
          value={communication}
          onChange={setCommunication}
        />
        <SubRatingPicker
          name="conformite"
          label={fr.property.sousNoteConformite}
          value={conformite}
          onChange={setConformite}
        />
        <SubRatingPicker
          name="qualitePrix"
          label={fr.property.sousNoteQualitePrix}
          value={qualitePrix}
          onChange={setQualitePrix}
        />
      </div>

      <label className="mt-4 block space-y-1">
        <span className="text-xs font-semibold text-body/60">
          {fr.property.votreCommentaire}
        </span>
        <textarea
          name="comment"
          required
          minLength={10}
          maxLength={2000}
          rows={3}
          className="w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.common.envoyer}
      </button>
    </form>
  );
}
