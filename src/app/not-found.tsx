import Link from "next/link";
import { fr } from "@/lib/i18n/fr";
import { HouseIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-darna text-sand">
        <HouseIcon width={32} height={32} />
      </span>
      <p className="mt-6 text-6xl font-bold text-darna">404</p>
      <h1 className="mt-2 text-2xl font-bold text-darna">{fr.notFound.titre}</h1>
      <p className="mt-3 text-ink/60">{fr.notFound.desc}</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-sand px-7 py-3 text-sm font-bold text-darna-dark transition hover:bg-sand-light"
      >
        {fr.notFound.cta}
      </Link>
    </div>
  );
}
