import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { WakilForm } from "@/components/wakil/WakilForm";
import { isCaptchaEnabled, turnstileSiteKey } from "@/lib/turnstile";
import {
  CheckIcon,
  CoinsIcon,
  MapPinIcon,
  ShieldIcon,
  SparklesIcon,
} from "@/components/icons";

export const metadata: Metadata = {
  title: frMeta.wakil.titre,
  description: frMeta.wakil.sousTitre,
};

export default async function DevenirWakilPage() {
  const fr = await getT();
  const captchaSiteKey = isCaptchaEnabled() ? turnstileSiteKey() : "";
  return (
    <div>
      {/* Hero */}
      <section className="bg-darna text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sand">
            <ShieldIcon width={16} height={16} />
            {fr.nav.devenirWakil}
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            {fr.wakil.titre}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">{fr.wakil.sousTitre}</p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-8">
            {/* Mission */}
            <section className="rounded-3xl bg-surface p-7 ring-1 ring-darna/10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
                <MapPinIcon width={20} height={20} className="text-sand" />
                {fr.wakil.missionTitre}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-body/80">
                {[fr.wakil.mission1, fr.wakil.mission2, fr.wakil.mission3].map((m) => (
                  <li key={m} className="flex items-start gap-2.5">
                    <CheckIcon
                      width={16}
                      height={16}
                      strokeWidth={2.5}
                      className="mt-0.5 shrink-0 text-heading"
                    />
                    {m}
                  </li>
                ))}
              </ul>
            </section>

            {/* Avantages */}
            <section className="rounded-3xl bg-surface p-7 ring-1 ring-darna/10">
              <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
                <CoinsIcon width={20} height={20} className="text-sand" />
                {fr.wakil.avantagesTitre}
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-body/80">
                {[fr.wakil.avantage1, fr.wakil.avantage2, fr.wakil.avantage3].map((a) => (
                  <li key={a} className="flex items-start gap-2.5">
                    <SparklesIcon
                      width={16}
                      height={16}
                      className="mt-0.5 shrink-0 text-sand"
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Candidature persistée (WakilApplication) */}
          <section className="h-fit rounded-3xl bg-surface p-7 ring-1 ring-darna/10 lg:sticky lg:top-20">
            <h2 className="text-xl font-bold text-heading">{fr.wakil.formTitre}</h2>
            <div className="mt-5">
              <WakilForm captchaSiteKey={captchaSiteKey} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
