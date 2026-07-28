"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth";
import { ICONS, type NavItem } from "@/components/dashboard/DashboardNav";

/**
 * Menu « Mon espace » du header : un bouton qui OUVRE une liste déroulante des
 * pages de l'espace personnel (au lieu d'ouvrir directement le dashboard), avec
 * la Déconnexion en tout dernier. Desktop uniquement (le mobile passe par le
 * menu hamburger). Se ferme au clic extérieur, à Échap et au changement de page.
 */
export function AccountMenu({
  name,
  image,
  initials,
  links,
  label,
  logoutLabel,
  initialUnread = 0,
}: {
  name: string;
  image: string | null;
  initials: string;
  links: NavItem[];
  label: string;
  logoutLabel: string;
  initialUnread?: number;
}) {
  const [open, setOpen] = useState(false);
  // Compteur de messages non lus, rafraîchi en direct par MessagesNotifier via
  // l'événement « darna:unread » (la valeur serveur ne sert que de premier rendu).
  const [unread, setUnread] = useState(initialUnread);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setUnread(initialUnread), [initialUnread]);

  useEffect(() => {
    const onUnread = (e: Event) => setUnread((e as CustomEvent<number>).detail);
    window.addEventListener("darna:unread", onUnread);
    return () => window.removeEventListener("darna:unread", onUnread);
  }, []);

  // Fermeture au changement de route.
  useEffect(() => setOpen(false), [pathname]);

  // Fermeture au clic extérieur + Échap.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="accent-transition relative flex items-center gap-2 rounded-full bg-[var(--color-accent)] py-1.5 pe-3 ps-1.5 text-sm font-semibold text-[var(--color-accent-contrast)] hover:bg-[var(--color-accent-strong)]"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/30 text-xs font-bold">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        {label}
        {unread > 0 ? (
          <span className="absolute -end-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-darna">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          aria-hidden
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute end-0 top-full z-[1200] mt-2 w-60 overflow-hidden rounded-2xl bg-surface py-2 text-body shadow-xl ring-1 ring-darna/10"
        >
          <p className="truncate px-4 pb-2 pt-1 text-xs text-muted">{name}</p>
          <ul className="text-start">
            {links.map(({ href, label: l, icon, badge }) => {
              const Icon = ICONS[icon];
              // La pastille « Messagerie » suit le compteur live ; les autres
              // gardent leur valeur serveur.
              const count = href === "/dashboard/messagerie" ? unread : badge ?? 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    role="menuitem"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-body/80 hover:bg-cream hover:text-heading"
                  >
                    <Icon width={16} height={16} />
                    {l}
                    {count > 0 ? (
                      <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-darna px-1.5 text-[10px] font-bold text-white">
                        {count > 99 ? "99+" : count}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
          <form action={logoutAction} className="mt-1 border-t border-ink/10 pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-start text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              {logoutLabel}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
