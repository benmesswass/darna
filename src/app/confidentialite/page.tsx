import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { LegalArticle } from "@/components/legal/LegalArticle";

export const metadata: Metadata = {
  title: frMeta.pagesLegales.confidentialiteTitre,
};

export default async function ConfidentialitePage() {
  const fr = await getT();
  return (
    <LegalArticle
      titre={fr.pagesLegales.confidentialiteTitre}
      content={fr.pagesLegales.confidentialite}
    />
  );
}
