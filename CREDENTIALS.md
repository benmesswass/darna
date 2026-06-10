# Comptes démo Darna

> Identifiants de **démonstration locale** uniquement (base SQLite seedée via `npx prisma db seed`).
> Aucun secret réel — ne pas réutiliser en production.

Mot de passe commun : **`darna2026`**

| Rôle | E-mail | Mot de passe | Particularités |
|---|---|---|---|
| Voyageur | `voyageur@darna.tn` | `darna2026` | Réservation confirmée à venir, avis publiés |
| Hôte (vérifié) | `hote@darna.tn` | `darna2026` | KYC vérifié, annonces séjours + vente |
| Agence | `agence@darna.tn` | `darna2026` | Annonces location/vente, demande de contact reçue, contrat de bail |

## Comptes secondaires (variété du seed)

| Rôle | E-mail | Mot de passe | Particularités |
|---|---|---|---|
| Hôte (non vérifié) | `sami@darna.tn` | `darna2026` | Pour tester le parcours KYC mock de bout en bout |
| Voyageuse | `amira@darna.tn` | `darna2026` | Avis publiés sur plusieurs séjours |
| Voyageur | `karim@darna.tn` | `darna2026` | Avis publiés sur plusieurs séjours |

## Rappels utiles

- Connexion : http://localhost:3000/connexion
- KYC mock (OTP affiché à l'écran, aucun SMS réel) : http://localhost:3000/dashboard/kyc
- Rate limiting : 5 tentatives de connexion / 15 min / IP — redémarrer `npm run dev` réinitialise le compteur (en mémoire).
- Pour remettre la base dans cet état : `npx prisma db seed`.
