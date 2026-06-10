import type { Metadata } from "next";
import { fr } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: fr.pagesLegales.mentionsTitre };

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-darna">{fr.pagesLegales.mentionsTitre}</h1>
      <p className="mt-6 rounded-2xl bg-white p-6 text-ink/70 ring-1 ring-darna/10">
        {fr.pagesLegales.aRediger}
      </p>
    </div>
  );
}
