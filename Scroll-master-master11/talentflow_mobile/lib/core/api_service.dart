import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'app_constants.dart';
import '../models/user_model.dart';
import '../models/job_offer_model.dart';
import '../models/application_model.dart';
import '../models/interview_model.dart';
import '../models/test_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String _baseUrl = AppConstants.defaultBaseUrl;
  String? _authToken;

  String get baseUrl => _baseUrl;
  String? get authToken => _authToken;

  void setBaseUrl(String url) {
    _baseUrl = url.endsWith('/') ? url.substring(0, url.length - 1) : url;
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  Map<String, String> _headers({bool jsonContent = true}) {
    final Map<String, String> headers = {};
    if (jsonContent) {
      headers['Content-Type'] = 'application/json; charset=UTF-8';
    }
    if (_authToken != null && _authToken!.isNotEmpty) {
      headers['Authorization'] = 'Bearer $_authToken';
    }
    return headers;
  }

  // Helper for requests
  Future<http.Response> _get(String path, {Map<String, dynamic>? queryParams}) async {
    Uri uri = Uri.parse('$_baseUrl$path');
    if (queryParams != null && queryParams.isNotEmpty) {
      uri = uri.replace(queryParameters: queryParams.map((k, v) => MapEntry(k, v.toString())));
    }
    return await http.get(uri, headers: _headers(jsonContent: false));
  }

  Future<http.Response> _post(String path, dynamic body) async {
    final uri = Uri.parse('$_baseUrl$path');
    return await http.post(uri, headers: _headers(), body: jsonEncode(body));
  }

  Future<http.Response> _put(String path, dynamic body) async {
    final uri = Uri.parse('$_baseUrl$path');
    return await http.put(uri, headers: _headers(), body: jsonEncode(body));
  }

  Future<http.Response> _patch(String path, dynamic body) async {
    final uri = Uri.parse('$_baseUrl$path');
    return await http.patch(uri, headers: _headers(), body: jsonEncode(body));
  }

  Future<http.Response> _delete(String path) async {
    final uri = Uri.parse('$_baseUrl$path');
    return await http.delete(uri, headers: _headers(jsonContent: false));
  }

  // 1. PUBLIC STATS
  Future<Map<String, dynamic>> getPublicStats() async {
    try {
      final res = await _get('/api/stats/public');
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (e) {
      debugPrint('Error getting stats: $e');
    }
    return {'activeOffers': 14, 'totalCompanies': 9, 'totalCandidates': 11, 'totalApplications': 28};
  }

  // 2. JOB OFFERS
  Future<List<JobOffer>> getJobOffers({
    int page = 0,
    int size = 20,
    String? keyword,
    String? typeContrat,
    String? localisation,
  }) async {
    try {
      final Map<String, dynamic> params = {'page': page, 'size': size};
      if (keyword != null && keyword.isNotEmpty) params['keyword'] = keyword;
      if (typeContrat != null && typeContrat != 'ALL' && typeContrat.isNotEmpty) {
        params['typeContrat'] = typeContrat;
      }
      if (localisation != null && localisation.isNotEmpty) {
        params['localisation'] = localisation;
      }

      final res = await _get('/api/offres', queryParams: params);
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        final List list = data['content'] ?? (data is List ? data : []);
        return list.map((item) => JobOffer.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting job offers: $e');
    }
    return [];
  }

  Future<JobOffer?> getJobOffer(int id) async {
    try {
      final res = await _get('/api/offres/$id');
      if (res.statusCode == 200) {
        return JobOffer.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
      }
    } catch (e) {
      debugPrint('Error getting offer #$id: $e');
    }
    return null;
  }

  Future<bool> createJobOffer(Map<String, dynamic> payload) async {
    try {
      final res = await _post('/api/offres', payload);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error creating offer: $e');
      return false;
    }
  }

  Future<bool> deleteJobOffer(int id) async {
    try {
      final res = await _delete('/api/offres/$id');
      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('Error deleting offer: $e');
      return false;
    }
  }

  Future<bool> moderateJobOffer(int id, String statut) async {
    try {
      final res = await _patch('/api/offres/$id/statut', {'statut': statut});
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('Error moderating offer: $e');
      return false;
    }
  }

  // 3. COMPANIES & CANDIDATES
  Future<List<Entreprise>> getCompanies() async {
    try {
      final res = await _get('/api/entreprises');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => Entreprise.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting companies: $e');
    }
    return [];
  }

  // 4. USER & PROFILE
  Future<Map<String, dynamic>?> getCurrentUser() async {
    try {
      final res = await _get('/api/users/me');
      if (res.statusCode == 200) {
        return jsonDecode(utf8.decode(res.bodyBytes));
      }
    } catch (e) {
      debugPrint('Error getting me: $e');
    }
    return null;
  }

  Future<bool> updateProfile(Map<String, dynamic> payload) async {
    try {
      final res = await _put('/api/users/me', payload);
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating profile: $e');
      return false;
    }
  }

  Future<bool> registerUser(Map<String, dynamic> payload) async {
    try {
      final res = await _post('/api/users/register', payload);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error registering user: $e');
      return false;
    }
  }

  // 5. APPLICATIONS
  Future<List<Application>> getCandidateApplications() async {
    try {
      final res = await _get('/api/candidatures/mes-candidatures');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => Application.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting candidate applications: $e');
    }
    return [];
  }

  Future<List<Application>> getCompanyApplications() async {
    try {
      final res = await _get('/api/candidatures/entreprise');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => Application.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting company applications: $e');
    }
    return [];
  }

  Future<bool> submitApplication({
    required int offreId,
    String? lettreMotivation,
    String? cvUrlSpecifique,
  }) async {
    try {
      final res = await _post('/api/candidatures', {
        'offreId': offreId,
        'lettreMotivation': lettreMotivation,
        'cvUrlSpecifique': cvUrlSpecifique,
      });
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting application: $e');
      return false;
    }
  }

  Future<bool> updateApplicationStatus(
    int applicationId,
    String statut, {
    String? noteRecruteur,
  }) async {
    try {
      final payload = {'statut': statut};
      if (noteRecruteur != null) payload['noteRecruteur'] = noteRecruteur;
      final res = await _patch('/api/candidatures/$applicationId/statut', payload);
      return res.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating application status: $e');
      return false;
    }
  }

  // 6. INTERVIEWS
  Future<List<Interview>> getCandidateInterviews() async {
    try {
      final res = await _get('/api/entretiens/mes-entretiens');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => Interview.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting candidate interviews: $e');
    }
    return [];
  }

  Future<List<Interview>> getCompanyInterviews() async {
    try {
      final res = await _get('/api/entretiens/entreprise');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => Interview.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting company interviews: $e');
    }
    return [];
  }

  Future<bool> scheduleInterview(Map<String, dynamic> payload) async {
    try {
      final res = await _post('/api/entretiens', payload);
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error scheduling interview: $e');
      return false;
    }
  }

  // 7. FAVORITES
  Future<List<int>> getFavorites() async {
    try {
      final res = await _get('/api/favoris');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => (item['offre']['id'] as num).toInt()).toList();
      }
    } catch (e) {
      debugPrint('Error getting favorites: $e');
    }
    return [];
  }

  Future<bool> addFavorite(int offreId) async {
    try {
      final res = await _post('/api/favoris/$offreId', {});
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      debugPrint('Error adding favorite: $e');
      return false;
    }
  }

  Future<bool> removeFavorite(int offreId) async {
    try {
      final res = await _delete('/api/favoris/$offreId');
      return res.statusCode == 200 || res.statusCode == 204;
    } catch (e) {
      debugPrint('Error removing favorite: $e');
      return false;
    }
  }

  // 8. TECHNICAL TESTS & QCM
  Future<TestTechnique?> getTestForOffer(int offreId) async {
    try {
      final res = await _get('/api/evaluations-tests/tests/offre/$offreId');
      if (res.statusCode == 200) {
        final data = jsonDecode(utf8.decode(res.bodyBytes));
        if (data is List && data.isNotEmpty) {
          return TestTechnique.fromJson(data[0]);
        } else if (data is Map<String, dynamic>) {
          return TestTechnique.fromJson(data);
        }
      }
    } catch (e) {
      debugPrint('Error getting test: $e');
    }

    // Default professional test if none exists in backend yet
    return TestTechnique(
      id: 1000 + offreId,
      offreId: offreId,
      titre: 'Évaluation Technique & Compétences',
      description: 'Test d’aptitude technique et logique pour valider votre candidature.',
      dureeMinutes: 15,
      scoreMinimum: 60,
      questions: [
        QuestionQcm(
          id: 1,
          question: 'Quelle est la différence fondamentale entre interface et classe abstraite en Java / TypeScript ?',
          options: [
            'Une interface ne peut contenir aucune implémentation par défaut',
            'Une classe peut implémenter plusieurs interfaces mais hériter d’une seule classe',
            'Les interfaces sont plus lentes à l’exécution',
            'Aucune différence, c’est strictement identique',
          ],
          reponseCorrecte: 1,
          explication: 'L’héritage multiple de types se fait via les interfaces.',
        ),
        QuestionQcm(
          id: 2,
          question: 'En architecture REST, quel verbe HTTP est recommandé pour modifier partiellement une ressource ?',
          options: ['POST', 'PUT', 'PATCH', 'OPTIONS'],
          reponseCorrecte: 2,
          explication: 'PATCH est utilisé pour les mises à jour partielles, tandis que PUT remplace toute la ressource.',
        ),
        QuestionQcm(
          id: 3,
          question: 'Quel est le rôle principal d’un index dans une base de données MySQL ?',
          options: [
            'Sécuriser les transactions bancaires',
            'Accélérer la recherche et la récupération des données',
            'Compresser les fichiers sur le disque dur',
            'Empêcher les injections SQL',
          ],
          reponseCorrecte: 1,
          explication: 'Les index B-Tree permettent de rechercher des lignes en temps logarithmique O(log n).',
        ),
        QuestionQcm(
          id: 4,
          question: 'Dans une application moderne, que garantit l’acronyme ACID pour les transactions SQL ?',
          options: [
            'Atomicité, Cohérence, Isolation, Durabilité',
            'Accès, Contrôle, Intégrité, Distribution',
            'Asynchronisme, Cache, Index, Débit',
            'Authentification, Chiffrement, Identité, Données',
          ],
          reponseCorrecte: 0,
          explication: 'ACID garantit la robustesse et la fiabilité des opérations transactionnelles.',
        ),
      ],
    );
  }

  Future<List<PassageTest>> getCandidatePassages() async {
    try {
      final res = await _get('/api/evaluations-tests/passages/mes-passages');
      if (res.statusCode == 200) {
        final List list = jsonDecode(utf8.decode(res.bodyBytes));
        return list.map((item) => PassageTest.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error getting candidate passages: $e');
    }
    return [];
  }

  Future<PassageTest?> submitTestAnswers(
    int testId,
    int candidatureId,
    List<int> reponses,
  ) async {
    try {
      final res = await _post('/api/evaluations-tests/passages', {
        'testId': testId,
        'candidatureId': candidatureId,
        'reponses': reponses,
      });
      if (res.statusCode == 200 || res.statusCode == 201) {
        return PassageTest.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
      }
    } catch (e) {
      debugPrint('Error submitting test answers: $e');
    }
    return null;
  }
}
