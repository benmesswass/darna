import type { Dictionary } from "./fr";

/**
 * Dictionnaire anglais — même structure que `fr.ts` (vérifiée par le type).
 */
export const en: Dictionary = {
  meta: {
    siteName: "Darna",
    tagline: "Our home, with full confidence",
    description:
      "Darna — stays and real estate in Tunisia. Verified listings, transparent prices, zero deposit to the owner.",
  },
  nav: {
    sejours: "Stays",
    immobilier: "Real estate",
    prixDuMarche: "Market prices",
    simulateur: "How much could I earn?",
    diaspora: "Tunisians abroad",
    devenirWakil: "Become a Wakil",
    connexion: "Sign in",
    inscription: "Sign up",
    dashboard: "My account",
    deconnexion: "Sign out",
    publier: "Post a listing",
    menu: "Menu",
    precedent: "Previous",
    suivant: "Next",
  },
  brand: {
    heroTitle: "What you see exists.",
    heroLine2: "The price you see is the price you pay.",
    heroLine3: "Zero deposit to the owner.",
    heroSub:
      "Darna is the first Tunisian platform where every listing is verifiable, every price is transparent, and you never pay a deposit to the owner: only the booking fee is paid online, refunded if the listing isn't accurate.",
    ctaSejours: "Find a stay",
    ctaImmobilier: "Explore real estate",
  },
  home: {
    villesPopulaires: "Popular destinations:",
    statsAnnoncesVerifiees: "active verified listings",
    statsVilles: "cities covered",
    statsAvis: "reviews from real stays",
    verticalSejoursTitle: "Stays",
    verticalSejoursDesc:
      "Villas, guesthouses and apartments for your holidays — real availability calendar, reviews from real travellers, zero deposit to the owner.",
    verticalImmobilierTitle: "Real estate",
    verticalImmobilierDesc:
      "Long-term rentals and sales — fresh listings, market price per m², direct contact with the owner or agency.",
    tabSejoursSub: "Verified holiday stays",
    tabImmoSub: "Buy or rent",
    tabSejoursDesc:
      "Villas and guesthouses for your holidays, zero deposit to the owner.",
    tabImmoDesc: "Sales and long-term rentals, directly with the owner.",
    heroQuestion: "What are you looking for?",
    diffTitle: "Stays or Real estate?",
    diffSejours:
      "For your holidays: book a verified place — you only pay the booking fee online, never a deposit to the owner.",
    diffImmo:
      "To live year-round: buy or rent long-term, in direct contact with the owner or agency — no online payment.",
    trustTitle: "How Darna protects you",
    trust1Title: "Verified listings",
    trust1Desc:
      "Our Wakils visit the properties in person. The “Darna Verified” badge guarantees the property exists and matches the photos.",
    trust2Title: "Zero hidden fees",
    trust2Desc:
      "The summary breaks down every dinar before payment: price, nights, service fee. No viewing fees, ever.",
    trust3Title: "Zero deposit to the owner",
    trust3Desc:
      "You never pay a deposit to the owner. Online, you only pay the booking fee — refunded if the listing isn't accurate. The stay itself is settled on the spot, on arrival.",
    featuredTitle: "Recent verified listings",
    featuredAll: "See all listings",
    alaUneTitle: "Featured",
    alaUneSub: "Highlighted picks promoted by our hosts.",
    statsTitle: "The market, live",
    statsDesc:
      "The Darna Index aggregates the platform's real prices: check prices per m² by governorate and average nightly rates by city.",
    statsCta: "View the Darna Index",
    diasporaTitle: "Tunisians abroad",
    diasporaDesc:
      "Search, compare and book from Europe with full confidence — prices in euros and video visits coming soon.",
    diasporaCta: "Discover the dedicated space",
    wakilTitle: "Become a Darna Wakil",
    wakilDesc:
      "Join the network of trusted agents who verify properties on the ground and earn extra income.",
    wakilCta: "Apply",
    liveTrustTitle: "Trust, live",
    liveTrustProgress: (count: number, target: number) =>
      `${count} / ${target} verified listings toward our goal`,
    liveTrustItem: (city: string, date: string) => `${city} · verified on ${date}`,
    liveTrustCta: "See verified listings",
  },
  footer: {
    baseline: "Trust is our product.",
    explorer: "Explore",
    confiance: "Trust",
    aPropos: "About",
    cgu: "Terms of use",
    mentionsLegales: "Legal notice",
    confidentialite: "Privacy policy",
    contact: "Contact",
    copyright: "Darna — made with care in Tunisia.",
  },
  common: {
    tnd: "TND",
    eur: "€",
    parNuit: "/ night",
    parMois: "/ month",
    chambres: "rooms",
    voyageurs: "guests",
    surface: "m²",
    rechercher: "Search",
    voir: "View",
    annuler: "Cancel",
    enregistrer: "Save",
    envoyer: "Send",
    fermer: "Close",
    retour: "Back",
    imprimer: "Print",
    chargement: "Loading…",
    erreurInconnue: "Something went wrong. Please try again.",
    reessayer: "Try again",
    champsRequis: "Please check the form fields.",
    tropDeTentatives: "Too many attempts. Please wait a few minutes and try again.",
    optionnel: "optional",
  },
  badges: {
    verifie: "Darna Verified",
    verifieRemote: "Verified by Darna",
    verifieOnSite: "Wakil Certified",
    nonVerifie: "Not verified",
    publieAujourdhui: "Posted today",
    publieHier: "Posted yesterday",
    publieIlYa: (jours: number) => `Posted ${jours} days ago`,
    expiree: "Expired listing",
    enAttenteValidation: "Pending validation",
    loue: "Rented",
    vendu: "Sold",
    sejour: "Stay",
    location: "Rental",
    vente: "For sale",
    alaUne: "Featured",
    alaUneTooltip:
      "Promoted listing: it appears at the top of results and on the Darna homepage.",
    promo: (pct: number) => `${pct}% off`,
    superHote: "Superhost",
    superHoteTooltip:
      "Zero cancellations and excellent reviews over the last 3 months — a reliable host, proven by real results.",
  },
  search: {
    villePlaceholder: "City — Hammamet, Djerba, La Marsa…",
    suggestionsVilles: "City suggestions",
    suggestionsGouvernorats: "Governorate suggestions",
    ouAllezVous: "Where are you going?",
    arrivee: "Check-in",
    depart: "Check-out",
    datePlaceholder: "dd/mm/yyyy",
    voyageurs: "Guests",
    transaction: "Transaction",
    louer: "Rent",
    acheter: "Buy",
    gouvernorat: "Governorate",
    tousGouvernorats: "All governorates",
    prix: "Price",
    prixMin: "Min price",
    prixMax: "Max price",
    min: "min",
    max: "max",
    totalSejour: (n: number) => `total · ${n === 1 ? "1 night" : `${n} nights`}`,
    equivSejour: (n: number) => `That's for ${n === 1 ? "1 night" : `${n} nights`}:`,
    surfaceMin: "Min area (m²)",
    piecesMin: "Min rooms",
    chambresMin: "Min bedrooms",
    typeBien: "Property type",
    indifferent: "Any",
    creerAlerte: "Create alert",
    alerteEnregistree: "Alert created — we'll email you.",
    alerteExisteDeja: "You already have an alert for this search.",
    resultats: (n: number) =>
      n === 0 ? "No results" : n === 1 ? "1 listing" : `${n} listings`,
    precedent: "Previous",
    suivant: "Next",
    pageInfo: (page: number, total: number) => `Page ${page} of ${total}`,
    aucunResultatTitre: "No listing matches",
    aucunResultatDesc:
      "Try widening your criteria or removing filters. Expired listings are automatically removed from results.",
    aucuneAnnonceVille: (ville: string) =>
      `No listing in ${ville} for these dates`,
    elargirProche: "Widen your search to nearby cities:",
    elargirPopulaire: "Discover our most active destinations instead:",
    elargiProximiteIntro: "Here are stays in the closest cities:",
    voirToutVille: (ville: string, n: number) =>
      `${ville} · see ${n === 1 ? "1 listing" : `all ${n} listings`}`,
    hoteAbsentTitre: (ville: string) =>
      `Got a place in ${ville}? Travelers are already searching for one.`,
    hoteAbsentDesc: (ville: string) =>
      `Travelers are already looking for a stay in ${ville}. Become the destination's first host and publish your first listing in minutes.`,
    hoteCtaBouton: "Become a host",
    voirListe: "List",
    voirCarte: "Map",
    chargementCarte: "Loading map…",
    agrandirCarte: "Expand map",
    fermerCarte: "Close map",
    sansAvis: "No reviews yet",
    filtres: "Filters",
    reinitialiser: "Reset",
    verifiesUniquement: "Verified only",
    noteMinimale: "Minimum rating",
    toutesNotes: "All ratings",
    noteMinPlus: (n: number) => `${n}★ & up`,
    trier: "Sort",
    triRecommande: "Recommended",
    triPrixAsc: "Price: low to high",
    triPrixDesc: "Price: high to low",
    triAvisDesc: "Top rated",
    triAvisAsc: "Lowest rated",
    triRecent: "Most recent",
    equipements: "Amenities",
  },
  destination: {
    chargement: "Loading destination…",
    logementsDispo: (n: number) =>
      n <= 0
        ? "No places available"
        : n === 1
          ? "1 place available"
          : `${n} places available`,
    voirTout: (n: number) => (n === 1 ? "View listing" : `View all ${n} places`),
    recommandations: "Our picks",
    aucunIci: "No place here yet — discover nearby:",
    autreDestination: "Or explore another destination",
    destinationsPopulaires: "Trending destinations",
    verifie: "Verified",
    meteoClear: "Sunny",
    meteoClouds: "Cloudy",
    meteoRain: "Rainy",
    meteoActuelle: "Current weather",
    meteoSejour: "For your stay",
    meteoMoyenneSaison: "seasonal average",
  },
  property: {
    description: "Description",
    caracteristiques: "Features",
    equipements: "Amenities",
    localisation: "Location",
    ouvrirGoogleMaps: "Open in Google Maps",
    disponibilites: "Availability",
    avis: "Traveller reviews",
    nbAvis: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    voirAvis: "See reviews",
    annoncesSimilaires: "Similar listings",
    avisGarantie:
      "Every review comes from a confirmed booking on Darna — it is impossible to post one without having stayed.",
    aucunAvis: "No reviews yet — be the first after your stay.",
    avisVerifie: "Verified stay",
    avisSystemeAnnulationHote: (checkIn: string, checkOut: string) =>
      `Stay from ${checkIn} to ${checkOut} cancelled by the host. Guest fully refunded.`,
    avisSystemeLabel: "Automatic rating",
    noteGlobale: "Overall rating",
    surface: (m: number) => `${m} m²`,
    pieces: (n: number) => (n === 1 ? "1 room" : `${n} rooms`),
    capacite: (n: number) => (n === 1 ? "1 guest" : `${n} guests`),
    activiteVues: (n: number) => `${n} people viewed this listing recently`,
    activiteDerniereResa: (jours: number) =>
      jours === 0
        ? "Booked today"
        : jours === 1
          ? "Booked yesterday"
          : `Last booked ${jours} days ago`,
    reserver: "Book",
    contacter: "Contact",
    whatsapp: "WhatsApp",
    fraisServiceInfo: "Transparent service fee included at checkout",
    verifieTooltip:
      "This property has been visited and verified by a Darna Wakil: it exists, and the photos match.",
    verifieRemoteTooltip:
      "The Darna team checked the photos, the owner's identity and conducted a video call.",
    verifieOnSiteTooltip:
      "A Wakil agent physically visited the property. It exists and the photos match reality.",
    verifieRemoteCriteres: "Photos · Identity · Video call",
    verifieOnSiteCriteres: "On-site visit · Photos · Identity",
    verifieRemoteBloc:
      "The Darna team reviewed the photos and information for this listing (video call or document verification with the owner).",
    verifieOnSiteBloc:
      "A Wakil agent visited the property in person. They confirmed the property exists, the photos match reality and the owner is reachable.",
    verifiePar: (nom: string) => `by ${nom}`,
    promoTooltip: (date: string) => `Price temporarily lowered by the host, until ${date}.`,
    enSavoirPlusWakil: "Learn more about the Wakil network",
    enSavoirPlusDarna: "Learn more about our checks",
    nonVerifieTooltip:
      "This property has not been verified on the ground yet. Never pay a deposit outside Darna.",
    proprietaire: "Owner",
    agence: "Agency",
    hoteMasque: "Verified host — identity revealed at booking",
    annonceIndisponible:
      "This listing is no longer active. It is kept for archive purposes only.",
    annonceEnAttente:
      "This listing is being reviewed by the Darna team. It will be visible once validated.",
    legende: "Unavailable",
    jourLibre: "Available",
    publierAvis: "Leave a review",
    sousNoteProprete: "Cleanliness",
    sousNoteCommunication: "Communication",
    sousNoteConformite: "Accuracy",
    sousNoteQualitePrix: "Value for money",
    votreCommentaire: "Your comment",
    avisEnvoye: "Thank you! Your review has been published.",
    avisRefuse:
      "Only travellers with a confirmed and completed booking can leave a review.",
    trierPar: "Sort by",
    triRecents: "Most recent",
    triAnciens: "Oldest",
    triMeilleures: "Highest rated",
    triMoins: "Lowest rated",
    filtreToutes: "All ratings",
    filtreParNote: (n: number) => (n === 1 ? "1 star" : `${n} stars`),
    aucunAvisFiltre: "No review matches this filter.",
    afficherPlusAvis: (n: number) => `Show ${n} more reviews`,
    afficherMoinsAvis: "Show less",
    favoriAjouter: "Add to favourites",
    favoriRetirer: "Remove from favourites",
    favoriChoisirDossier: "Save to a folder",
    favoriNouveauDossier: "New folder",
    favoriNomDossier: "Folder name",
    favoriCreerDossier: "Create and save",
    favoriAnnuler: "Cancel",
    favoriSansDossier: "No folder",
    partagerWhatsapp: (titre: string, prix: string) =>
      `Hello, I'm interested in your listing “${titre}” (${prix}) seen on Darna. Is it still available?`,
    partager: "Share",
    copierLien: "Copy link",
    lienCopie: "Link copied!",
    partagerMessage: (titre: string) => `Check out “${titre}” on Darna:`,
    politiqueAnnulation: "Cancellation policy",
    cancelPolicy: {
      FLEXIBLE: "Flexible",
      MODEREE: "Moderate",
      FERME: "Firm",
      STRICTE: "Strict",
    } as Record<string, string>,
    cancelPolicyDesc: {
      FLEXIBLE: "Free cancellation up to 24 hours before check-in.",
      MODEREE: "Free cancellation up to 5 days before check-in.",
      FERME:
        "Free cancellation up to 30 days before; 50% refund between 7 and 30 days; no refund within 7 days.",
      STRICTE: "50% refund if cancelled at least 14 days before; no refund after.",
    } as Record<string, string>,
    gallery: {
      ouvrir: "Open gallery",
      voirToutes: (n: number) => `View all ${n} photos`,
      fermer: "Close",
      precedente: "Previous photo",
      suivante: "Next photo",
      compteur: (i: number, n: number) => `${i} / ${n}`,
      allerA: (i: number) => `Go to photo ${i}`,
      pleinEcran: "Fullscreen",
      quitterPleinEcran: "Exit fullscreen",
      chargement: "Loading photo…",
      aucunePhoto: "No photos for this listing.",
      boucleDebut: "Back to start",
      boucleFin: "Last photo",
    },
  },
  auth: {
    connexionTitre: "Sign in to Darna",
    inscriptionTitre: "Create a Darna account",
    email: "E-mail address",
    motDePasse: "Password",
    nom: "Full name",
    telephone: "Phone (+216…)",
    role: "I am…",
    roleVoyageur: "Traveller / Tenant",
    roleHote: "Host / Owner",
    roleAgence: "Real estate agency",
    seConnecter: "Sign in",
    sInscrire: "Sign up",
    dejaCompte: "Already have an account?",
    pasDeCompte: "No account yet?",
    identifiantsInvalides: "Invalid credentials.",
    captchaEchec: "Anti-bot check failed. Please try again.",
    emailDejaUtilise: "Unable to create an account with this information.",
    inscriptionReussie: "Account created! You can now sign in.",
    parrainageBanniere: (montant: number) =>
      `You've been invited to Darna — you'll get ${montant} TND credit as soon as you sign up.`,
    motDePasseRegle: "8 characters minimum",
    afficherMotDePasse: "Show password",
    masquerMotDePasse: "Hide password",
    confirmerMotDePasse: "Confirm password",
    motDePasseNonIdentiques: "Passwords do not match.",
    compteCreeConnectezVous: "Account created! Sign in to continue.",
    pays: "Country of residence",
    motDePasseOublie: "Forgot your password?",
    resetTitre: "Reset your password",
    resetSousTitre:
      "Enter your account email address and we'll send you a reset link.",
    resetEnvoyer: "Send the link",
    resetEmailEnvoye:
      "If an account exists for this address, a reset link has just been sent.",
    resetModeDemo: "Demo mode — reset link:",
    resetOuvrirLien: "Open the reset link",
    resetNouveauMdp: "New password",
    resetValider: "Reset password",
    resetReussi: "Password reset. You can now sign in.",
    resetLienInvalide:
      "Invalid or expired link. Please request a new reset.",
    resetMotDePasseInvalide:
      "The password must be at least 8 characters and contain a digit.",
    resetRetourConnexion: "Back to sign in",
    resetMailSujet: "Darna — reset your password",
    resetMailCorpsHtml: (url: string) =>
      `<p>You requested to reset your Darna password.</p>` +
      `<p><a href="${url}">Click here to choose a new password</a>.</p>` +
      `<p>This link expires in 30 minutes. If you didn't request this, ignore this email.</p>`,
  },
  dashboard: {
    titre: "My account",
    bonjour: (nom: string) => `Hello, ${nom}`,
    mesAnnonces: "My listings",
    mesReservations: "My bookings",
    mesVoyageurs: "My guests",
    demandesRecues: "Received requests",
    yieldAdvisor: "Yield Advisor",
    kyc: "Identity verification",
    email: "Email verification",
    monProfil: "My details",
    mesAlertes: "My alerts",
    alertesTitre: "My search alerts",
    alertesAucune:
      "No saved alerts yet. From the stays search, click “Create alert” to get an email as soon as a matching listing is published.",
    alerteSupprimer: "Delete",
    alerteBudget: (min: number, max: number) => `${min} – ${max} TND`,
    alerteBudgetMin: (min: number) => `From ${min} TND`,
    alerteBudgetMax: (max: number) => `Up to ${max} TND`,
    alerteBudgetLibre: "Any budget",
    mesCredits: "My credits",
    favoris: "My favourites",
    favorisSansDossier: "No folder",
    favorisNbLogements: (n: number) =>
      `${n} listing${n > 1 ? "s" : ""}`,
    favorisRenommer: "Rename",
    favorisSupprimerDossier: "Delete",
    favorisSupprimerConfirm:
      "Delete this folder? Saved listings will be moved to “No folder”.",
    favorisEnregistrer: "Save",
    favorisAnnuler: "Cancel",
    nouvelleAnnonce: "New listing",
    aucuneAnnonce: "You don't have any listings yet.",
    aucuneAnnonceCta: "Publish your first listing in a few minutes.",
    creerAnnonce: "Create a listing",
    statut: "Status",
    expireLe: (date: string) => `Expires on ${date}`,
    expireDans: (jours: number) =>
      jours <= 0 ? "Expired" : `Expires in ${jours} d`,
    marquerLoue: "Mark as rented",
    marquerVendu: "Mark as sold",
    republier: "Republish (+30 d)",
    annonceMarquee: "Listing updated.",
    voirAnnonce: "View listing",
    voirProfilHote: "View host profile",
    voirProfilVoyageur: "View traveler profile",
    mettreALaUne: "Feature this listing",
    prolongerALaUne: "Extend featuring",
    alaUneActif: (date: string) => `Featured until ${date}`,
    alaUneSucces: "Your listing is now featured! 🎉",
    promoLien: "Promo",
    promoActifBanner: (date: string) => `Promo active until ${date}`,
    annonceMasqueeBanner: (date: string) =>
      `Listing temporarily hidden from search following a cancellation on your part — it reappears on ${date}.`,
    promoAlaUneTitre: "Feature your listings",
    promoAlaUneDesc:
      "Top of results and on the homepage for a month, with an eye-catching gold badge. Featured listings get seen far more often.",
    completudeTitre: (score: number, total: number) => `Listing ${score}/${total} complete`,
    completudePhotos: "At least 5 photos",
    completudeDescription: "Detailed description",
    completudeEquipements: "At least 3 amenities",
    completudeCta: "Complete this listing",
    verifWakilSolde: (n: number) =>
      n === 1
        ? "1 Wakil verification credit available."
        : n === 0
          ? "No verification credit — pay per listing to get a Wakil verification."
          : `${n} Wakil verification credits available.`,
    verifWakilPrix: "Verification price",
    verifWakilPayer: "Pay for verification",
    verifWakilPayerSimulation: "Pay for verification (simulation)",
    verifWakilCreditPret: "Verification credit ready — a Wakil will review this listing soon.",
    aucuneReservation: "No bookings yet.",
    aucuneReservationCta: "Find your next stay among our verified listings.",
    aucuneReservationHote: "No guest has booked your listings yet.",
    aucuneReservationHoteCta:
      "As soon as a traveler books one of your listings, they'll show up here.",
    reservePar: (nom: string) => `Booked by ${nom}`,
    payeLe: (date: string) => `Paid on ${date}`,
    contactVoyageurMasque:
      "Guest's contact details become visible once their deposit is paid.",
    suspenduJusqu: (date: string) => `Account suspended until ${date}`,
    suspenduIndefini: "Account suspended",
    suspenduDetail:
      "The rest of your account stays accessible. While suspended, you can't make a new booking or send messages.",
    enSavoirPlus: "Learn more",
    suspenduPourquoiTitre: "Why?",
    suspenduPourquoiMessageBypass:
      "Several attempts to share contact details off Darna (phone or email) were detected in your messages, which isn't allowed until the booking is firm.",
    suspenduPourquoiNoShow:
      "You didn't show up for a confirmed pay-at-property stay, which penalizes the host who had reserved those dates for you.",
    suspenduPourquoiHostCancel:
      "You cancelled an already confirmed booking — the guest was fully refunded, but cancelling after confirmation is still penalized.",
    suspenduPourquoiFactureImpayee:
      "A Darna commission invoice remains unpaid despite a reminder — please settle it to lift the suspension.",
    facturesEnRetardBanniereTitre: "Listings hidden: overdue invoice",
    facturesEnRetardBanniereDetail:
      "Until you settle your overdue commission invoice, all your listings are invisible to travelers and cannot be booked.",
    facturesEnRetardBanniereCta: "View my invoices",
    suspenduConsequencesTitre: "Consequences:",
    suspenduProchaine: (jours: number) =>
      `If you try again, the next suspension will last ${jours} days.`,
    suspenduProchaineIndefinie:
      "If you try again, your account will be suspended indefinitely (subject to admin review).",
    aucuneDemande: "No requests received yet.",
    demandesContactTitre: "Contact requests",
    aucunFavori: "No favourites yet.",
    reservationDe: (nom: string) => `Booking from ${nom}`,
    demandeDe: (nom: string) => `Request from ${nom}`,
    contratBail: "Lease agreement",
    statutReservation: {
      EN_ATTENTE: "Awaiting payment",
      EN_ATTENTE_ACCEPTATION: "Cash request — awaiting your decision",
      CONFIRMEE: "Confirmed — fee paid",
      ANNULEE: "Cancelled",
      TERMINEE: "Completed",
    } as Record<string, string>,
    annulerReservation: "Cancel this booking",
    annulerConfirm: "Confirm cancellation",
    annulerAnnuler: "Keep my booking",
    accepterDemande: "Accept the request",
    refuserDemande: "Decline",
    refuserConfirmer: "Confirm decline",
    refuserAnnuler: "Go back",
    demandeCashRecapAide: (montant: number) =>
      `The guest will pay ${montant} TND in cash on arrival. Your Darna commission will be invoiced to you separately after you accept.`,
    signalerNoShow: "Report a guest no-show",
    noShowConfirmer: "Confirm the no-show",
    noShowAnnuler: "Go back",
    noShowAvertissement:
      "Only confirm if the guest genuinely didn't show up — this action suspends their account.",
    signalerNoShowIndemnite: "Report a no-show (compensated)",
    noShowIndemniteAvertissement:
      "Only confirm if the guest genuinely didn't show up — you'll be compensated in Darna credits and their account will be suspended.",
    annulerReservationHote: "Cancel this booking",
    hostCancelModalTitre: "Cancel this booking?",
    hostCancelAvertissementHumain:
      "This is not a small thing: your guest planned their stay trusting you. Only do this as a last resort.",
    hostCancelConsequencesTitre: "If you confirm:",
    hostCancelConsequenceRemboursement: "The guest will be fully refunded",
    hostCancelConsequenceBlocage: (jours: number) =>
      `This listing will be hidden on Darna for ${jours} days`,
    hostCancelConsequenceSuspension: (jours: number | null) =>
      `Your account will be suspended ${jours ? `for ${jours} days` : "indefinitely"}`,
    confirmeeCashLabel: "Confirmed — to pay in cash on arrival",
    confirmeeLe: (date: string) => `Confirmed on ${date}`,
    demandesCashTitre: "Cash booking requests",
    demandesCashAide:
      "Pay-at-property booking requests awaiting your decision.",
    remboursement: (montant: number) =>
      montant > 0 ? `Refund: ${montant} TND` : "No refund under this policy",
    cancelledAt: (date: string) => `Cancelled on ${date}`,
    rembourseLabel: (montant: number) => `Refunded: ${montant} TND`,
    rembourseEnCoursLabel: (montant: number) => `Refund of ${montant} TND in progress`,
    signalerProbleme: "Report a problem",
    signalementAvertissement:
      "This report opens a case reviewed by our team — it does not refund automatically. Describe precisely the problem found on arrival.",
    signalementCategorieLabel: "Problem category",
    signalementCategories: {
      ANNONCE_TROMPEUSE: "The property doesn't match the listing",
      LOGEMENT_INACCESSIBLE: "Unable to access the property",
      PROPRETE_SALUBRITE: "Cleanliness or habitability",
      AUTRE: "Other issue",
    } as Record<string, string>,
    signalementDescriptionPlaceholder: "Describe precisely the problem you encountered…",
    signalementConfirmer: "Send the report",
    signalementAnnuler: "Go back",
    signalementStatutRecu: "Report under review",
    signalementStatutValide: "Report validated",
    signalementStatutRejete: "Report rejected",
    noterVoyageur: "Rate this guest",
    avisVoyageurEnvoye: "Review submitted — thank you!",
    votreAvisSurCeVoyageur: "Your review of this guest:",
    avisHoteSurVous: "What the host said about your stay:",
    revenus: "Earnings",
    revenusTitre: "My earnings",
    revenusSousTitre:
      "Guests pay you the rent in cash on arrival — Darna never touches it. This page recaps your net rent: already collected, or upcoming.",
    revenusTotal: "Confirmed earnings",
    revenusEnAttente: "Due on arrival",
    revenusVerse: "Already collected",
    revenusAucun: "No earnings yet.",
    revenusAucunCta:
      "As soon as a booking is confirmed, your net rent appears here — due on arrival, then counted once the stay is over.",
    revenusBadgeEnAttente: "Due on arrival",
    revenusBadgeVerse: "Collected",
    revenusAEncaisserLe: (date: string) =>
      `Cash due on the guest's arrival, ${date}`,
    revenusVerseApres: (date: string) => `Collected — stay ended on ${date}`,
    revenusFraisInfo: (amount: string) =>
      `Includes ${amount} of Darna service fees already paid online by your guests — separate from your rent above.`,
  },
  annonceForm: {
    titre: "Listing title",
    titrePlaceholder: "Villa with pool in Hammamet",
    type: "Listing type",
    typeSejour: "Stay (holiday rental)",
    typeLocation: "Long-term rental",
    typeVente: "Sale",
    prix: "Price",
    prixNuit: "Price per night (TND)",
    prixMois: "Monthly rent (TND)",
    prixVente: "Sale price (TND)",
    ville: "City",
    gouvernorat: "Governorate",
    adresse: "Address (neighbourhood, street)",
    surface: "Area (m²)",
    pieces: "Number of rooms",
    capacite: "Capacity (guests)",
    typeBien: "Property type",
    politiqueAnnulation: "Cancellation policy",
    politiqueAnnulationAide:
      "Sets what guests get back if they cancel. The more flexible, the more reassuring; the stricter, the more your income is protected.",
    equipements: "Amenities",
    description: "Description",
    genererDescription: "Generate description",
    genererDescriptionAide:
      "Composes a text from the fields you filled in — editable afterwards.",
    publier: "Publish listing",
    apercuPublier: "Preview before publishing",
    apercuTitre: "Preview your listing",
    apercuAide: "Here is how your listing will appear to travelers. Review it, then confirm.",
    continuerEdition: "Keep editing",
    confirmerPublier: "Confirm and publish",
    annonceCreee: "Listing published! It is online for 30 days.",
    modifierTitre: "Edit listing",
    enregistrerModifs: "Save changes",
    annonceModifiee: "Listing updated.",
    typeNonModifiable:
      "The listing type cannot be changed after publication (linked bookings and history).",
    photosTitre: "Listing photos",
    photosAide:
      "JPEG, PNG or WebP — 5 MB max per photo, 8 photos per listing. The cover is the first photo displayed.",
    photosAccroche:
      "Listings with great photos get viewed far more often. Add at least one.",
    photosDeposer: "Drag your photos here",
    photosDeposerAide: "or browse your files — JPEG, PNG or WebP",
    photosParcourir: "Browse my photos",
    photosCreationAide: "The first photo will be your listing’s cover.",
    photosReordonner: "Drag the photos to change their order.",
    photoRequise: "Add at least one photo to publish your listing.",
    ajouterPhotos: "Add photos",
    choisirFichiers: "Choose files…",
    photosAjoutees: "Photos added!",
    supprimerPhoto: "Delete",
    definirCouverture: "Set as cover",
    couverture: "Cover",
    legendePhoto: "Description (optional)",
    legendePlaceholder: "e.g. Bright living room with balcony",
    legendeAide:
      "A short description per photo, shown as an overlay in the gallery.",
    legendeEnregistree: "Description saved.",
    legendeEnregistrer: "Save",
    erreurUpload:
      "File rejected: accepted formats JPEG/PNG/WebP, maximum size 5 MB.",
    maxPhotos: (n: number) => `Maximum ${n} photos per listing.`,
    localisation: "Location on the map",
    adresseRecherchePlaceholder: "Type your address: street, neighbourhood, city…",
    rechercheAdresse: "Searching…",
    aucuneAdresse: "No address found — pick the city and drag the marker.",
    repereAide: "Drag the marker (or click the map) to pinpoint the exact spot.",
    disponibilitesTitre: "Block dates",
    disponibilitesAide:
      "Make your place unavailable for a period (personal stay, renovation…). Blocked dates disappear from travellers' booking calendar.",
    bloquerDates: "Block these dates",
    aucunBlocage: "No blocked dates yet.",
    blocageAjoute: "Dates blocked.",
    supprimerBlocage: "Remove this block",
    blocageRetraitConfirmer: "Remove this block?",
    blocageRetraitOui: "Remove",
    blocageNotePlaceholder: "Note (e.g. family stay, renovation…) — optional",
    blocageDatesInvalides:
      "Invalid dates — pick a check-in and check-out (check-out after check-in, not in the past).",
    blocageConflitReservation:
      "Can't block: a booking already exists for this period.",
    promoAnnonceNonEligible:
      "This listing must be verified and active to get a promo.",
    promoPrixInvalide: "The promo price must be lower than the listing's normal price.",
    promoDateInvalide:
      "Invalid promo end date — pick a future date, within a reasonable timeframe.",
    promoDefinie: "Promo activated on your listing.",
    cashPaymentTitre: "Pay-at-property (cash)",
    cashPaymentAide:
      "For guests without a suitable online payment method. The stay is paid entirely in cash on arrival; your Darna commission is invoiced to you separately after the booking, payable online.",
    cashPaymentToggle: "Accept bookings paid on-site (cash)",
    cashTermsPrefix: "I have read and accept the",
    cashTermsRequise:
      "You must accept the host terms to enable pay-at-property.",
  },
  kyc: {
    titre: "Identity verification (KYC)",
    sousTitre:
      "Verification strengthens trust: your badge appears on your listings and reassures travellers.",
    statutNonVerifie: "Identity not verified",
    statutEnAttente: "Verification in progress",
    statutVerifie: "Identity verified",
    cin: "CIN number (8 digits)",
    telephone: "Mobile phone (+216…)",
    indicatifPays: "Country code",
    telephonePlaceholder: "22 345 678",
    envoyerOtp: "Receive the verification code",
    otpMockInfo:
      "Demo mode: no real SMS is sent. Your code is displayed below.",
    otpSmsInfo: "A verification code has been sent to you by SMS.",
    votreCode: "Your verification code",
    saisirOtp: "Enter the code you received",
    valider: "Validate the code",
    otpInvalide: "Incorrect code. Please try again.",
    verifieBravo:
      "Congratulations, your identity is verified! The badge now appears on your profile.",
    dejaVerifie: "Your identity is already verified.",
    statutVerifieDemo: "Identity verified (demo)",
    verifieDemoBravo:
      "Verification completed in demo mode. In production, a real SMS will be required to earn the genuine verified badge.",
    kycRequis:
      "Your identity must be verified before publishing a listing.",
    gateRequiseTitre: "Verify your identity to publish",
    gateRequiseDesc:
      "To keep trust high on Darna, only verified owners can publish a listing. Verification takes less than two minutes.",
    gateRequiseCta: "Verify my identity",
    otpEnvoiEchoue:
      "Unable to send the verification code right now. Please try again in a moment.",
    telephoneIntro: "Receive a code by SMS or WhatsApp to confirm your number.",
    telephoneVerifie: "Phone verified.",
    telephoneRequis: "Please verify your phone first.",
    cinIntro:
      "Enter your ID (CIN) number. It stays confidential and can only be linked to a single Darna account.",
    validerCin: "Verify my ID",
    cinDejaUtilisee:
      "This ID is already linked to an account. An ID document can only be used for one Darna account.",
  },
  admin: {
    badge: "Admin",
    titre: "Darna Administration",
    annonces: "Listings",
    navAnnonces: "Verify listings",
    navWakils: "Verify Wakils",
    navSignalements: "Flags",
    signalementsTitre: "Anti-bypass flags",
    signalementsSousTitre:
      "Messages where contact details were detected and hidden. Spot attempts to go off Darna and repeat offenders.",
    signalementsVide: "No flags yet.",
    signalementsCompte: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
    signalementsEscalade: (n: number) => `Repeat offender — ${n} attempts`,
    signalementsSuspendu: "Account suspended",
    signalementsSuspenduJusqu: (date: string) => `Suspended until ${date}`,
    reactiver: "Reactivate account",
    navAnalytics: "Dashboard",
    wakils: "Wakils",
    fileModeration: "Listing moderation queue",
    fileModerationDesc:
      "Grant the \"Verified Darna\" badge to listings whose owner has verified their identity. Grayed-out listings require the owner to complete identity verification at /dashboard/kyc first.",
    annonce: "Listing",
    proprietaire: "Owner",
    kycStatut: "Owner identity",
    kycStatutTooltip: "Owner identity verification status",
    kycBloque: "Identity not verified — ask the owner to verify at /dashboard/kyc before granting the badge.",
    statut: "Listing status",
    actions: "Actions",
    verifiee: "Verified",
    nonVerifiee: "Not verified",
    verifier: "Verify",
    verifierRemote: "Darna Verified (photos/video)",
    verifierOnSite: "Wakil Certified (on-site)",
    retirerVerification: "Remove",
    verifiePar: (nom: string) => `Verified by ${nom}`,
    annonceMiseAVerifiee: "Listing marked as verified.",
    annonceMiseANonVerifiee: "Verification badge removed.",
    proprietaireNonVerifie:
      "The owner must be KYC-verified for the listing to receive the badge.",
    limiteAbonnementAtteinte: (limite: number) =>
      `This agency account has reached its active-listings limit (${limite}). Invite it to subscribe or renew its plan (/dashboard/abonnement) before approving another listing.`,
    creditsVerificationEpuises:
      "This agency account has no verification credits left. Invite it to buy a pack (/dashboard/abonnement) before verifying another listing.",
    hostVerificationPaiementRequis:
      "This individual has not yet paid for the Wakil verification of this listing (20 TND). Invite them to pay from /dashboard/annonces before verifying it.",
    aucuneAnnonce: "No active listings at the moment.",
    annoncesDejVerifiees: "Already verified listings",
    candidaturesWakil: "Wakil applications",
    candidaturesWakilDesc:
      "Process received Wakil applications. Accepting an application automatically promotes the linked account.",
    aucuneCandidature: "No applications at the moment.",
    accepter: "Accept",
    refuser: "Refuse",
    planifierEntretien: "Interview",
    entretienLabel: "Interview date",
    entretienPlaceholder: "DD/MM/YYYY HH:MM",
    entretienPlanifie: (date: string) => `Interview scheduled for ${date}`,
    candidatureRevue: "Application updated.",
    revuePar: (nom: string) => `Reviewed by ${nom}`,
    supprimerCandidature: "Archive",
    archiverCandidatureConfirm: "Archive this application?",
    supprimerCandidatureConfirm: "Permanently delete this application?",
    candidatureSupprimee: "Application archived.",
    candidatureDefinitivementSupprimee: "Application permanently deleted.",
    wakilsSupprimees: "Archived applications",
    wakilsSupprimeeesDesc: "These applications have been archived. You can permanently delete them.",
    supprimerDefinitivement: "Delete",
    aucuneCandidatureSupprimee: "No archived applications.",
    navFactures: "Host invoices",
    facturesTitre: "Host invoices — pay at property",
    facturesSousTitre:
      "Darna commissions owed by hosts in Rail 2 (pay at property). Manual reminder and suspension.",
    facturesVide: "No invoices yet.",
    facturesTotalDu: "Total due",
    facturesTotalEncaisse: "Total collected",
    facturesEnRetard: (n: number) => (n === 1 ? "1 overdue invoice" : `${n} overdue invoices`),
    facturesColHote: "Host",
    facturesColAnnonce: "Listing",
    facturesColMontant: "Amount",
    facturesColEcheance: "Due date",
    facturesColStatut: "Status",
    facturesStatutEnAttente: "Pending",
    facturesStatutPayee: "Paid",
    facturesStatutEnRetard: "Overdue",
    facturesRelancer: "Send reminder",
    facturesRelanceLe: (date: string) => `Reminded on ${date}`,
    facturesSuspendre: "Suspend account",
    facturesSuspendreConfirm:
      "Suspend this host's account for unpaid invoice? They won't be able to publish or receive bookings until reactivated.",
    navRemboursements: "Refunds",
    remboursementsTitre: "Refunds due (Darna fees)",
    remboursementsSousTitre:
      "Konnect has no automatic refund: each row awaits a manual settlement — in Darna credits (instant, preferred) or by bank transfer.",
    remboursementsTotalDu: "Total due",
    remboursementsVide: "No refunds pending.",
    remboursementsColVoyageur: "Guest",
    remboursementsColAnnonce: "Listing",
    remboursementsColMontant: "Amount",
    remboursementsColAnnule: "Cancelled on",
    remboursementsCrediter: "Credit the account",
    remboursementsCrediterConfirm:
      "Credit this amount to the guest's account? Instant and irreversible action.",
    remboursementsMarquerVirement: "Mark settled (transfer)",
    remboursementsMarquerVirementConfirm:
      "Confirm that the manual transfer for this amount has been made?",
    navNonConformite: "Stay reports",
    nonConformiteTitre: "Non-conformity reports",
    nonConformiteSousTitre:
      "Cases opened by guests on arrival. Validating refunds 100% of the Darna fees collected on the booking (never the rent) and joins the refunds queue.",
    nonConformiteVide: "No reports pending.",
    nonConformiteColSignaleLe: "Reported on",
    nonConformiteColMontantMax: "Max exposure",
    nonConformiteValider: "Validate — refund the fees",
    nonConformiteValiderConfirm:
      "Validate this report? The Darna fees collected on this booking will be fully refunded to the guest.",
    nonConformiteRejeter: "Reject",
    nonConformiteRejeterConfirm: "Reject this report? No refund will be triggered.",
    navFinancement: "Financing leads",
    financementTitre: "Financing leads (business referral)",
    financementSousTitre:
      "Financing simulation requests left on for-sale listings. Capture only — no signed banking partner yet (MONETISATION_IMMO_ROADMAP.md §MI5).",
    financementVide: "No financing leads yet.",
    financementExporter: "Export as CSV",
    financementColDate: "Date",
    financementColAnnonce: "Listing",
    financementColContact: "Contact",
    financementColMontant: "Desired amount",
    financementColMessage: "Message",
  },
  analytics: {
    titre: "Dashboard",
    sousTitre:
      "Track platform adoption: acquisition, activation, bookings and retention. Computed live.",
    genereLe: (date: string) => `Updated ${date}`,
    pourcent: (v: number) => `${Math.round(v * 100)}%`,
    rolesLabel: {
      VOYAGEUR: "Travelers",
      HOTE: "Hosts",
      AGENCE: "Agencies",
      ADMIN: "Admins",
    } as Record<string, string>,

    periodeLabel: "Period",
    periodes: { "7": "7d", "30": "30d", "90": "90d", all: "All" } as Record<
      string,
      string
    >,
    periodeNom: (p: number | null) =>
      p === null ? "all time" : `the last ${p} days`,
    surPeriode: (label: string) => `Over ${label}`,

    sectionVerticales: "By vertical — Stay vs Real estate",
    verticalesDesc:
      "Two models that should not be mixed: stays collect the service fee online, real estate is lead generation (no online payment).",
    verticalLabel: { STAY: "Stay", IMMO: "Real estate" } as Record<string, string>,
    vStayBadge: "Transactional",
    vImmoBadge: "Lead generation",
    vActives: "Active listings",
    vVerifiees: "Verified active",
    vTaux: "Verif. rate",
    vReservations: "Paid bookings",
    vGmv: "GMV",
    vLeads: "Leads received",

    sectionNorthStar: "Overview",
    annoncesVerifieesActives: "Verified active listings",
    annoncesVerifieesActivesDesc: "Product north-star",
    annoncesActives: "Active listings",
    tauxVerification: "Verification rate",
    gmv: "Booked volume (GMV)",
    gmvDesc: "Paid bookings, demo included",
    gmvReelle: "of which real (excl. demo)",
    reservationsConfirmees: "Confirmed bookings",
    utilisateursTotal: "Accounts created",

    sectionAcquisition: "Acquisition & activation",
    inscriptions7j: "Signups (7d)",
    inscriptions30j: "Signups (30d)",
    inscriptionsParJour: (n: number) => `Signups / day — last ${n} days`,
    repartitionRoles: "Breakdown by role",
    repartitionPays: "Breakdown by country",
    repartitionPaysDesc: "Accounts by declared country — diaspora tracking.",
    paysNonRenseigne: "Not provided",
    tauxEmailVerifie: "Verified emails",
    tauxKyc: "Verified identity (listers)",
    annonceursActifs: "Listers with a listing",
    annonceursActifsDesc: "Share of hosts/agencies who published",

    sectionDecouverte: "Discovery funnel",
    decouverteDesc:
      "Upstream of the booking: search → listing view → booking start. Sourced from product events (SEARCH_PERFORMED, LISTING_VIEWED, BOOKING_STARTED).",
    funnelRecherches: "Searches",
    funnelVues: "Listing views",
    funnelDebuts: "Booking starts",

    sectionFunnel: "Booking funnel",
    funnelDesc:
      "From created booking to confirmed payment. Steps reflect the bookings table.",
    funnelCreees: "Created",
    funnelInitiees: "Payment started",
    funnelConfirmees: "Confirmed",
    funnelAnnulees: "Cancelled",
    funnelExpirees: "Expired (15 min)",
    funnelEnAttente: "Pending",
    tauxConversion: "Conversion rate",
    tauxAbandon: "Abandon rate",

    sectionAdoption: "Feature adoption",
    adoptionDesc: "Real usage of already-shipped features, over the selected period.",
    adoptionSimulateur: "Revenue simulator used",
    adoptionPartages: "Listing shares",
    adoptionCarte: "Map interactions",
    adoptionAlertesCreees: "Alerts created",
    adoptionAlertesDeclenchees: "Alerts triggered",

    sectionRetention: "Retention & churn",
    retentionDesc:
      "When travelers stop booking. Segmented on last booking date.",
    voyageursAyantReserve: "Travelers who booked",
    actifs30j: "Active (≤ 30d)",
    aRisque: "At risk (30–90d)",
    perdus: "Lost (> 90d)",
    cohortes: "Activation cohorts",
    cohortesDesc:
      "By signup month: share of accounts that booked at least once.",
    moisInscription: "Month",
    inscrits: "Signups",
    actives: "Activated",
    tauxActivation: "Activation",

    sectionWakil: "Wakil network",
    candidaturesParStatut: "Applications by status",
    verificationsSurPlace: "On-site verifications",
    topWakils: "Top Wakils (verifications)",

    sectionEvenements: "Recent activity",
    evenementsDesc: "Latest audit trail events.",
    evenement: "Event",
    utilisateur: "User",
    quand: "When",
    systeme: "System",
    echec: "failure",
    aucuneDonnee: "No data yet.",
  },
  email: {
    titre: "Email verification",
    sousTitre:
      "Confirm your email address to secure your account and receive important notifications.",
    description: "Click below to receive a verification code by email.",
    envoyerCode: "Receive code",
    codeEnvoye: "A verification code has been sent to your email.",
    modeDemoCode: "Demo mode — code:",
    saisirCode: "Enter the code you received",
    valider: "Validate",
    otpInvalide: "Incorrect code. Please try again.",
    verifieBravo: "Your email address is verified.",
    dejaVerifie: "Your email address is already verified.",
    badgeVerifie: "Email verified",
    mailSujet: "Darna — verify your email address",
    mailCorpsHtml: (code: string) =>
      `<p>Your Darna verification code: <strong>${code}</strong></p>` +
      `<p>This code expires in 10 minutes.</p>`,
    bookingConfirmSujet: (titre: string) =>
      `Darna — booking confirmed: ${titre}`,
    bookingConfirmHtml: (p: {
      guestName: string;
      propertyTitle: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      nights: number;
      total: string;
      amountPaid: string;
      balanceDue: string;
      url: string;
      demo: boolean;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Booking confirmed ✅</h1>` +
      `<p>Hello ${p.guestName},</p>` +
      `<p>Your booking for <strong>${p.propertyTitle}</strong> is confirmed. You've paid the Darna booking fee — refunded if the property isn't accurate to the listing. The rent is settled in cash with the host, on arrival.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-in</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-out</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Nights</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.nights}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Guests</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.guests}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Booking fee paid</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.amountPaid}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Balance due in cash on arrival</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.balanceDue}</td></tr>` +
      `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">Total stay price</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0f766e">${p.total}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">View my booking</a></p>` +
      (p.demo
        ? `<p style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px;font-size:13px;color:#92400e">Demo mode: no real payment was made.</p>`
        : "") +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    newBookingHostSujet: (titre: string) =>
      `Darna — new booking received: ${titre}`,
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
      `<h1 style="color:#0f766e;font-size:20px">New booking 🎉</h1>` +
      `<p>Hello ${p.hostName},</p>` +
      `<p><strong>${p.guestName}</strong> just booked <strong>${p.propertyTitle}</strong>. The Darna booking fee has been paid online — you'll collect the full rent in cash, on arrival.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-in</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-out</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Guests</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.guests}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">View booking</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    bookingCancelledByHostSujet: (titre: string) =>
      `Darna — your stay was cancelled: ${titre}`,
    bookingCancelledByHostHtml: (p: {
      guestName: string;
      propertyTitle: string;
      refund: string | null;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#b91c1c;font-size:20px">Your stay was cancelled</h1>` +
      `<p>Hi ${p.guestName},</p>` +
      `<p>We're sorry: the host cancelled your booking for <strong>${p.propertyTitle}</strong>. This is not your fault, and the host's account has been suspended.</p>` +
      (p.refund
        ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
          `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">Amount refunded</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0f766e">${p.refund}</td></tr>` +
          `</table>`
        : `<p>Nothing had been paid online, so there is nothing to recover.</p>`) +
      `<p>We've lined up replacement stays available on your dates, with a discount on your next booking:</p>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">See replacement stays</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    hostInvoiceReminderSujet: (titre: string) =>
      `Darna — reminder: commission invoice pending (${titre})`,
    hostInvoiceReminderHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f4c7c;font-size:20px">Commission invoice pending</h1>` +
      `<p>Hello ${p.hostName},</p>` +
      `<p>The Darna commission for your booking "<strong>${p.propertyTitle}</strong>" (pay-at-property) is still awaiting payment.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Amount due</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0f4c7c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Due before</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f4c7c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Pay the invoice</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    hostInvoiceDueSoonSujet: (titre: string) =>
      `Darna — commission invoice due soon (${titre})`,
    hostInvoiceDueSoonHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f4c7c;font-size:20px">Commission invoice due soon</h1>` +
      `<p>Hello ${p.hostName},</p>` +
      `<p>The Darna commission for your booking "<strong>${p.propertyTitle}</strong>" (pay-at-property) is due in a few days.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Amount due</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#0f4c7c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Due before</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f4c7c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Pay the invoice</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    hostInvoiceOverdueSujet: (titre: string) =>
      `Darna — commission invoice overdue (${titre})`,
    hostInvoiceOverdueHtml: (p: { hostName: string; propertyTitle: string; amount: string; dueDate: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#b91c1c;font-size:20px">Commission invoice overdue</h1>` +
      `<p>Hello ${p.hostName},</p>` +
      `<p>The Darna commission for your booking "<strong>${p.propertyTitle}</strong>" (pay-at-property) is past its due date. Please settle it as soon as possible.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Amount due</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#b91c1c">${p.amount}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Was due on</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.dueDate}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#b91c1c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Pay the invoice</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
    bookingAbandonReminderSujet: (titre: string) =>
      `Darna — your booking for ${titre} is waiting for you`,
    bookingAbandonReminderHtml: (p: { guestName: string; propertyTitle: string; url: string }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f4c7c;font-size:20px">Your booking is waiting for you</h1>` +
      `<p>Hi ${p.guestName},</p>` +
      `<p>You didn't finish booking “<strong>${p.propertyTitle}</strong>”. It's still available if you'd like to pick up where you left off.</p>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f4c7c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Resume my booking</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified housing.</p>` +
      `</div>`,
    newMessageSujet: (titre: string) => `Darna — new message · ${titre}`,
    newMessageHtml: (p: {
      recipientName: string;
      senderName: string;
      propertyTitle: string;
      preview: string;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">New message 💬</h1>` +
      `<p>Hello ${p.recipientName},</p>` +
      `<p><strong>${p.senderName}</strong> sent you a message about <strong>${p.propertyTitle}</strong>:</p>` +
      `<blockquote style="margin:16px 0;padding:12px 16px;background:#f3f4f6;border-inline-start:3px solid #0f766e;border-radius:8px;color:#374151">${p.preview}</blockquote>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Reply on Darna</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">For your safety, always reply through Darna messaging. Darna — Verified stays.</p>` +
      `</div>`,
    savedSearchMatchSujet: (ville: string) =>
      `Darna — new listing in ${ville} matching your alert`,
    savedSearchMatchHtml: (p: {
      recipientName: string;
      propertyTitle: string;
      city: string;
      price: string;
      url: string;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">New listing available 🔔</h1>` +
      `<p>Hello ${p.recipientName},</p>` +
      `<p>A new listing in <strong>${p.city}</strong> matches your saved alert:</p>` +
      `<p style="padding:12px 16px;background:#f3f4f6;border-inline-start:3px solid #0f766e;border-radius:8px"><strong>${p.propertyTitle}</strong><br/>${p.price}</p>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">View listing</a></p>` +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — Verified stays.</p>` +
      `</div>`,
  },
  verifications: {
    navLabel: "Verification",
    bienvenue: "Welcome to Darna 👋",
    titre: "Let's verify your account",
    sousTitre: "Two quick steps to join Darna's circle of trust.",
    pourquoiTitre: "Why verify?",
    pourquoi1:
      "Trust is our product: verified hosts and guests mean more peace of mind for everyone.",
    pourquoi2:
      "A confirmed email secures your account and your booking notifications.",
    pourquoi3:
      "A verified identity unlocks listing publication and reassures the people who book with you.",
    etape: (n: number, total: number) => `Step ${n} / ${total}`,
    etapeEmail: "Verify your email",
    etapeTelephone: "Verify your phone",
    etapeCin: "Verify your ID (CIN)",
    etapeIdentite: "Verify your identity",
    suivant: "Next step",
    precedent: "Back",
    passer: "Skip for now",
    terminerPlusTard: "You can finish later from the “Verification” tab.",
    tousVerifies: "Your account is fully verified 🎉",
    tousVerifiesSous: "Thank you! You now enjoy the full Darna trust experience.",
    badgeFait: "Done",
    badgeAFaire: "To do",
  },
  profil: {
    titre: "My details",
    sousTitre:
      "Manage your personal information, profile photo and password.",
    photoTitre: "Profile photo",
    photoAide: "JPEG, PNG or WebP — 5 MB max. A square photo works best.",
    changerPhoto: "Change photo",
    ajouterPhoto: "Add a photo",
    supprimerPhoto: "Remove",
    photoEnregistree: "Profile photo updated.",
    photoSupprimee: "Profile photo removed.",
    photoErreur:
      "File rejected: accepted formats JPEG/PNG/WebP, maximum size 5 MB.",
    infosTitre: "Personal information",
    nom: "Full name",
    email: "Email address",
    emailAide: "Your email is your login identifier and cannot be changed here.",
    telephone: "Mobile phone",
    telephonePlaceholder: "+216 …",
    role: "Account type",
    roleVoyageur: "Traveller",
    roleHote: "Host",
    roleAgence: "Agency",
    roleAdmin: "Administrator",
    enregistrer: "Save changes",
    infosEnregistrees: "Your details have been updated.",
    mdpTitre: "Password",
    mdpSousTitre: "Choose a password of at least 8 characters, including a digit.",
    mdpActuel: "Current password",
    mdpNouveau: "New password",
    mdpConfirmation: "Confirm new password",
    mdpChanger: "Change password",
    mdpEnregistre: "Password updated.",
    mdpRegles: "The password must be at least 8 characters and include a digit.",
    mdpActuelInvalide: "Current password is incorrect.",
    mdpConfirmationInvalide: "The two passwords do not match.",
    mdpIdentique: "The new password must differ from the current one.",
  },
  yieldAdvisor: {
    titre: "Yield Advisor",
    sousTitre:
      "For each property, Darna compares the seasonal potential with long-term rental income, based on the platform's real prices.",
    saisonnier: "Seasonal (monthly estimate)",
    saisonnierDetail: (nuit: number) =>
      `Average nightly rate in the city: ${nuit} TND × 30 nights × 60% summer occupancy`,
    longueDuree: "Long-term (monthly rent)",
    longueDureeDetail: (loyer: number) =>
      `Average rent observed in the governorate: ${loyer} TND / month`,
    recoSaisonnier:
      "Recommendation: seasonal rental looks significantly more profitable for this property. Remember the availability calendar.",
    recoLongueDuree:
      "Recommendation: long-term rental offers more stable and probably higher income for this property.",
    recoEquivalent:
      "Recommendation: both options are equivalent. Long-term offers stability, seasonal offers flexibility.",
    donneesInsuffisantes:
      "Market data still insufficient for this area — indicative estimate.",
    aucunBien: "Add a listing to get a yield analysis.",
  },
  booking: {
    titre: "Booking request",
    recapitulatif: "Summary — 100% transparent",
    nuits: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
    fraisService: "Darna service fee",
    fraisServiceAide:
      "It funds listing verification and payment protection.",
    total: "Total to pay",
    reductionRelogement: "Darna discount",
    utiliserCredits: (solde: number) => `Use my ${solde} TND credit`,
    creditApplique: "Credit used",
    aucunFraisCache: "No other fee will ever be asked of you. Ever.",
    continuerPaiement: "Continue to payment",
    holdLabel: "Spot held — pay within",
    holdExpireTitre: "Payment window expired",
    holdExpireDetail:
      "Your booking wasn't confirmed in time: the dates have been released.",
    holdExpireCta: "Start a new booking",
    datesInvalides: "Invalid dates — check-out must come after check-in.",
    datesIndisponibles:
      "These dates are no longer available. Please choose different ones.",
    hoteFactureImpayee:
      "This listing is temporarily unavailable for booking (host invoice overdue).",
    proprietaireImpossible: "You can't book your own listing.",
    proprietaireImpossibleAide:
      "This is your listing. To test it as a traveller, sign in with another account.",
    capaciteDepassee: (max: number) =>
      `This accommodation hosts a maximum of ${max} guests.`,
    connexionRequise: "Sign in to book.",
    verifRequise: "Verify your account (email + phone) before booking.",
    compteSuspendu: "Your account is suspended. You can't book right now.",
    verifRequiseTitre: "Verify your account to book",
    verifRequiseDesc:
      "For everyone's trust on Darna, only verified accounts (email + phone) can book. It takes less than two minutes.",
    verifRequiseCta: "Verify my account",
    paiementTitre: "Booking fee payment",
    paiementFraisExplication:
      "You only pay the Darna booking fee online — refunded if the property doesn't match the listing. The rent is settled in full, in cash, with the host on arrival.",
    paiementMockInfo:
      "Konnect / Flouci payment coming soon. Demo mode: no real charge.",
    payerSimulation: "Pay (simulation)",
    paiementKonnectInfo:
      "Secure payment via Konnect — bank card, e-DINAR, Flouci or wallet. Only the booking fee is charged.",
    payerKonnect: "Pay with Konnect",
    redirectionKonnect: "Redirecting to secure payment…",
    paiementEchoue:
      "The payment did not go through. No amount was charged — you can try again.",
    paiementEnVerification: "Payment received, confirmation being verified.",
    actualiser: "Refresh",
    paiementKonnectErreur:
      "The payment service is momentarily unavailable. Please try again shortly.",
    reservationExpiree: "This booking has expired. Please start a new request.",
    paiementConfirme: "Booking confirmed!",
    paiementConfirmeDetail:
      "Your booking fee is paid. The rent is settled in cash on arrival — the host has been notified. Find the details in “My bookings”.",
    voirMesReservations: "View my bookings",
    sejourDates: (arrivee: string, depart: string) =>
      `From ${arrivee} to ${depart}`,
    choisirDates: "Choose your dates",
    selectionne: "Selected",
    cliquezArrivee: "Click your check-in date",
    cliquezDepart: "Choose your check-out date",
    effacer: "Clear",
    moisPrecedent: "Previous months",
    moisSuivant: "Next months",
    placeholderPrix:
      "Pick your dates on the calendar to see the total price — with no hidden fees.",
    selectionnezDates: "Select your dates",
    annulationImpossible: "This booking can no longer be cancelled.",
    annulationConfirmee: "Your booking has been cancelled.",
    annulationHoteConfirmee:
      "Booking cancelled. The guest has been fully refunded and your listing will be temporarily hidden.",
    // ── Deposit gating (anti-bypass): choosing how much to pay now ─────────
    totalSejour: "Stay total",
    payerMaintenant: "You pay now",
    montantAPayer: "Booking fee due now",
    montantAPayerAide:
      "The only amount paid online: Darna's service fee, included in the total. The rent is paid in full, in cash, to the host on arrival.",
    soldeArrivee: "Balance to pay in cash on arrival",
    soldeArriveeAide:
      "You pay the remainder directly to the host, in cash, on the day you arrive.",
    contactRevelationInfo:
      "The host's contact details are shared with you once the free-cancellation window has passed — your booking is then firm.",
    remboursementFraisPolitique:
      "The fee refund follows the listing's cancellation policy (shown on the listing page): full if you cancel early enough, reduced or none past the free window.",
    annulationGratuiteJusqu: (date: string) =>
      `Free cancellation until ${date}`,
    annulationRembJusqu: (pct: number, date: string) =>
      `${pct}% refunded until ${date}`,
    annulationNonRembApres: (date: string) => `No refund after ${date}`,
    verifieWakil: "Verified by Wakil",
    verifieWakilAide:
      "Property checked on site by a trusted Wakil agent.",
    montantInvalide:
      "Invalid amount — pay between the minimum deposit and the stay total.",
    // ── Contacts revealed AFTER confirmation (deposit paid) ────────────────
    contactHoteTitre: "Your host's contact details",
    contactHoteAide:
      "Booking confirmed: contact your host directly to organise your arrival.",
    contactVoyageurTitre: "Guest's contact details",
    contactVoyageurAide:
      "Contact your guest to prepare their arrival and the cash balance.",
    contactNom: "Name",
    contactEmail: "Email",
    contactTelephone: "Phone",
    contactVerrouilleTitre: "Host contact details hidden",
    contactVerrouilleAide:
      "For everyone's safety, the host's contact details are shared once your deposit is paid and the booking is confirmed.",
    // ── Contact locked until the free-cancellation window closes ───────────
    contactLockedTitreHote: "Host contact details available soon",
    contactLockedTitreVoyageur: "Guest contact details available soon",
    contactDebloqueLe: (date: string) => `Unlocked on ${date}`,
    contactLockedAide:
      "For everyone's safety, direct contact details are exchanged once the free-cancellation window has passed — your booking is then firm.",
    // ── Rail 2: pay at property (PAIEMENT_SUR_PLACE_ROADMAP.md §PSP3) ──
    cashNonDisponible: "This property doesn't accept pay-at-property bookings.",
    cashKycRequis:
      "Pay-at-property requires a verified identity (ID card). Complete your verification before continuing.",
    modePaiementTitre: "How would you like to pay?",
    modeEscrowLabel: "Pay online",
    modeEscrowAide: "Booking fee paid online, rent settled in cash on arrival.",
    modeCashLabel: "Pay at property (cash)",
    modeCashAide:
      "0 TND online — everything is settled in cash with the host. Your request must first be accepted by the host.",
    cashRecapInfo: (montant: number) =>
      `0 TND online. ${montant} TND due in cash to the host on arrival. Your booking is confirmed only once the host accepts.`,
    continuerDemandeCash: "Send the request",
    demandeIndisponible: "This request is no longer available.",
    demandeExpiree: "This request has expired — the host didn't respond in time.",
    demandeAcceptee: "Booking confirmed!",
    demandeRefusee: "Request declined.",
    cashEnAttenteTitre: "Request sent — awaiting the host",
    cashEnAttenteDetail:
      "The host must accept your request before the booking is confirmed. You'll be notified of their decision.",
    cashEnAttenteExpire: (date: string) => `Without a reply by ${date}, the request will expire automatically.`,
    noShowIndisponible: "This action isn't available for this booking.",
    noShowSignale: "No-show reported.",
    signalementIndisponible: "This report is only available within 24h of your arrival.",
    signalementDejaEnvoye: "A report has already been filed for this booking.",
    signalementEnvoye: "Report sent — our team is reviewing it.",
    noShowIndemnitePlafondAtteint:
      "You've reached the maximum number of no-show compensations for this month.",
    noShowIndemniteVersee: (montant: number) =>
      montant > 0
        ? `No-show reported — ${montant} TND credited to your Darna account.`
        : "No-show reported.",
    cashConfirmeeDetail:
      "The host has accepted your request. Pay the full amount in cash on arrival — the host has been notified.",
  },
  messages: {
    titre: "Messages",
    lien: "Messages",
    hubTitre: "Messages",
    hubSousTitre: "All your conversations with hosts and guests.",
    hubVide: "No conversations yet. Your exchanges with hosts and guests will appear here.",
    notifTitre: "New message",
    notifCorps: (n: number) =>
      n > 1 ? `You have ${n} unread messages.` : "You've received a new message.",
    notifVoir: "Open messages",
    banniere:
      "For your safety, phone numbers and emails are hidden. You'll exchange direct contact details once the booking is firm.",
    placeholder: "Write your message…",
    vide: "No messages yet. Start the conversation.",
    vous: "You",
    hote: "Host",
    voyageur: "Guest",
    masque: "contact details hidden",
    indisponible: "Messaging opens once the booking is confirmed.",
    depuisVerrouille: "Chat via Darna messaging",
    banniereLibre:
      "Your booking is firm: you can now freely exchange your contact details.",
    avertissementMasque:
      "Your contact details were hidden. Sharing a phone number or email off Darna isn't allowed until the booking is firm — you'll be connected automatically. ⚠️ Repeated attempts may lead to your account being suspended.",
    avertissementSollicitation:
      "⚠️ Asking to take contact off Darna isn't allowed until the booking is firm. Repeated attempts may lead to your account being suspended.",
    avertissementEscalade:
      "⚠️ Final warning: several attempts to share contact details off Darna have been detected on your account. Any further attempt may result in your account being suspended.",
    compteSuspendu:
      "Your account is suspended following repeated attempts to share contact details off Darna. Contact support to reactivate it.",
    compteSuspenduJusqu: (date: string) =>
      `Your account is suspended until ${date} following attempts to share contact details off Darna. Stay on Darna to protect your bookings and reviews.`,
    pourquoiTitre: "Learn more — why stay on Darna?",
    pourquoi1:
      "Refundable fees: your booking fee is refunded if the property doesn't match the listing. Off-platform, no guarantee — an open door to scams.",
    pourquoi2:
      "Verified reviews: only stays booked on Darna can be reviewed. That's what builds a host's reputation and a guest's trust. Off-platform: no proof, no reputation.",
    pourquoi3:
      "Disputes: if something goes wrong, Darna steps in and protects you. Off-platform, you're on your own.",
    pourquoi4:
      "For hosts: visibility, the “Verified” badge, future bookings — it all runs through Darna. Going around it cuts you off from your next guests.",
    pourquoiConclusion:
      "Darna, Tunisia's first trusted booking platform. Together, let's build an ecosystem where everyone is protected.",
  },
  notifications: {
    titre: "Notifications",
    aucune: "No notifications yet.",
    toutMarquerLu: "Mark all as read",
    reservationConfirmee: (titre: string) =>
      `Your booking for “${titre}” is confirmed.`,
    reservationAnnulee: (titre: string) =>
      `A booking on “${titre}” was cancelled by the guest.`,
    avisRecu: (titre: string) => `You received a new review on “${titre}”.`,
    avisHoteRecu: "Your host left a review about your stay.",
    annonceExpireBientot: (titre: string) =>
      `“${titre}” is expiring soon — consider republishing it.`,
    alerteNouvelleAnnonce: (titre: string) =>
      `A new listing matches your saved search: “${titre}”.`,
    demandeCashRecue: (titre: string) =>
      `New pay-at-property booking request on “${titre}” — action needed.`,
    reservationRefusee: (titre: string) =>
      `Your booking request for “${titre}” was declined by the host.`,
    reservationAnnuleeParHote: (titre: string) =>
      `Your stay “${titre}” was cancelled by the host — you've been fully refunded. We're sorry about this: this host's account has been suspended.`,
    annonceMasqueeAnnulation: (titre: string) =>
      `Following your cancellation, “${titre}” is temporarily hidden from search. It will reappear automatically once the block period ends.`,
    hostInvoiceRelance: (titre: string) =>
      `Reminder: the commission invoice for “${titre}” is still awaiting payment.`,
    factureBientotDue: (titre: string) =>
      `Your commission invoice for “${titre}” is due soon.`,
    factureEnRetard: (titre: string) =>
      `Your commission invoice for “${titre}” is now overdue.`,
    annonceLimiteAbonnement: (titre: string) =>
      `Your listing “${titre}” can't be published yet — you've reached your active-listings limit. See subscription options.`,
    annonceCreditsVerifEpuises: (titre: string) =>
      `Your listing “${titre}” could not be verified — you have no verification credits left. Buy a pack to continue.`,
    annonceVerifPaiementRequis: (titre: string) =>
      `Your listing “${titre}” could not be verified — pay for the Wakil verification (20 TND) so an agent can process it.`,
    reservationRecue: (titre: string) =>
      `You received a new booking for “${titre}”.`,
    annonceIncomplete: (titre: string) =>
      `Your listing "${titre}" still has boxes to check — complete it to convert better.`,
    annoncePromoSuggeree: (titre: string) =>
      `“${titre}” has empty nights coming up in the next few weeks — compare your price to the city average: a short-term promo could be enough to sell one more night.`,
    reservationAbandonnee: (titre: string) =>
      `Your booking for “${titre}” wasn't completed — it's still available if you'd like to pick up where you left off.`,
    signalementRecu: (titre: string) =>
      `A non-conformity report was filed on a booking for “${titre}”.`,
    signalementValide: (titre: string) =>
      `Your report on “${titre}” was validated — the Darna fees are being refunded to you.`,
    signalementRejete: (titre: string) => `Your report on “${titre}” was reviewed and rejected.`,
  },
  alaUne: {
    titre: "Feature your listing",
    sousTitre:
      "Boost your visibility for a month: your listing moves to the top of results and appears on the Darna homepage.",
    avantage1Titre: "Top of results",
    avantage1Desc:
      "Your listing shows above all others in stays and real-estate searches.",
    avantage2Titre: "Gold “Featured” badge",
    avantage2Desc:
      "A premium badge and a gold outline that instantly catch travellers' eyes.",
    avantage3Titre: "Homepage showcase",
    avantage3Desc:
      "Appear in the “Featured” carousel on the homepage, seen by every visitor.",
    recapTitre: "Summary — 100% transparent",
    annonce: "Listing",
    duree: "Featuring duration",
    dureeValeur: (j: number) => (j === 1 ? "1 day" : `${j} days`),
    prix: "Featuring (1 month)",
    total: "Total to pay",
    mockInfo:
      "Konnect / Flouci payment coming soon. Demo mode: no real charge.",
    payer: "Pay and feature (simulation)",
    payerKonnect: "Pay and feature",
    redirectionKonnect: "Redirecting to payment…",
    paiementEnVerification: "Payment being verified…",
    actualiser: "Refresh",
    paiementEchoue: "Payment failed. Please try again.",
    paiementErreur: "Error initializing the payment.",
    prolongerInfo: (date: string) =>
      `This listing is already featured until ${date}. A new purchase extends the boost by one month.`,
    retour: "Back to my listings",
    indisponible:
      "This listing can't be featured: it must be active and online.",
    garantie:
      "You stay in control: at the end of the month your listing simply returns to its normal display. No auto-renewal.",
    boostOffertTitre: "Free boost with your Pro plan",
    boostOffertDesc:
      "Your plan includes 1 free featured boost per month, non-cumulative. Use it on this listing at no cost.",
    boostOffertBouton: "Use my free boost",
    boostOffertDejaUtilise:
      "Free boost already used for this billing cycle — available again at your next renewal.",
    superHoteBoostTitre: "Free boost — Superhost badge",
    superHoteBoostDesc:
      "Zero cancellations and excellent reviews over the last 3 months: you've earned a free featured boost. Use it on this listing at no cost.",
    superHoteBoostBouton: "Claim my Superhost boost",
    superHoteBoostDejaUtilise:
      "Superhost boost already claimed recently — available again in a few months if your badge stays active.",
  },
  promo: {
    titre: "Create a promo on your listing",
    sousTitre:
      "Temporarily lower your price to attract more bookings — you stay in full control: price, duration, remove anytime.",
    annonce: "Listing",
    prixActuel: (prix: string) => `Current price: ${prix}`,
    formPrixLabel: "Promo price (TND / night)",
    formPrixAide: "Must be lower than the current price — this is what travellers will pay.",
    formDateLabel: "Promo valid until",
    activer: "Activate the promo",
    retirer: "Remove the promo",
    retirerConfirmer: "Remove this promo?",
    retirerOui: "Remove",
    retirerAnnuler: "Cancel",
    actifTitre: "Promo active",
    actifDesc: (prixPromo: string, date: string) =>
      `${prixPromo} / night instead of the normal price, until ${date}.`,
    indisponible: "This promo is only available for a verified, active listing.",
    retour: "Back to my listings",
    garantie:
      "No commitment: you can remove the promo at any time. Your revenue per night stays guaranteed — only Darna's commission varies.",
  },
  abonnement: {
    titre: "Agency subscription",
    sousTitre:
      "Lift the active-listings limit and give your properties the visibility they deserve.",
    planLabel: (label: string) => `${label} plan`,
    annoncesIncluses: (n: number) => `${n} active listings included`,
    prixMensuel: "Monthly price",
    statutActif: (date: string) => `Active until ${date}`,
    statutInactif: "No active subscription",
    quotaActuel: (utilisees: number, limite: number) =>
      utilisees === 1
        ? `1 active listing out of a limit of ${limite}`
        : `${utilisees} active listings out of a limit of ${limite}`,
    quotaGratuitInfo: (limite: number) =>
      `Free tier: up to ${limite} active listings. Subscribe to lift this limit.`,
    quotaAtteintAlerte:
      "You've reached your active-listings limit — a new listing can't be approved until a slot frees up or you subscribe/renew.",
    annoncesEnAttenteBloquees: (n: number) =>
      n === 1
        ? "1 listing is awaiting approval and will be published as soon as you have room or subscribe."
        : `${n} listings are awaiting approval and will be published as soon as you have room or subscribe.`,
    coutParAnnonce: (prixTND: number) =>
      `That's about ${prixTND} TND per active listing included.`,
    palierActuelBadge: "Current plan",
    modalTitre: "This listing will wait its turn",
    modalTexte: (utilisees: number, limite: number) =>
      `Your listing was created and will be reviewed as usual. But you already have ${utilisees} active listing(s) out of ${limite} included: it won't be published until a slot frees up or you subscribe to the Agency plan.`,
    modalRecommandation: (label: string, listingsIncluded: number, prixTND: number) =>
      `The ${label} plan (${listingsIncluded} listings included, ${prixTND} TND/month) would let you publish it right away.`,
    modalCta: "See subscription options",
    modalPlusTard: "Later",
    souscrire: "Subscribe",
    renouveler: "Renew for a month",
    payer: "Subscribe (simulation)",
    payerKonnect: "Subscribe",
    redirectionKonnect: "Redirecting to payment…",
    mockInfo: "Konnect payment coming soon. Demo mode: no real charge.",
    paiementEnVerification: "Payment being verified…",
    actualiser: "Refresh",
    paiementEchoue: "Payment failed. Please try again.",
    paiementErreur: "Error initializing the payment.",
    prolongerInfo: (date: string) =>
      `Your subscription is already active until ${date}. A new payment extends the period by one month.`,
    garantie:
      "No auto-renewal: Konnect never charges you on its own, you choose when to renew.",
    reserveAgence: "This page is reserved for agency accounts.",
    creditsVerifTitre: "Wakil verification credits",
    creditsVerifSousTitre: (n: number) =>
      n === 1
        ? "Each Wakil verification uses one credit. The first one is free, for life."
        : `Each Wakil verification uses one credit. The first ${n} are free, for life.`,
    creditsVerifSolde: (n: number) =>
      n === 1 ? "1 verification credit left" : `${n} verification credits left`,
    creditsVerifEpuiseAlerte:
      "You have no verification credits left — your pending listings won't be verified until you buy a pack.",
    creditsVerifPackLabel: (n: number) => `${n} verifications`,
    creditsVerifAcheter: "Buy",
    creditsVerifAcheterSimulation: "Buy (simulation)",
  },
  contact: {
    titre: "Contact the advertiser",
    nom: "Your name",
    email: "Your e-mail",
    telephone: "Your phone",
    message: "Your message",
    messageDefaut: (titre: string) =>
      `Hello, I'm interested in “${titre}”. Could we arrange a viewing?`,
    envoye: "Your request has been sent to the advertiser.",
    envoyer: "Send request",
    ouWhatsapp: "or directly on",
  },
  financement: {
    titre: "Request a financing simulation",
    sousTitre:
      "Leave your details: a banking partner may contact you to review your application.",
    montantSouhaite: "Desired amount (TND)",
    disclaimer:
      "Darna does not calculate any monthly payment or rate — this request only shares your details for a personalized review.",
    envoyer: "Send request",
    envoye: "Your financing request has been recorded.",
  },
  bail: {
    titre: "Residential lease agreement",
    sousTitre:
      "Document pre-filled by Darna — to be completed and signed by the parties.",
    entre: "Between the undersigned:",
    bailleur: "The landlord",
    locataire: "The tenant",
    bienDesigne: "Designation of the property",
    adresse: "Address",
    surface: "Area",
    pieces: "Rooms",
    article1: "Article 1 — Purpose",
    article1Texte:
      "The landlord rents to the tenant, who accepts, the property designated above for residential use only.",
    article2: "Article 2 — Duration",
    article2Texte:
      "This lease is concluded for a period of one year, renewable by tacit agreement, from the date of signature.",
    article3: "Article 3 — Rent",
    article3Texte: (loyer: string) =>
      `The monthly rent is set at ${loyer}, payable in advance on the first of each month.`,
    article4: "Article 4 — Security deposit",
    article4Texte: (caution: string) =>
      `Upon signature, the tenant pays a security deposit of ${caution}, returned at the end of the lease minus any amounts due.`,
    article5: "Article 5 — Obligations",
    article5Texte:
      "The tenant undertakes to use the property peacefully, to maintain it and to take out home insurance. The landlord guarantees peaceful enjoyment of the property.",
    faitA: "Done at",
    le: "on",
    signatureBailleur: "Landlord's signature",
    signatureLocataire: "Tenant's signature",
    mentionLegale:
      "Indicative template provided by Darna — does not constitute legal advice. Check compliance with current Tunisian legislation.",
    loyerMensuel: "Monthly rent",
  },
  prixMarche: {
    titre: "Darna real estate price index",
    sousTitre:
      "Aggregates computed live from the platform's active listings. Indicative data, continuously updated.",
    venteTitre: "Sales — average price per m² by governorate",
    locationTitre: "Rentals — average rent per m² by governorate",
    sejourTitre: "Stays — average nightly rate by city",
    gouvernorat: "Governorate",
    ville: "City",
    prixM2: "Price / m²",
    loyerM2: "Rent / m²",
    nuitee: "Average night",
    annonces: (n: number) => (n === 1 ? "1 listing" : `${n} listings`),
    aucuneDonnee: "Not enough data for this category yet.",
    methodologie: "Methodology",
    methodologieTexte:
      "Simple averages computed on Darna's active, non-expired listings. Listings without a specified area are excluded from per-m² calculations. The index grows richer as the platform grows.",
  },
  simulateur: {
    titre: "How much could you earn on Darna?",
    sousTitre:
      "An estimate based on real prices already observed on the platform — not a made-up number. Three fields, one indicative range.",
    ville: "City",
    villePlaceholder: "E.g. Hammamet, Sousse, Djerba…",
    type: "Property type",
    voyageurs: "Number of guests",
    voyageursAide:
      "Only used to pre-fill your future listing — does not affect the estimate.",
    surface: "Area (m²)",
    surfaceRequisePourEstimation: "Enter the area to estimate the rent or sale price.",
    cta: "Estimate my income",
    resultatNuiteeTitre: "Estimated rental income (short-term stays)",
    resultatNuiteeDetail: (ville: string, nuit: number) =>
      `Based on the average nightly rate in ${ville} (${nuit} TND) × 30 nights × an occupancy rate of 35% to 60%.`,
    resultatLocationTitre: "Estimated monthly rent",
    resultatLocationDetail: (gouvernorat: string, prixM2: number) =>
      `Based on the average rent per m² in ${gouvernorat} governorate (${prixM2} TND/m²).`,
    resultatVenteTitre: "Estimated sale price",
    resultatVenteDetail: (gouvernorat: string, prixM2: number) =>
      `Based on the average price per m² in ${gouvernorat} governorate (${prixM2} TND/m²).`,
    parMois: "/ month",
    echantillon: (n: number) => (n === 1 ? "based on 1 listing" : `based on ${n} listings`),
    aucuneDonnee: "Not enough real data for this area yet.",
    villesProches: "Try a nearby city:",
    ctaPublier: "Publish my listing",
    ctaPublierAide: "City and type already pre-filled on the next step.",
    methodologie: "Where does this number come from?",
    methodologieTexte:
      "Averages computed on Darna's active, non-expired listings — the same aggregates as the Darna price index. No inflated guesses: when data is still too scarce for an area, we tell you instead of making up a number.",
    voirIndice: "See the full price index",
  },
  diaspora: {
    titre: "Darna — Tunisians abroad",
    sousTitre:
      "For Tunisians abroad: search, compare and secure your home in the country, without unpleasant surprises.",
    arg1Titre: "Book from abroad",
    arg1Desc:
      "Listings verified on the ground by our Wakils: what you see from Paris or Montreal really exists in Hammamet.",
    arg2Titre: "Pay safely",
    arg2Desc:
      "You only pay the booking fee online, refunded if the property doesn't match the listing — never a deposit for the rent, settled on the spot. Full online payment is coming with V2. International card payment coming soon.",
    arg3Titre: "Video visits (soon)",
    arg3Desc:
      "A Wakil visits the property with you by video call, before any commitment.",
    toggleTitre: "Display prices in your currency",
    toggleDesc: (taux: string) =>
      `Switch the whole site to euros in one click — indicative rate: €1 = ${taux} TND.`,
    afficherEnEuros: "Show prices in €",
    afficherEnTnd: "Show prices in TND",
    ctaTitre: "Your next summer starts here",
    ctaDesc: "Browse verified stays in the country's most beautiful cities.",
  },
  wakil: {
    titre: "Become a Darna Wakil",
    sousTitre:
      "The Wakil (وكيل) is our trusted agent on the ground: they visit properties, verify they exist and that the photos are faithful. They are what makes Darna reliable.",
    missionTitre: "Your mission",
    mission1: "Visit properties near you, by appointment.",
    mission2: "Check photo accuracy against reality and geolocate the property.",
    mission3: "Award the “Darna Verified” badge that protects the whole community.",
    avantagesTitre: "Your benefits",
    avantage1: "Payment per verified visit",
    avantage2: "Flexible hours, in your city",
    avantage3: "Training and dedicated app (soon)",
    formTitre: "Application",
    nom: "Full name",
    email: "E-mail",
    telephone: "Phone",
    ville: "Your city of operation",
    motivation: "Your motivation (a few lines)",
    postuler: "Send my application",
    candidatureEnvoyee:
      "Thank you! Your application has been received — our team will get back to you shortly.",
  },
  pagesLegales: {
    cguTitre: "Terms of use",
    cguHoteTitre: "Host terms — pay-at-property",
    mentionsTitre: "Legal notice",
    confidentialiteTitre: "Privacy policy",
    aRediger:
      "Document being drafted — it will be published before the platform's official launch.",
    miseAJour: "Last updated: July 2026",
    avertissement:
      "This document is provided for information purposes during Darna's demonstration phase. It must be reviewed and validated by legal counsel before the platform's public launch.",
    avertissementJuridique:
      "This text is provided for information purposes during the demonstration phase. The billing regime (legal structure, VAT) will be confirmed and this document validated by a Tunisian lawyer/accountant before host billing is ever activated for real.",
    cguHote: {
      intro:
        "These terms apply to hosts who enable pay-at-property (cash) on a stay listing. They complement Darna's general Terms of use.",
      sections: [
        {
          titre: "1. Principle",
          corps: [
            "The guest pays nothing online at booking. The stay is paid entirely in cash, directly to you, on the guest's arrival.",
          ],
        },
        {
          titre: "2. Darna commission",
          corps: [
            "A commission, at the same rate as the standard online payment mode, remains due to Darna for every booking accepted on this mode.",
            "This commission never passes through the platform: it is invoiced to you separately after you accept the booking.",
          ],
        },
        {
          titre: "3. Invoicing and payment",
          corps: [
            "An invoice is generated when you accept the booking, with a payment deadline shown on it. You pay it online, in one click, from your dashboard.",
          ],
        },
        {
          titre: "4. Non-payment",
          corps: [
            "If an invoice is not paid by its deadline, your listings are hidden from search results until it is settled. They reappear immediately after payment.",
          ],
        },
        {
          titre: "5. Accepting bookings",
          corps: [
            "You remain free to accept or decline each booking request on this mode — no booking is ever confirmed automatically without your explicit consent.",
          ],
        },
      ],
    },
    cgu: {
      intro:
        "These terms of use (the “Terms”) govern access to and use of the Darna platform, which connects travellers and advertisers for short stays and real-estate listings in Tunisia. By creating an account or using the service, you accept these Terms.",
      sections: [
        {
          titre: "1. Purpose",
          corps: [
            "Darna is a matchmaking marketplace. Darna neither owns, rents out, nor acts as agent for the listed properties: the platform provides search, booking and trust-verification tools.",
          ],
        },
        {
          titre: "2. Account and registration",
          corps: [
            "Creating an account requires a valid email address and a password. You agree to provide accurate information and to keep it up to date.",
            "Some actions require verification of your email and phone, and possibly your identity (national ID). You are responsible for keeping your credentials confidential and for any activity carried out from your account.",
          ],
        },
        {
          titre: "3. Listings and verification",
          corps: [
            "Listings are published under the sole responsibility of the advertiser (host or agency). Every listing is subject to verification (the Wakil network) before going live and being granted the “Verified by Darna” badge.",
            "Darna reserves the right to refuse, suspend or remove any listing that is non-compliant, fraudulent or misleading.",
          ],
        },
        {
          titre: "4. Bookings and payments",
          corps: [
            "A booking request holds the slot for 15 minutes. Prices and fees (including the service fee) are always recomputed server-side; no value sent by the browser is used as the charged amount.",
            "Only Darna's service fee (never the rent) is paid online at the time of booking. During the demonstration phase, this payment is simulated by default: no real money movement takes place. When real payment (Konnect) is enabled, the charged amount is always expressed in Tunisian dinars (TND); the euro display is only an indicative conversion. The rent is settled in full, in cash, directly to the host, on arrival.",
          ],
        },
        {
          titre: "5. Refunds and guarantees",
          corps: [
            "Service fees paid online are refundable according to the cancellation policy chosen by the host and shown on the listing, and are fully refunded in the event of a host-initiated cancellation.",
            "Non-conformity guarantee: if the property doesn't match the listing, you can report it within 24 hours of your arrival. After review by our team, the service fee is fully refunded if the report is validated.",
            "No-show guarantee: if you are a host and the guest does not show up, you can report it within 48 hours of the expected arrival time; Darna then compensates you up to the service fee collected on that booking, from its own funds.",
            "These guarantees cover only Darna's service fee, never the rent, which is settled directly with the host: Darna acts neither as an insurer nor as a guarantor of the rent. Any dispute about the rent or the stay itself is settled directly between the traveller and the host.",
          ],
        },
        {
          titre: "6. User obligations",
          corps: [
            "You agree to use Darna fairly, not to circumvent security or verification mechanisms, not to publish unlawful content, and to comply with applicable Tunisian law.",
          ],
        },
        {
          titre: "7. Liability",
          corps: [
            "Darna acts as an intermediary. The platform is provided “as is” during the demonstration phase and cannot be held liable for disputes between travellers and advertisers, to the extent permitted by law.",
          ],
        },
        {
          titre: "8. Suspension and termination",
          corps: [
            "Darna may suspend or close an account in the event of a breach of these Terms, fraud or abusive use. You may close your account at any time.",
          ],
        },
        {
          titre: "9. Governing law",
          corps: [
            "These Terms are governed by Tunisian law. Any dispute falls under the jurisdiction of the courts of Tunis, subject to the mandatory rules protecting consumers residing in the European Union.",
          ],
        },
      ],
    },
    mentions: {
      intro:
        "In line with transparency obligations, information about the publisher and hosting of the Darna platform is provided below.",
      sections: [
        {
          titre: "Publisher",
          corps: [
            "Darna is a project published by Wassim Ben Messaoud. For any question, you can write to: contact@darna.tn.",
            "Full legal details (legal form, registration, registered office) will be published before the platform's commercial launch.",
          ],
        },
        {
          titre: "Hosting",
          corps: [
            "The platform is hosted by a cloud infrastructure provider. The host's details will be specified before going to production.",
          ],
        },
        {
          titre: "Intellectual property",
          corps: [
            "The Darna brand, logo, texts and interface are protected. Any reproduction without authorisation is prohibited. Listing content remains the property of its authors.",
          ],
        },
        {
          titre: "Contact",
          corps: [
            "For any request regarding the legal notice: contact@darna.tn.",
          ],
        },
      ],
    },
    confidentialite: {
      intro:
        "Darna places particular importance on protecting your personal data. This policy explains what data we collect, why, and what your rights are — including for users residing in the European Union (GDPR).",
      sections: [
        {
          titre: "1. Data controller",
          corps: [
            "The data controller is the publisher of Darna. For any question about your data, write to: privacy@darna.tn.",
          ],
        },
        {
          titre: "2. Data collected",
          corps: [
            "Account data: name, email address, phone number, role (traveller, host, agency).",
            "Verification (KYC) data: your national ID number, stored encrypted and never displayed in clear text.",
            "Usage and technical data: bookings, favourites, contact messages, security logs (IP address, timestamp) for audit purposes.",
          ],
        },
        {
          titre: "3. Purposes",
          corps: [
            "Your data is used to provide the service (account, search, booking), to ensure trust and security (verification, fraud prevention, audit) and to contact you about your bookings.",
          ],
        },
        {
          titre: "4. Legal basis",
          corps: [
            "Processing is based on the performance of the contract (providing the service), our legitimate interest (security and fraud prevention), compliance with legal obligations, and your consent where required (for example for non-essential cookies).",
          ],
        },
        {
          titre: "5. Cookies",
          corps: [
            "Darna only uses strictly necessary cookies: login session, language preference, currency preference, and remembering your consent choice. No advertising cookie or third-party tracker is used during the demonstration phase.",
            "You can clear cookies from your browser at any time; necessary cookies are essential for the service to work properly.",
          ],
        },
        {
          titre: "6. Retention",
          corps: [
            "Account data is kept for as long as your account is active. Audit logs are kept for a limited period for security purposes. Your data is deleted or anonymised when no longer needed.",
          ],
        },
        {
          titre: "7. Security",
          corps: [
            "Your passwords are stored as a secure hash (bcrypt); your national ID is encrypted at rest (AES-256-GCM). Access to sensitive data is restricted and logged.",
          ],
        },
        {
          titre: "8. Your rights",
          corps: [
            "Under the GDPR, you have the right to access, rectify, erase, restrict and object to the processing of your data, as well as the right to portability. To exercise these rights, contact: privacy@darna.tn.",
            "You may also lodge a complaint with the competent data protection authority.",
          ],
        },
      ],
    },
  },
  cookieConsent: {
    titre: "Your cookies, your choice",
    message:
      "Darna only uses cookies strictly necessary for it to work (login, language, currency). No advertising trackers.",
    enSavoirPlus: "Learn more",
    accepter: "Got it",
    refuser: "Continue without accepting",
  },
  notFound: {
    titre: "Page not found",
    desc: "This page does not exist or the listing has been removed. Proof that even at Darna, nothing lasts forever.",
    cta: "Back to home",
  },
  host: {
    voirProfil: "View profile",
    titre: (nom: string) => `${nom}'s profile`,
    membreDepuis: (annee: number) => `Member since ${annee}`,
    annoncesActives: (n: number) =>
      n === 1 ? "1 active listing" : `${n} active listings`,
    aucuneAnnonceActive: "No active listings at the moment.",
    retourAccueil: "Back to home",
  },
  relogement: {
    titre: "Find another place",
    headline: "The host cancelled — we're sorry",
    resume:
      "You've been fully refunded. Here are listings matching your search, plus a discount offered by Darna.",
    reductionChip: (percent: number, cap: number) =>
      `Darna discount offered — ${percent}%, up to ${cap} TND`,
    enSavoirPlus: "Learn more",
    detailParagraphe: (jours: number) =>
      `The host cancelled this booking — neither Darna nor you did anything wrong. This kind of cancellation is never acceptable on our platform, whatever the reason, and we've taken action against this host (account suspended). The discount above is valid for ${jours} days, on any of the listings suggested below.`,
    intro: (titre: string) =>
      `Alternatives to "${titre}", same dates, same city or nearby.`,
    aucuneSuggestion: "No alternative available right now for the same dates. Browse all our stays.",
    voirTousLesSejours: "See all stays",
  },
  traveler: {
    voirProfil: "View profile",
    titre: (nom: string) => `${nom}'s profile`,
    sousTitre: "Traveler",
    membreDepuis: (annee: number) => `Member since ${annee}`,
    donnerAvis: "Leave your review",
    avisTitre: "Reviews from hosts",
    avisRecus: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    aucunAvis: "No reviews yet.",
  },
  factures: {
    titre: "Host invoice",
    commissionPour: (titre: string) => `Darna commission — ${titre}`,
    statutEnAttente: "Awaiting payment",
    statutPayee: "Paid",
    montantDu: "Amount due",
    echeance: (date: string) => `Due before ${date}`,
    payeLe: (date: string) => `Paid on ${date}`,
    payerKonnect: "Pay the commission",
    redirectionKonnect: "Redirecting to payment…",
    payerSimulation: "Mark as paid (simulation)",
    paiementEnVerification: "Payment being verified…",
    actualiser: "Refresh",
    paiementEchoue: "Payment failed. Please try again.",
    factureIndisponible: "This invoice is no longer available.",
    paiementErreur: "Error initializing the payment.",
    factureReglee: "Invoice paid.",
    listeTitre: "My invoices",
    listeSousTitre: "Darna commissions owed for your pay-at-property bookings.",
    statutEnRetard: "Overdue",
    vide: "No invoices yet.",
    voirFacture: "View invoice",
  },
  credits: {
    titre: "My credits",
    soldeLabel: "Available balance",
    soldeAide: "Usable when paying for a booking, capped at 30% of the total.",
    parrainageTitre: "Refer friends, earn credit",
    parrainageDesc: (montant: number) =>
      `Share your link: every friend who signs up gets ${montant} TND free.`,
    parrainerBouton: "Refer a friend",
    parrainageMessage: (montant: number) =>
      `Join me on Darna and get ${montant} TND credit free when you sign up!`,
    codeLabel: "Your code",
    historiqueTitre: "History",
    historiqueVide: "No activity yet.",
    expireLe: (date: string) => `Expires on ${date}`,
    motifLabel: (motif: string) => {
      switch (motif) {
        case "BIENVENUE_PARRAINAGE":
          return "Welcome bonus (referral)";
        case "BIENVENUE_SPONTANE":
          return "Welcome credit";
        case "PARRAINAGE_FILLEUL_TERMINE":
          return "Referral — friend active";
        case "UTILISATION_RESERVATION":
          return "Used on a booking";
        case "UTILISATION_SERVICE_HOTE":
          return "Used on a host service";
        case "EXPIRATION":
          return "Credit expired";
        case "AJUSTEMENT_ADMIN":
          return "Adjustment";
        default:
          return motif;
      }
    },
  },
};
