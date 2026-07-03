"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useT } from "@/components/i18n/LocaleProvider";
import { quoteBookingAction, type BookingQuote } from "@/actions/bookings";
import { Price } from "@/components/currency/Price";
import { BookingSubmit } from "@/components/booking/BookingSubmit";
import { BookingDatePicker } from "@/components/booking/BookingDatePicker";
import { ShieldIcon, UsersIcon } from "@/components/icons";

const INTL_LOCALE: Record<string, string> = {
  fr: "fr-FR",
  en: "en-US",
  ar: "ar-TN",
};

/**
 * Orchestrateur de la demande de réservation : calendrier (à gauche) + carte
 * récapitulative LIVE (à droite, sticky sur desktop ; ramenée dans le champ de
 * vision sur mobile). Le devis est recalculé côté serveur à chaque changement
 * de dates / voyageurs (quoteBookingAction) — aucun prix n'est calculé ici, et
 * le montant faisant foi est de nouveau recalculé à la création.
 */
export function BookingPanel({
  slug,
  unavailable,
  maxGuests,
  defaultArrivee,
  defaultDepart,
  defaultVoyageurs,
  isLoggedIn,
  verified,
}: {
  slug: string;
  unavailable: string[];
  maxGuests: number;
  defaultArrivee: string;
  defaultDepart: string;
  defaultVoyageurs: number;
  isLoggedIn: boolean;
  /** Compte vérifié (e-mail + téléphone) : requis pour réserver. */
  verified: boolean;
}) {
  const fr = useT();
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale] ?? "fr-FR";

  const [checkIn, setCheckIn] = useState<string | null>(defaultArrivee || null);
  const [checkOut, setCheckOut] = useState<string | null>(defaultDepart || null);
  const [voyageurs, setVoyageurs] = useState(defaultVoyageurs);
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [pending, setPending] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const lastComplete = useRef<string>("");

  const complete = Boolean(checkIn && checkOut);

  // Devis serveur en direct dès qu'une plage complète est choisie.
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setQuote(null);
      setPending(false);
      return;
    }
    let active = true;
    setPending(true);
    quoteBookingAction({ slug, arrivee: checkIn, depart: checkOut, voyageurs }).then(
      (q) => {
        if (active) {
          setQuote(q);
          setPending(false);
        }
      }
    );
    return () => {
      active = false;
    };
  }, [slug, checkIn, checkOut, voyageurs]);

  // Sur mobile, amener le récapitulatif sous les yeux dès qu'une plage est
  // complète (sur desktop la carte est déjà sticky et visible).
  useEffect(() => {
    if (!checkIn || !checkOut) return;
    const key = `${checkIn}|${checkOut}`;
    if (lastComplete.current === key) return;
    lastComplete.current = key;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      summaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [checkIn, checkOut]);

  const q = quote && quote.ok ? quote : null;
  const errorMsg = quote && !quote.ok ? quote.error : null;

  const formatRange = () => {
    if (!checkIn || !checkOut) return "";
    const fmt = new Intl.DateTimeFormat(intlLocale, { day: "numeric", month: "long" });
    const f = (iso: string) => fmt.format(new Date(`${iso}T00:00:00`));
    return fr.booking.sejourDates(f(checkIn), f(checkOut));
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
      {/* Calendrier */}
      <BookingDatePicker
        unavailable={unavailable}
        checkIn={checkIn}
        checkOut={checkOut}
        onChange={(ci, co) => {
          setCheckIn(ci);
          setCheckOut(co);
        }}
      />

      {/* Récapitulatif live */}
      <div ref={summaryRef} className="scroll-mt-24 lg:sticky lg:top-24">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-darna/10">
          <h2 className="text-lg font-bold text-darna">{fr.booking.recapitulatif}</h2>

          {/* Voyageurs */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink/70">
              <UsersIcon width={15} height={15} />
              {fr.search.voyageurs}
            </span>
            <div className="flex items-center gap-1 rounded-xl border border-darna/15 bg-cream p-1">
              <button
                type="button"
                aria-label="-"
                disabled={voyageurs <= 1}
                onClick={() => setVoyageurs((v) => Math.max(1, v - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-darna transition duration-150 hover:bg-white active:scale-90 disabled:opacity-30 disabled:active:scale-100"
              >
                −
              </button>
              <span
                key={voyageurs}
                className="w-9 text-center text-sm font-bold text-ink"
                style={{ animation: "darna-loop-pop 250ms ease-out" }}
              >
                {voyageurs}
              </span>
              <button
                type="button"
                aria-label="+"
                disabled={voyageurs >= maxGuests}
                onClick={() => setVoyageurs((v) => Math.min(maxGuests, v + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold text-darna transition duration-150 hover:bg-white active:scale-90 disabled:opacity-30 disabled:active:scale-100"
              >
                +
              </button>
            </div>
          </div>

          {/* Corps : invite, erreur, ou détail des prix */}
          {!complete ? (
            <p className="mt-5 rounded-2xl bg-cream px-4 py-5 text-center text-sm text-ink/55">
              {fr.booking.placeholderPrix}
            </p>
          ) : errorMsg ? (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {errorMsg}
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-ink/60">
                {formatRange()} · {fr.property.capacite(voyageurs)}
              </p>

              {q ? (
                <dl
                  className={`mt-4 space-y-3 text-sm transition-opacity ${
                    pending ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <dt className="text-ink/70">
                      {fr.booking.prixNuit} × {fr.booking.nuits(q.nights)}
                    </dt>
                    <dd>
                      <Price amount={q.subtotal} className="font-semibold text-ink" />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-ink/70">
                      {fr.booking.fraisService}
                      <span className="block text-xs text-ink/40">
                        {fr.booking.fraisServiceAide}
                      </span>
                    </dt>
                    <dd>
                      <Price amount={q.serviceFee} className="font-semibold text-ink" />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-darna/10 pt-3 text-base">
                    <dt className="font-bold text-darna">{fr.booking.total}</dt>
                    <dd>
                      <Price amount={q.total} className="text-xl font-bold text-darna" />
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 text-sm text-ink/50">{fr.common.chargement}</p>
              )}

              <p className="mt-3 flex items-center gap-2 rounded-xl bg-cream px-4 py-2.5 text-xs font-medium text-darna-dark">
                <ShieldIcon width={15} height={15} />
                {fr.booking.aucunFraisCache}
              </p>
            </>
          )}

          {/* CTA */}
          {complete && q ? (
            !isLoggedIn ? (
              <Link
                href={`/connexion?callbackUrl=${encodeURIComponent(
                  `/annonce/${slug}/reserver?arrivee=${checkIn}&depart=${checkOut}&voyageurs=${voyageurs}`
                )}`}
                className="mt-5 block rounded-2xl bg-darna px-6 py-3.5 text-center text-base font-bold text-white transition hover:bg-darna-light"
              >
                {fr.booking.connexionRequise}
              </Link>
            ) : !verified ? (
              <div className="mt-5 rounded-2xl border border-sand bg-sand/10 p-4">
                <p className="flex items-center gap-2 font-bold text-darna">
                  <ShieldIcon width={16} height={16} />
                  {fr.booking.verifRequiseTitre}
                </p>
                <p className="mt-1 text-sm text-ink/70">{fr.booking.verifRequiseDesc}</p>
                <Link
                  href="/dashboard/verifications"
                  className="mt-3 block rounded-xl bg-darna px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-darna-light"
                >
                  {fr.booking.verifRequiseCta}
                </Link>
              </div>
            ) : (
              <BookingSubmit
                slug={slug}
                arrivee={checkIn ?? ""}
                depart={checkOut ?? ""}
                voyageurs={voyageurs}
              />
            )
          ) : (
            <button
              type="button"
              disabled
              className="mt-5 w-full cursor-not-allowed rounded-2xl bg-darna/25 px-6 py-3.5 text-base font-bold text-white"
            >
              {fr.booking.selectionnezDates}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
