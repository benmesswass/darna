import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { formatDateFr } from "@/lib/format";
import { TypeBadge } from "@/components/property/Badges";
import { toWhatsAppNumber } from "@/components/property/PropertyCtas";
import { PrinterIcon, WhatsAppIcon } from "@/components/icons";

export default async function DemandesPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  if (user.role !== "HOTE" && user.role !== "AGENCE") {
    redirect("/dashboard/reservations");
  }

  // Demandes de contact (prospects) uniquement. Les réservations confirmées
  // sur ses annonces vivent dans « Mes réservations » (vue hôte).
  const contactRequests = await prisma.contactRequest.findMany({
    where: { property: { ownerId: user.id } },
    include: {
      property: { select: { title: true, slug: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="text-xl font-bold text-darna">{fr.dashboard.demandesRecues}</h2>

      {contactRequests.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-8 text-center text-sm text-ink/60 ring-1 ring-darna/10">
          {fr.dashboard.aucuneDemande}
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {contactRequests.map((c) => (
            <div key={c.id} className="rounded-3xl bg-white p-5 ring-1 ring-darna/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-ink">{fr.dashboard.demandeDe(c.name)}</p>
                <TypeBadge type={c.property.type} />
              </div>
              <p className="mt-1 text-sm text-ink/60">
                <Link
                  href={`/annonce/${c.property.slug}`}
                  className="font-medium text-darna underline"
                >
                  {c.property.title}
                </Link>{" "}
                · {formatDateFr(c.createdAt)}
              </p>
              <blockquote className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm italic text-ink/80">
                {c.message}
              </blockquote>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <a href={`mailto:${c.email}`} className="font-medium text-darna underline">
                  {c.email}
                </a>
                <a href={`tel:${c.phone}`} className="font-medium text-darna underline">
                  {c.phone}
                </a>
                <a
                  href={`https://wa.me/${toWhatsAppNumber(c.phone)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#128C7E] underline"
                >
                  <WhatsAppIcon width={15} height={15} />
                  {fr.property.whatsapp}
                </a>
                {c.property.type === "LOCATION" ? (
                  <Link
                    href={`/contrat/${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-darna px-3.5 py-1.5 text-xs font-bold text-white hover:bg-darna-light"
                  >
                    <PrinterIcon width={13} height={13} />
                    {fr.dashboard.contratBail}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
