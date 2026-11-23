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
import { formatSalary, formatDate } from '../../utils/formatters';
import jobService from '../../services/jobService';
import EmptyState from '../../components/EmptyState';

export const CompanyJobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await jobService.getMyCompanyJobs();
      setJobs(data || []);
    } catch (err) {
      console.log('Erreur chargement mes offres:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleDelete = (id, titre) => {
    Alert.alert(
      'Supprimer l’offre',
      `Êtes-vous sûr de vouloir supprimer définitivement l’offre « ${titre} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await jobService.deleteJob(id);
              loadJobs();
            } catch {
              Alert.alert('Erreur', 'Impossible de supprimer cette offre.');
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
          <Text style={styles.loadingText}>Chargement de vos offres...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `job-${index}`)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadJobs();
              }}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.jobTitle}>{item.titre}</Text>
                  <Text style={styles.location}>
                    {item.localisation || 'France'} • {item.typeContrat || 'CDI'}
                  </Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{item.statut || 'ACTIVE'}</Text>
                </View>
              </View>

              <Text style={styles.salaryText}>
                {formatSalary(item.salaire, item.salaireMax)}
              </Text>

              <View style={styles.footerRow}>
                <View style={styles.candidateCountBadge}>
                  <MaterialCommunityIcons name="account-group" size={16} color={COLORS.primary} />
                  <Text style={styles.candidateCountText}>
                    {item.nombreCandidatures || 0} candidature(s)
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => navigation.navigate('CompanyApplicationsTab', { offreId: item.id })}
                  >
                    <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionIconBtn, { backgroundColor: '#fee2e2' }]}
                    onPress={() => handleDelete(item.id, item.titre)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="briefcase-plus-outline"
              title="Aucune offre publiée"
              description="Créez votre première annonce d'emploi pour recevoir des candidatures qualifiées."
              actionText="Créer une offre"
              onAction={() => navigation.navigate('CreateJob')}
            />
          }
        />
      )}

      {/* FAB flottant pour créer une offre */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateJob')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#ffffff" />
      </TouchableOpacity>
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
    paddingBottom: 80,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  location: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  candidateCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default CompanyJobsScreen;
