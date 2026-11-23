import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth_screen.dart';
import '../screens/candidate_dashboard.dart';
import '../screens/company_dashboard.dart';
import '../screens/admin_dashboard.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String? title;
  final bool showBack;

  const AppHeader({
    super.key,
    this.title,
    this.showBack = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final langProvider = Provider.of<LanguageProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppBar(
      automaticallyImplyLeading: showBack,
      titleSpacing: showBack ? 0 : 16,
      title: title != null
          ? Text(
              title!,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            )
          : Row(
              children: [
                // Logo SVG / Fallback
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Center(
                    child: Icon(Icons.work_outline, color: Colors.white, size: 20),
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'Superio',
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 20,
                    letterSpacing: -0.5,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
      actions: [
        // Language Toggle Pill (FR / AR)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
          child: InkWell(
            onTap: () => langProvider.toggleLanguage(),
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isDark ? AppColors.borderDark : AppColors.primaryLight,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  const Icon(Icons.language, size: 16, color: AppColors.primary),
                  const SizedBox(width: 4),
                  Text(
                    langProvider.isArabic ? 'العربية' : 'FR',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),

        // User Avatar / Login Action
        Padding(
          padding: const EdgeInsets.only(right: 12, left: 4),
          child: authProvider.isAuthenticated
              ? GestureDetector(
                  onTap: () {
                    // Navigate to appropriate dashboard
                    if (authProvider.isAdmin) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const AdminDashboard()),
                      );
                    } else if (authProvider.isEntreprise) {
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
                  },
                  child: CircleAvatar(
                    radius: 17,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      authProvider.user?.nom.isNotEmpty == true
                          ? authProvider.user!.nom[0].toUpperCase()
                          : 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                )
              : TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AuthScreen()),
                    );
                  },
                  icon: const Icon(Icons.login, size: 16),
                  label: Text(
                    langProvider.t('Connexion'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
        ),
      ],
    );
  }
}
