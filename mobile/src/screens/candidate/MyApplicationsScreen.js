import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS } from '../../utils/constants';
import ApplicationCard from '../../components/ApplicationCard';
import EmptyState from '../../components/EmptyState';
import applicationService from '../../services/applicationService';

export const MyApplicationsScreen = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadApplications = useCallback(async () => {
    try {
      const data = await applicationService.getMyApplications();
      setApplications(data || []);
    } catch (err) {
      console.log('Erreur chargement candidatures:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleAction = (app) => {
    Alert.alert(
      app.offreTitre,
      `Statut actuel : ${app.statut}\nEntreprise : ${app.nomEntreprise}`,
      [
        {
          text: 'Voir l’offre',
          onPress: () => navigation.navigate('JobDetail', { jobId: app.offreId }),
        },
        {
          text: 'Retirer ma candidature',
          style: 'destructive',
          onPress: () => confirmWithdraw(app.id),
        },
        { text: 'Fermer', style: 'cancel' },
      ]
    );
  };

  const confirmWithdraw = (id) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir retirer votre candidature ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await applicationService.withdrawApplication(id);
              loadApplications();
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de retirer cette candidature.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de vos candidatures...</Text>
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
            <ApplicationCard
              application={item}
              onPress={handleAction}
              onTakeTest={(app) =>
                navigation.navigate('TakeTest', {
                  testId: 1,
                  jobId: app.offreId,
                })
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="send-outline"
              title="Aucune candidature"
              description="Vous n'avez pas encore postulé à une offre d'emploi."
              actionText="Explorer les offres"
              onAction={() => navigation.navigate('JobsTab')}
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
});

export default MyApplicationsScreen;
