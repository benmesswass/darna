/**
 * Notifications admin — alerte les admins par e-mail quand une annonce ou
 * une candidature Wakil est soumise. Fire-and-forget : l'erreur est loguée
 * mais ne remonte pas à l'utilisateur.
 *
 * Module SERVEUR uniquement.
 */

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { logStructured } from "@/lib/audit";

export type AdminNotifKind = "NEW_PROPERTY" | "NEW_WAKIL_APPLICATION";

async function getAdminEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

export async function notifyAdmins(
  kind: AdminNotifKind,
  meta: Record<string, string>
): Promise<void> {
  try {
    const emails = await getAdminEmails();
    if (emails.length === 0) return;

    let subject: string;
    let html: string;

    if (kind === "NEW_PROPERTY") {
      subject = `[Darna] Nouvelle annonce à vérifier — ${meta.title ?? ""}`;
      html = `
        <p>Une nouvelle annonce a été publiée et attend votre vérification.</p>
        <ul>
          <li><strong>Titre :</strong> ${meta.title ?? "—"}</li>
          <li><strong>Ville :</strong> ${meta.city ?? "—"}</li>
          <li><strong>Propriétaire :</strong> ${meta.ownerName ?? "—"} (${meta.ownerEmail ?? "—"})</li>
        </ul>
        <p><a href="${process.env.NEXTAUTH_URL ?? "https://darna.tn"}/dashboard/admin/annonces">Accéder à la file de modération →</a></p>
      `;
    } else {
      subject = `[Darna] Nouvelle candidature Wakil — ${meta.name ?? ""}`;
      html = `
        <p>Une nouvelle candidature Wakil a été reçue.</p>
        <ul>
          <li><strong>Nom :</strong> ${meta.name ?? "—"}</li>
          <li><strong>E-mail :</strong> ${meta.email ?? "—"}</li>
          <li><strong>Ville :</strong> ${meta.city ?? "—"}</li>
        </ul>
        <p><a href="${process.env.NEXTAUTH_URL ?? "https://darna.tn"}/dashboard/admin/wakils">Accéder aux candidatures →</a></p>
      `;
    }

    await Promise.all(emails.map((to) => sendEmail({ to, subject, html })));
  } catch (err) {
    logStructured("warn", "admin_notify.failed", { kind, error: String(err) });
  }
}
