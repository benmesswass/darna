"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { sendMessageAction, type MessageFormState } from "@/actions/messages";
import { useT } from "@/components/i18n/LocaleProvider";

/**
 * Champ d'envoi de message (messagerie interne). Poste vers sendMessageAction
 * (autorisation + scan des coordonnées côté serveur) et vide la zone de saisie
 * après un envoi réussi.
 */
export function MessageComposer({ bookingId }: { bookingId: string }) {
  const fr = useT();
  const [state, action, pending] = useActionState<MessageFormState, FormData>(
    sendMessageAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.sent) formRef.current?.reset();
  }, [state?.sent]);

  return (
    <form ref={formRef} action={action} className="mt-4">
      {state?.error ? (
        <p
          role="alert"
          className="mb-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
        >
          {state.error}
        </p>
      ) : null}
      {state?.suspended ? (
        <p
          role="alert"
          className="mb-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white"
        >
          {fr.messages.compteSuspendu}
        </p>
      ) : state?.escalated ? (
        <p
          role="alert"
          className="mb-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200"
        >
          {fr.messages.avertissementEscalade}
        </p>
      ) : state?.masked ? (
        <p className="mb-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          {fr.messages.avertissementMasque}
        </p>
      ) : state?.warned ? (
        <p className="mb-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
          {fr.messages.avertissementSollicitation}
        </p>
      ) : null}
      <input type="hidden" name="bookingId" value={bookingId} />
      <textarea
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder={fr.messages.placeholder}
        className="w-full resize-none rounded-2xl border border-darna/15 bg-white px-4 py-3 text-sm text-ink focus:border-darna focus:outline-none"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {pending ? fr.common.chargement : fr.common.envoyer}
        </button>
      </div>
    </form>
  );
}
