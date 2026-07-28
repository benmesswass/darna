import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { subscribeAgencyPlanAction } from "@/actions/subscriptions";
import { buyVerificationCreditPackDemoAction } from "@/actions/verification-credits";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import { AGENCY_PLANS, VERIFICATION_CREDIT_PACKS } from "@/lib/constants";
import { isKonnectEnabled } from "@/lib/konnect";
import {
  activeListingsLimit,
  agencyPlan,
  countActiveListings,
  isSubscriptionActive,
  listingUnitCost,
} from "@/lib/subscriptions";
import { verificationCreditsRemaining } from "@/lib/verification-credits";
import { FREE_VERIFICATION_CREDITS } from "@/lib/config";
import { SubscriptionPayButton } from "@/components/dashboard/SubscriptionPayButton";
import { VerificationCreditPayButton } from "@/components/dashboard/VerificationCreditPayButton";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { CoinsIcon, ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: frMeta.abonnement.titre };

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ konnect?: string; vid?: string }>;
}) {
  const fr = await getT();
  const { konnect, vid } = await searchParams;
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

  // Idem pour un achat de lot de crédits de vérification (MI3) — identifié par
  // `vid` (une ligne PAR ACHAT, contrairement à Subscription).
  if (konnectEnabled && konnect === "success" && vid) {
    await settleVerificationCreditOrder({ orderId: vid });
  }
  const verificationCredits = await verificationCreditsRemaining(user.id, user.role);

  const activeCount = await countActiveListings(user.id);
  const isActive = isSubscriptionActive(subscription);
  const currentPlan = subscription ? agencyPlan(subscription.plan) : undefined;
  const limit = activeListingsLimit(user.role, subscription);
  const quotaAtteint = activeCount >= limit;
  // Pitch honnête (pas d'incitation agressive) : nombre concret d'annonces
  // que ce quota empêche de publier.
  const pendingCount = quotaAtteint
    ? await prisma.property.count({
        where: { ownerId: user.id, status: "EN_ATTENTE_VALIDATION" },
      })
    : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/annonces"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-heading"
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
          {isActive && currentPlan && subscription?.currentPeriodEnd ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {fr.abonnement.planLabel(currentPlan.label)}
              </p>
              <p className="mt-0.5 font-semibold text-body">
                {fr.abonnement.statutActif(formatDateFr(subscription.currentPeriodEnd))}
              </p>
            </>
          ) : (
            <p className="font-semibold text-body">{fr.abonnement.statutInactif}</p>
          )}
        </div>

        <p className="mt-3 text-sm font-semibold text-body">
          {fr.abonnement.quotaActuel(activeCount, limit)}
        </p>

        {!isActive ? (
          <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-xs font-medium text-body/70">
            {fr.abonnement.quotaGratuitInfo(limit)}
          </p>
        ) : null}

        {quotaAtteint ? (
          <>
            <p
              role="alert"
              className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {fr.abonnement.quotaAtteintAlerte}
            </p>
            {pendingCount > 0 ? (
              <p className="mt-2 rounded-xl bg-cream px-4 py-2.5 text-xs font-medium text-body/70">
                {fr.abonnement.annoncesEnAttenteBloquees(pendingCount)}
              </p>
            ) : null}
          </>
        ) : null}

        {isActive && subscription?.currentPeriodEnd ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">
            {fr.abonnement.prolongerInfo(formatDateFr(subscription.currentPeriodEnd))}
          </p>
        ) : null}

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

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {AGENCY_PLANS.map((plan) => {
            const isCurrent = isActive && currentPlan?.key === plan.key;
            const label = isCurrent ? fr.abonnement.renouveler : fr.abonnement.souscrire;
            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border p-5 ${
                  isCurrent ? "border-darna ring-2 ring-darna/30" : "border-darna/15"
                }`}
              >
                {isCurrent ? (
                  <span className="absolute -top-2.5 start-4 rounded-full bg-darna px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {fr.abonnement.palierActuelBadge}
                  </span>
                ) : null}
                <p className="font-bold text-heading">{plan.label}</p>
                <p className="mt-1 text-sm text-muted">
                  {fr.abonnement.annoncesIncluses(plan.listingsIncluded)}
                </p>
                <div className="mt-3">
                  <Price amount={plan.priceTND} className="text-2xl font-bold text-heading" />
                </div>
                <p className="mt-1 text-xs text-muted">
                  {fr.abonnement.coutParAnnonce(listingUnitCost(plan))}
                </p>

                {konnectEnabled ? (
                  <SubscriptionPayButton plan={plan.key} label={label} />
                ) : (
                  <form action={subscribeAgencyPlanAction} className="mt-5">
                    <input type="hidden" name="plan" value={plan.key} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-darna-dark transition hover:bg-amber-300"
                    >
                      <CoinsIcon width={16} height={16} />
                      {isCurrent ? fr.abonnement.renouveler : fr.abonnement.payer}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-xs text-muted">{fr.abonnement.garantie}</p>
      </div>

      <div className="mt-6 rounded-3xl bg-surface p-8 ring-1 ring-darna/10">
        <h2 className="flex items-center gap-2 text-xl font-bold text-heading">
          <ShieldIcon width={20} height={20} className="text-amber-500" />
          {fr.abonnement.creditsVerifTitre}
        </h2>
        <p className="mt-2 text-sm text-body/70">
          {fr.abonnement.creditsVerifSousTitre(FREE_VERIFICATION_CREDITS)}
        </p>

        <p className="mt-4 text-sm font-semibold text-body">
          {fr.abonnement.creditsVerifSolde(verificationCredits)}
        </p>

        {verificationCredits <= 0 ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {fr.abonnement.creditsVerifEpuiseAlerte}
          </p>
        ) : null}

        {!konnectEnabled ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl bg-sand-light/50 px-4 py-3 text-xs font-medium text-darna-dark">
            <CoinsIcon width={16} height={16} className="mt-0.5 shrink-0" />
            {fr.abonnement.mockInfo}
          </p>
        ) : konnect === "fail" && vid ? (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
          >
            {fr.abonnement.paiementEchoue}
          </p>
        ) : konnect === "success" && vid ? (
          <p className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-sand-light/50 px-4 py-2.5 text-sm font-medium text-darna-dark">
            {fr.abonnement.paiementEnVerification}
            <Link href="/dashboard/abonnement" className="shrink-0 font-bold underline">
              {fr.abonnement.actualiser}
            </Link>
          </p>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {VERIFICATION_CREDIT_PACKS.map((pack) => (
            <div key={pack.key} className="rounded-2xl border border-darna/15 p-5">
              <p className="font-bold text-heading">
                {fr.abonnement.creditsVerifPackLabel(pack.credits)}
              </p>
              <div className="mt-3">
                <Price amount={pack.priceTND} className="text-2xl font-bold text-heading" />
              </div>

              {konnectEnabled ? (
                <VerificationCreditPayButton pack={pack.key} label={fr.abonnement.creditsVerifAcheter} />
              ) : (
                <form action={buyVerificationCreditPackDemoAction} className="mt-4">
                  <input type="hidden" name="pack" value={pack.key} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 text-sm font-bold text-darna-dark transition hover:bg-amber-300"
                  >
                    <CoinsIcon width={16} height={16} />
                    {fr.abonnement.creditsVerifAcheterSimulation}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
