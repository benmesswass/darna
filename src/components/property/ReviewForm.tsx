"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/actions/bookings";
import { useT } from "@/components/i18n/LocaleProvider";
import { StarIcon } from "@/components/icons";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    submitReviewAction,
    undefined
  );
  const [rating, setRating] = useState(5);

  if (state?.success) {
    return (
      <p
        role="status"
        className="mt-4 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
      >
        {state.success}
      </p>
    );
  }

  return (
    <form
      action={action}
      className="mt-4 rounded-2xl bg-white p-5 ring-1 ring-sand"
    >
      <p className="text-sm font-bold text-darna">{fr.property.publierAvis}</p>
      {state?.error ? (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-3">
        <span className="text-xs font-semibold text-ink/60">
          {fr.property.votreNote}
        </span>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n}/5`}
              className={n <= rating ? "text-sand" : "text-ink/20"}
            >
              <StarIcon
                width={26}
                height={26}
                fill={n <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </div>

      <label className="mt-3 block space-y-1">
        <span className="text-xs font-semibold text-ink/60">
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
