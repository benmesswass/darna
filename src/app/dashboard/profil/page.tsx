import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { AvatarUploader } from "@/components/dashboard/AvatarUploader";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { DeleteAccountForm } from "@/components/dashboard/DeleteAccountForm";
import { CheckIcon } from "@/components/icons";

export default async function ProfilPage() {
  const fr = await getT();
  const user = await getSessionUser();
  if (!user) redirect("/connexion");

  const roleLabel =
    {
      VOYAGEUR: fr.profil.roleVoyageur,
      HOTE: fr.profil.roleHote,
      AGENCE: fr.profil.roleAgence,
      ADMIN: fr.profil.roleAdmin,
    }[user.role] ?? user.role;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-bold text-heading">{fr.profil.titre}</h2>
      <p className="mt-1 text-sm text-body/60">{fr.profil.sousTitre}</p>

      <div className="mt-6 space-y-6">
        {/* Carte identité : avatar + nom / e-mail / badges */}
        <section className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
            <AvatarUploader name={user.name} image={user.image} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-heading">{user.name}</p>
              <p className="truncate text-sm text-body/60">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center rounded-full bg-darna/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-heading">
                  {roleLabel}
                </span>
                {user.kycStatus === "VERIFIE" || user.kycStatus === "DEMO_VERIFIE" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-semibold text-darna-dark">
                    <CheckIcon width={11} height={11} strokeWidth={3} />
                    {user.kycStatus === "DEMO_VERIFIE"
                      ? fr.kyc.statutVerifieDemo
                      : fr.kyc.statutVerifie}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-body/45 sm:text-start">
            {fr.profil.photoAide}
          </p>
        </section>

        <ProfileForm
          name={user.name}
          email={user.email}
          phone={user.phone}
          hasPassword={user.hasPassword}
        />

        <section className="rounded-3xl bg-surface p-6 ring-1 ring-darna/10">
          <h3 className="text-sm font-bold text-heading">{fr.profil.donneesTitre}</h3>
          <p className="mt-1 text-sm text-body/60">{fr.profil.donneesSousTitre}</p>
          <a
            href="/api/account/export"
            className="mt-4 inline-block rounded-xl border border-darna/20 px-4 py-2 text-sm font-semibold text-heading transition hover:bg-darna hover:text-white"
          >
            {fr.profil.donneesExporter}
          </a>
          <p className="mt-2 text-xs text-body/45">{fr.profil.donneesExporterAide}</p>
        </section>

        <DeleteAccountForm hasPassword={user.hasPassword} />
      </div>
    </div>
  );
}
