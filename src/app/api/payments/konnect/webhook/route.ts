import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleKonnectBooking } from "@/lib/payments";
import { isKonnectEnabled } from "@/lib/konnect";
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

  const result = await settleKonnectBooking({ paymentRef });
  logStructured("info", "konnect.webhook", { paymentRef, result });

  return NextResponse.json({ received: true, result });
}
