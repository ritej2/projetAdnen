import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../core/app_theme.dart';
import '../core/language_provider.dart';
import '../providers/jobs_provider.dart';
import '../widgets/app_header.dart';
import '../widgets/job_card.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<String> _contractFilters = [
    'ALL',
    'CDI',
    'CDD',
    'Stage',
    'Alternance',
    'Freelance',
  ];

  @override
  void initState() {
    super.initState();
    final jobs = Provider.of<JobsProvider>(context, listen: false);
    _searchController.text = jobs.searchKeyword;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final jobs = Provider.of<JobsProvider>(context);
    final lang = Provider.of<LanguageProvider>(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Directionality(
      textDirection: lang.textDirection,
      child: Scaffold(
        appBar: AppHeader(
          title: lang.t('Offres d’emploi'),
          showBack: true,
        ),
        body: Column(
          children: [
            // Search Input Header
            Container(
              padding: const EdgeInsets.all(16),
              color: isDark ? AppColors.cardDark : Colors.white,
              child: Column(
                children: [
                  TextField(
                    controller: _searchController,
                    onSubmitted: (val) {
                      jobs.setSearchParams(val.trim(), jobs.searchLocation);
                    },
                    decoration: InputDecoration(
                      hintText: lang.t('Titre du poste, compétence, entreprise...'),
                      prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              onPressed: () {
                                _searchController.clear();
                                jobs.setSearchParams('', jobs.searchLocation);
                              },
                            )
                          : null,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Filter Chips
                  SizedBox(
                    height: 36,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: _contractFilters.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final filter = _contractFilters[idx];
                        final isSelected = jobs.selectedContract == filter ||
                            (filter == 'ALL' && (jobs.selectedContract == null || jobs.selectedContract == 'ALL'));

                        return ChoiceChip(
                          label: Text(
                            filter == 'ALL' ? 'Tous les contrats' : filter,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? Colors.white : AppColors.textPrimary,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: AppColors.primary,
                          backgroundColor: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
                          onSelected: (_) => jobs.setFilterContract(filter == 'ALL' ? null : filter),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),

            // Results count banner
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${jobs.offers.length} ${lang.t('offres d’emploi vérifiées prêtes pour vous')}',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark ? Colors.white70 : AppColors.textSecondary,
                    ),
                  ),
                  if (jobs.searchKeyword.isNotEmpty || jobs.selectedContract != null)
                    TextButton(
                      onPressed: () {
                        _searchController.clear();
                        jobs.resetFilters();
                      },
                      style: TextButton.styleFrom(padding: EdgeInsets.zero),
                      child: const Text('Réinitialiser', style: TextStyle(fontSize: 12)),
                    ),
                ],
              ),
            ),

            // Job Offers List
            Expanded(
              child: RefreshIndicator(
                onRefresh: () => jobs.fetchOffers(),
                color: AppColors.primary,
                child: jobs.loading && jobs.offers.isEmpty
                    ? const Center(child: CircularProgressIndicator())
                    : jobs.offers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.search_off, size: 64, color: AppColors.textSecondary),
                                const SizedBox(height: 12),
                                const Text(
                                  'Aucune offre ne correspond à vos critères.',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                ElevatedButton(
                                  onPressed: () {
                                    _searchController.clear();
                                    jobs.resetFilters();
                                  },
                                  child: const Text('Voir toutes les offres'),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            itemCount: jobs.offers.length,
                            itemBuilder: (context, idx) {
                              return JobCard(offer: jobs.offers[idx]);
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
