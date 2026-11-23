import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import applicationService from '../services/applicationService';
import interviewService from '../services/interviewService';
import jobService from '../services/jobService';
import { setCustomApiHost, api } from '../services/api';
import { getCandidateAvatarAsset, getCompanyLogoAsset } from '../utils/assets';
import AppLogo from '../components/AppLogo';
import { formatDate } from '../utils/formatters';
import {
  SEED_JOBS,
  SEED_CANDIDATE_APPLICATIONS,
  SEED_CANDIDATE_INTERVIEWS,
  SEED_CANDIDATE_TESTS,
} from '../utils/seedData';
import JobCard from '../components/JobCard';
import testService from '../services/testService';

export const AccountScreen = ({ navigation }) => {
  const { user, candidat, isCandidate, isCompany, logout, loginDemo, isLoading } = useAuth();
  const [candidateStats, setCandidateStats] = useState({ applications: 7, interviews: 1 });
  const [companyStats, setCompanyStats] = useState({ jobs: 0, applications: 0 });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [hostInput, setHostInput] = useState(api.defaults.baseURL || '');

  // Tabs et données complètes Espace Candidat (identique au web)
  const [activeTab, setActiveTab] = useState('postes'); // 'postes' | 'entretiens' | 'favoris' | 'tests'
  const [candidateApps, setCandidateApps] = useState(SEED_CANDIDATE_APPLICATIONS);
  const [candidateInterviews, setCandidateInterviews] = useState(SEED_CANDIDATE_INTERVIEWS);
  const [candidateFavorites, setCandidateFavorites] = useState([SEED_JOBS[0], SEED_JOBS[1]]);
  const [candidateTests, setCandidateTests] = useState(SEED_CANDIDATE_TESTS);

  useEffect(() => {
    if (user && isCandidate) {
      Promise.allSettled([
        applicationService.getMyApplications(),
        interviewService.getMyInterviews(),
        testService.getMyAttempts(),
      ]).then(([appsRes, intsRes, testsRes]) => {
        if (appsRes.status === 'fulfilled' && appsRes.value && appsRes.value.length > 0) {
          setCandidateApps(appsRes.value);
        }
        if (intsRes.status === 'fulfilled' && intsRes.value && intsRes.value.length > 0) {
          setCandidateInterviews(intsRes.value);
        }
        if (testsRes.status === 'fulfilled' && testsRes.value && testsRes.value.length > 0) {
          setCandidateTests(testsRes.value);
        }
      });
    } else if (user && isCompany) {
      Promise.allSettled([
        jobService.getMyCompanyJobs(),
        applicationService.getCompanyApplications(),
      ]).then(([jobsRes, appsRes]) => {
        setCompanyStats({
          jobs: jobsRes.status === 'fulfilled' ? (jobsRes.value || []).length : 0,
          applications: appsRes.status === 'fulfilled' ? (appsRes.value || []).length : 0,
        });
      });
    }
  }, [user, isCandidate, isCompany]);

  const handleSaveHost = async () => {
    try {
      await setCustomApiHost(hostInput);
      Alert.alert('Succès', `Nouvelle adresse backend enregistrée :\n${api.defaults.baseURL}`);
      setShowServerConfig(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de configurer l’hôte');
    }
  };

  const handleDemo = async (role) => {
    try {
      await loginDemo(role);
    } catch (err) {
      Alert.alert('Erreur', err?.friendlyMessage || 'Impossible de se connecter au compte démo.');
    }
  };

  // 1. NON AUTHENTIFIÉ
  if (!user) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.authHeroCard}>
          <View style={{ marginBottom: 12 }}>
            <AppLogo size="large" />
          </View>
          <Text style={styles.authHeroTitle}>Mon Espace JobFlow</Text>
          <Text style={styles.authHeroSub}>
            Connectez-vous pour postuler aux offres, suivre vos recrutements et gérer votre profil professionnel.
          </Text>

          <View style={styles.authButtonsRow}>
            <TouchableOpacity
              style={styles.loginPrimaryBtn}
              onPress={() => navigation.navigate('Login')}
            >
              <MaterialCommunityIcons name="login" size={18} color="#FFF" />
              <Text style={styles.loginPrimaryBtnText}>Se connecter</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerOutlineBtn}
              onPress={() => navigation.navigate('Register')}
            >
              <MaterialCommunityIcons name="account-plus-outline" size={18} color={COLORS.primary} />
              <Text style={styles.registerOutlineBtnText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accès Démo Rapide */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Connexion Démo Instantanée</Text>
          <Text style={styles.sectionHeaderSub}>
            Testez directement l'application avec nos comptes de démonstration pré-configurés :
          </Text>

          <TouchableOpacity
            style={styles.demoActionBtn}
            onPress={() => handleDemo('CANDIDAT')}
            disabled={isLoading}
          >
            <View style={[styles.demoIconBox, { backgroundColor: '#E8F0FE' }]}>
              <MaterialCommunityIcons name="school" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.demoActionInfo}>
              <Text style={styles.demoActionTitle}>Compte Candidat Démo</Text>
              <Text style={styles.demoActionDesc}>candidat@superio.fr · Postuler, tests & entretiens</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoActionBtn}
            onPress={() => handleDemo('ENTREPRISE')}
            disabled={isLoading}
          >
            <View style={[styles.demoIconBox, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="domain" size={20} color="#D97706" />
            </View>
            <View style={styles.demoActionInfo}>
              <Text style={styles.demoActionTitle}>Compte Entreprise Démo</Text>
              <Text style={styles.demoActionDesc}>contact@techcorp.com · Publier des offres, gérer candidats</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Configuration Réseau Backend */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.configToggle}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <MaterialCommunityIcons name="server-network" size={20} color={COLORS.textMuted} />
            <Text style={styles.configToggleText}>Configuration URL API Backend</Text>
            <MaterialCommunityIcons
              name={showServerConfig ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.configBox}>
              <Text style={styles.configHelpText}>
                URL actuelle : {api.defaults.baseURL}
              </Text>
              <TextInput
                value={hostInput}
                onChangeText={setHostInput}
                placeholder="http://10.0.2.2:8081"
                placeholderTextColor={COLORS.textMuted}
                style={styles.configInput}
              />
              <TouchableOpacity style={styles.configSaveBtn} onPress={handleSaveHost}>
                <Text style={styles.configSaveBtnText}>Appliquer l’URL</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // 2. CANDIDAT CONNECTÉ (Exacte interface web utilisateur)
  if (isCandidate) {
    const candidateInitial = (user?.nom || 'M').charAt(0).toUpperCase();

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Titre officiel */}
        <View style={styles.candidateTopRow}>
          <Text style={styles.candidatePageTitle}>Espace CANDIDAT</Text>
        </View>

        {/* Carte profil Candidat */}
        <View style={styles.candidateProfileHeaderCard}>
          <View style={styles.candidateAvatarCircle}>
            <Text style={styles.candidateAvatarText}>{candidateInitial}</Text>
          </View>

          <View style={styles.candidateInfoCol}>
            <Text style={styles.candidateFullName}>{user?.nom || 'Marie Dubois'}</Text>
            <Text style={styles.candidateTitreRole}>
              {candidat?.titreProfil || 'Ingénieure Full Stack Java / React'}
            </Text>
            <Text style={styles.candidateEmailText}>
              {user?.email || 'marie.dubois@talentflow.io'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.candidateLogoutIconBtn}
            onPress={logout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* 4 Onglets Horizontaux Miroir du Web */}
        <View style={styles.candidateTabsBar}>
          <TouchableOpacity
            style={[styles.candidateTabItem, activeTab === 'postes' && styles.candidateTabActive]}
            onPress={() => setActiveTab('postes')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={18}
              color={activeTab === 'postes' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.candidateTabText,
                activeTab === 'postes' && styles.candidateTabTextActive,
              ]}
            >
              Postes ({candidateApps.length})
            </Text>
            {activeTab === 'postes' && <View style={styles.candidateTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.candidateTabItem,
              activeTab === 'entretiens' && styles.candidateTabActive,
            ]}
            onPress={() => setActiveTab('entretiens')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={18}
              color={activeTab === 'entretiens' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.candidateTabText,
                activeTab === 'entretiens' && styles.candidateTabTextActive,
              ]}
            >
              Entretiens ({candidateInterviews.length})
            </Text>
            {activeTab === 'entretiens' && <View style={styles.candidateTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.candidateTabItem, activeTab === 'favoris' && styles.candidateTabActive]}
            onPress={() => setActiveTab('favoris')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={18}
              color={activeTab === 'favoris' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.candidateTabText,
                activeTab === 'favoris' && styles.candidateTabTextActive,
              ]}
            >
              Favoris ({candidateFavorites.length})
            </Text>
            {activeTab === 'favoris' && <View style={styles.candidateTabIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.candidateTabItem, activeTab === 'tests' && styles.candidateTabActive]}
            onPress={() => setActiveTab('tests')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="creation"
              size={18}
              color={activeTab === 'tests' ? COLORS.primary : COLORS.textMuted}
            />
            <Text
              style={[
                styles.candidateTabText,
                activeTab === 'tests' && styles.candidateTabTextActive,
              ]}
            >
              Tests ({candidateTests.length})
            </Text>
            {activeTab === 'tests' && <View style={styles.candidateTabIndicator} />}
          </TouchableOpacity>
        </View>

        {/* CONTENU ONGLET 1 : POSTES & CANDIDATURES (EXACTE PHOTO) */}
        {activeTab === 'postes' && (
          <View style={styles.tabContentList}>
            {candidateApps.map((item, idx) => (
              <View key={item.id ? `app-${item.id}` : `app-${idx}`} style={styles.webJobCard}>
                <View style={styles.webJobCardHeader}>
                  <Text style={styles.webJobCardTitle} numberOfLines={2}>
                    {item.offreTitre || item.titre || 'Offre d’emploi'}
                  </Text>
                  <View
                    style={[
                      styles.webStatusPill,
                      item.statut === 'ACCEPTEE' && styles.webStatusPillAccepted,
                      item.statut === 'ENTRETIEN' && styles.webStatusPillInterview,
                      item.statut === 'REFUSEE' && styles.webStatusPillRefused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.webStatusPillText,
                        item.statut === 'ACCEPTEE' && styles.webStatusPillTextAccepted,
                        item.statut === 'ENTRETIEN' && styles.webStatusPillTextInterview,
                        item.statut === 'REFUSEE' && styles.webStatusPillTextRefused,
                      ]}
                    >
                      {item.statut === 'ACCEPTEE'
                        ? 'Acceptée'
                        : item.statut === 'ENTRETIEN'
                        ? 'Entretien'
                        : item.statut === 'REFUSEE'
                        ? 'Refusée'
                        : 'En attente'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.webJobCardCompany}>
                  {item.nomEntreprise || 'rtat'} · {item.localisation || 'Paris, France'}
                </Text>

                <Text style={styles.webJobCardDate}>
                  Postulé le {formatDate(item.dateCandidature)}
                </Text>

                {/* Grand bouton bleu officiel "✨ Passer le Test Technique IA" */}
                <TouchableOpacity
                  style={styles.webPassTestBtn}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('TakeTest', {
                      jobId: item.offreId || item.id || 1,
                      testId: 1,
                    })
                  }
                >
                  <MaterialCommunityIcons name="creation" size={18} color="#FFFFFF" />
                  <Text style={styles.webPassTestBtnText}>Passer le Test Technique IA</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* CONTENU ONGLET 2 : ENTRETIENS PLANIFIÉS */}
        {activeTab === 'entretiens' && (
          <View style={styles.tabContentList}>
            {candidateInterviews.map((item, idx) => (
              <View key={item.id ? `int-${item.id}` : `int-${idx}`} style={styles.webJobCard}>
                <View style={styles.webJobCardHeader}>
                  <Text style={styles.webJobCardTitle}>{item.offreTitre}</Text>
                  <View style={[styles.webStatusPill, styles.webStatusPillInterview]}>
                    <Text style={[styles.webStatusPillText, styles.webStatusPillTextInterview]}>
                      Planifié
                    </Text>
                  </View>
                </View>

                <Text style={styles.webJobCardCompany}>{item.nomEntreprise}</Text>
                <Text style={styles.webJobCardDate}>
                  Date de l'entretien : {formatDate(item.dateEntretien)}
                </Text>

                {item.notes ? (
                  <Text style={styles.interviewNoteText}>{item.notes}</Text>
                ) : null}

                <TouchableOpacity
                  style={[styles.webPassTestBtn, { backgroundColor: '#0284C7' }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    Alert.alert(
                      'Visioconférence Entretien',
                      `Lien de connexion direct :\n${item.lienVisio || 'https://meet.talentflow.io/interview-789'}`
                    );
                  }}
                >
                  <MaterialCommunityIcons name="video" size={18} color="#FFFFFF" />
                  <Text style={styles.webPassTestBtnText}>Rejoindre la visio</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* CONTENU ONGLET 3 : FAVORIS */}
        {activeTab === 'favoris' && (
          <View style={styles.tabContentList}>
            {candidateFavorites.map((job, idx) => (
              <JobCard
                key={job.id ? `fav-${job.id}` : `fav-${idx}`}
                job={job}
                isFavorite={true}
                onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
                onApply={() => navigation.navigate('ApplyModal', { job })}
              />
            ))}
          </View>
        )}

        {/* CONTENU ONGLET 4 : TESTS TECHNIQUES & SCORES */}
        {activeTab === 'tests' && (
          <View style={styles.tabContentList}>
            {candidateTests.map((t, idx) => (
              <View key={t.id ? `t-${t.id}` : `t-${idx}`} style={styles.webJobCard}>
                <View style={styles.webJobCardHeader}>
                  <Text style={styles.webJobCardTitle} numberOfLines={2}>
                    {t.titre}
                  </Text>
                  <View
                    style={[
                      styles.webStatusPill,
                      t.reussi ? styles.webStatusPillAccepted : styles.webStatusPillRefused,
                    ]}
                  >
                    <Text
                      style={[
                        styles.webStatusPillText,
                        t.reussi ? styles.webStatusPillTextAccepted : styles.webStatusPillTextRefused,
                      ]}
                    >
                      {t.score}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.webJobCardCompany}>{t.nomEntreprise}</Text>
                <Text style={styles.webJobCardDate}>Validé le {formatDate(t.datePassage)}</Text>

                <TouchableOpacity
                  style={[styles.webPassTestBtn, { backgroundColor: '#4F46E5' }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('TakeTest', {
                      jobId: 1,
                      testId: t.id || 1,
                    })
                  }
                >
                  <MaterialCommunityIcons name="reload" size={17} color="#FFFFFF" />
                  <Text style={styles.webPassTestBtnText}>Repasser l'évaluation</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Accès direct Profil & CV */}
        <TouchableOpacity
          style={styles.profileEditRow}
          onPress={() => navigation.navigate('CandidateProfile')}
        >
          <MaterialCommunityIcons name="account-edit-outline" size={20} color={COLORS.primary} />
          <Text style={styles.profileEditText}>Modifier mon profil complet & compétences</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // 3. ENTREPRISE CONNECTÉE
  const companyInitial = (user.nom || 'E').charAt(0).toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* En-tête profil Entreprise */}
      <View style={styles.userHeaderCard}>
        <View style={[styles.avatarBox, { overflow: 'hidden', backgroundColor: '#F8FAFC' }]}>
          <Image
            source={getCompanyLogoAsset(user?.entrepriseId || user?.id || 1)}
            style={styles.avatarCompanyImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userHeaderInfo}>
          <Text style={styles.userName}>{user.nom || 'Entreprise'}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadgeCompany}>
            <Text style={styles.roleBadgeCompanyText}>Espace Entreprise / Recruteur</Text>
          </View>
        </View>
      </View>

      {/* Statistiques Entreprise */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{companyStats.jobs}</Text>
          <Text style={styles.statLabel}>Offres Publiées</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{companyStats.applications}</Text>
          <Text style={styles.statLabel}>Candidatures</Text>
        </View>
      </View>

      {/* Menu Navigation Entreprise */}
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CompanyDashboard')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#E8F0FE' }]}>
            <MaterialCommunityIcons name="view-dashboard-outline" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.menuText}>Tableau de bord & KPIs</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CompanyJobs')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="briefcase-outline" size={20} color="#059669" />
          </View>
          <Text style={styles.menuText}>Mes Offres d'Emploi</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CreateJob')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#7C3AED" />
          </View>
          <Text style={styles.menuText}>Publier une Nouvelle Offre</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('AITestChatbot')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="robot" size={20} color="#4F46E5" />
          </View>
          <Text style={styles.menuText}>Générateur Tests QCM (Agent IA)</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CompanyApplications')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="account-multiple-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.menuText}>Candidatures Reçues</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Interviews')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color="#0284C7" />
          </View>
          <Text style={styles.menuText}>Entretiens Planifiés</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CompanyProfile')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#F1F5F9' }]}>
            <MaterialCommunityIcons name="domain" size={20} color="#475569" />
          </View>
          <Text style={styles.menuText}>Fiche Entreprise</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Déconnexion */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
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
  authHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  authHeroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.secondary,
    marginBottom: 8,
  },
  authHeroSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  authButtonsRow: {
    width: '100%',
    gap: 10,
  },
  loginPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  loginPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  registerOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFF',
  },
  registerOutlineBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sectionHeaderSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  demoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  demoIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  demoActionInfo: {
    flex: 1,
  },
  demoActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  demoActionDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configToggleText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  configBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  configHelpText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  configInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.secondary,
    marginBottom: 10,
  },
  configSaveBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  configSaveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  userHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  avatarCompanyImage: {
    width: 44,
    height: 44,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userHeaderInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleBadgeCandidate: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  roleBadgeCandidateText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  roleBadgeCompany: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
  },
  roleBadgeCompanyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  // Nouveaux styles Espace CANDIDAT (Miroir exact du web)
  candidateTopRow: {
    marginBottom: 10,
    marginTop: 4,
  },
  candidatePageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: -0.2,
  },
  candidateProfileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  candidateAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1967D2',
  },
  candidateInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  candidateFullName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  candidateTitreRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1967D2',
    marginTop: 1,
  },
  candidateEmailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  candidateLogoutIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  candidateTabsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 4,
    marginBottom: 14,
  },
  candidateTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  candidateTabActive: {},
  candidateTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 3,
  },
  candidateTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  candidateTabIndicator: {
    position: 'absolute',
    bottom: -4,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  tabContentList: {
    marginBottom: 14,
  },
  webJobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  webJobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  webJobCardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginRight: 8,
  },
  webStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  webStatusPillAccepted: {
    backgroundColor: '#DCFCE7',
  },
  webStatusPillInterview: {
    backgroundColor: '#EDE9FE',
  },
  webStatusPillRefused: {
    backgroundColor: '#FEE2E2',
  },
  webStatusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  webStatusPillTextAccepted: {
    color: '#16A34A',
  },
  webStatusPillTextInterview: {
    color: '#7C3AED',
  },
  webStatusPillTextRefused: {
    color: '#DC2626',
  },
  webJobCardCompany: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  webJobCardDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 14,
  },
  webPassTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1967D2',
    height: 44,
    borderRadius: 10,
    gap: 8,
  },
  webPassTestBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  interviewNoteText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  profileEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    marginBottom: 16,
  },
  profileEditText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 10,
  },
});

export default AccountScreen;
