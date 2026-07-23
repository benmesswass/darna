import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleFeaturedOrder } from "@/lib/featured-payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

/**
 * Webhook Konnect dédié au règlement d'un FeaturedOrder (mise à la une —
 * MONETISATION_IMMO_ROADMAP.md §MI0). Miroir exact de
 * src/app/api/payments/konnect/host-invoice-webhook/route.ts, appliqué à un
 * FeaturedOrder plutôt qu'à une HostInvoice.
 *
 * Appelé en GET par Konnect avec `?payment_ref=<ref>` ajouté à l'URL fournie
 * à l'init-payment. `fid`/`sig` = identifiant de commande SIGNÉ à l'init
 * (signKonnectWebhook, réutilisée telle quelle — elle signe une string
 * générique, pas spécifiquement un bookingId).
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success` sur
 *     /dashboard/annonces/[id]/a-la-une, qui appelle le même
 *     settleFeaturedOrder.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const paymentRef = params.get("payment_ref");
  const fid = params.get("fid");
  const sig = params.get("sig");

  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Garde d'authenticité : sans fid/sig valides, on refuse net (401) — un
  // payment_ref connu mais non signé ne suffit pas à forger un règlement.
  if (!fid || !sig || !verifyKonnectWebhook(fid, sig)) {
    logStructured("warn", "konnect.featured_webhook_bad_signature", { paymentRef, fid });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Anti-abus : borne le nombre d'appels par commande (défense en profondeur).
  if (!(await rateLimit("konnect-featured-webhook", fid))) {
    logStructured("warn", "konnect.featured_webhook_rate_limited", { fid });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleFeaturedOrder({ orderId: fid });
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.featured_webhook", {
    fid,
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
