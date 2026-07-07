import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleHostInvoice } from "@/lib/host-invoicing";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

/**
 * Webhook Konnect dédié au règlement d'une HostInvoice (commission Rail 2 —
 * PAIEMENT_SUR_PLACE_ROADMAP.md §PSP4). Miroir exact de
 * src/app/api/payments/konnect/webhook/route.ts (réservation voyageur),
 * appliqué à une facture hôte plutôt qu'à une réservation.
 *
 * Appelé en GET par Konnect avec `?payment_ref=<ref>` ajouté à l'URL fournie
 * à l'init-payment. `iid`/`sig` = identifiant de facture SIGNÉ à l'init
 * (signKonnectWebhook, réutilisée telle quelle — elle signe une string
 * générique, pas spécifiquement un bookingId).
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success` sur
 *     /dashboard/factures/[id], qui appelle le même settleHostInvoice.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const paymentRef = params.get("payment_ref");
  const iid = params.get("iid");
  const sig = params.get("sig");

  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Garde d'authenticité : sans iid/sig valides, on refuse net (401) — un
  // payment_ref connu mais non signé ne suffit pas à forger un règlement.
  if (!iid || !sig || !verifyKonnectWebhook(iid, sig)) {
    logStructured("warn", "konnect.host_invoice_webhook_bad_signature", { paymentRef, iid });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Anti-abus : borne le nombre d'appels par facture (défense en profondeur).
  if (!(await rateLimit("konnect-host-invoice-webhook", iid))) {
    logStructured("warn", "konnect.host_invoice_webhook_rate_limited", { iid });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleHostInvoice({ invoiceId: iid });
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.host_invoice_webhook", {
    iid,
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
