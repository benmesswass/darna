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
  },
  footer: {
    baseline: "La confiance est notre produit.",
    explorer: "Explorer",
    confiance: "Confiance",
    aPropos: "À propos",
    cgu: "CGU",
    mentionsLegales: "Mentions légales",
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
    indifferent: "Indifférent",
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
    disponibilites: "Disponibilités",
    avis: "Avis des voyageurs",
    nbAvis: (n: number) => (n === 1 ? "1 avis" : `${n} avis`),
    voirAvis: "Voir les avis",
    avisGarantie:
      "Chaque avis provient d'une réservation confirmée sur Darna — impossible d'en publier un sans avoir séjourné.",
    aucunAvis: "Aucun avis pour le moment — soyez le premier après votre séjour.",
    avisVerifie: "Séjour vérifié",
    noteGlobale: "Note globale",
    surface: (m: number) => `${m} m²`,
    pieces: (n: number) => (n === 1 ? "1 pièce" : `${n} pièces`),
    capacite: (n: number) => (n === 1 ? "1 voyageur" : `${n} voyageurs`),
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
    votreNote: "Votre note",
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
    motDePasseRegle: "8 caractères minimum",
    afficherMotDePasse: "Afficher le mot de passe",
    masquerMotDePasse: "Masquer le mot de passe",
    confirmerMotDePasse: "Confirmer le mot de passe",
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
    mettreALaUne: "Mettre à la une",
    prolongerALaUne: "Prolonger à la une",
    alaUneActif: (date: string) => `À la une jusqu'au ${date}`,
    alaUneSucces: "Votre annonce est désormais à la une ! 🎉",
    promoAlaUneTitre: "Passez vos annonces à la une",
    promoAlaUneDesc:
      "En tête des résultats et sur l'accueil pendant 7 jours, avec un badge doré qui attire l'œil. Les annonces mises en avant sont vues bien plus souvent.",
    aucuneReservation: "Aucune réservation pour le moment.",
    aucuneReservationCta: "Trouvez votre prochain séjour parmi nos annonces vérifiées.",
    aucuneReservationHote: "Aucun voyageur n'a encore réservé vos annonces.",
    aucuneReservationHoteCta:
      "Dès qu'un voyageur réserve l'une de vos annonces, il apparaîtra ici.",
    reservePar: (nom: string) => `Réservé par ${nom}`,
    payeLe: (date: string) => `Payé le ${date}`,
    contactVoyageurMasque:
      "Coordonnées du voyageur visibles dès que son acompte est réglé.",
    aucuneDemande: "Aucune demande reçue pour le moment.",
    aucunFavori: "Aucun favori pour le moment.",
    reservationDe: (nom: string) => `Réservation de ${nom}`,
    demandeDe: (nom: string) => `Demande de ${nom}`,
    contratBail: "Contrat de bail",
    statutReservation: {
      EN_ATTENTE: "En attente de paiement",
      CONFIRMEE: "Confirmée — paiement protégé",
      ANNULEE: "Annulée",
      TERMINEE: "Terminée",
    } as Record<string, string>,
    annulerReservation: "Annuler cette réservation",
    annulerConfirm: "Confirmer l'annulation",
    annulerAnnuler: "Garder la réservation",
    remboursement: (montant: number) =>
      montant > 0 ? `Remboursement : ${montant} TND` : "Aucun remboursement selon la politique",
    cancelledAt: (date: string) => `Annulée le ${date}`,
    rembourseLabel: (montant: number) => `Remboursé : ${montant} TND`,
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
    prixNuit: "Prix par nuit",
    nuits: (n: number) => (n === 1 ? "1 nuit" : `${n} nuits`),
    sousTotal: "Sous-total",
    fraisService: "Frais de service Darna",
    fraisServiceAide:
      "Ils financent la vérification des annonces et la protection des paiements.",
    total: "Total à payer",
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
    proprietaireImpossible: "Vous ne pouvez pas réserver votre propre logement.",
    proprietaireImpossibleAide:
      "C'est votre annonce. Pour la tester en tant que voyageur, connectez-vous avec un autre compte.",
    capaciteDepassee: (max: number) =>
      `Ce logement accueille au maximum ${max} voyageurs.`,
    connexionRequise: "Connectez-vous pour réserver.",
    verifRequise: "Vérifiez votre compte (e-mail + téléphone) avant de réserver.",
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
      "Paiement sécurisé via Konnect — carte bancaire, e-DINAR ou wallet. Vos fonds restent protégés par Darna jusqu'à la fin de votre séjour.",
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
      "Votre acompte est bloqué en séquestre par Darna. Les coordonnées de l'hôte vous sont communiquées dès la confirmation de la réservation.",
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
  },
  alaUne: {
    titre: "Mettez votre annonce à la une",
    sousTitre:
      "Boostez votre visibilité pendant une semaine : votre annonce passe en tête des résultats et s'affiche sur l'accueil de Darna.",
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
    prix: "Mise à la une (1 semaine)",
    total: "Total à payer",
    mockInfo:
      "Paiement Konnect / Flouci bientôt disponible. Mode démonstration : aucun débit réel.",
    payer: "Payer et passer à la une (simulation)",
    prolongerInfo: (date: string) =>
      `Cette annonce est déjà à la une jusqu'au ${date}. Un nouvel achat prolonge le boost d'une semaine.`,
    retour: "Retour à mes annonces",
    indisponible:
      "Cette annonce ne peut pas être mise à la une : elle doit être active et en ligne.",
    garantie:
      "Vous gardez le contrôle : à la fin de la semaine, votre annonce revient simplement à son affichage normal. Aucun renouvellement automatique.",
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
    mentionsTitre: "Mentions légales",
    aRediger:
      "Document en cours de rédaction — il sera publié avant le lancement officiel de la plateforme.",
  },
  notFound: {
    titre: "Page introuvable",
    desc: "Cette page n'existe pas ou l'annonce a été retirée. Comme quoi, même chez Darna, tout ne dure pas toujours.",
    cta: "Retour à l'accueil",
  },
};

export type Dictionary = typeof fr;
