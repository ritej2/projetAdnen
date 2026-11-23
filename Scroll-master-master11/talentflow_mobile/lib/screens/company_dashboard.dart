import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_service.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../models/application_model.dart';
import '../models/interview_model.dart';
import '../models/job_offer_model.dart';
import '../providers/auth_provider.dart';
import '../widgets/status_badge.dart';
import '../widgets/kpi_card.dart';
import 'video_interview_screen.dart';

class CompanyDashboard extends StatefulWidget {
  const CompanyDashboard({super.key});

  @override
  State<CompanyDashboard> createState() => _CompanyDashboardState();
}

class _CompanyDashboardState extends State<CompanyDashboard> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _api = ApiService();

  List<JobOffer> _offers = [];
  List<Application> _applications = [];
  List<Interview> _interviews = [];
  bool _loading = true;
  String _appFilter = 'EN_ATTENTE';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadCompanyData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadCompanyData() async {
    setState(() => _loading = true);
    final allOffers = await _api.getJobOffers(size: 50);
    final apps = await _api.getCompanyApplications();
    final ints = await _api.getCompanyInterviews();

    if (mounted) {
      setState(() {
        _offers = allOffers;
        _applications = apps;
        _interviews = ints;
        _loading = false;
      });
    }
  }

  void _showAddOfferModal(BuildContext context) {
    final titleController = TextEditingController();
    final locationController = TextEditingController(text: 'Paris, France (Hybride)');
    final salaryController = TextEditingController(text: '65000');
    final descController = TextEditingController(
      text: 'Rejoignez notre équipe technique pour développer notre plateforme cloud.',
    );
    String contractType = 'CDI';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Publier une nouvelle offre',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: titleController,
                  decoration: const InputDecoration(
                    labelText: 'Intitulé du poste *',
                    hintText: 'Ex: Développeur Senior Java / Flutter',
                  ),
                ),
                const SizedBox(height: 10),
                DropdownButtonFormField<String>(
                  initialValue: contractType,
                  decoration: const InputDecoration(labelText: 'Type de contrat'),
                  items: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance']
                      .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                      .toList(),
                  onChanged: (val) => contractType = val ?? 'CDI',
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: locationController,
                  decoration: const InputDecoration(labelText: 'Localisation'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: salaryController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Salaire brut annuel (€)'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: descController,
                  maxLines: 3,
                  decoration: const InputDecoration(labelText: 'Description du poste'),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (titleController.text.trim().isEmpty) return;
                      Navigator.pop(ctx);
                      final ok = await _api.createJobOffer({
                        'titre': titleController.text.trim(),
                        'typeContrat': contractType,
                        'localisation': locationController.text.trim(),
                        'salaire': double.tryParse(salaryController.text) ?? 65000,
                        'description': descController.text.trim(),
                        'modeTravail': 'Hybride',
                        'statut': 'ACTIVE',
                      });
                      if (ok) {
                        _loadCompanyData();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              backgroundColor: AppColors.success,
                              content: Text('Offre d’emploi publiée avec succès !'),
                            ),
                          );
                        }
                      }
                    },
                    child: const Text('Publier l’offre'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showDecisionDialog(BuildContext context, Application app, String newStatus) {
    final noteController = TextEditingController(
      text: newStatus == 'ACCEPTEE'
          ? 'Excellente prestation lors des tests techniques. Offre acceptée !'
          : 'Candidature examinée avec attention.',
    );

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(newStatus == 'ACCEPTEE' ? 'Valider la candidature' : 'Mettre à jour le statut'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Candidat : ${app.candidatNom}'),
              Text('Poste : ${app.offreTitre}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 12),
              const Text('Remarque du recruteur :', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: noteController,
                maxLines: 3,
                decoration: const InputDecoration(hintText: 'Commentaire visible par le candidat'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                final ok = await _api.updateApplicationStatus(
                  app.id,
                  newStatus,
                  noteRecruteur: noteController.text.trim(),
                );
                if (ok) {
                  _loadCompanyData();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        backgroundColor: AppColors.success,
                        content: Text('Statut de la candidature mis à jour !'),
                      ),
                    );
                  }
                }
              },
              child: const Text('Confirmer'),
            ),
          ],
        );
      },
    );
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
            auth.entreprise?.nomEntreprise ?? 'Espace Recruteur',
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
              Tab(icon: Icon(Icons.list_alt, size: 20), text: 'Mes Offres'),
              Tab(icon: Icon(Icons.people_outline, size: 20), text: 'Candidatures'),
              Tab(icon: Icon(Icons.video_call_outlined, size: 20), text: 'Entretiens'),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildOverviewTab(context, auth),
                  _buildOffersTab(context, isDark),
                  _buildApplicationsTab(context, isDark),
                  _buildInterviewsTab(context, isDark),
                ],
              ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showAddOfferModal(context),
          icon: const Icon(Icons.add),
          label: const Text('Publier une offre'),
          backgroundColor: AppColors.primary,
        ),
      ),
    );
  }

  // 1. OVERVIEW
  Widget _buildOverviewTab(BuildContext context, AuthProvider auth) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.8,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              KpiCard(
                label: 'Offres actives',
                value: '${_offers.length}',
                icon: Icons.work_outline,
                color: AppColors.primary,
                bgColor: AppColors.primaryLight,
              ),
              KpiCard(
                label: 'Candidatures reçues',
                value: '${_applications.length}',
                icon: Icons.group_outlined,
                color: AppColors.indigo,
                bgColor: AppColors.indigoLight,
              ),
              KpiCard(
                label: 'À examiner',
                value: '${_applications.where((a) => a.statut == "EN_ATTENTE" || a.statut == "EN_COURS_EXAMEN").length}',
                icon: Icons.pending_actions_outlined,
                color: AppColors.warning,
                bgColor: AppColors.warningLight,
              ),
              KpiCard(
                label: 'Entretiens planifiés',
                value: '${_interviews.length}',
                icon: Icons.calendar_month_outlined,
                color: AppColors.success,
                bgColor: AppColors.successLight,
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Quick action row
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showAddOfferModal(context),
              icon: const Icon(Icons.add_circle_outline),
              label: const Text('➕ Publier une nouvelle offre en 1 clic'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // 2. OFFERS
  Widget _buildOffersTab(BuildContext context, bool isDark) {
    if (_offers.isEmpty) {
      return const Center(child: Text('Aucune offre d’emploi publiée.'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _offers.length,
      itemBuilder: (context, idx) {
        final offer = _offers[idx];
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
                        offer.titre,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                    ),
                    StatusBadge(status: offer.statut),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${offer.localisation ?? "France"} · ${offer.typeContrat} · ${offer.formattedSalary}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.danger, size: 20),
                      onPressed: () async {
                        final ok = await _api.deleteJobOffer(offer.id);
                        if (ok) _loadCompanyData();
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // 3. APPLICATIONS
  Widget _buildApplicationsTab(BuildContext context, bool isDark) {
    final pendingCount = _applications.where((a) => a.statut == 'EN_ATTENTE' || a.statut == 'EN_COURS_EXAMEN').length;
    final acceptedCount = _applications.where((a) => a.statut == 'ACCEPTEE').length;
    final rejectedCount = _applications.where((a) => a.statut == 'REFUSEE').length;

    final displayedApps = _applications.where((a) {
      if (_appFilter == 'EN_ATTENTE') {
        return a.statut == 'EN_ATTENTE' || a.statut == 'EN_COURS_EXAMEN';
      }
      if (_appFilter == 'ACCEPTEE') return a.statut == 'ACCEPTEE';
      if (_appFilter == 'REFUSEE') return a.statut == 'REFUSEE';
      return true;
    }).toList();

    return Column(
      children: [
        // Filter tabs
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              FilterChip(
                selected: _appFilter == 'EN_ATTENTE',
                label: Text('En attente ($pendingCount)'),
                onSelected: (_) => setState(() => _appFilter = 'EN_ATTENTE'),
                selectedColor: AppColors.primaryLight,
                labelStyle: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _appFilter == 'EN_ATTENTE' ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              FilterChip(
                selected: _appFilter == 'ACCEPTEE',
                label: Text('Acceptées ($acceptedCount)'),
                onSelected: (_) => setState(() => _appFilter = 'ACCEPTEE'),
                selectedColor: const Color(0xFFD1FAE5),
                labelStyle: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _appFilter == 'ACCEPTEE' ? AppColors.success : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              FilterChip(
                selected: _appFilter == 'REFUSEE',
                label: Text('Refusées ($rejectedCount)'),
                onSelected: (_) => setState(() => _appFilter = 'REFUSEE'),
                selectedColor: const Color(0xFFFEE2E2),
                labelStyle: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _appFilter == 'REFUSEE' ? AppColors.danger : AppColors.textSecondary,
                ),
              ),
              const SizedBox(width: 8),
              FilterChip(
                selected: _appFilter == 'ALL',
                label: Text('Toutes (${_applications.length})'),
                onSelected: (_) => setState(() => _appFilter = 'ALL'),
                selectedColor: const Color(0xFFE2E8F0),
                labelStyle: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: _appFilter == 'ALL' ? const Color(0xFF0F172A) : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: displayedApps.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Text(
                      _appFilter == 'EN_ATTENTE'
                          ? 'Aucune candidature en attente de décision.'
                          : _appFilter == 'ACCEPTEE'
                              ? 'Aucune candidature acceptée pour l’instant.'
                              : _appFilter == 'REFUSEE'
                                  ? 'Aucune candidature refusée.'
                                  : 'Aucune candidature reçue pour l’instant.',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  itemCount: displayedApps.length,
                  itemBuilder: (context, idx) {
                    final app = displayedApps[idx];
                    final isDecided = app.statut == 'ACCEPTEE' || app.statut == 'REFUSEE';

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
                                  app.candidatNom,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                StatusBadge(status: app.statut),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Poste : ${app.offreTitre}',
                              style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.primary, fontSize: 13),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '⭐ Score dossier : ${app.noteEvaluation ?? 15.8}/20 (Matching : ${app.scoreMatching}%)',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF5B21B6)),
                            ),
                            const SizedBox(height: 12),

                            // If not decided, show action buttons. If already accepted/refused, DO NOT show them!
                            if (!isDecided)
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  ElevatedButton.icon(
                                    onPressed: () => _showDecisionDialog(context, app, 'ACCEPTEE'),
                                    icon: const Icon(Icons.check, size: 16),
                                    label: const Text('Accepter'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.success,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    ),
                                  ),
                                  ElevatedButton.icon(
                                    onPressed: () => _showDecisionDialog(context, app, 'PLANIFIE'),
                                    icon: const Icon(Icons.calendar_month, size: 16),
                                    label: const Text('Entretien'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.indigo,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    ),
                                  ),
                                  OutlinedButton.icon(
                                    onPressed: () => _showDecisionDialog(context, app, 'REFUSEE'),
                                    icon: const Icon(Icons.close, size: 16),
                                    label: const Text('Refuser'),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.danger,
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                    ),
                                  ),
                                ],
                              )
                            else
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: app.statut == 'ACCEPTEE' ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: app.statut == 'ACCEPTEE' ? const Color(0xFFA7F3D0) : const Color(0xFFFECACA),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      app.statut == 'ACCEPTEE' ? Icons.check_circle : Icons.cancel,
                                      size: 16,
                                      color: app.statut == 'ACCEPTEE' ? AppColors.success : AppColors.danger,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      app.statut == 'ACCEPTEE' ? 'Candidature acceptée' : 'Candidature refusée',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: app.statut == 'ACCEPTEE' ? AppColors.success : AppColors.danger,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // 4. INTERVIEWS
  Widget _buildInterviewsTab(BuildContext context, bool isDark) {
    if (_interviews.isEmpty) {
      return const Center(child: Text('Aucun entretien programmé.'));
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
                      interview.candidatNom ?? 'Candidat',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    StatusBadge(status: interview.statut),
                  ],
                ),
                Text(
                  interview.offreTitre,
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const SizedBox(height: 8),
                Text(
                  'Date : ${interview.dateEntretien.replaceFirst('T', ' à ').substring(0, 16)}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                ),
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
                    label: const Text('Démarrer la visioconférence HD'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
