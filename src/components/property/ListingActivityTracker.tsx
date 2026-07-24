"use client";

import { useEffect } from "react";
import { recordListingViewAction } from "@/actions/listing-activity";

/** Enregistre une vue d'annonce dédupliquée par visiteur (§G5) — ne rend rien. */
export function ListingActivityTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    recordListingViewAction(propertyId);
  }, [propertyId]);

  return null;
}
