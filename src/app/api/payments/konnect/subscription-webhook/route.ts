import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleSubscriptionPayment } from "@/lib/subscription-payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

/**
 * Webhook Konnect dédié au règlement d'un abonnement agence (souscription ou
 * renouvellement — MONETISATION_IMMO_ROADMAP.md §MI2). Miroir exact de
 * src/app/api/payments/konnect/featured-webhook/route.ts, appliqué à
 * Subscription plutôt qu'à FeaturedOrder.
 *
 * Appelé en GET par Konnect avec `?payment_ref=<ref>` ajouté à l'URL fournie
 * à l'init-payment. `sid`/`sig` = id de l'abonnement SIGNÉ à l'init
 * (signKonnectWebhook, réutilisée telle quelle).
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success` sur
 *     /dashboard/abonnement, qui appelle le même settleSubscriptionPayment.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const paymentRef = params.get("payment_ref");
  const sid = params.get("sid");
  const sig = params.get("sig");

  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Garde d'authenticité : sans sid/sig valides, on refuse net (401) — un
  // payment_ref connu mais non signé ne suffit pas à forger un règlement.
  if (!sid || !sig || !verifyKonnectWebhook(sid, sig)) {
    logStructured("warn", "konnect.subscription_webhook_bad_signature", { paymentRef, sid });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Anti-abus : borne le nombre d'appels par abonnement (défense en profondeur).
  if (!(await rateLimit("konnect-subscription-webhook", sid))) {
    logStructured("warn", "konnect.subscription_webhook_rate_limited", { sid });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleSubscriptionPayment({ subscriptionId: sid });
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.subscription_webhook", {
    sid,
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
