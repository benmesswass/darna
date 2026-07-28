import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { fr as frMeta } from "@/lib/i18n/fr";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { immoEnabled } from "@/lib/modes";
import { decryptSensitive } from "@/lib/crypto";
import { formatDateFr, formatTndServer } from "@/lib/format";
import { PrintButton } from "@/components/contract/PrintButton";

export const metadata: Metadata = { title: frMeta.bail.titre };

/**
 * Contrat de bail pré-rempli, imprimable (@media print), généré depuis
 * une demande de contact sur une annonce en location longue durée.
 */
export default async function ContratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const fr = await getT();
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const request = await prisma.contactRequest.findUnique({
    where: { id },
    include: {
      property: {
        include: { owner: { select: { id: true, name: true, cin: true, phone: true } } },
      },
    },
  });
  // Bail = parcours immo (location) : 404 si la demande ne porte pas sur une
  // location ou si la verticale Immo est désactivée par config.
  if (!request || request.property.type !== "LOCATION" || !immoEnabled()) notFound();

  // Autorisation : seuls le propriétaire du bien ou l'auteur de la demande.
  const allowed =
    request.property.owner.id === user.id || request.senderId === user.id;
  if (!allowed) notFound();

  const property = request.property;
  // CIN déchiffrée pour le bail (passthrough si valeur legacy en clair).
  const ownerCin = property.owner.cin ? decryptSensitive(property.owner.cin) : null;
  const loyer = formatTndServer(property.price);
  const caution = formatTndServer(property.price); // un mois de loyer

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{fr.bail.sousTitre}</p>
        <PrintButton />
      </div>

      <article className="rounded-3xl bg-surface p-10 ring-1 ring-darna/10 print:rounded-none print:p-0 print:ring-0">
        <header className="border-b-2 border-darna pb-6 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-heading">
            {fr.bail.titre}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Darna — {fr.meta.tagline}
          </p>
        </header>

        <section className="mt-8">
          <p className="font-semibold text-body">{fr.bail.entre}</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 print:grid-cols-2">
            <div className="rounded-2xl bg-cream p-5 print:bg-transparent print:p-0">
              <p className="text-xs font-bold uppercase tracking-wide text-heading">
                {fr.bail.bailleur}
              </p>
              <p className="mt-2 font-semibold">{property.owner.name}</p>
              {ownerCin ? (
                <p className="text-sm text-body/70">CIN : {ownerCin}</p>
              ) : (
                <p className="text-sm text-subtle">CIN : ____________________</p>
              )}
              {property.owner.phone ? (
                <p className="text-sm text-body/70">Tél. : {property.owner.phone}</p>
              ) : null}
            </div>
            <div className="rounded-2xl bg-cream p-5 print:bg-transparent print:p-0">
              <p className="text-xs font-bold uppercase tracking-wide text-heading">
                {fr.bail.locataire}
              </p>
              <p className="mt-2 font-semibold">{request.name}</p>
              <p className="text-sm text-subtle">CIN : ____________________</p>
              <p className="text-sm text-body/70">Tél. : {request.phone}</p>
              <p className="text-sm text-body/70">{request.email}</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <p className="text-xs font-bold uppercase tracking-wide text-heading">
            {fr.bail.bienDesigne}
          </p>
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-b border-ink/10">
                <td className="py-2 font-semibold text-body/70">{fr.bail.adresse}</td>
                <td className="py-2">
                  {property.address ? `${property.address}, ` : ""}
                  {property.city}, {property.gouvernorat}
                </td>
              </tr>
              {property.surface ? (
                <tr className="border-b border-ink/10">
                  <td className="py-2 font-semibold text-body/70">{fr.bail.surface}</td>
                  <td className="py-2">{property.surface} m²</td>
                </tr>
              ) : null}
              {property.rooms ? (
                <tr className="border-b border-ink/10">
                  <td className="py-2 font-semibold text-body/70">{fr.bail.pieces}</td>
                  <td className="py-2">{property.rooms}</td>
                </tr>
              ) : null}
              <tr>
                <td className="py-2 font-semibold text-body/70">
                  {fr.bail.loyerMensuel}
                </td>
                <td className="py-2 font-bold text-heading">{loyer}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-8 space-y-5 text-sm leading-relaxed">
          <div>
            <p className="font-bold text-heading">{fr.bail.article1}</p>
            <p className="mt-1">{fr.bail.article1Texte}</p>
          </div>
          <div>
            <p className="font-bold text-heading">{fr.bail.article2}</p>
            <p className="mt-1">{fr.bail.article2Texte}</p>
          </div>
          <div>
            <p className="font-bold text-heading">{fr.bail.article3}</p>
            <p className="mt-1">{fr.bail.article3Texte(loyer)}</p>
          </div>
          <div>
            <p className="font-bold text-heading">{fr.bail.article4}</p>
            <p className="mt-1">{fr.bail.article4Texte(caution)}</p>
          </div>
          <div>
            <p className="font-bold text-heading">{fr.bail.article5}</p>
            <p className="mt-1">{fr.bail.article5Texte}</p>
          </div>
        </section>

        <section className="mt-10 text-sm">
          <p>
            {fr.bail.faitA} {property.city}, {fr.bail.le}{" "}
            {formatDateFr(new Date())}, en deux exemplaires originaux.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-10">
            <div>
              <p className="font-semibold">{fr.bail.signatureBailleur}</p>
              <div className="mt-16 border-t border-ink/30" />
            </div>
            <div>
              <p className="font-semibold">{fr.bail.signatureLocataire}</p>
              <div className="mt-16 border-t border-ink/30" />
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-ink/10 pt-4 text-xs italic text-muted">
          {fr.bail.mentionLegale}
        </footer>
      </article>
    </div>
  );
}
