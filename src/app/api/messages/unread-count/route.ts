import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { countUnreadMessages } from "@/lib/messages";

// Compteur lu à chaud à chaque appel (jamais mis en cache) : c'est une donnée
// par utilisateur connecté, sondée périodiquement par MessagesNotifier.
export const dynamic = "force-dynamic";

/**
 * Renvoie le nombre de messages non lus de l'utilisateur connecté.
 * Réponse : `{ count: number }`. 0 si non connecté (pas d'erreur — la sonde
 * tourne côté client tant que la session est ouverte).
 */
export async function GET() {
  const user = await getSessionUser();
  const count = user ? await countUnreadMessages(user.id) : 0;
  return NextResponse.json(
    { count },
    { headers: { "Cache-Control": "no-store" } }
  );
}
