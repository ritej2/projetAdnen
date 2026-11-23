import 'package:flutter/foundation.dart';

class AppConstants {
  static const String appName = 'Superio';
  static const String appTagline = 'Plateforme Recrutement & Carrières';
  
  // Base API URL
  // On Android emulator, localhost is 10.0.2.2; on Windows desktop / Web it is localhost:8081
  static String get defaultBaseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:8081';
    }
    return 'http://localhost:8081';
  }

  // Demo Accounts (identical to React web project)
  static const Map<String, Map<String, String>> demoAccounts = {
    'ADMIN': {
      'email': 'admin@talentflow.io',
      'password': 'Password123!',
      'name': 'Alexandre Moreau',
      'role': 'ADMIN',
      'uid': 'uid-admin-1',
    },
    'ENTREPRISE': {
      'email': 'recrutement@novastudio.io',
      'password': 'Password123!',
      'name': 'Sophie Mercier (Nova Studio)',
      'role': 'ENTREPRISE',
      'uid': 'uid-entreprise-1',
    },
    'CANDIDAT': {
      'email': 'marie.dubois@talentflow.io',
      'password': 'Password123!',
      'name': 'Marie Dubois',
      'role': 'CANDIDAT',
      'uid': 'uid-candidat-1',
    },
  };
}

