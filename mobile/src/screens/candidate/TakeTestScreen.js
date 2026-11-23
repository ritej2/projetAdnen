import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import testService from '../../services/testService';
import applicationService from '../../services/applicationService';
import CustomButton from '../../components/CustomButton';
import { SEED_TEST } from '../../utils/seedData';

export const TakeTestScreen = ({ route, navigation }) => {
  const { testId, jobId } = route.params || {};
  const [test, setTest] = useState(SEED_TEST);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchTest = async () => {
      if (!testId) {
        setTest(SEED_TEST);
        return;
      }
      try {
        const data = await testService.getTestById(testId);
        if (data && data.questions && data.questions.length > 0) {
          setTest(data);
        } else {
          setTest(SEED_TEST);
        }
      } catch (err) {
        console.log('Utilisation du test technique miroir fallback');
        setTest(SEED_TEST);
      }
    };

    fetchTest();
  }, [testId]);

  const handleSelectOption = (qIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [qIndex]: optionIndex,
    });
  };

  const handleSubmit = async () => {
    // Vérifier si toutes les questions sont répondues
    const questionsCount = test?.questions?.length || 0;
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < questionsCount) {
      Alert.alert(
        'Attention',
        `Vous n'avez répondu qu'à ${answeredCount} question(s) sur ${questionsCount}. Voulez-vous quand même soumettre ?`,
        [
          { text: 'Continuer le test', style: 'cancel' },
          { text: 'Soumettre', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      // Trouver la candidature associée si elle existe
      let candId = null;
      try {
        const myApps = await applicationService.getMyApplications();
        const match = myApps.find((a) => a.offreId === Number(jobId));
        if (match) candId = match.id;
      } catch {}

      const formattedAnswers = Object.entries(answers).map(([idx, choice]) => ({
        index: Number(idx),
        choixCandidat: choice,
      }));

      const res = await testService.submitTest({
        testId: Number(testId || 1),
        candidatureId: candId,
        reponses: formattedAnswers,
      });

      setResult(res);
    } catch (err) {
      // Fallback calcul local du score
      const questionsList = test?.questions || [];
      let correct = 0;
      questionsList.forEach((q, i) => {
        const correctIdx = q.bonneReponse !== undefined ? q.bonneReponse : 0;
        if (answers[i] === correctIdx) correct++;
      });
      const scorePct =
        questionsList.length > 0 ? Math.round((correct / questionsList.length) * 100) : 80;
      setResult({
        score: scorePct,
        bonnesReponses: correct,
        totalQuestions: questionsList.length,
        estReussi: scorePct >= (test?.scoreMinimum || 60),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !test) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Écran de résultat après soumission
  if (result) {
    const passed = result.estReussi !== undefined ? result.estReussi : result.reussi;
    return (
      <View style={styles.resultContainer}>
        <View style={[styles.resultBadge, { backgroundColor: passed ? '#dcfce7' : '#fee2e2' }]}>
          <MaterialCommunityIcons
            name={passed ? 'trophy-award' : 'alert-circle-outline'}
            size={48}
            color={passed ? '#16a34a' : '#dc2626'}
          />
        </View>

        <Text style={styles.resultTitle}>
          {passed ? 'Félicitations !' : 'Test terminé'}
        </Text>
        <Text style={styles.resultScore}>
          Votre score : {result.score}%
        </Text>
        <Text style={styles.resultMin}>
          Seuil de réussite exigé : {test.scoreMinimum || 60}%
        </Text>

        <Text style={styles.resultMessage}>
          {passed
            ? 'Vous avez validé ce test technique avec succès ! Votre score a été transmis à l’entreprise recruteuse.'
            : 'Votre score est inférieur au seuil requis. Vous pourrez retravailler vos compétences et postuler à d’autres offres.'}
        </Text>

        <CustomButton
          title="Retour aux offres"
          onPress={() => navigation.popToTop()}
          style={{ width: '100%', marginTop: 24 }}
        />
      </View>
    );
  }

  const questions = test.questions || [];
  const currentQ = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* Barre de progression */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressText}>
            Question {currentQuestionIndex + 1} sur {questions.length}
          </Text>
          <Text style={styles.timeText}>{test.dureeMinutes || 15} min</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {currentQ ? (
          <View style={styles.questionCard}>
            <Text style={styles.questionText}>
              {currentQ.enonce || currentQ.question || 'Question technique'}
            </Text>

            <View style={styles.optionsList}>
              {currentQ.options?.map((opt, optIdx) => {
                const isSelected = answers[currentQuestionIndex] === optIdx;
                return (
                  <TouchableOpacity
                    key={optIdx}
                    activeOpacity={0.7}
                    style={[styles.optionItem, isSelected && styles.selectedOptionItem]}
                    onPress={() => handleSelectOption(currentQuestionIndex, optIdx)}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <Text style={styles.noQuestions}>Aucune question disponible.</Text>
        )}
      </ScrollView>

      {/* Navigation entre questions */}
      <View style={styles.bottomNav}>
        <CustomButton
          title="Précédent"
          variant="outline"
          disabled={currentQuestionIndex === 0}
          onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
          style={{ flex: 1, marginRight: 8 }}
        />

        {currentQuestionIndex < questions.length - 1 ? (
          <CustomButton
            title="Suivant"
            onPress={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            style={{ flex: 1, marginLeft: 8 }}
          />
        ) : (
          <CustomButton
            title="Terminer & Valider"
            onPress={handleSubmit}
            loading={submitting}
            variant="primary"
            style={{ flex: 1, marginLeft: 8, backgroundColor: '#16a34a' }}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.secondary,
    lineHeight: 24,
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
  },
  selectedOptionItem: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedRadioCircle: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  optionText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  noQuestions: {
    textAlign: 'center',
    color: COLORS.textMuted,
    marginTop: 40,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  resultContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  resultScore: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  resultMin: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  resultMessage: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});

export default TakeTestScreen;
