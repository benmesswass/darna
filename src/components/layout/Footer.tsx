import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { immoEnabled, stayEnabled } from "@/lib/modes";
import { HouseIcon } from "@/components/icons";

export async function Footer() {
  const fr = await getT();
  return (
    <footer className="no-print mt-16 bg-darna-dark text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sand text-darna-dark">
              <HouseIcon width={22} height={22} strokeWidth={2.2} />
            </span>
            <span className="text-xl font-bold">{fr.meta.siteName}</span>
          </div>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            {fr.meta.description}
          </p>
          <p className="mt-2 text-sm font-semibold text-sand">{fr.footer.baseline}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
            {fr.footer.explorer}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {stayEnabled() ? (
              <li>
                <Link href="/sejours" className="text-white/80 hover:text-sand">
                  {fr.nav.sejours}
                </Link>
              </li>
            ) : null}
            {immoEnabled() ? (
              <li>
                <Link href="/immobilier" className="text-white/80 hover:text-sand">
                  {fr.nav.immobilier}
                </Link>
              </li>
            ) : null}
            <li>
              <Link href="/prix-du-marche" className="text-white/80 hover:text-sand">
                {fr.nav.prixDuMarche}
              </Link>
            </li>
            <li>
              <Link href="/diaspora" className="text-white/80 hover:text-sand">
                {fr.nav.diaspora}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/50">
            {fr.footer.confiance}
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/devenir-wakil" className="text-white/80 hover:text-sand">
                {fr.nav.devenirWakil}
              </Link>
            </li>
            <li>
              <Link href="/cgu" className="text-white/80 hover:text-sand">
                {fr.footer.cgu}
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="text-white/80 hover:text-sand">
                {fr.footer.mentionsLegales}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {fr.footer.copyright}
      </div>
    </footer>
  );
}
