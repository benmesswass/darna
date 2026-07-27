import { logAudit, logStructured } from "@/lib/audit";
import { reconcileKonnectPayments } from "@/lib/jobs/konnect-reconciliation";
import { remindAbandonedBookings } from "@/lib/jobs/booking-abandon-reminder";

/**
 * Socle scheduler (LANCEMENT_ROADMAP.md §L3.1) — amendement au principe
 * « zéro cron » du projet : zéro cron pour l'ÉTAT (lazy-expiry conservée
 * partout, ne JAMAIS réécrire expiresAt/featuredUntil/promoUntil/crédits FIFO
 * en jobs), un scheduler pour les ACTIONS SORTANTES (e-mail/notification,
 * comparaison avec un système externe, purge). Voir CLAUDE.md §Stack.
 *
 * Chaque job = fonction pure, idempotente (rejouable sans double effet —
 * même discipline que les settlements de paiement), enregistrée ci-dessous.
 * Un job qui échoue n'empêche pas les autres de tourner (erreurs isolées).
 */
export type JobResult = {
  name: string;
  ok: boolean;
  detail?: Record<string, unknown>;
  error?: string;
};

export type Job = {
  name: string;
  run: () => Promise<Record<string, unknown> | void>;
};

/**
 * Exécute une liste de jobs, isolément (une exception dans l'un n'empêche pas
 * les suivants), et journalise chaque résultat. Séparée de `runJobs()` pour
 * rester testable avec des jobs factices, sans toucher au registre réel.
 */
export async function runJobList(jobList: Job[]): Promise<JobResult[]> {
  const results: JobResult[] = [];

  for (const job of jobList) {
    try {
      const detail = (await job.run()) ?? undefined;
      results.push({ name: job.name, ok: true, detail });
      logStructured("info", "job.tick.success", { job: job.name, ...detail });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ name: job.name, ok: false, error });
      logStructured("error", "job.tick.failure", { job: job.name, error });
    }
  }

  await logAudit({ action: "JOB_TICK", metadata: { results } });
  return results;
}

/**
 * Registre des jobs réels. Pour en ajouter un : écrire une fonction pure et
 * idempotente dans src/lib/jobs/<nom>.ts, puis l'enregistrer ici.
 *
 * Pas de verrou distribué au départ (le cron Vercel ne se chevauche pas à
 * 15 min pour des jobs de quelques secondes) — si un job devient long,
 * ajouter un verrou Redis `SET NX PX` ici avant d'itérer.
 */
const jobs: Job[] = [
  { name: "konnect-reconciliation", run: reconcileKonnectPayments },
  { name: "booking-abandon-reminder", run: remindAbandonedBookings },
];

export async function runJobs(): Promise<JobResult[]> {
  return runJobList(jobs);
}
