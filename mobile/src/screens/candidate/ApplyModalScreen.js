import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../utils/constants';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import applicationService from '../../services/applicationService';
import { useAuth } from '../../context/AuthContext';

export const ApplyModalScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const { candidat } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async () => {
    setSubmitting(true);
    try {
      await applicationService.applyToJob({
        offreId: job.id,
        lettreMotivation: motivation.trim() || undefined,
        cvUrlSpecifique: candidat?.cvUrl || undefined,
      });

      Alert.alert(
        'Candidature envoyée !',
        `Votre candidature pour le poste « ${job.titre} » a bien été transmise à ${job.nomEntreprise}.`,
        [
          {
            text: 'Voir mes candidatures',
            onPress: () => {
              navigation.popToTop();
              navigation.navigate('ApplicationsTab');
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert(
        'Erreur',
        err?.friendlyMessage || err?.message || 'Impossible d’envoyer votre candidature.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.summaryCard}>
          <Text style={styles.applyingTo}>Postuler pour</Text>
          <Text style={styles.jobTitle}>{job.titre}</Text>
          <Text style={styles.companyName}>{job.nomEntreprise}</Text>
        </View>

        <View style={styles.cvCard}>
          <MaterialCommunityIcons name="file-pdf-box" size={32} color="#dc2626" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cvTitle}>CV du Profil Candidat</Text>
            <Text style={styles.cvSubtitle}>
              {candidat?.cvUrl ? 'CV joint automatiquement' : 'Aucun CV enregistré sur votre profil'}
            </Text>
          </View>
        </View>

        <CustomInput
          label="Lettre de motivation ou mot d'accompagnement"
          value={motivation}
          onChangeText={setMotivation}
          placeholder="Expliquez brièvement pourquoi ce poste correspond à vos compétences et à vos aspirations..."
          multiline
          numberOfLines={6}
        />

        <CustomButton
          title="Confirmer et envoyer ma candidature"
          onPress={handleApply}
          loading={submitting}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  applyingTo: {
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
    marginTop: 4,
  },
  companyName: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  cvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  cvTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
  },
  cvSubtitle: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 2,
  },
  btn: {
    marginTop: 10,
  },
});

export default ApplyModalScreen;
