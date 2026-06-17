import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSessionUser } from "@/lib/session";
import { AvatarUploader } from "@/components/dashboard/AvatarUploader";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
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
      <h2 className="text-xl font-bold text-darna">{fr.profil.titre}</h2>
      <p className="mt-1 text-sm text-ink/60">{fr.profil.sousTitre}</p>

      <div className="mt-6 space-y-6">
        {/* Carte identité : avatar + nom / e-mail / badges */}
        <section className="rounded-3xl bg-white p-6 ring-1 ring-darna/10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-start">
            <AvatarUploader name={user.name} image={user.image} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-darna">{user.name}</p>
              <p className="truncate text-sm text-ink/60">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center rounded-full bg-darna/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-darna">
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
          <p className="mt-4 text-center text-xs text-ink/45 sm:text-start">
            {fr.profil.photoAide}
          </p>
        </section>

        <ProfileForm name={user.name} email={user.email} phone={user.phone} />
      </div>
    </div>
  );
}
