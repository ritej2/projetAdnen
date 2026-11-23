import 'package:flutter/material.dart';
import '../core/api_service.dart';
import '../models/job_offer_model.dart';
import '../models/user_model.dart';

class JobsProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  List<JobOffer> _offers = [];
  List<Entreprise> _companies = [];
  Map<String, dynamic> _stats = {
    'activeOffers': 14,
    'totalCompanies': 9,
    'totalCandidates': 11,
    'totalApplications': 28,
  };
  List<int> _favoriteIds = [];

  bool _loading = false;
  String? _selectedContract = 'ALL';
  String _searchKeyword = '';
  String _searchLocation = '';

  List<JobOffer> get offers => _offers;
  List<Entreprise> get companies => _companies;
  Map<String, dynamic> get stats => _stats;
  List<int> get favoriteIds => _favoriteIds;
  bool get loading => _loading;

  String? get selectedContract => _selectedContract;
  String get searchKeyword => _searchKeyword;
  String get searchLocation => _searchLocation;

  JobsProvider() {
    loadInitialData();
  }

  Future<void> loadInitialData() async {
    _loading = true;
    notifyListeners();

    await Future.wait([
      fetchStats(),
      fetchOffers(),
      fetchCompanies(),
      fetchFavorites(),
    ]);

    _loading = false;
    notifyListeners();
  }

  Future<void> fetchStats() async {
    _stats = await _api.getPublicStats();
    notifyListeners();
  }

  Future<void> fetchOffers() async {
    _offers = await _api.getJobOffers(
      keyword: _searchKeyword,
      typeContrat: _selectedContract,
      localisation: _searchLocation,
    );
    notifyListeners();
  }

  Future<void> fetchCompanies() async {
    _companies = await _api.getCompanies();
    notifyListeners();
  }

  Future<void> fetchFavorites() async {
    _favoriteIds = await _api.getFavorites();
    notifyListeners();
  }

  void setFilterContract(String? contract) {
    _selectedContract = contract;
    fetchOffers();
  }

  void setSearchParams(String keyword, String location) {
    _searchKeyword = keyword;
    _searchLocation = location;
    fetchOffers();
  }

  void resetFilters() {
    _selectedContract = 'ALL';
    _searchKeyword = '';
    _searchLocation = '';
    fetchOffers();
  }

  bool isFavorite(int offerId) => _favoriteIds.contains(offerId);

  Future<void> toggleFavorite(int offerId) async {
    if (isFavorite(offerId)) {
      _favoriteIds.remove(offerId);
      notifyListeners();
      await _api.removeFavorite(offerId);
    } else {
      _favoriteIds.add(offerId);
      notifyListeners();
      await _api.addFavorite(offerId);
    }
  }
}

