"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  CoinsIcon,
  HeartIcon,
  MailIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";

export const ICONS = {
  BellIcon,
  BuildingIcon,
  CalendarIcon,
  ChartIcon,
  CoinsIcon,
  HeartIcon,
  MailIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} as const;

export type IconName = keyof typeof ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
};

export function DashboardNav({ links }: { links: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label, icon, badge }) => {
        const Icon = ICONS[icon];
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-surface text-heading shadow-sm"
                : "text-body/70 hover:bg-surface hover:text-heading hover:shadow-sm"
            }`}
          >
            <Icon width={17} height={17} />
            {label}
            {badge ? (
              <span className="ms-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-darna px-1.5 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}
