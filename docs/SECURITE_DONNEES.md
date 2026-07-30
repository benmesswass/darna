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

## 4. Intégrité du journal d'audit (chaînage de hachage, §P3.5)

`AuditLog` (`src/lib/audit.ts`) est la preuve en cas de litige ou de
contrôle. Les actions **financières et identité** (liste `CHAINED_ACTIONS`
dans `src/lib/audit.ts` — paiements, réservations, factures hôte, crédits,
remboursements, vérifications KYC/CIN/téléphone/e-mail, vérification
d'annonce, promotion Wakil, suspension/réactivation/suppression de compte)
sont chaînées par hachage SHA-256 : chaque ligne inclut `hash` (dépend de
`prevHash` + ses propres champs) et `prevHash` (le `hash` de la ligne
chaînée précédente). Modifier une ligne après coup casse la chaîne de façon
détectable. Le reste de l'audit log (connexions, mise à jour de profil,
etc.) garde son comportement actuel, sans surcoût — périmètre volontairement
resserré, ajustable dans `CHAINED_ACTIONS` (dupliqué intentionnellement dans
les deux scripts ci-dessous, cf. commentaire dans `audit.ts`).

### Concurrence — pourquoi ce n'est pas trivial

Le journal reçoit des écritures de partout dans l'app, potentiellement en
parallèle (plusieurs requêtes serveur simultanées). Deux écritures
concurrentes qui liraient le même "dernier hash" produiraient une
**fourche** (deux lignes revendiquant le même prédécesseur) — la chaîne ne
serait plus une preuve fiable. `logAudit()` protège contre ça par
compare-and-swap sur `AuditChainState` (pointeur singleton vers le dernier
hash) via `updateMany({ where: { lastHash: <valeur lue> } })` : si une autre
écriture a déjà avancé le pointeur entre-temps, `count === 0` et on relit +
retente — même idiome que `settleKonnectBooking`
(`src/lib/payments.ts`), zéro SQL brut, zéro verrou explicite.

**Testé sous charge réelle** (pas seulement en théorie) : 25 écritures
vraiment concurrentes (`Promise.all`) contre Postgres réel.
- 1ʳᵉ version (retry immédiat, sans délai) : **3/25 échouaient** même après
  20 tentatives — effet troupeau, les perdants d'un round se réveillent
  tous au même instant et retentent tous ensemble, donc certains n'ont
  jamais l'occasion de gagner. Corrigé par un jitter aléatoire entre les
  tentatives (`chainRetryDelayMs`) — **25/25 réussies, de façon reproductible
  sur plusieurs runs** après le correctif.
- Piège écarté en vérifiant : l'ordre dans lequel une écriture GAGNE la
  course CAS peut différer de l'ordre dans lequel son `createdAt` a été
  capturé (un writer peut capturer un timestamp plus tôt mais perdre la
  course et être chaîné après). `scripts/verify-audit-chain.ts` suit donc
  les liens `prevHash`/`hash` de la chaîne elle-même, jamais un tri par
  date — la première version du script (triée par `createdAt`) produisait
  de **fausses alertes de rupture** sur des écritures pourtant intactes dès
  qu'il y avait de la vraie concurrence. Corrigé avant tout usage réel.

### Scripts

- `scripts/backfill-audit-chain.ts` — chaîne les lignes historiques
  (écrites avant l'introduction de cette fonctionnalité). Lancement **une
  seule fois**, juste après la migration, avant toute écriture chaînée en
  conditions réelles. Ne prouve l'absence d'altération qu'à partir de son
  exécution, pas rétroactivement sur l'historique déjà existant — limite
  inhérente, pas un bug.
- `scripts/verify-audit-chain.ts` — lecture seule, vérifie toute la chaîne,
  exit 1 si une rupture est détectée (utilisable en job planifié). Signale
  précisément quelle(s) ligne(s) posent problème.

Testé de bout en bout (base locale) : lignes historiques manufacturées →
backfill → vérification (intacte) → écritures live réelles en plus →
vérification (toujours intacte) → **altération manuelle directe d'une
ligne** (`UPDATE` du `metadata` en laissant le `hash` intact, comme un
attaquant qui ignorerait le mécanisme de chaînage) → vérification :
**la ligne altérée est détectée avec précision**, une seule rupture
signalée, exactement la ligne modifiée.
