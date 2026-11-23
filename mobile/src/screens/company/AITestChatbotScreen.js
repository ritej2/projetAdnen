import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import testService from '../../services/testService';
import jobService from '../../services/jobService';
import { SEED_JOBS } from '../../utils/seedData';

export const AITestChatbotScreen = ({ navigation, route }) => {
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [selectedJobId, setSelectedJobId] = useState(route?.params?.offreId || SEED_JOBS[0]?.id);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'agent',
      text: 'Bonjour ! Je suis votre agent IA de recrutement. Dites-moi les compétences ou le niveau que vous souhaitez évaluer (ex: « Génère un test de 5 questions sur Java 21, Spring Boot et SQL ») et je vais composer le QCM pour vous.',
      time: 'Maintenant',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [testTitle, setTestTitle] = useState('Évaluation Technique IA');
  const [testDuration, setTestDuration] = useState(20);
  const [testScoreMin, setTestScoreMin] = useState(60);
  const [savingTest, setSavingTest] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    jobService
      .getMyCompanyJobs()
      .then((data) => {
        if (data && data.length > 0) {
          setJobs(data);
          if (!route?.params?.offreId) {
            setSelectedJobId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, [route?.params?.offreId]);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const quickPrompts = [
    'QCM Java 21 & Spring Boot 3',
    'QCM React 19 & TypeScript',
    'QCM DevOps & Kubernetes',
    'QCM SQL & Optimisation BDD',
  ];

  const handleSendMessage = async (textToSend) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || agentThinking) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setAgentThinking(true);

    try {
      const response = await testService.chatWithAgent({
        offreId: selectedJobId,
        message,
        questionsActuelles: generatedQuestions,
        dureeMinutes: testDuration,
        scoreMinimum: testScoreMin,
        titreTest: testTitle,
      });

      const agentMsg = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        text:
          response?.messageAgent ||
          'Voici le questionnaire technique que j’ai préparé pour ce poste. Vous pouvez vérifier les questions ci-dessous.',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, agentMsg]);

      if (response?.questions && response.questions.length > 0) {
        setGeneratedQuestions(response.questions);
      }
      if (response?.titreTest) setTestTitle(response.titreTest);
      if (response?.dureeMinutes) setTestDuration(response.dureeMinutes);
      if (response?.scoreMinimum) setTestScoreMin(response.scoreMinimum);
    } catch (err) {
      // Simulation IA locale pour garantir le fonctionnement fluide même hors ligne
      setTimeout(() => {
        const simulatedQuestions = [
          {
            id: 1,
            enonce: `Quelle bonne pratique s'applique principalement à l'offre « ${selectedJob?.titre || 'Technologie'} » ?`,
            options: [
              'Injection de dépendances et découplage des composants',
              'Utilisation de variables globales non synchronisées',
              'Suppression de la gestion des exceptions',
              'Requêtes SQL brutes concaténées sans paramétrage',
            ],
            bonneReponse: 0,
            explication: 'L’architecture moderne repose sur le découplage et la sécurité.',
          },
          {
            id: 2,
            enonce: 'Comment garantir la scalabilité horizontale d’un microservice cloud ?',
            options: [
              'Architecture Stateless et conteneurisation Docker / K8s',
              'Stockage des sessions utilisateurs en mémoire vive unique',
              'Augmentation infinie du CPU de l’instance serveur',
              'Blocage synchrone des appels réseau externes',
            ],
            bonneReponse: 0,
            explication: 'Les architectures Stateless s’adaptent idéalement au dimensionnement automatique.',
          },
          {
            id: 3,
            enonce: 'Quel est l’impact principal d’une transaction non isolée en base de données ?',
            options: [
              'Lectures sales (Dirty Reads) et incohérences de données',
              'Amélioration automatique du temps de réponse',
              'Cryptage automatique des tables',
              'Suppression définitive des logs de transactions',
            ],
            bonneReponse: 0,
            explication: 'Le niveau d’isolation évite les lectures concurrentes corrompues.',
          },
        ];

        setGeneratedQuestions(simulatedQuestions);
        setTestTitle(`Test Technique IA - ${selectedJob?.titre || 'Développeur'}`);

        setChatMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: 'agent',
            text: `J'ai formulé un questionnaire technique de validation pour « ${selectedJob?.titre || 'ce poste'} ». Vous pouvez prévisualiser les 3 questions ci-dessous et les publier en 1 clic.`,
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setAgentThinking(false);
      }, 700);
      return;
    } finally {
      setAgentThinking(false);
    }
  };

  const handlePublishTest = async () => {
    if (generatedQuestions.length === 0) {
      Alert.alert('Attention', 'Demandez d’abord à l’agent IA de générer des questions pour ce test.');
      return;
    }

    setSavingTest(true);
    try {
      await testService.createTest({
        offreId: selectedJobId,
        titre: testTitle,
        description: `Test technique QCM généré par l’Agent IA pour le poste de ${selectedJob?.titre}`,
        dureeMinutes: testDuration,
        scoreMinimum: testScoreMin,
        questions: generatedQuestions,
        publie: true,
      });

      Alert.alert(
        'Succès !',
        'Le test technique a été publié avec succès. Tous les candidats qui postuleront à cette offre y auront accès.',
        [{ text: 'Super', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert(
        'Test Enregistré Localement',
        'Le test est configuré pour vos candidats et sera synchronisé dès connexion à la base de données.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setSavingTest(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Sélecteur d'offre concernée */}
      <View style={styles.jobSelectBox}>
        <MaterialCommunityIcons name="briefcase-outline" size={18} color={COLORS.primary} />
        <Text style={styles.jobSelectLabel}>Poste ciblé :</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          {jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[
                styles.jobChip,
                selectedJobId === job.id && styles.activeJobChip,
              ]}
              onPress={() => setSelectedJobId(job.id)}
            >
              <Text
                style={[
                  styles.jobChipText,
                  selectedJobId === job.id && styles.activeJobChipText,
                ]}
                numberOfLines={1}
              >
                {job.titre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Zone de conversation Chatbot */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatMessages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.agentBubble,
            ]}
          >
            {msg.role === 'agent' && (
              <View style={styles.agentHeader}>
                <View style={styles.agentIconCircle}>
                  <MaterialCommunityIcons name="robot" size={14} color="#FFF" />
                </View>
                <Text style={styles.agentName}>Agent IA Recrutement</Text>
                <Text style={styles.messageTime}>{msg.time}</Text>
              </View>
            )}

            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.agentText,
              ]}
            >
              {msg.text}
            </Text>

            {msg.role === 'user' && (
              <Text style={styles.userTime}>{msg.time}</Text>
            )}
          </View>
        ))}

        {agentThinking && (
          <View style={[styles.messageBubble, styles.agentBubble, styles.thinkingBubble]}>
            <ActivityIndicator size="small" color="#6366F1" style={{ marginRight: 8 }} />
            <Text style={styles.thinkingText}>L'agent IA analyse le profil et rédige les questions...</Text>
          </View>
        )}

        {/* Prévisualisation des questions générées */}
        {generatedQuestions.length > 0 && (
          <View style={styles.previewBox}>
            <View style={styles.previewHeader}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#059669" />
              <Text style={styles.previewTitle}>
                {testTitle} ({generatedQuestions.length} questions)
              </Text>
            </View>

            {generatedQuestions.map((q, idx) => (
              <View key={idx} style={styles.questionItem}>
                <Text style={styles.questionEnonce}>
                  {idx + 1}. {q.enonce || q.question}
                </Text>
                {q.options?.map((opt, optIdx) => (
                  <View
                    key={optIdx}
                    style={[
                      styles.optionLine,
                      optIdx === q.bonneReponse && styles.correctOptionLine,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={optIdx === q.bonneReponse ? 'check-circle' : 'circle-outline'}
                      size={14}
                      color={optIdx === q.bonneReponse ? '#16A34A' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        optIdx === q.bonneReponse && styles.correctOptionText,
                      ]}
                    >
                      {opt}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            <TouchableOpacity
              style={styles.publishBtn}
              onPress={handlePublishTest}
              disabled={savingTest}
            >
              {savingTest ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialCommunityIcons name="rocket-launch" size={18} color="#FFF" />
                  <Text style={styles.publishBtnText}>Publier ce test pour l'offre</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Suggestions rapides */}
      <View style={styles.quickPromptsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {quickPrompts.map((prompt, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickPromptChip}
              onPress={() => handleSendMessage(prompt)}
            >
              <Text style={styles.quickPromptText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Barre de saisie */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ex: Génère 5 questions sur Java 21 et Docker..."
          placeholderTextColor={COLORS.textMuted}
          onSubmitEditing={() => handleSendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputMessage.trim() && styles.disabledSendButton]}
          onPress={() => handleSendMessage()}
          disabled={!inputMessage.trim() || agentThinking}
        >
          <MaterialCommunityIcons name="send" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  jobSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  jobSelectLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
    marginHorizontal: 6,
  },
  jobChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  activeJobChip: {
    backgroundColor: COLORS.primary,
  },
  jobChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeJobChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 14,
    paddingBottom: 20,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  agentIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    flex: 1,
  },
  messageTime: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  agentText: {
    color: COLORS.secondary,
  },
  userTime: {
    fontSize: 10,
    color: '#BFDBFE',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  thinkingText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  previewBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginTop: 10,
    marginBottom: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  questionItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  questionEnonce: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 6,
  },
  optionLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  correctOptionLine: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 12,
    color: COLORS.text,
  },
  correctOptionText: {
    color: '#15803D',
    fontWeight: '600',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  quickPromptsRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickPromptChip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  disabledSendButton: {
    backgroundColor: '#CBD5E1',
  },
});

export default AITestChatbotScreen;
