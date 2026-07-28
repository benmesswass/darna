import Link from "next/link";
import { getT } from "@/lib/i18n/server";

/**
 * Pagination par liens (server component) : préserve les paramètres de
 * recherche courants et ne modifie que `page`. Des liens (et non du JS) →
 * crawlables et fonctionnels sans JavaScript. RTL-safe : `flex` honore
 * `dir="rtl"` et on n'utilise aucune flèche directionnelle.
 *
 * Rendu null si une seule page → sûr à monter inconditionnellement.
 */
export async function Pagination({
  page,
  total,
  pageSize,
  basePath,
  params,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const fr = await getT();

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (!value || key === "page") continue;
      for (const v of Array.isArray(value) ? value : [value]) qs.append(key, v);
    }
    qs.set("page", String(p));
    return `${basePath}?${qs.toString()}`;
  };

  const linkCls =
    "rounded-xl border border-darna/15 bg-surface px-4 py-2 text-sm font-semibold text-heading transition hover:bg-darna/5";
  const disabledCls =
    "cursor-not-allowed rounded-xl border border-darna/10 bg-cream px-4 py-2 text-sm font-semibold text-subtle";

  return (
    <nav
      aria-label={fr.search.pageInfo(page, totalPages)}
      className="mt-8 flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className={linkCls}>
          {fr.search.precedent}
        </Link>
      ) : (
        <span className={disabledCls} aria-disabled="true">
          {fr.search.precedent}
        </span>
      )}

      <span className="text-sm font-medium text-muted">
        {fr.search.pageInfo(page, totalPages)}
      </span>

      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className={linkCls}>
          {fr.search.suivant}
        </Link>
      ) : (
        <span className={disabledCls} aria-disabled="true">
          {fr.search.suivant}
        </span>
      )}
    </nav>
  );
}
