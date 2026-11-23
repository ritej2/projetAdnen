import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'fr' | 'ar';

export const DICTIONARY_FR_TO_AR: Record<string, string> = {
  // Navigation & Hero Keys
  "heroPill": "منصة التوظيف والمسار المهني · تجربة تفاعلية 3D",
  "heroMainTitle": "ابحث عن وظيفتك المثالية وطوّر مسارك المهني",
  "heroSubOfferCount": "فرصة عمل نشطة ومحققة متاحة لك الآن",
  "heroSubtitle": "اكتشف أفضل فرص العمل من الشركات الرائدة، قدّم سيرتك الذاتية وتابع مسار التوظيف بدقة وسرعة.",
  "searchKeywordPlaceholder": "المسمى الوظيفي، المهارة، اسم الشركة...",
  "searchLocationPlaceholder": "المدينة أو المنطقة (مثال: باريس)",
  "searchButton": "بحث",
  "popularSearches": "عمليات البحث الشائعة :",
  "popularSearchesLabel": "عمليات البحث الشائعة :",
  "navHome": "الرئيسية",
  "navJobs": "عروض العمل",
  "navCompanies": "الشركات",
  "navLogin": "تسجيل الدخول",
  "navRegister": "إنشاء حساب",
  "navProfile": "الملف الشخصي",
  "navDashboard": "لوحة التحكم",
  "navLogout": "تسجيل الخروج",
  "navPublishJob": "نشر عرض عمل",

  // Longues phrases Hero & Sections
  "Trouvez l’Emploi Idéal & Propulsez Votre Carrière": "ابحث عن وظيفتك المثالية وطوّر مسارك المهني",
  "Trouvez l'Emploi Idéal & Propulsez Votre Carrière": "ابحث عن وظيفتك المثالية وطوّر مسارك المهني",
  "Découvrez les opportunités des meilleures entreprises, déposez votre candidature et suivez vos recrutements en direct.": "اكتشف أفضل فرص العمل من الشركات الرائدة، قدّم سيرتك الذاتية وتابع مسار التوظيف بدقة وسرعة.",
  "Plateforme Recrutement & Carrières · Expérience 3D": "منصة التوظيف والمسار المهني · تجربة تفاعلية 3D",
  "Plateforme Intelligente & Recrutement IA · Expérience Interactive 3D": "منصة توظيف ذكية بالذكاء الاصطناعي · تجربة تفاعلية ثلاثية الأبعاد",
  "Connecté en direct à MySQL Workbench (scroll_master) · Expérience 3D": "منصة توظيف ذكية بالذكاء الاصطناعي · تجربة تفاعلية ثلاثية الأبعاد",
  "Il y a 14 Offres d’Emploi Disponibles pour vous !": "ابحث عن وظيفتك المثالية وطوّر مسارك المهني بالذكاء الاصطناعي",
  "Il y a 14 Offres d'Emploi Disponibles pour vous !": "ابحث عن وظيفتك المثالية وطوّر مسارك المهني بالذكاء الاصطناعي",
  "Des centaines d’opportunités. Trouvez celle qui vous correspond.": "مئات الفرص المهنية في انتظارك. اختر ما يناسب طموحك.",
  "Des centaines d'opportunités. Trouvez celle qui vous correspond.": "مئات الفرص المهنية في انتظارك. اختر ما يناسب طموحك.",
  "Recherchez parmi toutes les offres ouvertes, téléchargez votre CV au format PDF, postulez en un clic et suivez l’état de vos candidatures et entretiens depuis votre tableau de bord.": "ابحث بين عروض العمل المتاحة، قدّم سيرتك الذاتية وتابع طلباتك ومواعيد مقابلاتك بسهولة.",
  "Comment fonctionne notre plateforme ?": "كيف تعمل منصتنا الذكية ؟",
  "Un parcours simple, rapide et transparent pour les candidats comme pour les recruteurs": "مسار سهل، سريع وشفاف لكل من المرشحين ومسؤولي التوظيف",
  "1. Créez votre profil & déposez votre CV": "1. أنشئ حسابك وقدّم سيرتك الذاتية",
  "2. Recherchez & postulez en 1 clic": "2. ابحث عن الوظائف وقدّم بنقرة واحدة",
  "3. Suivez vos candidatures & entretiens": "3. تابع حالة الترشيحات ومواعيد المقابلات",
  "Inscrivez-vous avec Firebase Authentication, renseignez vos compétences et téléchargez votre CV au format PDF dans Firebase Storage.": "سجّل حسابك بسهولة، حدد مهاراتك وخبراتك وحمّل سيرتك الذاتية بصيغة PDF المشفرة.",
  "Filtrez les offres par titre, ville ou type de contrat (CDI, CDD, Stage, Alternance), sauvegardez vos favoris et envoyez votre candidature.": "صفّ عروض العمل حسب المسمى والمدينة ونوع العقد (دائم، مؤقت، تدريب)، واحفظ وظائفك المفضلة.",
  "Consultez la réponse des recruteurs en temps réel et accédez aux dates, horaires et liens de visioconférence de vos entretiens.": "تابع ردود مسؤولي التوظيف لحظياً واطّلع على مواعيد وتفاصيل مقابلاتك عبر الفيديو.",
  "Connaissez votre valeur et trouvez l’emploi qui correspond à vos compétences": "اكتشف إمكانياتك واعثر على الوظيفة المناسبة لمهاراتك",
  "Connaissez votre valeur et trouvez l'emploi qui correspond à vos compétences": "اكتشف إمكانياتك واعثر على الوظيفة المناسبة لمهاراتك",
  "offres d’emploi vérifiées prêtes pour vous": "فرصة عمل نشطة ومحققة متاحة لك الآن",
  "offres d'emploi vérifiées prêtes pour vous": "فرصة عمل نشطة ومحققة متاحة لك الآن",
  "Offres d’emploi vérifiées et actives": "وظائف معلنة ومحققة ونشطة",
  "Offres d'emploi vérifiées et actives": "وظائف معلنة ومحققة ونشطة",
  "Entreprises qui recrutent activement": "شركات توظف بكثافة حالياً",
  "Entreprises Partenaires qui Recrutent": "شركات شريكة توظف حالياً",
  "Top Entreprises qui Recrutent": "أفضل الشركات الموظفة",
  "Talents & Candidats Récents": "أحدث الكفاءات والمواهب",
  "Catégories d’Emploi Populaires": "مجالات العمل الأكثر طلباً",
  "Catégories d'Emploi Populaires": "مجالات العمل الأكثر طلباً",
  "Offres d’Emploi à la Une": "أبرز عروض العمل المميزة",
  "Offres d'Emploi à la Une": "أبرز عروض العمل المميزة",
  "Offres d’Emploi Vedettes": "أبرز عروض العمل المميزة",
  "Offres d'Emploi Vedettes": "أبرز عروض العمل المميزة",
  "Candidatures traitées sur la plateforme": "طلبات توظيف تمت معالجتها",
  "Gérez votre profil, votre CV PDF, vos candidatures et vos entretiens": "إدارة ملفك الشخصي وسيرتك الذاتية وترشيحاتك ومقابلاتك",
  "Candidature envoyée (1 seule candidature autorisée)": "تم إرسال الترشيح (مسموح بترشيح واحد فقط)",
  "Recherches populaires :": "عمليات البحث الشائعة :",
  "Titre du poste, compétence, entreprise...": "المسمى الوظيفي، المهارة، اسم الشركة...",
  "Ville ou région (ex: Paris)": "المدينة أو المنطقة (مثال: باريس)",
  "Connexion instantanée en 1 clic": "تسجيل دخول سريع بضغطة واحدة",
  "Connexion / Inscription": "تسجيل الدخول / إنشاء حساب",
  "Rechercher des offres d’emploi": "البحث عن عروض العمل",
  "Rechercher des offres d'emploi": "البحث عن عروض العمل",
  "Rechercher des offres": "البحث عن عروض العمل",
  "Rechercher une offre": "البحث عن وظيفة",
  "Parcourir toutes les offres": "تصفح جميع عروض العمل",
  "Gérer mon CV PDF": "إدارة السيرة الذاتية PDF",
  "Déposer mon CV": "إدارة السيرة الذاتية",
  "Déposer votre CV": "إدارة السيرة الذاتية",
  "Candidatures envoyées": "الترشيحات المرسلة",
  "Entretiens planifiés": "المقابلات المجدولة",
  "Offres favorites": "الوظائف المفضلة",
  "Offres Favorites": "الوظائف المفضلة",
  "Mes offres favorites": "الوظائف المفضلة",
  "Mes Offres Favorites": "الوظائف المفضلة",
  "Profil complété": "الملف الشخصي مكتمل",
  "Profil complété à": "الملف الشخصي مكتمل بنسبة",
  "Mon Profil & CV PDF": "الملف الشخصي والسيرة الذاتية",
  "Mes Candidatures": "طلبات ترشيحي",
  "Mes Candidatures Récentes": "أحدث طلبات ترشيحي",
  "Mes Entretiens": "مواعيد المقابلات",
  "Mes Entretiens de Recrutement": "مواعيد مقابلات التوظيف الخاصة بي",
  "Agenda des entretiens de recrutement": "جدول مواعيد مقابلات التوظيف",
  "Recherches Sauvegardées": "تنبيهات البحث المحفوظة",
  "Mes Offres d’Emploi": "عروضي المنشورة",
  "Mes Offres d'Emploi": "عروضي المنشورة",
  "Candidatures Reçues": "الطلبات الواردة",
  "Tests Techniques QCM": "الاختبارات التقنية",
  "Profil Entreprise": "ملف الشركة",
  "Publier une Nouvelle Offre": "نشر عرض عمل جديد",
  "Publier une offre d’emploi": "نشر عرض عمل",
  "Publier une offre d'emploi": "نشر عرض عمل",
  "➕ Publier une offre": "➕ نشر عرض عمل",
  "Publier une offre": "نشر عرض عمل",
  "Tableau de bord principal": "لوحة التحكم الرئيسية",
  "Tableau de bord recruteur": "لوحة تحكم الشركات",
  "Tableau de bord": "لوحة التحكم",
  "Espace Candidat": "فضاء المرشح",
  "Mon Espace Candidat": "فضاء المرشح",
  "Espace Recruteur": "فضاء الشركات",
  "Espace Administration": "لوحة الإدارة",
  "Administration": "لوحة الإدارة",
  "Modifier mon profil & photo": "تعديل الملف الشخصي والصورة",
  "✏️ Modifier mon profil & photo": "✏️ تعديل الملف الشخصي والصورة",
  "Modifier mon profil": "تعديل الملف الشخصي",
  "Modifier Profil": "تعديل الملف",
  "Onglet Profil & Documents": "الملف الشخصي والمستندات",

  // Tests IA et Évaluations
  "Passer le test technique QCM": "إجراء الاختبار التقني الذكي",
  "📝 Passer le test technique QCM": "📝 إجراء الاختبار التقني الذكي",
  "⚡ TEST TECHNIQUE QCM IA": "⚡ اختبار تقني ذكي متعدد الخيارات",
  "⚡ ANALYSE INTELLIGENTE & NOTE IA": "⚡ تقييم ذكي وتحليل درجات بالذكاء الاصطناعي",
  "Note Globale IA": "الدرجة العامة للذكاء الاصطناعي",
  "Indice de matching :": "نسبة التوافق :",
  "Recommandation Algorithmique": "توصية النظام الخوارزمي",
  "Grille d’évaluation multi-critères": "معايير التقييم والتحليل متعدد الأبعاد",
  "Grille d'évaluation multi-critères": "معايير التقييم والتحليل متعدد الأبعاد",
  "Commentaire / Remarques du recruteur :": "ملاحظات وتعليقات مسؤول التوظيف :",
  "Recommandations pour l'échange :": "توصيات وملاحظات للمقابلة :",
  "Aperçu direct du CV PDF": "معاينة مباشرة للسيرة الذاتية PDF",
  "Ouvrir le CV PDF envoyé": "فتح السيرة الذاتية PDF المرسلة",
  "Ouvrir le CV PDF": "فتح السيرة الذاتية PDF",
  "Ouvrir en plein écran ↗": "فتح بملء الشاشة ↗",
  "✓ ACCEPTER / EMBAUCHE": "✓ قبول وتوظيف فوري",
  "📅 CONVOQUER ENTRETIEN": "📅 تحديد موعد مقابلة",
  "✗ NON RETENU": "✗ غير مقبول",
  "Test Technique QCM": "اختبار الكفاءة التقنية",
  "Compétences Requises": "المهارات التقنية المطلوبة",
  "Expérience & Séniorité": "الخبرة والسنوات المهنية",
  "Formation & Diplômes": "المستوى الدراسي والشهادات",
  "Motivation & Dossier": "الدافع وتكامل الملف",
  "Points forts clés :": "أبرز نقاط القوة :",
  "❌ Refuser": "❌ رفض",
  "📅 Convoquer à un entretien": "📅 دعوة لمقابلة عمل",
  "✅ Valider & Accepter la candidature": "✅ اعتماد وقبول طلب التوظيف",
  "⚡ Générer et Activer le Test": "⚡ توليد وتفعيل الاختبار بالذكاء الاصطناعي",
  "Créer un Test Technique QCM": "إنشاء اختبار تقني ذكي",
  "Tests Techniques & Évaluations IA": "الاختبارات والتقييمات الذكية",
  "Tests & Évaluations IA": "الاختبارات والتقييمات الذكية",
  "Tests Réalisés": "الاختبارات المنجزة",
  "Tests Validés": "الاختبارات المعتمدة",
  "Score Moyen": "متوسط الدرجات",
  "← Précédente": "→ السابق",
  "Suivante →": "التالي ←",
  "✓ Valider et Soumettre le Test": "✓ اعتماد وإرسال الاختبار",
  "Fermer et voir mes candidatures": "إغلاق والاطلاع على طلباتي",
  "Génération IA...": "جارٍ توليد الأسئلة...",
  "Génération du test en cours...": "جارٍ إعداد الاختبار...",

  // Footer & Pied de page
  "Pour les Candidats": "للمرشحين",
  "Pour les Entreprises": "للشركات",
  "Ressources & Données": "المصادر والبيانات",
  "Parcourir les offres": "تصفح عروض العمل",
  "Découvrir les entreprises": "استكشاف الشركات",
  "Documentation API (Swagger)": "توثيق واجهة البرمجة (API)",
  "Explorateur Base de Données": "مركز البيانات والمزامنة السحابية",
  "Console Firebase": "خدمات التخزين السحابي",
  "Protection des CV (RGPD)": "حماية البيانات وسرية السير الذاتية",
  "Appelez-nous": "اتصل بنا",
  "Tous droits réservés.": "جميع الحقوق محفوظة.",
  "© 2026 Superio France. Tous droits réservés.": "© 2026 جوب فلو (JobFlow). جميع الحقوق محفوظة.",
  "© 2026 JobFlow. Tous droits réservés.": "© 2026 جوب فلو (JobFlow). جميع الحقوق محفوظة.",

  // Données Utilisateurs & Noms
  "Bonjour, Mohamed Gomri !": "مرحباً، محمد القمري !",
  "Bonjour, Mohamed Gomri": "مرحباً، محمد القمري",
  "Mohamed Gomri": "محمد القمري",
  "Marie Dubois": "ماري ديبوا",
  "Sophie Mercier": "صوفي ميرسييه",
  "Alexandre Moreau": "ألكسندر مورو",
  "Yasmine Benali": "ياسمين بن علي",
  "Karim Mansouri": "كريم منصوري",
  "Nadia Belkacem": "نادية بلقاسم",

  // Métiers & Compétences
  "Ingénierie & Tech": "الهندسة وتكنولوجيا المعلومات",
  "Data & IA": "البيانات والذكاء الاصطناعي",
  "Design & Produit": "التصميم وإدارة المنتجات",
  "Marketing & Vente": "التسويق والمبيعات",
  "Finance & Gestion": "المالية والمحاسبة",
  "Ressources Humaines": "الموارد البشرية",
  "Cybersécurité & Réseaux": "الأمن السيبراني والشبكات",
  "Finance & Fintech": "المالية والتكنولوجيا المالية",
  "Gestion de Projet & Agilité": "إدارة المشاريع والرشاقة",
  "Ingénieur Logiciel Full Stack": "مهندس برمجيات شامل (Full Stack)",
  "Ingénieur Full Stack Java / React": "مهندس برمجيات جافا / رياكت",
  "Senior Full Stack Engineer (Java 21 / React)": "مهندس أول برمجيات (جافا 21 / رياكت)",
  "Senior Full Stack Engineer": "مهندس أول برمجيات شامل",
  "Lead Full Stack Developer": "قائد فريق تطوير البرمجيات",
  "Software Engineer": "مهندس برمجيات",
  "Ingénieur Machine Learning & LLM Ops": "مهندس تعلم الآلة ونماذج الذكاء الاصطناعي",
  "Développeur Fullstack React / Spring Boot": "مطور Fullstack رياكت / سبرينغ بوت",
  "Ingénieur Cloud & DevOps Kubernetes": "مهندس سحابي وديف أوبس كوبرنيتس",
  "Product Designer UI/UX & Design System": "مصمم منتجات رقمية وواجهات UI/UX",
  "Tech Lead Data & Analytics Engineer": "قائد تقني لهندسة وتحليل البيانات",

  // Villes & Contrats
  "Paris, France": "باريس، فرنسا",
  "Lyon, France": "ليون، فرنسا",
  "Toulouse, France": "تولوز، فرنسا",
  "Nantes, France": "نانت، فرنسا",
  "Bordeaux, France": "بوردو، فرنسا",
  "Lille, France": "ليل، فرنسا",
  "Paris (Hybride)": "باريس (هجين)",
  "Paris (France)": "باريس (فرنسا)",
  "Paris": "باريس",
  "France": "فرنسا",
  "Hybride": "هجين",
  "Télétravail": "عن بُعد",
  "Présentiel": "حضوري",
  "CDI": "عقد دائم (CDI)",
  "CDD": "عقد مؤقت (CDD)",
  "Stage": "تدريب عملي",
  "Alternance": "تدريب مهني",
  "Freelance": "عمل حر",
  "Temps plein": "دوام كامل",
  "Temps partiel": "دوام جزئي",

  // Statuts
  "En attente": "قيد الانتظار",
  "En cours d’examen": "قيد المراجعة",
  "En cours d'examen": "قيد المراجعة",
  "Entretien planifié": "مقابلة مجدولة",
  "Acceptée": "مقبول",
  "Refusée": "مرفوض",
  "Active": "نشطة",
  "Brouillon": "مسودة",
  "Clôturée": "مغلقة",
  "Archivée": "مؤرشفة",
  "✓ VALIDÉ": "✓ معتمد ومقبول",
  "✗ ÉCHOUÉ": "✗ دون الحد الأدنى",
  "✓ Test validé": "✓ اختبار معتمد",
  "✗ Test complété": "✗ اختبار مكتمل",
  "Entreprise Vérifiée": "شركة موثقة ومحققة",
  "Entretien confirmé": "موعد مقابلة مؤكد",

  // Mots isolés clés
  "Accueil": "الرئيسية",
  "Entreprises": "الشركات",
  "Candidats": "المرشحون",
  "Contact": "اتصل بنا",
  "Connexion": "تسجيل الدخول",
  "Inscription": "إنشاء حساب",
  "Créer un compte": "إنشاء حساب جديد",
  "Déconnexion": "تسجيل الخروج",
  "Profil": "الملف الشخصي",
  "Mon Profil": "ملفي الشخصي",
  "Rechercher": "بحث",
  "Compatibilité": "نسبة التوافق",
  "Statut": "الحالة",
  "Actions": "الإجراءات",
  "Fermer": "إغلاق",
  "Annuler": "إلغاء",
  "Confirmer": "تأكيد",
  "Sauvegarder": "حفظ",
  "Score": "الدرجة",
  "Date": "التاريخ",
  "Localisation": "الموقع",
  "Salaire": "الراتب",
  "complété": "مكتمل",
};

// Trie le dictionnaire par longueur de clé décroissante pour protéger les expressions composées
const SORTED_KEYS = Object.keys(DICTIONARY_FR_TO_AR).sort((a, b) => b.length - a.length);

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (text: string) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('talentflow_lang');
    return saved === 'ar' ? 'ar' : 'fr';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('talentflow_lang', newLang);
  };

  const toggleLang = () => {
    setLang(lang === 'fr' ? 'ar' : 'fr');
  };

  const isRtl = lang === 'ar';

  const t = (text: string): string => {
    if (!text) return '';
    if (lang === 'fr') {
      // Si la clé est un identifiant de dictionnaire direct
      const frDefaults: Record<string, string> = {
        heroPill: "Plateforme Recrutement & Carrières · Expérience 3D",
        heroMainTitle: "Trouvez l’Emploi Idéal & Propulsez Votre Carrière",
        heroSubOfferCount: "offres d’emploi vérifiées prêtes pour vous",
        heroSubtitle: "Découvrez les opportunités des meilleures entreprises, déposez votre candidature et suivez vos recrutements en direct.",
        searchKeywordPlaceholder: "Titre du poste, compétence, entreprise...",
        searchLocationPlaceholder: "Ville ou région (ex: Paris)",
        searchButton: "Rechercher",
        popularSearches: "Recherches populaires :",
        popularSearchesLabel: "Recherches populaires :",
        navHome: "Accueil",
        navJobs: "Offres d’emploi",
        navCompanies: "Entreprises",
        navLogin: "Connexion",
        navRegister: "Inscription",
        navProfile: "Profil",
        navDashboard: "Tableau de bord",
        navLogout: "Déconnexion",
        navPublishJob: "Publier une offre",
      };
      if (frDefaults[text]) return frDefaults[text];
      return text;
    }

    const trimmed = text.trim();
    if (DICTIONARY_FR_TO_AR[trimmed]) {
      return text.replace(trimmed, DICTIONARY_FR_TO_AR[trimmed]);
    }
    if (DICTIONARY_FR_TO_AR[text]) {
      return DICTIONARY_FR_TO_AR[text];
    }
    return text;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

    if (isRtl) {
      document.body.classList.add('jf-rtl');
    } else {
      document.body.classList.remove('jf-rtl');
      if (sessionStorage.getItem('jf_was_ar') === 'true') {
        sessionStorage.removeItem('jf_was_ar');
        window.location.reload();
        return;
      }
    }

    if (!isRtl) return;
    sessionStorage.setItem('jf_was_ar', 'true');

    const translateText = (raw: string): string => {
      let str = raw;
      const trimmed = str.trim();

      // Remplacement exact prioritaire
      if (DICTIONARY_FR_TO_AR[trimmed]) {
        return str.replace(trimmed, DICTIONARY_FR_TO_AR[trimmed]);
      }

      // Salutation dynamique (ex: "Bonjour, Mohamed Gomri !" -> "مرحباً، محمد القمري !")
      if (trimmed.startsWith('Bonjour,') || trimmed.startsWith('Bonjour ')) {
        const afterBonjour = trimmed.replace(/^Bonjour,?\s*/, '').replace(/\s*!$/, '').trim();
        const translatedName = DICTIONARY_FR_TO_AR[afterBonjour] || afterBonjour;
        return `مرحباً، ${translatedName} !`;
      }

      // Itération par ordre de longueur décroissante pour éviter les conflits partiels
      for (const fr of SORTED_KEYS) {
        if (str.includes(fr)) {
          str = str.split(fr).join(DICTIONARY_FR_TO_AR[fr]);
        }
      }

      return str;
    };

    const translateDomTree = () => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const tag = parent.tagName.toLowerCase();
            if (tag === 'script' || tag === 'style' || tag === 'code' || tag === 'pre') {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      let textNode: Text | null = walker.nextNode() as Text;
      while (textNode) {
        const val = textNode.nodeValue;
        if (val && val.trim().length > 0) {
          const translated = translateText(val);
          if (translated !== val) {
            textNode.nodeValue = translated;
          }
        }
        textNode = walker.nextNode() as Text;
      }

      // Traduction des placeholders
      document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[placeholder], textarea[placeholder]').forEach((el) => {
        const ph = el.getAttribute('placeholder');
        if (ph && ph.trim()) {
          const tr = translateText(ph);
          if (tr !== ph) {
            el.setAttribute('placeholder', tr);
          }
        }
      });
    };

    translateDomTree();

    const observer = new MutationObserver(() => {
      observer.disconnect();
      translateDomTree();
      observer.observe(document.body, { childList: true, subtree: true });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [lang, isRtl]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
