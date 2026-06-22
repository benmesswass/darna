"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; badge?: number };

export function AdminNav({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-2">
      {links.map(({ href, label, badge }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-darna text-white shadow-sm"
                : "border border-darna/20 text-darna hover:bg-darna hover:text-white"
            }`}
          >
            {label}
            {badge ? (
              <span
                className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                  active ? "bg-white/30 text-white" : "bg-darna text-white"
                }`}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
