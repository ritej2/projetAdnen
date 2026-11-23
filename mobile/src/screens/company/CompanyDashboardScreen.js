import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import interviewService from '../../services/interviewService';
import ApplicationCard from '../../components/ApplicationCard';

export const CompanyDashboardScreen = ({ navigation }) => {
  const { entreprise, user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [jobsData, appsData, interviewsData] = await Promise.all([
        jobService.getMyCompanyJobs(),
        applicationService.getCompanyApplications(),
        interviewService.getMyInterviews(),
      ]);
      setJobs(jobsData || []);
      setApplications(appsData || []);
      setInterviews(interviewsData || []);
    } catch (err) {
      console.log('Erreur dashboard entreprise:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const pendingApps = applications.filter((a) => a.statut === 'EN_ATTENTE');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadDashboardData();
          }}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* En-tête Entreprise */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeSubtitle}>Espace Recruteur</Text>
        <Text style={styles.welcomeTitle}>
          {entreprise?.nomEntreprise || user?.nom || 'Entreprise'}
        </Text>
      </View>

      {/* Cartes KPI */}
      <View style={styles.statsGrid}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('CompanyJobsTab')}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#dbeafe' }]}>
            <MaterialCommunityIcons name="briefcase" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{jobs.length}</Text>
          <Text style={styles.statLabel}>Offres en ligne</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('CompanyApplicationsTab')}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#fef3c7' }]}>
            <MaterialCommunityIcons name="account-clock" size={24} color="#d97706" />
          </View>
          <Text style={styles.statNumber}>{pendingApps.length}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statCard}
          onPress={() => navigation.navigate('CompanyInterviewsTab')}
        >
          <View style={[styles.statIconBox, { backgroundColor: '#ede9fe' }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#7c3aed" />
          </View>
          <Text style={styles.statNumber}>{interviews.length}</Text>
          <Text style={styles.statLabel}>Entretiens</Text>
        </TouchableOpacity>
      </View>

      {/* Action rapide : Publier une offre */}
      <TouchableOpacity
        style={styles.createJobBanner}
        onPress={() => navigation.navigate('CreateJob')}
        activeOpacity={0.8}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.createJobTitle}>Publier une nouvelle offre</Text>
          <Text style={styles.createJobSubtitle}>
            Rédigez et diffusez votre besoin de recrutement en quelques instants.
          </Text>
        </View>
        <View style={styles.createJobPlus}>
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {/* Dernières candidatures reçues */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Candidatures récentes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CompanyApplicationsTab')}>
          <Text style={styles.viewAllText}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : applications.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Aucune candidature reçue pour le moment.</Text>
        </View>
      ) : (
        applications.slice(0, 3).map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            isRecruiterView
            onPress={() => navigation.navigate('CompanyApplicationsTab')}
          />
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: COLORS.secondary,
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  createJobBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  createJobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  createJobSubtitle: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 2,
  },
  createJobPlus: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

export default CompanyDashboardScreen;
