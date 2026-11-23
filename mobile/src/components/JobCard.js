import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { formatSalary, formatDate } from '../utils/formatters';
import { getCompanyLogoAsset } from '../utils/assets';

export const JobCard = ({
  job,
  onPress,
  isFavorite,
  onToggleFavorite,
  hasApplied = false,
  onApply,
}) => {
  const companyLogo = getCompanyLogoAsset(job?.entrepriseId || job?.id);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={() => onPress && onPress(job)}
    >
      {/* Header : Logo + Nom Entreprise + Titre + Bouton Favori */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <View style={styles.logoPlaceholder}>
            <Image source={companyLogo} style={styles.logoImage} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.companyName} numberOfLines={1}>
              {job?.nomEntreprise || 'Entreprise Partenaire'}
            </Text>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {job?.titre || 'Offre d’emploi'}
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

      {/* Badges d'information Superio */}
      <View style={styles.tagsRow}>
        <View style={styles.tag}>
          <MaterialCommunityIcons name="briefcase-outline" size={14} color={COLORS.primary} />
          <Text style={styles.tagText}>{job?.typeContrat || 'CDI'}</Text>
        </View>

        <View style={styles.tag}>
          <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.primary} />
          <Text style={styles.tagText} numberOfLines={1}>
            {job?.localisation || 'France'}
          </Text>
        </View>

        {job?.modeTravail ? (
          <View style={styles.tag}>
            <MaterialCommunityIcons name="laptop" size={14} color={COLORS.primary} />
            <Text style={styles.tagText}>{job.modeTravail}</Text>
          </View>
        ) : null}

        {job?.categorie ? (
          <View style={[styles.tag, styles.categoryTag]}>
            <Text style={styles.categoryTagText} numberOfLines={1}>
              {job.categorie}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer : Salaire + Date + BOUTON POSTULER */}
      <View style={styles.footer}>
        <View style={styles.salaryCol}>
          <Text style={styles.salaryText}>
            {formatSalary(job?.salaire, job?.salaireMax)}
          </Text>
          <Text style={styles.dateText}>
            Publiée le {formatDate(job?.datePublication)}
          </Text>
        </View>

        {/* Action Postuler ou Statut Déjà Postulé */}
        <View style={styles.actionCol}>
          {hasApplied ? (
            <View style={styles.appliedBadge}>
              <MaterialCommunityIcons name="check-circle" size={15} color="#059669" />
              <Text style={styles.appliedBadgeText}>Déjà postulé</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.applyBtn}
              activeOpacity={0.8}
              onPress={() => (onApply ? onApply(job) : onPress && onPress(job))}
            >
              <MaterialCommunityIcons name="send" size={13} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>Postuler</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  companyName: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.secondary,
    lineHeight: 20,
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  categoryTag: {
    backgroundColor: '#EBF4FE',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  salaryCol: {
    flex: 1,
  },
  salaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  actionCol: {
    marginLeft: 10,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});

export default JobCard;
