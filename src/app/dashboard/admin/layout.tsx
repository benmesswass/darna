import { redirect } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const fr = await getT();
  const user = await getSessionUser();

  // Seuls les admins accèdent à cette section.
  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const links = [
    { href: "/dashboard/admin/annonces", label: fr.admin.annonces },
    { href: "/dashboard/admin/wakils", label: fr.admin.wakils },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 border-b border-ink/10 pb-4">
        <span className="rounded-lg bg-darna px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
          {fr.admin.badge}
        </span>
        <h2 className="text-lg font-bold text-darna">{fr.admin.titre}</h2>
      </div>
      <nav className="mb-8 flex gap-2">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl border border-darna/20 px-4 py-2 text-sm font-semibold text-darna transition hover:bg-darna hover:text-white"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
