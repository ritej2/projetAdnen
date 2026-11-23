class Utilisateur {
  final int id;
  final String firebaseUid;
  final String nom;
  final String email;
  final String? telephone;
  final String role; // 'CANDIDAT', 'ENTREPRISE', 'ADMIN'
  final String? dateCreation;

  Utilisateur({
    required this.id,
    required this.firebaseUid,
    required this.nom,
    required this.email,
    this.telephone,
    required this.role,
    this.dateCreation,
  });

  factory Utilisateur.fromJson(Map<String, dynamic> json) {
    return Utilisateur(
      id: json['id'] ?? 0,
      firebaseUid: json['firebaseUid'] ?? '',
      nom: json['nom'] ?? '',
      email: json['email'] ?? '',
      telephone: json['telephone'],
      role: json['role'] ?? 'CANDIDAT',
      dateCreation: json['dateCreation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firebaseUid': firebaseUid,
      'nom': nom,
      'email': email,
      'telephone': telephone,
      'role': role,
      'dateCreation': dateCreation,
    };
  }
}

class Candidat {
  final int id;
  final int utilisateurId;
  final String? titreProfil;
  final String? adresse;
  final String? competences;
  final String? bio;
  final String? cvUrl;
  final int completionPercentage;

  Candidat({
    required this.id,
    required this.utilisateurId,
    this.titreProfil,
    this.adresse,
    this.competences,
    this.bio,
    this.cvUrl,
    this.completionPercentage = 85,
  });

  factory Candidat.fromJson(Map<String, dynamic> json) {
    return Candidat(
      id: json['id'] ?? 0,
      utilisateurId: json['utilisateurId'] ?? 0,
      titreProfil: json['titreProfil'],
      adresse: json['adresse'],
      competences: json['competences'],
      bio: json['bio'],
      cvUrl: json['cvUrl'],
      completionPercentage: json['completionPercentage'] ?? 85,
    );
  }
}

class Entreprise {
  final int id;
  final int utilisateurId;
  final String nomEntreprise;
  final String? secteur;
  final String? siteWeb;
  final String? logoUrl;
  final String? description;
  final String? adresse;

  Entreprise({
    required this.id,
    required this.utilisateurId,
    required this.nomEntreprise,
    this.secteur,
    this.siteWeb,
    this.logoUrl,
    this.description,
    this.adresse,
  });

  factory Entreprise.fromJson(Map<String, dynamic> json) {
    return Entreprise(
      id: json['id'] ?? 0,
      utilisateurId: json['utilisateurId'] ?? 0,
      nomEntreprise: json['nomEntreprise'] ?? '',
      secteur: json['secteur'],
      siteWeb: json['siteWeb'],
      logoUrl: json['logoUrl'],
      description: json['description'],
      adresse: json['adresse'],
    );
  }
}

