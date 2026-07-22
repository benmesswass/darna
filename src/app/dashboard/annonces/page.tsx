import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import {
  markPropertyClosedAction,
  republishPropertyAction,
} from "@/actions/properties";
import {
  FeaturedBadge,
  PromoBadge,
  StatusBadge,
  TypeBadge,
  VerifiedBadge,
} from "@/components/property/Badges";
import { PromoPrice } from "@/components/property/PromoPrice";
import { isListingFeatured, isPropertyPromoActive } from "@/lib/listings";
import { formatDateFr } from "@/lib/format";
import { Price } from "@/components/currency/Price";
import { StarIcon } from "@/components/icons";
import { SuccessCheck } from "@/components/ui/SuccessCheck";
import { QuotaReachedModal } from "@/components/dashboard/QuotaReachedModal";
import { HostVerificationPayButton } from "@/components/dashboard/HostVerificationPayButton";
import { activeListingsLimit, cheapestPlanForQuota, countActiveListings } from "@/lib/subscriptions";
import { verificationCreditsRemaining } from "@/lib/verification-credits";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import {
  payHostVerificationDemoAction,
} from "@/actions/host-verification-payments";
import { isKonnectEnabled } from "@/lib/konnect";
import { HOST_VERIFICATION_PRICE_TND } from "@/lib/config";

export default async function MesAnnoncesPage({
  searchParams,
}: {
  searchParams: Promise<{
    creee?: string;
    modifiee?: string;
    alaune?: string;
    quotaAtteint?: string;
    konnect?: string;
    vid?: string;
  }>;
}) {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  const { creee, modifiee, alaune, quotaAtteint, konnect, vid } = await searchParams;
  const konnectEnabled = isKonnectEnabled();

  // Vérification Wakil payante pour les particuliers (MONETISATION_IMMO_ROADMAP.md
  // §MI3, décision Wassim du 2026-07-20) : régime à l'unité, distinct de
  // l'agence — filet de retour Konnect (idempotent), comme /dashboard/abonnement.
  if (user.role === "HOTE" && konnectEnabled && konnect === "success" && vid) {
    await settleVerificationCreditOrder({ orderId: vid });
  }
  const hostVerificationCredits =
    user.role === "HOTE" ? await verificationCreditsRemaining(user.id, user.role) : null;

  const properties = await prisma.property.findMany({
    where: { ownerId: user.id },
    include: { photos: { orderBy: { position: "asc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  });

  const nowMs = Date.now();

  // Modale de quota (MONETISATION_IMMO_ROADMAP.md §MI2) : recalculée ICI,
  // fraîche, plutôt que reçue via l'URL (le signal `quotaAtteint=1` ne
  // transporte qu'un booléen, jamais les chiffres eux-mêmes).
  let quotaModal: {
    utilisees: number;
    limite: number;
    recommendedLabel: string;
    recommendedListings: number;
    recommendedPrice: number;
  } | null = null;
  if (quotaAtteint === "1" && user.role === "AGENCE") {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true, plan: true, currentPeriodEnd: true },
    });
    const limite = activeListingsLimit(user.role, subscription);
    const utilisees = await countActiveListings(user.id);
    // Le palier recommandé doit couvrir les annonces déjà actives + celle
    // qui vient d'être bloquée — jamais un palier trop petit pour être utile.
    const recommended = cheapestPlanForQuota(utilisees + 1);
    quotaModal = {
      utilisees,
      limite,
      recommendedLabel: recommended.label,
      recommendedListings: recommended.listingsIncluded,
      recommendedPrice: recommended.priceTND,
    };
  }

  return (
    <div>
      {quotaModal ? (
        <QuotaReachedModal
          utilisees={quotaModal.utilisees}
          limite={quotaModal.limite}
          recommendedLabel={quotaModal.recommendedLabel}
          recommendedListings={quotaModal.recommendedListings}
          recommendedPrice={quotaModal.recommendedPrice}
        />
      ) : null}

      <h2 className="text-xl font-bold text-heading">{fr.dashboard.mesAnnonces}</h2>

      {creee ? (
        <p className="mt-4 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          <SuccessCheck size={28} />
          {fr.annonceForm.annonceCreee}
        </p>
      ) : null}
      {modifiee ? (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {fr.annonceForm.annonceModifiee}
        </p>
      ) : null}
      {alaune ? (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {fr.dashboard.alaUneSucces}
        </p>
      ) : null}

      {/* Vérification Wakil payante (§MI3, HOTE uniquement) : solde + retour Konnect. */}
      {user.role === "HOTE" && properties.length > 0 ? (
        <>
          <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-xs font-medium text-body/70">
            {fr.dashboard.verifWakilSolde(hostVerificationCredits ?? 0)}
          </p>
          {konnectEnabled && konnect === "fail" && vid ? (
            <p
              role="alert"
              className="mt-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700"
            >
              {fr.abonnement.paiementEchoue}
            </p>
          ) : konnectEnabled && konnect === "success" && vid ? (
            <p className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-sand-light/50 px-4 py-2.5 text-sm font-medium text-darna-dark">
              {fr.abonnement.paiementEnVerification}
              <Link href="/dashboard/annonces" className="shrink-0 font-bold underline">
                {fr.abonnement.actualiser}
              </Link>
            </p>
          ) : null}
        </>
      ) : null}

      {/* Publicité : pousser l'hôte à mettre ses annonces à la une */}
      {properties.length > 0 ? (
        <div className="mt-5 flex items-start gap-4 rounded-3xl bg-gradient-to-r from-amber-400 to-sand p-5 text-darna-dark shadow-sm">
          <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/40 sm:inline-flex">
            <StarIcon width={22} height={22} className="fill-darna-dark" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold">{fr.dashboard.promoAlaUneTitre}</p>
            <p className="mt-0.5 text-sm text-darna-dark/80">
              {fr.dashboard.promoAlaUneDesc}
            </p>
          </div>
        </div>
      ) : null}

      {properties.length === 0 ? (
        <div className="mt-6 rounded-3xl bg-surface p-10 text-center ring-1 ring-darna/10">
          <p className="text-lg font-semibold text-heading">
            {fr.dashboard.aucuneAnnonce}
          </p>
          <p className="mt-1 text-sm text-body/60">{fr.dashboard.aucuneAnnonceCta}</p>
          <Link
            href="/dashboard/annonces/nouvelle"
            className="mt-5 inline-block rounded-full bg-darna px-6 py-2.5 text-sm font-semibold text-white hover:bg-darna-light"
          >
            {fr.dashboard.creerAnnonce}
          </Link>
        </div>
      ) : (
        <ul className="mt-5 space-y-4">
          {properties.map((p) => {
            const isExpired = p.expiresAt.getTime() < nowMs;
            const isPending = p.status === "EN_ATTENTE_VALIDATION";
            const effectiveExpired = isExpired && p.status === "ACTIVE";
            const daysLeft = Math.ceil(
              (p.expiresAt.getTime() - nowMs) / (24 * 60 * 60 * 1000)
            );
            const canClose =
              p.status === "ACTIVE" && (p.type === "LOCATION" || p.type === "VENTE");
            const canRepublish = (p.status !== "ACTIVE" && !isPending) || isExpired;
            const featured = isListingFeatured(p.featuredUntil);
            const canFeature = p.status === "ACTIVE" && !isExpired;
            // Promo hôte (§PM1) : réservée aux annonces vérifiées ACTIVE, comme
            // setPropertyPromoAction — pas de promo sur du stock non fiable.
            const promoActive =
              p.verified && isPropertyPromoActive(p.promoUntil) && p.promoPrice !== null;
            const canPromo = p.status === "ACTIVE" && !isExpired && p.verified;

            return (
              <li
                key={p.id}
                className="flex flex-col gap-4 rounded-3xl bg-surface p-4 ring-1 ring-darna/10 sm:flex-row sm:items-center"
              >
                <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-2xl sm:w-36">
                  {p.photos[0] ? (
                    <Image
                      src={p.photos[0].url}
                      alt={p.photos[0].alt}
                      fill
                      sizes="144px"
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {featured ? <FeaturedBadge small /> : null}
                    {promoActive ? (
                      <PromoBadge
                        small
                        price={p.price}
                        promoPrice={p.promoPrice!}
                        promoUntil={p.promoUntil!}
                      />
                    ) : null}
                    <TypeBadge type={p.type} />
                    {p.verified ? <VerifiedBadge small /> : null}
                    <StatusBadge status={effectiveExpired ? "EXPIREE" : p.status} />
                  </div>
                  <p className="mt-1.5 truncate font-semibold text-body">{p.title}</p>
                  <p className="text-sm text-body/60">
                    {p.city} ·{" "}
                    <PromoPrice
                      price={p.price}
                      promoPrice={p.promoPrice}
                      promoUntil={p.promoUntil}
                      verified={p.verified}
                      className="font-semibold text-heading"
                    />
                  </p>
                  <p
                    className={`mt-0.5 text-xs ${
                      effectiveExpired
                        ? "font-semibold text-red-600"
                        : daysLeft <= 7
                          ? "font-semibold text-amber-600"
                          : "text-body/50"
                    }`}
                  >
                    {fr.dashboard.expireDans(daysLeft)}
                  </p>
                  {featured && p.featuredUntil ? (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-amber-600">
                      <StarIcon width={12} height={12} className="fill-current" />
                      {fr.dashboard.alaUneActif(formatDateFr(p.featuredUntil))}
                    </p>
                  ) : null}
                  {promoActive && p.promoUntil ? (
                    <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                      {fr.dashboard.promoActifBanner(formatDateFr(p.promoUntil))}
                    </p>
                  ) : null}
                  {/* §AHC3 — encart de blocage : l'hôte voit que son annonce est
                      masquée suite à SON annulation, avec la date de réapparition.
                      Filtre paresseux (comparaison à nowMs), pas de cron. */}
                  {p.cancelBlockedUntil && p.cancelBlockedUntil.getTime() > nowMs ? (
                    <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                      {fr.dashboard.annonceMasqueeBanner(formatDateFr(p.cancelBlockedUntil))}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-stretch">
                  <Link
                    href={`/dashboard/annonces/${p.id}/modifier`}
                    className="rounded-xl bg-darna px-3.5 py-2 text-center text-xs font-semibold text-white hover:bg-darna-light"
                  >
                    {fr.annonceForm.modifierTitre}
                  </Link>
                  <Link
                    href={`/annonce/${p.slug}`}
                    className="rounded-xl border border-darna/15 px-3.5 py-2 text-center text-xs font-semibold text-heading hover:bg-darna/5"
                  >
                    {fr.dashboard.voirAnnonce}
                  </Link>
                  {canFeature ? (
                    <Link
                      href={`/dashboard/annonces/${p.id}/a-la-une`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3.5 py-2 text-center text-xs font-bold text-darna-dark hover:bg-amber-300"
                    >
                      <StarIcon width={13} height={13} className="fill-current" />
                      {featured ? fr.dashboard.prolongerALaUne : fr.dashboard.mettreALaUne}
                    </Link>
                  ) : null}
                  {canPromo ? (
                    <Link
                      href={`/dashboard/annonces/${p.id}/promo`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-2 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-200"
                    >
                      {fr.dashboard.promoLien}
                    </Link>
                  ) : null}
                  {/* Vérification Wakil payante (§MI3, HOTE uniquement) : à
                      l'unité, jamais gratuite — cf. src/actions/host-verification-payments.ts. */}
                  {user.role === "HOTE" && !p.verified ? (
                    <div className="w-full">
                      <p className="mb-1 text-center text-[11px] text-body/50">
                        {fr.dashboard.verifWakilPrix} : <Price amount={HOST_VERIFICATION_PRICE_TND} />
                      </p>
                      {konnectEnabled ? (
                        <HostVerificationPayButton label={fr.dashboard.verifWakilPayer} />
                      ) : (
                        <form action={payHostVerificationDemoAction}>
                          <button
                            type="submit"
                            className="w-full rounded-xl bg-amber-400 px-3.5 py-2 text-xs font-bold text-darna-dark hover:bg-amber-300"
                          >
                            {fr.dashboard.verifWakilPayerSimulation}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : null}
                  {canClose ? (
                    <form action={markPropertyClosedAction}>
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-white hover:bg-ink/80"
                      >
                        {p.type === "VENTE"
                          ? fr.dashboard.marquerVendu
                          : fr.dashboard.marquerLoue}
                      </button>
                    </form>
                  ) : null}
                  {canRepublish ? (
                    <form action={republishPropertyAction}>
                      <input type="hidden" name="propertyId" value={p.id} />
                      <button
                        type="submit"
                        className="w-full rounded-xl bg-sand px-3.5 py-2 text-xs font-bold text-darna-dark hover:bg-sand-light"
                      >
                        {fr.dashboard.republier}
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
