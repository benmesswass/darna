import type { Dictionary } from "./fr";

/**
 * Dictionnaire anglais — même structure que `fr.ts` (vérifiée par le type).
 */
export const en: Dictionary = {
  meta: {
    siteName: "Darna",
    tagline: "Our home, with full confidence",
    description:
      "Darna — stays and real estate in Tunisia. Verified listings, transparent prices, protected payments.",
  },
  nav: {
    sejours: "Stays",
    immobilier: "Real estate",
    prixDuMarche: "Market prices",
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
    heroLine3: "Your money is protected.",
    heroSub:
      "Darna is the first Tunisian platform where every listing is verifiable, every price is transparent and every payment is protected until the stay is over.",
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
      "Villas, guesthouses and apartments for your holidays — real availability calendar, reviews from real travellers, protected payment.",
    verticalImmobilierTitle: "Real estate",
    verticalImmobilierDesc:
      "Long-term rentals and sales — fresh listings, market price per m², direct contact with the owner or agency.",
    tabSejoursSub: "Verified holiday stays",
    tabImmoSub: "Buy or rent",
    tabSejoursDesc:
      "Villas and guesthouses for your holidays, with protected payment.",
    tabImmoDesc: "Sales and long-term rentals, directly with the owner.",
    heroQuestion: "What are you looking for?",
    diffTitle: "Stays or Real estate?",
    diffSejours:
      "For your holidays: book a verified place and pay securely — funds are released to the host only after your stay.",
    diffImmo:
      "To live year-round: buy or rent long-term, in direct contact with the owner or agency — no online payment.",
    trustTitle: "How Darna protects you",
    trust1Title: "Verified listings",
    trust1Desc:
      "Our Wakils visit the properties in person. The “Darna Verified” badge guarantees the property exists and matches the photos.",
    trust2Title: "Zero hidden fees",
    trust2Desc:
      "The summary breaks down every dinar before payment: price, nights, service fee. No viewing fees, ever.",
    trust3Title: "Protected payment",
    trust3Desc:
      "Your payment is only released to the host after your stay: it stays protected by Darna until you have checked out.",
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
  },
  footer: {
    baseline: "Trust is our product.",
    explorer: "Explore",
    confiance: "Trust",
    aPropos: "About",
    cgu: "Terms of use",
    mentionsLegales: "Legal notice",
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
    indifferent: "Any",
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
    disponibilites: "Availability",
    avis: "Traveller reviews",
    nbAvis: (n: number) => (n === 1 ? "1 review" : `${n} reviews`),
    voirAvis: "See reviews",
    avisGarantie:
      "Every review comes from a confirmed booking on Darna — it is impossible to post one without having stayed.",
    aucunAvis: "No reviews yet — be the first after your stay.",
    avisVerifie: "Verified stay",
    noteGlobale: "Overall rating",
    surface: (m: number) => `${m} m²`,
    pieces: (n: number) => (n === 1 ? "1 room" : `${n} rooms`),
    capacite: (n: number) => (n === 1 ? "1 guest" : `${n} guests`),
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
    enSavoirPlusWakil: "Learn more about the Wakil network",
    enSavoirPlusDarna: "Learn more about our checks",
    nonVerifieTooltip:
      "This property has not been verified on the ground yet. Never pay a deposit outside Darna.",
    proprietaire: "Owner",
    agence: "Agency",
    annonceIndisponible:
      "This listing is no longer active. It is kept for archive purposes only.",
    annonceEnAttente:
      "This listing is being reviewed by the Darna team. It will be visible once validated.",
    legende: "Unavailable",
    jourLibre: "Available",
    publierAvis: "Leave a review",
    votreNote: "Your rating",
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
    motDePasseRegle: "8 characters minimum",
    afficherMotDePasse: "Show password",
    masquerMotDePasse: "Hide password",
    confirmerMotDePasse: "Confirm password",
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
    mettreALaUne: "Feature this listing",
    prolongerALaUne: "Extend featuring",
    alaUneActif: (date: string) => `Featured until ${date}`,
    alaUneSucces: "Your listing is now featured! 🎉",
    promoAlaUneTitre: "Feature your listings",
    promoAlaUneDesc:
      "Top of results and on the homepage for 7 days, with an eye-catching gold badge. Featured listings get seen far more often.",
    aucuneReservation: "No bookings yet.",
    aucuneReservationCta: "Find your next stay among our verified listings.",
    aucuneReservationHote: "No guest has booked your listings yet.",
    aucuneReservationHoteCta:
      "As soon as a traveler books one of your listings, they'll show up here.",
    reservePar: (nom: string) => `Booked by ${nom}`,
    payeLe: (date: string) => `Paid on ${date}`,
    aucuneDemande: "No requests received yet.",
    aucunFavori: "No favourites yet.",
    reservationDe: (nom: string) => `Booking from ${nom}`,
    demandeDe: (nom: string) => `Request from ${nom}`,
    contratBail: "Lease agreement",
    statutReservation: {
      EN_ATTENTE: "Awaiting payment",
      CONFIRMEE: "Confirmed — payment protected",
      ANNULEE: "Cancelled",
      TERMINEE: "Completed",
    } as Record<string, string>,
    annulerReservation: "Cancel this booking",
    annulerConfirm: "Confirm cancellation",
    annulerAnnuler: "Keep my booking",
    remboursement: (montant: number) =>
      montant > 0 ? `Refund: ${montant} TND` : "No refund under this policy",
    cancelledAt: (date: string) => `Cancelled on ${date}`,
    rembourseLabel: (montant: number) => `Refunded: ${montant} TND`,
    revenus: "Earnings",
    revenusTitre: "My earnings",
    revenusSousTitre:
      "The guest pays when booking; Darna holds the amount and pays it out to you once their stay is over. That protected-payment guarantee is what reassures guests and drives bookings.",
    revenusTotal: "Confirmed earnings",
    revenusEnAttente: "Awaiting payout",
    revenusVerse: "Already paid out",
    revenusAucun: "No earnings yet.",
    revenusAucunCta:
      "As soon as a guest pays for a booking, the amount appears here — awaiting payout, then paid out after they check out.",
    revenusBadgeEnAttente: "Awaiting payout",
    revenusBadgeVerse: "Paid out",
    revenusVersementPrevu: (date: string) =>
      `Paid out after the guest checks out (${date})`,
    revenusVerseApres: (date: string) => `Paid out — stay ended on ${date}`,
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
      "Two models that should not be mixed: stays are transactional (escrowed payment), real estate is lead generation (no online payment).",
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
      url: string;
      demo: boolean;
    }) =>
      `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">Booking confirmed ✅</h1>` +
      `<p>Hello ${p.guestName},</p>` +
      `<p>Your booking for <strong>${p.propertyTitle}</strong> is confirmed. Your payment is protected by Darna: it will only be released to the host once your stay is over.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-in</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Check-out</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Nights</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.nights}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">Guests</td><td style="padding:6px 0;text-align:right;font-weight:600">${p.guests}</td></tr>` +
      `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">Total paid</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:right;font-weight:700;color:#0f766e">${p.total}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">View my booking</a></p>` +
      (p.demo
        ? `<p style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px;font-size:13px;color:#92400e">Demo mode: no real payment was made.</p>`
        : "") +
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
    prixNuit: "Price per night",
    nuits: (n: number) => (n === 1 ? "1 night" : `${n} nights`),
    sousTotal: "Subtotal",
    fraisService: "Darna service fee",
    fraisServiceAide:
      "It funds listing verification and payment protection.",
    total: "Total to pay",
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
    proprietaireImpossible: "You can't book your own listing.",
    proprietaireImpossibleAide:
      "This is your listing. To test it as a traveller, sign in with another account.",
    capaciteDepassee: (max: number) =>
      `This accommodation hosts a maximum of ${max} guests.`,
    connexionRequise: "Sign in to book.",
    verifRequise: "Verify your account (email + phone) before booking.",
    verifRequiseTitre: "Verify your account to book",
    verifRequiseDesc:
      "For everyone's trust on Darna, only verified accounts (email + phone) can book. It takes less than two minutes.",
    verifRequiseCta: "Verify my account",
    paiementTitre: "Secure payment — protected by Darna",
    sequestreExplication:
      "Your money is protected: Darna holds it throughout your stay and only releases it to the host after you check out. You are never charged to the host's benefit before you have stayed.",
    paiementMockInfo:
      "Konnect / Flouci payment coming soon. Demo mode: no real charge.",
    payerSimulation: "Pay (simulation)",
    paiementKonnectInfo:
      "Secure payment via Konnect — bank card, e-DINAR or wallet. Your funds stay protected by Darna until the end of your stay.",
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
      "Your payment is protected until the end of your stay. The host has been notified — find the details in “My bookings”.",
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
  },
  alaUne: {
    titre: "Feature your listing",
    sousTitre:
      "Boost your visibility for a week: your listing moves to the top of results and appears on the Darna homepage.",
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
    prix: "Featuring (1 week)",
    total: "Total to pay",
    mockInfo:
      "Konnect / Flouci payment coming soon. Demo mode: no real charge.",
    payer: "Pay and feature (simulation)",
    prolongerInfo: (date: string) =>
      `This listing is already featured until ${date}. A new purchase extends the boost by one week.`,
    retour: "Back to my listings",
    indisponible:
      "This listing can't be featured: it must be active and online.",
    garantie:
      "You stay in control: at the end of the week your listing simply returns to its normal display. No auto-renewal.",
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
  diaspora: {
    titre: "Darna — Tunisians abroad",
    sousTitre:
      "For Tunisians abroad: search, compare and secure your home in the country, without unpleasant surprises.",
    arg1Titre: "Book from abroad",
    arg1Desc:
      "Listings verified on the ground by our Wakils: what you see from Paris or Montreal really exists in Hammamet.",
    arg2Titre: "Pay safely",
    arg2Desc:
      "Darna protected payment: your money is only released to the host after your stay. International card payment coming soon.",
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
    mentionsTitre: "Legal notice",
    aRediger:
      "Document being drafted — it will be published before the platform's official launch.",
  },
  notFound: {
    titre: "Page not found",
    desc: "This page does not exist or the listing has been removed. Proof that even at Darna, nothing lasts forever.",
    cta: "Back to home",
  },
};
