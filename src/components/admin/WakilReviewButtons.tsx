"use client";

import { useActionState, useTransition, useState } from "react";
import {
  reviewWakilApplicationAction,
  softDeleteWakilApplicationAction,
  hardDeleteWakilApplicationAction,
} from "@/actions/admin";

type ReviewProps = {
  applicationId: string;
  labels: {
    accepter: string;
    refuser: string;
    entretien: string;
    entretienLabel: string;
    entretienPlaceholder: string;
  };
};

export function WakilReviewButtons({ applicationId, labels }: ReviewProps) {
  const [state, action] = useActionState(reviewWakilApplicationAction, undefined);
  const [isPending, startTransition] = useTransition();
  const [showDateInput, setShowDateInput] = useState(false);
  const [interviewAt, setInterviewAt] = useState("");

  const submit = (decision: "ACCEPTEE" | "REFUSEE" | "ENTRETIEN") => {
    const fd = new FormData();
    fd.set("applicationId", applicationId);
    fd.set("decision", decision);
    if (decision === "ENTRETIEN" && interviewAt) {
      // Convert local datetime-local value to ISO string
      fd.set("interviewAt", new Date(interviewAt).toISOString());
    }
    startTransition(() => action(fd));
    setShowDateInput(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {state?.error ? (
        <p className="text-xs text-red-600">{state.error}</p>
      ) : null}
      {state?.success ? (
        <p className="text-xs text-green-700">{state.success}</p>
      ) : null}

      {showDateInput ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-yellow-300 bg-yellow-50 p-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-yellow-800">
              {labels.entretienLabel}
            </label>
            <input
              type="datetime-local"
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
              className="rounded-lg border border-yellow-300 px-2 py-1 text-sm text-body focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <button
            type="button"
            onClick={() => submit("ENTRETIEN")}
            disabled={isPending}
            className="rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-yellow-600 disabled:opacity-40"
          >
            {labels.entretien}
          </button>
          <button
            type="button"
            onClick={() => setShowDateInput(false)}
            className="text-xs text-muted hover:text-body"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
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
            onClick={() => setShowDateInput(true)}
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
      )}
    </div>
  );
}

type DeleteProps = {
  applicationId: string;
  label: string;
  confirmLabel: string;
};

export function SoftDeleteWakilButton({ applicationId, label, confirmLabel }: DeleteProps) {
  const [state, action] = useActionState(softDeleteWakilApplicationAction, undefined);
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    const fd = new FormData();
    fd.set("applicationId", applicationId);
    startTransition(() => action(fd));
    setConfirming(false);
  };

  return (
    <div>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{confirmLabel}</span>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded-lg bg-ink/20 px-2.5 py-1 text-xs font-semibold text-body/70 hover:bg-ink/30 disabled:opacity-40"
          >
            {label}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-muted hover:text-body"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-xs text-subtle underline-offset-2 hover:text-body/70 hover:underline"
        >
          {label}
        </button>
      )}
    </div>
  );
}

type HardDeleteProps = {
  applicationId: string;
  label: string;
  confirmLabel: string;
};

export function HardDeleteWakilButton({ applicationId, label, confirmLabel }: HardDeleteProps) {
  const [state, action] = useActionState(hardDeleteWakilApplicationAction, undefined);
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const submit = () => {
    const fd = new FormData();
    fd.set("applicationId", applicationId);
    startTransition(() => action(fd));
    setConfirming(false);
  };

  return (
    <div>
      {state?.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{confirmLabel}</span>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded-lg bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-40"
          >
            {label}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-xs text-muted hover:text-body"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
        >
          {label}
        </button>
      )}
    </div>
  );
}
