"use server";

import { z } from "zod";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/constants";
import { resolveCity } from "@/lib/geo";
import { estimateRevenue, type RevenueEstimate } from "@/lib/market";
import { getSessionUser } from "@/lib/session";
import { getAnonId, logProductEvent } from "@/lib/product-events";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Mêmes bornes que le formulaire d'annonce réel (PropertyForm : maxGuests 1-30, surface ≥ 10).
const schema = z.object({
  type: z.enum(PROPERTY_TYPES),
  capacity: z.coerce.number().int().min(1).max(30).optional(),
  surface: z.coerce.number().int().min(10).max(2000).optional(),
});

export type SimulatorResult = {
  city: string;
  type: PropertyType;
  capacity?: number;
  surface?: number;
  estimate: RevenueEstimate;
};

export type SimulatorState =
  | { status: "error"; error: "ville_inconnue" | "invalide" | "rate_limited" }
  | { status: "success"; result: SimulatorResult }
  | undefined;

/**
 * Simulateur public de revenus (GROWTH_ROADMAP.md §G1) — lecture seule, aucune
 * mutation. Rate-limité comme tout point d'entrée déclenchable par un visiteur
 * anonyme (même primitif que trackEvent, cf. src/actions/track-event.ts).
 */
export async function simulateRevenueAction(
  _prevState: SimulatorState,
  formData: FormData
): Promise<SimulatorState> {
  const anonId = await getAnonId();
  const rlKey = anonId ?? (await clientIp());
  if (!(await rateLimit("simulate-revenue", rlKey))) {
    return { status: "error", error: "rate_limited" };
  }

  const resolvedCity = resolveCity(String(formData.get("city") ?? ""));
  const parsed = schema.safeParse({
    type: formData.get("type"),
    capacity: formData.get("capacity") || undefined,
    surface: formData.get("surface") || undefined,
  });

  if (!resolvedCity || !parsed.success) {
    return { status: "error", error: !resolvedCity ? "ville_inconnue" : "invalide" };
  }

  const estimate = await estimateRevenue({
    city: resolvedCity,
    type: parsed.data.type,
    surface: parsed.data.surface,
  });

  // Instrumentation produit (§IN2) — mesure l'usage réel du simulateur, avant
  // le lien "SIMULATOR_USED → inscription hôte" prévu par la roadmap.
  const user = await getSessionUser();
  await logProductEvent({
    event: "SIMULATOR_USED",
    userId: user?.id ?? null,
    anonId,
    metadata: { city: resolvedCity, type: parsed.data.type, matched: estimate.matched },
  });

  return {
    status: "success",
    result: {
      city: resolvedCity,
      type: parsed.data.type,
      capacity: parsed.data.capacity,
      surface: parsed.data.surface,
      estimate,
    },
  };
}
