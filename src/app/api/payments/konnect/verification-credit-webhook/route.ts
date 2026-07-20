import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleVerificationCreditOrder } from "@/lib/verification-credit-payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";

/**
 * Webhook Konnect dédié au règlement d'un achat de lot de crédits de
 * vérification Wakil (MONETISATION_IMMO_ROADMAP.md §MI3). Miroir exact de
 * src/app/api/payments/konnect/featured-webhook/route.ts, appliqué à un
 * VerificationCreditOrder plutôt qu'à un FeaturedOrder.
 *
 * Appelé en GET par Konnect avec `?payment_ref=<ref>` ajouté à l'URL fournie
 * à l'init-payment. `vid`/`sig` = identifiant de commande SIGNÉ à l'init
 * (signKonnectWebhook, réutilisée telle quelle).
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success` sur
 *     /dashboard/abonnement, qui appelle le même settleVerificationCreditOrder.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const paymentRef = params.get("payment_ref");
  const vid = params.get("vid");
  const sig = params.get("sig");

  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Garde d'authenticité : sans vid/sig valides, on refuse net (401) — un
  // payment_ref connu mais non signé ne suffit pas à forger un règlement.
  if (!vid || !sig || !verifyKonnectWebhook(vid, sig)) {
    logStructured("warn", "konnect.verification_credit_webhook_bad_signature", { paymentRef, vid });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Anti-abus : borne le nombre d'appels par commande (défense en profondeur).
  if (!(await rateLimit("konnect-verification-credit-webhook", vid))) {
    logStructured("warn", "konnect.verification_credit_webhook_rate_limited", { vid });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleVerificationCreditOrder({ orderId: vid });
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.verification_credit_webhook", {
    vid,
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
