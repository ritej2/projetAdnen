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

export const AccountScreen = ({ navigation }) => {
  const { user, isCandidate, isCompany, logout, loginDemo, isLoading } = useAuth();
  const [candidateStats, setCandidateStats] = useState({ applications: 0, interviews: 0 });
  const [companyStats, setCompanyStats] = useState({ jobs: 0, applications: 0 });
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [hostInput, setHostInput] = useState(api.defaults.baseURL || '');

  useEffect(() => {
    if (user && isCandidate) {
      Promise.allSettled([
        applicationService.getMyApplications(),
        interviewService.getMyInterviews(),
      ]).then(([appsRes, intsRes]) => {
        setCandidateStats({
          applications: appsRes.status === 'fulfilled' ? (appsRes.value || []).length : 0,
          interviews: intsRes.status === 'fulfilled' ? (intsRes.value || []).length : 0,
        });
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
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons name="account-circle-outline" size={44} color={COLORS.primary} />
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

  // 2. CANDIDAT CONNECTÉ
  if (isCandidate) {
    const initial = (user.nom || 'C').charAt(0).toUpperCase();

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* En-tête profil */}
        <View style={styles.userHeaderCard}>
          <View style={[styles.avatarBox, { overflow: 'hidden' }]}>
            <Image
              source={getCandidateAvatarAsset(user?.id || 1)}
              style={styles.avatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.userHeaderInfo}>
            <Text style={styles.userName}>{user.nom || 'Candidat'}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadgeCandidate}>
              <Text style={styles.roleBadgeCandidateText}>Espace Candidat</Text>
            </View>
          </View>
        </View>

        {/* Statistiques Candidat */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{candidateStats.applications}</Text>
            <Text style={styles.statLabel}>Candidatures</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{candidateStats.interviews}</Text>
            <Text style={styles.statLabel}>Entretiens</Text>
          </View>
        </View>

        {/* Menu Navigation Candidat */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('MyApplications')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E8F0FE' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.menuText}>Mes Candidatures</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Interviews')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#0284C7" />
            </View>
            <Text style={styles.menuText}>Mes Entretiens Planifiés</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('CandidateProfile')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="account-edit-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.menuText}>Mon Profil & CV</Text>
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
});

export default AccountScreen;
