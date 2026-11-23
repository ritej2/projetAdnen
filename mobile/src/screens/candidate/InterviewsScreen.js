import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';
import EmptyState from '../../components/EmptyState';
import interviewService from '../../services/interviewService';

export const InterviewsScreen = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInterviews = useCallback(async () => {
    try {
      const data = await interviewService.getMyInterviews();
      setInterviews(data || []);
    } catch (err) {
      console.log('Erreur chargement entretiens:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInterviews();
  }, [loadInterviews]);

  const handleOpenLink = (url) => {
    if (!url) return;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Lien d’entretien', url);
      }
    });
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement de vos entretiens...</Text>
        </View>
      ) : (
        <FlatList
          data={interviews}
          keyExtractor={(item, index) => (item?.id ? String(item.id) : `interview-${index}`)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadInterviews();
              }}
              colors={[COLORS.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobTitle}>{item.offreTitre}</Text>
                  <Text style={styles.companyName}>{item.nomEntreprise}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{item.statut || 'PLANIFIE'}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>{formatDateTime(item.dateEntretien)}</Text>
              </View>

              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="video-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>{item.typeEntretien || 'Visioconférence'}</Text>
              </View>

              {item.commentaire ? (
                <View style={styles.commentBox}>
                  <Text style={styles.commentLabel}>Note du recruteur :</Text>
                  <Text style={styles.commentText}>{item.commentaire}</Text>
                </View>
              ) : null}

              {item.lienOuLieu ? (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => handleOpenLink(item.lienOuLieu)}
                >
                  <MaterialCommunityIcons name="link-variant" size={18} color="#ffffff" />
                  <Text style={styles.joinBtnText}>Rejoindre l'entretien</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-blank-outline"
              title="Aucun entretien planifié"
              description="Dès qu'une entreprise planifie un entretien avec vous, il apparaîtra ici."
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
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  companyName: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#ede9fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    fontWeight: '500',
  },
  commentBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 12,
  },
  commentLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  joinBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default InterviewsScreen;
