import { redirect } from "next/navigation";

// Regroupé dans l'assistant unifié « Vérifications » (identité + e-mail).
export default function EmailVerifyPage() {
  redirect("/dashboard/verifications");
}
