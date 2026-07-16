import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { subscribeAgencyPlanAction } from "@/actions/subscriptions";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { AGENCY_PLANS } from "@/lib/constants";
import { isKonnectEnabled } from "@/lib/konnect";
import {
  activeListingsLimit,
  countActiveListings,
  isSubscriptionActive,
} from "@/lib/subscriptions";
import { SubscriptionPayButton } from "@/components/dashboard/SubscriptionPayButton";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { CheckIcon, CoinsIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.abonnement.titre };

// Palier unique pour l'instant (cf. MONETISATION_IMMO_ROADMAP.md §MI1) : pas
// de sélecteur de palier tant qu'un second palier n'existe pas.
const plan = AGENCY_PLANS[0];

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ konnect?: string }>;
}) {
  const fr = await getT();
  const { konnect } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "AGENCE") redirect("/dashboard/annonces");

  const konnectEnabled = isKonnectEnabled();

  let subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });

  // Retour de la passerelle Konnect : on règle (idempotent) avant l'affichage,
  // filet de sécurité si le webhook n'a pas (encore) abouti — indispensable en
  // dev local où Konnect ne joint pas localhost (même patron que /dashboard/
  // annonces/[id]/a-la-une).
  if (konnectEnabled && konnect === "success" && subscription) {
    await settleSubscriptionPayment({ subscriptionId: subscription.id });
    subscription = await prisma.subscription.findUnique({ where: { userId: user.id } });
  }

  const activeCount = await countActiveListings(user.id);
  const isActive = isSubscriptionActive(subscription);
  const limit = activeListingsLimit(user.role, subscription);
  const quotaAtteint = activeCount >= limit;

  const advantages = [
    fr.abonnement.annoncesIncluses(plan.listingsIncluded),
    fr.abonnement.quotaActuel(activeCount, limit),
  ];

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard/annonces"
        className="inline-flex items-center gap-1 text-sm font-medium text-body/60 hover:text-heading"
      >
        ← {fr.dashboard.mesAnnonces}
      </Link>

      <div className="mt-4 rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-heading">
          <CoinsIcon width={24} height={24} className="text-amber-500" />
          {fr.abonnement.titre}
        </h1>
        <p className="mt-2 text-sm text-body/70">{fr.abonnement.sousTitre}</p>

        <div className="mt-4 rounded-2xl bg-cream p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-body/50">
            {fr.abonnement.planLabel(plan.label)}
          </p>
          <p className="mt-0.5 font-semibold text-body">
            {isActive && subscription?.currentPeriodEnd
              ? fr.abonnement.statutActif(formatDateFr(subscription.currentPeriodEnd))
              : fr.abonnement.statutInactif}
          </p>
        </div>

        <ul className="mt-5 space-y-3">
          {advantages.map((a) => (
            <li key={a} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-400 text-darna-dark">
                <CheckIcon width={13} height={13} strokeWidth={3} />
              </span>
              <span className="text-sm font-semibold text-body">{a}</span>
            </li>
          ))}
        </ul>

        {!isActive ? (
          <p className="mt-5 rounded-xl bg-cream px-4 py-3 text-xs font-medium text-body/70">
            {fr.abonnement.quotaGratuitInfo(limit)}
          </p>
        ) : null}

        {quotaAtteint ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {fr.abonnement.quotaAtteintAlerte}
          </p>
        ) : null}

        {isActive && subscription?.currentPeriodEnd ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
            {fr.abonnement.prolongerInfo(formatDateFr(subscription.currentPeriodEnd))}
          </p>
        ) : null}

        <dl className="mt-5 space-y-2.5 border-t border-darna/10 pt-5 text-sm">
          <div className="flex justify-between border-t border-darna/10 pt-3 first:border-t-0 first:pt-0">
            <dt className="text-base font-bold text-heading">{fr.abonnement.prixMensuel}</dt>
            <dd>
              <Price amount={plan.priceTND} className="text-xl font-bold text-heading" />
            </dd>
          </div>
        </dl>

        {!konnectEnabled ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-sand-light/50 px-4 py-3 text-xs font-medium text-darna-dark">
            <CoinsIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {fr.abonnement.mockInfo}
          </p>
        ) : konnect === "fail" ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {fr.abonnement.paiementEchoue}
          </p>
        ) : konnect === "success" ? (
          <p className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-sand-light/50 px-4 py-2.5 text-sm font-medium text-darna-dark">
            {fr.abonnement.paiementEnVerification}
            <Link href="/dashboard/abonnement" className="shrink-0 font-bold underline">
              {fr.abonnement.actualiser}
            </Link>
          </p>
        ) : null}

        {konnectEnabled ? (
          <SubscriptionPayButton
            plan={plan.key}
            label={isActive ? fr.abonnement.renouveler : fr.abonnement.souscrire}
          />
        ) : (
          <form action={subscribeAgencyPlanAction} className="mt-5">
            <input type="hidden" name="plan" value={plan.key} />
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-6 py-3.5 text-base font-bold text-darna-dark transition hover:bg-amber-300"
            >
              <CoinsIcon width={18} height={18} />
              {isActive ? fr.abonnement.renouveler : fr.abonnement.payer}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-body/50">{fr.abonnement.garantie}</p>
      </div>
    </div>
  );
}
