import type { Metadata } from "next";
import Link from "next/link";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { stayEnabled, immoEnabled } from "@/lib/modes";
import { TYPES_BY_VERTICAL, type PropertyType } from "@/lib/constants";
import { RevenueSimulatorForm } from "@/components/marketing/RevenueSimulatorForm";

export const metadata: Metadata = {
  title: frMeta.simulateur.titre,
  description: frMeta.simulateur.sousTitre,
};

export default async function CombienGagnerPage() {
  const [fr, user] = await Promise.all([getT(), getSessionUser()]);

  const allowedTypes: PropertyType[] = [
    ...(stayEnabled() ? TYPES_BY_VERTICAL.STAY : []),
    ...(immoEnabled() ? TYPES_BY_VERTICAL.IMMO : []),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-heading">{fr.simulateur.titre}</h1>
      <p className="mt-2 max-w-2xl text-body/60">{fr.simulateur.sousTitre}</p>

      <div className="mt-8">
        <RevenueSimulatorForm allowedTypes={allowedTypes} isLoggedIn={Boolean(user)} />
      </div>

      <section className="mt-12 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <h2 className="text-lg font-bold text-heading">{fr.simulateur.methodologie}</h2>
        <p className="mt-2 text-sm leading-relaxed text-body/70">
          {fr.simulateur.methodologieTexte}
        </p>
        <Link
          href="/prix-du-marche"
          className="mt-4 inline-block text-sm font-semibold text-darna hover:text-darna-light"
        >
          {fr.simulateur.voirIndice} →
        </Link>
      </section>
    </div>
  );
}
