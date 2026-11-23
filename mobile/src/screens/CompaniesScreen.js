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
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import api from '../services/api';

export const CompaniesScreen = ({ navigation }) => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get('/api/entreprises');
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.content)
        ? raw.content
        : [];
      setCompanies(list.filter(Boolean));
    } catch (err) {
      console.log('Erreur chargement entreprises:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const filteredCompanies = companies.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.nomEntreprise || '').toLowerCase().includes(q) ||
      (c.secteur || '').toLowerCase().includes(q) ||
      (c.adresse || '').toLowerCase().includes(q)
    );
  });

  const openWebsite = (url) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl).catch(() => {});
  };

  const renderCompanyCard = ({ item }) => {
    const initial = (item.nomEntreprise || 'E').charAt(0).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.companyName} numberOfLines={1}>
              {item.nomEntreprise || 'Entreprise Partenaire'}
            </Text>
            {item.secteur ? (
              <View style={styles.sectorBadge}>
                <Text style={styles.sectorText}>{item.secteur}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.detailsRow}>
          {item.adresse ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.adresse}
              </Text>
            </View>
          ) : null}
          {item.telephone ? (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="phone-outline" size={16} color={COLORS.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {item.telephone}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          {item.siteWeb ? (
            <TouchableOpacity
              style={styles.websiteBtn}
              onPress={() => openWebsite(item.siteWeb)}
            >
              <MaterialCommunityIcons name="web" size={16} color={COLORS.primary} />
              <Text style={styles.websiteBtnText}>Site Web</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            style={styles.viewJobsBtn}
            onPress={() => {
              navigation.navigate('JobsTab', {
                screen: 'JobsList',
                params: { initialKeyword: item.nomEntreprise },
              });
            }}
          >
            <Text style={styles.viewJobsBtnText}>Voir les offres</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Search Area */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color={COLORS.primary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par nom, secteur, ville..."
            placeholderTextColor={COLORS.textMuted}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            <Text style={styles.statsBold}>{filteredCompanies.length}</Text> entreprise(s) partenaire(s)
          </Text>
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des entreprises...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCompanies}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `company-${index}`)}
          renderItem={renderCompanyCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchCompanies();
              }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="domain-off" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Aucune entreprise trouvée</Text>
              <Text style={styles.emptySub}>
                Essayez d'ajuster vos critères de recherche.
              </Text>
            </View>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
    marginLeft: 8,
  },
  statsRow: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statsBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  sectorBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  sectorText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  websiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: '#F5F7FC',
  },
  websiteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  viewJobsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  viewJobsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default CompaniesScreen;
