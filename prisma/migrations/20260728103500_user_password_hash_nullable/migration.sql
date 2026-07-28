-- LANCEMENT_ROADMAP.md §L8.2 (Google OAuth) : un compte créé via Google n'a
-- pas de mot de passe Darna. AlterColumn rend `passwordHash` nullable ; les
-- comptes existants (tous credentials) gardent leur hash actuel.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
