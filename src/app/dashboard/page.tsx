import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/session";
import { VERIF_SKIP_COOKIE } from "@/actions/onboarding";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  // Mise en avant des vérifications à la connexion : tant que l'utilisateur
  // n'a pas tout vérifié ET n'a pas cliqué « Passer pour l'instant », on l'amène
  // sur l'assistant. Non bloquant (le cookie de report le libère ensuite).
  const emailOk = user.emailVerified;
  const idOk = user.kycStatus === "VERIFIE" || user.kycStatus === "DEMO_VERIFIE";
  const skipped = (await cookies()).get(VERIF_SKIP_COOKIE);
  if (!skipped && (!emailOk || !idOk)) {
    redirect("/dashboard/verifications?welcome=1");
  }

  if (user.role === "HOTE" || user.role === "AGENCE") {
    redirect("/dashboard/annonces");
  }
  redirect("/dashboard/reservations");
}
