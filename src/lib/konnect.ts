/**
 * Client Konnect (passerelle de paiement tunisienne) — séquestre Darna.
 *
 * Intégration OPTIONNELLE et à dégradation gracieuse : sans les variables
 * `KONNECT_API_KEY` + `KONNECT_RECEIVER_WALLET_ID`, le paiement reste en mode
 * démonstration (séquestre simulé, cf. confirmPaymentAction). Dès que ces deux
 * variables sont définies, le flux réel Konnect prend le relais.
 *
 * ⚠️  Module SERVEUR uniquement : il lit des secrets (`KONNECT_API_KEY`) et ne
 *     doit jamais être importé depuis un composant client. Aucune variable
 *     `NEXT_PUBLIC_` ici — la clé ne peut donc pas fuiter côté navigateur.
 *
 * Doc : https://docs.konnect.network/docs/en/api-integration/endpoints/initiate-payment
 */

/** URL de base de l'API Konnect — sandbox par défaut. Prod : https://api.konnect.network/api/v2 */
const KONNECT_API_URL =
  process.env.KONNECT_API_URL ?? "https://api.sandbox.konnect.network/api/v2";

const KONNECT_API_KEY = process.env.KONNECT_API_KEY;
const KONNECT_RECEIVER_WALLET_ID = process.env.KONNECT_RECEIVER_WALLET_ID;

/** Moyens de paiement proposés sur la passerelle (cf. memo Konnect). */
const ACCEPTED_PAYMENT_METHODS = ["wallet", "bank_card", "e-DINAR"] as const;

/** Le TND est libellé en millimes (1 TND = 1000 millimes). */
export function tndToMillimes(tnd: number): number {
  return Math.round(tnd * 1000);
}

/**
 * Vrai si Konnect est configuré. Sert d'aiguillage : `true` → paiement réel,
 * `false` → séquestre simulé. Lu à chaque requête (pas de cache module-level
 * figé au build).
 */
export function isKonnectEnabled(): boolean {
  return Boolean(KONNECT_API_KEY && KONNECT_RECEIVER_WALLET_ID);
}

/** Erreur dédiée : permet aux appelants de logger sans exposer le détail au client. */
export class KonnectError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = "KonnectError";
  }
}

/** Statuts possibles d'un paiement Konnect (`completed` = réglé). */
export type KonnectPaymentStatus = "completed" | "pending" | string;

export type KonnectPayment = {
  id: string;
  status: KonnectPaymentStatus;
  /** Montant demandé, dans l'unité du token (millimes pour le TND). */
  amount: number;
  /** Montant effectivement reçu (utile pour les paiements partiels). */
  reachedAmount: number;
  token: string;
  orderId?: string | null;
  transactions?: Array<{ status?: string }>;
};

type InitPaymentParams = {
  /** Montant en TND (entier) — converti en millimes pour Konnect. */
  amountTND: number;
  /** Référence métier (id de réservation) — visible dans le dashboard. */
  orderId: string;
  description: string;
  /** URL absolue appelée en GET par Konnect (`?payment_ref=…`). */
  webhook: string;
  /** Redirections post-paiement (URLs absolues). */
  successUrl: string;
  failUrl: string;
  /** Durée de validité du lien de paiement, en minutes. */
  lifespanMinutes: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
};

function headers(): HeadersInit {
  if (!KONNECT_API_KEY) {
    throw new KonnectError("KONNECT_API_KEY manquante");
  }
  return {
    "Content-Type": "application/json",
    "x-api-key": KONNECT_API_KEY,
  };
}

/**
 * Initialise un paiement. Le montant est TOUJOURS réglé en TND (le séquestre
 * porte sur des dinars) : l'affichage EUR « diaspora » reste une conversion
 * d'UI, jamais le montant débité.
 *
 * @returns `{ payUrl, paymentRef }` — rediriger l'acheteur vers `payUrl`,
 *          stocker `paymentRef` sur la réservation.
 */
export async function initKonnectPayment(
  params: InitPaymentParams
): Promise<{ payUrl: string; paymentRef: string }> {
  if (!KONNECT_RECEIVER_WALLET_ID) {
    throw new KonnectError("KONNECT_RECEIVER_WALLET_ID manquante");
  }

  const body = {
    receiverWalletId: KONNECT_RECEIVER_WALLET_ID,
    token: "TND",
    amount: tndToMillimes(params.amountTND),
    type: "immediate",
    description: params.description,
    acceptedPaymentMethods: ACCEPTED_PAYMENT_METHODS,
    lifespan: params.lifespanMinutes,
    checkoutForm: false,
    orderId: params.orderId,
    webhook: params.webhook,
    successUrl: params.successUrl,
    failUrl: params.failUrl,
    theme: "light",
    firstName: params.firstName,
    lastName: params.lastName,
    email: params.email,
    phoneNumber: params.phoneNumber,
  };

  let res: Response;
  try {
    res = await fetch(`${KONNECT_API_URL}/payments/init-payment`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    throw new KonnectError(`init-payment réseau: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new KonnectError(`init-payment ${res.status}: ${detail}`, res.status);
  }

  const data = (await res.json()) as { payUrl?: string; paymentRef?: string };
  if (!data.payUrl || !data.paymentRef) {
    throw new KonnectError("Réponse init-payment incomplète");
  }
  return { payUrl: data.payUrl, paymentRef: data.paymentRef };
}

/**
 * Récupère les détails d'un paiement pour vérifier son statut (source de
 * vérité côté serveur). Toujours `no-store` : on veut l'état frais, jamais
 * une réponse mise en cache.
 */
export async function getKonnectPayment(
  paymentRef: string
): Promise<KonnectPayment> {
  let res: Response;
  try {
    res = await fetch(
      `${KONNECT_API_URL}/payments/${encodeURIComponent(paymentRef)}`,
      { method: "GET", headers: headers(), cache: "no-store" }
    );
  } catch (err) {
    throw new KonnectError(`get-payment réseau: ${(err as Error).message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new KonnectError(`get-payment ${res.status}: ${detail}`, res.status);
  }

  const data = (await res.json()) as { payment?: KonnectPayment };
  if (!data.payment) {
    throw new KonnectError("Réponse get-payment incomplète");
  }
  return data.payment;
}
