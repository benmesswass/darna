"use client";

import { useActionState } from "react";
import {
  createContactRequestAction,
  type ContactFormState,
} from "@/actions/contact";
import { useT } from "@/components/i18n/LocaleProvider";
import { WhatsAppIcon } from "@/components/icons";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-darna/15 bg-cream px-3.5 py-2.5 text-sm outline-none focus:border-darna";

export function ContactForm({
  propertyId,
  propertyTitle,
  whatsappHref,
  defaults,
  captchaSiteKey = "",
}: {
  propertyId: string;
  propertyTitle: string;
  whatsappHref: string | null;
  defaults: { name: string; email: string; phone: string };
  captchaSiteKey?: string;
}) {
  const fr = useT();
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    createContactRequestAction,
    undefined
  );

  if (state?.success) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700"
      >
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-3.5">
      {state?.error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <input type="hidden" name="propertyId" value={propertyId} />
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">{fr.contact.nom}</span>
          <input
            name="name"
            type="text"
            required
            minLength={2}
            defaultValue={defaults.name}
            className={inputClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-muted">{fr.contact.email}</span>
          <input
            name="email"
            type="email"
            required
            defaultValue={defaults.email}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-muted">{fr.contact.telephone}</span>
        <input
          name="phone"
          type="tel"
          required
          defaultValue={defaults.phone}
          className={inputClass}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-muted">{fr.contact.message}</span>
        <textarea
          name="message"
          required
          minLength={10}
          rows={4}
          defaultValue={fr.contact.messageDefaut(propertyTitle)}
          className={inputClass}
        />
      </label>
      <TurnstileWidget siteKey={captchaSiteKey} />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-darna px-6 py-2.5 text-sm font-bold text-white transition hover:bg-darna-light disabled:opacity-60"
        >
          {pending ? fr.common.chargement : fr.contact.envoyer}
        </button>
        {whatsappHref ? (
          <span className="flex items-center gap-2 text-sm text-muted">
            {fr.contact.ouWhatsapp}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-[#128C7E] underline"
            >
              <WhatsAppIcon width={17} height={17} />
              {fr.property.whatsapp}
            </a>
          </span>
        ) : null}
      </div>
    </form>
  );
}
