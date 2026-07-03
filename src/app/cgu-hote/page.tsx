import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = { title: frMeta.pagesLegales.cguHoteTitre };

export default async function CguHotePage() {
  const fr = await getT();
  return (
    <LegalArticle
      titre={fr.pagesLegales.cguHoteTitre}
      content={fr.pagesLegales.cguHote}
      avertissement={fr.pagesLegales.avertissementJuridique}
    />
  );
}
