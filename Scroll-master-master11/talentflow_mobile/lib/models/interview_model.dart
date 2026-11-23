class Interview {
  final int id;
  final int? candidatureId;
  final String? candidatNom;
  final String nomEntreprise;
  final String offreTitre;
  final String dateEntretien;
  final String? commentaire;
  final String statut; // 'PLANIFIE', 'TERMINE', 'ANNULE'
  final String? lienVisioconference;

  Interview({
    required this.id,
    this.candidatureId,
    this.candidatNom,
    required this.nomEntreprise,
    required this.offreTitre,
    required this.dateEntretien,
    this.commentaire,
    required this.statut,
    this.lienVisioconference,
  });

  factory Interview.fromJson(Map<String, dynamic> json) {
    return Interview(
      id: json['id'] ?? 0,
      candidatureId: json['candidatureId'],
      candidatNom: json['candidatNom'],
      nomEntreprise: json['nomEntreprise'] ?? 'Entreprise',
      offreTitre: json['offreTitre'] ?? 'Entretien Recrutement',
      dateEntretien: json['dateEntretien'] ?? DateTime.now().toIso8601String(),
      commentaire: json['commentaire'],
      statut: json['statut'] ?? 'PLANIFIE',
      lienVisioconference: json['lienVisioconference'] ??
          'https://meet.jit.si/JobFlow-Entretien-${json['id'] ?? 101}',
    );
  }

  String get jitsiMeetingUrl {
    if (lienVisioconference != null && lienVisioconference!.startsWith('http')) {
      return lienVisioconference!;
    }
    return 'https://meet.jit.si/JobFlow-Entretien-$id';
  }
}

