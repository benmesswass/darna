"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, ShieldIcon, MailIcon } from "@/components/icons";
import { EmailVerifyFlow } from "@/components/dashboard/EmailVerifyFlow";
import { KycFlow } from "@/components/dashboard/KycFlow";
import { skipVerificationOnboardingAction } from "@/actions/onboarding";

type Props = {
  emailVerified: boolean;
  kycStatus: string;
  /** Mode « 1re connexion » : affiche le titre de bienvenue + « Passer pour l'instant ». */
  welcome?: boolean;
};

function isKycVerified(status: string): boolean {
  return status === "VERIFIE" || status === "DEMO_VERIFIE";
}

export function VerificationsAssistant({ emailVerified, kycStatus, welcome }: Props) {
  const fr = useT();
  const router = useRouter();
  const [skipPending, startSkip] = useTransition();

  const emailDone = emailVerified;
  const kycDone = isKycVerified(kycStatus);
  const allDone = emailDone && kycDone;

  const steps = [
    { key: "email", label: fr.verifications.etapeEmail, done: emailDone },
    { key: "identite", label: fr.verifications.etapeIdentite, done: kycDone },
  ] as const;

  // Démarre sur la 1re étape non faite (ou la dernière si tout est fait).
  const firstTodo = steps.findIndex((s) => !s.done);
  const [step, setStep] = useState(firstTodo === -1 ? steps.length - 1 : firstTodo);

  function handleSkip() {
    startSkip(async () => {
      await skipVerificationOnboardingAction();
      router.push("/dashboard");
    });
  }

  const why = [fr.verifications.pourquoi1, fr.verifications.pourquoi2, fr.verifications.pourquoi3];

  return (
    <div className="max-w-2xl">
      {/* En-tête */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-darna">
          {welcome ? fr.verifications.bienvenue : fr.verifications.titre}
        </h2>
        <p className="mt-1 text-sm text-ink/60">{fr.verifications.sousTitre}</p>
      </div>

      {/* Pourquoi vérifier ? — la confiance comme produit */}
      <section className="mb-6 rounded-2xl border border-darna/10 bg-darna/[0.03] p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-darna">
          <ShieldIcon width={16} height={16} />
          {fr.verifications.pourquoiTitre}
        </h3>
        <ul className="mt-3 space-y-2">
          {why.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-ink/75">
              <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sand text-darna-dark">
                <CheckIcon width={10} height={10} strokeWidth={3} />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      {allDone ? (
        <div className="rounded-3xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckIcon width={28} height={28} strokeWidth={2.5} />
          </span>
          <p className="mt-4 text-lg font-bold text-emerald-800">
            {fr.verifications.tousVerifies}
          </p>
          <p className="mt-1 text-sm text-emerald-700/80">{fr.verifications.tousVerifiesSous}</p>
        </div>
      ) : (
        <>
          {/* Indicateur d'étapes */}
          <ol className="mb-5 flex items-center gap-3">
            {steps.map((s, i) => {
              const active = i === step;
              const Icon = s.key === "email" ? MailIcon : ShieldIcon;
              return (
                <li key={s.key} className="flex flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(i)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition ${
                      active
                        ? "border-darna bg-darna text-white"
                        : "border-darna/15 bg-white text-ink/70 hover:border-darna/30"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        s.done
                          ? "bg-emerald-500 text-white"
                          : active
                            ? "bg-white/20 text-white"
                            : "bg-sand/40 text-darna-dark"
                      }`}
                    >
                      {s.done ? (
                        <CheckIcon width={14} height={14} strokeWidth={3} />
                      ) : (
                        <Icon width={14} height={14} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium opacity-70">
                        {fr.verifications.etape(i + 1, steps.length)}
                      </span>
                      <span className="block truncate text-xs font-semibold">{s.label}</span>
                    </span>
                    <span
                      className={`ms-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.done
                          ? "bg-emerald-100 text-emerald-700"
                          : active
                            ? "bg-white/20 text-white"
                            : "bg-sand/30 text-darna-dark"
                      }`}
                    >
                      {s.done ? fr.verifications.badgeFait : fr.verifications.badgeAFaire}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Contenu de l'étape active */}
          <div className="rounded-2xl border border-darna/10 bg-white p-5">
            {step === 0 ? <EmailVerifyFlow /> : <KycFlow initialStatus={kycStatus} />}
          </div>

          {/* Navigation entre étapes */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="rounded-xl border border-darna/20 px-4 py-2 text-sm font-semibold text-darna transition hover:bg-darna/5"
              >
                {fr.verifications.precedent}
              </button>
            ) : null}
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="rounded-xl bg-darna px-4 py-2 text-sm font-semibold text-white transition hover:bg-darna/90"
              >
                {fr.verifications.suivant}
              </button>
            ) : null}

            {welcome ? (
              <div className="ms-auto text-end">
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={skipPending}
                  className="text-sm font-medium text-ink/50 underline-offset-2 hover:text-ink/80 hover:underline disabled:opacity-50"
                >
                  {fr.verifications.passer}
                </button>
                <p className="mt-1 text-[11px] text-ink/40">{fr.verifications.terminerPlusTard}</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
