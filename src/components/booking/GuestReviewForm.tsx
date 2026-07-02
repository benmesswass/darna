"use client";

import { useActionState, useState } from "react";
import { submitGuestReviewAction, type GuestReviewFormState } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { StarIcon } from "@/components/icons";

/** Symétrique de ReviewForm : l'hôte note le voyageur (F1, avis bidirectionnels). */
export function GuestReviewForm({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<GuestReviewFormState, FormData>(
    submitGuestReviewAction,
    undefined
  );
  const [rating, setRating] = useState(5);

  if (state?.success) {
    return (
      <p
        role="status"
        className="mt-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700"
      >
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="mt-2 rounded-xl bg-cream p-3.5 ring-1 ring-sand">
      <p className="text-xs font-bold text-darna">{fr.dashboard.noterVoyageur}</p>
      {state?.error ? (
        <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n}/5`}
            className={n <= rating ? "text-sand" : "text-ink/20"}
          >
            <StarIcon width={20} height={20} fill={n <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      <textarea
        name="comment"
        required
        minLength={10}
        maxLength={2000}
        rows={2}
        placeholder={fr.property.votreCommentaire}
        className="mt-2 w-full rounded-lg border border-darna/15 bg-white px-3 py-2 text-xs outline-none focus:border-darna"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-darna px-4 py-1.5 text-xs font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
      >
        {pending ? fr.common.chargement : fr.common.envoyer}
      </button>
    </form>
  );
}
