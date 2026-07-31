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
import { HostVerificationDemoPayButton } from "@/components/dashboard/HostVerificationDemoPayButton";
import { activeListingsLimit, cheapestPlanForQuota, countActiveListings } from "@/lib/subscriptions";
import { verificationCreditsRemaining } from "@/lib/verification-credits";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import { isKonnectEnabled } from "@/lib/konnect";
import { HOST_VERIFICATION_PRICE_TND } from "@/lib/config";
import { computeListingCompleteness } from "@/lib/listing-completeness";
import { growthMonetizationEnabled } from "@/lib/modes";

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
    include: {
      photos: { orderBy: { position: "asc" }, take: 1 },
      _count: { select: { photos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const nowMs = Date.now();

  // Un HOTE peut avoir PLUSIEURS annonces non vérifiées alors que le solde de
  // crédits (partagé, cf. src/lib/verification-credits.ts) n'en couvre qu'une
  // partie : ce compteur, incrémenté au fil du `.map()` ci-dessous, ne marque
  // « crédit prêt » que sur les N premières annonces non vérifiées couvertes
  // par `hostVerificationCredits` — jamais sur toutes en même temps.
  let hostUnverifiedRank = 0;

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

      {/* Publicité : pousser l'hôte à mettre ses annonces à la une.
          P6.2 (ROADMAP.md) : masquée avant lancement — on ne vend pas de la
          visibilité sur une place vide. Le bouton "mettre à la une" par
          annonce plus bas reste affiché (mène aux rails gratuits éventuels
          — abonnement Pro, Super-Hôte — gérés sur la page cible elle-même). */}
      {properties.length > 0 && growthMonetizationEnabled() ? (
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
          <p className="mt-1 text-sm text-muted">{fr.dashboard.aucuneAnnonceCta}</p>
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
            const needsHostVerificationPayment = user.role === "HOTE" && !p.verified;
            const hostCreditReady =
              needsHostVerificationPayment && (hostVerificationCredits ?? 0) > hostUnverifiedRank;
            if (needsHostVerificationPayment) hostUnverifiedRank += 1;
            // Promo hôte (§PM1) : réservée aux annonces vérifiées ACTIVE ET
            // Séjour, comme setPropertyPromoAction — pas de promo sur du stock
            // non fiable, et un prix promo n'a de sens qu'à la nuitée.
            const promoActive =
              p.verified && isPropertyPromoActive(p.promoUntil) && p.promoPrice !== null;
            const canSetPromo =
              p.status === "ACTIVE" && !isExpired && p.verified && p.vertical === "STAY";
            // Une annonce non-Séjour avec une promo déjà posée (avant ce
            // correctif) doit rester joignable pour la retirer.
            const canManagePromo = canSetPromo || promoActive;
            // Complétude d'annonce (§G2) : uniquement affichée pour une
            // annonce encore "en jeu" et non déjà complète — pas de bruit
            // pour un stock loué/vendu/expiré ou déjà exemplaire.
            const showCompleteness =
              (p.status === "EN_ATTENTE_VALIDATION" || p.status === "ACTIVE") && !isExpired;
            const completeness = showCompleteness
              ? computeListingCompleteness({
                  photoCount: p._count.photos,
                  description: p.description,
                  amenities: p.amenities,
                })
              : null;

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
                  <p className="text-sm text-muted">
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
                          : "text-muted"
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
                  {/* Complétude d'annonce (§G2) : masquée dès que l'annonce
                      remplit les 3 critères — pas de bruit pour une annonce
                      déjà exemplaire. */}
                  {completeness && completeness.score < completeness.total ? (
                    <div className="mt-1.5 rounded-lg bg-sand-light/40 px-2.5 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-darna-dark">
                          {fr.dashboard.completudeTitre(completeness.score, completeness.total)}
                        </p>
                        <Link
                          href={`/dashboard/annonces/${p.id}/modifier`}
                          className="shrink-0 text-xs font-semibold text-heading underline"
                        >
                          {fr.dashboard.completudeCta}
                        </Link>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div
                          className="h-full rounded-full bg-darna"
                          style={{
                            width: `${Math.round(
                              (completeness.score / completeness.total) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-muted">
                        {[
                          !completeness.photosOk ? fr.dashboard.completudePhotos : null,
                          !completeness.descriptionOk ? fr.dashboard.completudeDescription : null,
                          !completeness.amenitiesOk ? fr.dashboard.completudeEquipements : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
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
                  {canManagePromo ? (
                    <Link
                      href={`/dashboard/annonces/${p.id}/promo`}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-100 px-3.5 py-2 text-center text-xs font-bold text-emerald-800 hover:bg-emerald-200"
                    >
                      {fr.dashboard.promoLien}
                    </Link>
                  ) : null}
                  {/* Vérification Wakil payante (§MI3, HOTE uniquement) : à
                      l'unité, jamais gratuite — cf. src/actions/host-verification-payments.ts.
                      hostCreditReady (calculé plus haut via hostUnverifiedRank) masque
                      prix/bouton dès qu'un crédit du solde est déjà réservé pour CETTE
                      annonce, pour ne pas laisser l'hôte repayer/recliquer sans retour
                      visible (cause des soldes qui s'empilent sans qu'aucune annonce ne
                      passe vérifiée). */}
                  {needsHostVerificationPayment ? (
                    <div className="w-full">
                      {hostCreditReady ? (
                        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-[11px] font-semibold text-emerald-700">
                          {fr.dashboard.verifWakilCreditPret}
                        </p>
                      ) : (
                        <>
                          <p className="mb-1 text-center text-[11px] text-muted">
                            {fr.dashboard.verifWakilPrix} : <Price amount={HOST_VERIFICATION_PRICE_TND} />
                          </p>
                          {konnectEnabled ? (
                            <HostVerificationPayButton label={fr.dashboard.verifWakilPayer} />
                          ) : (
                            <HostVerificationDemoPayButton label={fr.dashboard.verifWakilPayerSimulation} />
                          )}
                        </>
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
