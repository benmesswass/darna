import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { fr as frMeta } from "@/lib/i18n/fr";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { creditBalance, ensureReferralCode, settleHostReferralMilestones } from "@/lib/credits";
import { REFERRAL_SIGNUP_BONUS_TND, SITE_URL } from "@/lib/config";
import { Price } from "@/components/currency/Price";
import { ShareButton } from "@/components/property/ShareButton";
import { formatDateFr } from "@/lib/format";
import { CoinsIcon, UsersIcon } from "@/components/icons";
import type { CreditTransactionMotif } from "@/lib/constants";

export const metadata: Metadata = { title: frMeta.credits.titre };

/** Historique récent — ledger append-only, on ne montre que les derniers mouvements. */
const HISTORY_LIMIT = 10;

export default async function CreditsPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  // Parrainage hôte (§CR2) : jalon vérifié/crédité AVANT la lecture du solde
  // ci-dessous (séquentiel, pas dans le Promise.all — sinon course avec
  // creditBalance qui pourrait lire juste avant que ce crédit soit posé).
  await settleHostReferralMilestones(user.id);

  const [balance, referralCode, transactions] = await Promise.all([
    creditBalance(user.id),
    // Généré paresseusement au premier besoin réel d'affichage/partage — même
    // esprit lazy que le reste du programme de crédits (§CR0).
    ensureReferralCode(user.id),
    prisma.creditTransaction.findMany({
      where: { wallet: { userId: user.id } },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
      select: { id: true, amount: true, motif: true, expiresAt: true, createdAt: true },
    }),
  ]);

  const referralUrl = `${SITE_URL}/inscription?ref=${referralCode}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-heading">{fr.credits.titre}</h1>

      {/* Solde */}
      <div className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-darna/10">
        <p className="flex items-center gap-2 text-sm font-semibold text-body/60">
          <CoinsIcon width={16} height={16} />
          {fr.credits.soldeLabel}
        </p>
        <p className="mt-2">
          <Price amount={balance} className="text-3xl font-bold text-heading" />
        </p>
        <p className="mt-2 text-xs text-body/50">{fr.credits.soldeAide}</p>
      </div>

      {/* Parrainage */}
      <div className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-darna/10">
        <p className="flex items-center gap-2 text-sm font-bold text-heading">
          <UsersIcon width={16} height={16} />
          {fr.credits.parrainageTitre}
        </p>
        <p className="mt-2 text-sm text-body/60">
          {fr.credits.parrainageDesc(REFERRAL_SIGNUP_BONUS_TND)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-xl bg-cream px-4 py-2 font-mono text-sm font-bold tracking-wide text-heading">
            {referralCode}
          </span>
          <ShareButton
            title={fr.credits.titre}
            url={referralUrl}
            message={fr.credits.parrainageMessage(REFERRAL_SIGNUP_BONUS_TND)}
            label={fr.credits.parrainerBouton}
            context="referral"
          />
        </div>
      </div>

      {/* Historique */}
      <div className="rounded-3xl bg-surface p-6 shadow-sm ring-1 ring-darna/10">
        <p className="text-sm font-bold text-heading">{fr.credits.historiqueTitre}</p>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-body/50">{fr.credits.historiqueVide}</p>
        ) : (
          <ul className="mt-3 divide-y divide-darna/10">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-body">
                    {fr.credits.motifLabel(t.motif as CreditTransactionMotif)}
                  </p>
                  <p className="mt-0.5 text-xs text-body/45">
                    {formatDateFr(t.createdAt)}
                    {t.expiresAt ? ` · ${fr.credits.expireLe(formatDateFr(t.expiresAt))}` : ""}
                  </p>
                </div>
                <Price
                  amount={t.amount}
                  className={`shrink-0 font-bold ${t.amount >= 0 ? "text-emerald-700" : "text-body/70"}`}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
