import Image from "next/image";
import Link from "next/link";
import { HouseIcon } from "@/components/icons";

// Dégradés de fond par verticale (filet si la photo est absente, et teinte
// d'ambiance derrière une photo claire). Classes LITTÉRALES : Tailwind v4 ne
// génère pas les classes passées dynamiquement en variable.
//  • Séjours = mer turquoise → sable chaud (hospitalité).
//  • Immobilier = vert d'eau → pierre chaude (confiance / investissement).
const VARIANT_BASE: Record<"sejours" | "immobilier", string> = {
  sejours: "bg-[linear-gradient(160deg,#a7d8d4_0%,#f5ecd8_45%,#f5d99a_100%)]",
  immobilier: "bg-[linear-gradient(160deg,#bcdcd5_0%,#eef2ee_50%,#e6ded2_100%)]",
};

/**
 * Bandeau hero d'un catalogue (Séjours / Immobilier).
 * Photo de fond optionnelle (object-cover) ; voile crème en haut-gauche pour la
 * lisibilité du texte bleu nuit ; fondu vers le cream en bas pour que la barre
 * de recherche qui chevauche se fonde dans la page.
 */
export function SectionHero({
  variant,
  title,
  description,
  siteName,
  imageSrc,
  imagePosition = "center",
}: {
  variant: "sejours" | "immobilier";
  title: string;
  description: string;
  /** aria-label du lien retour accueil (nom du site). */
  siteName: string;
  /** Chemin d'une photo de fond (public/). Absent → dégradé d'ambiance seul. */
  imageSrc?: string;
  /**
   * Cadrage de la photo (CSS object-position) : quelle zone reste visible
   * quand l'image est rognée. Ex. "center", "top", "bottom", "center 30%",
   * "left 40%". Défaut : "center".
   */
  imagePosition?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-darna/10 ${VARIANT_BASE[variant]}`}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover"
          style={{ objectPosition: imagePosition }}
        />
      ) : null}
      {/* Voile clair : éclaircit la zone du texte → contraste garanti du bleu nuit. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-cream/90 via-cream/45 to-transparent"
      />
      {/* Fondu vers le cream en bas → raccord avec la barre de recherche. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream"
      />
      <div className="relative px-6 py-10 sm:px-10 sm:py-14">
        {/* Fil d'Ariane : « tu es dans ce catalogue » (≠ accueil). */}
        <nav className="flex items-center gap-2 text-sm text-darna-dark/70">
          <Link
            href="/"
            aria-label={siteName}
            className="inline-flex items-center transition hover:text-darna-dark"
          >
            <HouseIcon width={15} height={15} />
          </Link>
          <span aria-hidden>›</span>
          <span className="font-medium text-darna-dark">{title}</span>
        </nav>
        <h1 className="mt-3 text-3xl font-bold text-darna-dark sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 max-w-xl text-sm font-medium text-body/75 sm:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
