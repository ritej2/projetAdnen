import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/jobs_provider.dart';
import '../widgets/app_header.dart';
import '../widgets/job_card.dart';
import 'jobs_screen.dart';
import 'auth_screen.dart';
import 'candidate_dashboard.dart';
import 'company_dashboard.dart';
import 'admin_dashboard.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final TextEditingController _keywordController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();

  final List<Map<String, dynamic>> _categories = [
    {'title': 'Ingénierie & Tech', 'count': 8, 'icon': Icons.code},
    {'title': 'Design & UX/UI', 'count': 3, 'icon': Icons.design_services_outlined},
    {'title': 'Data & Analytics', 'count': 4, 'icon': Icons.bar_chart_outlined},
    {'title': 'Marketing & Ventes', 'count': 2, 'icon': Icons.campaign_outlined},
    {'title': 'Finance & Juridique', 'count': 1, 'icon': Icons.account_balance_outlined},
    {'title': 'Gestion de Projet', 'count': 2, 'icon': Icons.rocket_launch_outlined},
  ];

  @override
  void dispose() {
    _keywordController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _handleSearch() {
    final jobsProvider = Provider.of<JobsProvider>(context, listen: false);
    jobsProvider.setSearchParams(
      _keywordController.text.trim(),
      _locationController.text.trim(),
    );
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const JobsScreen()),
    );
  }

  void _onBottomNavTapped(int index) {
    if (index == 1) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const JobsScreen()),
      );
    } else if (index == 2) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (!auth.isAuthenticated) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AuthScreen()),
        );
      } else if (auth.isAdmin) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AdminDashboard()),
        );
      } else if (auth.isEntreprise) {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CompanyDashboard()),
        );
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const CandidateDashboard()),
        );
      }
    } else if (index == 3) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      if (auth.isAuthenticated) {
        _showProfileDialog(context, auth);
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const AuthScreen()),
        );
      }
    } else {
      setState(() => _selectedIndex = 0);
    }
  }

  void _showProfileDialog(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppColors.primary,
                child: Text(
                  auth.user?.nom.isNotEmpty == true ? auth.user!.nom[0].toUpperCase() : 'U',
                  style: const TextStyle(fontSize: 24, color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                auth.user?.nom ?? '',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              Text(
                auth.user?.email ?? '',
                style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  auth.user?.role ?? '',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    auth.logout();
                  },
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text('Déconnexion'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.danger,
                    foregroundColor: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final lang = Provider.of<LanguageProvider>(context);
    final jobs = Provider.of<JobsProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Directionality(
      textDirection: lang.textDirection,
      child: Scaffold(
        appBar: const AppHeader(),
        body: RefreshIndicator(
          onRefresh: () => jobs.loadInitialData(),
          color: AppColors.primary,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. HERO BANNER
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: isDark
                          ? [const Color(0xFF1E293B), const Color(0xFF0F172A)]
                          : [const Color(0xFFEEF2FF), const Color(0xFFF5F7FC)],
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Pill
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.borderDark : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                color: AppColors.success,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              lang.t('Plateforme Recrutement & Carrières · Expérience 3D'),
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isDark ? Colors.white70 : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Title
                      Text(
                        lang.t('Trouvez l’Emploi Idéal & Propulsez Votre Carrière'),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Dynamic Live Counter Badge
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${jobs.stats['activeOffers'] ?? 14} ',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                          ),
                          Text(
                            lang.t('offres d’emploi vérifiées prêtes pour vous'),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Search Card
                      Card(
                        elevation: 2,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Column(
                            children: [
                              TextField(
                                controller: _keywordController,
                                decoration: InputDecoration(
                                  hintText: lang.t('Titre du poste, compétence, entreprise...'),
                                  prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                                  filled: true,
                                  fillColor: isDark ? AppColors.borderDark : const Color(0xFFF8FAFC),
                                ),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _locationController,
                                decoration: InputDecoration(
                                  hintText: lang.t('Ville ou région (ex: Paris)'),
                                  prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.primary),
                                  filled: true,
                                  fillColor: isDark ? AppColors.borderDark : const Color(0xFFF8FAFC),
                                ),
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton.icon(
                                  onPressed: _handleSearch,
                                  icon: const Icon(Icons.search),
                                  label: Text(lang.t('Rechercher')),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. FUN FACTS STATS ROW
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Row(
                    children: [
                      _buildFactItem(
                        '${jobs.stats['activeOffers'] ?? 14}+',
                        lang.t('Offres d’emploi vérifiées et actives'),
                        AppColors.primary,
                        isDark,
                      ),
                      const SizedBox(width: 8),
                      _buildFactItem(
                        '${jobs.stats['totalCompanies'] ?? 9}+',
                        lang.t('Entreprises qui recrutent activement'),
                        AppColors.success,
                        isDark,
                      ),
                      const SizedBox(width: 8),
                      _buildFactItem(
                        '${jobs.stats['totalApplications'] ?? 28}+',
                        lang.t('Candidatures traitées sur la plateforme'),
                        AppColors.indigo,
                        isDark,
                      ),
                    ],
                  ),
                ),

                // 3. JOB CATEGORIES
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.t('Catégories d’Emploi Populaires'),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 95,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _categories.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 10),
                          itemBuilder: (context, idx) {
                            final cat = _categories[idx];
                            return InkWell(
                              onTap: () {
                                jobs.setSearchParams(cat['title'], '');
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const JobsScreen()),
                                );
                              },
                              borderRadius: BorderRadius.circular(12),
                              child: Container(
                                width: 140,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: isDark ? AppColors.cardDark : Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Icon(cat['icon'], color: AppColors.primary, size: 24),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          cat['title'],
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                                        ),
                                        Text(
                                          '${cat['count']} postes',
                                          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                // 4. FEATURED JOBS
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            lang.t('Offres Récentes à la Une'),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const JobsScreen()),
                              );
                            },
                            child: const Text('Voir tout'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      if (jobs.loading && jobs.offers.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: CircularProgressIndicator(),
                          ),
                        )
                      else if (jobs.offers.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.all(32),
                            child: Text('Aucune offre disponible pour le moment.'),
                          ),
                        )
                      else
                        ...jobs.offers.take(6).map((offer) => JobCard(offer: offer)),
                    ],
                  ),
                ),

                // 5. TOP COMPANIES
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        lang.t('Entreprises Partenaires qui Recrutent'),
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 80,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: 5,
                          separatorBuilder: (_, _) => const SizedBox(width: 12),
                          itemBuilder: (context, idx) {
                            return Container(
                              width: 80,
                              height: 80,
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isDark ? AppColors.cardDark : Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
                                ),
                              ),
                              child: Image.asset(
                                'assets/images/company-${idx + 1}.png',
                                fit: BoxFit.contain,
                                errorBuilder: (_, _, _) => const Icon(Icons.business, color: AppColors.primary),
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: _onBottomNavTapped,
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home, color: AppColors.primary),
              label: 'Accueil',
            ),
            NavigationDestination(
              icon: Icon(Icons.work_outline),
              selectedIcon: Icon(Icons.work, color: AppColors.primary),
              label: 'Offres',
            ),
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined),
              selectedIcon: Icon(Icons.dashboard, color: AppColors.primary),
              label: 'Espace Pro',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline),
              selectedIcon: Icon(Icons.person, color: AppColors.primary),
              label: 'Compte',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFactItem(String number, String label, Color accent, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
          ),
        ),
        child: Column(
          children: [
            Text(
              number,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: accent,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 10,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
