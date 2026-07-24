import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDateShortFr } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Neutralise l'injection de formule (CSV injection, OWASP) : un champ qui
 * commence par ces caractères serait interprété comme une formule par
 * Excel/Sheets à l'ouverture — vient de saisies libres (name/message).
 */
function csvField(value: string): string {
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}

/**
 * Export CSV des leads financement (MONETISATION_IMMO_ROADMAP.md §MI5) — pour
 * transmission manuelle à un futur partenaire bancaire. ADMIN uniquement.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const leads = await prisma.financingLead.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      name: true,
      email: true,
      phone: true,
      desiredAmount: true,
      message: true,
      createdAt: true,
      property: { select: { title: true, city: true, price: true } },
    },
  });

  const header = ["Date", "Annonce", "Ville", "Prix (TND)", "Nom", "Email", "Téléphone", "Montant souhaité (TND)", "Message"];
  const rows = leads.map((lead) => [
    formatDateShortFr(lead.createdAt),
    lead.property.title,
    lead.property.city,
    String(lead.property.price),
    lead.name,
    lead.email,
    lead.phone,
    lead.desiredAmount ? String(lead.desiredAmount) : "",
    lead.message ?? "",
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map(csvField).join(","))
    .join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="darna-leads-financement.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
