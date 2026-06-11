import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { KycFlow } from "@/components/dashboard/KycFlow";

export default async function KycPage() {
  const fr = await getT();
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
