"use server";

import { cookies } from "next/headers";
import { VERIF_SKIP_COOKIE } from "@/lib/constants";

/**
 * Onboarding « vérifications » : le filet anti-relance.
 * Tant que l'utilisateur n'a pas tout vérifié, /dashboard le redirige vers
 * l'assistant (cf. src/app/dashboard/page.tsx). « Passer pour l'instant » pose
 * ce cookie pour ne plus forcer l'assistant — l'utilisateur garde l'accès à la
 * page « Vérifications » quand il le souhaite. Non bloquant par construction.
 *
 * NB : la constante VERIF_SKIP_COOKIE vit dans src/lib/constants.ts — un fichier
 * "use server" ne peut exporter que des fonctions async.
 */

/** Pose le cookie de report et laisse le client naviguer vers le dashboard. */
export async function skipVerificationOnboardingAction(): Promise<void> {
  const store = await cookies();
  store.set(VERIF_SKIP_COOKIE, "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    sameSite: "lax",
    httpOnly: true,
  });
}
