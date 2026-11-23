import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  String _lang = 'fr'; // 'fr' or 'ar'

  String get lang => _lang;
  bool get isArabic => _lang == 'ar';
  TextDirection get textDirection => isArabic ? TextDirection.rtl : TextDirection.ltr;

  LanguageProvider() {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    _lang = prefs.getString('jf_lang') ?? 'fr';
    notifyListeners();
  }

  Future<void> setLanguage(String newLang) async {
    if (_lang == newLang) return;
    _lang = newLang;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jf_lang', _lang);
    notifyListeners();
  }

  Future<void> toggleLanguage() async {
    await setLanguage(_lang == 'fr' ? 'ar' : 'fr');
  }

  String translate(String key) {
    if (_lang == 'ar') {
      return _arabicTranslations[key] ?? key;
    }
    return key;
  }

  String t(String key) => translate(key);

  static final Map<String, String> _arabicTranslations = {
    // Navigation & Common
    'Accueil': 'الرئيسية',
    'Offres d’emploi': 'عروض العمل',
    'Offres': 'الوظائف',
    'Entreprises': 'الشركات',
    'Connexion': 'تسجيل الدخول',
    'S’inscrire': 'إنشاء حساب',
    'Mon Compte': 'حسابي',
    'Tableau de bord': 'لوحة التحكم',
    'Déconnexion': 'تسجيل الخروج',
    'Rechercher': 'بحث',
    'Retour': 'رجوع',
    'Fermer': 'إغلاق',
    'Enregistrer': 'حفظ',
    'Annuler': 'إلغاء',
    'Postuler': 'تقديم طلب',
    'Modifier': 'تعديل',
    'Supprimer': 'حذف',
    'Confirmer': 'تأكيد',
    
    // Hero & Landing
    'Plateforme Recrutement & Carrières · Expérience 3D': 'منصة التوظيف والمسار المهني · تجربة تفاعلية',
    'Trouvez l’Emploi Idéal & Propulsez Votre Carrière': 'ابحث عن وظيفتك المثالية وطوّر مسارك المهني',
    'offres d’emploi vérifiées prêtes pour vous': 'فرصة عمل نشطة ومحققة متاحة لك الآن',
    'Découvrez les opportunités des meilleures entreprises, déposez votre candidature et suivez vos recrutements en direct.':
        'اكتشف أفضل فرص العمل من الشركات الرائدة، قدّم سيرتك الذاتية وتابع مسار التوظيف بدقة وسرعة.',
    'Titre du poste, compétence, entreprise...': 'المسمى الوظيفي، المهارة، اسم الشركة...',
    'Ville ou région (ex: Paris)': 'المدينة أو المنطقة (مثال: باريس)',
    'Catégories d’Emploi Populaires': 'فئات الوظائف الأكثر طلباً',
    'Offres Récentes à la Une': 'أحدث عروض العمل المميزة',
    'Entreprises Partenaires qui Recrutent': 'الشركات الشريكة التي توظف حالياً',
    'Offres d’emploi vérifiées et actives': 'وظائف معلنة ومحققة ونشطة',
    'Entreprises qui recrutent activement': 'شركات توظف بكثافة حالياً',
    'Candidatures traitées sur la plateforme': 'طلبات توظيف تمت معالجتها',
    
    // Statuses
    'EN_ATTENTE': 'قيد الانتظار',
    'EN_COURS_EXAMEN': 'قيد المراجعة',
    'ENTRETIEN': 'مقابلة مجدولة',
    'ACCEPTEE': 'مقبولة',
    'REFUSEE': 'مرفوضة',
    'ACTIVE': 'نشطة',
    'BROUILLON': 'مسودة',
    'FERMEE': 'مغلقة',
    'PLANIFIE': 'مجدول',
    'TERMINE': 'مكتمل',

    // Dashboards
    'Candidatures envoyées': 'الترشيحات المرسلة',
    'Entretiens planifiés': 'المقابلات المجدولة',
    'Offres favorites': 'الوظائف المفضلة',
    'Profil complété': 'الملف الشخصي مكتمل',
    'Mes Candidatures': 'طلبات ترشيحي',
    'Mes Entretiens': 'مواعيد المقابلات',
    'Mon Profil & CV PDF': 'الملف الشخصي والسيرة الذاتية',
    'Offres Favorites': 'الوظائف المفضلة',
    'Gérer mon CV PDF': 'إدارة السيرة الذاتية PDF',
    'Rechercher des offres': 'البحث عن عروض العمل',
    'Publier une offre': 'نشر عرض عمل',
    'Gérer mes offres': 'إدارة عروضي',
    'Candidatures & Évaluations': 'الترشيحات والتقييمات',
    'Tests Techniques & Évaluations': 'الاختبارات والتقييمات التقنية',
    'Administration': 'لوحة الإدارة',
    'Revoir le QCM': 'مراجعة QCM',
    'Passer le test technique QCM': 'إجراء الاختبار التقني QCM',
    'Rejoindre la visioconférence': 'الانضمام إلى المقابلة المرئية',
  };
}

