import { getT } from "@/lib/i18n/server";

type LegalSection = { titre: string; corps: string[] };
type LegalContent = { intro: string; sections: LegalSection[] };

/**
 * Mise en page commune des pages légales (CGU, mentions, confidentialité).
 * Composant serveur : le contenu vient des dictionnaires i18n via `getT()`.
 */
export async function LegalArticle({
  titre,
  content,
  avertissement,
}: {
  titre: string;
  content: LegalContent;
  // Texte d'avertissement en pied de page — par défaut le texte générique CGU
  // (fr.pagesLegales.avertissement) ; permet une variante plus spécifique
  // (ex. CGU hôte / réserve de validation juridique sur le régime de facturation).
  avertissement?: string;
}) {
  const fr = await getT();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-heading">{titre}</h1>
      <p className="mt-2 text-sm text-muted">{fr.pagesLegales.miseAJour}</p>

      <p className="mt-6 text-body/80">{content.intro}</p>

      <div className="mt-8 space-y-8">
        {content.sections.map((section) => (
          <section key={section.titre}>
            <h2 className="text-lg font-semibold text-heading">{section.titre}</h2>
            <div className="mt-2 space-y-2 text-body/70">
              {section.corps.map((paragraphe, i) => (
                <p key={i}>{paragraphe}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 rounded-2xl bg-sand/40 p-4 text-sm text-muted ring-1 ring-darna/10">
        {avertissement ?? fr.pagesLegales.avertissement}
      </p>
    </div>
  );
}
