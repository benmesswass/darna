import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fr = await getT();
  const user = await getSessionUser();

  if (!user || (user.role !== "ADMIN" && !user.isWakil)) {
    redirect("/dashboard");
  }

  const [pendingAnnonces, pendingWakils] = await Promise.all([
    prisma.property.count({ where: { status: "ACTIVE", verified: false } }),
    user.role === "ADMIN"
      ? prisma.wakilApplication.count({ where: { status: "RECUE", deletedAt: null } })
      : Promise.resolve(0),
  ]);

  const links = [
    {
      href: "/dashboard/admin/annonces",
      label: fr.admin.annonces,
      badge: pendingAnnonces > 0 ? pendingAnnonces : undefined,
    },
    ...(user.role === "ADMIN"
      ? [
          {
            href: "/dashboard/admin/wakils",
            label: fr.admin.wakils,
            badge: pendingWakils > 0 ? pendingWakils : undefined,
          },
        ]
      : []),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-ink/10 pb-4">
        <span className="rounded-lg bg-darna px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
          {fr.admin.badge}
        </span>
        <h2 className="text-lg font-bold text-darna">{fr.admin.titre}</h2>
      </div>
      <AdminNav links={links} />
      {children}
    </div>
  );
}
