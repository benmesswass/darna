import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/redirect";
import { isCaptchaEnabled, turnstileSiteKey } from "@/lib/turnstile";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: frMeta.auth.inscriptionTitre };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; callbackUrl?: string }>;
}) {
  const fr = await getT();
  const { role, callbackUrl } = await searchParams;
  const cb = safeCallbackUrl(callbackUrl);
  const user = await getSessionUser();
  if (user) redirect(cb);

  // Rôle pré-sélectionné depuis le CTA « devenir hôte » (jamais ADMIN).
  const defaultRole = role === "HOTE" || role === "AGENCE" ? role : "VOYAGEUR";

  // CAPTCHA (dual-mode) : clé publique + nonce CSP transmis au widget si actif.
  const captchaSiteKey = isCaptchaEnabled() ? turnstileSiteKey() : "";
  const captchaNonce = captchaSiteKey
    ? (await headers()).get("x-nonce") ?? undefined
    : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center text-3xl font-bold text-darna">
        {fr.auth.inscriptionTitre}
      </h1>
      <div className="mt-8 rounded-3xl bg-white p-7 shadow-sm ring-1 ring-darna/10">
        <RegisterForm
          defaultRole={defaultRole}
          callbackUrl={callbackUrl ? cb : undefined}
          captchaSiteKey={captchaSiteKey}
          captchaNonce={captchaNonce}
        />
      </div>
    </div>
  );
}
