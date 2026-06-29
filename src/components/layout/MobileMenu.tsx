"use client";

import { useState } from "react";
import { useT } from "@/components/i18n/LocaleProvider";
import { logoutAction } from "@/actions/auth";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { NavLink } from "./NavLink";

type Item = { href: string; label: string };

export function MobileMenu({
  items,
  loggedIn = false,
  logoutLabel,
}: {
  items: Item[];
  loggedIn?: boolean;
  logoutLabel?: string;
}) {
  const fr = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={fr.nav.menu}
        aria-expanded={open}
        className="rounded-lg p-2 text-white/90 hover:bg-white/10"
      >
        {open ? <MenuIcon className="hidden" /> : null}
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open ? (
        <nav className="absolute inset-x-0 top-full z-50 border-t border-white/10 bg-darna-dark px-4 py-3 shadow-xl">
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium"
                  activeClassName="bg-white/10 text-white"
                  inactiveClassName="text-white/90 hover:bg-white/10"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {loggedIn ? (
              <li className="mt-1 border-t border-white/10 pt-1">
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-red-300 hover:bg-white/10"
                  >
                    {logoutLabel}
                  </button>
                </form>
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
