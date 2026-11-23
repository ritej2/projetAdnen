class JobOffer {
  final int id;
  final String titre;
  final String? description;
  final String? missions;
  final String? profilRecherche;
  final String? localisation;
  final String? modeTravail;
  final String? categorie;
  final String typeContrat;
  final String? niveauExperience;
  final String? competencesRequises;
  final double? salaire;
  final double? salaireMax;
  final String statut;
  final String? dateCreation;
  final int? entrepriseId;
  final String nomEntreprise;
  final String? logoEntrepriseUrl;
  final int totalCandidatures;

  JobOffer({
    required this.id,
    required this.titre,
    this.description,
    this.missions,
    this.profilRecherche,
    this.localisation,
    this.modeTravail,
    this.categorie,
    required this.typeContrat,
    this.niveauExperience,
    this.competencesRequises,
    this.salaire,
    this.salaireMax,
    required this.statut,
    this.dateCreation,
    this.entrepriseId,
    required this.nomEntreprise,
    this.logoEntrepriseUrl,
    this.totalCandidatures = 0,
  });

  factory JobOffer.fromJson(Map<String, dynamic> json) {
    return JobOffer(
      id: json['id'] ?? 0,
      titre: json['titre'] ?? '',
      description: json['description'],
      missions: json['missions'],
      profilRecherche: json['profilRecherche'],
      localisation: json['localisation'] ?? 'France',
      modeTravail: json['modeTravail'] ?? 'Hybride',
      categorie: json['categorie'] ?? 'Ingénierie & Tech',
      typeContrat: json['typeContrat'] ?? 'CDI',
      niveauExperience: json['niveauExperience'],
      competencesRequises: json['competencesRequises'],
      salaire: json['salaire'] != null ? (json['salaire'] as num).toDouble() : null,
      salaireMax: json['salaireMax'] != null ? (json['salaireMax'] as num).toDouble() : null,
      statut: json['statut'] ?? 'ACTIVE',
      dateCreation: json['dateCreation'],
      entrepriseId: json['entrepriseId'],
      nomEntreprise: json['nomEntreprise'] ?? 'Entreprise',
      logoEntrepriseUrl: json['logoEntrepriseUrl'],
      totalCandidatures: json['totalCandidatures'] ?? json['nombreCandidatures'] ?? 0,
    );
  }

  JobOffer copyWith({
    int? id,
    String? titre,
    String? description,
    String? missions,
    String? profilRecherche,
    String? localisation,
    String? modeTravail,
    String? categorie,
    String? typeContrat,
    String? niveauExperience,
    String? competencesRequises,
    double? salaire,
    double? salaireMax,
    String? statut,
    String? dateCreation,
    int? entrepriseId,
    String? nomEntreprise,
    String? logoEntrepriseUrl,
    int? totalCandidatures,
  }) {
    return JobOffer(
      id: id ?? this.id,
      titre: titre ?? this.titre,
      description: description ?? this.description,
      missions: missions ?? this.missions,
      profilRecherche: profilRecherche ?? this.profilRecherche,
      localisation: localisation ?? this.localisation,
      modeTravail: modeTravail ?? this.modeTravail,
      categorie: categorie ?? this.categorie,
      typeContrat: typeContrat ?? this.typeContrat,
      niveauExperience: niveauExperience ?? this.niveauExperience,
      competencesRequises: competencesRequises ?? this.competencesRequises,
      salaire: salaire ?? this.salaire,
      salaireMax: salaireMax ?? this.salaireMax,
      statut: statut ?? this.statut,
      dateCreation: dateCreation ?? this.dateCreation,
      entrepriseId: entrepriseId ?? this.entrepriseId,
      nomEntreprise: nomEntreprise ?? this.nomEntreprise,
      logoEntrepriseUrl: logoEntrepriseUrl ?? this.logoEntrepriseUrl,
      totalCandidatures: totalCandidatures ?? this.totalCandidatures,
    );
  }

  String get formattedSalary {
    if (salaire == null) return 'Selon profil';
    if (salaireMax != null && salaireMax! > salaire!) {
      return '${(salaire! / 1000).toStringAsFixed(0)}k€ - ${(salaireMax! / 1000).toStringAsFixed(0)}k€ / an';
    }
    return '${(salaire! / 1000).toStringAsFixed(0)}k€ / an';
  }
}

