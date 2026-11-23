import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';

export const ApplicationCard = ({
  application,
  onPress,
  onTakeTest,
  isRecruiterView = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => onPress && onPress(application)}
    >
      <View style={styles.topRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title} numberOfLines={1}>
            {isRecruiterView ? application.candidatNom : application.offreTitre}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {isRecruiterView
              ? `Pour : ${application.offreTitre}`
              : application.nomEntreprise}
          </Text>
        </View>
        <StatusBadge status={application.statut} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar" size={14} color={COLORS.textMuted} />
          <Text style={styles.metaText}>
            Postulé le {formatDate(application.dateCandidature)}
          </Text>
        </View>

        {application.scoreMatching !== undefined && application.scoreMatching !== null && (
          <View style={styles.scoreBadge}>
            <MaterialCommunityIcons name="star-outline" size={14} color="#059669" />
            <Text style={styles.scoreText}>Matching {application.scoreMatching}%</Text>
          </View>
        )}
      </View>

      {application.lettreMotivation ? (
        <View style={styles.letterPreview}>
          <Text style={styles.letterText} numberOfLines={2}>
            "{application.lettreMotivation}"
          </Text>
        </View>
      ) : null}

      {application.noteRecruteur ? (
        <View style={styles.recruiterNote}>
          <Text style={styles.noteTitle}>Note recruteur :</Text>
          <Text style={styles.noteText}>{application.noteRecruteur}</Text>
        </View>
      ) : null}

      {!isRecruiterView && onTakeTest && (
        <TouchableOpacity
          style={styles.takeTestBtn}
          activeOpacity={0.8}
          onPress={() => onTakeTest(application)}
        >
          <MaterialCommunityIcons name="certificate-outline" size={16} color="#4F46E5" />
          <Text style={styles.takeTestBtnText}>Passer le Test Technique QCM</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#4F46E5" />
        </TouchableOpacity>
      )}
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 3,
  },
  letterPreview: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  letterText: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
  },
  recruiterNote: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#fef3c7',
    borderRadius: 8,
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  noteText: {
    fontSize: 12,
    color: '#b45309',
  },
  takeTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  takeTestBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    flex: 1,
    marginLeft: 8,
  },
});

export default ApplicationCard;
