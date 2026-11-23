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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import jobService from '../services/jobService';
import api from '../services/api';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';

export const HomeScreen = ({ navigation }) => {
  const { user, isCandidate, isCompany } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
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

      if (jobsData.status === 'fulfilled') {
        const content = jobsData.value?.content || [];
        setFeaturedJobs(content);
        if (jobsData.value?.totalElements) {
          setStats((prev) => ({ ...prev, activeOffers: jobsData.value.totalElements }));
        }
      }

      if (compData.status === 'fulfilled') {
        const list = compData.value?.data || [];
        setCompanies(list);
        if (list.length > 0) {
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
          featuredJobs.slice(0, 4).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => navigation.navigate('JobDetail', { jobId: job.id })}
            />
          ))
        )}
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
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.companiesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.companyCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('CompaniesTab')}
              >
                <View style={styles.companyLogoPlaceholder}>
                  <Text style={styles.companyLogoLetter}>
                    {(item.nomEntreprise || 'E').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.companyNameText} numberOfLines={1}>
                  {item.nomEntreprise}
                </Text>
                <Text style={styles.companySectorText} numberOfLines={1}>
                  {item.secteur || 'Technologie'}
                </Text>
                <View style={styles.companyBadge}>
                  <Text style={styles.companyBadgeText}>
                    {item.nombreOffresActives || 1} offre(s)
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
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  companyLogoLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#7c3aed',
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
});

export default HomeScreen;
