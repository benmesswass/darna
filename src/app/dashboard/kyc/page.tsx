import { redirect } from "next/navigation";
import { fr } from "@/lib/i18n/fr";
import { getSessionUser } from "@/lib/session";
import { KycFlow } from "@/components/dashboard/KycFlow";

export default async function KycPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.kyc}</h2>
      <div className="mt-5 max-w-2xl">
        <KycFlow initialStatus={user.kycStatus} />
      </div>
    </div>
  );
}
