import 'dart:async';
import 'package:flutter/material.dart';
import '../core/api_service.dart';
import '../core/app_theme.dart';
import '../models/test_model.dart';

class TechnicalTestScreen extends StatefulWidget {
  final int offreId;
  final int candidatureId;
  final bool readOnly;

  const TechnicalTestScreen({
    super.key,
    required this.offreId,
    required this.candidatureId,
    this.readOnly = false,
  });

  @override
  State<TechnicalTestScreen> createState() => _TechnicalTestScreenState();
}

class _TechnicalTestScreenState extends State<TechnicalTestScreen> {
  final ApiService _api = ApiService();
  TestTechnique? _test;
  bool _loading = true;

  int _currentIndex = 0;
  final Map<int, int> _selectedAnswers = {};
  Timer? _timer;
  int _secondsRemaining = 15 * 60; // 15 mins
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadTest();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _loadTest() async {
    final test = await _api.getTestForOffer(widget.offreId);
    if (mounted) {
      setState(() {
        _test = test;
        _loading = false;
        if (test != null && widget.readOnly) {
          // Pre-fill answers with correct ones for review
          for (int i = 0; i < test.questions.length; i++) {
            _selectedAnswers[i] = test.questions[i].reponseCorrecte;
          }
        }
      });
      if (!widget.readOnly) {
        _startTimer();
      }
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsRemaining > 0) {
        setState(() => _secondsRemaining--);
      } else {
        _timer?.cancel();
        _submitTest();
      }
    });
  }

  String get _formattedTime {
    final mins = _secondsRemaining ~/ 60;
    final secs = _secondsRemaining % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  Future<void> _submitTest() async {
    if (_test == null || _submitting) return;

    setState(() => _submitting = true);
    _timer?.cancel();

    // Calculate score
    int correct = 0;
    final List<int> responses = [];
    for (int i = 0; i < _test!.questions.length; i++) {
      final chosen = _selectedAnswers[i] ?? -1;
      responses.add(chosen);
      if (chosen == _test!.questions[i].reponseCorrecte) {
        correct++;
      }
    }

    final score = ((correct / _test!.questions.length) * 100).round();
    final bool passed = score >= _test!.scoreMinimum;

    // Send to backend
    await _api.submitTestAnswers(_test!.id, widget.candidatureId, responses);

    if (mounted) {
      setState(() => _submitting = false);
      _showResultDialog(score, correct, _test!.questions.length, passed);
    }
  }

  void _showResultDialog(int score, int correct, int total, bool passed) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(
                passed ? Icons.check_circle : Icons.warning_amber_rounded,
                color: passed ? AppColors.success : AppColors.warning,
                size: 28,
              ),
              const SizedBox(width: 8),
              Text(passed ? 'Félicitations !' : 'Test Complété'),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '$score%',
                style: TextStyle(
                  fontSize: 48,
                  fontWeight: FontWeight.w900,
                  color: passed ? AppColors.success : AppColors.warning,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Bonnes réponses : $correct sur $total questions',
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: passed ? AppColors.successLight : AppColors.warningLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  passed
                    ? '✓ Votre score a été validé et transmis au recruteur avec succès !'
                    : 'Votre résultat a été enregistré dans votre dossier de candidature.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    color: passed ? AppColors.success : AppColors.warning,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                Navigator.pop(context); // back to dashboard
              },
              child: const Text('Retour à mes candidatures'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_loading || _test == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final currentQuestion = _test!.questions[_currentIndex];
    final totalQuestions = _test!.questions.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.readOnly ? 'Revue du QCM Technique' : 'Évaluation Technique QCM'),
        actions: [
          if (!widget.readOnly)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _secondsRemaining < 120 ? AppColors.dangerLight : AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.timer,
                        size: 16,
                        color: _secondsRemaining < 120 ? AppColors.danger : AppColors.primary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _formattedTime,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _secondsRemaining < 120 ? AppColors.danger : AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Progress Bar & Question Step
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${_currentIndex + 1} sur $totalQuestions',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.primary),
                ),
                Text(
                  '${((_currentIndex + 1) / totalQuestions * 100).round()}%',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: (_currentIndex + 1) / totalQuestions,
              backgroundColor: isDark ? AppColors.borderDark : const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              borderRadius: BorderRadius.circular(4),
              minHeight: 6,
            ),
            const SizedBox(height: 20),

            // Question Box
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(
                  currentQuestion.question,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, height: 1.4),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Options list
            Expanded(
              child: ListView.separated(
                itemCount: currentQuestion.options.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, optIdx) {
                  final optionText = currentQuestion.options[optIdx];
                  final isSelected = _selectedAnswers[_currentIndex] == optIdx;
                  final isCorrect = widget.readOnly && optIdx == currentQuestion.reponseCorrecte;

                  return InkWell(
                    onTap: widget.readOnly
                        ? null
                        : () {
                            setState(() {
                              _selectedAnswers[_currentIndex] = optIdx;
                            });
                          },
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isCorrect
                            ? AppColors.successLight
                            : isSelected
                                ? AppColors.primaryLight
                                : isDark
                                    ? AppColors.cardDark
                                    : Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isCorrect
                              ? AppColors.success
                              : isSelected
                                  ? AppColors.primary
                                  : isDark
                                      ? AppColors.borderDark
                                      : const Color(0xFFE2E8F0),
                          width: isSelected || isCorrect ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: isCorrect
                                  ? AppColors.success
                                  : isSelected
                                      ? AppColors.primary
                                      : Colors.transparent,
                              border: Border.all(
                                color: isCorrect
                                    ? AppColors.success
                                    : isSelected
                                        ? AppColors.primary
                                        : AppColors.textSecondary,
                              ),
                            ),
                            child: Center(
                              child: isCorrect || isSelected
                                  ? const Icon(Icons.check, size: 16, color: Colors.white)
                                  : Text(
                                      String.fromCharCode(65 + optIdx),
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                    ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              optionText,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: isSelected || isCorrect ? FontWeight.w700 : FontWeight.w500,
                                color: isCorrect ? AppColors.success : null,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),

            // Navigation Buttons (Prev / Next / Submit)
            Row(
              children: [
                if (_currentIndex > 0)
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => setState(() => _currentIndex--),
                      child: const Text('← Précédent'),
                    ),
                  ),
                if (_currentIndex > 0) const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: _currentIndex < totalQuestions - 1
                        ? () => setState(() => _currentIndex++)
                        : widget.readOnly
                            ? () => Navigator.pop(context)
                            : _submitTest,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _currentIndex == totalQuestions - 1 && !widget.readOnly
                          ? AppColors.success
                          : AppColors.primary,
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : Text(
                            _currentIndex < totalQuestions - 1
                                ? 'Suivant →'
                                : widget.readOnly
                                    ? 'Fermer la revue'
                                    : '✓ Valider et Soumettre le Test',
                          ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
