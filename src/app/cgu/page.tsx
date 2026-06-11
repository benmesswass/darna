import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: frMeta.pagesLegales.cguTitre };

export default async function CguPage() {
  const fr = await getT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-darna">{fr.pagesLegales.cguTitre}</h1>
      <p className="mt-6 rounded-2xl bg-white p-6 text-ink/70 ring-1 ring-darna/10">
        {fr.pagesLegales.aRediger}
      </p>
    </div>
  );
}
