/**
 * Comptes de test pour le gating KYC (KYC_GATING=on).
 * Idempotent (upsert) — rejouable sans toucher au seed principal.
 * Lancement : npx tsx scripts/seed-kyc-test.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("darna2026", 12);

  const accounts = [
    {
      email: "kyc-bloque@darna.tn",
      name: "Test KYC Bloqué",
      kycStatus: "NON_VERIFIE",
      phone: "+216 20 000 001",
    },
    {
      email: "kyc-ok@darna.tn",
      name: "Test KYC Vérifié",
      kycStatus: "DEMO_VERIFIE",
      phone: "+216 20 000 002",
      phoneVerified: true,
    },
    {
      // PR4 — OTP multi-canal : compte NON_VERIFIE pour relancer le parcours
      // KYC (/dashboard/kyc) autant de fois que voulu. Le numéro WhatsApp où
      // part l'OTP est celui SAISI dans le formulaire — mets ton numéro
      // enregistré comme destinataire de test Meta.
      email: "otp-whatsapp@darna.tn",
      name: "Test OTP WhatsApp",
      kycStatus: "NON_VERIFIE",
      phone: "+216 20 000 003",
    },
  ] as const;

  for (const a of accounts) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: { kycStatus: a.kycStatus },
      create: {
        email: a.email,
        passwordHash,
        name: a.name,
        phone: a.phone,
        role: "HOTE",
        kycStatus: a.kycStatus,
        phoneVerified: "phoneVerified" in a ? a.phoneVerified : false,
      },
    });
    console.log(`✓ ${user.email} — kycStatus=${user.kycStatus}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
