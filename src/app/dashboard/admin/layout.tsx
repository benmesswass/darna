import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";

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

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-ink/10 pb-4">
        <span className="rounded-lg bg-darna px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
          {fr.admin.badge}
        </span>
        <h2 className="text-lg font-bold text-heading">{fr.admin.titre}</h2>
      </div>
      {children}
    </div>
  );
}
