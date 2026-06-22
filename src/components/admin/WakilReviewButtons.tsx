"use client";

import { useActionState, useTransition } from "react";
import { reviewWakilApplicationAction } from "@/actions/admin";

type Props = {
  applicationId: string;
  labels: {
    accepter: string;
    refuser: string;
    entretien: string;
  };
};

export function WakilReviewButtons({ applicationId, labels }: Props) {
  const [state, action] = useActionState(reviewWakilApplicationAction, undefined);
  const [isPending, startTransition] = useTransition();

  const submit = (decision: "ACCEPTEE" | "REFUSEE" | "ENTRETIEN") => {
    const fd = new FormData();
    fd.set("applicationId", applicationId);
    fd.set("decision", decision);
    startTransition(() => action(fd));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {state?.error ? (
        <p className="w-full text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="w-full text-xs text-green-700">{state.success}</p>
      ) : null}
      <button
        type="button"
        onClick={() => submit("ACCEPTEE")}
        disabled={isPending}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-700 disabled:opacity-40"
      >
        {labels.accepter}
      </button>
      <button
        type="button"
        onClick={() => submit("ENTRETIEN")}
        disabled={isPending}
        className="rounded-lg border border-yellow-400 px-3 py-1.5 text-xs font-semibold text-yellow-700 transition hover:bg-yellow-50 disabled:opacity-40"
      >
        {labels.entretien}
      </button>
      <button
        type="button"
        onClick={() => submit("REFUSEE")}
        disabled={isPending}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
      >
        {labels.refuser}
      </button>
    </div>
  );
}
