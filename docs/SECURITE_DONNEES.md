# Darna — Sécurité des données sensibles (PCI, CIN)

> Référence de fond (ROADMAP.md §P3.4) — aucune tâche ici : les tâches
> vivent dans `ROADMAP.md`. Ce fichier documente le périmètre PCI, la
> politique de rétention/accès de la CIN, et le runbook de rotation de
> `KYC_ENC_KEY`.

## 1. Périmètre PCI — confirmation

**Aucune donnée de carte bancaire ne touche jamais un serveur Darna.**

Le paiement (frais de service Darna uniquement, jamais le loyer — cf.
`CLAUDE.md` §Paiement Konnect) est intégralement délégué à Konnect :

- `initKonnectPayment()` (`src/lib/konnect.ts`) envoie à Konnect le montant
  et des métadonnées de commande, et reçoit en retour `{ payUrl, paymentRef }`
  — **jamais** de numéro de carte, CVV ou date d'expiration en entrée ni en
  sortie.
- `KonnectPayButton` redirige le navigateur du client vers `payUrl` (page
  Konnect elle-même, hors domaine Darna) via `window.location` — la saisie
  de la carte se fait entièrement sur l'infrastructure Konnect.
- La confirmation revient par le webhook (`src/app/api/payments/konnect/
  webhook/route.ts`, `GET ?payment_ref=…`) et/ou le retour navigateur
  (`?konnect=success`) : dans les deux cas, uniquement une référence de
  paiement (`paymentRef`) et un statut, jamais de données de carte.

Conclusion technique : l'architecture correspond à un marchand qui
externalise entièrement la capture des données de carte à un prestataire
tiers via redirection — le modèle qui minimise le périmètre de conformité
côté marchand. **Ceci reste une lecture d'architecture, pas une
certification légale/PCI-DSS formelle** — à faire valider si un jour
requis par un partenaire (Konnect ou une banque), mais rien à corriger
côté code aujourd'hui.

## 2. CIN — rétention et accès

### Stockage

- `User.cin` (`prisma/schema.prisma`) : chiffré au repos (AES-256-GCM) dès
  que `KYC_ENC_KEY` est défini ; passthrough en clair sinon (dev/démo
  uniquement — `src/lib/env.ts` interdit ce cas en `KYC_MODE=production`,
  boot fail-fast). Cf. `src/lib/crypto.ts`.
- `User.cinHash` : empreinte déterministe (SHA-256, poivrée par
  `KYC_ENC_KEY`), index **unique** — empêche deux comptes de partager la
  même CIN sans jamais exposer le numéro dans l'index.

### Qui peut voir la CIN en clair

**Un seul chemin de code déchiffre la CIN** :
`src/app/contrat/[id]/page.tsx` (génération du bail pour les demandes de
contact sur une annonce LOCATION). Accès restreint au propriétaire de
l'annonce **ou** à l'auteur de la demande de contact
(`request.property.owner.id === user.id || request.senderId === user.id`),
vérifié serveur avant tout déchiffrement — personne d'autre (pas
d'interface admin, pas d'autre page) ne lit `User.cin` en clair.

### Durée de conservation

Pas de minuteur dédié à la CIN : sa durée de vie suit celle du compte.

- Suppression de compte (`deleteAccountAction`, §L7.3) = **anonymisation
  en place**, jamais un vrai `DELETE` (la ligne survit pour l'historique
  comptable `Booking`/`HostInvoice`/`Review`) : `cin` et `cinHash` sont
  scrubbés à ce moment-là, avec `name`/`email`/`phone`/`image`.
- Tant que le compte existe, la CIN chiffrée existe (nécessaire au
  parcours KYC + génération de bail).
- Les sauvegardes Neon (PITR) héritent du chiffrement au repos de
  l'infrastructure Neon elle-même — frontière de confiance non
  re-mitigée au niveau applicatif (cohérent avec `docs/INFRASTRUCTURE.md`).

## 3. Rotation de `KYC_ENC_KEY`

Script : `scripts/rotate-kyc-key.ts` — **testé** (2026-07-30, cf. PR
associée) contre une base locale avec une CIN chiffrée manufacturée :
rotation réussie (déchiffrement avec la nouvelle clé via le vrai
`decryptSensitive()`, `cinHash` recalculé et vérifié identique à
`hashCin()` avec la nouvelle clé comme poivre, déchiffrement avec
l'ancienne clé qui échoue bien après rotation), dry-run vérifié sans
écriture, échec avec une mauvaise ancienne clé vérifié **sans corruption**
(échec net dès la première ligne, aucune CIN loguée en clair).

### Pourquoi une procédure dédiée (pas juste changer la variable d'env)

`KYC_ENC_KEY` sert de clé de chiffrement **et** de poivre pour `hashCin()`
— changer sa valeur sans re-chiffrer rend instantanément **illisibles**
toutes les CIN existantes (`decryptSensitive` lève une erreur) et casse la
contrainte d'unicité (`cinHash` stocké ne correspond plus à aucune valeur
recalculable). La rotation doit donc re-chiffrer ET recalculer `cinHash`
pour chaque ligne AVANT que l'environnement de production ne bascule sur
la nouvelle clé.

### Procédure (ordre impératif)

1. **Fenêtre de maintenance** (ou au minimum période de faible trafic) —
   le script ne verrouille pas les écritures concurrentes : une CIN
   modifiée pendant la rotation (nouvelle vérification KYC en cours) serait
   écrite avec l'ANCIENNE clé (l'app tourne encore dessus) et pourrait être
   manquée si le script est déjà passé sur cette ligne.
2. Noter le nombre de comptes avec CIN avant rotation :
   `SELECT count(*) FROM "User" WHERE cin IS NOT NULL;`
3. Dry-run d'abord, sur une copie/staging si possible :
   `KYC_ENC_KEY=<ancienne> NEW_KYC_ENC_KEY=<nouvelle> DRY_RUN=true npx tsx scripts/rotate-kyc-key.ts`
4. Rotation réelle : même commande sans `DRY_RUN`. **Ne s'arrête qu'en cas
   d'erreur** (clé fausse, donnée corrompue) — si elle s'arrête en cours de
   route, certaines lignes sont déjà sur la nouvelle clé et d'autres non :
   **ne pas basculer l'environnement** avant d'avoir soit terminé la
   rotation soit compris précisément où elle s'est arrêtée.
5. Vérifier le compte après rotation (doit être identique à l'étape 2).
6. **Seulement après succès complet** : mettre à jour `KYC_ENC_KEY` dans
   l'environnement de production avec la nouvelle valeur, redéployer.
7. Garder l'ancienne clé de côté (coffre séparé) jusqu'à confirmation que
   l'app fonctionne normalement sur la nouvelle — permet un retour arrière
   en re-rotant en sens inverse si un problème est découvert après coup.

### Quand l'utiliser

- Suspicion de fuite de `KYC_ENC_KEY`.
- Rotation périodique de routine (pas de fréquence imposée aujourd'hui —
  à trancher si un jour exigé par un partenaire/audit).
