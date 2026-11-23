class QuestionQcm {
  final int id;
  final String question;
  final List<String> options;
  final int reponseCorrecte;
  final String? explication;

  QuestionQcm({
    required this.id,
    required this.question,
    required this.options,
    required this.reponseCorrecte,
    this.explication,
  });

  factory QuestionQcm.fromJson(Map<String, dynamic> json) {
    List<String> opts = [];
    if (json['options'] is List) {
      opts = (json['options'] as List).map((e) => e.toString()).toList();
    } else if (json['choix'] is List) {
      opts = (json['choix'] as List).map((e) => e.toString()).toList();
    }
    if (opts.isEmpty) {
      opts = ['Option A', 'Option B', 'Option C', 'Option D'];
    }

    return QuestionQcm(
      id: json['id'] ?? 0,
      question: json['question'] ?? json['enonce'] ?? 'Question technique',
      options: opts,
      reponseCorrecte: json['reponseCorrecte'] ?? json['bonneReponseIndex'] ?? 0,
      explication: json['explication'],
    );
  }
}

class TestTechnique {
  final int id;
  final int offreId;
  final String titre;
  final String? description;
  final int dureeMinutes;
  final int scoreMinimum;
  final List<QuestionQcm> questions;

  TestTechnique({
    required this.id,
    required this.offreId,
    required this.titre,
    this.description,
    this.dureeMinutes = 20,
    this.scoreMinimum = 60,
    required this.questions,
  });

  factory TestTechnique.fromJson(Map<String, dynamic> json) {
    List<QuestionQcm> qList = [];
    if (json['questions'] is List) {
      qList = (json['questions'] as List)
          .map((q) => QuestionQcm.fromJson(q as Map<String, dynamic>))
          .toList();
    }

    return TestTechnique(
      id: json['id'] ?? 0,
      offreId: json['offreId'] ?? 0,
      titre: json['titre'] ?? 'Test Technique',
      description: json['description'],
      dureeMinutes: json['dureeMinutes'] ?? 20,
      scoreMinimum: json['scoreMinimum'] ?? 60,
      questions: qList,
    );
  }
}

class PassageTest {
  final int id;
  final int testId;
  final int candidatureId;
  final int score;
  final int bonnesReponses;
  final int totalQuestions;
  final bool reussi;

  PassageTest({
    required this.id,
    required this.testId,
    required this.candidatureId,
    required this.score,
    required this.bonnesReponses,
    required this.totalQuestions,
    required this.reussi,
  });

  factory PassageTest.fromJson(Map<String, dynamic> json) {
    return PassageTest(
      id: json['id'] ?? 0,
      testId: json['testId'] ?? 0,
      candidatureId: json['candidatureId'] ?? 0,
      score: json['score'] ?? 0,
      bonnesReponses: json['bonnesReponses'] ?? 0,
      totalQuestions: json['totalQuestions'] ?? 0,
      reussi: json['reussi'] ?? (json['score'] != null && json['score'] >= 60),
    );
  }
}

