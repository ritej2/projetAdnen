import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_service.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../models/job_offer_model.dart';
import '../providers/auth_provider.dart';
import '../widgets/status_badge.dart';
import '../widgets/kpi_card.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  final ApiService _api = ApiService();
  Map<String, dynamic> _stats = {};
  List<JobOffer> _offers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAdminData();
  }

  Future<void> _loadAdminData() async {
    setState(() => _loading = true);
    final stats = await _api.getPublicStats();
    final offers = await _api.getJobOffers(size: 50);
    if (mounted) {
      setState(() {
        _stats = stats;
        _offers = offers;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);

    return Directionality(
      textDirection: lang.textDirection,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Console d’Administration'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _loadAdminData,
            ),
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadAdminData,
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Admin Profile Badge
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: const Color(0xFFFCA5A5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.admin_panel_settings, color: Color(0xFFB91C1C), size: 28),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    auth.user?.nom ?? 'Alexandre Moreau (Administrateur)',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: Color(0xFFB91C1C),
                                    ),
                                  ),
                                  const Text(
                                    'Base MySQL : scroll_master · Port 8081 · Supervision en direct',
                                    style: TextStyle(fontSize: 11, color: Color(0xFF991B1B)),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Platform Statistics
                      const Text(
                        'Statistiques Globales de la Plateforme',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 10),
                      GridView.count(
                        crossAxisCount: 2,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                        childAspectRatio: 1.8,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          KpiCard(
                            label: 'Offres d’emploi actives',
                            value: '${_stats['activeOffers'] ?? 14}',
                            icon: Icons.work,
                            color: AppColors.primary,
                            bgColor: AppColors.primaryLight,
                          ),
                          KpiCard(
                            label: 'Entreprises enregistrées',
                            value: '${_stats['totalCompanies'] ?? 9}',
                            icon: Icons.business,
                            color: AppColors.success,
                            bgColor: AppColors.successLight,
                          ),
                          KpiCard(
                            label: 'Candidats inscrits',
                            value: '${_stats['totalCandidates'] ?? 11}',
                            icon: Icons.people,
                            color: AppColors.warning,
                            bgColor: AppColors.warningLight,
                          ),
                          KpiCard(
                            label: 'Candidatures transmises',
                            value: '${_stats['totalApplications'] ?? 28}',
                            icon: Icons.assignment_turned_in,
                            color: AppColors.indigo,
                            bgColor: AppColors.indigoLight,
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Moderation list
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Modération des Offres (${_offers.length})',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),

                      ..._offers.map((offer) {
                        return Card(
                          margin: const EdgeInsets.only(bottom: 10),
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        offer.titre,
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                    ),
                                    StatusBadge(status: offer.statut),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${offer.nomEntreprise} · ${offer.localisation ?? "France"}',
                                  style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    if (offer.statut == 'ACTIVE')
                                      TextButton.icon(
                                        onPressed: () async {
                                          await _api.moderateJobOffer(offer.id, 'SUSPENDUE');
                                          _loadAdminData();
                                        },
                                        icon: const Icon(Icons.pause, size: 16, color: AppColors.warning),
                                        label: const Text('Suspendre', style: TextStyle(color: AppColors.warning, fontSize: 12)),
                                      )
                                    else
                                      TextButton.icon(
                                        onPressed: () async {
                                          await _api.moderateJobOffer(offer.id, 'ACTIVE');
                                          _loadAdminData();
                                        },
                                        icon: const Icon(Icons.play_arrow, size: 16, color: AppColors.success),
                                        label: const Text('Activer', style: TextStyle(color: AppColors.success, fontSize: 12)),
                                      ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.danger),
                                      onPressed: () async {
                                        await _api.deleteJobOffer(offer.id);
                                        _loadAdminData();
                                      },
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
