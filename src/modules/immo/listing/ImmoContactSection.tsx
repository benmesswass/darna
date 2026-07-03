import { getT } from "@/lib/i18n/server";
import { markerPriceLabel } from "@/lib/format";
import { ContactForm } from "@/components/property/ContactForm";
import { toWhatsAppNumber } from "@/components/property/PropertyCtas";
import type { ListingData, ListingViewer } from "@/modules/core/listing/types";

/**
 * Contact direct de la verticale IMMO (location / vente) : formulaire +
 * raccourci WhatsApp. JAMAIS de paiement en ligne dans ce module.
 */
export async function ImmoContactSection({
  property,
  user,
}: {
  property: ListingData;
  user: ListingViewer;
}) {
  const fr = await getT();

  return (
    <section id="contact">
      <h2 className="text-xl font-bold text-heading">{fr.contact.titre}</h2>
      <div className="mt-4 rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
        <ContactForm
          propertyId={property.id}
          propertyTitle={property.title}
          whatsappHref={
            property.owner.phone
              ? `https://wa.me/${toWhatsAppNumber(property.owner.phone)}?text=${encodeURIComponent(
                  fr.property.partagerWhatsapp(
                    property.title,
                    markerPriceLabel(property.price, property.type)
                  )
                )}`
              : null
          }
          defaults={{
            name: user?.name ?? "",
            email: user?.email ?? "",
            phone: user?.phone ?? "",
          }}
        />
      </div>
    </section>
  );
}
