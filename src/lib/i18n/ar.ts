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
    diaspora: "تونسيو الخارج",
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
      "دارنا هي أول منصة تونسية وين كل إعلان موثّق، كل سوم شفّاف، وكل خلاص محمي حتّى تكمّل الإقامة.",
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
    tabSejoursSub: "إقامات موثوقة",
    tabImmoSub: "كراء ولا شراء",
    tabSejoursDesc: "فيلات ودور ضيافة للعطلة، مع خلاص آمن.",
    tabImmoDesc: "بيع وكراء طويل المدى، مباشرة مع صاحب الملك.",
    heroQuestion: "شنوّة تلوّج عليه؟",
    diffTitle: "إقامات ولا عقارات؟",
    diffSejours:
      "للعطلة: أحجز مسكن موثوق وخلّص بأمان — الفلوس ما تتعطاش للمضيف كان بعد ما تكمّل إقامتك.",
    diffImmo:
      "باش تسكن طول العام: شراء ولا كراء طويل الأمد، اتصال مباشر بالمالك ولا الوكالة — بلا خلاص أونلاين.",
    trustTitle: "كيفاش دارنا تحميك",
    trust1Title: "إعلانات موثّقة",
    trust1Desc:
      "الوكلاء متاعنا يزوروا العقارات في عين المكان. علامة « موثّق دارنا » تضمنلك أن العقار موجود ويطابق الصور.",
    trust2Title: "حتى مليم مخبّي",
    trust2Desc:
      "الملخّص يفصّللك كل دينار قبل الخلاص: السوم، الليالي، ومعلوم الخدمة. حتى معلوم زيارة، أبدًا.",
    trust3Title: "خلاص محمي",
    trust3Desc:
      "خلاصك ما يوصلش للمضيف كان بعد ما تكمّل إقامتك: يبقى محمي عند دارنا حتّى تمشي.",
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
    diasporaCta: "اكتشف الفضاء المخصّص",
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
    reessayer: "عاود جرّب",
    champsRequis: "الرجاء التثبّت من خانات الاستمارة.",
    tropDeTentatives: "برشة محاولات. استنّى دقايق وعاود جرّب.",
    optionnel: "اختياري",
  },
  badges: {
    verifie: "موثّق دارنا",
    verifieRemote: "موثّق من دارنا",
    verifieOnSite: "مصادق عليه من الوكيل",
    nonVerifie: "موش موثّق",
    publieAujourdhui: "تنشر اليوم",
    publieHier: "تنشر البارح",
    publieIlYa: (jours: number) =>
      jours === 2 ? "تنشر عندو يومين" : `تنشر عندو ${jours} أيام`,
    expiree: "إعلان منتهي",
    enAttenteValidation: "في انتظار المراجعة",
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
    suggestionsGouvernorats: "اقتراحات ولايات",
    ouAllezVous: "وين باش تمشي؟",
    arrivee: "الوصول",
    depart: "المغادرة",
    datePlaceholder: "يوم/شهر/سنة",
    voyageurs: "المسافرين",
    transaction: "نوع المعاملة",
    louer: "كراء",
    acheter: "شراء",
    gouvernorat: "الولاية",
    tousGouvernorats: "الولايات الكل",
    prix: "السوم",
    prixMin: "أدنى سوم",
    prixMax: "أقصى سوم",
    min: "أدنى",
    max: "أقصى",
    totalSejour: (n: number) =>
      `الإجمالي · ${n === 1 ? "ليلة" : n === 2 ? "ليلتين" : n <= 10 ? `${n} ليالي` : `${n} ليلة`}`,
    equivSejour: (n: number) =>
      `يعني لـ ${n === 1 ? "ليلة" : n === 2 ? "ليلتين" : n <= 10 ? `${n} ليالي` : `${n} ليلة`} :`,
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
    precedent: "السابق",
    suivant: "التالي",
    pageInfo: (page: number, total: number) => `الصفحة ${page} من ${total}`,
    aucunResultatTitre: "حتى إعلان ما يطابق",
    aucunResultatDesc:
      "جرّب وسّع المعايير متاعك ولا نحّي فلاتر. الإعلانات المنتهية تتنحّى وحدها من النتائج.",
    aucuneAnnonceVille: (ville: string) =>
      `ما فماش إعلان في ${ville} في هاك التواريخ`,
    elargirProche: "وسّع البحث متاعك للمدن القريبة :",
    elargirPopulaire: "اكتشف بالأحرى أكثر وجهات نشيطة عندنا :",
    elargiProximiteIntro: "هاو إقامات في أقرب المدن :",
    voirToutVille: (ville: string, n: number) =>
      `${ville} · شوف ${n === 1 ? "إعلان واحد" : `${n} إعلانات`}`,
    hoteAbsentTitre: (ville: string) =>
      `عندك دار في ${ville} ؟ فما مسافرين يلوّجو عليها.`,
    hoteAbsentDesc: (ville: string) =>
      `فما مسافرين يلوّجو على إقامة في ${ville}. ولّي أول مضيّف في الوجهة وانشر أول إعلان متاعك في دقائق.`,
    hoteCtaBouton: "ولّي مضيّف",
    voirListe: "قائمة",
    voirCarte: "خريطة",
    chargementCarte: "الخريطة تحمّل…",
    agrandirCarte: "تكبير الخريطة",
    fermerCarte: "غلق الخريطة",
    sansAvis: "ما فماش أراء بعد",
    filtres: "فلاتر",
    reinitialiser: "إعادة ضبط",
    verifiesUniquement: "المؤكَّدة فقط",
    noteMinimale: "أدنى تقييم",
    toutesNotes: "كل التقييمات",
    noteMinPlus: (n: number) => `${n}★ فما فوق`,
    trier: "ترتيب",
    triRecommande: "مقترح",
    triPrixAsc: "السوم من الأرخص للأغلى",
    triPrixDesc: "السوم من الأغلى للأرخص",
    triAvisDesc: "الأعلى تقييمًا",
    triAvisAsc: "الأدنى تقييمًا",
    triRecent: "الأحدث",
  },
  destination: {
    chargement: "جاري تحميل الوجهة…",
    logementsDispo: (n: number) =>
      n <= 0
        ? "ما فماش إقامات متوفرة"
        : n === 1
          ? "إقامة وحدة متوفرة"
          : `${n} إقامات متوفرة`,
    voirTout: (n: number) => (n === 1 ? "شوف الإعلان" : `شوف ${n} إقامات`),
    recommandations: "اختياراتنا",
    aucunIci: "ما فماش إقامة هنا للتو — اكتشف القريب:",
    autreDestination: "ولا اكتشف وجهة أخرى",
    destinationsPopulaires: "وجهات رائجة",
    verifie: "مْأكّد",
    meteoClear: "شمس",
    meteoClouds: "غيوم",
    meteoRain: "مطر",
    meteoActuelle: "الطقس الحالي",
    meteoSejour: "لإقامتك",
    meteoMoyenneSaison: "معدل الموسم",
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
    verifieRemoteTooltip:
      "فريق دارنا تثبّت من الصور وهويّة المالك وعمل مكالمة فيديو.",
    verifieOnSiteTooltip:
      "وكيل دارنا زار العقار شخصيًا. تثبّت أنه موجود والصور تطابق الواقع.",
    verifieRemoteCriteres: "صور · هويّة · مكالمة فيديو",
    verifieOnSiteCriteres: "زيارة ميدانية · صور · هويّة",
    verifieRemoteBloc:
      "فريق دارنا راجع الصور ومعلومات الإعلان (مكالمة فيديو أو تثبّت وثائقي مع المالك).",
    verifieOnSiteBloc:
      "وكيل دارنا زار العقار شخصيًا. تثبّت أنه موجود، الصور تطابق الواقع، والمالك يمكن الاتصال به.",
    verifiePar: (nom: string) => `بواسطة ${nom}`,
    enSavoirPlusWakil: "اعرف أكثر على شبكة الوكلاء",
    enSavoirPlusDarna: "اعرف أكثر على مراجعاتنا",
    nonVerifieTooltip:
      "العقار هذا مازال ما تثبّتناش منو في عين المكان. ما تخلّص حتى تسبقة خارج دارنا.",
    proprietaire: "المالك",
    agence: "وكالة",
    annonceIndisponible:
      "الإعلان هذا ما عادش نشيط. محفوظ كأرشيف فقط.",
    annonceEnAttente:
      "الإعلان في انتظار مراجعة فريق دارنا. باش يظهر للعامة بعد المصادقة.",
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
    politiqueAnnulation: "سياسة الإلغاء",
    cancelPolicy: {
      FLEXIBLE: "مرنة",
      MODEREE: "معتدلة",
      FERME: "حازمة",
      STRICTE: "صارمة",
    } as Record<string, string>,
    cancelPolicyDesc: {
      FLEXIBLE: "إلغاء مجاني حتى 24 ساعة قبل الوصول.",
      MODEREE: "إلغاء مجاني حتى 5 أيام قبل الوصول.",
      FERME:
        "إلغاء مجاني حتى 30 يوم قبل؛ استرجاع 50% بين 7 و30 يوم؛ لا استرجاع في أقل من 7 أيام.",
      STRICTE: "استرجاع 50% عند الإلغاء 14 يوم على الأقل قبل؛ لا استرجاع بعد ذلك.",
    } as Record<string, string>,
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
    captchaEchec: "فشل التحقق ضد الروبوتات. عاود من فضلك.",
    emailDejaUtilise: "ما نجمناش ننشئو الحساب بالمعطيات هاذي.",
    inscriptionReussie: "الحساب تعمل! تنجم تدخل توا.",
    motDePasseRegle: "8 أحرف كحد أدنى",
    afficherMotDePasse: "أظهر كلمة السر",
    masquerMotDePasse: "خبي كلمة السر",
    confirmerMotDePasse: "أكد كلمة السر",
    pays: "بلد الإقامة",
    motDePasseOublie: "نسيت كلمة السر؟",
    resetTitre: "إعادة تعيين كلمة السر",
    resetSousTitre:
      "أدخل البريد الإلكتروني لحسابك وسنرسل لك رابط إعادة التعيين.",
    resetEnvoyer: "إرسال الرابط",
    resetEmailEnvoye:
      "إذا كان هناك حساب بهذا العنوان، فقد تم إرسال رابط إعادة التعيين للتو.",
    resetModeDemo: "وضع التجربة — رابط إعادة التعيين:",
    resetOuvrirLien: "فتح رابط إعادة التعيين",
    resetNouveauMdp: "كلمة سر جديدة",
    resetValider: "إعادة تعيين كلمة السر",
    resetReussi: "تم إعادة تعيين كلمة السر. يمكنك الآن تسجيل الدخول.",
    resetLienInvalide:
      "رابط غير صالح أو منتهي الصلاحية. يرجى طلب إعادة تعيين جديدة.",
    resetMotDePasseInvalide:
      "يجب أن تتكوّن كلمة السر من 8 أحرف على الأقل وأن تحتوي على رقم.",
    resetRetourConnexion: "العودة إلى تسجيل الدخول",
    resetMailSujet: "Darna — إعادة تعيين كلمة السر",
    resetMailCorpsHtml: (url: string) =>
      `<p>لقد طلبت إعادة تعيين كلمة سر حسابك في Darna.</p>` +
      `<p><a href="${url}">اضغط هنا لاختيار كلمة سر جديدة</a>.</p>` +
      `<p>تنتهي صلاحية هذا الرابط خلال 30 دقيقة. إذا لم تكن صاحب الطلب، تجاهل هذا البريد.</p>`,
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
    email: "تثبّت الإيميل",
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
      CONFIRMEE: "مؤكّد — الخلاص محمي",
      ANNULEE: "ملغى",
      TERMINEE: "مكمّل",
    } as Record<string, string>,
    annulerReservation: "الغ هذا الحجز",
    annulerConfirm: "أكّد الإلغاء",
    annulerAnnuler: "اِحفظ حجزي",
    remboursement: (montant: number) =>
      montant > 0 ? `استرجاع: ${montant} دينار` : "لا استرجاع حسب السياسة",
    cancelledAt: (date: string) => `ملغى في ${date}`,
    rembourseLabel: (montant: number) => `مُسترجع: ${montant} دينار`,
    revenus: "المداخيل",
    revenusTitre: "مداخيلي",
    revenusSousTitre:
      "المسافر يخلّص وقت الحجز؛ دارنا تحفظ المبلغ وتعطيهولك كان بعد ما يكمّل إقامتو. هاذي ضمانة « الخلاص المحمي » اللي تطمّن المسافرين وتخلّيهم يحجزو.",
    revenusTotal: "مداخيل مؤكّدة",
    revenusEnAttente: "في انتظار الصرف",
    revenusVerse: "متصرّف",
    revenusAucun: "ما فماش مداخيل للتوّ.",
    revenusAucunCta:
      "كان يخلّص مسافر حجز، المبلغ يبان هنا — الأول في انتظار الصرف، ومن بعد يتصرّفلك بعد ما يمشي.",
    revenusBadgeEnAttente: "في انتظار الصرف",
    revenusBadgeVerse: "متصرّف",
    revenusVersementPrevu: (date: string) =>
      `يتصرّف بعد ما يمشي المسافر (${date})`,
    revenusVerseApres: (date: string) => `متصرّف — الإقامة كمّلت في ${date}`,
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
    politiqueAnnulation: "سياسة الإلغاء",
    politiqueAnnulationAide:
      "تحدّد شنوّة يرجع للمسافر كان يلغي. كل ما كانت مرنة أكثر، كل ما طمأنت المسافر؛ وكل ما كانت صارمة، كل ما حميت مداخيلك.",
    equipements: "التجهيزات",
    description: "الوصف",
    genererDescription: "ولّد الوصف",
    genererDescriptionAide:
      "يركّب نص من المعطيات اللي دخلتها — تنجم تبدّلو من بعد.",
    publier: "انشر الإعلان",
    apercuPublier: "شوف الإعلان قبل النشر",
    apercuTitre: "نظرة على إعلانك",
    apercuAide: "هكا باش يبان إعلانك للمسافرين. تثبّت، ومن بعد أكّد.",
    continuerEdition: "كمّل التعديل",
    confirmerPublier: "أكّد وانشر",
    annonceCreee: "الإعلان تنشر! باش يقعد أونلاين 30 يوم.",
    modifierTitre: "بدّل الإعلان",
    enregistrerModifs: "سجّل التبديلات",
    annonceModifiee: "الإعلان تحدّث.",
    typeNonModifiable:
      "نوع الإعلان ما يتبدّلش بعد النشر (مرتبط بالحجوزات والتاريخ).",
    photosTitre: "صور الإعلان",
    photosAide:
      "JPEG، PNG ولا WebP — 5 ميغا كحد أقصى للصورة، 8 صور للإعلان. الغلاف هو أول صورة تظهر.",
    photosAccroche:
      "الإعلانات اللي فيها تصاور باهية تتشاف أكثر برشة. زيد على الأقل وحدة.",
    photosDeposer: "اسحب تصاورك لهنا",
    photosDeposerAide: "ولا اختار من ملفّاتك — JPEG، PNG ولا WebP",
    photosParcourir: "اختار تصاوري",
    photosCreationAide: "أوّل صورة باش تولّي غلاف إعلانك.",
    photosReordonner: "اسحب التصاور باش تبدّل ترتيبهم.",
    photoRequise: "زيد على الأقل صورة وحدة باش تنشر إعلانك.",
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
    bloquerDates: "بلوكي هالتواريخ",
    aucunBlocage: "ما فماش تواريخ مبلوكية للتوّ.",
    blocageAjoute: "التواريخ تبلوكات.",
    supprimerBlocage: "نحّي هالبلوكاج",
    blocageRetraitConfirmer: "تنحّي هالبلوكاج؟",
    blocageRetraitOui: "نحّي",
    blocageNotePlaceholder: "ملاحظة (مثلا: إقامة عائلية، خدمة…) — اختياري",
    blocageDatesInvalides:
      "تواريخ غالطة — اختار تاريخ وصول وتاريخ مغادرة (المغادرة بعد الوصول، وفترة ماهيش فايتة).",
    blocageConflitReservation:
      "ما ينجمش: فما حجز موجود في هالفترة.",
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
    indicatifPays: "مفتاح الدولة",
    telephonePlaceholder: "22 345 678",
    envoyerOtp: "ابعثلي رمز التثبّت",
    otpMockInfo:
      "وضع تجريبي: حتى SMS حقيقي ما يتبعث. الرمز متاعك يظهر لوطا.",
    otpSmsInfo: "تبعثلك رمز التحقق عبر SMS.",
    votreCode: "رمز التثبّت متاعك",
    saisirOtp: "اكتب الرمز اللي وصلك",
    valider: "ثبّت الرمز",
    otpInvalide: "الرمز غالط. عاود جرّب.",
    verifieBravo:
      "مبروك، هويتك توثّقت! العلامة تظهر توا على حسابك.",
    dejaVerifie: "هويتك موثّقة من قبل.",
    statutVerifieDemo: "الهوية موثّقة (ديمو)",
    verifieDemoBravo:
      "التثبّت تمّ في الوضع التجريبي. في الإنتاج، يلزم SMS حقيقي باش تاخذ علامة التوثيق الحقيقية.",
    kycRequis:
      "يلزمك توثيق هويتك قبل نشر إعلان.",
    gateRequiseTitre: "وثّق هويتك باش تنشر",
    gateRequiseDesc:
      "باش نحافظو على الثقة في دارنا، الإعلان ينشرو كان الملاّك الموثّقين. التوثيق ياخذ أقل من دقيقتين.",
    gateRequiseCta: "وثّق هويتي",
    otpEnvoiEchoue:
      "ما نجمناش نبعثو كود التثبّت توا. عاود المحاولة بعد شويّة.",
    telephoneIntro: "توصلك رمز عبر SMS ولا WhatsApp باش تأكّد نمرتك.",
    telephoneVerifie: "التيليفون اتثبّت.",
    telephoneRequis: "ثبّت التيليفون متاعك الأول.",
    cinIntro:
      "اكتب رقم بطاقة التعريف متاعك. يبقى سرّي وما ينجّمش يتربط كان بحساب واحد في دارنا.",
    validerCin: "ثبّت بطاقة التعريف",
    cinDejaUtilisee:
      "بطاقة التعريف هذي مربوطة بحساب آخر. وثيقة هوية ما تنجّمش تتستعمل كان لحساب واحد في دارنا.",
  },
  admin: {
    badge: "أدمين",
    titre: "إدارة دارنا",
    annonces: "الإعلانات",
    navAnnonces: "مراجعة الإعلانات",
    navWakils: "مراجعة الوكلاء",
    navAnalytics: "لوحة القيادة",
    wakils: "الوكلاء",
    fileModeration: "قائمة مراجعة الإعلانات",
    fileModerationDesc:
      "أعطِ شارة «موثّق دارنا» للإعلانات اللي صاحبها وثّق هويّته. الإعلانات الرمادية: يلزم المالك أولاً يوثّق هويّته من /dashboard/kyc.",
    annonce: "الإعلان",
    proprietaire: "المالك",
    kycStatut: "هويّة المالك",
    kycStatutTooltip: "حالة التحقق من هويّة المالك",
    kycBloque: "الهوية مش موثّقة — اطلب من المالك يوثّق من /dashboard/kyc قبل إعطاء الشارة.",
    statut: "حالة الإعلان",
    actions: "الإجراءات",
    verifiee: "موثّق",
    nonVerifiee: "مش موثّق",
    verifier: "وثّق",
    verifierRemote: "موثّق دارنا (صور/فيديو)",
    verifierOnSite: "مصادق وكيل (ميداني)",
    retirerVerification: "حذف",
    verifiePar: (nom: string) => `وثّقه ${nom}`,
    annonceMiseAVerifiee: "تمّ توثيق الإعلان.",
    annonceMiseANonVerifiee: "تمّ حذف شارة التوثيق.",
    proprietaireNonVerifie:
      "يلزم يكون المالك موثّق (KYC) باش يتوثّق الإعلان.",
    aucuneAnnonce: "حتى إعلان نشط في الوقت الحالي.",
    annoncesDejVerifiees: "الإعلانات الموثّقة مسبقاً",
    candidaturesWakil: "طلبات الوكلاء",
    candidaturesWakilDesc:
      "عالج طلبات الوكلاء الواصلة. القبول يرقّي الحساب المربوط تلقائياً.",
    aucuneCandidature: "حتى طلب في الوقت الحالي.",
    accepter: "قبول",
    refuser: "رفض",
    planifierEntretien: "مقابلة",
    entretienLabel: "تاريخ المقابلة",
    entretienPlaceholder: "يوم/شهر/سنة ساعة:دقيقة",
    entretienPlanifie: (date: string) => `المقابلة مجدولة ${date}`,
    candidatureRevue: "تمّ تحديث الطلب.",
    revuePar: (nom: string) => `راجعه ${nom}`,
    supprimerCandidature: "أرشفة",
    archiverCandidatureConfirm: "أرشفة هذا الطلب؟",
    supprimerCandidatureConfirm: "حذف هذا الطلب نهائياً؟",
    candidatureSupprimee: "تمّت أرشفة الطلب.",
    candidatureDefinitivementSupprimee: "تمّ حذف الطلب نهائياً.",
    wakilsSupprimees: "الطلبات المؤرشفة",
    wakilsSupprimeeesDesc: "هذه الطلبات تمّت أرشفتها. يمكنك حذفها نهائياً.",
    supprimerDefinitivement: "حذف",
    aucuneCandidatureSupprimee: "لا توجد طلبات مؤرشفة.",
  },
  analytics: {
    titre: "لوحة القيادة",
    sousTitre:
      "متابعة اعتماد المنصة: الاكتساب، التفعيل، الحجوزات والاحتفاظ. بيانات محسوبة مباشرة.",
    genereLe: (date: string) => `محدّث في ${date}`,
    pourcent: (v: number) => `٪${Math.round(v * 100)}`,
    rolesLabel: {
      VOYAGEUR: "المسافرون",
      HOTE: "المضيفون",
      AGENCE: "الوكالات",
      ADMIN: "المدراء",
    } as Record<string, string>,

    periodeLabel: "الفترة",
    periodes: { "7": "7 أيام", "30": "30 يومًا", "90": "90 يومًا", all: "الكل" } as Record<
      string,
      string
    >,
    periodeNom: (p: number | null) =>
      p === null ? "منذ البداية" : `آخر ${p} يومًا`,
    surPeriode: (label: string) => `خلال ${label}`,

    sectionVerticales: "حسب القطاع — إقامة مقابل عقارات",
    verticalesDesc:
      "نموذجان لا يُخلطان: الإقامة معاملاتية (دفع محمي)، والعقارات وساطة (عملاء محتملون، دون دفع إلكتروني).",
    verticalLabel: { STAY: "إقامة", IMMO: "عقارات" } as Record<string, string>,
    vStayBadge: "معاملاتي",
    vImmoBadge: "وساطة",
    vActives: "إعلانات نشطة",
    vVerifiees: "موثّقة نشطة",
    vTaux: "نسبة التوثيق",
    vReservations: "حجوزات مدفوعة",
    vGmv: "GMV",
    vLeads: "عملاء محتملون",

    sectionNorthStar: "نظرة عامة",
    annoncesVerifieesActives: "إعلانات موثّقة نشطة",
    annoncesVerifieesActivesDesc: "النجم الشمالي للمنتج",
    annoncesActives: "إعلانات نشطة",
    tauxVerification: "نسبة التوثيق",
    gmv: "حجم الحجوزات (GMV)",
    gmvDesc: "الحجوزات المدفوعة، بما فيها التجريبية",
    gmvReelle: "منها الحقيقي (دون التجريبي)",
    reservationsConfirmees: "حجوزات مؤكَّدة",
    utilisateursTotal: "حسابات منشأة",

    sectionAcquisition: "الاكتساب والتفعيل",
    inscriptions7j: "تسجيلات (7 أيام)",
    inscriptions30j: "تسجيلات (30 يومًا)",
    inscriptionsParJour: (n: number) => `تسجيلات / يوم — آخر ${n} يومًا`,
    repartitionRoles: "التوزيع حسب الدور",
    repartitionPays: "التوزيع حسب البلد",
    repartitionPaysDesc: "الحسابات حسب البلد المُصرَّح — متابعة الجالية.",
    paysNonRenseigne: "غير محدَّد",
    tauxEmailVerifie: "بريد موثّق",
    tauxKyc: "هوية موثّقة (المعلنون)",
    annonceursActifs: "معلنون لديهم إعلان",
    annonceursActifsDesc: "نسبة المضيفين/الوكالات الذين نشروا",

    sectionFunnel: "مسار الحجز",
    funnelDesc:
      "من الحجز المنشأ إلى الدفع المؤكَّد. المراحل تعكس جدول الحجوزات.",
    funnelCreees: "منشأة",
    funnelInitiees: "بدأ الدفع",
    funnelConfirmees: "مؤكَّدة",
    funnelAnnulees: "ملغاة",
    funnelExpirees: "منتهية (15 دقيقة)",
    funnelEnAttente: "قيد الانتظار",
    tauxConversion: "نسبة التحويل",
    tauxAbandon: "نسبة التخلي",

    sectionRetention: "الاحتفاظ والتسرّب",
    retentionDesc:
      "متى يتوقف المسافرون عن الحجز. تقسيم حسب تاريخ آخر حجز.",
    voyageursAyantReserve: "مسافرون حجزوا",
    actifs30j: "نشطون (≤ 30 يومًا)",
    aRisque: "في خطر (30–90 يومًا)",
    perdus: "مفقودون (> 90 يومًا)",
    cohortes: "أفواج التفعيل",
    cohortesDesc:
      "حسب شهر التسجيل: نسبة الحسابات التي حجزت مرة واحدة على الأقل.",
    moisInscription: "الشهر",
    inscrits: "تسجيلات",
    actives: "مفعّلون",
    tauxActivation: "التفعيل",

    sectionWakil: "شبكة الوكلاء",
    candidaturesParStatut: "الطلبات حسب الحالة",
    verificationsSurPlace: "توثيقات ميدانية",
    topWakils: "أبرز الوكلاء (توثيقات)",

    sectionEvenements: "النشاط الأخير",
    evenementsDesc: "آخر أحداث سجل التدقيق.",
    evenement: "الحدث",
    utilisateur: "المستخدم",
    quand: "متى",
    systeme: "النظام",
    echec: "فشل",
    aucuneDonnee: "لا توجد بيانات بعد.",
  },
  email: {
    titre: "تثبّت الإيميل",
    sousTitre:
      "أكّد عنوان إيميلك باش تأمّن حسابك وتوصلك الإشعارات المهمة.",
    description: "اضغط لوطا باش توصلك رمز تثبّت على الإيميل.",
    envoyerCode: "ابعثلي الرمز",
    codeEnvoye: "تبعثلك رمز تثبّت على الإيميل.",
    modeDemoCode: "وضع ديمو — الرمز:",
    saisirCode: "اكتب الرمز اللي وصلك",
    valider: "ثبّت",
    otpInvalide: "الرمز غالط. عاود جرّب.",
    verifieBravo: "الإيميل متاعك اتثبّت.",
    dejaVerifie: "الإيميل متاعك موثّق من قبل.",
    badgeVerifie: "إيميل موثّق",
    mailSujet: "Darna — ثبّت عنوان الإيميل متاعك",
    mailCorpsHtml: (code: string) =>
      `<p>رمز التثبّت متاعك في Darna: <strong>${code}</strong></p>` +
      `<p>الرمز هذا يفنى بعد 10 دقايق.</p>`,
    bookingConfirmSujet: (titre: string) =>
      `Darna — تأكّد الحجز: ${titre}`,
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
      `<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">` +
      `<h1 style="color:#0f766e;font-size:20px">تأكّد الحجز ✅</h1>` +
      `<p>أهلا ${p.guestName}،</p>` +
      `<p>الحجز متاعك في <strong>${p.propertyTitle}</strong> تأكّد. فلوسك محميّة عند Darna: ما تتعطاش للمضيف كان بعد ما تكمّل إقامتك.</p>` +
      `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
      `<tr><td style="padding:6px 0;color:#6b7280">الدخول</td><td style="padding:6px 0;text-align:left;font-weight:600">${p.checkIn}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">الخروج</td><td style="padding:6px 0;text-align:left;font-weight:600">${p.checkOut}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">الليالي</td><td style="padding:6px 0;text-align:left;font-weight:600">${p.nights}</td></tr>` +
      `<tr><td style="padding:6px 0;color:#6b7280">المسافرين</td><td style="padding:6px 0;text-align:left;font-weight:600">${p.guests}</td></tr>` +
      `<tr><td style="padding:10px 0;border-top:1px solid #e5e7eb;color:#6b7280">المجموع المدفوع</td><td style="padding:10px 0;border-top:1px solid #e5e7eb;text-align:left;font-weight:700;color:#0f766e">${p.total}</td></tr>` +
      `</table>` +
      `<p><a href="${p.url}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">شوف الحجز متاعي</a></p>` +
      (p.demo
        ? `<p style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:10px;font-size:13px;color:#92400e">وضع التجربة: ما صار حتّى خلاص حقيقي.</p>`
        : "") +
      `<p style="font-size:12px;color:#9ca3af;margin-top:24px">Darna — السكن المضمون.</p>` +
      `</div>`,
  },
  verifications: {
    navLabel: "التثبّت",
    bienvenue: "مرحبا بيك في دارنا 👋",
    titre: "نثبّتو حسابك",
    sousTitre: "زوز خطوات سراع باش تدخل لمجتمع الثقة متاع دارنا.",
    pourquoiTitre: "علاش التثبّت؟",
    pourquoi1:
      "الثقة هي المنتوج متاعنا: مضيّفين ومسافرين موثّقين، يعني راحة بال للجميع.",
    pourquoi2: "إيميل مؤكّد يأمّن حسابك وإشعارات الحجز متاعك.",
    pourquoi3: "هوية موثّقة تحلّ نشر الإعلانات وتطمّن اللي يحجزو عندك.",
    etape: (n: number, total: number) => `الخطوة ${n} / ${total}`,
    etapeEmail: "ثبّت الإيميل متاعك",
    etapeTelephone: "ثبّت التيليفون متاعك",
    etapeCin: "ثبّت هويتك (CIN)",
    etapeIdentite: "ثبّت هويتك",
    suivant: "الخطوة الجاية",
    precedent: "ارجع",
    passer: "عدّي للوقت هذا",
    terminerPlusTard: "تنجّم تكمّل من بعد من علامة « التثبّت ».",
    tousVerifies: "حسابك موثّق بالكامل 🎉",
    tousVerifiesSous: "يعيشك! ولّيت تستمتع بثقة دارنا الكاملة.",
    badgeFait: "تمّ",
    badgeAFaire: "يتسنّى",
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
    holdLabel: "بلاصتك محجوزة — خلّص في ظرف",
    holdExpireTitre: "وقت الخلاص فات",
    holdExpireDetail:
      "حجزك ما تأكّدش في الوقت: التواريخ ولّاو متاحة من جديد.",
    holdExpireCta: "اعمل حجز جديد",
    datesInvalides: "التواريخ غالطة — تاريخ المغادرة لازم يجي بعد الوصول.",
    datesIndisponibles:
      "التواريخ هاذي ما عادتش متوفّرة. اختار غيرها من فضلك.",
    proprietaireImpossible: "ما تنجمش تحجز الدار متاعك.",
    proprietaireImpossibleAide:
      "هاذي إعلانك. باش تجرّبها كمسافر، ادخل بحساب آخر.",
    capaciteDepassee: (max: number) =>
      `الدار هاذي تسع ${max} مسافرين كحد أقصى.`,
    connexionRequise: "ادخل لحسابك باش تحجز.",
    verifRequise: "ثبّت حسابك (إيميل + تيليفون) قبل ما تحجز.",
    verifRequiseTitre: "ثبّت حسابك باش تحجز",
    verifRequiseDesc:
      "باش تكون الثقة بين الكل في دارنا، كان الحسابات الموثّقة (إيميل + تيليفون) تنجّم تحجز. ياخذلك أقلّ من دقيقتين.",
    verifRequiseCta: "ثبّت حسابي",
    paiementTitre: "خلاص مؤمّن — محمي عند دارنا",
    sequestreExplication:
      "فلوسك محميّة: دارنا تحفظها طول إقامتك وما تعطيهاش للمضيف كان بعد ما تمشي. عمرك ما تتخلّص للمضيف قبل ما تقيم.",
    paiementMockInfo:
      "الخلاص عبر Konnect / Flouci قريبًا. وضع تجريبي: حتى خصم حقيقي ما يصير.",
    payerSimulation: "اخلص (تجربة)",
    paiementKonnectInfo:
      "خلاص مؤمّن عبر Konnect — كارت بنكية، e-DINAR ولا wallet. فلوسك تبقى محميّة عند دارنا حتّى تكمّل إقامتك.",
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
      "خلاصك محمي حتّى تكمّل إقامتك. المضيف تعلّم — تلقى التفاصيل في « حجوزاتي ».",
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
    annulationImpossible: "هذا الحجز ما ينجّمش يتلغى.",
    annulationConfirmee: "الحجز متاعك تلغى.",
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
    titre: "دارنا — تونسيو الخارج",
    sousTitre:
      "للتوانسة اللي في الخارج: لوّج، قارن وأمّن بلاصتك في البلاد، بلا مفاجآت خايبة.",
    arg1Titre: "احجز من الخارج",
    arg1Desc:
      "إعلانات موثّقة في عين المكان من وكلائنا: اللي تشوفو من باريس ولا مونريال موجود فعلًا في الحمامات.",
    arg2Titre: "اخلص بكل أمان",
    arg2Desc:
      "خلاص محمي مع دارنا: فلوسك ما تتعطاش للمضيف كان بعد إقامتك. الخلاص بالبطاقة البنكية العالمية قريبًا.",
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
