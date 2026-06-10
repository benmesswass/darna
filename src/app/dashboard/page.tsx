import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  if (user.role === "HOTE" || user.role === "AGENCE") {
    redirect("/dashboard/annonces");
  }
  redirect("/dashboard/reservations");
}
