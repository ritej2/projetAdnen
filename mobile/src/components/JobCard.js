import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatSalary, formatDate } from '../utils/formatters';

export const JobCard = ({ job, onPress, isFavorite, onToggleFavorite }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => onPress && onPress(job)}
    >
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>
              {(job.nomEntreprise || 'E').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName} numberOfLines={1}>
              {job.nomEntreprise || 'Entreprise partenaire'}
            </Text>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job.titre}
            </Text>
          </View>
        </View>

        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.favButton}
            onPress={() => onToggleFavorite(job.id, isFavorite)}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? COLORS.danger : COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <MaterialCommunityIcons name="briefcase-outline" size={14} color={COLORS.primary} />
          <Text style={styles.tagText}>{job.typeContrat || 'CDI'}</Text>
        </View>

        <View style={styles.tag}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.primary} />
          <Text style={styles.tagText} numberOfLines={1}>{job.localisation || 'France'}</Text>
        </View>

        {job.modeTravail && (
          <View style={styles.tag}>
            <MaterialCommunityIcons name="laptop" size={14} color={COLORS.primary} />
            <Text style={styles.tagText}>{job.modeTravail}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.salaryText}>
          {formatSalary(job.salaire, job.salaireMax)}
        </Text>
        <Text style={styles.dateText}>
          Publiée le {formatDate(job.datePublication)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  companyName: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  favButton: {
    padding: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default JobCard;
