import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/api_service.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../models/job_offer_model.dart';
import '../providers/auth_provider.dart';
import '../providers/jobs_provider.dart';
import 'auth_screen.dart';

class JobDetailScreen extends StatefulWidget {
  final int offerId;
  final JobOffer? initialOffer;

  const JobDetailScreen({
    super.key,
    required this.offerId,
    this.initialOffer,
  });

  @override
  State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  JobOffer? _offer;
  bool _loading = true;
  bool _hasApplied = false;

  @override
  void initState() {
    super.initState();
    _offer = widget.initialOffer;
    _loadOfferDetail();
    _checkIfAlreadyApplied();
  }

  Future<void> _checkIfAlreadyApplied() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (auth.isAuthenticated && auth.isCandidat) {
      final myApps = await ApiService().getCandidateApplications();
      if (mounted) {
        setState(() {
          _hasApplied = myApps.any((a) => a.offreId == widget.offerId);
        });
      }
    }
  }

  Future<void> _loadOfferDetail() async {
    final offer = await ApiService().getJobOffer(widget.offerId);
    if (mounted) {
      setState(() {
        if (offer != null) _offer = offer;
        _loading = false;
      });
    }
  }

  void _showApplyBottomSheet(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    if (!auth.isAuthenticated) {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const AuthScreen()),
      );
      return;
    }

    final letterController = TextEditingController(
      text: "Madame, Monsieur,\n\n"
          "Fort(e) d'une solide expérience sur les technologies requises pour le poste de « ${_offer?.titre} » chez ${_offer?.nomEntreprise}, "
          "je souhaite mettre mes compétences au service de vos projets innovants.\n\n"
          "Disponible rapidement pour un échange technique, je vous joins mon profil complet.\n\n"
          "Cordialement,\n${auth.user?.nom ?? 'Candidat'}",
    );

    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Postuler à cette offre',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _offer?.titre ?? '',
                      style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                    const SizedBox(height: 16),

                    // Pre-filled CV Info box
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.picture_as_pdf, color: AppColors.primary, size: 24),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'CV Candidat Officiel (PDF)',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                                Text(
                                  'Profil : ${auth.candidat?.titreProfil ?? "Ingénieur Full Stack"}',
                                  style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    const Text(
                      'Message / Lettre de motivation :',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: letterController,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText: 'Expliquez pourquoi vous êtes le candidat idéal...',
                      ),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: submitting
                            ? null
                            : () async {
                                setModalState(() => submitting = true);
                                final success = await ApiService().submitApplication(
                                  offreId: widget.offerId,
                                  lettreMotivation: letterController.text.trim(),
                                  cvUrlSpecifique: auth.candidat?.cvUrl ??
                                      'https://talentflow.io/cv/cv-marie-dubois.pdf',
                                );
                                setModalState(() => submitting = false);
                                if (context.mounted) {
                                  Navigator.pop(context);
                                  if (success) {
                                    setState(() {
                                      _hasApplied = true;
                                      if (_offer != null) {
                                        _offer = _offer!.copyWith(
                                          totalCandidatures: _offer!.totalCandidatures + 1,
                                        );
                                      }
                                    });
                                  }
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      backgroundColor: success ? AppColors.success : AppColors.danger,
                                      content: Text(
                                        success
                                            ? 'Candidature envoyée avec succès au recruteur !'
                                            : 'Erreur lors de l’envoi de la candidature.',
                                      ),
                                    ),
                                  );
                                }
                              },
                        child: submitting
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Envoyer ma candidature'),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final jobs = Provider.of<JobsProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isFav = jobs.isFavorite(widget.offerId);

    if (_loading && _offer == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final offer = _offer!;

    return Directionality(
      textDirection: lang.textDirection,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Détail de l’offre'),
          actions: [
            IconButton(
              icon: Icon(
                isFav ? Icons.bookmark : Icons.bookmark_border,
                color: isFav ? AppColors.danger : AppColors.primary,
              ),
              onPressed: () => jobs.toggleFavorite(offer.id),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Container(
                              width: 56,
                              height: 56,
                              color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                              child: Image.asset(
                                'assets/images/company-${(offer.id % 5) + 1}.png',
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Icon(Icons.business, color: AppColors.primary),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  offer.titre,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  offer.nomEntreprise,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          _buildChip(offer.typeContrat, AppColors.indigo),
                          _buildChip(offer.localisation ?? 'France', AppColors.textSecondary, icon: Icons.location_on_outlined),
                          _buildChip(offer.modeTravail ?? 'Hybride', AppColors.success),
                          _buildChip(offer.formattedSalary, AppColors.primary),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Description section
              _buildSectionTitle('Description du poste'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    offer.description ??
                        'Rejoignez notre équipe technique en pleine croissance pour concevoir et faire évoluer des architectures logicielles haute performance.',
                    style: TextStyle(
                      fontSize: 14,
                      height: 1.6,
                      color: isDark ? Colors.white70 : AppColors.textPrimary,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Missions section
              if (offer.missions != null && offer.missions!.isNotEmpty) ...[
                _buildSectionTitle('Missions principales'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      offer.missions!,
                      style: TextStyle(
                        fontSize: 14,
                        height: 1.6,
                        color: isDark ? Colors.white70 : AppColors.textPrimary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Profil & Compétences
              _buildSectionTitle('Profil recherché & Compétences'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (offer.profilRecherche != null && offer.profilRecherche!.isNotEmpty)
                        Text(
                          offer.profilRecherche!,
                          style: TextStyle(
                            fontSize: 14,
                            height: 1.6,
                            color: isDark ? Colors.white70 : AppColors.textPrimary,
                          ),
                        ),
                      if (offer.competencesRequises != null && offer.competencesRequises!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        const Text(
                          'Compétences requises :',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: offer.competencesRequises!
                              .split(',')
                              .map((c) => Chip(
                                    label: Text(c.trim(), style: const TextStyle(fontSize: 11)),
                                    backgroundColor: isDark ? AppColors.borderDark : const Color(0xFFEEF2FF),
                                    side: BorderSide.none,
                                    padding: EdgeInsets.zero,
                                  ))
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 80),
            ],
          ),
        ),
        bottomSheet: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : Colors.white,
            boxShadow: const [BoxShadow(color: Color(0x1A000000), blurRadius: 10, offset: Offset(0, -2))],
          ),
          child: Row(
            children: [
              Expanded(
                child: _hasApplied
                    ? ElevatedButton.icon(
                        onPressed: null,
                        icon: const Icon(Icons.check_circle, color: AppColors.success),
                        label: const Text('Déjà postulé à cette offre'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF1F5F9),
                          disabledBackgroundColor: const Color(0xFFF1F5F9),
                          disabledForegroundColor: const Color(0xFF475569),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      )
                    : ElevatedButton.icon(
                        onPressed: () => _showApplyBottomSheet(context),
                        icon: const Icon(Icons.send),
                        label: const Text('Postuler maintenant'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title,
        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildChip(String text, Color col, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: col.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 13, color: col),
            const SizedBox(width: 4),
          ],
          Text(
            text,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: col),
          ),
        ],
      ),
    );
  }
}
