class Application {
  final int id;
  final int candidatId;
  final String candidatNom;
  final String? candidatEmail;
  final String? candidatTelephone;
  final String? candidatCompetences;
  final int offreId;
  final String offreTitre;
  final String nomEntreprise;
  final String offreLocalisation;
  final String offreTypeContrat;
  final String statut; // 'EN_ATTENTE', 'EN_COURS_EXAMEN', 'ACCEPTEE', 'REFUSEE'
  final String? lettreMotivation;
  final String? cvUrlSpecifique;
  final String dateCandidature;
  final String? noteRecruteur;
  final int scoreMatching;
  final double? noteEvaluation;

  Application({
    required this.id,
    required this.candidatId,
    required this.candidatNom,
    this.candidatEmail,
    this.candidatTelephone,
    this.candidatCompetences,
    required this.offreId,
    required this.offreTitre,
    required this.nomEntreprise,
    required this.offreLocalisation,
    required this.offreTypeContrat,
    required this.statut,
    this.lettreMotivation,
    this.cvUrlSpecifique,
    required this.dateCandidature,
    this.noteRecruteur,
    this.scoreMatching = 88,
    this.noteEvaluation,
  });

  factory Application.fromJson(Map<String, dynamic> json) {
    return Application(
      id: json['id'] ?? 0,
      candidatId: json['candidatId'] ?? 0,
      candidatNom: json['candidatNom'] ?? 'Candidat',
      candidatEmail: json['candidatEmail'],
      candidatTelephone: json['candidatTelephone'],
      candidatCompetences: json['candidatCompetences'],
      offreId: json['offreId'] ?? 0,
      offreTitre: json['offreTitre'] ?? 'Offre',
      nomEntreprise: json['nomEntreprise'] ?? 'Entreprise',
      offreLocalisation: json['offreLocalisation'] ?? 'France',
      offreTypeContrat: json['offreTypeContrat'] ?? 'CDI',
      statut: json['statut'] ?? 'EN_ATTENTE',
      lettreMotivation: json['lettreMotivation'],
      cvUrlSpecifique: json['cvUrlSpecifique'],
      dateCandidature: json['dateCandidature'] ?? DateTime.now().toIso8601String(),
      noteRecruteur: json['noteRecruteur'],
      scoreMatching: json['scoreMatching'] ?? 88,
      noteEvaluation: json['noteEvaluation'] != null ? (json['noteEvaluation'] as num).toDouble() : null,
    );
  }

  bool get isAccepted {
    final s = statut.toUpperCase();
    final note = (noteRecruteur ?? '').toLowerCase();
    return s.contains('ACCEPT') || note.contains('accept');
  }
}

