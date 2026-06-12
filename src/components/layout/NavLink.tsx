"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSectionOverride } from "./ActiveSection";

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
  const override = useSectionOverride();
  // La route gagne ; en repli, le lien d'une verticale (`/sejours`,
  // `/immobilier`) reste actif si la page a déclaré cette section
  // (`<ActiveSection>`) — ex. `/annonce/[slug]`. Sans effet sur les autres liens.
  const active =
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (override !== null && href === `/${override}`);

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
