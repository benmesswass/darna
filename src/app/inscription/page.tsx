import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { safeCallbackUrl } from "@/lib/redirect";
import { isCaptchaEnabled, turnstileSiteKey } from "@/lib/turnstile";
import { isGoogleAuthEnabled } from "@/lib/google-auth";
import { RegisterForm } from "@/components/auth/AuthForms";
import { findUserByReferralCode } from "@/lib/credits";

export const metadata: Metadata = { title: frMeta.auth.inscriptionTitre };

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; ref?: string }>;
}) {
  const fr = await getT();
  const { callbackUrl, ref } = await searchParams;
  const cb = safeCallbackUrl(callbackUrl);
  const user = await getSessionUser();
  if (user) redirect(cb);

  // CAPTCHA (dual-mode) : clé publique transmise au widget si le mode est actif.
  const captchaSiteKey = isCaptchaEnabled() ? turnstileSiteKey() : "";

  // Parrainage (§CR1) : vérifié ICI (lecture seule) pour ne montrer la
  // bannière/transmettre le code que s'il est réellement valide — même
  // principe que discountToken sur la page de réservation. Un code
  // invalide/inconnu est simplement ignoré (inscription normale).
  const refCode = ref && (await findUserByReferralCode(ref)) ? ref : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center text-3xl font-bold text-heading">
        {fr.auth.inscriptionTitre}
      </h1>
      <div className="mt-8 rounded-3xl bg-surface p-7 shadow-sm ring-1 ring-darna/10">
        <RegisterForm
          callbackUrl={callbackUrl ? cb : undefined}
          captchaSiteKey={captchaSiteKey}
          refCode={refCode}
          googleEnabled={isGoogleAuthEnabled()}
        />
      </div>
    </div>
  );
}
