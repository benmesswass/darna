/**
 * Dictionnaire français — locale de référence : sa forme définit le type
 * `Dictionary` que `en.ts` et `ar.ts` doivent satisfaire à l'identique.
 */
export const fr = {
  meta: {
    siteName: "Darna",
    tagline: "Notre maison, en toute confiance",
    description:
      "Darna — séjours et immobilier en Tunisie. Annonces vérifiées, prix transparents, paiement protégé.",
  },
  nav: {
    sejours: "Séjours",
    immobilier: "Immobilier",
    prixDuMarche: "Prix du marché",
    simulateur: "Combien gagner ?",
    diaspora: "Tunisiens à l'étranger",
    devenirWakil: "Devenir Wakil",
    connexion: "Connexion",
    inscription: "Inscription",
    dashboard: "Mon espace",
    deconnexion: "Déconnexion",
    publier: "Publier une annonce",
    menu: "Menu",
    precedent: "Précédent",
    suivant: "Suivant",
  },
  brand: {
    heroTitle: "Ce que vous voyez existe.",
    heroLine2: "Le prix affiché est le prix payé.",
    heroLine3: "Votre argent est protégé.",
    heroSub:
      "Darna est la première plateforme tunisienne où chaque annonce est vérifiable, chaque prix est transparent et chaque paiement est protégé jusqu'à la fin du séjour.",
    ctaSejours: "Trouver un séjour",
    ctaImmobilier: "Explorer l'immobilier",
  },
  home: {
    villesPopulaires: "Destinations populaires :",
    statsAnnoncesVerifiees: "annonces vérifiées actives",
    statsVilles: "villes couvertes",
    statsAvis: "avis de séjours réels",
    verticalSejoursTitle: "Séjours",
    verticalSejoursDesc:
      "Villas, maisons d'hôtes et appartements pour vos vacances — calendrier réel, avis de vrais voyageurs, paiement protégé.",
    verticalImmobilierTitle: "Immobilier",
    verticalImmobilierDesc:
      "Location longue durée et vente — annonces fraîches, prix au m² du marché, contact direct propriétaire ou agence.",
    tabSejoursSub: "Vacances vérifiées",
    tabImmoSub: "Acheter ou louer",
    tabSejoursDesc:
      "Villas et maisons d'hôtes pour vos vacances, paiement protégé.",
    tabImmoDesc:
      "Vente et location longue durée, en direct avec le propriétaire.",
    heroQuestion: "Que cherchez-vous ?",
    diffTitle: "Séjours ou Immobilier ?",
    diffSejours:
      "Pour vos vacances : réservez un logement vérifié et payez en sécurité — l'argent n'est versé à l'hôte qu'après votre séjour.",
    diffImmo:
      "Pour habiter à l'année : achat ou location longue durée, en contact direct avec le propriétaire ou l'agence — sans paiement en ligne.",
    trustTitle: "Comment Darna vous protège",
    trust1Title: "Annonces vérifiées",
    trust1Desc:
      "Nos Wakils visitent les biens sur le terrain. Le badge « Vérifié Darna » garantit que le bien existe et correspond aux photos.",
    trust2Title: "Zéro frais caché",
    trust2Desc:
      "Le récapitulatif détaille chaque dinar avant paiement : prix, nuits, frais de service. Aucun frais de visite, jamais.",
    trust3Title: "Paiement protégé",
    trust3Desc:
      "Votre paiement n'est versé à l'hôte qu'après votre séjour : il reste protégé par Darna tant que vous n'êtes pas reparti.",
    featuredTitle: "Annonces vérifiées récentes",
    featuredAll: "Voir toutes les annonces",
    alaUneTitle: "À la une",
    alaUneSub: "Les coups de cœur mis en avant par nos hôtes.",
    statsTitle: "Le marché en direct",
    statsDesc:
      "L'Indice Darna agrège les prix réels de la plateforme : consultez les prix au m² par gouvernorat et les nuitées moyennes par ville.",
    statsCta: "Consulter l'Indice Darna",
    diasporaTitle: "Tunisiens à l'étranger",
    diasporaDesc:
      "Cherchez, comparez et réservez depuis l'Europe en toute confiance — affichage en euros et visites vidéo bientôt disponibles.",
    diasporaCta: "Découvrir l'espace dédié",
    wakilTitle: "Devenez Wakil Darna",
    wakilDesc:
      "Rejoignez le réseau d'agents de confiance qui vérifient les biens sur le terrain et gagnez un revenu complémentaire.",
    wakilCta: "Postuler",
    liveTrustTitle: "La confiance en direct",
    liveTrustProgress: (count: number, target: number) =>
      `${count} / ${target} annonces vérifiées vers notre objectif`,
    liveTrustItem: (city: string, date: string) => `${city} · vérifiée le ${date}`,
    liveTrustCta: "Voir les annonces vérifiées",
  },
  footer: {
    baseline: "La confiance est notre produit.",
    explorer: "Explorer",
    confiance: "Confiance",
    aPropos: "À propos",
    cgu: "CGU",
    mentionsLegales: "Mentions légales",
    confidentialite: "Politique de confidentialité",
    contact: "Contact",
    copyright: "Darna — fait avec soin en Tunisie.",
  },
  common: {
    tnd: "TND",
    eur: "€",
    parNuit: "/ nuit",
    parMois: "/ mois",
    chambres: "pièces",
    voyageurs: "voyageurs",
    surface: "m²",
    rechercher: "Rechercher",
    voir: "Voir",
    annuler: "Annuler",
    enregistrer: "Enregistrer",
    envoyer: "Envoyer",
    fermer: "Fermer",
    retour: "Retour",
    imprimer: "Imprimer",
    chargement: "Chargement…",
    erreurInconnue: "Une erreur est survenue. Merci de réessayer.",
    reessayer: "Réessayer",
    champsRequis: "Merci de vérifier les champs du formulaire.",
    tropDeTentatives:
      "Trop de tentatives. Merci de patienter quelques minutes avant de réessayer.",
    optionnel: "optionnel",
  },
  badges: {
    verifie: "Vérifié Darna",
    verifieRemote: "Vérifié par Darna",
    verifieOnSite: "Certifié Wakil",
    nonVerifie: "Non vérifié",
    publieAujourdhui: "Publié aujourd'hui",
    publieHier: "Publié hier",
    publieIlYa: (jours: number) => `Publié il y a ${jours} jours`,
    expiree: "Annonce expirée",
    enAttenteValidation: "En attente de validation",
    loue: "Loué",
    vendu: "Vendu",
    sejour: "Séjour",
    location: "Location",
    vente: "Vente",
    alaUne: "À la une",
    alaUneTooltip:
      "Annonce mise en avant : elle apparaît en tête des résultats et sur l'accueil de Darna.",
    promo: (pct: number) => `Promo -${pct} %`,
    superHote: "Super-Hôte",
    superHoteTooltip:
      "Zéro annulation et avis excellents sur les 3 derniers mois — un hôte fiable, vérifié sur ses résultats réels.",
  },
  search: {
    villePlaceholder: "Ville — Hammamet, Djerba, La Marsa…",
    suggestionsVilles: "Suggestions de villes",
    suggestionsGouvernorats: "Suggestions de gouvernorats",
    ouAllezVous: "Où allez-vous ?",
    arrivee: "Arrivée",
    depart: "Départ",
    datePlaceholder: "jj/mm/aaaa",
    voyageurs: "Voyageurs",
    transaction: "Transaction",
    louer: "Louer",
    acheter: "Acheter",
    gouvernorat: "Gouvernorat",
    tousGouvernorats: "Tous les gouvernorats",
    prix: "Prix",
    prixMin: "Prix min",
    prixMax: "Prix max",
    min: "min",
    max: "max",
    totalSejour: (n: number) => `au total · ${n === 1 ? "1 nuit" : `${n} nuits`}`,
    equivSejour: (n: number) => `Soit pour ${n === 1 ? "1 nuit" : `${n} nuits`} :`,
    surfaceMin: "Surface min (m²)",
    piecesMin: "Pièces min",
    chambresMin: "Chambres min",
    typeBien: "Type de bien",
    indifferent: "Indifférent",
    creerAlerte: "Créer une alerte",
    alerteEnregistree: "Alerte créée — vous serez prévenu par e-mail.",
    alerteExisteDeja: "Vous avez déjà une alerte pour cette recherche.",
    resultats: (n: number) =>
      n === 0 ? "Aucun résultat" : n === 1 ? "1 annonce" : `${n} annonces`,
    precedent: "Précédent",
    suivant: "Suivant",
    pageInfo: (page: number, total: number) => `Page ${page} / ${total}`,
    aucunResultatTitre: "Aucune annonce ne correspond",
    aucunResultatDesc:
      "Essayez d'élargir vos critères ou de retirer des filtres. Les annonces expirées sont automatiquement retirées des résultats.",
    aucuneAnnonceVille: (ville: string) =>
      `Aucune annonce à ${ville} pour ces dates`,
    elargirProche: "Élargissez votre recherche aux villes proches :",
    elargirPopulaire: "Découvrez plutôt nos destinations les plus actives :",
    elargiProximiteIntro: "Voici des séjours dans les villes les plus proches :",
    voirToutVille: (ville: string, n: number) =>
      `${ville} · voir ${n === 1 ? "1 annonce" : `les ${n} annonces`}`,
    hoteAbsentTitre: (ville: string) =>
      `Vous avez un logement à ${ville} ? Des voyageurs en cherchent déjà.`,
    hoteAbsentDesc: (ville: string) =>
      `Des voyageurs cherchent déjà un séjour à ${ville}. Devenez le premier hôte de la destination et publiez votre première annonce en quelques minutes.`,
    hoteCtaBouton: "Devenir hôte",
    voirListe: "Liste",
    voirCarte: "Carte",
    chargementCarte: "Chargement de la carte…",
    agrandirCarte: "Agrandir la carte",
    fermerCarte: "Fermer la carte",
    sansAvis: "Pas encore d'avis",
    filtres: "Filtres",
    reinitialiser: "Réinitialiser",
    verifiesUniquement: "Vérifiés uniquement",
    noteMinimale: "Note minimale",
    toutesNotes: "Toutes les notes",
    noteMinPlus: (n: number) => `${n}★ et +`,
    trier: "Trier",
    triRecommande: "Recommandé",
    triPrixAsc: "Prix croissant",
    triPrixDesc: "Prix décroissant",
    triAvisDesc: "Mieux notés",
    triAvisAsc: "Moins bien notés",
    triRecent: "Plus récent",
    equipements: "Équipements",
  },
  destination: {
    chargement: "Chargement de la destination…",
    logementsDispo: (n: number) =>
      n <= 0
        ? "Aucun logement disponible"
        : n === 1
          ? "1 logement disponible"
          : `${n} logements disponibles`,
    voirTout: (n: number) => (n === 1 ? "Voir l'annonce" : `Voir les ${n} logements`),
    recommandations: "Nos recommandations",
    aucunIci: "Pas encore de logement ici — à découvrir tout près :",
    autreDestination: "Ou explorez une autre destination",
    destinationsPopulaires: "Destinations du moment",
    verifie: "Vérifié",
    meteoClear: "Ensoleillé",
    meteoClouds: "Nuageux",
    meteoRain: "Pluvieux",
    meteoActuelle: "Météo actuelle",
    meteoSejour: "Pour votre séjour",
    meteoMoyenneSaison: "moyenne de saison",
  },
  property: {
    description: "Description",
    caracteristiques: "Caractéristiques",
    equipements: "Équipements",
    localisation: "Localisation",
    ouvrirGoogleMaps: "Ouvrir dans Google Maps",
    disponibilites: "Disponibilités",
    avis: "Avis des voyageurs",
    nbAvis: (n: number) => (n === 1 ? "1 avis" : `${n} avis`),
    voirAvis: "Voir les avis",
    annoncesSimilaires: "Annonces similaires",
    avisGarantie:
      "Chaque avis provient d'une réservation confirmée sur Darna — impossible d'en publier un sans avoir séjourné.",
    aucunAvis: "Aucun avis pour le moment — soyez le premier après votre séjour.",
    avisVerifie: "Séjour vérifié",
    avisSystemeAnnulationHote: (checkIn: string, checkOut: string) =>
      `Séjour du ${checkIn} au ${checkOut} annulé par l'hôte. Remboursement intégral effectué au voyageur.`,
    avisSystemeLabel: "Note automatique",
    noteGlobale: "Note globale",
    surface: (m: number) => `${m} m²`,
    pieces: (n: number) => (n === 1 ? "1 pièce" : `${n} pièces`),
    capacite: (n: number) => (n === 1 ? "1 voyageur" : `${n} voyageurs`),
    activiteVues: (n: number) => `${n} personnes ont consulté cette annonce récemment`,
    activiteDerniereResa: (jours: number) =>
      jours === 0
        ? "Réservée aujourd'hui"
        : jours === 1
          ? "Réservée hier"
          : `Dernière réservation il y a ${jours} jours`,
    reserver: "Réserver",
    contacter: "Contacter",
    whatsapp: "WhatsApp",
    fraisServiceInfo: "Frais de service transparents inclus au paiement",
    verifieTooltip:
      "Ce bien a été visité et vérifié par un Wakil Darna : il existe, et les photos correspondent.",
    verifieRemoteTooltip:
      "L'équipe Darna a contrôlé les photos, l'identité du propriétaire et effectué un appel vidéo.",
    verifieOnSiteTooltip:
      "Un agent Wakil s'est rendu physiquement sur place. Le bien existe, les photos sont conformes à la réalité.",
    verifieRemoteCriteres: "Photos · Identité · Appel vidéo",
    verifieOnSiteCriteres: "Visite · Photos · Identité",
    verifieRemoteBloc:
      "L'équipe Darna a contrôlé les photos et les informations de cette annonce (appel vidéo ou vérification documentaire avec le propriétaire).",
    verifieOnSiteBloc:
      "Un agent Wakil s'est rendu sur place. Il a confirmé que le bien existe, que les photos sont conformes à la réalité et que le propriétaire est joignable.",
    verifiePar: (nom: string) => `par ${nom}`,
    promoTooltip: (date: string) => `Prix réduit temporairement par l'hôte, jusqu'au ${date}.`,
    enSavoirPlusWakil: "En savoir plus sur le réseau Wakil",
    enSavoirPlusDarna: "En savoir plus sur nos contrôles",
    nonVerifieTooltip:
      "Ce bien n'a pas encore été vérifié sur le terrain. Ne versez jamais d'acompte hors de Darna.",
    proprietaire: "Propriétaire",
    agence: "Agence",
    hoteMasque: "Hôte vérifié — identité révélée à la réservation",
    annonceIndisponible:
      "Cette annonce n'est plus active. Elle est conservée à titre d'archive.",
    annonceEnAttente:
      "Cette annonce est en cours de vérification par l'équipe Darna. Elle sera visible dès validation.",
    legende: "Indisponible",
    jourLibre: "Libre",
    publierAvis: "Laisser un avis",
    sousNoteProprete: "Propreté",
    sousNoteCommunication: "Communication",
    sousNoteConformite: "Conformité à l'annonce",
    sousNoteQualitePrix: "Rapport qualité/prix",
    votreCommentaire: "Votre commentaire",
    avisEnvoye: "Merci ! Votre avis a été publié.",
    avisRefuse:
      "Seuls les voyageurs ayant une réservation confirmée et terminée peuvent laisser un avis.",
    trierPar: "Trier par",
    triRecents: "Plus récents",
    triAnciens: "Plus anciens",
    triMeilleures: "Meilleures notes",
    triMoins: "Notes les plus basses",
    filtreToutes: "Toutes les notes",
    filtreParNote: (n: number) => (n === 1 ? "1 étoile" : `${n} étoiles`),
    aucunAvisFiltre: "Aucun avis ne correspond à ce filtre.",
    afficherPlusAvis: (n: number) => `Afficher les ${n} autres avis`,
    afficherMoinsAvis: "Afficher moins",
    favoriAjouter: "Ajouter aux favoris",
    favoriRetirer: "Retirer des favoris",
    favoriChoisirDossier: "Enregistrer dans un dossier",
    favoriNouveauDossier: "Nouveau dossier",
    favoriNomDossier: "Nom du dossier",
    favoriCreerDossier: "Créer et enregistrer",
    favoriAnnuler: "Annuler",
    favoriSansDossier: "Sans dossier",
    partagerWhatsapp: (titre: string, prix: string) =>
      `Bonjour, je suis intéressé(e) par votre annonce « ${titre} » (${prix}) vue sur Darna. Est-elle toujours disponible ?`,
    partager: "Partager",
    copierLien: "Copier le lien",
    lienCopie: "Lien copié !",
    partagerMessage: (titre: string) => `Découvrez « ${titre} » sur Darna :`,
    politiqueAnnulation: "Politique d'annulation",
    cancelPolicy: {
      FLEXIBLE: "Flexible",
      MODEREE: "Modérée",
      FERME: "Ferme",
      STRICTE: "Stricte",
    } as Record<string, string>,
    cancelPolicyDesc: {
      FLEXIBLE: "Annulation gratuite jusqu'à 24 h avant l'arrivée.",
      MODEREE: "Annulation gratuite jusqu'à 5 jours avant l'arrivée.",
      FERME:
        "Annulation gratuite jusqu'à 30 jours avant ; 50 % remboursé entre 7 et 30 jours ; aucun remboursement à moins de 7 jours.",
      STRICTE: "50 % remboursé si annulé au moins 14 jours avant ; aucun remboursement après.",
    } as Record<string, string>,
    gallery: {
      ouvrir: "Ouvrir la galerie",
      voirToutes: (n: number) => `Voir les ${n} photos`,
      fermer: "Fermer",
      precedente: "Photo précédente",
      suivante: "Photo suivante",
      compteur: (i: number, n: number) => `${i} / ${n}`,
      allerA: (i: number) => `Aller à la photo ${i}`,
      pleinEcran: "Plein écran",
      quitterPleinEcran: "Quitter le plein écran",
      chargement: "Chargement de la photo…",
      aucunePhoto: "Aucune photo pour cette annonce.",
      boucleDebut: "Retour au début",
      boucleFin: "Dernière photo",
    },
  },
  auth: {
    connexionTitre: "Connexion à Darna",
    inscriptionTitre: "Créer un compte Darna",
    email: "Adresse e-mail",
    motDePasse: "Mot de passe",
    nom: "Nom complet",
    telephone: "Téléphone (+216…)",
    role: "Je suis…",
    roleVoyageur: "Voyageur / Locataire",
    roleHote: "Hôte / Propriétaire",
    roleAgence: "Agence immobilière",
    seConnecter: "Se connecter",
    sInscrire: "S'inscrire",
    dejaCompte: "Déjà un compte ?",
    pasDeCompte: "Pas encore de compte ?",
    identifiantsInvalides: "Identifiants invalides.",
    captchaEchec: "Vérification anti-robot échouée. Veuillez réessayer.",
    emailDejaUtilise: "Impossible de créer le compte avec ces informations.",
    inscriptionReussie: "Compte créé ! Vous pouvez vous connecter.",
    parrainageBanniere: (montant: number) =>
      `Vous avez été invité·e sur Darna — ${montant} TND de crédit vous seront offerts dès votre inscription.`,
    motDePasseRegle: "8 caractères minimum",
    afficherMotDePasse: "Afficher le mot de passe",
    masquerMotDePasse: "Masquer le mot de passe",
    confirmerMotDePasse: "Confirmer le mot de passe",
    motDePasseNonIdentiques: "Les mots de passe ne sont pas identiques.",
    compteCreeConnectezVous: "Compte créé ! Connectez-vous pour continuer.",
    pays: "Pays de résidence",
    motDePasseOublie: "Mot de passe oublié ?",
    resetTitre: "Réinitialiser le mot de passe",
    resetSousTitre:
      "Saisissez l'adresse e-mail de votre compte : nous vous enverrons un lien de réinitialisation.",
    resetEnvoyer: "Envoyer le lien",
    resetEmailEnvoye:
      "Si un compte existe pour cette adresse, un lien de réinitialisation vient d'être envoyé.",
    resetModeDemo: "Mode démo — lien de réinitialisation :",
    resetOuvrirLien: "Ouvrir le lien de réinitialisation",
    resetNouveauMdp: "Nouveau mot de passe",
    resetValider: "Réinitialiser le mot de passe",
    resetReussi: "Mot de passe réinitialisé. Vous pouvez vous connecter.",
    resetLienInvalide:
      "Lien invalide ou expiré. Merci de refaire une demande de réinitialisation.",
    resetMotDePasseInvalide:
      "Le mot de passe doit faire au moins 8 caractères et contenir un chiffre.",
    resetRetourConnexion: "Retour à la connexion",
    resetMailSujet: "Darna — réinitialisation de votre mot de passe",
    resetMailCorpsHtml: (url: string) =>
      `<p>Vous avez demandé à réinitialiser votre mot de passe Darna.</p>` +
      `<p><a href="${url}">Cliquez ici pour choisir un nouveau mot de passe</a>.</p>` +
      `<p>Ce lien expire dans 30 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>`,
  },
  dashboard: {
    titre: "Mon espace",
    bonjour: (nom: string) => `Bonjour, ${nom}`,
    mesAnnonces: "Mes annonces",
    mesReservations: "Mes réservations",
    mesVoyageurs: "Mes voyageurs",
    demandesRecues: "Demandes reçues",
    yieldAdvisor: "Yield Advisor",
    kyc: "Vérification d'identité",
    email: "Vérification e-mail",
    monProfil: "Mes informations",
    mesAlertes: "Mes alertes",
    alertesTitre: "Mes alertes de recherche",
    alertesAucune:
      "Aucune alerte enregistrée. Depuis la recherche séjours, cliquez sur « Créer une alerte » pour être prévenu par e-mail dès qu'une annonce correspondante est publiée.",
    alerteSupprimer: "Supprimer",
    alerteBudget: (min: number, max: number) => `${min} – ${max} TND`,
    alerteBudgetMin: (min: number) => `À partir de ${min} TND`,
    alerteBudgetMax: (max: number) => `Jusqu'à ${max} TND`,
    alerteBudgetLibre: "Tous budgets",
    mesCredits: "Mes crédits",
    favoris: "Mes favoris",
    favorisSansDossier: "Sans dossier",
    favorisNbLogements: (n: number) =>
      `${n} logement${n > 1 ? "s" : ""}`,
    favorisRenommer: "Renommer",
    favorisSupprimerDossier: "Supprimer",
    favorisSupprimerConfirm:
      "Supprimer ce dossier ? Les logements enregistrés seront déplacés vers « Sans dossier ».",
    favorisEnregistrer: "Enregistrer",
    favorisAnnuler: "Annuler",
    nouvelleAnnonce: "Nouvelle annonce",
    aucuneAnnonce: "Vous n'avez pas encore d'annonce.",
    aucuneAnnonceCta: "Publiez votre première annonce en quelques minutes.",
    creerAnnonce: "Créer une annonce",
    statut: "Statut",
    expireLe: (date: string) => `Expire le ${date}`,
    expireDans: (jours: number) =>
      jours <= 0 ? "Expirée" : `Expire dans ${jours} j`,
    marquerLoue: "Marquer comme loué",
    marquerVendu: "Marquer comme vendu",
    republier: "Republier (+30 j)",
    annonceMarquee: "Annonce mise à jour.",
    voirAnnonce: "Voir l'annonce",
    voirProfilHote: "Voir le profil de l'hôte",
    voirProfilVoyageur: "Voir le profil du voyageur",
    mettreALaUne: "Mettre à la une",
    prolongerALaUne: "Prolonger à la une",
    alaUneActif: (date: string) => `À la une jusqu'au ${date}`,
    alaUneSucces: "Votre annonce est désormais à la une ! 🎉",
    promoLien: "Promo",
    promoActifBanner: (date: string) => `Promo active jusqu'au ${date}`,
    annonceMasqueeBanner: (date: string) =>
      `Annonce temporairement masquée des recherches suite à une annulation de votre part — elle réapparaît le ${date}.`,
    promoAlaUneTitre: "Passez vos annonces à la une",
    promoAlaUneDesc:
      "En tête des résultats et sur l'accueil pendant un mois, avec un badge doré qui attire l'œil. Les annonces mises en avant sont vues bien plus souvent.",
    completudeTitre: (score: number, total: number) => `Annonce complète à ${score}/${total}`,
    completudePhotos: "Au moins 5 photos",
    completudeDescription: "Description détaillée",
    completudeEquipements: "Au moins 3 équipements",
    completudeCta: "Compléter l'annonce",
    verifWakilSolde: (n: number) =>
      n === 1
        ? "1 crédit de vérification Wakil disponible."
        : n === 0
          ? "Aucun crédit de vérification Wakil — payez à l'unité pour faire vérifier une annonce."
          : `${n} crédits de vérification Wakil disponibles.`,
    verifWakilPrix: "Prix de la vérification",
    verifWakilPayer: "Payer la vérification",
    verifWakilPayerSimulation: "Payer la vérification (simulation)",
    verifWakilCreditPret:
      "Crédit de vérification prêt — un Wakil va bientôt examiner cette annonce.",
    aucuneReservation: "Aucune réservation pour le moment.",
    aucuneReservationCta: "Trouvez votre prochain séjour parmi nos annonces vérifiées.",
    aucuneReservationHote: "Aucun voyageur n'a encore réservé vos annonces.",
    aucuneReservationHoteCta:
      "Dès qu'un voyageur réserve l'une de vos annonces, il apparaîtra ici.",
    reservePar: (nom: string) => `Réservé par ${nom}`,
    payeLe: (date: string) => `Payé le ${date}`,
    contactVoyageurMasque:
      "Coordonnées du voyageur visibles dès que son acompte est réglé.",
    suspenduJusqu: (date: string) => `Compte suspendu jusqu'au ${date}`,
    suspenduIndefini: "Compte suspendu",
    suspenduDetail:
      "Le reste de votre compte reste accessible. Pendant la suspension, vous ne pouvez pas faire de nouvelle réservation ni envoyer de messages.",
    enSavoirPlus: "En savoir plus",
    suspenduPourquoiTitre: "Pourquoi ?",
    // Motif RÉEL de la suspension (User.suspensionReason) — jamais le même
    // texte générique pour toutes les causes possibles. Le cas legacy (null,
    // suspendu avant l'introduction de ce champ) retombe sur le motif
    // historique, seul possible à l'époque.
    suspenduPourquoiMessageBypass:
      "Plusieurs tentatives de partage de coordonnées hors Darna (numéro ou e-mail) ont été détectées dans vos messages, ce qui n'est pas autorisé tant que la réservation n'est pas ferme.",
    suspenduPourquoiNoShow:
      "Vous ne vous êtes pas présenté pour un séjour confirmé payé sur place, ce qui pénalise l'hôte qui vous avait réservé les dates.",
    suspenduPourquoiHostCancel:
      "Vous avez annulé une réservation déjà confirmée — le voyageur a été intégralement remboursé, mais annuler après confirmation reste pénalisé.",
    suspenduPourquoiFactureImpayee:
      "Une facture de commission Darna reste impayée malgré une relance — merci de la régler pour lever la suspension.",
    // Levier de recouvrement (§PSP6) : bannière tant qu'une facture de
    // commission dépasse son échéance — distincte de la suspension (peut
    // survenir avant qu'un admin ne suspende manuellement).
    facturesEnRetardBanniereTitre: "Annonces masquées : facture en retard",
    facturesEnRetardBanniereDetail:
      "Le temps de régler votre facture de commission en retard, toutes vos annonces sont invisibles pour les voyageurs et non réservables.",
    facturesEnRetardBanniereCta: "Voir mes factures",
    suspenduConsequencesTitre: "Conséquences :",
    suspenduProchaine: (jours: number) =>
      `En cas de nouvelle tentative, la prochaine suspension durera ${jours} jours.`,
    suspenduProchaineIndefinie:
      "En cas de nouvelle tentative, votre compte sera suspendu de façon indéfinie (revue par un administrateur).",
    aucuneDemande: "Aucune demande reçue pour le moment.",
    demandesContactTitre: "Demandes de contact",
    aucunFavori: "Aucun favori pour le moment.",
    reservationDe: (nom: string) => `Réservation de ${nom}`,
    demandeDe: (nom: string) => `Demande de ${nom}`,
    contratBail: "Contrat de bail",
    statutReservation: {
      EN_ATTENTE: "En attente de paiement",
      EN_ATTENTE_ACCEPTATION: "Demande cash — en attente de votre décision",
      CONFIRMEE: "Confirmée — paiement protégé",
      ANNULEE: "Annulée",
      TERMINEE: "Terminée",
    } as Record<string, string>,
    annulerReservation: "Annuler cette réservation",
    annulerConfirm: "Confirmer l'annulation",
    annulerAnnuler: "Garder la réservation",
    accepterDemande: "Accepter la demande",
    refuserDemande: "Refuser",
    refuserConfirmer: "Confirmer le refus",
    refuserAnnuler: "Revenir",
    demandeCashRecapAide: (montant: number) =>
      `Le voyageur paiera ${montant} TND en espèces à l'arrivée. Votre commission Darna vous sera facturée séparément après acceptation.`,
    signalerNoShow: "Signaler une absence du voyageur",
    noShowConfirmer: "Confirmer l'absence",
    noShowAnnuler: "Revenir",
    noShowAvertissement:
      "Ne confirmez que si le voyageur ne s'est réellement pas présenté — cette action suspend son compte.",
    annulerReservationHote: "Annuler cette réservation",
    hostCancelModalTitre: "Annuler cette réservation ?",
    hostCancelAvertissementHumain:
      "Ce n'est pas un geste anodin : votre voyageur a organisé son séjour en vous faisant confiance. Ne le faites qu'en dernier recours.",
    hostCancelConsequencesTitre: "Si vous confirmez :",
    hostCancelConsequenceRemboursement: "Le voyageur sera intégralement remboursé",
    hostCancelConsequenceBlocage: (jours: number) =>
      `Cette annonce sera invisible sur Darna pendant ${jours} jours`,
    hostCancelConsequenceSuspension: (jours: number | null) =>
      `Votre compte sera suspendu ${jours ? `${jours} jours` : "indéfiniment"}`,
    confirmeeCashLabel: "Confirmée — à régler en cash à l'arrivée",
    confirmeeLe: (date: string) => `Confirmée le ${date}`,
    demandesCashTitre: "Demandes de réservation cash",
    demandesCashAide:
      "Demandes de réservation payées sur place, en attente de votre décision.",
    remboursement: (montant: number) =>
      montant > 0 ? `Remboursement : ${montant} TND` : "Aucun remboursement selon la politique",
    cancelledAt: (date: string) => `Annulée le ${date}`,
    rembourseLabel: (montant: number) => `Remboursé : ${montant} TND`,
    noterVoyageur: "Noter ce voyageur",
    avisVoyageurEnvoye: "Avis envoyé — merci !",
    votreAvisSurCeVoyageur: "Votre avis sur ce voyageur :",
    avisHoteSurVous: "Ce que l'hôte a dit de votre séjour :",
    revenus: "Revenus",
    revenusTitre: "Mes revenus",
    revenusSousTitre:
      "Le voyageur paie à la réservation ; Darna conserve le montant et vous le verse une fois son séjour terminé. C'est la garantie « paiement protégé » qui rassure les voyageurs et fait réserver.",
    revenusTotal: "Revenus confirmés",
    revenusEnAttente: "En attente de versement",
    revenusVerse: "Déjà versé",
    revenusAucun: "Aucun revenu pour le moment.",
    revenusAucunCta:
      "Dès qu'un voyageur paie une réservation, le montant apparaît ici — en attente de versement, puis versé après son départ.",
    revenusBadgeEnAttente: "En attente de versement",
    revenusBadgeVerse: "Versé",
    revenusVersementPrevu: (date: string) =>
      `Versement après le départ du voyageur (${date})`,
    revenusVerseApres: (date: string) => `Versé — séjour terminé le ${date}`,
  },
  annonceForm: {
    titre: "Titre de l'annonce",
    titrePlaceholder: "Villa avec piscine à Hammamet",
    type: "Type d'annonce",
    typeSejour: "Séjour (location touristique)",
    typeLocation: "Location longue durée",
    typeVente: "Vente",
    prix: "Prix",
    prixNuit: "Prix par nuit (TND)",
    prixMois: "Loyer mensuel (TND)",
    prixVente: "Prix de vente (TND)",
    ville: "Ville",
    gouvernorat: "Gouvernorat",
    adresse: "Adresse (quartier, rue)",
    surface: "Surface (m²)",
    pieces: "Nombre de pièces",
    capacite: "Capacité (voyageurs)",
    typeBien: "Type de bien",
    politiqueAnnulation: "Politique d'annulation",
    politiqueAnnulationAide:
      "Définit ce que le voyageur récupère s'il annule. Plus elle est souple, plus vous rassurez ; plus elle est stricte, plus vous protégez vos revenus.",
    equipements: "Équipements",
    description: "Description",
    genererDescription: "Générer la description",
    genererDescriptionAide:
      "Compose un texte à partir des champs saisis — modifiable ensuite.",
    publier: "Publier l'annonce",
    apercuPublier: "Aperçu avant publication",
    apercuTitre: "Aperçu de votre annonce",
    apercuAide: "Voici comment votre annonce apparaîtra aux voyageurs. Vérifiez, puis confirmez.",
    continuerEdition: "Continuer l'édition",
    confirmerPublier: "Confirmer et publier",
    annonceCreee: "Annonce publiée ! Elle est en ligne pour 30 jours.",
    modifierTitre: "Modifier l'annonce",
    enregistrerModifs: "Enregistrer les modifications",
    annonceModifiee: "Annonce mise à jour.",
    typeNonModifiable:
      "Le type d'annonce n'est pas modifiable après publication (réservations et historique liés).",
    photosTitre: "Photos de l'annonce",
    photosAide:
      "JPEG, PNG ou WebP — 5 Mo max par photo, 8 photos par annonce. La couverture est la première photo affichée.",
    photosAccroche:
      "Les annonces avec de belles photos sont consultées bien plus souvent. Ajoutez-en au moins une.",
    photosDeposer: "Glissez vos photos ici",
    photosDeposerAide: "ou parcourez vos fichiers — JPEG, PNG ou WebP",
    photosParcourir: "Parcourir mes photos",
    photosCreationAide: "La première photo servira de couverture à votre annonce.",
    photosReordonner: "Glissez les photos pour changer leur ordre.",
    photoRequise: "Ajoutez au moins une photo pour publier votre annonce.",
    ajouterPhotos: "Ajouter les photos",
    choisirFichiers: "Choisir des fichiers…",
    photosAjoutees: "Photos ajoutées !",
    supprimerPhoto: "Supprimer",
    definirCouverture: "Mettre en couverture",
    couverture: "Couverture",
    legendePhoto: "Description (facultatif)",
    legendePlaceholder: "Ex. : Séjour lumineux avec balcon",
    legendeAide:
      "Une courte description par photo, affichée en overlay dans la galerie.",
    legendeEnregistree: "Description enregistrée.",
    legendeEnregistrer: "Enregistrer",
    erreurUpload:
      "Fichier refusé : format accepté JPEG/PNG/WebP, taille maximale 5 Mo.",
    maxPhotos: (n: number) => `Maximum ${n} photos par annonce.`,
    localisation: "Emplacement sur la carte",
    adresseRecherchePlaceholder: "Tapez votre adresse : rue, quartier, ville…",
    rechercheAdresse: "Recherche…",
    aucuneAdresse: "Aucune adresse trouvée — choisissez la ville et déplacez le repère.",
    repereAide: "Déplacez le repère (ou cliquez sur la carte) pour pointer l'endroit exact.",
    disponibilitesTitre: "Bloquer des dates",
    disponibilitesAide:
      "Rendez votre logement indisponible sur une période (séjour perso, travaux…). Les dates bloquées disparaissent du calendrier de réservation des voyageurs.",
    bloquerDates: "Bloquer ces dates",
    aucunBlocage: "Aucune date bloquée pour le moment.",
    blocageAjoute: "Dates bloquées.",
    supprimerBlocage: "Retirer ce blocage",
    blocageRetraitConfirmer: "Retirer ce blocage ?",
    blocageRetraitOui: "Retirer",
    blocageNotePlaceholder: "Note (ex. séjour famille, travaux…) — facultatif",
    blocageDatesInvalides:
      "Dates invalides — choisissez une arrivée et un départ (départ après l'arrivée, période non passée).",
    blocageConflitReservation:
      "Impossible : une réservation existe déjà sur cette période.",
    promoAnnonceNonEligible:
      "Cette annonce doit être vérifiée et active pour bénéficier d'une promo.",
    promoPrixInvalide: "Le prix promo doit être inférieur au prix normal de l'annonce.",
    promoDateInvalide:
      "Date de fin de promo invalide — choisissez une date future, dans un délai raisonnable.",
    promoDefinie: "Promo activée sur votre annonce.",
    cashPaymentTitre: "Paiement sur place (cash)",
    cashPaymentAide:
      "Réservé aux voyageurs sans moyen de paiement en ligne adapté. Le séjour se règle intégralement en espèces à l'arrivée ; votre commission Darna vous est facturée séparément après la réservation, réglable en ligne.",
    cashPaymentToggle: "Accepter les réservations payées sur place (cash)",
    cashTermsPrefix: "J'ai lu et j'accepte les",
    cashTermsRequise:
      "Vous devez accepter les CGU hôte pour activer le paiement sur place.",
  },
  kyc: {
    titre: "Vérification d'identité (KYC)",
    sousTitre:
      "La vérification renforce la confiance : votre badge apparaît sur vos annonces et rassure les voyageurs.",
    statutNonVerifie: "Identité non vérifiée",
    statutEnAttente: "Vérification en cours",
    statutVerifie: "Identité vérifiée",
    cin: "Numéro de CIN (8 chiffres)",
    telephone: "Téléphone mobile (+216…)",
    indicatifPays: "Indicatif pays",
    telephonePlaceholder: "22 345 678",
    envoyerOtp: "Recevoir le code de vérification",
    otpMockInfo:
      "Mode démonstration : aucun SMS réel n'est envoyé. Votre code s'affiche ci-dessous.",
    otpSmsInfo: "Un code de vérification vous a été envoyé par SMS.",
    votreCode: "Votre code de vérification",
    saisirOtp: "Saisissez le code reçu",
    valider: "Valider le code",
    otpInvalide: "Code incorrect. Merci de réessayer.",
    verifieBravo:
      "Félicitations, votre identité est vérifiée ! Le badge apparaît désormais sur votre profil.",
    dejaVerifie: "Votre identité est déjà vérifiée.",
    statutVerifieDemo: "Identité vérifiée (démo)",
    verifieDemoBravo:
      "Vérification effectuée en mode démonstration. En production, un SMS réel sera requis pour obtenir le vrai badge vérifié.",
    kycRequis:
      "Votre identité doit être vérifiée avant de publier une annonce.",
    gateRequiseTitre: "Vérifiez votre identité pour publier",
    gateRequiseDesc:
      "Pour garantir la confiance sur Darna, seuls les propriétaires vérifiés peuvent publier une annonce. La vérification prend moins de deux minutes.",
    gateRequiseCta: "Vérifier mon identité",
    otpEnvoiEchoue:
      "Impossible d'envoyer le code de vérification pour le moment. Merci de réessayer dans quelques instants.",
    telephoneIntro:
      "Recevez un code par SMS ou WhatsApp pour confirmer votre numéro.",
    telephoneVerifie: "Téléphone vérifié.",
    telephoneRequis: "Vérifiez d'abord votre téléphone.",
    cinIntro:
      "Saisissez votre numéro de CIN. Il reste confidentiel et ne peut être associé qu'à un seul compte Darna.",
    validerCin: "Valider ma CIN",
    cinDejaUtilisee:
      "Cette CIN est déjà associée à un compte. Une pièce d'identité ne peut servir qu'à un seul compte Darna.",
  },
  // PR1 + PR2 — Section administration
  admin: {
    badge: "Admin",
    titre: "Administration Darna",
    annonces: "Annonces",
    navAnnonces: "Vérif. annonces",
    navWakils: "Vérif. Wakils",
    navSignalements: "Signalements",
    signalementsTitre: "Signalements anti-bypass",
    signalementsSousTitre:
      "Messages où des coordonnées ont été détectées et masquées. Repérez les tentatives de passage hors Darna et les récidivistes.",
    signalementsVide: "Aucun signalement pour le moment.",
    signalementsCompte: (n: number) =>
      n === 1 ? "1 tentative" : `${n} tentatives`,
    signalementsEscalade: (n: number) => `Récidiviste — ${n} tentatives`,
    signalementsSuspendu: "Compte suspendu",
    signalementsSuspenduJusqu: (date: string) => `Suspendu jusqu'au ${date}`,
    reactiver: "Réactiver le compte",
    navAnalytics: "Tableau de bord",
    wakils: "Wakils",
    fileModeration: "File de modération des annonces",
    fileModerationDesc:
      "Accordez le badge « Vérifié Darna » aux annonces dont le propriétaire a validé son identité (KYC). Les annonces dont le propriétaire n'est pas encore vérifié sont grisées — demandez-leur d'abord de passer par /dashboard/kyc.",
    annonce: "Annonce",
    proprietaire: "Propriétaire",
    kycStatut: "Identité propriétaire",
    kycStatutTooltip: "Statut de vérification d'identité du propriétaire",
    kycBloque: "Identité non vérifiée — demandez au propriétaire de valider son identité (/dashboard/kyc) avant d'accorder le badge.",
    statut: "Statut annonce",
    actions: "Actions",
    verifiee: "Vérifiée",
    nonVerifiee: "Non vérifiée",
    verifier: "Vérifier",
    verifierRemote: "Vérifié Darna (photos/vidéo)",
    verifierOnSite: "Certifié Wakil (sur place)",
    retirerVerification: "Retirer",
    verifiePar: (nom: string) => `Vérifié par ${nom}`,
    annonceMiseAVerifiee: "Annonce marquée comme vérifiée.",
    annonceMiseANonVerifiee: "Badge de vérification retiré.",
    proprietaireNonVerifie:
      "Le propriétaire doit être vérifié (KYC) pour que l'annonce reçoive le badge.",
    limiteAbonnementAtteinte: (limite: number) =>
      `Ce compte agence a atteint sa limite d'annonces actives (${limite}). Invitez-le à souscrire ou renouveler son abonnement (/dashboard/abonnement) avant de valider une annonce supplémentaire.`,
    creditsVerificationEpuises:
      "Ce compte agence n'a plus de crédit de vérification Wakil. Invitez-le à acheter un lot (/dashboard/abonnement) avant de vérifier une annonce supplémentaire.",
    hostVerificationPaiementRequis:
      "Ce particulier n'a pas encore payé la vérification Wakil de cette annonce (20 TND). Invitez-le à régler le paiement depuis /dashboard/annonces avant de la vérifier.",
    aucuneAnnonce: "Aucune annonce active pour le moment.",
    annoncesDejVerifiees: "Annonces déjà vérifiées",
    candidaturesWakil: "Candidatures Wakil",
    candidaturesWakilDesc:
      "Traitez les candidatures Wakil reçues. Accepter une candidature promeut automatiquement le compte lié.",
    aucuneCandidature: "Aucune candidature pour le moment.",
    accepter: "Accepter",
    refuser: "Refuser",
    planifierEntretien: "Entretien",
    entretienLabel: "Date d'entretien",
    entretienPlaceholder: "JJ/MM/AAAA HH:MM",
    entretienPlanifie: (date: string) => `Entretien prévu le ${date}`,
    candidatureRevue: "Candidature mise à jour.",
    revuePar: (nom: string) => `Revue par ${nom}`,
    supprimerCandidature: "Archiver",
    archiverCandidatureConfirm: "Archiver cette candidature ?",
    supprimerCandidatureConfirm: "Supprimer définitivement cette candidature ?",
    candidatureSupprimee: "Candidature archivée.",
    candidatureDefinitivementSupprimee: "Candidature supprimée définitivement.",
    wakilsSupprimees: "Candidatures archivées",
    wakilsSupprimeeesDesc: "Ces candidatures ont été archivées. Vous pouvez les supprimer définitivement.",
    supprimerDefinitivement: "Supprimer",
    aucuneCandidatureSupprimee: "Aucune candidature archivée.",
    navFactures: "Factures hôtes",
    facturesTitre: "Factures hôtes — paiement sur place",
    facturesSousTitre:
      "Commissions Darna dues par les hôtes en Rail 2 (paiement sur place). Relance et suspension manuelles.",
    facturesVide: "Aucune facture pour le moment.",
    facturesTotalDu: "Total dû",
    facturesTotalEncaisse: "Total encaissé",
    facturesEnRetard: (n: number) =>
      n === 1 ? "1 facture en retard" : `${n} factures en retard`,
    facturesColHote: "Hôte",
    facturesColAnnonce: "Annonce",
    facturesColMontant: "Montant",
    facturesColEcheance: "Échéance",
    facturesColStatut: "Statut",
    facturesStatutEnAttente: "En attente",
    facturesStatutPayee: "Réglée",
    facturesStatutEnRetard: "En retard",
    facturesRelancer: "Relancer",
    facturesRelanceLe: (date: string) => `Relancé le ${date}`,
    facturesSuspendre: "Suspendre le compte",
    facturesSuspendreConfirm:
      "Suspendre ce compte hôte pour facture impayée ? Il ne pourra plus publier ni recevoir de réservations jusqu'à réactivation.",
    navFinancement: "Leads financement",
    financementTitre: "Leads financement (apport d'affaires)",
    financementSousTitre:
      "Demandes de simulation de financement laissées sur des annonces en vente. Capture uniquement — aucun partenaire bancaire signé à ce stade (MONETISATION_IMMO_ROADMAP.md §MI5).",
    financementVide: "Aucun lead financement pour le moment.",
    financementExporter: "Exporter en CSV",
    financementColDate: "Date",
    financementColAnnonce: "Annonce",
    financementColContact: "Contact",
    financementColMontant: "Montant souhaité",
    financementColMessage: "Message",
  },
  // Tableau de bord founder — suivi d'adoption (ADMIN uniquement)
  analytics: {
    titre: "Tableau de bord",
    sousTitre:
      "Suivi de l'adoption de la plateforme : acquisition, activation, réservations et rétention. Données calculées en direct.",
    genereLe: (date: string) => `À jour le ${date}`,
    pourcent: (v: number) => `${Math.round(v * 100)} %`,
    rolesLabel: {
      VOYAGEUR: "Voyageurs",
      HOTE: "Hôtes",
      AGENCE: "Agences",
      ADMIN: "Admins",
    } as Record<string, string>,

    periodeLabel: "Période",
    periodes: { "7": "7 j", "30": "30 j", "90": "90 j", all: "Tout" } as Record<
      string,
      string
    >,
    periodeNom: (p: number | null) =>
      p === null ? "depuis le début" : `les ${p} derniers jours`,
    surPeriode: (label: string) => `Sur ${label}`,

    sectionVerticales: "Par verticale — Séjour vs Immobilier",
    verticalesDesc:
      "Deux modèles à ne pas mélanger : le séjour est transactionnel (paiement protégé), l'immobilier est de la mise en relation (leads, sans paiement en ligne).",
    verticalLabel: { STAY: "Séjour", IMMO: "Immobilier" } as Record<string, string>,
    vStayBadge: "Transactionnel",
    vImmoBadge: "Mise en relation",
    vActives: "Annonces actives",
    vVerifiees: "Vérifiées actives",
    vTaux: "Taux de vérif.",
    vReservations: "Réservations payées",
    vGmv: "GMV",
    vLeads: "Leads reçus",

    sectionNorthStar: "Vue d'ensemble",
    annoncesVerifieesActives: "Annonces vérifiées actives",
    annoncesVerifieesActivesDesc: "North-star produit",
    annoncesActives: "Annonces actives",
    tauxVerification: "Taux de vérification",
    gmv: "Volume réservé (GMV)",
    gmvDesc: "Réservations payées, démo incluse",
    gmvReelle: "dont réel (hors démo)",
    reservationsConfirmees: "Réservations confirmées",
    utilisateursTotal: "Comptes créés",

    sectionAcquisition: "Acquisition & activation",
    inscriptions7j: "Inscriptions (7 j)",
    inscriptions30j: "Inscriptions (30 j)",
    inscriptionsParJour: (n: number) => `Inscriptions / jour — ${n} derniers jours`,
    repartitionRoles: "Répartition par rôle",
    repartitionPays: "Répartition par pays",
    repartitionPaysDesc: "Comptes par pays déclaré — pilotage diaspora.",
    paysNonRenseigne: "Non renseigné",
    tauxEmailVerifie: "E-mails vérifiés",
    tauxKyc: "Identité vérifiée (annonceurs)",
    annonceursActifs: "Annonceurs avec annonce",
    annonceursActifsDesc: "Part des hôtes/agences ayant publié",

    sectionDecouverte: "Funnel de découverte",
    decouverteDesc:
      "En amont de la réservation : recherche → vue d'annonce → début de réservation. Sourcé des événements produit (SEARCH_PERFORMED, LISTING_VIEWED, BOOKING_STARTED).",
    funnelRecherches: "Recherches",
    funnelVues: "Vues d'annonce",
    funnelDebuts: "Débuts de réservation",

    sectionFunnel: "Funnel de réservation",
    funnelDesc:
      "De la réservation créée au paiement confirmé. Les paliers reflètent la table des réservations.",
    funnelCreees: "Créées",
    funnelInitiees: "Paiement initié",
    funnelConfirmees: "Confirmées",
    funnelAnnulees: "Annulées",
    funnelExpirees: "Expirées (15 min)",
    funnelEnAttente: "En attente",
    tauxConversion: "Taux de conversion",
    tauxAbandon: "Taux d'abandon",

    sectionAdoption: "Adoption de fonctionnalités",
    adoptionDesc:
      "Usage réel des fonctionnalités déjà livrées, sur la période sélectionnée.",
    adoptionSimulateur: "Simulateur de revenus utilisé",
    adoptionPartages: "Partages d'annonce",
    adoptionCarte: "Interactions carte",
    adoptionAlertesCreees: "Alertes créées",
    adoptionAlertesDeclenchees: "Alertes déclenchées",

    sectionRetention: "Rétention & churn",
    retentionDesc:
      "Quand les voyageurs arrêtent de réserver. Segmentation sur la date de dernière réservation.",
    voyageursAyantReserve: "Voyageurs ayant réservé",
    actifs30j: "Actifs (≤ 30 j)",
    aRisque: "À risque (30–90 j)",
    perdus: "Perdus (> 90 j)",
    cohortes: "Cohortes d'activation",
    cohortesDesc:
      "Par mois d'inscription : part des comptes ayant réservé au moins une fois.",
    moisInscription: "Mois",
    inscrits: "Inscrits",
    actives: "Activés",
    tauxActivation: "Activation",

    sectionWakil: "Réseau Wakil",
    candidaturesParStatut: "Candidatures par statut",
    verificationsSurPlace: "Vérifications sur place",
    topWakils: "Top Wakils (vérifications)",

    sectionEvenements: "Activité récente",
    evenementsDesc: "Derniers événements de l'audit trail.",
    evenement: "Événement",
    utilisateur: "Utilisateur",
    quand: "Quand",
    systeme: "Système",
    echec: "échec",
    aucuneDonnee: "Aucune donnée pour le moment.",
  },
  // PR5 — Vérification e-mail
  email: {
    titre: "Vérification de votre e-mail",
    sousTitre:
      "Confirmez votre adresse e-mail pour sécuriser votre compte et recevoir les notifications importantes.",
    description: "Cliquez ci-dessous pour recevoir un code de vérification par e-mail.",
    envoyerCode: "Recevoir le code",
    codeEnvoye: "Un code de vérification vous a été envoyé par e-mail.",
    modeDemoCode: "Mode démo — code :",
    saisirCode: "Saisissez le code reçu",
    valider: "Valider",
    otpInvalide: "Code incorrect. Merci de réessayer.",
    verifieBravo: "Votre adresse e-mail est vérifiée.",
    dejaVerifie: "Votre adresse e-mail est déjà vérifiée.",
    badgeVerifie: "E-mail vérifié",
    mailSujet: "Darna — vérifiez votre adresse e-mail",
    mailCorpsHtml: (code: string) =>
      `<p>Votre code de vérification Darna : <strong>${code}</strong></p>` +
      `<p>Ce code expire dans 10 minutes.</p>`,
    bookingConfirmSujet: (titre: string) =>
      `Darna — réservation confirmée : ${titre}`,
    bookingConfirmHtml: (p: {
      guestName: string;
      propertyTitle: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      nights: number;
      total: string;
      url: string;
      demo: boolean;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Réservation confirmée ✅</h1>` +
      `<p>Bonjour ${p.guestName},</p>` +
      `<p>Votre réservation pour <strong>${p.propertyTitle}</strong> est confirmée. Votre paiement est protégé par Darna : il ne sera versé à l'hôte qu'une fois votre séjour terminé.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Arrivée</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Départ</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Nuits</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.nights}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Voyageurs</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.guests}</td></tr>` +
      `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">Total payé</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0f766e">${p.total}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Voir ma réservation</a></p>` +
      (p.demo
        ? `<p style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px;font-size:13px;color:#92400e">Mode démonstration : aucun paiement réel n'a été effectué.</p>`
        : "") +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    newBookingHostSujet: (titre: string) =>
      `Darna — nouvelle réservation reçue : ${titre}`,
    newBookingHostHtml: (p: {
      hostName: string;
      guestName: string;
      propertyTitle: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Nouvelle réservation 🎉</h1>` +
      `<p>Bonjour ${p.hostName},</p>` +
      `<p><strong>${p.guestName}</strong> vient de réserver <strong>${p.propertyTitle}</strong>. Le paiement est protégé sous séquestre Darna et vous sera versé une fois le séjour terminé.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Arrivée</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Départ</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Voyageurs</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.guests}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Voir la réservation</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    bookingCancelledByHostSujet: (titre: string) =>
      `Darna — votre séjour a été annulé : ${titre}`,
    bookingCancelledByHostHtml: (p: {
      guestName: string;
      propertyTitle: string;
      refund: string | null;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#b91c1c;font-size:20px">Votre séjour a été annulé</h1>` +
      `<p>Bonjour ${p.guestName},</p>` +
      `<p>Nous sommes désolés : l'hôte a annulé votre réservation pour <strong>${p.propertyTitle}</strong>. Cela ne dépend pas de vous, et le compte de cet hôte a été suspendu.</p>` +
      (p.refund
        ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
          `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">Montant remboursé</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0f766e">${p.refund}</td></tr>` +
          `</table>`
        : `<p>Aucun montant n'avait été réglé en ligne : vous n'avez rien à récupérer.</p>`) +
      `<p>Nous vous avons préparé des logements de remplacement disponibles sur vos dates, avec une réduction sur votre prochaine réservation :</p>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Voir les logements de remplacement</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    hostInvoiceReminderSujet: (titre: string) =>
      `Darna — rappel : facture de commission en attente (${titre})`,
    hostInvoiceReminderHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f4c7c;font-size:20px">Facture de commission en attente</h1>` +
      `<p>Bonjour ${p.hostName},</p>` +
      `<p>La commission Darna pour votre réservation « <strong>${p.propertyTitle}</strong> » (paiement sur place) est toujours en attente de règlement.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Montant dû</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0f4c7c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">À régler avant le</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f4c7c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Régler la facture</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    hostInvoiceDueSoonSujet: (titre: string) =>
      `Darna — facture de commission bientôt due (${titre})`,
    hostInvoiceDueSoonHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f4c7c;font-size:20px">Facture de commission bientôt due</h1>` +
      `<p>Bonjour ${p.hostName},</p>` +
      `<p>La commission Darna pour votre réservation « <strong>${p.propertyTitle}</strong> » (paiement sur place) arrive à échéance dans quelques jours.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Montant dû</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0f4c7c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">À régler avant le</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f4c7c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Régler la facture</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    hostInvoiceOverdueSujet: (titre: string) =>
      `Darna — facture de commission en retard (${titre})`,
    hostInvoiceOverdueHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#b91c1c;font-size:20px">Facture de commission en retard</h1>` +
      `<p>Bonjour ${p.hostName},</p>` +
      `<p>La commission Darna pour votre réservation « <strong>${p.propertyTitle}</strong> » (paiement sur place) a dépassé sa date d'échéance. Merci de la régler dès que possible.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Montant dû</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#b91c1c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Échéance dépassée le</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Régler la facture</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
    newMessageSujet: (titre: string) => `Darna — nouveau message · ${titre}`,
    newMessageHtml: (p: {
      recipientName: string;
      senderName: string;
      propertyTitle: string;
      preview: string;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Nouveau message 💬</h1>` +
      `<p>Bonjour ${p.recipientName},</p>` +
      `<p><strong>${p.senderName}</strong> vous a envoyé un message au sujet de <strong>${p.propertyTitle}</strong> :</p>` +
      `<blockquote style="margin:16px 0;padding:12px 16px;background:#f3f4f6;border-inline-start:3px solid #0f766e;border-radius:8px;color:#374151">${p.preview}</blockquote>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Répondre sur Darna</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Pour votre sécurité, répondez toujours via la messagerie Darna. Darna — Le logement vérifié.</p>` +
      `</div>`,
    savedSearchMatchSujet: (ville: string) =>
      `Darna — nouvelle annonce à ${ville} correspondant à votre alerte`,
    savedSearchMatchHtml: (p: {
      recipientName: string;
      propertyTitle: string;
      city: string;
      price: string;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Nouvelle annonce disponible 🔔</h1>` +
      `<p>Bonjour ${p.recipientName},</p>` +
      `<p>Une nouvelle annonce à <strong>${p.city}</strong> correspond à votre alerte enregistrée :</p>` +
      `<p style="padding:12px 16px;background:#f3f4f6;border-inline-start:3px solid #0f766e;border-radius:8px"><strong>${p.propertyTitle}</strong><br/>${p.price}</p>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Voir l'annonce</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Le logement vérifié.</p>` +
      `</div>`,
  },
  verifications: {
    navLabel: "Vérifications",
    bienvenue: "Bienvenue sur Darna 👋",
    titre: "Vérifions votre compte",
    sousTitre:
      "Deux étapes rapides pour rejoindre la communauté de confiance Darna.",
    pourquoiTitre: "Pourquoi vérifier ?",
    pourquoi1:
      "La confiance est notre produit : hôtes et voyageurs vérifiés, c'est plus de sérénité pour tout le monde.",
    pourquoi2:
      "Un e-mail confirmé sécurise votre compte et vos notifications de réservation.",
    pourquoi3:
      "Une identité vérifiée débloque la publication d'annonces et rassure ceux qui réservent chez vous.",
    etape: (n: number, total: number) => `Étape ${n} / ${total}`,
    etapeEmail: "Vérifiez votre e-mail",
    etapeTelephone: "Vérifiez votre téléphone",
    etapeCin: "Vérifiez votre identité (CIN)",
    etapeIdentite: "Vérifiez votre identité",
    suivant: "Étape suivante",
    precedent: "Précédent",
    passer: "Passer pour l'instant",
    terminerPlusTard:
      "Vous pourrez finir plus tard depuis l'onglet « Vérifications ».",
    tousVerifies: "Votre compte est entièrement vérifié 🎉",
    tousVerifiesSous: "Merci ! Vous profitez pleinement de la confiance Darna.",
    badgeFait: "Fait",
    badgeAFaire: "À faire",
  },
  profil: {
    titre: "Mes informations",
    sousTitre:
      "Gérez vos informations personnelles, votre photo de profil et votre mot de passe.",
    photoTitre: "Photo de profil",
    photoAide: "JPEG, PNG ou WebP — 5 Mo max. Une photo carrée rend mieux.",
    changerPhoto: "Changer la photo",
    ajouterPhoto: "Ajouter une photo",
    supprimerPhoto: "Supprimer",
    photoEnregistree: "Photo de profil mise à jour.",
    photoSupprimee: "Photo de profil supprimée.",
    photoErreur:
      "Fichier refusé : format accepté JPEG/PNG/WebP, taille maximale 5 Mo.",
    infosTitre: "Informations personnelles",
    nom: "Nom complet",
    email: "Adresse e-mail",
    emailAide: "Votre e-mail est votre identifiant de connexion et ne peut pas être modifié ici.",
    telephone: "Téléphone mobile",
    telephonePlaceholder: "+216 …",
    role: "Type de compte",
    roleVoyageur: "Voyageur",
    roleHote: "Hôte",
    roleAgence: "Agence",
    roleAdmin: "Administrateur",
    enregistrer: "Enregistrer les modifications",
    infosEnregistrees: "Vos informations ont été mises à jour.",
    mdpTitre: "Mot de passe",
    mdpSousTitre: "Choisissez un mot de passe d'au moins 8 caractères, dont un chiffre.",
    mdpActuel: "Mot de passe actuel",
    mdpNouveau: "Nouveau mot de passe",
    mdpConfirmation: "Confirmer le nouveau mot de passe",
    mdpChanger: "Changer le mot de passe",
    mdpEnregistre: "Mot de passe mis à jour.",
    mdpRegles: "Le mot de passe doit comporter au moins 8 caractères et un chiffre.",
    mdpActuelInvalide: "Mot de passe actuel incorrect.",
    mdpConfirmationInvalide: "Les deux mots de passe ne correspondent pas.",
    mdpIdentique: "Le nouveau mot de passe doit être différent de l'actuel.",
  },
  yieldAdvisor: {
    titre: "Yield Advisor",
    sousTitre:
      "Pour chaque bien, Darna compare le potentiel saisonnier au revenu de la location longue durée, à partir des prix réels de la plateforme.",
    saisonnier: "Saisonnier (estimation mensuelle)",
    saisonnierDetail: (nuit: number) =>
      `Nuitée moyenne de la ville : ${nuit} TND × 30 nuits × 60 % d'occupation estivale`,
    longueDuree: "Longue durée (loyer mensuel)",
    longueDureeDetail: (loyer: number) =>
      `Loyer moyen constaté dans le gouvernorat : ${loyer} TND / mois`,
    recoSaisonnier:
      "Recommandation : la location saisonnière semble nettement plus rentable pour ce bien. Pensez au calendrier de disponibilité.",
    recoLongueDuree:
      "Recommandation : la location longue durée offre un revenu plus stable et probablement supérieur pour ce bien.",
    recoEquivalent:
      "Recommandation : les deux options se valent. La longue durée offre la stabilité, le saisonnier la flexibilité.",
    donneesInsuffisantes:
      "Données de marché encore insuffisantes pour cette zone — estimation indicative.",
    aucunBien: "Ajoutez une annonce pour obtenir une analyse de rendement.",
  },
  booking: {
    titre: "Demande de réservation",
    recapitulatif: "Récapitulatif — 100 % transparent",
    nuits: (n: number) => (n === 1 ? "1 nuit" : `${n} nuits`),
    fraisService: "Frais de service Darna",
    fraisServiceAide:
      "Ils financent la vérification des annonces et la protection des paiements.",
    total: "Total à payer",
    reductionRelogement: "Réduction Darna",
    utiliserCredits: (solde: number) => `Utiliser mes ${solde} TND de crédit`,
    creditApplique: "Crédit utilisé",
    aucunFraisCache: "Aucun autre frais ne vous sera demandé. Jamais.",
    continuerPaiement: "Continuer vers le paiement",
    holdLabel: "Place gardée — paiement sous",
    holdExpireTitre: "Délai de paiement écoulé",
    holdExpireDetail:
      "Votre réservation n'a pas été confirmée à temps : les dates ont été libérées.",
    holdExpireCta: "Refaire une réservation",
    datesInvalides: "Dates invalides — la date de départ doit suivre l'arrivée.",
    datesIndisponibles:
      "Ces dates ne sont plus disponibles. Merci d'en choisir d'autres.",
    hoteFactureImpayee:
      "Ce logement est temporairement indisponible à la réservation (facture hôte en retard).",
    proprietaireImpossible: "Vous ne pouvez pas réserver votre propre logement.",
    proprietaireImpossibleAide:
      "C'est votre annonce. Pour la tester en tant que voyageur, connectez-vous avec un autre compte.",
    capaciteDepassee: (max: number) =>
      `Ce logement accueille au maximum ${max} voyageurs.`,
    connexionRequise: "Connectez-vous pour réserver.",
    verifRequise: "Vérifiez votre compte (e-mail + téléphone) avant de réserver.",
    compteSuspendu:
      "Votre compte est suspendu. Vous ne pouvez pas réserver pour le moment.",
    verifRequiseTitre: "Vérifiez votre compte pour réserver",
    verifRequiseDesc:
      "Pour la confiance de tous sur Darna, seuls les comptes vérifiés (e-mail + téléphone) peuvent réserver. Cela prend moins de deux minutes.",
    verifRequiseCta: "Vérifier mon compte",
    paiementTitre: "Paiement sécurisé — protégé par Darna",
    sequestreExplication:
      "Votre argent est protégé : Darna le conserve pendant tout votre séjour et ne le verse à l'hôte qu'après votre départ. Vous n'êtes jamais débité au profit de l'hôte avant d'avoir séjourné.",
    paiementMockInfo:
      "Paiement Konnect / Flouci bientôt disponible. Mode démonstration : aucun débit réel.",
    payerSimulation: "Payer (simulation)",
    paiementKonnectInfo:
      "Paiement sécurisé via Konnect — carte bancaire, e-DINAR, Flouci ou wallet. Vos fonds restent protégés par Darna jusqu'à la fin de votre séjour.",
    payerKonnect: "Payer avec Konnect",
    redirectionKonnect: "Redirection vers le paiement sécurisé…",
    paiementEchoue:
      "Le paiement n'a pas abouti. Aucun montant n'a été débité — vous pouvez réessayer.",
    paiementEnVerification:
      "Paiement reçu, confirmation en cours de vérification.",
    actualiser: "Actualiser",
    paiementKonnectErreur:
      "Le service de paiement est momentanément indisponible. Merci de réessayer dans un instant.",
    reservationExpiree:
      "Cette réservation a expiré. Merci de relancer une demande.",
    paiementConfirme: "Réservation confirmée !",
    paiementConfirmeDetail:
      "Votre paiement est protégé jusqu'à la fin de votre séjour. L'hôte a été notifié — retrouvez les détails dans « Mes réservations ».",
    voirMesReservations: "Voir mes réservations",
    sejourDates: (arrivee: string, depart: string) =>
      `Du ${arrivee} au ${depart}`,
    choisirDates: "Choisissez vos dates",
    selectionne: "Sélectionné",
    cliquezArrivee: "Cliquez sur votre date d'arrivée",
    cliquezDepart: "Choisissez votre date de départ",
    effacer: "Effacer",
    moisPrecedent: "Mois précédents",
    moisSuivant: "Mois suivants",
    placeholderPrix:
      "Choisissez vos dates sur le calendrier pour voir le prix total — sans aucun frais caché.",
    selectionnezDates: "Sélectionnez vos dates",
    annulationImpossible: "Cette réservation ne peut plus être annulée.",
    annulationConfirmee: "Votre réservation a été annulée.",
    annulationHoteConfirmee:
      "Réservation annulée. Le voyageur a été intégralement remboursé et votre annonce sera temporairement invisible.",
    // ── Gating acompte (anti-bypass) : choix du montant à régler ──────────
    totalSejour: "Total du séjour",
    payerMaintenant: "Vous payez maintenant",
    montantAPayer: "Combien souhaitez-vous régler maintenant ?",
    montantAPayerAide:
      "Réglez en ligne au minimum l'acompte (10 %) — la commission Darna y est incluse. Vous pouvez payer davantage, jusqu'à la totalité ; le reste se règle en espèces à l'hôte, à l'arrivée.",
    acompteMin: "Acompte minimum",
    raccourciAcompte: (pct: number) => `Acompte (${pct} %)`,
    raccourciMoitie: "La moitié",
    raccourciTotalite: "La totalité",
    pourcentDuTotal: (pct: number) => `${pct} % du total`,
    dontCommission: "dont commission Darna",
    soldeArrivee: "Solde à régler en cash à l'arrivée",
    soldeArriveeAide:
      "Vous payez le reste directement à l'hôte, en espèces, le jour de votre arrivée.",
    acompteSequestreInfo:
      "Votre acompte est bloqué en séquestre par Darna. Les coordonnées de l'hôte vous sont communiquées une fois passée la période d'annulation gratuite — votre réservation est alors ferme.",
    commissionNonRemboursable:
      "Annulation gratuite : vous êtes intégralement remboursé, commission Darna comprise. Passé le délai gratuit, la commission reste acquise et le reste suit la politique d'annulation de l'annonce.",
    annulationGratuiteJusqu: (date: string) =>
      `Annulation gratuite jusqu'au ${date}`,
    annulationRembJusqu: (pct: number, date: string) =>
      `${pct} % remboursé jusqu'au ${date}`,
    annulationNonRembApres: (date: string) =>
      `Aucun remboursement après le ${date}`,
    verifieWakil: "Vérifié par Wakil",
    verifieWakilAide:
      "Logement contrôlé sur place par un agent Wakil de confiance.",
    montantInvalide:
      "Montant invalide — réglez entre l'acompte minimum et le total du séjour.",
    // ── Coordonnées révélées APRÈS confirmation (acompte réglé) ───────────
    contactHoteTitre: "Coordonnées de votre hôte",
    contactHoteAide:
      "Réservation confirmée : contactez votre hôte directement pour organiser votre arrivée.",
    contactVoyageurTitre: "Coordonnées du voyageur",
    contactVoyageurAide:
      "Contactez votre voyageur pour préparer son arrivée et le solde en espèces.",
    contactNom: "Nom",
    contactEmail: "E-mail",
    contactTelephone: "Téléphone",
    contactVerrouilleTitre: "Coordonnées de l'hôte masquées",
    contactVerrouilleAide:
      "Pour la sécurité de tous, les coordonnées de l'hôte vous sont communiquées dès que votre acompte est réglé et la réservation confirmée.",
    // ── Contact verrouillé jusqu'à la fin de l'annulation gratuite ────────
    contactLockedTitreHote: "Coordonnées de l'hôte bientôt disponibles",
    contactLockedTitreVoyageur: "Coordonnées du voyageur bientôt disponibles",
    contactDebloqueLe: (date: string) => `Débloquées le ${date}`,
    contactLockedAide:
      "Pour la sécurité de tous, les coordonnées directes sont échangées une fois la période d'annulation gratuite passée — votre réservation est alors ferme.",
    // ── Rail 2 : paiement sur place (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3) ──
    cashNonDisponible: "Ce logement n'accepte pas le paiement sur place.",
    cashKycRequis:
      "Le paiement sur place exige une identité vérifiée (CIN). Complétez votre vérification avant de continuer.",
    modePaiementTitre: "Comment voulez-vous payer ?",
    modeEscrowLabel: "Payer en ligne",
    modeEscrowAide: "Acompte protégé par Darna, solde possible en cash à l'arrivée.",
    modeCashLabel: "Payer sur place (cash)",
    modeCashAide:
      "0 TND en ligne — tout se règle en espèces à l'hôte. Votre demande doit d'abord être acceptée par l'hôte.",
    cashRecapInfo: (montant: number) =>
      `0 TND en ligne. ${montant} TND dus en espèces à l'hôte à l'arrivée. Votre demande sera confirmée seulement après acceptation de l'hôte.`,
    continuerDemandeCash: "Envoyer la demande",
    demandeIndisponible: "Cette demande n'est plus disponible.",
    demandeExpiree: "Cette demande a expiré — l'hôte n'a pas répondu à temps.",
    demandeAcceptee: "Réservation confirmée !",
    demandeRefusee: "Demande refusée.",
    cashEnAttenteTitre: "Demande envoyée — en attente de l'hôte",
    cashEnAttenteDetail:
      "L'hôte doit accepter votre demande avant que la réservation soit confirmée. Vous serez notifié de sa décision.",
    cashEnAttenteExpire: (date: string) => `Sans réponse avant le ${date}, la demande expirera automatiquement.`,
    noShowIndisponible: "Cette action n'est pas disponible pour cette réservation.",
    noShowSignale: "Absence signalée.",
    cashConfirmeeDetail:
      "L'hôte a accepté votre demande. Réglez le montant total en espèces à votre arrivée — l'hôte a été notifié.",
  },
  messages: {
    titre: "Messagerie",
    lien: "Messagerie",
    hubTitre: "Messagerie",
    hubSousTitre: "Toutes vos conversations avec hôtes et voyageurs.",
    hubVide: "Aucune conversation pour le moment. Vos échanges avec vos hôtes et voyageurs apparaîtront ici.",
    notifTitre: "Nouveau message",
    notifCorps: (n: number) =>
      n > 1 ? `Vous avez ${n} messages non lus.` : "Vous avez reçu un nouveau message.",
    notifVoir: "Voir la messagerie",
    banniere:
      "Pour votre sécurité, les numéros et e-mails sont masqués. Vous échangerez vos coordonnées directes une fois la réservation ferme.",
    placeholder: "Écrivez votre message…",
    vide: "Aucun message pour le moment. Démarrez la conversation.",
    vous: "Vous",
    hote: "Hôte",
    voyageur: "Voyageur",
    masque: "coordonnées masquées",
    indisponible:
      "La messagerie s'ouvre une fois la réservation confirmée.",
    depuisVerrouille: "Échangez via la messagerie Darna",
    banniereLibre:
      "Votre réservation est ferme : vous pouvez échanger librement vos coordonnées.",
    avertissementMasque:
      "Vos coordonnées ont été masquées. Partager un numéro ou un e-mail hors Darna est interdit tant que la réservation n'est pas ferme — vous serez mis en relation automatiquement. ⚠️ Les tentatives répétées peuvent entraîner la suspension de votre compte.",
    avertissementSollicitation:
      "⚠️ Demander à échanger vos coordonnées hors Darna n'est pas autorisé tant que la réservation n'est pas ferme. Les tentatives répétées peuvent entraîner la suspension de votre compte.",
    avertissementEscalade:
      "⚠️ Dernier avertissement : plusieurs tentatives de partage de coordonnées hors Darna ont été détectées sur votre compte. Toute nouvelle tentative expose votre compte à une suspension.",
    compteSuspendu:
      "Votre compte est suspendu suite à des tentatives répétées de partage de coordonnées hors Darna. Contactez le support pour le réactiver.",
    compteSuspenduJusqu: (date: string) =>
      `Votre compte est suspendu jusqu'au ${date} suite à des tentatives de partage de coordonnées hors Darna. Restez sur Darna pour protéger vos réservations et vos avis.`,
    pourquoiTitre: "En savoir plus — pourquoi rester sur Darna ?",
    pourquoi1:
      "Paiement protégé : votre acompte est sous séquestre Darna. Hors plateforme, aucune garantie — c'est la porte ouverte aux arnaques.",
    pourquoi2:
      "Avis vérifiés : seuls les séjours réservés sur Darna donnent droit à un avis. C'est ce qui bâtit la réputation de l'hôte et la confiance du voyageur. En dehors : ni preuve, ni réputation.",
    pourquoi3:
      "Litiges : en cas de souci, Darna tranche et vous protège. Hors plateforme, vous êtes seul face au problème.",
    pourquoi4:
      "Pour l'hôte : visibilité, badge « Vérifié », réservations futures — tout passe par Darna. Contourner, c'est se couper de ses prochains clients.",
    pourquoiConclusion:
      "Darna, la première plateforme tunisienne de réservation de confiance. Ensemble, construisons un écosystème où chacun est protégé.",
  },
  notifications: {
    titre: "Notifications",
    aucune: "Aucune notification pour le moment.",
    toutMarquerLu: "Tout marquer comme lu",
    reservationConfirmee: (titre: string) =>
      `Votre réservation pour « ${titre} » est confirmée.`,
    reservationAnnulee: (titre: string) =>
      `Une réservation sur « ${titre} » a été annulée par le voyageur.`,
    avisRecu: (titre: string) => `Vous avez reçu un nouvel avis sur « ${titre} ».`,
    avisHoteRecu: "Votre hôte a laissé un avis sur votre séjour.",
    annonceExpireBientot: (titre: string) =>
      `« ${titre} » expire bientôt — pensez à la republier.`,
    alerteNouvelleAnnonce: (titre: string) =>
      `Une nouvelle annonce correspond à votre alerte : « ${titre} ».`,
    demandeCashRecue: (titre: string) =>
      `Nouvelle demande de réservation payée sur place sur « ${titre} » — à traiter.`,
    reservationRefusee: (titre: string) =>
      `Votre demande de réservation pour « ${titre} » a été déclinée par l'hôte.`,
    reservationAnnuleeParHote: (titre: string) =>
      `Votre séjour « ${titre} » a été annulé par l'hôte — vous avez été intégralement remboursé. Nous en sommes désolés : le compte de cet hôte a été suspendu.`,
    annonceMasqueeAnnulation: (titre: string) =>
      `Suite à votre annulation, « ${titre} » est temporairement masquée des recherches. Elle réapparaîtra automatiquement à la fin de la période de blocage.`,
    hostInvoiceRelance: (titre: string) =>
      `Rappel : la facture de commission pour « ${titre} » est toujours en attente de règlement.`,
    factureBientotDue: (titre: string) =>
      `Votre facture de commission pour « ${titre} » arrive bientôt à échéance.`,
    factureEnRetard: (titre: string) =>
      `Votre facture de commission pour « ${titre} » a dépassé son échéance.`,
    annonceLimiteAbonnement: (titre: string) =>
      `Votre annonce « ${titre} » ne peut pas encore être publiée — vous avez atteint votre limite d'annonces actives. Voir les options d'abonnement.`,
    annonceCreditsVerifEpuises: (titre: string) =>
      `Votre annonce « ${titre} » n'a pas pu être vérifiée — vous n'avez plus de crédit de vérification. Achetez un lot pour continuer.`,
    annonceVerifPaiementRequis: (titre: string) =>
      `Votre annonce « ${titre} » n'a pas pu être vérifiée — payez la vérification Wakil (20 TND) pour qu'un agent puisse la traiter.`,
    reservationRecue: (titre: string) =>
      `Vous avez reçu une nouvelle réservation pour « ${titre} ».`,
    annonceIncomplete: (titre: string) =>
      `Votre annonce « ${titre} » a encore des cases à cocher — complétez-la pour mieux convertir.`,
    annoncePromoSuggeree: (titre: string) =>
      `« ${titre} » a des nuits vides dans les prochaines semaines — comparez votre prix à la moyenne de la ville : une promo ponctuelle peut suffire à vendre une nuit de plus.`,
  },
  alaUne: {
    titre: "Mettez votre annonce à la une",
    sousTitre:
      "Boostez votre visibilité pendant un mois : votre annonce passe en tête des résultats et s'affiche sur l'accueil de Darna.",
    avantage1Titre: "En tête des résultats",
    avantage1Desc:
      "Votre annonce s'affiche avant toutes les autres dans les recherches séjours et immobilier.",
    avantage2Titre: "Badge doré « À la une »",
    avantage2Desc:
      "Un badge premium et un contour doré qui captent immédiatement le regard des voyageurs.",
    avantage3Titre: "Vitrine de l'accueil",
    avantage3Desc:
      "Apparaissez dans le carrousel « À la une » de la page d'accueil, vue par tous les visiteurs.",
    recapTitre: "Récapitulatif — 100 % transparent",
    annonce: "Annonce",
    duree: "Durée de la mise en avant",
    dureeValeur: (j: number) => (j === 1 ? "1 jour" : `${j} jours`),
    prix: "Mise à la une (1 mois)",
    total: "Total à payer",
    mockInfo:
      "Paiement Konnect / Flouci bientôt disponible. Mode démonstration : aucun débit réel.",
    payer: "Payer et passer à la une (simulation)",
    payerKonnect: "Payer et passer à la une",
    redirectionKonnect: "Redirection vers le paiement…",
    paiementEnVerification: "Paiement en cours de vérification…",
    actualiser: "Actualiser",
    paiementEchoue: "Le paiement a échoué. Merci de réessayer.",
    paiementErreur: "Erreur lors de l'initialisation du paiement.",
    prolongerInfo: (date: string) =>
      `Cette annonce est déjà à la une jusqu'au ${date}. Un nouvel achat prolonge le boost d'un mois.`,
    retour: "Retour à mes annonces",
    indisponible:
      "Cette annonce ne peut pas être mise à la une : elle doit être active et en ligne.",
    garantie:
      "Vous gardez le contrôle : à la fin du mois, votre annonce revient simplement à son affichage normal. Aucun renouvellement automatique.",
    boostOffertTitre: "Boost offert avec votre abonnement Pro",
    boostOffertDesc:
      "Votre palier inclut 1 boost « à la une » offert par mois, non cumulable. Utilisez-le sur cette annonce sans rien payer.",
    boostOffertBouton: "Utiliser mon boost offert",
    boostOffertDejaUtilise:
      "Boost offert déjà utilisé pour ce cycle d'abonnement — de nouveau disponible à votre prochain renouvellement.",
    superHoteBoostTitre: "Boost offert — badge Super-Hôte",
    superHoteBoostDesc:
      "Zéro annulation et avis excellents sur les 3 derniers mois : vous avez gagné un boost « à la une » gratuit. Utilisez-le sur cette annonce sans rien payer.",
    superHoteBoostBouton: "Réclamer mon boost Super-Hôte",
    superHoteBoostDejaUtilise:
      "Boost Super-Hôte déjà réclamé récemment — de nouveau disponible dans quelques mois si votre badge reste actif.",
  },
  promo: {
    titre: "Créez une promo sur votre annonce",
    sousTitre:
      "Baissez temporairement votre prix pour attirer plus de réservations — vous gardez le contrôle total : prix, durée, retrait à tout moment.",
    annonce: "Annonce",
    prixActuel: (prix: string) => `Prix actuel : ${prix}`,
    formPrixLabel: "Prix promo (TND / nuit)",
    formPrixAide: "Doit être inférieur au prix actuel — c'est ce que les voyageurs paieront.",
    formDateLabel: "Promo valable jusqu'au",
    activer: "Activer la promo",
    retirer: "Retirer la promo",
    retirerConfirmer: "Retirer cette promo ?",
    retirerOui: "Retirer",
    retirerAnnuler: "Annuler",
    actifTitre: "Promo active",
    actifDesc: (prixPromo: string, date: string) =>
      `${prixPromo} / nuit au lieu du prix normal, jusqu'au ${date}.`,
    indisponible:
      "Cette promo n'est disponible que pour une annonce vérifiée et active.",
    retour: "Retour à mes annonces",
    garantie:
      "Aucun engagement : vous pouvez retirer la promo à tout moment. Votre revenu par nuit reste garanti — seule la commission Darna varie.",
  },
  abonnement: {
    titre: "Abonnement agence",
    sousTitre:
      "Levez la limite d'annonces actives et donnez à vos biens la visibilité qu'ils méritent.",
    planLabel: (label: string) => `Palier ${label}`,
    annoncesIncluses: (n: number) => `${n} annonces actives incluses`,
    prixMensuel: "Prix mensuel",
    statutActif: (date: string) => `Actif jusqu'au ${date}`,
    statutInactif: "Aucun abonnement actif",
    quotaActuel: (utilisees: number, limite: number) =>
      utilisees === 1
        ? `1 annonce active sur une limite de ${limite}`
        : `${utilisees} annonces actives sur une limite de ${limite}`,
    quotaGratuitInfo: (limite: number) =>
      `Palier gratuit : jusqu'à ${limite} annonces actives. Souscrivez pour lever cette limite.`,
    quotaAtteintAlerte:
      "Vous avez atteint votre limite d'annonces actives — une nouvelle annonce ne pourra pas être validée tant qu'une place ne se libère pas ou que vous n'aurez pas souscrit/renouvelé.",
    annoncesEnAttenteBloquees: (n: number) =>
      n === 1
        ? "1 annonce est en attente de validation et sera publiée dès que vous aurez de la place ou aurez souscrit."
        : `${n} annonces sont en attente de validation et seront publiées dès que vous aurez de la place ou aurez souscrit.`,
    coutParAnnonce: (prixTND: number) =>
      `Soit environ ${prixTND} TND par annonce active incluse.`,
    palierActuelBadge: "Palier actuel",
    modalTitre: "Cette annonce attendra son tour",
    modalTexte: (utilisees: number, limite: number) =>
      `Votre annonce a bien été créée et sera examinée normalement. Mais vous avez déjà ${utilisees} annonce(s) active(s) sur ${limite} incluse(s) : elle ne pourra pas être publiée tant qu'une place ne se libère pas ou que vous n'aurez pas souscrit à l'abonnement Agence.`,
    modalRecommandation: (label: string, listingsIncluded: number, prixTND: number) =>
      `Le palier ${label} (${listingsIncluded} annonces incluses, ${prixTND} TND/mois) vous permettrait de la publier dès maintenant.`,
    modalCta: "Voir les options d'abonnement",
    modalPlusTard: "Plus tard",
    souscrire: "Souscrire",
    renouveler: "Renouveler un mois",
    payer: "Souscrire (simulation)",
    payerKonnect: "Souscrire",
    redirectionKonnect: "Redirection vers le paiement…",
    mockInfo:
      "Paiement Konnect bientôt disponible. Mode démonstration : aucun débit réel.",
    paiementEnVerification: "Paiement en cours de vérification…",
    actualiser: "Actualiser",
    paiementEchoue: "Le paiement a échoué. Merci de réessayer.",
    paiementErreur: "Erreur lors de l'initialisation du paiement.",
    prolongerInfo: (date: string) =>
      `Votre abonnement est déjà actif jusqu'au ${date}. Un nouveau paiement prolonge la période d'un mois.`,
    garantie:
      "Aucun renouvellement automatique : Konnect ne prélève jamais seul, vous choisissez quand renouveler.",
    reserveAgence: "Cette page est réservée aux comptes agence.",
    creditsVerifTitre: "Crédits de vérification Wakil",
    creditsVerifSousTitre: (n: number) =>
      n === 1
        ? "Chaque vérification par un Wakil consomme un crédit. La première est gratuite, à vie."
        : `Chaque vérification par un Wakil consomme un crédit. Les ${n} premières sont gratuites, à vie.`,
    creditsVerifSolde: (n: number) =>
      n === 1 ? "1 crédit de vérification restant" : `${n} crédits de vérification restants`,
    creditsVerifEpuiseAlerte:
      "Vous n'avez plus de crédit de vérification — vos annonces en attente ne pourront pas être vérifiées tant que vous n'aurez pas acheté un lot.",
    creditsVerifPackLabel: (n: number) => `${n} vérifications`,
    creditsVerifAcheter: "Acheter",
    creditsVerifAcheterSimulation: "Acheter (simulation)",
  },
  contact: {
    titre: "Contacter l'annonceur",
    nom: "Votre nom",
    email: "Votre e-mail",
    telephone: "Votre téléphone",
    message: "Votre message",
    messageDefaut: (titre: string) =>
      `Bonjour, je suis intéressé(e) par « ${titre} ». Pouvons-nous convenir d'une visite ?`,
    envoye: "Votre demande a été transmise à l'annonceur.",
    envoyer: "Envoyer la demande",
    ouWhatsapp: "ou directement sur",
  },
  financement: {
    titre: "Demander une simulation de financement",
    sousTitre:
      "Laissez vos coordonnées : un partenaire bancaire pourra vous recontacter pour étudier votre dossier.",
    montantSouhaite: "Montant souhaité (TND)",
    disclaimer:
      "Darna ne calcule aucune mensualité ni taux — cette demande transmet vos coordonnées pour une étude personnalisée.",
    envoyer: "Envoyer la demande",
    envoye: "Votre demande de financement a été enregistrée.",
  },
  bail: {
    titre: "Contrat de bail à usage d'habitation",
    sousTitre: "Document pré-rempli par Darna — à compléter et signer par les parties.",
    entre: "Entre les soussignés :",
    bailleur: "Le bailleur",
    locataire: "Le locataire",
    bienDesigne: "Désignation du bien",
    adresse: "Adresse",
    surface: "Surface",
    pieces: "Pièces",
    article1: "Article 1 — Objet",
    article1Texte:
      "Le bailleur donne en location au locataire, qui accepte, le bien désigné ci-dessus à usage exclusif d'habitation.",
    article2: "Article 2 — Durée",
    article2Texte:
      "Le présent bail est conclu pour une durée d'un an, renouvelable par tacite reconduction, à compter de la date de signature.",
    article3: "Article 3 — Loyer",
    article3Texte: (loyer: string) =>
      `Le loyer mensuel est fixé à ${loyer}, payable d'avance le premier de chaque mois.`,
    article4: "Article 4 — Dépôt de garantie",
    article4Texte: (caution: string) =>
      `Le locataire verse à la signature un dépôt de garantie de ${caution}, restitué en fin de bail sous déduction des sommes dues.`,
    article5: "Article 5 — Obligations",
    article5Texte:
      "Le locataire s'engage à user paisiblement du bien, à l'entretenir et à souscrire une assurance habitation. Le bailleur garantit la jouissance paisible du bien.",
    faitA: "Fait à",
    le: "le",
    signatureBailleur: "Signature du bailleur",
    signatureLocataire: "Signature du locataire",
    mentionLegale:
      "Modèle indicatif fourni par Darna — ne constitue pas un conseil juridique. Vérifiez la conformité avec la législation tunisienne en vigueur.",
    loyerMensuel: "Loyer mensuel",
  },
  prixMarche: {
    titre: "Indice Darna des prix de l'immobilier",
    sousTitre:
      "Agrégats calculés en direct sur les annonces actives de la plateforme. Données indicatives, mises à jour en continu.",
    venteTitre: "Vente — prix moyen au m² par gouvernorat",
    locationTitre: "Location — loyer moyen au m² par gouvernorat",
    sejourTitre: "Séjours — nuitée moyenne par ville",
    gouvernorat: "Gouvernorat",
    ville: "Ville",
    prixM2: "Prix / m²",
    loyerM2: "Loyer / m²",
    nuitee: "Nuitée moyenne",
    annonces: (n: number) => (n === 1 ? "1 annonce" : `${n} annonces`),
    aucuneDonnee: "Pas encore assez de données pour cette catégorie.",
    methodologie: "Méthodologie",
    methodologieTexte:
      "Moyennes simples calculées sur les annonces actives et non expirées de Darna. Les annonces sans surface renseignée sont exclues des calculs au m². L'indice s'enrichit à mesure que la plateforme grandit.",
  },
  simulateur: {
    titre: "Combien pourriez-vous gagner sur Darna ?",
    sousTitre:
      "Une estimation basée sur les prix réels déjà observés sur la plateforme — pas un chiffre inventé. Trois champs, une fourchette indicative.",
    ville: "Ville",
    villePlaceholder: "Ex. Hammamet, Sousse, Djerba…",
    type: "Type de bien",
    voyageurs: "Nombre de voyageurs",
    voyageursAide:
      "Sert uniquement à préremplir votre future annonce — n'influence pas l'estimation.",
    surface: "Surface (m²)",
    surfaceRequisePourEstimation:
      "Indiquez la surface pour estimer le loyer ou le prix de vente.",
    cta: "Estimer mes revenus",
    resultatNuiteeTitre: "Revenu locatif estimé (séjours courte durée)",
    resultatNuiteeDetail: (ville: string, nuit: number) =>
      `Basé sur la nuitée moyenne à ${ville} (${nuit} TND) × 30 nuits × un taux d'occupation de 35 % à 60 %.`,
    resultatLocationTitre: "Loyer mensuel estimé",
    resultatLocationDetail: (gouvernorat: string, prixM2: number) =>
      `Basé sur le loyer moyen au m² dans le gouvernorat de ${gouvernorat} (${prixM2} TND/m²).`,
    resultatVenteTitre: "Prix de vente estimé",
    resultatVenteDetail: (gouvernorat: string, prixM2: number) =>
      `Basé sur le prix moyen au m² dans le gouvernorat de ${gouvernorat} (${prixM2} TND/m²).`,
    parMois: "/ mois",
    echantillon: (n: number) => (n === 1 ? "basé sur 1 annonce" : `basé sur ${n} annonces`),
    aucuneDonnee: "Pas encore assez de données réelles pour cette zone.",
    villesProches: "Essayez une ville proche :",
    ctaPublier: "Publier mon annonce",
    ctaPublierAide: "Ville et type déjà pré-remplis à l'étape suivante.",
    methodologie: "D'où vient ce chiffre ?",
    methodologieTexte:
      "Moyennes calculées sur les annonces actives et non expirées de Darna — les mêmes agrégats que l'Indice Darna des prix. Aucune hypothèse gonflée : quand les données sont encore trop rares pour une zone, nous vous le disons plutôt que d'inventer un chiffre.",
    voirIndice: "Voir tout l'indice des prix",
  },
  diaspora: {
    titre: "Darna — Tunisiens à l'étranger",
    sousTitre:
      "Pour les Tunisiens de l'étranger : cherchez, comparez et sécurisez votre pied-à-terre au pays, sans mauvaise surprise.",
    arg1Titre: "Réservez depuis l'étranger",
    arg1Desc:
      "Annonces vérifiées sur le terrain par nos Wakils : ce que vous voyez depuis Paris ou Montréal existe vraiment à Hammamet.",
    arg2Titre: "Payez en toute sécurité",
    arg2Desc:
      "Paiement protégé Darna : votre argent n'est versé à l'hôte qu'après votre séjour. Paiement par carte internationale bientôt disponible.",
    arg3Titre: "Visites vidéo (bientôt)",
    arg3Desc:
      "Un Wakil visite le bien en visio avec vous, avant tout engagement.",
    toggleTitre: "Affichez les prix dans votre devise",
    toggleDesc: (taux: string) =>
      `Basculez tout le site en euros d'un clic — taux indicatif : 1 € = ${taux} TND.`,
    afficherEnEuros: "Afficher les prix en €",
    afficherEnTnd: "Afficher les prix en TND",
    ctaTitre: "Votre prochain été commence ici",
    ctaDesc: "Parcourez les séjours vérifiés dans les plus belles villes du pays.",
  },
  wakil: {
    titre: "Devenez Wakil Darna",
    sousTitre:
      "Le Wakil (وكيل) est notre agent de confiance sur le terrain : il visite les biens, vérifie qu'ils existent et que les photos sont fidèles. C'est lui qui rend Darna fiable.",
    missionTitre: "Votre mission",
    mission1: "Visiter les biens près de chez vous, sur rendez-vous.",
    mission2: "Vérifier la conformité photos / réalité et géolocaliser le bien.",
    mission3: "Attribuer le badge « Vérifié Darna » qui protège toute la communauté.",
    avantagesTitre: "Vos avantages",
    avantage1: "Rémunération par visite vérifiée",
    avantage2: "Horaires libres, dans votre ville",
    avantage3: "Formation et application dédiée (bientôt)",
    formTitre: "Candidature",
    nom: "Nom complet",
    email: "E-mail",
    telephone: "Téléphone",
    ville: "Votre ville d'intervention",
    motivation: "Votre motivation (quelques lignes)",
    postuler: "Envoyer ma candidature",
    candidatureEnvoyee:
      "Merci ! Votre candidature est bien reçue — notre équipe vous recontacte rapidement.",
  },
  pagesLegales: {
    cguTitre: "Conditions générales d'utilisation",
    cguHoteTitre: "CGU hôte — paiement sur place",
    mentionsTitre: "Mentions légales",
    confidentialiteTitre: "Politique de confidentialité",
    aRediger:
      "Document en cours de rédaction — il sera publié avant le lancement officiel de la plateforme.",
    miseAJour: "Dernière mise à jour : juillet 2026",
    avertissement:
      "Ce document est fourni à titre informatif pour la phase de démonstration de Darna. Il devra être revu et validé par un conseil juridique avant le lancement public de la plateforme.",
    avertissementJuridique:
      "Ce texte est fourni à titre indicatif pour la phase de démonstration. Le régime de facturation (structure juridique, TVA) sera confirmé et ce document validé par un avocat/expert-comptable tunisien avant toute activation réelle de la facturation hôte.",
    cguHote: {
      intro:
        "Les présentes conditions s'appliquent aux hôtes qui activent le paiement sur place (cash) sur une annonce séjour. Elles complètent les CGU générales de Darna.",
      sections: [
        {
          titre: "1. Principe",
          corps: [
            "Le voyageur ne paie rien en ligne à la réservation. Le séjour est réglé intégralement en espèces, directement à vous, à l'arrivée du voyageur.",
          ],
        },
        {
          titre: "2. Commission Darna",
          corps: [
            "Une commission, au même taux que le mode de paiement en ligne standard, reste due à Darna pour chaque réservation acceptée sur ce mode.",
            "Cette commission ne transite jamais par la plateforme : elle vous est facturée séparément après l'acceptation de la réservation.",
          ],
        },
        {
          titre: "3. Facturation et paiement",
          corps: [
            "Une facture est générée à l'acceptation de la réservation, avec un délai de paiement indiqué sur celle-ci. Vous la réglez en ligne, en un clic, depuis votre tableau de bord.",
          ],
        },
        {
          titre: "4. Non-paiement",
          corps: [
            "Si une facture n'est pas réglée dans le délai indiqué, vos annonces sont masquées des résultats de recherche jusqu'à régularisation. Elles redeviennent visibles immédiatement après paiement.",
          ],
        },
        {
          titre: "5. Acceptation des réservations",
          corps: [
            "Vous restez libre d'accepter ou de refuser chaque demande de réservation sur ce mode — aucune confirmation automatique n'a lieu sans votre accord explicite.",
          ],
        },
      ],
    },
    cgu: {
      intro:
        "Les présentes conditions générales d'utilisation (« CGU ») régissent l'accès et l'usage de la plateforme Darna, qui met en relation des voyageurs et des annonceurs pour la location de séjours et de biens immobiliers en Tunisie. En créant un compte ou en utilisant le service, vous acceptez ces CGU.",
      sections: [
        {
          titre: "1. Objet",
          corps: [
            "Darna est une place de marché de mise en relation. Darna n'est ni propriétaire, ni loueur, ni agent des biens publiés : la plateforme fournit des outils de recherche, de réservation et de vérification de confiance.",
          ],
        },
        {
          titre: "2. Compte et inscription",
          corps: [
            "La création d'un compte requiert une adresse e-mail valide et un mot de passe. Vous vous engagez à fournir des informations exactes et à les tenir à jour.",
            "Certaines actions exigent la vérification de votre e-mail et de votre téléphone, voire de votre identité (CIN). Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte.",
          ],
        },
        {
          titre: "3. Annonces et vérification",
          corps: [
            "Les annonces sont publiées sous la seule responsabilité de l'annonceur (hôte ou agence). Toute annonce est soumise à une vérification (réseau Wakil) avant sa mise en ligne et l'attribution du badge « Vérifié Darna ».",
            "Darna se réserve le droit de refuser, suspendre ou retirer toute annonce non conforme, frauduleuse ou trompeuse.",
          ],
        },
        {
          titre: "4. Réservations et paiements",
          corps: [
            "Une demande de réservation bloque le créneau pendant 15 minutes. Les prix et frais (dont les frais de service) sont systématiquement recalculés côté serveur ; aucune valeur transmise par le navigateur n'est utilisée comme montant facturé.",
            "Pendant la phase de démonstration, le séquestre des fonds est simulé par défaut : aucun mouvement d'argent réel n'a lieu. Lorsque le paiement réel (Konnect) est activé, le montant débité est toujours exprimé en dinars tunisiens (TND), l'affichage en euros n'étant qu'une conversion indicative.",
          ],
        },
        {
          titre: "5. Obligations des utilisateurs",
          corps: [
            "Vous vous engagez à utiliser Darna de manière loyale, à ne pas contourner les mécanismes de sécurité ou de vérification, à ne pas publier de contenu illicite et à respecter la législation tunisienne en vigueur.",
          ],
        },
        {
          titre: "6. Responsabilité",
          corps: [
            "Darna agit en qualité d'intermédiaire. La plateforme est fournie « en l'état » pendant la phase de démonstration et ne saurait être tenue responsable des litiges entre voyageurs et annonceurs, dans les limites permises par la loi.",
          ],
        },
        {
          titre: "7. Suspension et résiliation",
          corps: [
            "Darna peut suspendre ou clôturer un compte en cas de manquement aux présentes CGU, de fraude ou d'usage abusif. Vous pouvez fermer votre compte à tout moment.",
          ],
        },
        {
          titre: "8. Droit applicable",
          corps: [
            "Les présentes CGU sont régies par le droit tunisien. Tout litige relève de la compétence des tribunaux de Tunis, sous réserve des règles impératives protégeant les consommateurs résidant dans l'Union européenne.",
          ],
        },
      ],
    },
    mentions: {
      intro:
        "Conformément aux obligations de transparence, les informations relatives à l'éditeur et à l'hébergement de la plateforme Darna sont précisées ci-dessous.",
      sections: [
        {
          titre: "Éditeur",
          corps: [
            "Darna est un projet édité par Wassim Ben Messaoud. Pour toute question, vous pouvez écrire à : contact@darna.tn.",
            "Les coordonnées légales complètes (forme juridique, immatriculation, siège) seront publiées avant le lancement commercial de la plateforme.",
          ],
        },
        {
          titre: "Hébergement",
          corps: [
            "La plateforme est hébergée chez un prestataire d'infrastructure cloud. Les coordonnées de l'hébergeur seront précisées avant la mise en production.",
          ],
        },
        {
          titre: "Propriété intellectuelle",
          corps: [
            "La marque Darna, son logo, ses textes et son interface sont protégés. Toute reproduction sans autorisation est interdite. Les contenus des annonces restent la propriété de leurs auteurs.",
          ],
        },
        {
          titre: "Contact",
          corps: [
            "Pour toute demande relative aux mentions légales : contact@darna.tn.",
          ],
        },
      ],
    },
    confidentialite: {
      intro:
        "Darna accorde une importance particulière à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, pourquoi, et quels sont vos droits — y compris pour les utilisateurs résidant dans l'Union européenne (RGPD).",
      sections: [
        {
          titre: "1. Responsable du traitement",
          corps: [
            "Le responsable du traitement des données est l'éditeur de Darna. Pour toute question relative à vos données, écrivez à : privacy@darna.tn.",
          ],
        },
        {
          titre: "2. Données collectées",
          corps: [
            "Données de compte : nom, adresse e-mail, numéro de téléphone, rôle (voyageur, hôte, agence).",
            "Données de vérification (KYC) : votre numéro de carte d'identité (CIN), conservé chiffré et jamais affiché en clair.",
            "Données d'usage et techniques : réservations, favoris, messages de contact, journaux de sécurité (adresse IP, horodatage) à des fins d'audit.",
          ],
        },
        {
          titre: "3. Finalités",
          corps: [
            "Vos données servent à fournir le service (compte, recherche, réservation), à assurer la confiance et la sécurité (vérification, prévention de la fraude, audit) et à vous contacter au sujet de vos réservations.",
          ],
        },
        {
          titre: "4. Base légale",
          corps: [
            "Le traitement repose sur l'exécution du contrat (fourniture du service), notre intérêt légitime (sécurité et prévention de la fraude), le respect d'obligations légales, et votre consentement lorsqu'il est requis (par exemple pour les cookies non essentiels).",
          ],
        },
        {
          titre: "5. Cookies",
          corps: [
            "Darna n'utilise que des cookies strictement nécessaires : session de connexion, préférence de langue, préférence de devise, et mémorisation de votre choix de consentement. Aucun cookie publicitaire ni traceur tiers n'est utilisé pendant la phase de démonstration.",
            "Vous pouvez à tout moment effacer les cookies depuis votre navigateur ; les cookies nécessaires sont indispensables au bon fonctionnement du service.",
          ],
        },
        {
          titre: "6. Conservation",
          corps: [
            "Les données de compte sont conservées tant que votre compte est actif. Les journaux d'audit sont conservés pour une durée limitée à des fins de sécurité. Vos données sont supprimées ou anonymisées lorsqu'elles ne sont plus nécessaires.",
          ],
        },
        {
          titre: "7. Sécurité",
          corps: [
            "Vos mots de passe sont stockés sous forme de condensé sécurisé (bcrypt) ; votre CIN est chiffrée au repos (AES-256-GCM). L'accès aux données sensibles est restreint et tracé.",
          ],
        },
        {
          titre: "8. Vos droits",
          corps: [
            "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition au traitement de vos données, ainsi que d'un droit à la portabilité. Pour exercer ces droits, contactez : privacy@darna.tn.",
            "Vous pouvez également introduire une réclamation auprès de l'autorité de protection des données compétente.",
          ],
        },
      ],
    },
  },
  cookieConsent: {
    titre: "Vos cookies, votre choix",
    message:
      "Darna n'utilise que des cookies strictement nécessaires à son fonctionnement (connexion, langue, devise). Aucun traceur publicitaire.",
    enSavoirPlus: "En savoir plus",
    accepter: "J'ai compris",
    refuser: "Continuer sans accepter",
  },
  notFound: {
    titre: "Page introuvable",
    desc: "Cette page n'existe pas ou l'annonce a été retirée. Comme quoi, même chez Darna, tout ne dure pas toujours.",
    cta: "Retour à l'accueil",
  },
  host: {
    voirProfil: "Voir le profil",
    titre: (nom: string) => `Profil de ${nom}`,
    membreDepuis: (annee: number) => `Membre depuis ${annee}`,
    annoncesActives: (n: number) =>
      n === 1 ? "1 annonce active" : `${n} annonces actives`,
    aucuneAnnonceActive: "Aucune annonce active pour le moment.",
    retourAccueil: "Retour à l'accueil",
  },
  relogement: {
    titre: "Trouvez un autre logement",
    headline: "L'hôte a annulé — nous nous excusons",
    resume:
      "Remboursement intégral effectué. Voici des logements avec les mêmes critères, et une réduction offerte par Darna.",
    reductionChip: (percent: number, cap: number) =>
      `Réduction Darna offerte — ${percent} %, jusqu'à ${cap} TND`,
    enSavoirPlus: "En savoir plus",
    detailParagraphe: (jours: number) =>
      `C'est l'hôte qui a annulé cette réservation — ni Darna, ni vous n'y êtes pour quelque chose. Ce genre d'annulation n'est jamais acceptable sur notre plateforme, quelle que soit la raison, et nous avons pris des mesures contre cet hôte (suspension de son compte). La réduction ci-dessus est valable ${jours} jours, sur n'importe lequel des logements proposés plus bas.`,
    intro: (titre: string) =>
      `Alternatives à « ${titre} », mêmes dates, même ville ou à proximité.`,
    aucuneSuggestion:
      "Aucune alternative disponible pour le moment aux mêmes dates. Explorez tous nos séjours.",
    voirTousLesSejours: "Voir tous les séjours",
  },
  traveler: {
    voirProfil: "Voir le profil",
    titre: (nom: string) => `Profil de ${nom}`,
    sousTitre: "Voyageur",
    membreDepuis: (annee: number) => `Membre depuis ${annee}`,
    donnerAvis: "Donner votre avis",
    avisTitre: "Avis des hôtes",
    avisRecus: (n: number) => (n === 1 ? "1 avis reçu" : `${n} avis reçus`),
    aucunAvis: "Aucun avis reçu pour le moment.",
  },
  factures: {
    titre: "Facture hôte",
    commissionPour: (titre: string) => `Commission Darna — ${titre}`,
    statutEnAttente: "En attente de règlement",
    statutPayee: "Réglée",
    montantDu: "Montant dû",
    echeance: (date: string) => `À régler avant le ${date}`,
    payeLe: (date: string) => `Réglée le ${date}`,
    payerKonnect: "Payer la commission",
    redirectionKonnect: "Redirection vers le paiement…",
    payerSimulation: "Marquer comme réglée (simulation)",
    paiementEnVerification: "Paiement en cours de vérification…",
    actualiser: "Actualiser",
    paiementEchoue: "Le paiement a échoué. Merci de réessayer.",
    factureIndisponible: "Cette facture n'est plus disponible.",
    paiementErreur: "Erreur lors de l'initialisation du paiement.",
    factureReglee: "Facture réglée.",
    listeTitre: "Mes factures",
    listeSousTitre: "Commissions Darna dues pour vos réservations en paiement sur place.",
    statutEnRetard: "En retard",
    vide: "Aucune facture pour le moment.",
    voirFacture: "Voir la facture",
  },
  credits: {
    titre: "Mes crédits",
    soldeLabel: "Solde disponible",
    soldeAide:
      "Utilisable au moment de payer une réservation, dans la limite de 30 % du total.",
    parrainageTitre: "Parrainez, gagnez des crédits",
    parrainageDesc: (montant: number) =>
      `Partagez votre lien : chaque ami qui s'inscrit reçoit ${montant} TND offerts.`,
    parrainerBouton: "Parrainer un ami",
    parrainageMessage: (montant: number) =>
      `Rejoins-moi sur Darna et reçois ${montant} TND de crédit offert à l'inscription !`,
    codeLabel: "Votre code",
    historiqueTitre: "Historique",
    historiqueVide: "Aucun mouvement pour le moment.",
    expireLe: (date: string) => `Expire le ${date}`,
    motifLabel: (motif: string) => {
      switch (motif) {
        case "BIENVENUE_PARRAINAGE":
          return "Bonus de bienvenue (parrainage)";
        case "BIENVENUE_SPONTANE":
          return "Crédit de bienvenue";
        case "PARRAINAGE_FILLEUL_TERMINE":
          return "Parrainage — filleul actif";
        case "UTILISATION_RESERVATION":
          return "Utilisé sur une réservation";
        case "UTILISATION_SERVICE_HOTE":
          return "Utilisé sur un service hôte";
        case "EXPIRATION":
          return "Crédit expiré";
        case "AJUSTEMENT_ADMIN":
          return "Ajustement";
        default:
          return motif;
      }
    },
  },
};

export type Dictionary = typeof fr;
