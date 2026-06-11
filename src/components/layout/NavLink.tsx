"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  /** Classes toujours appliquées (mise en forme de base). */
  className: string;
  /** Classes ajoutées quand le lien correspond à la page courante. */
  activeClassName: string;
  /** Classes ajoutées sinon (état inactif / hover). */
  inactiveClassName: string;
  children: ReactNode;
  onClick?: () => void;
};

/**
 * Lien de navigation qui se met en surbrillance quand on est sur sa page.
 * Composant client (lit `usePathname`) utilisable dans des layouts serveur.
 */
export function NavLink({
  href,
  className,
  activeClassName,
  inactiveClassName,
  children,
  onClick,
}: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`${className} ${active ? activeClassName : inactiveClassName}`}
    >
      {children}
    </Link>
  );
}
