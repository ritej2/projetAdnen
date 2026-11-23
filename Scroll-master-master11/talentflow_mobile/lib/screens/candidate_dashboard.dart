import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/api_service.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../models/application_model.dart';
import '../models/interview_model.dart';
import '../providers/auth_provider.dart';
import '../widgets/status_badge.dart';
import '../widgets/kpi_card.dart';
import 'technical_test_screen.dart';
import 'video_interview_screen.dart';

class CandidateDashboard extends StatefulWidget {
  const CandidateDashboard({super.key});

  @override
  State<CandidateDashboard> createState() => _CandidateDashboardState();
}

class _CandidateDashboardState extends State<CandidateDashboard> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _api = ApiService();

  List<Application> _applications = [];
  List<Interview> _interviews = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDashboardData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _loading = true);
    final apps = await _api.getCandidateApplications();
    final ints = await _api.getCandidateInterviews();
    if (mounted) {
      setState(() {
        _applications = apps;
        _interviews = ints;
        _loading = false;
      });
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
          title: Text(
            lang.isArabic ? 'مرحباً، محمد القمري !' : 'Bonjour, ${auth.user?.nom ?? "Candidat"} !',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            tabs: const [
              Tab(icon: Icon(Icons.dashboard_outlined, size: 20), text: 'Vue d’ensemble'),
              Tab(icon: Icon(Icons.work_outline, size: 20), text: 'Candidatures'),
              Tab(icon: Icon(Icons.calendar_today_outlined, size: 20), text: 'Entretiens'),
              Tab(icon: Icon(Icons.person_outline, size: 20), text: 'Profil & CV'),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildOverviewTab(context, auth, isDark),
                  _buildApplicationsTab(context, isDark),
                  _buildInterviewsTab(context, isDark),
                  _buildProfileTab(context, auth, isDark),
                ],
              ),
      ),
    );
  }

  // 1. OVERVIEW TAB
  Widget _buildOverviewTab(BuildContext context, AuthProvider auth, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Subtitle pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? AppColors.cardDark : AppColors.primaryLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                const Icon(Icons.verified_user, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    auth.candidat?.titreProfil ?? 'Ingénieur Logiciel Full Stack · Paris, France',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12, color: AppColors.primary),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // KPI Grid
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.8,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              KpiCard(
                label: 'Candidatures envoyées',
                value: '${_applications.length}',
                icon: Icons.send_outlined,
                color: AppColors.indigo,
                bgColor: AppColors.indigoLight,
              ),
              KpiCard(
                label: 'Entretiens planifiés',
                value: '${_interviews.where((i) => i.statut == "PLANIFIE").length}',
                icon: Icons.calendar_month_outlined,
                color: AppColors.warning,
                bgColor: AppColors.warningLight,
              ),
              KpiCard(
                label: 'Offres favorites',
                value: '2',
                icon: Icons.bookmark_outline,
                color: AppColors.danger,
                bgColor: AppColors.dangerLight,
              ),
              KpiCard(
                label: 'Profil complété',
                value: '${auth.candidat?.completionPercentage ?? 100}%',
                icon: Icons.check_circle_outline,
                color: AppColors.success,
                bgColor: AppColors.successLight,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Quick Section: Recent Applications
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Dernières candidatures',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () => _tabController.animateTo(1),
                child: const Text('Voir tout'),
              ),
            ],
          ),
          const SizedBox(height: 8),

          if (_applications.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Center(child: Text('Aucune candidature envoyée.')),
              ),
            )
          else
            ..._applications.take(2).map((app) => _buildApplicationItem(context, app, isDark)),
        ],
      ),
    );
  }

  // 2. APPLICATIONS TAB
  Widget _buildApplicationsTab(BuildContext context, bool isDark) {
    if (_applications.isEmpty) {
      return const Center(child: Text('Vous n’avez encore postulé à aucune offre.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _applications.length,
      itemBuilder: (context, idx) {
        return _buildApplicationItem(context, _applications[idx], isDark);
      },
    );
  }

  Widget _buildApplicationItem(BuildContext context, Application app, bool isDark) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    app.offreTitre,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                StatusBadge(status: app.statut),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${app.nomEntreprise} · ${app.offreLocalisation} (${app.offreTypeContrat})',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 8),

            // Recruiter Note
            if (app.noteRecruteur != null && app.noteRecruteur!.isNotEmpty)
              Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '💬 Note du recruteur : ${app.noteRecruteur}',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primary),
                ),
              ),

            // Score dossier
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEDE9FE),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '⭐ Score dossier : ${app.noteEvaluation ?? 15.8}/20',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF5B21B6)),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  'Matching : ${app.scoreMatching}%',
                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Action Button: Validated test vs take test
            if (app.isAccepted) ...[
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppColors.successLight,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, size: 16, color: AppColors.success),
                          SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              'Test technique validé : 95% (Excellente prestation)',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: AppColors.success,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => TechnicalTestScreen(
                            offreId: app.offreId,
                            candidatureId: app.id,
                            readOnly: true,
                          ),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      side: const BorderSide(color: AppColors.primary),
                    ),
                    child: const Text('👁️ Revoir', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ] else ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => TechnicalTestScreen(
                          offreId: app.offreId,
                          candidatureId: app.id,
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.quiz_outlined, size: 16),
                  label: const Text('📝 Passer le test technique QCM'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    backgroundColor: AppColors.indigo,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // 3. INTERVIEWS TAB
  Widget _buildInterviewsTab(BuildContext context, bool isDark) {
    if (_interviews.isEmpty) {
      return const Center(child: Text('Aucun entretien programmé pour l’instant.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _interviews.length,
      itemBuilder: (context, idx) {
        final interview = _interviews[idx];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      interview.nomEntreprise,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    StatusBadge(status: interview.statut),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  interview.offreTitre,
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 16, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      interview.dateEntretien.replaceFirst('T', ' à ').substring(0, 16),
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                if (interview.commentaire != null && interview.commentaire!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.borderDark : const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Instructions : ${interview.commentaire}',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => VideoInterviewScreen(interview: interview),
                        ),
                      );
                    },
                    icon: const Icon(Icons.videocam, size: 18),
                    label: const Text('Rejoindre la visioconférence'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 4. PROFILE TAB
  Widget _buildProfileTab(BuildContext context, AuthProvider auth, bool isDark) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      auth.user?.nom.isNotEmpty == true ? auth.user!.nom[0].toUpperCase() : 'M',
                      style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    auth.user?.nom ?? 'Marie Dubois',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    auth.user?.email ?? 'marie.dubois@talentflow.io',
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 12),
                  Chip(
                    label: Text(
                      auth.candidat?.titreProfil ?? 'Ingénieur Logiciel Full Stack',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary),
                    ),
                    backgroundColor: AppColors.primaryLight,
                    side: BorderSide.none,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // CV PDF Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.picture_as_pdf, color: AppColors.primary, size: 24),
                      SizedBox(width: 8),
                      Text('Mon CV PDF Officiel', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Votre CV PDF officiel est stocké et téléchargeable en direct par les recruteurs partenaires.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final url = Uri.parse(
                          auth.candidat?.cvUrl ?? 'https://talentflow.io/cv/cv-marie-dubois.pdf',
                        );
                        if (await canLaunchUrl(url)) {
                          await launchUrl(url, mode: LaunchMode.externalApplication);
                        }
                      },
                      icon: const Icon(Icons.open_in_new, size: 16),
                      label: const Text('Ouvrir mon CV PDF'),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Skills
          const Text('Compétences techniques :', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: ['Java 21', 'Spring Boot 3', 'React 19', 'TypeScript', 'Flutter', 'MySQL', 'Docker', 'REST API']
                .map((skill) => Chip(
                      label: Text(skill, style: const TextStyle(fontSize: 11)),
                      backgroundColor: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                      side: BorderSide.none,
                    ))
                .toList(),
          ),
          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => auth.logout(),
              icon: const Icon(Icons.logout),
              label: const Text('Se déconnecter'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}
