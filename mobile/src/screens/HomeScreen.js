import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { SEED_JOBS, SEED_COMPANIES } from '../utils/seedData';
import jobService from '../services/jobService';
import applicationService from '../services/applicationService';
import api from '../services/api';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';
import { BANNER_IMAGE, getCompanyLogoAsset } from '../utils/assets';

export const HomeScreen = ({ navigation }) => {
  const { user, isCandidate } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState(SEED_JOBS);
  const [companies, setCompanies] = useState(SEED_COMPANIES);
  const [appliedOfferIds, setAppliedOfferIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    activeOffers: 6,
    totalCompanies: 3,
    totalCandidates: 3,
  });

  const loadData = useCallback(async () => {
    try {
      const [jobsData, compData, statsData] = await Promise.allSettled([
        jobService.getJobs({ size: 6 }),
        api.get('/api/entreprises'),
        api.get('/api/stats/public'),
      ]);

      if (jobsData.status === 'fulfilled' && jobsData.value?.content?.length > 0) {
        setFeaturedJobs(jobsData.value.content);
        if (jobsData.value?.totalElements) {
          setStats((prev) => ({ ...prev, activeOffers: jobsData.value.totalElements }));
        }
      }

      if (compData.status === 'fulfilled') {
        const raw = compData.value?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.content)
          ? raw.content
          : [];
        if (list.length > 0) {
          setCompanies(list.filter(Boolean));
          setStats((prev) => ({ ...prev, totalCompanies: list.length }));
        }
      }

      if (statsData.status === 'fulfilled' && statsData.value?.data) {
        setStats((prev) => ({ ...prev, ...statsData.value.data }));
      }
    } catch (err) {
      console.log('Erreur chargement landing mobile:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (user && isCandidate) {
      applicationService
        .getMyApplications()
        .then((apps) => {
          const ids = new Set((apps || []).map((a) => a.offreId));
          setAppliedOfferIds(ids);
        })
        .catch(() => {});
    } else {
      setAppliedOfferIds(new Set());
    }
  }, [user, isCandidate]);

  const handleApplyToJob = (job) => {
    if (!user) {
      Alert.alert(
        'Connexion requise',
        'Veuillez vous connecter en tant que candidat pour postuler à cette offre d’emploi.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    if (!isCandidate) {
      Alert.alert(
        'Accès Candidat Requis',
        'Seuls les candidats peuvent postuler aux offres d’emploi. Votre profil actuel est un profil entreprise.'
      );
      return;
    }
    navigation.navigate('ApplyModal', { job });
  };

  const categories = [
    { name: 'Ingénierie & Tech', icon: 'code-tags', sub: 'Java, Spring, React, DevOps' },
    { name: 'Data & IA', icon: 'database', sub: 'Machine Learning, SQL, Big Data' },
    { name: 'Design & Produit', icon: 'palette-outline', sub: 'UI/UX, Product Design' },
    { name: 'Cybersécurité', icon: 'shield-check-outline', sub: 'Sécurité Cloud, Audit' },
    { name: 'Finance & Fintech', icon: 'cash-multiple', sub: 'Fintech, Risques, Audit' },
    { name: 'Gestion de Projet', icon: 'rocket-launch-outline', sub: 'Scrum, Product Owner' },
  ];

  const handleSearchSubmit = () => {
    navigation.navigate('JobsTab', {
      initialKeyword: keyword.trim(),
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadData();
          }}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Hero Banner Superio / JobFlow */}
      <View style={styles.heroBanner}>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.livePillText}>Plateforme Recrutement & Carrières 3D</Text>
        </View>

        <Text style={styles.heroTitle}>
          Trouvez l’Emploi Idéal & Propulsez Votre Carrière
        </Text>

        <View style={styles.offersBadgeRow}>
          <Text style={styles.offersCountNumber}>{stats.activeOffers || 6}</Text>
          <Text style={styles.offersCountLabel}>
            offres d’emploi vérifiées prêtes pour vous
          </Text>
        </View>

        <Text style={styles.heroDescription}>
          Découvrez les opportunités des meilleures entreprises, postulez en quelques clics et suivez vos recrutements en direct.
        </Text>

        {/* Barre de recherche intégrée */}
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.primary} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearchSubmit}
            placeholder="Titre du poste, compétence, entreprise..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearchSubmit}>
            <Text style={styles.searchBtnText}>Rechercher</Text>
          </TouchableOpacity>
        </View>

        {/* Illustration bannière (même image que le web) */}
        <Image source={BANNER_IMAGE} style={styles.heroBannerImage} resizeMode="cover" />
      </View>

      {/* Cartes KPI Chiffres Clés */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{stats.activeOffers || 6}</Text>
          <Text style={styles.kpiLabel}>Offres Actives</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{stats.totalCompanies || 3}</Text>
          <Text style={styles.kpiLabel}>Entreprises</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{stats.totalCandidates || 3}</Text>
          <Text style={styles.kpiLabel}>Candidats</Text>
        </View>
      </View>

      {/* Catégories Populaires */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catégories populaires</Text>
        <Text style={styles.sectionSubtitle}>Explorez les métiers qui recrutent actuellement</Text>

        <View style={styles.categoriesGrid}>
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate('JobsTab', {
                  initialCategory: cat.name,
                });
              }}
            >
              <View style={styles.categoryIconCircle}>
                <MaterialCommunityIcons name={cat.icon} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categorySub} numberOfLines={1}>{cat.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Offres à la une */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Offres d’emploi à la une</Text>
            <Text style={styles.sectionSubtitle}>Dernières opportunités vérifiées</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('JobsTab')}>
            <Text style={styles.seeAllLink}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : (
          featuredJobs.slice(0, 6).map((job, index) => (
            <JobCard
              key={job?.id ? `job-${job.id}` : `job-${index}`}
              job={job}
              hasApplied={appliedOfferIds.has(job.id)}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
              onApply={() => handleApplyToJob(job)}
            />
          ))
        )}
      </View>

      {/* Comment ça marche - Superio 3 Étapes */}
      <View style={styles.workSection}>
        <Text style={styles.workSectionTitle}>Comment fonctionne JobFlow ?</Text>
        <Text style={styles.workSectionSub}>Un parcours fluide pour propulser votre carrière</Text>

        <View style={styles.workStepCard}>
          <View style={[styles.workStepIconBox, { backgroundColor: '#E8F0FE' }]}>
            <MaterialCommunityIcons name="account-plus-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={styles.workStepContent}>
            <Text style={styles.workStepName}>1. Créez votre profil & déposez votre CV</Text>
            <Text style={styles.workStepDesc}>
              Renseignez vos compétences, téléchargez votre CV et définissez vos critères.
            </Text>
          </View>
        </View>

        <View style={styles.workStepCard}>
          <View style={[styles.workStepIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="send" size={22} color="#059669" />
          </View>
          <View style={styles.workStepContent}>
            <Text style={styles.workStepName}>2. Postulez en 1 clic aux offres</Text>
            <Text style={styles.workStepDesc}>
              Parcourez les offres vérifiées et envoyez votre candidature instantanément.
            </Text>
          </View>
        </View>

        <View style={styles.workStepCard}>
          <View style={[styles.workStepIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="#D97706" />
          </View>
          <View style={styles.workStepContent}>
            <Text style={styles.workStepName}>3. Passez vos tests & entretiens</Text>
            <Text style={styles.workStepDesc}>
              Validez vos compétences avec les QCM techniques et rencontrez les recruteurs.
            </Text>
          </View>
        </View>
      </View>

      {/* Top Entreprises qui recrutent */}
      {companies.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Top Entreprises</Text>
              <Text style={styles.sectionSubtitle}>Rejoignez des équipes innovantes</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('CompaniesTab')}>
              <Text style={styles.seeAllLink}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={companies}
            keyExtractor={(item, index) =>
              item?.id !== undefined && item?.id !== null
                ? String(item.id)
                : `company-${index}`
            }
            contentContainerStyle={styles.companiesList}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                key={item?.id ? `comp-${item.id}` : `comp-${index}`}
                style={styles.companyCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CompaniesTab')}
              >
                <View style={styles.companyLogoPlaceholder}>
                  <Image
                    source={getCompanyLogoAsset(item?.id)}
                    style={styles.companyLogoImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {item?.nomEntreprise || 'Entreprise Partenaire'}
                </Text>
                <Text style={styles.companySectorText} numberOfLines={1}>
                  {item?.secteur || 'Technologie'}
                </Text>
                <View style={styles.companyBadge}>
                  <Text style={styles.companyBadgeText}>
                    {item?.nombreOffresActives || 1} offre(s)
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Bannière d'accès selon connexion */}
      <View style={styles.callToActionCard}>
        <MaterialCommunityIcons name="account-tie-voice" size={32} color="#ffffff" />
        <Text style={styles.ctaTitle}>
          {user ? `Connecté en tant que ${user.nom}` : 'Rejoignez JobFlow dès aujourd’hui'}
        </Text>
        <Text style={styles.ctaSubtitle}>
          {user
            ? `Accédez à votre espace ${isCandidate ? 'Candidat' : 'Entreprise'} pour gérer vos candidatures.`
            : 'Créez votre profil candidat ou publiez vos offres d’emploi en quelques secondes.'}
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => {
            if (user) {
              if (isCandidate) navigation.navigate('CandidateDashboard');
              else navigation.navigate('CompanyDashboard');
            } else {
              navigation.navigate('AuthScreen');
            }
          }}
        >
          <Text style={styles.ctaButtonText}>
            {user ? 'Accéder à mon espace' : 'Se connecter / S’inscrire'}
          </Text>
        </TouchableOpacity>
      </View>
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
  heroBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  livePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.secondary,
    lineHeight: 28,
  },
  offersBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  offersCountNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 6,
  },
  offersCountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4f46e5',
    flex: 1,
  },
  heroDescription: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroBannerImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginTop: 16,
  },
  kpiContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  categorySub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  companiesList: {
    gap: 12,
    paddingVertical: 4,
  },
  companyCard: {
    width: 140,
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  companyLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  companyLogoImage: {
    width: 40,
    height: 40,
  },
  companyNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  companySectorText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  companyBadge: {
    marginTop: 8,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  companyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  callToActionCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  ctaSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  workSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  workSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.secondary,
    textAlign: 'center',
  },
  workSectionSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  workStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  workStepIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workStepContent: {
    flex: 1,
  },
  workStepName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  workStepDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
});

export default HomeScreen;
