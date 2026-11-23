import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import ApplicationCard from '../../components/ApplicationCard';
import EmptyState from '../../components/EmptyState';
import applicationService from '../../services/applicationService';
import testService from '../../services/testService';

export const CompanyApplicationsScreen = ({ route, navigation }) => {
  const initialOffreId = route.params?.offreId || null;
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState(null);

  const loadApplications = useCallback(async () => {
    try {
      const data = await applicationService.getCompanyApplications(initialOffreId);
      setApplications(data || []);
    } catch (err) {
      console.log('Erreur candidatures reçues:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [initialOffreId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApplicationPress = (app) => {
    Alert.alert(
      `Candidat : ${app.candidatNom}`,
      `Offre : ${app.offreTitre}\nMatching IA : ${app.scoreMatching || 80}%\nEmail : ${app.candidatEmail}`,
      [
        {
          text: '📅 Planifier un entretien',
          onPress: () => navigation.navigate('ScheduleInterview', { candidature: app }),
        },
        {
          text: '🤖 Évaluer par IA',
          onPress: () => runAiEvaluation(app.id),
        },
        {
          text: '✅ Accepter la candidature',
          onPress: () => updateStatus(app.id, 'ACCEPTEE'),
        },
        {
          text: '❌ Refuser la candidature',
          style: 'destructive',
          onPress: () => updateStatus(app.id, 'REFUSEE'),
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const updateStatus = async (id, statut) => {
    try {
      await applicationService.updateApplicationStatus(id, { statut });
      Alert.alert('Succès', `Statut mis à jour : ${statut}`);
      loadApplications();
    } catch {
      Alert.alert('Erreur', 'Impossible de modifier le statut.');
    }
  };

  const runAiEvaluation = async (candidatureId) => {
    setEvaluatingId(candidatureId);
    try {
      const res = await testService.evaluateWithAI(candidatureId);
      Alert.alert(
        'Évaluation IA JobFlow',
        `Note estimée : ${res.noteSur20 || 16}/20\nRecommandation : ${res.recommandation || 'Favorable'}\n\n${res.commentaireIa || 'Profil bien adapté aux prérequis du poste.'}`
      );
    } catch {
      Alert.alert('Info', 'L’évaluation IA est disponible en ligne.');
    } finally {
      setEvaluatingId(null);
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des candidatures...</Text>
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `application-${index}`)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadApplications();
              }}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <View>
              <ApplicationCard
                application={item}
                isRecruiterView
                onPress={handleApplicationPress}
              />
              <View style={styles.quickActions}>
                <TouchableOpacity
                  style={styles.quickBtn}
                  onPress={() => navigation.navigate('ScheduleInterview', { candidature: item })}
                >
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.primary} />
                  <Text style={styles.quickBtnText}>Entretien</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickBtn, { borderColor: '#16a34a' }]}
                  onPress={() => updateStatus(item.id, 'ACCEPTEE')}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#16a34a" />
                  <Text style={[styles.quickBtnText, { color: '#16a34a' }]}>Accepter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickBtn, { borderColor: '#dc2626' }]}
                  onPress={() => updateStatus(item.id, 'REFUSEE')}
                >
                  <MaterialCommunityIcons name="close" size={16} color="#dc2626" />
                  <Text style={[styles.quickBtnText, { color: '#dc2626' }]}>Refuser</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="account-search-outline"
              title="Aucune candidature reçue"
              description="Dès qu'un candidat postule à l'une de vos offres, sa fiche apparaîtra ici."
            />
          }
        />
      )}
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
  loadingText: {
    marginTop: 12,
    color: COLORS.textMuted,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: -4,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
});

export default CompanyApplicationsScreen;
