import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { formatSalary, formatDate } from '../../utils/formatters';
import jobService from '../../services/jobService';
import applicationService from '../../services/applicationService';
import testService from '../../services/testService';
import CustomButton from '../../components/CustomButton';

export const JobDetailScreen = ({ route, navigation }) => {
  const { jobId } = route.params;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [test, setTest] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobData = await jobService.getJobById(jobId);
        setJob(jobData);

        // Vérifier si le candidat a déjà postulé
        try {
          const myApps = await applicationService.getMyApplications();
          const match = myApps.find((a) => a.offreId === Number(jobId));
          if (match) {
            setHasApplied(true);
          }
        } catch {}

        // Vérifier s'il y a un test technique associé
        try {
          const tests = await testService.getTestsForJob(jobId);
          if (tests && tests.length > 0) {
            setTest(tests[0]);
          }
        } catch {}
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger les détails de l’offre.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

  if (loading || !job) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const skillsList = job.competencesRequises
    ? job.competencesRequises.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* En-tête de l'offre */}
        <View style={styles.headerCard}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>
              {(job.nomEntreprise || 'E').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{job.titre}</Text>
          <Text style={styles.companyName}>{job.nomEntreprise || 'Entreprise'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.infoBadge}>
              <MaterialCommunityIcons name="briefcase-outline" size={15} color={COLORS.primary} />
              <Text style={styles.infoBadgeText}>{job.typeContrat || 'CDI'}</Text>
            </View>

            <View style={styles.infoBadge}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={COLORS.primary} />
              <Text style={styles.infoBadgeText}>{job.localisation || 'France'}</Text>
            </View>

            {job.modeTravail ? (
              <View style={styles.infoBadge}>
                <MaterialCommunityIcons name="laptop" size={15} color={COLORS.primary} />
                <Text style={styles.infoBadgeText}>{job.modeTravail}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.salaryRow}>
            <MaterialCommunityIcons name="cash" size={18} color="#059669" />
            <Text style={styles.salaryText}>{formatSalary(job.salaire, job.salaireMax)}</Text>
          </View>

          <Text style={styles.dateText}>Publiée le {formatDate(job.datePublication)}</Text>
        </View>

        {/* Bloc Test Technique disponible */}
        {test && (
          <View style={styles.testCard}>
            <View style={styles.testCardHeader}>
              <MaterialCommunityIcons name="certificate-outline" size={24} color="#7c3aed" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.testTitle}>Évaluation Technique</Text>
                <Text style={styles.testSubtitle}>
                  {test.titre} • {test.dureeMinutes || 15} min • Note min : {test.scoreMinimum || 60}%
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={() => navigation.navigate('TakeTest', { testId: test.id, jobId })}
            >
              <Text style={styles.testBtnText}>Démarrer le test QCM</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Compétences requises */}
        {skillsList.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compétences requises</Text>
            <View style={styles.skillsContainer}>
              {skillsList.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description de l'offre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description du poste</Text>
          <Text style={styles.paragraph}>{job.description}</Text>
        </View>

        {/* Missions */}
        {job.missions ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos missions</Text>
            <Text style={styles.paragraph}>{job.missions}</Text>
          </View>
        ) : null}

        {/* Profil recherché */}
        {job.profilRecherche ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil recherché</Text>
            <Text style={styles.paragraph}>{job.profilRecherche}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Barre d'action fixe en bas */}
      <View style={styles.bottomBar}>
        {hasApplied ? (
          <View style={styles.alreadyAppliedBox}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#16a34a" />
            <Text style={styles.alreadyAppliedText}>Candidature déjà envoyée</Text>
          </View>
        ) : (
          <CustomButton
            title="Postuler à cette offre"
            onPress={() => navigation.navigate('ApplyModal', { job })}
            icon={<MaterialCommunityIcons name="send" size={18} color="#ffffff" />}
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
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoBadgeText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  companyName: {
    fontSize: 15,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 4,
  },
  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  salaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  testCard: {
    backgroundColor: '#f5f3ff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginBottom: 16,
  },
  testCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6d28d9',
  },
  testSubtitle: {
    fontSize: 12,
    color: '#7c3aed',
    marginTop: 2,
  },
  testBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  testBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  alreadyAppliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 12,
    borderRadius: 12,
  },
  alreadyAppliedText: {
    color: '#16a34a',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 15,
  },
});

export default JobDetailScreen;
