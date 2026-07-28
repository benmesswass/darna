import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { buildAccountExport } from "@/lib/account-export";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Export RGPD des données du compte connecté (LANCEMENT_ROADMAP.md §L7.3) —
 * jamais un autre compte que le sien : userId vient de la session, jamais
 * d'un paramètre client.
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await buildAccountExport(user.id);

  await logAudit({ action: "ACCOUNT_DATA_EXPORTED", userId: user.id, success: true });

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="darna-mes-donnees-${user.id}.json"`,
    },
  });
}
