-- LANCEMENT_ROADMAP.md §L7.3 : suppression de compte = anonymisation en
-- place (jamais un vrai DELETE, pour préserver l'historique comptable côté
-- hôte sur Booking/HostInvoice). deletedAt distingue un compte réellement
-- supprimé d'un profil normal nommé « Utilisateur supprimé ».
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);
