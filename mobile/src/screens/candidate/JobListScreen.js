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
import { COLORS, CONTRACT_TYPES } from '../../utils/constants';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/EmptyState';
import jobService from '../../services/jobService';
import favoriteService from '../../services/favoriteService';

export const JobListScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [selectedContract, setSelectedContract] = useState('');

  const loadJobs = useCallback(async () => {
    try {
      const data = await jobService.getJobs({
        keyword: keyword.trim() || undefined,
        typeContrat: selectedContract || undefined,
      });
      setJobs(data.content || []);
    } catch (err) {
      console.log('Erreur chargement offres:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, selectedContract]);

  const loadFavorites = async () => {
    try {
      const favList = await favoriteService.getFavorites();
      const favIds = new Set(favList.map((f) => f.offre.id));
      setFavorites(favIds);
    } catch {}
  };

  useEffect(() => {
    setLoading(true);
    loadJobs();
    loadFavorites();
  }, [loadJobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
    loadFavorites();
  };

  const handleToggleFavorite = async (jobId, isFav) => {
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
    } catch (err) {
      Alert.alert('Info', 'Action non disponible en mode hors-ligne');
    }
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
          keyExtractor={(item) => item}
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          renderItem={({ item }) => (
            <JobCard
              job={item}
              isFavorite={favorites.has(item.id)}
              onToggleFavorite={handleToggleFavorite}
              onPress={(job) => navigation.navigate('JobDetail', { jobId: job.id })}
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
