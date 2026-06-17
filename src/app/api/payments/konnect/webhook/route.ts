import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleKonnectBooking } from "@/lib/payments";
import { isKonnectEnabled } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

/**
 * Webhook Konnect — appelé en **GET** par Konnect après un paiement, avec
 * `?payment_ref=<ref>`. On ne fait jamais confiance au seul payment_ref : on
 * revérifie le statut auprès de Konnect (settleKonnectBooking → getKonnectPayment).
 * Idempotent — Konnect peut rejouer l'appel.
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success`, qui appelle le même
 *     settleKonnectBooking. En prod, mettre un SITE_URL public et HTTPS.
 *
 * Réponse toujours 200 (sauf payment_ref manquant) : on ne veut pas que Konnect
 * réessaie en boucle sur une erreur métier transitoire qui sera de toute façon
 * rattrapée par la page de retour.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const paymentRef = request.nextUrl.searchParams.get("payment_ref");
  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Anti-abus : borne le nombre d'appels par référence (défense en profondeur).
  // Le règlement est déjà idempotent ET court-circuite une ref déjà réglée avant
  // tout appel Konnect ; ceci empêche seulement le martelage d'une même ref.
  if (!(await rateLimit("konnect-webhook", paymentRef))) {
    logStructured("warn", "konnect.webhook_rate_limited", { paymentRef });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleKonnectBooking({ paymentRef });
  // INTROUVABLE = ref inconnue → signal d'abus potentiel, journalisé en warn.
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.webhook", {
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
