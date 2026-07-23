import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { clearPropertyPromoAction } from "@/actions/properties";
import { isPropertyPromoActive } from "@/lib/listings";
import { formatDateFr, formatTndServer } from "@/lib/format";
import { PropertyPromoForm } from "@/components/dashboard/PropertyPromoForm";
import { ArrowRightIcon, CoinsIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.promo.titre };

const propertySelect = {
  id: true,
  slug: true,
  title: true,
  city: true,
  status: true,
  expiresAt: true,
  verified: true,
  vertical: true,
  price: true,
  promoPrice: true,
  promoUntil: true,
  ownerId: true,
} as const;

export default async function PromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const property = await prisma.property.findUnique({ where: { id }, select: propertySelect });
  // Autorisation : la page n'est accessible qu'au propriétaire de l'annonce.
  if (!property || property.ownerId !== user.id) notFound();

  // Réservé aux annonces vérifiées ACTIVE ET Séjour (un prix promo n'a de
  // sens qu'à la nuitée), même garde que setPropertyPromoAction.
  const canSetPromo =
    property.status === "ACTIVE" &&
    property.expiresAt.getTime() > Date.now() &&
    property.verified &&
    property.vertical === "STAY";
  const promoActive = isPropertyPromoActive(property.promoUntil);
  // Une annonce non-Séjour qui porte déjà une promo (posée avant ce
  // correctif) doit rester retirable même si elle ne peut plus en recevoir
  // une nouvelle — sinon l'hôte n'a plus aucun moyen de la nettoyer.
  const canManagePromo = canSetPromo || promoActive;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/annonces"
        className="inline-flex items-center gap-1 text-sm font-medium text-body/60 hover:text-heading"
      >
        ← {fr.promo.retour}
      </Link>

      <div className="mt-4 rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
          <CoinsIcon width={24} height={24} className="text-emerald-500" />
          {fr.promo.titre}
        </h1>
        <p className="mt-2 text-sm text-body/70">{fr.promo.sousTitre}</p>

        <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body/50">
            {fr.promo.annonce}
          </p>
          <p className="mt-0.5 font-semibold text-body">{property.title}</p>
          <p className="text-body/60">{property.city}</p>
          <p className="mt-2 text-sm font-semibold text-heading">
            {fr.promo.prixActuel(formatTndServer(property.price))}
          </p>
        </div>

        {canManagePromo ? (
          <>
            {promoActive && property.promoPrice !== null && property.promoUntil ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                <p className="text-sm font-semibold text-emerald-800">{fr.promo.actifTitre}</p>
                <p className="mt-1 text-xs text-emerald-700/80">
                  {fr.promo.actifDesc(
                    formatTndServer(property.promoPrice),
                    formatDateFr(property.promoUntil)
                  )}
                </p>
                <form action={clearPropertyPromoAction} className="mt-3">
                  <input type="hidden" name="propertyId" value={property.id} />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-red-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                  >
                    {fr.promo.retirer}
                  </button>
                </form>
              </div>
            ) : null}

            {canSetPromo ? (
              <>
                <PropertyPromoForm propertyId={property.id} price={property.price} />
                <p className="mt-4 text-center text-xs text-body/50">{fr.promo.garantie}</p>
              </>
            ) : null}
          </>
        ) : (
          <div className="mt-5 rounded-2xl bg-red-50 p-5 text-center">
            <p className="text-sm font-semibold text-red-700">{fr.promo.indisponible}</p>
            <Link
              href="/dashboard/annonces"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:text-darna-light"
            >
              {fr.promo.retour}
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
