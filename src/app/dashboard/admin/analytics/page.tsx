import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import {
  getFounderAnalytics,
  parsePeriod,
  PERIOD_OPTIONS,
  type PeriodDays,
  type Segment,
  type VerticalStats,
} from "@/lib/analytics";

export const metadata = { title: "Tableau de bord — Admin Darna" };

// Données toujours fraîches : c'est un dashboard de suivi temps réel.
export const dynamic = "force-dynamic";

function fmtInt(n: number) {
  return new Intl.NumberFormat("fr-TN").format(n);
}
function fmtTnd(n: number) {
  return `${new Intl.NumberFormat("fr-TN").format(n)} TND`;
}
function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat("fr-TN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Carte de métrique simple. */
function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        highlight ? "border-darna/30 bg-darna/5" : "border-ink/10 bg-white"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold text-darna">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-ink/50">{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-xl font-bold text-darna">{children}</h3>;
}

/** Liste de segments en barres horizontales proportionnelles. */
function SegmentBars({
  segments,
  labelMap,
}: {
  segments: Segment[];
  labelMap?: Record<string, string>;
}) {
  const max = Math.max(1, ...segments.map((s) => s.count));
  return (
    <div className="space-y-2.5">
      {segments.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-ink/70">
            {labelMap?.[s.label] ?? s.label}
          </span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-darna"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-end text-sm font-semibold text-darna-dark">
            {fmtInt(s.count)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const fr = await getT();
  const user = await getSessionUser();
  // Founder-only : les Wakils n'accèdent pas aux métriques business.
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const period = parsePeriod((await searchParams).period);
  const a = await getFounderAnalytics(period);
  const t = fr.analytics;

  return (
    <div className="space-y-12">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-darna">{t.titre}</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/60">{t.sousTitre}</p>
            <p className="mt-1 text-xs text-ink/40">
              {t.genereLe(fmtDateTime(a.generatedAt))}
            </p>
          </div>
          <PeriodSelector current={period} label={t.periodeLabel} options={t.periodes} />
        </div>
      </header>

      {/* ── Vue d'ensemble / North-star ─────────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionNorthStar}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            highlight
            label={t.annoncesVerifieesActives}
            value={fmtInt(a.northStar.verifiedActiveListings)}
            sub={t.annoncesVerifieesActivesDesc}
          />
          <StatCard
            label={t.annoncesActives}
            value={fmtInt(a.northStar.activeListings)}
          />
          <StatCard
            label={t.tauxVerification}
            value={t.pourcent(a.northStar.verificationRate)}
          />
          <StatCard
            label={t.gmv}
            value={fmtTnd(a.northStar.gmvTnd)}
            sub={`${t.gmvDesc} · ${t.gmvReelle} ${fmtTnd(a.northStar.realGmvTnd)}`}
          />
          <StatCard
            label={t.reservationsConfirmees}
            value={fmtInt(a.northStar.confirmedBookings)}
          />
          <StatCard
            label={t.utilisateursTotal}
            value={fmtInt(a.northStar.totalUsers)}
          />
        </div>
      </section>

      {/* ── Split par verticale STAY vs IMMO ────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionVerticales}</SectionTitle>
        <p className="mb-5 max-w-2xl text-sm text-ink/60">{t.verticalesDesc}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {a.byVertical.map((v) => (
            <VerticalCard key={v.vertical} v={v} t={t} period={period} />
          ))}
        </div>
      </section>

      {/* ── Acquisition & activation ────────────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionAcquisition}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t.inscriptions7j} value={fmtInt(a.acquisition.signupsLast7)} />
          <StatCard label={t.inscriptions30j} value={fmtInt(a.acquisition.signupsLast30)} />
          <StatCard
            label={t.tauxEmailVerifie}
            value={t.pourcent(a.acquisition.emailVerifiedRate)}
          />
          <StatCard
            label={t.tauxKyc}
            value={t.pourcent(a.acquisition.kycVerifiedRate)}
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Sparkline inscriptions / jour */}
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-ink/70">
              {t.inscriptionsParJour(a.acquisition.signupsWindowDays)}
            </div>
            <SignupBars points={a.acquisition.signupsByDay} />
          </div>

          {/* Répartition par rôle, par pays + annonceurs actifs */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 text-sm font-semibold text-ink/70">
                {t.repartitionRoles}
              </div>
              <SegmentBars segments={a.acquisition.byRole} labelMap={t.rolesLabel} />
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-1 text-sm font-semibold text-ink/70">
                {t.repartitionPays}
              </div>
              <p className="mb-4 text-xs text-ink/50">{t.repartitionPaysDesc}</p>
              {a.acquisition.byCountry.length === 0 ? (
                <p className="text-sm text-ink/40">{t.aucuneDonnee}</p>
              ) : (
                <SegmentBars
                  segments={a.acquisition.byCountry}
                  labelMap={{ "—": t.paysNonRenseigne }}
                />
              )}
            </div>
            <StatCard
              label={t.annonceursActifs}
              value={t.pourcent(a.acquisition.listersWithListingRate)}
              sub={t.annonceursActifsDesc}
            />
          </div>
        </div>
      </section>

      {/* ── Funnel de réservation ───────────────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionFunnel}</SectionTitle>
        <p className="mb-2 max-w-2xl text-sm text-ink/60">{t.funnelDesc}</p>
        <p className="mb-5 text-xs font-semibold uppercase tracking-wide text-darna/70">
          {t.surPeriode(t.periodeNom(period))}
        </p>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <FunnelChart
              steps={[
                { label: t.funnelCreees, count: a.bookingFunnel.created },
                { label: t.funnelInitiees, count: a.bookingFunnel.initiated },
                { label: t.funnelConfirmees, count: a.bookingFunnel.confirmed },
              ]}
            />
            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/5 pt-4 text-xs">
              <Pill label={t.funnelEnAttente} value={fmtInt(a.bookingFunnel.pending)} />
              <Pill label={t.funnelAnnulees} value={fmtInt(a.bookingFunnel.cancelled)} />
              <Pill label={t.funnelExpirees} value={fmtInt(a.bookingFunnel.expired)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <StatCard
              highlight
              label={t.tauxConversion}
              value={t.pourcent(a.bookingFunnel.conversionRate)}
            />
            <StatCard
              label={t.tauxAbandon}
              value={t.pourcent(a.bookingFunnel.abandonRate)}
            />
          </div>
        </div>
      </section>

      {/* ── Rétention & churn ───────────────────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionRetention}</SectionTitle>
        <p className="mb-5 max-w-2xl text-sm text-ink/60">{t.retentionDesc}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t.voyageursAyantReserve}
            value={fmtInt(a.retention.travelersWhoBooked)}
          />
          <StatCard label={t.actifs30j} value={fmtInt(a.retention.activeTravelers30)} />
          <StatCard label={t.aRisque} value={fmtInt(a.retention.atRisk)} />
          <StatCard label={t.perdus} value={fmtInt(a.retention.churned)} />
        </div>

        <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="mb-1 text-sm font-semibold text-ink/70">{t.cohortes}</div>
          <p className="mb-4 text-xs text-ink/50">{t.cohortesDesc}</p>
          {a.retention.cohorts.length === 0 ? (
            <p className="text-sm text-ink/40">{t.aucuneDonnee}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="py-2 text-start">{t.moisInscription}</th>
                  <th className="py-2 text-end">{t.inscrits}</th>
                  <th className="py-2 text-end">{t.actives}</th>
                  <th className="py-2 text-end">{t.tauxActivation}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {a.retention.cohorts.map((c) => (
                  <tr key={c.month}>
                    <td className="py-2 font-medium text-ink/80">{c.month}</td>
                    <td className="py-2 text-end">{fmtInt(c.signups)}</td>
                    <td className="py-2 text-end">{fmtInt(c.activated)}</td>
                    <td className="py-2 text-end font-semibold text-darna-dark">
                      {t.pourcent(c.activationRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Réseau Wakil ────────────────────────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionWakil}</SectionTitle>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-ink/70">
              {t.candidaturesParStatut}
            </div>
            {a.wakil.applicationsByStatus.length === 0 ? (
              <p className="text-sm text-ink/40">{t.aucuneDonnee}</p>
            ) : (
              <SegmentBars segments={a.wakil.applicationsByStatus} />
            )}
          </div>
          <StatCard
            label={t.verificationsSurPlace}
            value={fmtInt(a.wakil.onSiteVerifications)}
          />
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
            <div className="mb-4 text-sm font-semibold text-ink/70">{t.topWakils}</div>
            {a.wakil.topWakils.length === 0 ? (
              <p className="text-sm text-ink/40">{t.aucuneDonnee}</p>
            ) : (
              <SegmentBars segments={a.wakil.topWakils} />
            )}
          </div>
        </div>
      </section>

      {/* ── Activité récente (audit trail) ──────────────────────────── */}
      <section>
        <SectionTitle>{t.sectionEvenements}</SectionTitle>
        <p className="mb-4 text-sm text-ink/60">{t.evenementsDesc}</p>
        <div className="overflow-hidden rounded-2xl border border-ink/10">
          {a.recentEvents.length === 0 ? (
            <p className="p-5 text-sm text-ink/40">{t.aucuneDonnee}</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-semibold uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3 text-start">{t.evenement}</th>
                  <th className="px-4 py-3 text-start">{t.utilisateur}</th>
                  <th className="px-4 py-3 text-end">{t.quand}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {a.recentEvents.map((e) => (
                  <tr key={e.id} className="hover:bg-sand/40">
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-xs text-darna-dark">{e.action}</span>
                      {!e.success ? (
                        <span className="ms-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          {t.echec}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-2.5 text-ink/70">
                      {e.userName ?? <span className="text-ink/40">{t.systeme}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-end text-xs text-ink/50">
                      {fmtDateTime(e.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

/** Tranche du dictionnaire i18n dédiée au tableau de bord (typage des props). */
type AnalyticsT = Awaited<ReturnType<typeof getT>>["analytics"];

/** Sélecteur de période global (segmented control) — liens `?period=…`. */
function PeriodSelector({
  current,
  label,
  options,
}: {
  current: PeriodDays;
  label: string;
  options: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">
        {label}
      </span>
      <div className="inline-flex rounded-xl border border-ink/10 bg-white p-1 shadow-sm">
        {PERIOD_OPTIONS.map((opt) => {
          const key = opt === null ? "all" : String(opt);
          const active = opt === current;
          return (
            <Link
              key={key}
              href={`?period=${key}`}
              scroll={false}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active ? "bg-darna text-white shadow-sm" : "text-ink/60 hover:text-darna"
              }`}
            >
              {options[key]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Métrique compacte centrée (3 par ligne dans les cartes verticale). */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-lg font-bold text-darna-dark">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink/50">{label}</div>
    </div>
  );
}

/** Carte d'une verticale : annonces (stock) + activité sur la période. */
function VerticalCard({
  v,
  t,
  period,
}: {
  v: VerticalStats;
  t: AnalyticsT;
  period: PeriodDays;
}) {
  const isStay = v.vertical === "STAY";
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-darna">{t.verticalLabel[v.vertical]}</h4>
        <span className="rounded-full bg-darna/10 px-2.5 py-0.5 text-[11px] font-semibold text-darna">
          {isStay ? t.vStayBadge : t.vImmoBadge}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <MiniStat label={t.vActives} value={fmtInt(v.activeListings)} />
        <MiniStat label={t.vVerifiees} value={fmtInt(v.verifiedActiveListings)} />
        <MiniStat label={t.vTaux} value={t.pourcent(v.verificationRate)} />
      </div>
      <div className="mt-4 border-t border-ink/5 pt-4">
        {isStay ? (
          <div className="grid grid-cols-2 gap-3 text-center">
            <MiniStat label={t.vReservations} value={fmtInt(v.paidBookings)} />
            <MiniStat label={t.vGmv} value={fmtTnd(v.gmvTnd)} />
          </div>
        ) : (
          <div className="text-center">
            <MiniStat label={t.vLeads} value={fmtInt(v.leads)} />
          </div>
        )}
        <p className="mt-2 text-center text-[11px] text-ink/40">
          {t.surPeriode(t.periodeNom(period))}
        </p>
      </div>
    </div>
  );
}

/** Petite étiquette compacte « libellé : valeur ». */
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 font-medium text-ink/70">
      {label}
      <span className="font-bold text-darna-dark">{value}</span>
    </span>
  );
}

/** Histogramme vertical des inscriptions / jour (30 barres, pur CSS). */
function SignupBars({ points }: { points: { date: string; count: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  return (
    <div className="flex h-32 items-end gap-0.5">
      {points.map((p) => (
        <div
          key={p.date}
          title={`${p.date} · ${p.count}`}
          className="flex-1 rounded-t bg-darna/70 transition hover:bg-darna"
          style={{ height: `${Math.max(2, (p.count / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** Funnel horizontal : barres décroissantes + taux de passage cumulés. */
function FunnelChart({ steps }: { steps: { label: string; count: number }[] }) {
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <div className="space-y-3">
      {steps.map((s) => (
        <div key={s.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-ink/70">{s.label}</span>
            <span className="font-semibold text-darna-dark">{fmtInt(s.count)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-sand">
            <div
              className="h-full rounded-full bg-darna"
              style={{ width: `${(s.count / top) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
