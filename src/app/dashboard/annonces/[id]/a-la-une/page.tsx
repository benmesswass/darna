import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { featureListingAction } from "@/actions/properties";
import { FEATURED_DURATION_DAYS, FEATURED_PRICE_TND } from "@/lib/config";
import { isListingFeatured } from "@/lib/listings";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { ArrowRightIcon, CheckIcon, CoinsIcon, StarIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.alaUne.titre };

export default async function AlaUnePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      city: true,
      status: true,
      expiresAt: true,
      featuredUntil: true,
      ownerId: true,
    },
  });
  // Autorisation : la page n'est accessible qu'au propriétaire de l'annonce.
  if (!property || property.ownerId !== user.id) notFound();

  const eligible =
    property.status === "ACTIVE" && property.expiresAt.getTime() > Date.now();
  const alreadyFeatured = isListingFeatured(property.featuredUntil);

  const advantages = [
    { titre: fr.alaUne.avantage1Titre, desc: fr.alaUne.avantage1Desc },
    { titre: fr.alaUne.avantage2Titre, desc: fr.alaUne.avantage2Desc },
    { titre: fr.alaUne.avantage3Titre, desc: fr.alaUne.avantage3Desc },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/annonces"
        className="inline-flex items-center gap-1 text-sm font-medium text-body/60 hover:text-heading"
      >
        ← {fr.alaUne.retour}
      </Link>

      <div className="mt-4 rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
          <StarIcon width={24} height={24} className="fill-amber-400 text-amber-400" />
          {fr.alaUne.titre}
        </h1>
        <p className="mt-2 text-sm text-body/70">{fr.alaUne.sousTitre}</p>

        <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body/50">
            {fr.alaUne.annonce}
          </p>
          <p className="mt-0.5 font-semibold text-body">{property.title}</p>
          <p className="text-body/60">{property.city}</p>
        </div>

        {/* Argumentaire — pourquoi passer à la une */}
        <ul className="mt-5 space-y-3">
          {advantages.map((a) => (
            <li key={a.titre} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-darna-dark">
                <CheckIcon width={13} height={13} strokeWidth={3} />
              </span>
              <span className="text-sm">
                <span className="font-semibold text-body">{a.titre}</span>
                <span className="block text-body/60">{a.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        {eligible ? (
          <>
            {alreadyFeatured && property.featuredUntil ? (
              <p className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
                {fr.alaUne.prolongerInfo(formatDateFr(property.featuredUntil))}
              </p>
            ) : null}

            <dl className="mt-5 space-y-2.5 border-t border-darna/10 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-body/70">{fr.alaUne.duree}</dt>
                <dd className="font-semibold text-body">
                  {fr.alaUne.dureeValeur(FEATURED_DURATION_DAYS)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-body/70">{fr.alaUne.prix}</dt>
                <dd>
                  <Price amount={FEATURED_PRICE_TND} className="font-semibold" />
                </dd>
              </div>
              <div className="flex justify-between border-t border-darna/10 pt-3">
                <dt className="text-base font-bold text-heading">{fr.alaUne.total}</dt>
                <dd>
                  <Price
                    amount={FEATURED_PRICE_TND}
                    className="text-xl font-bold text-heading"
                  />
                </dd>
              </div>
            </dl>

            <p className="mt-5 flex items-start gap-2 rounded-xl bg-sand-light/50 px-4 py-3 text-xs font-medium text-darna-dark">
              <CoinsIcon width={16} height={16} className="mt-0.5 shrink-0" />
              {fr.alaUne.mockInfo}
            </p>

            <form action={featureListingAction} className="mt-5">
              <input type="hidden" name="propertyId" value={property.id} />
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-amber-300"
              >
                <StarIcon width={18} height={18} className="fill-current" />
                {alreadyFeatured ? fr.dashboard.prolongerALaUne : fr.alaUne.payer}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-body/50">{fr.alaUne.garantie}</p>
          </>
        ) : (
          <div className="mt-5 rounded-2xl bg-red-50 p-5 text-center">
            <p className="text-sm font-semibold text-red-700">{fr.alaUne.indisponible}</p>
            <Link
              href="/dashboard/annonces"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-heading hover:text-darna-light"
            >
              {fr.alaUne.retour}
              <ArrowRightIcon width={15} height={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
