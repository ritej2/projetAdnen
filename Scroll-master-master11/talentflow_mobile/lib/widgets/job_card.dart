import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_theme.dart';
import '../models/job_offer_model.dart';
import '../providers/jobs_provider.dart';
import '../screens/job_detail_screen.dart';

class JobCard extends StatelessWidget {
  final JobOffer offer;

  const JobCard({super.key, required this.offer});

  String _getCompanyLogoAsset(int id) {
    final idx = (id % 5) + 1;
    return 'assets/images/company-$idx.png';
  }

  @override
  Widget build(BuildContext context) {
    final jobsProvider = Provider.of<JobsProvider>(context);
    final isFav = jobsProvider.isFavorite(offer.id);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => JobDetailScreen(offerId: offer.id, initialOffer: offer),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Company Logo + Title & Company + Favorite Button
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Company Logo
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: 48,
                      height: 48,
                      color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                      child: Image.asset(
                        _getCompanyLogoAsset(offer.id),
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.business,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Job Title & Company
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          offer.titre,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : AppColors.textPrimary,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          offer.nomEntreprise,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Bookmark button
                  IconButton(
                    icon: Icon(
                      isFav ? Icons.bookmark : Icons.bookmark_border,
                      color: isFav ? AppColors.danger : AppColors.textSecondary,
                    ),
                    onPressed: () => jobsProvider.toggleFavorite(offer.id),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Tags Row: Contract, Location, Remote mode
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _buildTag(
                    offer.typeContrat,
                    isDark ? AppColors.borderDark : const Color(0xFFEEF2FF),
                    AppColors.indigo,
                  ),
                  _buildTag(
                    offer.localisation ?? 'France',
                    isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                    AppColors.textSecondary,
                    icon: Icons.location_on_outlined,
                  ),
                  if (offer.modeTravail != null && offer.modeTravail!.isNotEmpty)
                    _buildTag(
                      offer.modeTravail!,
                      isDark ? AppColors.borderDark : const Color(0xFFF0FDF4),
                      AppColors.success,
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Bottom Row: Salary + Date / Applied tag
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    offer.formattedSalary,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  Row(
                    children: [
                      const Icon(Icons.people_alt_outlined, size: 14, color: AppColors.textSecondary),
                      const SizedBox(width: 4),
                      Text(
                        '${offer.totalCandidatures} postulants',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => JobDetailScreen(offerId: offer.id, initialOffer: offer),
                      ),
                    );
                  },
                  icon: const Icon(Icons.send_rounded, size: 16),
                  label: const Text(
                    'Postuler à cette offre',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text, Color bg, Color textCol, {IconData? icon}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: textCol),
            const SizedBox(width: 3),
          ],
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: textCol,
            ),
          ),
        ],
      ),
    );
  }
}
