import { isPropertyPromoActive } from "@/lib/listings";
import { Price } from "@/components/currency/Price";

/**
 * Prix d'une annonce, avec le prix promo hôte barré/mis en avant quand actif
 * (CROISSANCE_ROADMAP.md §PM1). Anti-dark-pattern : jamais de prix barré
 * fabriqué — `price`/`promoPrice` sont les deux valeurs réelles, revalidées
 * serveur (`setPropertyPromoAction`), jamais un « prix original » inventé.
 */
export function PromoPrice({
  price,
  promoPrice,
  promoUntil,
  verified,
  suffix,
  className,
}: {
  price: number;
  promoPrice: number | null;
  promoUntil: Date | null;
  verified: boolean;
  suffix?: string;
  className?: string;
}) {
  const active = verified && isPropertyPromoActive(promoUntil) && promoPrice !== null;

  if (!active) {
    return <Price amount={price} suffix={suffix} className={className} />;
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <Price amount={price} className="text-base font-medium text-body/40 line-through" />
      <Price amount={promoPrice} suffix={suffix} className={className} />
    </span>
  );
}
