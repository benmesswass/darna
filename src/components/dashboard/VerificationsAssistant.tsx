"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n/LocaleProvider";
import { CheckIcon, ShieldIcon, MailIcon } from "@/components/icons";
import { EmailVerifyFlow } from "@/components/dashboard/EmailVerifyFlow";
import { PhoneVerifyFlow } from "@/components/dashboard/PhoneVerifyFlow";
import { CinVerifyFlow } from "@/components/dashboard/CinVerifyFlow";
import { skipVerificationOnboardingAction } from "@/actions/onboarding";

type StepKey = "email" | "phone" | "cin";

type Props = {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycStatus: string;
  role: string;
  /** Mode « 1re connexion » : titre de bienvenue + « Passer pour l'instant ». */
  welcome?: boolean;
};

function isKycVerified(status: string): boolean {
  return status === "VERIFIE" || status === "DEMO_VERIFIE";
}

export function VerificationsAssistant({
  emailVerified,
  phoneVerified,
  kycStatus,
  role,
  welcome,
}: Props) {
  const fr = useT();
  const router = useRouter();
  const [skipPending, startSkip] = useTransition();

  // Un hôte/agence doit vérifier les 3 (e-mail + téléphone + CIN). Un voyageur
  // n'a pas besoin de la CIN — l'étape ne lui est pas proposée.
  const isLister = role === "HOTE" || role === "AGENCE";

  const steps = [
    { key: "email" as StepKey, label: fr.verifications.etapeEmail, initialDone: emailVerified },
    { key: "phone" as StepKey, label: fr.verifications.etapeTelephone, initialDone: phoneVerified },
    ...(isLister
      ? [{ key: "cin" as StepKey, label: fr.verifications.etapeCin, initialDone: isKycVerified(kycStatus) }]
      : []),
  ];

  // Complétion vivante (sans rechargement) : les étapes franchies pendant la
  // session s'ajoutent ici, ce qui fait avancer automatiquement l'assistant.
  const [completed, setCompleted] = useState<Set<StepKey>>(
    () => new Set(steps.filter((s) => s.initialDone).map((s) => s.key))
  );
  const [manualStep, setManualStep] = useState<number | null>(null);

  const done = (i: number) => steps[i].initialDone || completed.has(steps[i].key);
  const firstTodo = steps.findIndex((_, i) => !done(i));
  const activeStep = manualStep ?? (firstTodo === -1 ? steps.length - 1 : firstTodo);
  const allDone = steps.every((_, i) => done(i));

  // Auto-avance : marque l'étape faite et laisse activeStep glisser vers la
  // suivante non faite. Stable (useCallback) pour ne pas reboucler les effects.
  const handleVerified = useCallback((key: StepKey) => {
    setCompleted((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setManualStep(null);
  }, []);

  const onEmail = useCallback(() => handleVerified("email"), [handleVerified]);
  const onPhone = useCallback(() => handleVerified("phone"), [handleVerified]);
  const onCin = useCallback(() => handleVerified("cin"), [handleVerified]);

  function handleSkip() {
    startSkip(async () => {
      await skipVerificationOnboardingAction();
      router.push("/dashboard");
    });
  }

  const why = [fr.verifications.pourquoi1, fr.verifications.pourquoi2, fr.verifications.pourquoi3];
  const active = steps[activeStep];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-heading">
          {welcome ? fr.verifications.bienvenue : fr.verifications.titre}
        </h2>
        <p className="mt-1 text-sm text-muted">{fr.verifications.sousTitre}</p>
      </div>

      {/* Pourquoi vérifier ? — la confiance comme produit */}
      <section className="mb-6 rounded-2xl border border-darna/10 bg-darna/[0.03] p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-heading">
          <ShieldIcon width={16} height={16} />
          {fr.verifications.pourquoiTitre}
        </h3>
        <ul className="mt-3 space-y-2">
          {why.map((line) => (
            <li key={line} className="flex items-start gap-2 text-sm text-body/75">
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
          <p className="mt-4 text-lg font-bold text-emerald-800">{fr.verifications.tousVerifies}</p>
          <p className="mt-1 text-sm text-emerald-700/80">{fr.verifications.tousVerifiesSous}</p>
        </div>
      ) : (
        <>
          {/* Indicateur d'étapes */}
          <ol className="mb-5 flex flex-wrap items-center gap-2">
            {steps.map((s, i) => {
              const isActive = i === activeStep;
              const stepDone = done(i);
              const Icon = s.key === "email" ? MailIcon : ShieldIcon;
              return (
                <li key={s.key} className="flex flex-1 items-center">
                  <button
                    type="button"
                    onClick={() => setManualStep(i)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition ${
                      isActive
                        ? "border-darna bg-darna text-white"
                        : "border-darna/15 bg-surface text-body/70 hover:border-darna/30"
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        stepDone
                          ? "bg-emerald-500 text-white"
                          : isActive
                            ? "bg-white/20 text-white"
                            : "bg-sand/40 text-darna-dark"
                      }`}
                    >
                      {stepDone ? (
                        <CheckIcon width={14} height={14} strokeWidth={3} />
                      ) : (
                        <Icon width={14} height={14} />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-medium opacity-90">
                        {fr.verifications.etape(i + 1, steps.length)}
                      </span>
                      <span className="block truncate text-xs font-semibold">{s.label}</span>
                    </span>
                    <span
                      className={`ms-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        stepDone
                          ? "bg-emerald-100 text-emerald-700"
                          : isActive
                            ? "bg-white/20 text-white"
                            : "bg-sand/30 text-darna-dark"
                      }`}
                    >
                      {stepDone ? fr.verifications.badgeFait : fr.verifications.badgeAFaire}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Étape active */}
          <div className="rounded-2xl border border-darna/10 bg-surface p-5">
            {active.key === "email" ? (
              <EmailVerifyFlow initialVerified={emailVerified} onVerified={onEmail} />
            ) : active.key === "phone" ? (
              <PhoneVerifyFlow initialVerified={phoneVerified} onVerified={onPhone} />
            ) : (
              <CinVerifyFlow initialStatus={kycStatus} onVerified={onCin} />
            )}
          </div>

          {welcome ? (
            <div className="mt-5 text-end">
              <button
                type="button"
                onClick={handleSkip}
                disabled={skipPending}
                className="text-sm font-medium text-muted underline-offset-2 hover:text-body/80 hover:underline disabled:opacity-50"
              >
                {fr.verifications.passer}
              </button>
              <p className="mt-1 text-[11px] text-subtle">{fr.verifications.terminerPlusTard}</p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
