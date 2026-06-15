import type { Dictionary } from "./fr";

/**
 * Dictionnaire arabe — derja tunisienne en écriture arabe pour les chaînes
 * conversationnelles (boutons, questions, messages), arabe littéraire pour
 * les textes formels et juridiques (contrat de bail, CGU, méthodologie).
 * Les fonctions de pluriel appliquent les règles arabes : duel (2),
 * pluriel 3–10, singulier de comptage au-delà.
 */
export const ar: Dictionary = {
  meta: {
    siteName: "دارنا",
    tagline: "دارنا، بكل ثقة",
    description:
      "دارنا — إقامات وعقارات في تونس. إعلانات موثّقة، أسعار شفّافة، وخلاص محمي.",
  },
  nav: {
    sejours: "إقامات",
    immobilier: "عقارات",
    prixDuMarche: "أسعار السوق",
    diaspora: "الجالية",
    devenirWakil: "ولّي وكيل",
    connexion: "تسجيل الدخول",
    inscription: "إنشاء حساب",
    dashboard: "حسابي",
    deconnexion: "خروج",
    publier: "انشر إعلان",
    menu: "القائمة",
    precedent: "السابق",
    suivant: "التالي",
  },
  brand: {
    heroTitle: "اللي تشوفو موجود.",
    heroLine2: "السوم اللي تشوفو هو اللي تخلّصو.",
    heroLine3: "فلوسك محميّة.",
    heroSub:
      "دارنا هي أول منصة تونسية وين كل إعلان موثّق، كل سوم شفّاف، وكل خلاص محمي بنظام الضمان.",
    ctaSejours: "لوّج على إقامة",
    ctaImmobilier: "اكتشف العقارات",
  },
  home: {
    villesPopulaires: "أكثر الوجهات طلبًا:",
    statsAnnoncesVerifiees: "إعلان موثّق نشيط",
    statsVilles: "مدينة مغطّاة",
    statsAvis: "تقييم من إقامات حقيقية",
    verticalSejoursTitle: "إقامات",
    verticalSejoursDesc:
      "فيلات، دور ضيافة وشقق لعطلتك — روزنامة حقيقية، تقييمات من مسافرين حقيقيين، وخلاص محمي.",
    verticalImmobilierTitle: "عقارات",
    verticalImmobilierDesc:
      "كراء طويل الأمد وبيع — إعلانات جديدة، أسعار المتر المربع من السوق، واتصال مباشر بالمالك أو الوكالة.",
    trustTitle: "كيفاش دارنا تحميك",
    trust1Title: "إعلانات موثّقة",
    trust1Desc:
      "الوكلاء متاعنا يزوروا العقارات في عين المكان. علامة « موثّق دارنا » تضمنلك أن العقار موجود ويطابق الصور.",
    trust2Title: "حتى مليم مخبّي",
    trust2Desc:
      "الملخّص يفصّللك كل دينار قبل الخلاص: السوم، الليالي، ومعلوم الخدمة. حتى معلوم زيارة، أبدًا.",
    trust3Title: "فلوسك في الضمان",
    trust3Desc:
      "خلاصك ما يوصلش للمضيف كان بعد 24 ساعة من وصولك. كان صار مشكل، ترجعلك فلوسك الكل.",
    featuredTitle: "آخر الإعلانات الموثّقة",
    featuredAll: "شوف الإعلانات الكل",
    alaUneTitle: "في الواجهة",
    alaUneSub: "الإعلانات اللي حطّوهم أصحابهم في الواجهة.",
    statsTitle: "السوق مباشرة",
    statsDesc:
      "مؤشر دارنا يجمع الأسعار الحقيقية للمنصة: طالع أسعار المتر المربع حسب الولاية ومعدل الليلة حسب المدينة.",
    statsCta: "طالع مؤشر دارنا",
    diasporaTitle: "تونسيو الخارج",
    diasporaDesc:
      "لوّج، قارن واحجز من أوروبا بكل ثقة — عرض الأسعار باليورو وزيارات بالفيديو قريبًا.",
    diasporaCta: "اكتشف فضاء الجالية",
    wakilTitle: "ولّي وكيل دارنا",
    wakilDesc:
      "انضم لشبكة وكلاء الثقة اللي يتثبتوا من العقارات في عين المكان واربح دخل إضافي.",
    wakilCta: "قدّم مطلبك",
  },
  footer: {
    baseline: "الثقة هي المنتوج متاعنا.",
    explorer: "اكتشف",
    confiance: "الثقة",
    aPropos: "من نحن",
    cgu: "شروط الاستعمال",
    mentionsLegales: "إعلامات قانونية",
    contact: "اتصل بنا",
    copyright: "دارنا — صُنعت بكل عناية في تونس.",
  },
  common: {
    tnd: "د.ت",
    eur: "€",
    parNuit: "/ الليلة",
    parMois: "/ الشهر",
    chambres: "بيوت",
    voyageurs: "مسافرين",
    surface: "م²",
    rechercher: "لوّج",
    voir: "شوف",
    annuler: "إلغاء",
    enregistrer: "سجّل",
    envoyer: "ابعث",
    fermer: "سكّر",
    retour: "ارجع",
    imprimer: "اطبع",
    chargement: "يحمّل…",
    erreurInconnue: "صار مشكل. عاود جرّب من فضلك.",
    champsRequis: "الرجاء التثبّت من خانات الاستمارة.",
    tropDeTentatives: "برشة محاولات. استنّى دقايق وعاود جرّب.",
    optionnel: "اختياري",
  },
  badges: {
    verifie: "موثّق دارنا",
    nonVerifie: "موش موثّق",
    publieAujourdhui: "تنشر اليوم",
    publieHier: "تنشر البارح",
    publieIlYa: (jours: number) =>
      jours === 2 ? "تنشر عندو يومين" : `تنشر عندو ${jours} أيام`,
    expiree: "إعلان منتهي",
    loue: "تكرى",
    vendu: "تباع",
    sejour: "إقامة",
    location: "كراء",
    vente: "بيع",
    alaUne: "في الواجهة",
    alaUneTooltip:
      "إعلان مميّز: يظهر في قمة النتائج وفي صفحة استقبال دارنا.",
  },
  search: {
    villePlaceholder: "مدينة — الحمامات، جربة، المرسى…",
    suggestionsVilles: "اقتراحات مدن",
    ouAllezVous: "وين باش تمشي؟",
    arrivee: "الوصول",
    depart: "المغادرة",
    voyageurs: "المسافرين",
    transaction: "نوع المعاملة",
    louer: "كراء",
    acheter: "شراء",
    gouvernorat: "الولاية",
    tousGouvernorats: "الولايات الكل",
    prixMin: "أدنى سوم",
    prixMax: "أقصى سوم",
    surfaceMin: "أدنى مساحة (م²)",
    piecesMin: "أدنى عدد بيوت",
    indifferent: "الكل",
    resultats: (n: number) =>
      n === 0
        ? "حتى نتيجة"
        : n === 1
          ? "إعلان واحد"
          : n === 2
            ? "إعلانين"
            : n <= 10
              ? `${n} إعلانات`
              : `${n} إعلان`,
    aucunResultatTitre: "حتى إعلان ما يطابق",
    aucunResultatDesc:
      "جرّب وسّع المعايير متاعك ولا نحّي فلاتر. الإعلانات المنتهية تتنحّى وحدها من النتائج.",
    voirListe: "قائمة",
    voirCarte: "خريطة",
    chargementCarte: "الخريطة تحمّل…",
  },
  property: {
    description: "الوصف",
    caracteristiques: "الخصائص",
    equipements: "التجهيزات",
    localisation: "الموقع",
    disponibilites: "التوفّر",
    avis: "تقييمات المسافرين",
    nbAvis: (n: number) =>
      n === 1
        ? "تقييم واحد"
        : n === 2
          ? "تقييمين"
          : n <= 10
            ? `${n} تقييمات`
            : `${n} تقييم`,
    voirAvis: "شوف التقييمات",
    avisGarantie:
      "كل تقييم جاي من حجز مؤكّد على دارنا — مستحيل تنشر تقييم بلاش ما تكون قعدت.",
    aucunAvis: "حتى تقييم للتوّ — كن أول واحد بعد إقامتك.",
    avisVerifie: "إقامة موثّقة",
    noteGlobale: "التقييم العام",
    surface: (m: number) => `${m} م²`,
    pieces: (n: number) =>
      n === 1 ? "بيت واحد" : n === 2 ? "بيتين" : `${n} بيوت`,
    capacite: (n: number) =>
      n === 1 ? "مسافر واحد" : n === 2 ? "مسافرين اثنين" : `${n} مسافرين`,
    reserver: "احجز",
    contacter: "اتصل",
    whatsapp: "واتساب",
    fraisServiceInfo: "معلوم خدمة شفّاف محسوب في الخلاص",
    verifieTooltip:
      "العقار هذا زارو وتثبّت منو وكيل دارنا: موجود، والصور تطابقو.",
    nonVerifieTooltip:
      "العقار هذا مازال ما تثبّتناش منو في عين المكان. ما تخلّص حتى تسبقة خارج دارنا.",
    proprietaire: "المالك",
    agence: "وكالة",
    annonceIndisponible:
      "الإعلان هذا ما عادش نشيط. محفوظ كأرشيف فقط.",
    legende: "موش متوفّر",
    jourLibre: "متوفّر",
    publierAvis: "خلّي تقييم",
    votreNote: "تقييمك",
    votreCommentaire: "تعليقك",
    avisEnvoye: "يعطيك الصحة! تقييمك تنشر.",
    avisRefuse:
      "كان المسافرين اللي عندهم حجز مؤكّد ومكمّل ينجموا يخلّيوا تقييم.",
    trierPar: "رتّب حسب",
    triRecents: "الأحدث",
    triAnciens: "الأقدم",
    triMeilleures: "الأعلى تقييماً",
    triMoins: "الأدنى تقييماً",
    filtreToutes: "كل التقييمات",
    filtreParNote: (n: number) => (n === 1 ? "نجمة واحدة" : `${n} نجوم`),
    aucunAvisFiltre: "ما فماش تقييم يطابق هذا الفلتر.",
    favoriAjouter: "زيد للمفضّلة",
    favoriRetirer: "نحّي من المفضّلة",
    favoriChoisirDossier: "سجّل في مجلّد",
    favoriNouveauDossier: "مجلّد جديد",
    favoriNomDossier: "اسم المجلّد",
    favoriCreerDossier: "أنشئ وسجّل",
    favoriAnnuler: "ألغِ",
    favoriSansDossier: "بلا مجلّد",
    partagerWhatsapp: (titre: string, prix: string) =>
      `عسلامة، مهتم بالإعلان متاعك « ${titre} » (${prix}) اللي شفتو على دارنا. مازال متوفّر؟`,
    gallery: {
      ouvrir: "حلّ المعرض",
      voirToutes: (n: number) => `شوف ${n} تصاور`,
      fermer: "سكّر",
      precedente: "التصويرة اللي قبل",
      suivante: "التصويرة اللي بعد",
      compteur: (i: number, n: number) => `${i} / ${n}`,
      allerA: (i: number) => `أمشي للتصويرة ${i}`,
      pleinEcran: "ملء الشاشة",
      quitterPleinEcran: "اخرج من ملء الشاشة",
      chargement: "قاعد يحمّل التصويرة…",
      aucunePhoto: "ما فماش تصاور في هذا الإعلان.",
      boucleDebut: "رجعنا للبداية",
      boucleFin: "آخر تصويرة",
    },
  },
  auth: {
    connexionTitre: "تسجيل الدخول لدارنا",
    inscriptionTitre: "أنشئ حساب دارنا",
    email: "البريد الإلكتروني",
    motDePasse: "كلمة السر",
    nom: "الاسم الكامل",
    telephone: "الهاتف (+216…)",
    role: "أنا…",
    roleVoyageur: "مسافر / مستأجر",
    roleHote: "مضيف / مالك",
    roleAgence: "وكالة عقارية",
    seConnecter: "ادخل",
    sInscrire: "سجّل",
    dejaCompte: "عندك حساب؟",
    pasDeCompte: "مازال ما عندكش حساب؟",
    identifiantsInvalides: "معطيات الدخول غالطة.",
    emailDejaUtilise: "ما نجمناش ننشئو الحساب بالمعطيات هاذي.",
    inscriptionReussie: "الحساب تعمل! تنجم تدخل توا.",
    motDePasseRegle: "8 أحرف كحد أدنى",
  },
  dashboard: {
    titre: "حسابي",
    bonjour: (nom: string) => `عسلامة، ${nom}`,
    mesAnnonces: "إعلاناتي",
    mesReservations: "حجوزاتي",
    mesVoyageurs: "مسافريني",
    demandesRecues: "الطلبات الواردة",
    yieldAdvisor: "مستشار المردودية",
    kyc: "توثيق الهوية",
    monProfil: "معلوماتي",
    favoris: "المفضّلة",
    favorisSansDossier: "بلا مجلّد",
    favorisNbLogements: (n: number) => `${n} مسكن`,
    favorisRenommer: "غيّر الاسم",
    favorisSupprimerDossier: "احذف",
    favorisSupprimerConfirm:
      "تحبّ تحذف هذا المجلّد؟ المساكن المسجّلة باش يتنقلوا لـ « بلا مجلّد ».",
    favorisEnregistrer: "سجّل",
    favorisAnnuler: "ألغِ",
    nouvelleAnnonce: "إعلان جديد",
    aucuneAnnonce: "مازال ما عندكش حتى إعلان.",
    aucuneAnnonceCta: "انشر أول إعلان متاعك في دقايق.",
    creerAnnonce: "أنشئ إعلان",
    statut: "الحالة",
    expireLe: (date: string) => `ينتهي في ${date}`,
    expireDans: (jours: number) =>
      jours <= 0 ? "منتهي" : jours === 1 ? "ينتهي غدوة" : `ينتهي في ${jours} أيام`,
    marquerLoue: "علّم اللي تكرى",
    marquerVendu: "علّم اللي تباع",
    republier: "عاود انشر (+30 يوم)",
    annonceMarquee: "الإعلان تحدّث.",
    voirAnnonce: "شوف الإعلان",
    mettreALaUne: "حطّه في الواجهة",
    prolongerALaUne: "طوّل في الواجهة",
    alaUneActif: (date: string) => `في الواجهة حتى ${date}`,
    alaUneSucces: "إعلانك ولّى في الواجهة! 🎉",
    promoAlaUneTitre: "حطّ إعلاناتك في الواجهة",
    promoAlaUneDesc:
      "في قمة النتائج وفي صفحة الاستقبال مدّة 7 أيام، مع شارة ذهبية تجبد العين. الإعلانات اللي في الواجهة تتشاف أكثر برشة.",
    aucuneReservation: "حتى حجز للتوّ.",
    aucuneReservationCta: "لوّج على إقامتك الجاية في إعلاناتنا الموثّقة.",
    aucuneReservationHote: "حتى مسافر ما حجز إعلاناتك للتوّ.",
    aucuneReservationHoteCta: "كي يحجز مسافر إعلان من إعلاناتك، يبان هوني.",
    reservePar: (nom: string) => `محجوز من ${nom}`,
    payeLe: (date: string) => `تخلّص في ${date}`,
    aucuneDemande: "حتى طلب للتوّ.",
    aucunFavori: "حتى مفضّلة للتوّ.",
    reservationDe: (nom: string) => `حجز من ${nom}`,
    demandeDe: (nom: string) => `طلب من ${nom}`,
    contratBail: "عقد الكراء",
    statutReservation: {
      EN_ATTENTE: "في انتظار الخلاص",
      CONFIRMEE: "مؤكّد — الفلوس في الضمان",
      ANNULEE: "ملغى",
      TERMINEE: "مكمّل",
    } as Record<string, string>,
  },
  annonceForm: {
    titre: "عنوان الإعلان",
    titrePlaceholder: "فيلا بمسبح في الحمامات",
    type: "نوع الإعلان",
    typeSejour: "إقامة (كراء سياحي)",
    typeLocation: "كراء طويل الأمد",
    typeVente: "بيع",
    prix: "السوم",
    prixNuit: "سوم الليلة (د.ت)",
    prixMois: "الكراء الشهري (د.ت)",
    prixVente: "سوم البيع (د.ت)",
    ville: "المدينة",
    gouvernorat: "الولاية",
    adresse: "العنوان (الحومة، الشارع)",
    surface: "المساحة (م²)",
    pieces: "عدد البيوت",
    capacite: "السعة (مسافرين)",
    equipements: "التجهيزات",
    description: "الوصف",
    genererDescription: "ولّد الوصف",
    genererDescriptionAide:
      "يركّب نص من المعطيات اللي دخلتها — تنجم تبدّلو من بعد.",
    publier: "انشر الإعلان",
    annonceCreee: "الإعلان تنشر! باش يقعد أونلاين 30 يوم.",
    modifierTitre: "بدّل الإعلان",
    enregistrerModifs: "سجّل التبديلات",
    annonceModifiee: "الإعلان تحدّث.",
    typeNonModifiable:
      "نوع الإعلان ما يتبدّلش بعد النشر (مرتبط بالحجوزات والتاريخ).",
    photosTitre: "صور الإعلان",
    photosAide:
      "JPEG، PNG ولا WebP — 5 ميغا كحد أقصى للصورة، 8 صور للإعلان. الغلاف هو أول صورة تظهر.",
    ajouterPhotos: "زيد الصور",
    choisirFichiers: "اختار ملفات…",
    photosAjoutees: "الصور تزادت!",
    supprimerPhoto: "فسخ",
    definirCouverture: "حطّها غلاف",
    couverture: "الغلاف",
    legendePhoto: "وصف (اختياري)",
    legendePlaceholder: "مثال: صالة مضوية ببالكون",
    legendeAide: "وصف قصير لكل تصويرة، يبان في المعرض فوق التصويرة.",
    legendeEnregistree: "الوصف تسجّل.",
    legendeEnregistrer: "سجّل",
    erreurUpload:
      "الملف مرفوض: الصيغ المقبولة JPEG/PNG/WebP، الحجم الأقصى 5 ميغا.",
    maxPhotos: (n: number) => `${n} صور كحد أقصى للإعلان.`,
    localisation: "الموقع على الخريطة",
    adresseRecherchePlaceholder: "اكتب العنوان متاعك: الشارع، الحومة، المدينة…",
    rechercheAdresse: "نلوّج…",
    aucuneAdresse: "ما لقيناش العنوان — اختار المدينة وحرّك العلامة.",
    repereAide: "حرّك العلامة (ولا أنقر على الخريطة) باش تأشّر على البلاصة بالضبط.",
    disponibilitesTitre: "بلوكي تواريخ",
    disponibilitesAide:
      "خلّي دارك ماهيش متوفّرة في فترة معيّنة (إقامة شخصية، خدمة…). التواريخ المبلوكية تختفي من روزنامة الحجز متاع المسافرين.",
    blocageDebut: "من (أول نهار)",
    blocageFin: "إلى (آخر نهار، داخل)",
    bloquerDates: "بلوكي هالتواريخ",
    aucunBlocage: "ما فماش تواريخ مبلوكية للتوّ.",
    blocageAjoute: "التواريخ تبلوكات.",
    supprimerBlocage: "نحّي هالبلوكاج",
    blocageDatesInvalides:
      "تواريخ غالطة — آخر نهار لازم يكون نفس أول نهار ولا بعدو، وماهوش فايت.",
    blocageConflitReservation:
      "ما ينجمش: فما حجز موجود في هالفترة.",
    blocagePeriode: (debut: string, fin: string) => `من ${debut} إلى ${fin}`,
  },
  kyc: {
    titre: "توثيق الهوية (KYC)",
    sousTitre:
      "التوثيق يقوّي الثقة: العلامة متاعك تظهر على إعلاناتك وتطمّن المسافرين.",
    statutNonVerifie: "الهوية موش موثّقة",
    statutEnAttente: "التوثيق جاري",
    statutVerifie: "الهوية موثّقة",
    cin: "رقم بطاقة التعريف (8 أرقام)",
    telephone: "الهاتف الجوّال (+216…)",
    envoyerOtp: "ابعثلي رمز التثبّت",
    otpMockInfo:
      "وضع تجريبي: حتى SMS حقيقي ما يتبعث. الرمز متاعك يظهر لوطا.",
    votreCode: "رمز التثبّت متاعك",
    saisirOtp: "اكتب الرمز اللي وصلك",
    valider: "ثبّت الرمز",
    otpInvalide: "الرمز غالط. عاود جرّب.",
    verifieBravo:
      "مبروك، هويتك توثّقت! العلامة تظهر توا على حسابك.",
    dejaVerifie: "هويتك موثّقة من قبل.",
  },
  profil: {
    titre: "معلوماتي",
    sousTitre: "سيّر معلوماتك الشخصية، صورة حسابك وكلمة السرّ متاعك.",
    photoTitre: "صورة الحساب",
    photoAide: "JPEG وﻻّ PNG وﻻّ WebP — 5 ميڤا بالأكثر. الصورة المربّعة تجي أحسن.",
    changerPhoto: "بدّل الصورة",
    ajouterPhoto: "زيد صورة",
    supprimerPhoto: "احذف",
    photoEnregistree: "صورة الحساب تبدّلت.",
    photoSupprimee: "صورة الحساب تنحّت.",
    photoErreur: "الملفّ مرفوض: الصيغ المقبولة JPEG/PNG/WebP، الحجم الأقصى 5 ميڤا.",
    infosTitre: "المعلومات الشخصية",
    nom: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emailAide: "البريد الإلكتروني هو معرّف الدخول متاعك وما ينجمش يتبدّل من هنا.",
    telephone: "الهاتف الجوّال",
    telephonePlaceholder: "+216 …",
    role: "نوع الحساب",
    roleVoyageur: "مسافر",
    roleHote: "مضيّف",
    roleAgence: "وكالة",
    roleAdmin: "مشرف",
    enregistrer: "سجّل التغييرات",
    infosEnregistrees: "معلوماتك تبدّلت.",
    mdpTitre: "كلمة السرّ",
    mdpSousTitre: "اختار كلمة سرّ فيها 8 حروف على الأقلّ، وفيها رقم.",
    mdpActuel: "كلمة السرّ الحالية",
    mdpNouveau: "كلمة السرّ الجديدة",
    mdpConfirmation: "أكّد كلمة السرّ الجديدة",
    mdpChanger: "بدّل كلمة السرّ",
    mdpEnregistre: "كلمة السرّ تبدّلت.",
    mdpRegles: "كلمة السرّ لازم تكون 8 حروف على الأقلّ وفيها رقم.",
    mdpActuelInvalide: "كلمة السرّ الحالية غالطة.",
    mdpConfirmationInvalide: "الزوز كلمات السرّ ما يتطابقوش.",
    mdpIdentique: "كلمة السرّ الجديدة لازم تكون مختلفة على الحالية.",
  },
  yieldAdvisor: {
    titre: "مستشار المردودية",
    sousTitre:
      "لكل عقار، دارنا تقارن الإمكانيات الموسمية بمدخول الكراء طويل الأمد، انطلاقًا من الأسعار الحقيقية للمنصة.",
    saisonnier: "موسمي (تقدير شهري)",
    saisonnierDetail: (nuit: number) =>
      `معدل الليلة في المدينة: ${nuit} د.ت × 30 ليلة × 60٪ نسبة حجز صيفية`,
    longueDuree: "طويل الأمد (كراء شهري)",
    longueDureeDetail: (loyer: number) =>
      `معدل الكراء في الولاية: ${loyer} د.ت / الشهر`,
    recoSaisonnier:
      "التوصية: الكراء الموسمي يظهر أربح بياسر للعقار هذا. فكّر في روزنامة التوفّر.",
    recoLongueDuree:
      "التوصية: الكراء طويل الأمد يعطي مدخول أثبت وغالبًا أعلى للعقار هذا.",
    recoEquivalent:
      "التوصية: الزوز خيارات كيف كيف. الطويل الأمد يعطيك الاستقرار، والموسمي يعطيك المرونة.",
    donneesInsuffisantes:
      "معطيات السوق مازالت ناقصة للمنطقة هاذي — تقدير استرشادي.",
    aucunBien: "زيد إعلان باش تتحصّل على تحليل مردودية.",
  },
  booking: {
    titre: "طلب حجز",
    recapitulatif: "الملخّص — شفّاف 100٪",
    prixNuit: "سوم الليلة",
    nuits: (n: number) =>
      n === 1
        ? "ليلة واحدة"
        : n === 2
          ? "ليلتين"
          : n <= 10
            ? `${n} ليالي`
            : `${n} ليلة`,
    sousTotal: "المجموع الجزئي",
    fraisService: "معلوم خدمة دارنا",
    fraisServiceAide: "يموّل توثيق الإعلانات وحماية الخلاصات.",
    total: "المبلغ الجملي",
    aucunFraisCache: "حتى معلوم آخر ما يتطلب منك. أبدًا.",
    continuerPaiement: "كمّل للخلاص",
    datesInvalides: "التواريخ غالطة — تاريخ المغادرة لازم يجي بعد الوصول.",
    datesIndisponibles:
      "التواريخ هاذي ما عادتش متوفّرة. اختار غيرها من فضلك.",
    proprietaireImpossible: "ما تنجمش تحجز الدار متاعك.",
    proprietaireImpossibleAide:
      "هاذي إعلانك. باش تجرّبها كمسافر، ادخل بحساب آخر.",
    capaciteDepassee: (max: number) =>
      `الدار هاذي تسع ${max} مسافرين كحد أقصى.`,
    connexionRequise: "ادخل لحسابك باش تحجز.",
    paiementTitre: "خلاص مؤمّن — ضمان دارنا",
    sequestreExplication:
      "فلوسك محميّة: تقعد في الضمان عند دارنا وما توصل للمضيف كان بعد 24 ساعة من الوصول. كان صار مشكل عند الوصول، ترجعلك فلوسك الكل.",
    paiementMockInfo:
      "الخلاص عبر Konnect / Flouci قريبًا. وضع تجريبي: حتى خصم حقيقي ما يصير.",
    payerSimulation: "اخلص (تجربة)",
    paiementKonnectInfo:
      "خلاص مؤمّن عبر Konnect — كارت بنكية، e-DINAR ولا wallet. فلوسك تبقى محميّة بضمان دارنا.",
    payerKonnect: "اخلص بـ Konnect",
    redirectionKonnect: "توجيه للخلاص المؤمّن…",
    paiementEchoue:
      "الخلاص ما تمّش. حتى مبلغ ما تخصم — تنجّم تعاود.",
    paiementEnVerification: "الخلاص وصل، التأكيد في طور التحقّق.",
    actualiser: "حدّث",
    paiementKonnectErreur:
      "خدمة الخلاص موش متوفّرة توّا. عاود من فضلك بعد لحظة.",
    reservationExpiree: "الحجز هذا فات وقتو. عاود اطلب من فضلك.",
    paiementConfirme: "الحجز تأكّد!",
    paiementConfirmeDetail:
      "فلوسك في الضمان. المضيف تعلّم — تلقى التفاصيل في « حجوزاتي ».",
    voirMesReservations: "شوف حجوزاتي",
    sejourDates: (arrivee: string, depart: string) =>
      `من ${arrivee} إلى ${depart}`,
    choisirDates: "اختار التواريخ متاعك",
    selectionne: "مختار",
    cliquezArrivee: "اضغط على تاريخ الوصول",
    cliquezDepart: "اختار تاريخ المغادرة",
    effacer: "امسح",
    moisPrecedent: "الشهور اللّي فاتوا",
    moisSuivant: "الشهور الجايين",
    placeholderPrix: "اختار التواريخ متاعك في الروزنامة باش تشوف السوم الكامل — بلا حتى مليم مخبّي.",
    selectionnezDates: "اختار التواريخ متاعك",
  },
  alaUne: {
    titre: "حطّ إعلانك في الواجهة",
    sousTitre:
      "كبّر ظهورك مدّة جمعة: إعلانك يطلع في قمة النتائج ويظهر في صفحة استقبال دارنا.",
    avantage1Titre: "في قمة النتائج",
    avantage1Desc:
      "إعلانك يظهر قبل الكل في تلويج الإقامات والعقارات.",
    avantage2Titre: "شارة ذهبية «في الواجهة»",
    avantage2Desc:
      "شارة مميّزة وإطار ذهبي يجبدو عين المسافرين دغري.",
    avantage3Titre: "فيترينة الاستقبال",
    avantage3Desc:
      "تظهر في كاروسال «في الواجهة» في صفحة الاستقبال، اللي يشوفها الكل.",
    recapTitre: "ملخّص — شفّاف 100%",
    annonce: "الإعلان",
    duree: "مدّة الإبراز",
    dureeValeur: (j: number) => (j === 1 ? "نهار" : `${j} أيام`),
    prix: "إبراز في الواجهة (جمعة)",
    total: "المجموع اللي تخلصو",
    mockInfo:
      "الخلاص عبر Konnect / Flouci قريبًا. وضع تجريبي: حتى خصم حقيقي ما يصير.",
    payer: "اخلص وحطّ في الواجهة (تجربة)",
    prolongerInfo: (date: string) =>
      `الإعلان هذا موجود في الواجهة حتى ${date}. شراء جديد يطوّل الإبراز جمعة أخرى.`,
    retour: "ارجع لإعلاناتي",
    indisponible:
      "الإعلان هذا ما ينجمش يتحطّ في الواجهة: لازمو يكون نشيط وعلى الخطّ.",
    garantie:
      "إنت اللي تحكم: كي تكمّل الجمعة، إعلانك يرجع للعرض العادي. ما فمّاش تجديد تلقائي.",
  },
  contact: {
    titre: "اتصل بصاحب الإعلان",
    nom: "اسمك",
    email: "بريدك الإلكتروني",
    telephone: "هاتفك",
    message: "رسالتك",
    messageDefaut: (titre: string) =>
      `عسلامة، مهتم بـ« ${titre} ». نجموا نتفاهموا على زيارة؟`,
    envoye: "طلبك توصّل لصاحب الإعلان.",
    envoyer: "ابعث الطلب",
    ouWhatsapp: "ولا مباشرة على",
  },
  bail: {
    titre: "عقد كراء معدّ للسكنى",
    sousTitre:
      "وثيقة معبّأة مسبقًا من دارنا — تُستكمل وتُمضى من الطرفين.",
    entre: "بين الممضين أسفله:",
    bailleur: "المُكري",
    locataire: "المُكتري",
    bienDesigne: "تعيين العقار",
    adresse: "العنوان",
    surface: "المساحة",
    pieces: "البيوت",
    article1: "الفصل 1 — الموضوع",
    article1Texte:
      "يُكري المُكري للمُكتري، الذي يقبل، العقار المعيّن أعلاه للسكنى دون سواها.",
    article2: "الفصل 2 — المدة",
    article2Texte:
      "أُبرم هذا العقد لمدة سنة قابلة للتجديد ضمنيًا، بداية من تاريخ الإمضاء.",
    article3: "الفصل 3 — معين الكراء",
    article3Texte: (loyer: string) =>
      `حُدّد معين الكراء الشهري بـ${loyer}، يُدفع مسبقًا في غرة كل شهر.`,
    article4: "الفصل 4 — الضمان",
    article4Texte: (caution: string) =>
      `يدفع المُكتري عند الإمضاء ضمانًا قدره ${caution}، يُرجع في نهاية الكراء بعد طرح المبالغ المستوجبة.`,
    article5: "الفصل 5 — الالتزامات",
    article5Texte:
      "يلتزم المُكتري باستعمال العقار استعمالًا هادئًا وصيانته والاكتتاب في تأمين سكني. ويضمن المُكري التمتع الهادئ بالعقار.",
    faitA: "حُرّر بـ",
    le: "في",
    signatureBailleur: "إمضاء المُكري",
    signatureLocataire: "إمضاء المُكتري",
    mentionLegale:
      "نموذج استرشادي من دارنا — لا يُعدّ استشارة قانونية. تثبّت من مطابقته للتشريع التونسي الجاري به العمل.",
    loyerMensuel: "الكراء الشهري",
  },
  prixMarche: {
    titre: "مؤشر دارنا لأسعار العقارات",
    sousTitre:
      "إحصائيات محسوبة مباشرة على الإعلانات النشيطة في المنصة. معطيات استرشادية، تتحدّث باستمرار.",
    venteTitre: "بيع — معدل سعر المتر المربع حسب الولاية",
    locationTitre: "كراء — معدل الكراء للمتر المربع حسب الولاية",
    sejourTitre: "إقامات — معدل الليلة حسب المدينة",
    gouvernorat: "الولاية",
    ville: "المدينة",
    prixM2: "السوم / م²",
    loyerM2: "الكراء / م²",
    nuitee: "معدل الليلة",
    annonces: (n: number) =>
      n === 1
        ? "إعلان واحد"
        : n === 2
          ? "إعلانين"
          : n <= 10
            ? `${n} إعلانات`
            : `${n} إعلان`,
    aucuneDonnee: "مازال ما فماش معطيات كافية للصنف هذا.",
    methodologie: "المنهجية",
    methodologieTexte:
      "معدلات بسيطة محسوبة على الإعلانات النشيطة وغير المنتهية في دارنا. الإعلانات بلا مساحة مذكورة مستثناة من حسابات المتر المربع. المؤشر يثرى كل ما تكبر المنصة.",
  },
  diaspora: {
    titre: "دارنا الجالية",
    sousTitre:
      "للتوانسة اللي في الخارج: لوّج، قارن وأمّن بلاصتك في البلاد، بلا مفاجآت خايبة.",
    arg1Titre: "احجز من الخارج",
    arg1Desc:
      "إعلانات موثّقة في عين المكان من وكلائنا: اللي تشوفو من باريس ولا مونريال موجود فعلًا في الحمامات.",
    arg2Titre: "اخلص بكل أمان",
    arg2Desc:
      "ضمان دارنا: فلوسك ما تتخلّصش كان بعد وصولك. الخلاص بالبطاقة البنكية العالمية قريبًا.",
    arg3Titre: "زيارات بالفيديو (قريبًا)",
    arg3Desc: "وكيل يزور العقار معاك بالفيديو، قبل أي التزام.",
    toggleTitre: "اعرض الأسعار بعملتك",
    toggleDesc: (taux: string) =>
      `بدّل الموقع الكل لليورو بكليكة وحدة — سعر استرشادي: 1 € = ${taux} د.ت.`,
    afficherEnEuros: "اعرض الأسعار بـ€",
    afficherEnTnd: "اعرض الأسعار بالدينار",
    ctaTitre: "صيفك الجاي يبدا من هنا",
    ctaDesc: "تصفّح الإقامات الموثّقة في أجمل مدن البلاد.",
  },
  wakil: {
    titre: "ولّي وكيل دارنا",
    sousTitre:
      "الوكيل هو عين الثقة متاعنا في الميدان: يزور العقارات، يتثبّت أنها موجودة وأن الصور مطابقة. هو اللي يخلّي دارنا موثوقة.",
    missionTitre: "مهمتك",
    mission1: "تزور العقارات قريب منك، بموعد.",
    mission2: "تتثبّت من مطابقة الصور للواقع وتحدّد موقع العقار.",
    mission3: "تسند علامة « موثّق دارنا » اللي تحمي المجموعة الكل.",
    avantagesTitre: "اللي تربحو",
    avantage1: "أجرة على كل زيارة موثّقة",
    avantage2: "أوقات حرّة، في مدينتك",
    avantage3: "تكوين وتطبيقة مخصوصة (قريبًا)",
    formTitre: "الترشّح",
    nom: "الاسم الكامل",
    email: "البريد الإلكتروني",
    telephone: "الهاتف",
    ville: "مدينة تدخّلك",
    motivation: "علاش تحب تولّي وكيل (سطور قليلة)",
    postuler: "ابعث ترشّحي",
    candidatureEnvoyee:
      "يعطيك الصحة! ترشّحك توصّل — فريقنا باش يكلمك قريب.",
  },
  pagesLegales: {
    cguTitre: "شروط الاستعمال العامة",
    mentionsTitre: "إعلامات قانونية",
    aRediger:
      "الوثيقة قيد التحرير — باش تتنشر قبل الإطلاق الرسمي للمنصة.",
  },
  notFound: {
    titre: "الصفحة موش موجودة",
    desc: "الصفحة هاذي ما عادتش موجودة ولا الإعلان تنحّى. شفت؟ حتى في دارنا، موش كل شيء يدوم.",
    cta: "ارجع للصفحة الرئيسية",
  },
};
