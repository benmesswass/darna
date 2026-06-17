import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getPropertyBySlug } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { getFavoriteContext } from "@/lib/favorites";
import { formatTndServer } from "@/lib/format";
import { verticalEnabled } from "@/lib/modes";
import { verticalOfType } from "@/lib/constants";
import { StayDetail } from "@/modules/stay/listing/StayDetail";
import { ImmoDetail } from "@/modules/immo/listing/ImmoDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const property = await prisma.property.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      city: true,
      price: true,
      type: true,
      photos: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  // Résolu avant le début du streaming → vrai statut HTTP 404.
  if (!property) notFound();

  const suffix =
    property.type === "SEJOUR"
      ? ` ${frMeta.common.parNuit}`
      : property.type === "LOCATION"
        ? ` ${frMeta.common.parMois}`
        : "";
  const title = `${property.title} — ${property.city}, ${formatTndServer(property.price)}${suffix}`;
  const description = property.description.slice(0, 160);

  return {
    title,
    description,
    alternates: { canonical: `/annonce/${slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "fr_TN",
      images: property.photos[0] ? [{ url: property.photos[0].url }] : undefined,
    },
  };
}

/**
 * Point d'entrée mince de la fiche annonce : résout le slug + le contexte
 * visiteur (partagé aux deux verticales), puis dispatche vers la verticale.
 * L'URL /annonce/[slug] reste canonique (actif SEO) — le split Séjour/Immo est
 * interne (modules stay / immo). Dispatch sur le type tant que le champ
 * `vertical` n'est pas introduit (cf. roadmap PR #3).
 */
export default async function AnnoncePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  // Dates de recherche transmises depuis la liste séjours (arrivee=YYYY-MM-DD) :
  // sert à pré-remplir le nom de dossier favori avec le mois recherché.
  searchParams: Promise<{ arrivee?: string }>;
}) {
  const { slug } = await params;
  const { arrivee } = await searchParams;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  // Verticale du bien désactivée par config → la fiche n'existe pas (404).
  if (!verticalEnabled(verticalOfType(property.type))) notFound();

  const user = await getSessionUser();
  const favCtx = await getFavoriteContext(user?.id);

  return property.type === "SEJOUR" ? (
    <StayDetail property={property} user={user} favCtx={favCtx} arrivee={arrivee} />
  ) : (
    <ImmoDetail property={property} user={user} favCtx={favCtx} arrivee={arrivee} />
  );
}
