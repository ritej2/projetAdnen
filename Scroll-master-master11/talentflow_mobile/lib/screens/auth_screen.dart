import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../providers/auth_provider.dart';
import 'candidate_dashboard.dart';
import 'company_dashboard.dart';
import 'admin_dashboard.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  String _selectedRole = 'CANDIDAT';

  final _formKey = GlobalKey<FormState>();
  final _nomController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  final _companyNameController = TextEditingController();
  final _titreProfilController = TextEditingController();
  final _logoUrlController = TextEditingController();
  final _photoUrlController = TextEditingController();

  @override
  void dispose() {
    _nomController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    _companyNameController.dispose();
    _titreProfilController.dispose();
    _logoUrlController.dispose();
    _photoUrlController.dispose();
    super.dispose();
  }

  void _redirectByRole(BuildContext context, String role) {
    if (role == 'ADMIN') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const AdminDashboard()),
      );
    } else if (role == 'ENTREPRISE') {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const CompanyDashboard()),
      );
    } else {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const CandidateDashboard()),
      );
    }
  }

  Future<void> _handleDemoLogin(String role) async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final success = await auth.loginAsDemoRole(role);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: AppColors.success,
          content: Text('Connecté avec succès en tant que ${auth.user?.nom} (${auth.user?.role})'),
        ),
      );
      _redirectByRole(context, auth.user?.role ?? role);
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = Provider.of<AuthProvider>(context, listen: false);

    if (_isLogin) {
      final success = await auth.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );
      if (success && mounted) {
        _redirectByRole(context, auth.user?.role ?? 'CANDIDAT');
      } else if (mounted && auth.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppColors.danger, content: Text(auth.errorMessage!)),
        );
      }
    } else {
      final success = await auth.register(
        nom: _nomController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
        role: _selectedRole,
        telephone: _phoneController.text.trim(),
        nomEntreprise: _companyNameController.text.trim(),
        titreProfil: _titreProfilController.text.trim(),
        logoUrl: _selectedRole == 'ENTREPRISE' ? _logoUrlController.text.trim() : null,
        photoUrl: _selectedRole == 'CANDIDAT' ? _photoUrlController.text.trim() : null,
      );
      if (success && mounted) {
        _redirectByRole(context, auth.user?.role ?? _selectedRole);
      } else if (mounted && auth.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(backgroundColor: AppColors.danger, content: Text(auth.errorMessage!)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Directionality(
      textDirection: lang.textDirection,
      child: Scaffold(
        appBar: AppBar(
          title: Text(_isLogin ? 'Connexion' : 'Inscription'),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Switch Login / Register Tabs
              Container(
                decoration: BoxDecoration(
                  color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isLogin = true),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _isLogin ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              'Se connecter',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: _isLogin ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _isLogin = false),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: !_isLogin ? AppColors.primary : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              'S’inscrire',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: !_isLogin ? Colors.white : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // 1-CLICK DEMO BUTTONS
              if (_isLogin) ...[
                const Text(
                  '⚡ Accès direct Démo (1 clic) :',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textSecondary),
                ),
                const SizedBox(height: 10),

                // Admin 1-Click
                _buildDemoButton(
                  title: '🛡️ Compte Administrateur',
                  subtitle: 'Alexandre Moreau · admin@talentflow.io',
                  bg: const Color(0xFFFEF2F2),
                  fg: const Color(0xFFB91C1C),
                  border: const Color(0xFFFCA5A5),
                  onTap: () => _handleDemoLogin('ADMIN'),
                ),
                const SizedBox(height: 8),

                // Company 1-Click
                _buildDemoButton(
                  title: '🏢 Compte Entreprise',
                  subtitle: 'Nova Studio · recrutement@novastudio.io',
                  bg: const Color(0xFFF0FDF4),
                  fg: const Color(0xFF15803D),
                  border: const Color(0xFF86EFAC),
                  onTap: () => _handleDemoLogin('ENTREPRISE'),
                ),
                const SizedBox(height: 8),

                // Candidate 1-Click
                _buildDemoButton(
                  title: '👨‍💼 Compte Candidat',
                  subtitle: 'Marie Dubois · marie.dubois@talentflow.io',
                  bg: const Color(0xFFEFF6FF),
                  fg: const Color(0xFF1D4ED8),
                  border: const Color(0xFF93C5FD),
                  onTap: () => _handleDemoLogin('CANDIDAT'),
                ),

                const SizedBox(height: 24),
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('OU formulaire classique', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Role toggle for register
              if (!_isLogin) ...[
                const Text(
                  'Je souhaite m’inscrire en tant que :',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person, size: 16),
                            SizedBox(width: 6),
                            Text('Candidat'),
                          ],
                        ),
                        selected: _selectedRole == 'CANDIDAT',
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: _selectedRole == 'CANDIDAT' ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (_) => setState(() => _selectedRole = 'CANDIDAT'),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ChoiceChip(
                        label: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.business, size: 16),
                            SizedBox(width: 6),
                            Text('Entreprise'),
                          ],
                        ),
                        selected: _selectedRole == 'ENTREPRISE',
                        selectedColor: AppColors.primary,
                        labelStyle: TextStyle(
                          color: _selectedRole == 'ENTREPRISE' ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                        onSelected: (_) => setState(() => _selectedRole = 'ENTREPRISE'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Form fields
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    if (!_isLogin) ...[
                      TextFormField(
                        controller: _nomController,
                        decoration: const InputDecoration(
                          labelText: 'Nom et prénom *',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                        validator: (v) => v?.trim().isEmpty == true ? 'Veuillez saisir votre nom.' : null,
                      ),
                      const SizedBox(height: 12),
                      if (_selectedRole == 'ENTREPRISE') ...[
                        TextFormField(
                          controller: _companyNameController,
                          decoration: const InputDecoration(
                            labelText: 'Nom de l’entreprise *',
                            prefixIcon: Icon(Icons.business_outlined),
                          ),
                          validator: (v) => v?.trim().isEmpty == true ? 'Nom requis' : null,
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _logoUrlController,
                          decoration: InputDecoration(
                            labelText: 'Logo de l’entreprise (URL)',
                            prefixIcon: const Icon(Icons.image_outlined),
                            hintText: 'https://... ou cliquez l’éclair pour suggérer',
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.auto_fix_high, color: AppColors.primary),
                              tooltip: 'Suggérer un logo',
                              onPressed: () {
                                setState(() {
                                  _logoUrlController.text = 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150';
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ] else ...[
                        TextFormField(
                          controller: _titreProfilController,
                          decoration: const InputDecoration(
                            labelText: 'Titre professionnel',
                            prefixIcon: Icon(Icons.work_outline),
                            hintText: 'Ex: Développeur Full Stack',
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _photoUrlController,
                          decoration: InputDecoration(
                            labelText: 'Photo de profil (URL)',
                            prefixIcon: const Icon(Icons.face_outlined),
                            hintText: 'https://... ou cliquez l’éclair pour suggérer',
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.auto_fix_high, color: AppColors.primary),
                              tooltip: 'Suggérer un avatar',
                              onPressed: () {
                                setState(() {
                                  _photoUrlController.text = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ],
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'Adresse e-mail *',
                        prefixIcon: Icon(Icons.email_outlined),
                      ),
                      validator: (v) => v?.contains('@') == false ? 'Email invalide' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: true,
                      decoration: const InputDecoration(
                        labelText: 'Mot de passe *',
                        prefixIcon: Icon(Icons.lock_outline),
                      ),
                      validator: (v) => (v?.length ?? 0) < 6 ? 'Au moins 6 caractères' : null,
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: auth.loading ? null : _handleSubmit,
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: auth.loading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : Text(_isLogin ? 'Se connecter' : 'Créer mon compte'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDemoButton({
    required String title,
    required String subtitle,
    required Color bg,
    required Color fg,
    required Color border,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: border),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: fg)),
                  Text(subtitle, style: TextStyle(fontSize: 11, color: fg.withValues(alpha: 0.8))),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, size: 14, color: fg),
          ],
        ),
      ),
    );
  }
}
