import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { settleKonnectBooking } from "@/lib/payments";
import { isKonnectEnabled, verifyKonnectWebhook } from "@/lib/konnect";
import { rateLimit } from "@/lib/rate-limit";
import { logStructured } from "@/lib/audit";
import { captureError } from "@/lib/observability";

/**
 * Webhook Konnect — appelé en **GET** par Konnect après un paiement, avec
 * `?payment_ref=<ref>` ajouté à l'URL qu'on lui a fournie à l'init-payment.
 *
 * AUTHENTICITÉ — Konnect ne signe PAS ses webhooks. On signe donc nous-mêmes
 * l'URL à l'init (`?bid=<id>&sig=<HMAC(id)>`, cf. signKonnectWebhook) et on
 * revérifie cette signature ici EN TEMPS CONSTANT avant d'agir. Un `payment_ref`
 * deviné ou fuité (logs, referer) ne suffit plus à déclencher un règlement.
 *
 * On règle ensuite par le `bid` SIGNÉ (source de confiance), pas par le
 * `payment_ref` de l'URL (contrôlable par l'appelant) : la vérification du
 * statut et du montant se fait de toute façon côté serveur via le paymentRef
 * STOCKÉ sur la réservation (settleKonnectBooking → getKonnectPayment).
 * Idempotent — Konnect peut rejouer l'appel.
 *
 * ⚠️  En dev local, Konnect ne peut pas joindre http://localhost. Le filet de
 *     sécurité est la page de retour `?konnect=success`, qui appelle le même
 *     settleKonnectBooking (chemin utilisateur authentifié, hors webhook). En
 *     prod, mettre un SITE_URL public et HTTPS.
 *
 * Réponse 200 sur succès métier ; 400 si paramètres manquants, 401 si signature
 * invalide, 429 si martelage. On ne veut pas que Konnect réessaie en boucle sur
 * une erreur transitoire — rattrapée de toute façon par la page de retour.
 */
export async function GET(request: NextRequest) {
  if (!isKonnectEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const params = request.nextUrl.searchParams;
  const paymentRef = params.get("payment_ref");
  const bid = params.get("bid");
  const sig = params.get("sig");

  if (!paymentRef) {
    return NextResponse.json({ error: "missing payment_ref" }, { status: 400 });
  }

  // Garde d'authenticité : sans `bid`/`sig` valides, on refuse net (401). La
  // signature lie l'appel à UNE réservation précise → empêche de forger un
  // règlement à partir d'un payment_ref connu mais non signé.
  if (!bid || !sig || !verifyKonnectWebhook(bid, sig)) {
    logStructured("warn", "konnect.webhook_bad_signature", { paymentRef, bid });
    await captureError(new Error("konnect.webhook_bad_signature"), { paymentRef, bid });
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  // Anti-abus : borne le nombre d'appels par réservation (défense en profondeur).
  // Le règlement est déjà idempotent ET court-circuite une résa déjà réglée
  // avant tout appel Konnect ; ceci empêche seulement le martelage d'un même id.
  if (!(await rateLimit("konnect-webhook", bid))) {
    logStructured("warn", "konnect.webhook_rate_limited", { bid });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const result = await settleKonnectBooking({ bookingId: bid });
  // INTROUVABLE = id signé mais sans réservation → anomalie, journalisée en warn.
  logStructured(result === "INTROUVABLE" ? "warn" : "info", "konnect.webhook", {
    bid,
    paymentRef,
    result,
  });

  return NextResponse.json({ received: true, result });
}
