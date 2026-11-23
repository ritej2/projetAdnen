import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_service.dart';
import '../core/app_constants.dart';
import '../models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService();

  Utilisateur? _user;
  Candidat? _candidat;
  Entreprise? _entreprise;
  bool _loading = false;
  String? _errorMessage;

  Utilisateur? get user => _user;
  Candidat? get candidat => _candidat;
  Entreprise? get entreprise => _entreprise;
  bool get loading => _loading;
  String? get errorMessage => _errorMessage;

  bool get isAuthenticated => _user != null;
  bool get isAdmin => _user?.role == 'ADMIN';
  bool get isEntreprise => _user?.role == 'ENTREPRISE';
  bool get isCandidat => _user?.role == 'CANDIDAT';

  AuthProvider() {
    _initAuth();
  }

  Future<void> _initAuth() async {
    _loading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jf_auth_token');
      if (token != null && token.isNotEmpty) {
        _api.setAuthToken(token);
        await refreshProfile();
      }
    } catch (e) {
      debugPrint('Error initializing auth: $e');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> refreshProfile() async {
    try {
      final data = await _api.getCurrentUser();
      if (data != null && data['user'] != null) {
        _user = Utilisateur.fromJson(data['user']);
        if (data['candidat'] != null) {
          _candidat = Candidat.fromJson(data['candidat']);
        } else {
          _candidat = null;
        }
        if (data['entreprise'] != null) {
          _entreprise = Entreprise.fromJson(data['entreprise']);
        } else {
          _entreprise = null;
        }
        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Error refreshing profile: $e');
    }
    return false;
  }

  // 1-Click Demo Login
  Future<bool> loginAsDemoRole(String role) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final demo = AppConstants.demoAccounts[role];
      if (demo == null) throw Exception('Rôle démo inconnu');

      final token = 'dev-token:${demo['uid']}:${demo['email']}:${demo['name']}';
      _api.setAuthToken(token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jf_auth_token', token);

      final ok = await refreshProfile();
      if (!ok) {
        // Fallback local mock user if backend is booting
        _user = Utilisateur(
          id: role == 'ADMIN' ? 1 : role == 'ENTREPRISE' ? 2 : 3,
          firebaseUid: demo['uid']!,
          nom: demo['name']!,
          email: demo['email']!,
          role: role,
        );
        if (role == 'ENTREPRISE') {
          _entreprise = Entreprise(
            id: 1,
            utilisateurId: 2,
            nomEntreprise: 'Nova Studio',
            secteur: 'Design & Technologie Web',
            logoUrl: 'assets/images/company-1.png',
          );
        } else if (role == 'CANDIDAT') {
          _candidat = Candidat(
            id: 1,
            utilisateurId: 3,
            titreProfil: 'Ingénieur Logiciel Full Stack',
            adresse: 'Paris, France',
            competences: 'Java, Spring Boot, React, TypeScript, Flutter, MySQL',
            completionPercentage: 100,
          );
        }
      }

      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // Regular Email/Password Login
  Future<bool> login(String email, String password) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanEmail = email.trim().toLowerCase();

      // Check for demo accounts
      for (final role in AppConstants.demoAccounts.keys) {
        if (AppConstants.demoAccounts[role]!['email'] == cleanEmail) {
          return await loginAsDemoRole(role);
        }
      }

      // Generate local dev token
      final token = 'dev-token:uid-${cleanEmail.replaceAll(RegExp(r'[^a-z0-9]'), '-')}:$cleanEmail:${cleanEmail.split('@')[0]}';
      _api.setAuthToken(token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('jf_auth_token', token);

      final ok = await refreshProfile();
      if (!ok) {
        _errorMessage = 'Identifiants incorrects ou utilisateur introuvable.';
        await logout();
        _loading = false;
        notifyListeners();
        return false;
      }

      _loading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  // Register
  Future<bool> register({
    required String nom,
    required String email,
    required String password,
    required String role,
    String? telephone,
    String? nomEntreprise,
    String? secteur,
    String? titreProfil,
    String? logoUrl,
    String? photoUrl,
  }) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final cleanEmail = email.trim().toLowerCase();
      final payload = {
        'nom': nom,
        'email': cleanEmail,
        'password': password,
        'role': role,
        'telephone': telephone,
        'nomEntreprise': nomEntreprise,
        'secteur': secteur,
        'titreProfil': titreProfil,
        'logoUrl': logoUrl,
        'photoUrl': photoUrl,
      };

      final ok = await _api.registerUser(payload);
      if (ok) {
        // Auto-login after registration
        return await login(cleanEmail, password);
      } else {
        _errorMessage = 'Échec de l’inscription. Veuillez vérifier vos données.';
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _loading = false;
      notifyListeners();
    }
    return false;
  }

  // Logout
  Future<void> logout() async {
    _user = null;
    _candidat = null;
    _entreprise = null;
    _api.setAuthToken(null);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jf_auth_token');
    notifyListeners();
  }
}

