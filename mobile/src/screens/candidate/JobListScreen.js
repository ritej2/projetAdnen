import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CONTRACT_TYPES, JOB_CATEGORIES } from '../../utils/constants';
import { SEED_JOBS } from '../../utils/seedData';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';
import jobService from '../../services/jobService';
import favoriteService from '../../services/favoriteService';
import applicationService from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

export const JobListScreen = ({ route, navigation }) => {
  const { user, isCandidate } = useAuth();
  const [jobs, setJobs] = useState(SEED_JOBS);
  const [favorites, setFavorites] = useState(new Set());
  const [appliedOfferIds, setAppliedOfferIds] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState(route?.params?.initialKeyword || '');
  const [selectedContract, setSelectedContract] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route?.params?.initialCategory || '');

  useEffect(() => {
    if (route?.params?.initialKeyword !== undefined) {
      setKeyword(route.params.initialKeyword);
    }
    if (route?.params?.initialCategory !== undefined) {
      setSelectedCategory(route.params.initialCategory);
    }
  }, [route?.params?.initialKeyword, route?.params?.initialCategory]);

  const loadJobs = useCallback(async () => {
    try {
      const data = await jobService.getJobs({
        keyword: keyword.trim() || undefined,
        typeContrat: selectedContract || undefined,
        categorie: selectedCategory || undefined,
      });
      if (data?.content && data.content.length > 0) {
        setJobs(data.content);
      } else {
        const filtered = SEED_JOBS.filter((j) => {
          const matchKw =
            !keyword.trim() ||
            j.titre.toLowerCase().includes(keyword.trim().toLowerCase()) ||
            j.nomEntreprise.toLowerCase().includes(keyword.trim().toLowerCase());
          const matchContrat = !selectedContract || j.typeContrat === selectedContract;
          const matchCat =
            !selectedCategory ||
            (j.categorie || '').toLowerCase().includes(selectedCategory.toLowerCase());
          return matchKw && matchContrat && matchCat;
        });
        setJobs(filtered);
      }
    } catch (err) {
      console.log('Chargement offres (seed):', err?.message);
      const filtered = SEED_JOBS.filter((j) => {
        const matchKw =
          !keyword.trim() ||
          j.titre.toLowerCase().includes(keyword.trim().toLowerCase()) ||
          j.nomEntreprise.toLowerCase().includes(keyword.trim().toLowerCase());
        const matchContrat = !selectedContract || j.typeContrat === selectedContract;
        const matchCat =
          !selectedCategory ||
          (j.categorie || '').toLowerCase().includes(selectedCategory.toLowerCase());
        return matchKw && matchContrat && matchCat;
      });
      setJobs(filtered);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, selectedContract, selectedCategory]);

  const loadFavorites = async () => {
    try {
      const favList = await favoriteService.getFavorites();
      const favIds = new Set(favList.map((f) => f.offre.id));
      setFavorites(favIds);
    } catch {}
  };

  const loadApplied = async () => {
    if (user && isCandidate) {
      try {
        const apps = await applicationService.getMyApplications();
        const ids = new Set((apps || []).map((a) => a.offreId));
        setAppliedOfferIds(ids);
      } catch {}
    } else {
      setAppliedOfferIds(new Set());
    }
  };

  useEffect(() => {
    loadJobs();
    loadFavorites();
    loadApplied();
  }, [loadJobs, user, isCandidate]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
    loadFavorites();
    loadApplied();
  };

  const handleToggleFavorite = async (jobId, isFav) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour ajouter des offres en favoris.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }
    try {
      const updated = new Set(favorites);
      if (isFav) {
        await favoriteService.removeFavorite(jobId);
        updated.delete(jobId);
      } else {
        await favoriteService.addFavorite(jobId);
        updated.add(jobId);
      }
      setFavorites(updated);
    } catch {
      Alert.alert('Info', 'Action enregistrée');
    }
  };

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

  return (
    <View style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textMuted} />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={loadJobs}
            placeholder="Rechercher un poste, techno..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {keyword ? (
            <TouchableOpacity onPress={() => setKeyword('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filtres de contrats horizontaux */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Tous', ...CONTRACT_TYPES]}
          keyExtractor={(item, index) => (item ? String(item) : `contract-${index}`)}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = (item === 'Tous' && !selectedContract) || selectedContract === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedContract(item === 'Tous' ? '' : item)}
                style={[styles.filterChip, isSelected && styles.activeFilterChip]}
              >
                <Text style={[styles.filterText, isSelected && styles.activeFilterText]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Filtres de catégories horizontaux */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['Toutes catégories', ...JOB_CATEGORIES]}
          keyExtractor={(item, index) => (item ? String(item) : `cat-${index}`)}
          contentContainerStyle={[styles.filterList, { marginTop: 6 }]}
          renderItem={({ item }) => {
            const isSelected =
              (item === 'Toutes catégories' && !selectedCategory) || selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => setSelectedCategory(item === 'Toutes catégories' ? '' : item)}
                style={[
                  styles.filterChip,
                  { backgroundColor: '#F8FAFC' },
                  isSelected && { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isSelected && { color: '#7C3AED', fontWeight: '700' },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Liste des Offres */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Recherche des meilleures offres...</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `job-${index}`)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              isFavorite={favorites.has(item.id)}
              hasApplied={appliedOfferIds.has(item.id)}
              onToggleFavorite={handleToggleFavorite}
              onPress={(job) => navigation.navigate('JobDetail', { jobId: job.id })}
              onApply={(job) => handleApplyToJob(job)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="file-search-outline"
              title="Aucune offre trouvée"
              description="Essayez de modifier vos filtres ou effectuez une autre recherche."
              actionText="Réinitialiser les filtres"
              onAction={() => {
                setKeyword('');
                setSelectedContract('');
              }}
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
  searchHeader: {
    backgroundColor: COLORS.surface,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  filterList: {
    marginTop: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  activeFilterText: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
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
});

export default JobListScreen;
