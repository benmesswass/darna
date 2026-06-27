import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = { title: frMeta.pagesLegales.cguTitre };

export default async function CguPage() {
  const fr = await getT();
  return (
    <LegalArticle
      titre={fr.pagesLegales.cguTitre}
      content={fr.pagesLegales.cgu}
    />
  );
}
