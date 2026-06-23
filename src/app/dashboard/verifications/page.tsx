import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { VerificationsAssistant } from "@/components/dashboard/VerificationsAssistant";

export const metadata = { title: "Vérifications — Darna" };

export default async function VerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const { welcome } = await searchParams;

  return (
    <VerificationsAssistant
      emailVerified={user.emailVerified}
      phoneVerified={user.phoneVerified}
      kycStatus={user.kycStatus}
      role={user.role}
      welcome={welcome === "1"}
    />
  );
}
